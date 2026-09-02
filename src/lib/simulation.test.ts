import { describe, expect, test } from "bun:test";

import {
  CLIMB,
  LABEL_COUNTS,
  POWER_TIERS,
  SCENARIOS,
  TIER_THRESHOLDS,
  choiceLives,
  choiceStability,
  choicesForStep,
  formatCount,
  influenceDelta,
  intensity,
  scenarioForStep,
  seededShuffle,
  tierForInfluence,
  type Choice,
} from "./simulation";

const ALL_CHOICES = SCENARIOS.flatMap((s) => s.choices);
const TOP = POWER_TIERS[POWER_TIERS.length - 1]!;
const BOTTOM = POWER_TIERS[0]!;

function bestOfKind(choices: Choice[], kind: "virtue" | "vice") {
  const pool = choices.filter((c) => c.kind === kind);
  return pool.sort((a, b) => b.influence - a.influence)[0];
}

describe("scenario data", () => {
  test("ids are unique, and choice ids are unique within a scenario", () => {
    const ids = SCENARIOS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of SCENARIOS) {
      const cids = s.choices.map((c) => c.id);
      expect(new Set(cids).size).toBe(cids.length);
    }
  });

  test("every scenario offers both a virtuous and a vicious option", () => {
    for (const s of SCENARIOS) {
      expect(s.choices.some((c) => c.kind === "virtue")).toBe(true);
      expect(s.choices.some((c) => c.kind === "vice")).toBe(true);
    }
  });

  test("stability sign matches the moral label", () => {
    for (const c of ALL_CHOICES) {
      if (c.kind === "virtue") expect(c.baseStability).toBeGreaterThan(0);
      else expect(c.baseStability).toBeLessThan(0);
    }
  });

  test("outcome text names the tier, so consequences read as tier-specific", () => {
    for (const c of ALL_CHOICES) {
      expect(c.outcome(TOP)).toContain(TOP.label);
    }
  });
});

describe("influence is not a virtue reward", () => {
  // The headline chart plots virtue rate against power. If influence were derived
  // from `kind`, only virtuous players could reach the upper tiers and the chart
  // would measure its own scoring rule instead of anyone's behaviour.
  test("some vices gain power and some virtues cost it", () => {
    expect(ALL_CHOICES.some((c) => c.kind === "vice" && c.influence > 0)).toBe(true);
    expect(ALL_CHOICES.some((c) => c.kind === "virtue" && c.influence <= 0)).toBe(true);
  });

  test("a purely vicious run still reaches the top tier", () => {
    let influence = 0;
    for (let step = 0; step < 40; step++) {
      const c = bestOfKind(scenarioForStep(step).choices, "vice");
      if (c) influence = Math.max(0, influence + influenceDelta(c));
    }
    expect(tierForInfluence(influence)).toBe(POWER_TIERS.length - 1);
  });

  test("a reputable virtuous run also reaches the top tier, just slower", () => {
    const stepsToTop = (kind: "virtue" | "vice") => {
      let influence = 0;
      for (let step = 0; step < 200; step++) {
        const c = bestOfKind(scenarioForStep(step).choices, kind);
        if (c) influence = Math.max(0, influence + influenceDelta(c));
        if (tierForInfluence(influence) === POWER_TIERS.length - 1) return step + 1;
      }
      return Infinity;
    };
    const virtue = stepsToTop("virtue");
    const vice = stepsToTop("vice");
    expect(virtue).toBeFinite();
    expect(virtue).toBeGreaterThan(vice);
  });
});

describe("choiceStability", () => {
  test("at the bottom tier a choice is worth its raw base value", () => {
    for (const c of ALL_CHOICES) {
      expect(choiceStability(c, BOTTOM, 72)).toBeCloseTo(c.baseStability, 10);
    }
  });

  test("power amplifies the same choice", () => {
    for (const c of ALL_CHOICES) {
      const low = Math.abs(choiceStability(c, BOTTOM, 72));
      const high = Math.abs(choiceStability(c, TOP, 72));
      expect(high).toBeGreaterThan(low);
    }
  });

  test("top-tier vice lands hard even on a perfectly healthy society", () => {
    const worst = Math.min(
      ...ALL_CHOICES.filter((c) => c.kind === "vice").map((c) => choiceStability(c, TOP, 100)),
    );
    expect(worst).toBeLessThanOrEqual(-35);
  });

  test("vice gets harsher as society becomes more fragile", () => {
    const vice = ALL_CHOICES.find((c) => c.kind === "vice")!;
    expect(choiceStability(vice, TOP, 10)).toBeLessThan(choiceStability(vice, TOP, 90));
  });

  test("virtue is throttled as stability approaches the ceiling", () => {
    const virtue = ALL_CHOICES.find((c) => c.kind === "virtue")!;
    expect(choiceStability(virtue, TOP, 95)).toBeLessThan(choiceStability(virtue, TOP, 40));
  });

  test("repeated application never escapes the 0..100 band", () => {
    for (const kind of ["virtue", "vice"] as const) {
      let stability = 72;
      for (let i = 0; i < 200; i++) {
        const c = ALL_CHOICES.find((x) => x.kind === kind)!;
        stability = Math.max(0, Math.min(100, stability + choiceStability(c, TOP, stability)));
        expect(stability).toBeGreaterThanOrEqual(0);
        expect(stability).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("tiers", () => {
  test("thresholds ascend and map back to their own tier", () => {
    for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
      expect(TIER_THRESHOLDS[i]!).toBeGreaterThan(TIER_THRESHOLDS[i - 1]!);
    }
    TIER_THRESHOLDS.forEach((t, i) => expect(tierForInfluence(t)).toBe(i));
  });

  test("there is one threshold per tier", () => {
    expect(TIER_THRESHOLDS.length).toBe(POWER_TIERS.length);
  });

  test("influence below the first threshold and far above the last both clamp", () => {
    expect(tierForInfluence(-99)).toBe(0);
    expect(tierForInfluence(10_000)).toBe(POWER_TIERS.length - 1);
  });

  test("intensity runs 0..1 across the ladder and never decreases", () => {
    const values = POWER_TIERS.map((t) => intensity(t.level));
    expect(values[0]).toBeCloseTo(0, 10);
    expect(values[values.length - 1]).toBeCloseTo(1, 10);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });

  test("lives affected scale with tier reach", () => {
    const c = ALL_CHOICES[0]!;
    expect(choiceLives(c, TOP)).toBeGreaterThan(choiceLives(c, BOTTOM));
    expect(Number.isInteger(choiceLives(c, TOP))).toBe(true);
  });
});

describe("deterministic ordering", () => {
  // These guard the SSR/hydration contract: an unseeded shuffle renders one order
  // on the server and another on the client, which React reports as a mismatch.
  test("the same seed always produces the same permutation", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(items, "seed-a")).toEqual(seededShuffle(items, "seed-a"));
  });

  test("different seeds generally produce different permutations", () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    expect(seededShuffle(items, "seed-a")).not.toEqual(seededShuffle(items, "seed-b"));
  });

  test("shuffling preserves every element exactly once", () => {
    const items = SCENARIOS.map((s) => s.id);
    const shuffled = seededShuffle(items, "lap-3");
    expect([...shuffled].sort()).toEqual([...items].sort());
  });

  test("scenarioForStep and choicesForStep are stable for a given step", () => {
    for (const step of [0, 5, 16, 33]) {
      expect(scenarioForStep(step).id).toBe(scenarioForStep(step).id);
      const s = scenarioForStep(step);
      expect(choicesForStep(s, step).map((c) => c.id)).toEqual(
        choicesForStep(s, step).map((c) => c.id),
      );
    }
  });

  test("the first lap shows every scenario exactly once", () => {
    const seen = [...Array(SCENARIOS.length)].map((_, i) => scenarioForStep(i).id);
    expect(new Set(seen).size).toBe(SCENARIOS.length);
  });

  test("a later lap reorders the deck rather than replaying it", () => {
    const lap0 = [...Array(SCENARIOS.length)].map((_, i) => scenarioForStep(i).id);
    const lap1 = [...Array(SCENARIOS.length)].map(
      (_, i) => scenarioForStep(i + SCENARIOS.length).id,
    );
    expect(lap1).not.toEqual(lap0);
    expect([...lap1].sort()).toEqual([...lap0].sort());
  });
});

describe("formatCount", () => {
  test("formats across magnitudes", () => {
    expect(formatCount(2)).toBe("2");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1_500)).toBe("1.5K");
    expect(formatCount(15_000)).toBe("15K");
    expect(formatCount(1_500_000)).toBe("1.5M");
    expect(formatCount(20_000_000)).toBe("20M");
  });
});

describe("the numbers the page quotes about itself", () => {
  // These appear in the caveat under the headline chart. Computing them from the
  // scenario table rather than typing them into the JSX is what stops the page
  // from quoting a figure the game no longer plays by.
  test("the ruthless climb is materially faster than the virtuous one", () => {
    expect(CLIMB.virtuous).toBeFinite();
    expect(CLIMB.ruthless).toBeFinite();
    expect(CLIMB.virtuous).toBeGreaterThan(CLIMB.ruthless);
  });

  test("label counts match the authored scenarios", () => {
    expect(LABEL_COUNTS.scenarios).toBe(SCENARIOS.length);
    expect(LABEL_COUNTS.choices).toBe(ALL_CHOICES.length);
    expect(LABEL_COUNTS.virtuous).toBe(ALL_CHOICES.filter((c) => c.kind === "virtue").length);
  });

  test("every option that costs standing is a virtuous one", () => {
    const costly = ALL_CHOICES.filter((c) => c.influence < 0);
    expect(costly.length).toBe(LABEL_COUNTS.costly);
    expect(costly.length).toBeGreaterThan(0);
    expect(costly.every((c) => c.kind === "virtue")).toBe(true);
  });
});
