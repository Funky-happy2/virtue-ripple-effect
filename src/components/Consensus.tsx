import { useQuery } from "@tanstack/react-query";
import { Globe, BarChart3 } from "lucide-react";

import { BANDS, getPowerCurve, getScenarioConsensus } from "@/lib/telemetry";
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

      <div className="mt-4 flex h-32 items-end gap-1.5">
        {POWER_TIERS.map((tier, i) => {
          const point = points[i];
          const rate = point?.virtueRate ?? null;
          return (
            <div key={tier.label} className="group flex flex-1 flex-col items-center gap-1.5">
              <span className="tabular font-mono text-[9px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                {rate === null ? "—" : pct(rate)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  title={`${tier.label} — ${rate === null ? "no data" : pct(rate)} virtue (n=${point?.total ?? 0})`}
                  className="w-full rounded-t transition-all duration-700"
                  style={{
                    height: rate === null ? "2px" : `${Math.max(2, rate * 100)}%`,
                    background:
                      rate === null
                        ? "var(--border)"
                        : rate >= 0.5
                          ? "var(--virtue)"
                          : "var(--vice)",
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
