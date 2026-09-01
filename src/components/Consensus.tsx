import { useQuery } from "@tanstack/react-query";
import { Globe, BarChart3, Users } from "lucide-react";

import { BANDS, getBehaviourInsights, getPowerCurve, getScenarioConsensus } from "@/lib/telemetry";
import { POWER_TIERS, type Choice } from "@/lib/simulation";

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

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
                      {pct(share)}
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
                    {band?.virtueRate === null || band === undefined ? "—" : pct(band.virtueRate)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    chose virtue · n={band?.total ?? 0}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Virtue rate against power tier, across every decision ever recorded here.
 * Descriptive, not prescriptive: it shows whether people *do* act better as they
 * gain power, leaving the visitor to decide whether they *should*.
 */
export function PowerCurve() {
  const { data, error } = useQuery({
    queryKey: ["power-curve"],
    queryFn: () => getPowerCurve(),
    staleTime: 10_000,
  });

  const points = data?.points ?? [];
  const observed = points.filter((p) => p.virtueRate !== null);
  const first = observed[0];
  const last = observed[observed.length - 1];
  const trend = first && last && observed.length > 1 ? last.virtueRate! - first.virtueRate! : null;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
          <BarChart3 className="size-3.5" /> Virtue rate by power — all visitors
        </h2>
        <span className="font-mono text-[10px] text-muted-foreground">
          {error
            ? "record unavailable"
            : `${(data?.total ?? 0).toLocaleString()} ${
                data?.total === 1 ? "decision" : "decisions"
              } recorded`}
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
                {rate === null ? "—" : pct(rate)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  title={`${tier.label} — ${rate === null ? "no data" : pct(rate)} virtue (n=${point?.total ?? 0})`}
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

      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        {trend === null
          ? "Not enough data across the tiers yet. Keep playing — the curve fills in as decisions accumulate."
          : trend > 0.02
            ? `So far, people act more virtuously as their power grows — virtue is ${pct(Math.abs(trend))} more common at the top of the ladder than the bottom.`
            : trend < -0.02
              ? `So far, people act less virtuously as their power grows — virtue is ${pct(Math.abs(trend))} rarer at the top of the ladder than the bottom.`
              : "So far, power barely moves the needle: people behave about the same whether they hold a little or a lot."}
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
  const comparable =
    powerful?.virtueRate != null && ordinary?.virtueRate != null
      ? powerful.virtueRate - ordinary.virtueRate
      : null;

  const states = data?.bySocietyState ?? [];
  const hasStates = states.some((s) => s.total > 0);

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
            {comparable === null ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Not enough completed runs yet — this needs at least {5} decisions from several
                visitors before it can say anything.
              </p>
            ) : (
              <>
                <div className="mt-3 flex gap-6">
                  {[
                    { label: "Became powerful", row: powerful },
                    { label: "Stayed ordinary", row: ordinary },
                  ].map(({ label, row }) => (
                    <div key={label}>
                      <p className="tabular font-display text-2xl font-bold text-foreground">
                        {row?.virtueRate == null ? "—" : pct(row.virtueRate)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {label} · {row?.runs ?? 0} runs
                      </p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  {Math.abs(comparable) < 0.03
                    ? "Their first five decisions looked the same as everyone else's. Power did not select for virtue — it selected for something else."
                    : comparable > 0
                      ? `Visitors who reached the top were ${pct(Math.abs(comparable))} more virtuous in their first five decisions than those who never did.`
                      : `Visitors who reached the top were ${pct(Math.abs(comparable))} less virtuous in their first five decisions than those who never did.`}
                </p>
              </>
            )}
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Do people behave worse as things fall apart?
            </p>
            {!hasStates ? (
              <p className="mt-2 text-xs text-muted-foreground">No decisions recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {states.map((s) => (
                  <div key={s.state}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="capitalize text-muted-foreground">{s.state} society</span>
                      <span className="tabular font-mono text-[11px] text-muted-foreground">
                        {s.virtueRate === null ? "—" : pct(s.virtueRate)} · n={s.total}
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
            )}
          </div>
        </div>
      )}
    </section>
  );
}
