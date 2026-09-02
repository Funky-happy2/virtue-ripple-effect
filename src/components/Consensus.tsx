import { useQuery } from "@tanstack/react-query";
import { Globe, BarChart3, Users, ScrollText } from "lucide-react";

import {
  BANDS,
  EARLY_DECISIONS,
  getBehaviourInsights,
  getPowerCurve,
  getScenarioConsensus,
} from "@/lib/telemetry";
import { CLIMB, LABEL_COUNTS, POWER_TIERS, type Choice } from "@/lib/simulation";
import {
  earlyRunsReading,
  formatPct,
  formatUnit,
  powerCurveReading,
  societyStateReading,
} from "@/lib/findings";

/**
 * How everyone else answered this same situation, split by how much power they
 * held at the time. This is the point of the whole exhibit: the visitor's own
 * choice is placed next to the behaviour of the powerful and the powerless.
 */
export function ScenarioConsensus({
  scenarioId,
  choices,
  chosenId,
}: {
  scenarioId: string;
  choices: Choice[];
  chosenId: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["consensus", scenarioId],
    queryFn: () => getScenarioConsensus({ data: { scenarioId } }),
    staleTime: 10_000,
  });

  const total = data?.total ?? 0;
  const counts = new Map(data?.choices.map((c) => [c.choiceId, c.count]) ?? []);

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        <Globe className="size-3.5" /> What everyone else did
      </h2>

      {isLoading ? (
        <p className="mt-3 text-sm text-muted-foreground">Reading the record…</p>
      ) : error ? (
        <p className="mt-3 text-sm text-vice">
          The record is unavailable right now — your choice still counted.
        </p>
      ) : total === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          You are the first person to face this situation. Your choice becomes the baseline.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-2">
            {choices.map((c) => {
              const share = (counts.get(c.id) ?? 0) / total;
              const isMine = c.id === chosenId;
              return (
                <div key={c.id}>
                  <div className="flex items-baseline justify-between gap-3 text-xs">
                    <span
                      className={isMine ? "font-semibold text-foreground" : "text-muted-foreground"}
                    >
                      {c.label}
                      {isMine && (
                        <span className="ml-2 font-mono text-[10px] text-virtue">YOU</span>
                      )}
                    </span>
                    <span className="tabular font-mono text-[11px] text-muted-foreground">
                      {formatPct(share)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        c.kind === "virtue" ? "bg-virtue" : "bg-vice"
                      } ${isMine ? "opacity-100" : "opacity-40"}`}
                      style={{ width: `${share * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
            {BANDS.map(({ id, label }) => {
              const band = data?.bands.find((b) => b.band === id);
              return (
                <div key={id}>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="tabular mt-1 font-display text-xl font-bold text-foreground">
                    {band?.virtueRate === null || band === undefined
                      ? "—"
                      : formatPct(band.virtueRate)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    chose virtue · {formatUnit(band?.total ?? 0, "decision")}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            {formatUnit(total, "decision")} on this situation, not {formatUnit(total, "visitor")} —
            one visitor answers every situation in turn.
          </p>
        </>
      )}
    </section>
  );
}

/**
 * Virtue rate against power tier, across every decision ever recorded here.
 * Descriptive, not prescriptive: it shows whether people *do* act better as they
 * gain power, leaving the visitor to decide whether they *should*.
 *
 * The caption compares the two bands rather than the two end bars, refuses to say
 * anything until both bands hold enough decisions, and carries the selection
 * effect underneath it in plain sight — see `findings.ts` and `CLIMB`.
 */
export function PowerCurve() {
  const { data, error } = useQuery({
    queryKey: ["power-curve"],
    queryFn: () => getPowerCurve(),
    staleTime: 10_000,
  });

  const points = data?.points ?? [];
  const low = data?.bands.find((b) => b.band === "low");
  const high = data?.bands.find((b) => b.band === "high");
  const reading = powerCurveReading(
    { total: low?.total ?? 0, rate: low?.virtueRate ?? null },
    { total: high?.total ?? 0, rate: high?.virtueRate ?? null },
  );

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          <BarChart3 className="size-3.5" /> Virtue rate by power — all visitors
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {error
            ? "record unavailable"
            : `${formatUnit(data?.total ?? 0, "decision")} from ${formatUnit(
                data?.runs ?? 0,
                "run",
              )}`}
        </span>
      </div>

      <div className="mt-4 flex h-32 items-stretch gap-1.5">
        {POWER_TIERS.map((tier, i) => {
          const point = points[i];
          const rate = point?.virtueRate ?? null;
          return (
            <div
              key={tier.label}
              className="group flex h-full flex-1 flex-col items-center gap-1.5"
            >
              <span className="tabular font-mono text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {rate === null ? "—" : formatPct(rate)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  title={`${tier.label} — ${
                    rate === null ? "no data" : formatPct(rate)
                  } virtue, ${formatUnit(point?.total ?? 0, "decision")}`}
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    // A real 0% still draws a sliver, so it reads as "measured and low"
                    // rather than "no data" — the two must not look the same.
                    height: rate === null ? "2px" : `${Math.max(3, rate * 100)}%`,
                    background:
                      rate === null
                        ? "var(--border)"
                        : rate >= 0.5
                          ? "var(--virtue)"
                          : "var(--vice)",
                    opacity: rate === null ? 0.5 : 1,
                  }}
                />
              </div>
              <span className="font-mono text-[9px] text-muted-foreground">{i + 1}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-center font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
        rung on the ladder · each bar is the share of decisions taken there that were virtuous
      </p>

      <p
        className={`mt-3 text-xs leading-relaxed ${
          reading.ready ? "text-muted-foreground" : "text-gold"
        }`}
      >
        {reading.text}
      </p>

      <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        <span className="text-foreground/80">Read this with care.</span> Climbing is faster for the
        ruthless: taking the highest-paying option every time reaches the top rung in{" "}
        {CLIMB.ruthless} decisions, while the best virtuous option every time needs {CLIMB.virtuous}
        . So the right-hand bars are filled disproportionately by visitors who took the option that
        paid. This chart shows how people behave once they have arrived — not what arriving did to
        them.
      </p>
    </section>
  );
}

/**
 * The two cross-run readings: whether early behaviour predicts who ends up
 * powerful, and whether people behave differently once society is failing.
 */
export function BehaviourInsights() {
  const { data, error } = useQuery({
    queryKey: ["behaviour-insights"],
    queryFn: () => getBehaviourInsights(),
    staleTime: 10_000,
  });

  const powerful = data?.earlyByOutcome.find((r) => r.group === "powerful");
  const ordinary = data?.earlyByOutcome.find((r) => r.group === "ordinary");
  const earlyReading = earlyRunsReading(
    { runs: powerful?.runs ?? 0, total: powerful?.total ?? 0, rate: powerful?.virtueRate ?? null },
    { runs: ordinary?.runs ?? 0, total: ordinary?.total ?? 0, rate: ordinary?.virtueRate ?? null },
    EARLY_DECISIONS,
  );

  const states = data?.bySocietyState ?? [];
  const hasStates = states.some((s) => s.total > 0);
  const stateReading = societyStateReading(
    states.map((s) => ({ state: s.state, total: s.total, rate: s.virtueRate })),
  );

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        <Users className="size-3.5" /> Across every run
      </h2>

      {error ? (
        <p className="mt-3 text-sm text-vice">The record is unavailable right now.</p>
      ) : (
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Did the powerful start out different?
            </p>
            <div className="mt-3 flex gap-6">
              {[
                { label: "Became powerful", row: powerful },
                { label: "Stayed ordinary", row: ordinary },
              ].map(({ label, row }) => (
                <div key={label}>
                  <p className="tabular font-display text-2xl font-bold text-foreground">
                    {row?.virtueRate == null ? "—" : formatPct(row.virtueRate)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {label} · {formatUnit(row?.runs ?? 0, "run")}
                  </p>
                </div>
              ))}
            </div>
            <p
              className={`mt-3 text-xs leading-relaxed ${
                earlyReading.ready ? "text-muted-foreground" : "text-gold"
              }`}
            >
              {earlyReading.text}
            </p>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Does a failing society make people worse?
            </p>
            {!hasStates ? (
              <p className="mt-2 text-xs text-muted-foreground">No decisions recorded yet.</p>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {states.map((s) => (
                    <div key={s.state}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="capitalize text-muted-foreground">{s.state} society</span>
                        <span className="tabular font-mono text-[11px] text-muted-foreground">
                          {s.virtueRate === null ? "—" : formatPct(s.virtueRate)} ·{" "}
                          {formatUnit(s.total, "decision")}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                        <div
                          className="h-full rounded-full bg-virtue transition-all duration-700"
                          style={{ width: `${(s.virtueRate ?? 0) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  className={`mt-3 text-xs leading-relaxed ${
                    stateReading.ready ? "text-muted-foreground" : "text-gold"
                  }`}
                >
                  {stateReading.text}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <p className="mt-5 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
        Counting decisions, not people, wherever a decision count is shown — one visitor answering a
        full lap contributes {LABEL_COUNTS.scenarios} of them, and those {LABEL_COUNTS.scenarios}{" "}
        are one person in one mood rather than {LABEL_COUNTS.scenarios} independent opinions. Run
        counts are people.
      </p>
    </section>
  );
}

/**
 * The labels are mine, and saying so is what makes them usable. A value judgement
 * presented as a measurement is the one thing this page cannot afford.
 */
export function MethodNote() {
  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
        <ScrollText className="size-3.5" /> How &ldquo;virtue&rdquo; is counted here
      </h2>
      <div className="mt-3 grid gap-4 text-xs leading-relaxed text-muted-foreground md:grid-cols-2">
        <p>
          I wrote all {LABEL_COUNTS.scenarios} situations and all {LABEL_COUNTS.choices} options,
          and I labelled each one virtuous or not before anybody played — {LABEL_COUNTS.virtuous} of
          the {LABEL_COUNTS.choices} are labelled virtuous. The labels stay hidden while you play,
          on purpose, so that nobody is choosing to score points. This is my definition, not a
          universal one. If you disagree with a label, that disagreement is part of the point.
        </p>
        <p>
          Influence is not a reward for virtue. {LABEL_COUNTS.costly} options in the game{" "}
          <em>cost</em> you standing and every one of them is a virtuous one, while the fastest
          climb is to take whatever pays. That separation is deliberate: if power were handed out
          for goodness, the chart above could only ever measure its own scoring rule.
        </p>
      </div>
    </section>
  );
}
