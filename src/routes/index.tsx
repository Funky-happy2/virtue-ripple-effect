import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { RotateCcw, ShieldCheck, Skull, Users, Activity } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { SocietyCanvas, type RippleEvent } from "@/components/SocietyCanvas";
import {
  ACTIONS,
  POWER_TIERS,
  QUOTES,
  formatCount,
  intensity,
  livesAffected,
  stabilityDelta,
  type EthicalAction,
} from "@/lib/simulation";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Leverage of Virtue Simulation" },
      {
        name: "description",
        content:
          "An interactive ethical sandbox: see how societal power multiplies the ripple effects of virtuous and vicious choices.",
      },
      { property: "og:title", content: "The Leverage of Virtue Simulation" },
      {
        property: "og:description",
        content:
          "See how power multiplies the consequences of choice — ripples of virtue and vice across a simulated society.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Simulation,
});

const BASELINE = 72;

function Simulation() {
  const [tierIndex, setTierIndex] = useState(0);
  const [stability, setStability] = useState(BASELINE);
  const [lastAction, setLastAction] = useState<EthicalAction | null>(null);
  const [lastLives, setLastLives] = useState(0);
  const [totalLives, setTotalLives] = useState(0);
  const [ripple, setRipple] = useState<RippleEvent | null>(null);
  const rippleId = useRef(1);

  const tier = POWER_TIERS[tierIndex]!;
  const power = intensity(tier.level);

  const quote = useMemo(() => QUOTES[tierIndex]!, [tierIndex]);

  const delta = lastAction ? stabilityDelta(lastAction, tier) : 0;

  const act = (action: EthicalAction) => {
    const d = stabilityDelta(action, tier);
    const lives = livesAffected(action, tier);
    setStability((s) => Math.max(0, Math.min(100, s + d)));
    setLastAction(action);
    setLastLives(lives);
    setTotalLives((t) => t + lives);
    setRipple({ id: rippleId.current++, kind: action.kind, intensity: power });
  };

  const reset = () => {
    setStability(BASELINE);
    setLastAction(null);
    setLastLives(0);
    setTotalLives(0);
    setRipple({ id: 0, kind: "virtue", intensity: 0 });
    rippleId.current = 1;
  };

  const summary = lastAction
    ? lastAction.describe(tier)
    : "Choose a power level and an action. The simulation multiplies the moral weight of that choice by the leverage of the person making it.";

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
              The Leverage of{" "}
              <span className="text-virtue">Virtue</span> Simulation
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              See how power multiplies the consequences of choice.
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

        <div className="grid gap-5 lg:grid-cols-[minmax(320px,380px)_1fr]">
          {/* Controls */}
          <section className="panel flex flex-col gap-7 p-5">
            <div>
              <SectionLabel>The Power Slider</SectionLabel>
              <div className="mt-4 rounded-lg border border-border bg-surface-raised p-4">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-semibold">{tier.label}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ×{tier.levelLabel}
                  </span>
                </div>
                <Slider
                  value={[tierIndex]}
                  onValueChange={(v) => setTierIndex(v[0] ?? 0)}
                  min={0}
                  max={POWER_TIERS.length - 1}
                  step={1}
                  className="mt-5"
                />
                <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Citizen</span>
                  <span>Titan</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-5 gap-1">
                {POWER_TIERS.map((t, i) => (
                  <button
                    key={t.label}
                    onClick={() => setTierIndex(i)}
                    className={`h-1.5 rounded-full transition-colors ${
                      i <= tierIndex ? "bg-virtue" : "bg-border"
                    }`}
                    aria-label={t.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>
                <ShieldCheck className="size-3.5 text-virtue" /> Virtuous Actions
              </SectionLabel>
              <div className="mt-3 grid gap-2">
                {ACTIONS.filter((a) => a.kind === "virtue").map((a) => (
                  <ActionButton
                    key={a.id}
                    action={a}
                    active={lastAction?.id === a.id}
                    onClick={() => act(a)}
                  />
                ))}
              </div>
            </div>

            <div>
              <SectionLabel>
                <Skull className="size-3.5 text-vice" /> Vicious Actions
              </SectionLabel>
              <div className="mt-3 grid gap-2">
                {ACTIONS.filter((a) => a.kind === "vice").map((a) => (
                  <ActionButton
                    key={a.id}
                    action={a}
                    active={lastAction?.id === a.id}
                    onClick={() => act(a)}
                  />
                ))}
              </div>
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
              {lastAction && (
                <div
                  className={`pointer-events-none absolute right-4 top-4 rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
                    lastAction.kind === "virtue"
                      ? "bg-virtue/10 text-virtue"
                      : "bg-vice/10 text-vice"
                  }`}
                >
                  {lastAction.kind === "virtue" ? "Virtue ripple" : "Vice shockwave"} ·{" "}
                  {(power * 100).toFixed(0)}% amplitude
                </div>
              )}
            </section>

            {/* Impact dashboard */}
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
                tone={lastAction?.kind === "vice" ? "vice" : "virtue"}
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
                  {lastAction && (
                    <span className={delta >= 0 ? "text-virtue" : "text-vice"}>
                      {delta >= 0 ? "+" : ""}
                      {delta.toFixed(2)}% last choice
                    </span>
                  )}
                </div>
              </div>
            </section>

            <section className="panel p-5">
              <SectionLabel>Ethical Summary</SectionLabel>
              <p className="mt-3 text-sm leading-relaxed text-foreground/90">{summary}</p>
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

function ActionButton({
  action,
  active,
  onClick,
}: {
  action: EthicalAction;
  active: boolean;
  onClick: () => void;
}) {
  const virtue = action.kind === "virtue";
  return (
    <button
      onClick={onClick}
      className={`group rounded-lg border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${
        virtue
          ? "border-virtue/25 bg-virtue/5 text-virtue hover:bg-virtue/10"
          : "border-vice/25 bg-vice/5 text-vice hover:bg-vice/10"
      } ${active ? (virtue ? "glow-virtue" : "glow-vice") : ""}`}
    >
      {action.label}
    </button>
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
