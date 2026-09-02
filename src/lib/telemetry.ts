import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { withDb } from "@/server/db";
import { POWER_TIERS } from "@/lib/simulation";

/** Power bands used to compare behaviour across the tier ladder. */
export const BANDS = [
  { id: "low", label: "Little power", max: 2 },
  { id: "mid", label: "Some power", max: 5 },
  { id: "high", label: "Great power", max: POWER_TIERS.length - 1 },
] as const;

export type BandId = (typeof BANDS)[number]["id"];

const bandCase = `case when tier_index <= 2 then 'low' when tier_index <= 5 then 'mid' else 'high' end`;

const decisionInput = z.object({
  runId: z.string().uuid().nullable(),
  scenarioId: z.string().max(64),
  choiceId: z.string().max(64),
  kind: z.enum(["virtue", "vice"]),
  tierIndex: z.number().int().min(0).max(15),
  powerLevel: z.number().int().nonnegative(),
  influenceBefore: z.number().int(),
  stabilityBefore: z.number(),
  stabilityDelta: z.number(),
  livesAffected: z.number().int().nonnegative(),
});

/** Records one decision, opening a run row on the first call. Returns the run id. */
export const recordDecision = createServerFn({ method: "POST" })
  .inputValidator(decisionInput)
  .handler(async ({ data }) =>
    withDb(
      async (sql) => {
        let runId = data.runId;
        if (!runId) {
          const [run] = await sql<{ id: string }[]>`
          insert into runs default values returning id
        `;
          runId = run?.id ?? null;
        }
        if (!runId) return { runId: null };

        await sql`
        insert into decisions (
          run_id, scenario_id, choice_id, kind, tier_index, power_level,
          influence_before, stability_before, stability_delta, lives_affected
        ) values (
          ${runId}, ${data.scenarioId}, ${data.choiceId}, ${data.kind},
          ${data.tierIndex}, ${data.powerLevel}, ${data.influenceBefore},
          ${data.stabilityBefore}, ${data.stabilityDelta}, ${data.livesAffected}
        )
      `;
        return { runId };
      },
      { runId: data.runId },
    ),
  );

export type ScenarioConsensus = {
  total: number;
  choices: { choiceId: string; count: number }[];
  /** Virtue rate (0..1) within each power band, null where nobody has played yet. */
  bands: { band: BandId; total: number; virtueRate: number | null }[];
};

// POST, not GET: these aggregates change on every visitor decision, and a GET
// server fn is a plain cacheable URL — the browser HTTP cache will happily serve
// a stale count back, hiding the visitor's own choice from the totals.
/** How everyone else answered one specific situation. */
export const getScenarioConsensus = createServerFn({ method: "POST" })
  .inputValidator(z.object({ scenarioId: z.string().max(64) }))
  .handler(async ({ data }) =>
    withDb<ScenarioConsensus>(
      async (sql) => {
        const [choices, bands] = await Promise.all([
          sql<{ choice_id: string; count: string }[]>`
            select choice_id, count(*) as count
            from decisions where scenario_id = ${data.scenarioId}
            group by choice_id
          `,
          sql<{ band: BandId; total: string; virtues: string }[]>`
            select ${sql.unsafe(bandCase)} as band,
                   count(*) as total,
                   count(*) filter (where kind = 'virtue') as virtues
            from decisions where scenario_id = ${data.scenarioId}
            group by 1
          `,
        ]);

        const byBand = new Map(bands.map((b) => [b.band, b]));
        return {
          total: choices.reduce((sum, c) => sum + Number(c.count), 0),
          choices: choices.map((c) => ({ choiceId: c.choice_id, count: Number(c.count) })),
          bands: BANDS.map(({ id }) => {
            const row = byBand.get(id);
            const total = row ? Number(row.total) : 0;
            return {
              band: id,
              total,
              virtueRate: total > 0 ? Number(row!.virtues) / total : null,
            };
          }),
        };
      },
      {
        total: 0,
        choices: [],
        bands: BANDS.map(({ id }) => ({ band: id, total: 0, virtueRate: null })),
      },
    ),
  );

export type PowerCurvePoint = {
  tierIndex: number;
  total: number;
  virtueRate: number | null;
};

export type PowerCurve = {
  points: PowerCurvePoint[];
  /** Decisions recorded. Not visitors — one visitor contributes many. */
  total: number;
  /** Distinct runs behind those decisions, so the page can name both units. */
  runs: number;
  /**
   * The same decisions grouped into bands. The caption reads these rather than
   * the first and last bar: an eight-bar chart read end to end throws away
   * everything in between, and the middle of this one has been the lowest point
   * on the chart.
   */
  bands: { band: BandId; total: number; virtueRate: number | null }[];
};

/** Virtue rate per power tier across every decision ever recorded — the headline result. */
export const getPowerCurve = createServerFn({ method: "POST" }).handler(async () =>
  withDb<PowerCurve>(
    async (sql) => {
      const [rows, bands, [runs]] = await Promise.all([
        sql<{ tier_index: number; total: string; virtues: string }[]>`
          select tier_index, count(*) as total, count(*) filter (where kind = 'virtue') as virtues
          from decisions group by tier_index order by tier_index
        `,
        sql<{ band: BandId; total: string; virtues: string }[]>`
          select ${sql.unsafe(bandCase)} as band,
                 count(*) as total,
                 count(*) filter (where kind = 'virtue') as virtues
          from decisions group by 1
        `,
        sql<{ runs: string }[]>`select count(distinct run_id) as runs from decisions`,
      ]);
      const byTier = new Map(rows.map((r) => [Number(r.tier_index), r]));
      const byBand = new Map(bands.map((b) => [b.band, b]));
      return {
        total: rows.reduce((sum, r) => sum + Number(r.total), 0),
        runs: Number(runs?.runs ?? 0),
        points: POWER_TIERS.map((_, tierIndex) => {
          const row = byTier.get(tierIndex);
          const total = row ? Number(row.total) : 0;
          return {
            tierIndex,
            total,
            virtueRate: total > 0 ? Number(row!.virtues) / total : null,
          };
        }),
        bands: BANDS.map(({ id }) => {
          const row = byBand.get(id);
          const total = row ? Number(row.total) : 0;
          return { band: id, total, virtueRate: total > 0 ? Number(row!.virtues) / total : null };
        }),
      };
    },
    {
      points: [],
      total: 0,
      runs: 0,
      bands: BANDS.map(({ id }) => ({ band: id, total: 0, virtueRate: null })),
    },
  ),
);

export type BehaviourInsights = {
  /**
   * Virtue rate in the first few decisions of a run, split by whether that run
   * eventually reached the upper tiers. Answers: does how you start predict
   * whether you end up powerful?
   */
  earlyByOutcome: {
    group: "powerful" | "ordinary";
    runs: number;
    /** Decisions behind the rate — runs is the unit the comparison is judged on. */
    total: number;
    virtueRate: number | null;
  }[];
  /**
   * Virtue rate by the health of society at the moment of the decision. Answers:
   * do people behave better or worse once things are already falling apart?
   */
  bySocietyState: {
    state: "healthy" | "strained" | "failing";
    /** Decisions, not visitors. */
    total: number;
    runs: number;
    virtueRate: number | null;
  }[];
};

/** How many opening decisions of a run count as "how they started". */
export const EARLY_DECISIONS = 5;
const POWERFUL_TIER = 5;

/** Cross-run reads: the two questions a single decision cannot answer on its own. */
export const getBehaviourInsights = createServerFn({ method: "POST" }).handler(async () =>
  withDb<BehaviourInsights>(
    async (sql) => {
      const [early, states] = await Promise.all([
        sql<{ group: "powerful" | "ordinary"; runs: string; total: string; virtues: string }[]>`
          with run_peak as (
            select run_id, max(tier_index) as peak, count(*) as n
            from decisions group by run_id
          ),
          ranked as (
            select run_id, kind,
                   row_number() over (partition by run_id order by id) as rn
            from decisions
          )
          select case when p.peak >= ${POWERFUL_TIER} then 'powerful' else 'ordinary' end as group,
                 count(distinct r.run_id) as runs,
                 count(*) as total,
                 count(*) filter (where r.kind = 'virtue') as virtues
          from ranked r
          join run_peak p on p.run_id = r.run_id
          where r.rn <= ${EARLY_DECISIONS} and p.n >= ${EARLY_DECISIONS}
          group by 1
        `,
        sql<
          {
            state: "healthy" | "strained" | "failing";
            total: string;
            virtues: string;
            runs: string;
          }[]
        >`
          select case
                   when stability_before >= 65 then 'healthy'
                   when stability_before >= 35 then 'strained'
                   else 'failing'
                 end as state,
                 count(*) as total,
                 count(*) filter (where kind = 'virtue') as virtues,
                 count(distinct run_id) as runs
          from decisions group by 1
        `,
      ]);

      const earlyBy = new Map(early.map((r) => [r.group, r]));
      const stateBy = new Map(states.map((r) => [r.state, r]));

      return {
        earlyByOutcome: (["powerful", "ordinary"] as const).map((group) => {
          const row = earlyBy.get(group);
          const total = row ? Number(row.total) : 0;
          return {
            group,
            runs: row ? Number(row.runs) : 0,
            total,
            virtueRate: total > 0 ? Number(row!.virtues) / total : null,
          };
        }),
        bySocietyState: (["healthy", "strained", "failing"] as const).map((state) => {
          const row = stateBy.get(state);
          const total = row ? Number(row.total) : 0;
          return {
            state,
            total,
            runs: row ? Number(row.runs) : 0,
            virtueRate: total > 0 ? Number(row!.virtues) / total : null,
          };
        }),
      };
    },
    {
      earlyByOutcome: [],
      bySocietyState: [],
    },
  ),
);

const CSV_COLUMNS = [
  "id",
  "run_id",
  "created_at",
  "scenario_id",
  "choice_id",
  "kind",
  "tier_index",
  "power_level",
  "influence_before",
  "stability_before",
  "stability_delta",
  "lives_affected",
] as const;

/** Rows per export. Enough for an exhibition day, small enough to stay one response. */
const EXPORT_LIMIT = 50_000;

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/**
 * The whole decision log as CSV. Render's free instance has no durable disk and a
 * redeploy can take the database's contents with it, so the data collected on the
 * day needs a way off the server that does not involve a database client.
 *
 * Nothing here identifies a person: a run id is a random uuid minted on the first
 * decision, and no name, address or user agent is stored against it.
 */
export const getDecisionsCsv = createServerFn({ method: "POST" }).handler(async () =>
  withDb<{ csv: string; rows: number }>(
    async (sql) => {
      const rows = await sql<Record<string, unknown>[]>`
        select ${sql.unsafe(CSV_COLUMNS.join(", "))}
        from decisions order by id limit ${EXPORT_LIMIT}
      `;
      const body = rows.map((row) => CSV_COLUMNS.map((c) => csvCell(row[c])).join(","));
      return { csv: [CSV_COLUMNS.join(","), ...body].join("\n"), rows: rows.length };
    },
    { csv: "", rows: 0 },
  ),
);
