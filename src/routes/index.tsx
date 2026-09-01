import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { RotateCcw, Users, Activity, TrendingUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SocietyCanvas, type RippleEvent } from "@/components/SocietyCanvas";
import {
  POWER_TIERS,
  QUOTES,
  SCENARIOS,
  TIER_THRESHOLDS,
  choiceLives,
  choiceStability,
  formatCount,
  influenceDelta,
  intensity,
  tierForInfluence,
  type Choice,
} from "@/lib/simulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Leverage of Virtue Simulation" },
      {
        name: "description",
        content:
          "An interactive ethical sandbox: start as an average citizen, face unlabelled situations, and watch your choices grow — or shrink — your power over society.",
      },
      { property: "og:title", content: "The Leverage of Virtue Simulation" },
      {
        property: "og:description",
        content:
          "Start as an average citizen. Every situation is unlabelled — only the consequences reveal what your choice was worth.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulation,
});

const BASELINE = 72;

function Simulation() {
  const [influence, setInfluence] = useState(0);
  const [stability, setStability] = useState(BASELINE);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [lastLives, setLastLives] = useState(0);
  const [totalLives, setTotalLives] = useState(0);
  const [lastDelta, setLastDelta] = useState(0);
  const [lastInfluenceDelta, setLastInfluenceDelta] = useState(0);
  const [lastTierLabel, setLastTierLabel] = useState<string | null>(null);
  const [ripple, setRipple] = useState<RippleEvent | null>(null);
  const [decisions, setDecisions] = useState(0);
  const rippleId = useRef(1);

  const tierIndex = tierForInfluence(influence);
  const tier = POWER_TIERS[tierIndex]!;
  const power = intensity(tier.level);

  const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length]!;
  const quote = useMemo(() => QUOTES[tierIndex]!, [tierIndex]);

  const nextThreshold = TIER_THRESHOLDS[tierIndex + 1];
  const floor = TIER_THRESHOLDS[tierIndex]!;
  const progress =
    nextThreshold === undefined
      ? 1
      : Math.max(0, Math.min(1, (influence - floor) / (nextThreshold - floor)));

  const choose = (choice: Choice) => {
    const d = choiceStability(choice, tier);
    const lives = choiceLives(choice, tier);
    const inf = influenceDelta(choice);
    setStability((s) => Math.max(0, Math.min(100, s + d)));
    setInfluence((i) => Math.max(0, i + inf));
    setLastChoice(choice);
    setLastLives(lives);
    setLastDelta(d);
    setLastInfluenceDelta(inf);
    setLastTierLabel(tier.label);
    setTotalLives((t) => t + lives);
    setDecisions((n) => n + 1);
    setRipple({ id: rippleId.current++, kind: choice.kind, intensity: power });
  };

  const next = () => {
    setLastChoice(null);
    setScenarioIndex((i) => i + 1);
  };

  const reset = () => {
    setInfluence(0);
    setStability(BASELINE);
    setScenarioIndex(0);
    setLastChoice(null);
    setLastLives(0);
    setTotalLives(0);
    setLastDelta(0);
    setLastInfluenceDelta(0);
    setLastTierLabel(null);
    setDecisions(0);
    setRipple({ id: 0, kind: "virtue", intensity: 0 });
    rippleId.current = 1;
  };

  const stabilityTone =
    stability >= 65 ? "text-virtue" : stability >= 35 ? "text-gold" : "text-vice";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1400px] px-5 py-7 lg:px-8">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
              Ethical Sandbox / v1.0
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              The Leverage of <span className="text-virtue">Virtue</span> Simulation
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              You begin as an average citizen. Power is earned, not chosen.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={reset}
            className="gap-2 border-border bg-surface-raised font-mono text-xs uppercase tracking-widest hover:bg-accent"
          >
            <RotateCcw className="size-3.5" />
            Reset Society
          </Button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
          {/* Situation + progression */}
          <section className="panel flex flex-col gap-7 p-5">
            <div>
              <SectionLabel>
                <TrendingUp className="size-3.5 text-virtue" /> Your Standing
              </SectionLabel>
              <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-semibold">{tier.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ×{tier.levelLabel}
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-virtue transition-all duration-700 ease-out"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Influence {influence}</span>
                  <span>
                    {nextThreshold === undefined
                      ? "Maximum leverage"
                      : `${POWER_TIERS[tierIndex + 1]!.label} at ${nextThreshold}`}
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {POWER_TIERS.map((t, i) => (
                  <div
                    key={t.label}
                    title={t.label}
                    className={`h-1.5 rounded-full ${
                      i <= tierIndex ? "bg-virtue" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>
                <HelpCircle className="size-3.5" /> Situation {decisions + 1}
              </SectionLabel>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {scenario.situation}
              </p>

              {!lastChoice ? (
                <div className="mt-4 grid gap-2">
                  {scenario.choices.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => choose(c)}
                      className="rounded-lg border border-border bg-surface-raised px-4 py-3 text-left text-sm font-medium transition-colors duration-200 hover:border-foreground/30 hover:bg-accent"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    You chose
                  </p>
                  <p className="mt-1 text-sm font-medium">{lastChoice.label}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px]">
                    <span className={lastDelta >= 0 ? "text-virtue" : "text-vice"}>
                      Stability {lastDelta >= 0 ? "+" : ""}
                      {lastDelta.toFixed(2)}%
                    </span>
                    <span
                      className={lastInfluenceDelta >= 0 ? "text-virtue" : "text-vice"}
                    >
                      Influence {lastInfluenceDelta >= 0 ? "+" : ""}
                      {lastInfluenceDelta}
                    </span>
                  </div>
                  <Button onClick={next} className="mt-4 w-full font-mono text-xs uppercase tracking-widest">
                    Next situation
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Visualizer + dashboard */}
          <div className="flex flex-col gap-5">
            <section className="panel relative overflow-hidden">
              <div className="grid-backdrop absolute inset-0 opacity-30" />
              <div className="relative h-[400px] sm:h-[480px] lg:h-[540px]">
                <SocietyCanvas ripple={ripple} />
              </div>
              <div className="pointer-events-none absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
                Society Network — {tier.label}
              </div>
              {lastChoice && (
                <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-surface-raised px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {lastTierLabel} · {(power * 100).toFixed(0)}% amplitude
                </div>
              )}
            </section>

            <section className="grid gap-5 md:grid-cols-3">
              <Metric
                icon={<Users className="size-4" />}
                label="Lives Affected"
                value={lastLives ? formatCount(lastLives) : "—"}
                sub={
                  lastLives
                    ? `${lastLives.toLocaleString()} people · total ${totalLives.toLocaleString()}`
                    : "Awaiting a choice"
                }
                tone={lastDelta < 0 ? "vice" : "virtue"}
              />
              <div className="panel p-4 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    <Activity className="size-4" /> Society Stability Rating
                  </span>
                  <span className={`tabular font-display text-2xl font-bold ${stabilityTone}`}>
                    {stability.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-raised">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${stability}%`,
                      background:
                        stability >= 65
                          ? "linear-gradient(90deg, var(--virtue-soft), var(--virtue))"
                          : stability >= 35
                            ? "linear-gradient(90deg, var(--virtue-soft), var(--gold))"
                            : "linear-gradient(90deg, var(--vice-soft), var(--vice))",
                    }}
                  />
                </div>
                <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                  <span>Baseline {BASELINE}%</span>
                  <span>{decisions} decisions made</span>
                </div>
              </div>
            </section>

            <section className="panel p-5">
              <SectionLabel>Consequence Report</SectionLabel>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                {lastChoice && lastTierLabel
                  ? lastChoice.outcome(
                      POWER_TIERS.find((t) => t.label === lastTierLabel) ?? tier,
                    )
                  : "No labels, no scores in advance. Decide what you would actually do — the consequences will tell you what it was worth."}
              </p>
            </section>
          </div>
        </div>

        <footer className="mt-7 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
            Ethical Quote of the Day
          </p>
          <blockquote className="mt-2 font-display text-lg italic text-foreground/90">
            “{quote.text}”
          </blockquote>
          <cite className="mt-1 block text-xs not-italic text-muted-foreground">
            — {quote.author}
          </cite>
        </footer>
      </div>
    </main>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
      {children}
    </h2>
  );
}

function Metric({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: "virtue" | "vice";
}) {
  return (
    <div className="panel p-4">
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {icon} {label}
      </span>
      <p
        className={`tabular mt-2 font-display text-3xl font-bold ${
          tone === "virtue" ? "text-virtue" : "text-vice"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
