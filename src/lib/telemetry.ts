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

/** Virtue rate per power tier across every decision ever recorded — the headline result. */
export const getPowerCurve = createServerFn({ method: "POST" }).handler(async () =>
  withDb<{ points: PowerCurvePoint[]; total: number }>(
    async (sql) => {
      const rows = await sql<{ tier_index: number; total: string; virtues: string }[]>`
        select tier_index, count(*) as total, count(*) filter (where kind = 'virtue') as virtues
        from decisions group by tier_index order by tier_index
      `;
      const byTier = new Map(rows.map((r) => [Number(r.tier_index), r]));
      return {
        total: rows.reduce((sum, r) => sum + Number(r.total), 0),
        points: POWER_TIERS.map((_, tierIndex) => {
          const row = byTier.get(tierIndex);
          const total = row ? Number(row.total) : 0;
          return {
            tierIndex,
            total,
            virtueRate: total > 0 ? Number(row!.virtues) / total : null,
          };
        }),
      };
    },
    { points: [], total: 0 },
  ),
);
