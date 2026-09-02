/**
 * Turning counts into sentences.
 *
 * This lives apart from the panels because the wording is the part of the site
 * most able to over-claim. Three rules are enforced here rather than trusted to
 * whoever edits the JSX next:
 *
 * 1. The difference between two rates is measured in **percentage points**.
 *    74% against 50% is 24 points, not "24% more common" — that number is 48%.
 * 2. No reading is printed until both sides of a comparison clear a minimum.
 *    A guard of `total > 0` lets a single visitor rewrite the finding, and at a
 *    public exhibition it lets one group of friends move any bar on the page.
 * 3. Every count says what it counts. `n` here is decisions, and one visitor
 *    playing a full lap contributes sixteen of them, so the unit is never
 *    left to the reader to guess.
 */

/** Decisions needed on each side of a comparison before it says anything. */
export const MIN_DECISIONS = 20;
/** Runs needed on each side of a run-level comparison. */
export const MIN_RUNS = 10;
/** Below this gap, two rates are reported as the same rather than as a trend. */
const NOISE_FLOOR = 0.05;

export type Sample = { total: number; rate: number | null };

export function formatPct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

/** The correct unit for the difference of two percentages. */
export function formatPoints(diff: number) {
  const points = Math.round(Math.abs(diff) * 100);
  return `${points} percentage point${points === 1 ? "" : "s"}`;
}

/** Relative difference — the thing "more common" actually means. */
export function formatRelative(high: number, low: number) {
  if (low <= 0) return null;
  const relative = Math.round((high / low - 1) * 100);
  return relative === 0 ? null : `${Math.abs(relative)}%`;
}

export function formatUnit(n: number, unit: string) {
  return `${n.toLocaleString()} ${unit}${n === 1 ? "" : "s"}`;
}

export type Reading =
  /** Not enough behind the numbers to say anything yet — say that instead. */
  { ready: false; text: string } | { ready: true; text: string };

function shortfall(
  sides: { label: string; total: number }[],
  minimum: number,
  unit: string,
): Reading | null {
  const short = sides.filter((s) => s.total < minimum);
  if (short.length === 0) return null;
  const parts = short.map((s) => `${s.total} of ${minimum} ${unit}s ${s.label}`);
  return {
    ready: false,
    text: `Not enough data yet — ${parts.join(", ")}. No reading until both sides clear ${minimum}.`,
  };
}

/**
 * Virtue rate with great power against virtue rate with little power.
 *
 * Deliberately compares two *bands* rather than the first and last bar: an
 * eight-bar chart read end to end ignores everything in between, and the middle
 * of this one has been the lowest point on the chart before now.
 */
export function powerCurveReading(low: Sample, high: Sample): Reading {
  const short = shortfall(
    [
      { label: "at the bottom of the ladder", total: low.total },
      { label: "at the top", total: high.total },
    ],
    MIN_DECISIONS,
    "decision",
  );
  if (short) return short;
  if (low.rate === null || high.rate === null) {
    return { ready: false, text: "Not enough data yet." };
  }

  const diff = high.rate - low.rate;
  const counts = `across ${formatUnit(high.total, "decision")} with great power and ${formatUnit(
    low.total,
    "decision",
  )} with little`;

  if (Math.abs(diff) < NOISE_FLOOR) {
    return {
      ready: true,
      text: `So far, power barely moves the needle: ${formatPct(high.rate)} of decisions taken with great power were virtuous against ${formatPct(low.rate)} taken with little — a gap of ${formatPoints(diff)}, ${counts}.`,
    };
  }

  if (diff > 0) {
    const relative = formatRelative(high.rate, low.rate);
    return {
      ready: true,
      text: `So far, virtue is more common at the top of the ladder: ${formatPct(high.rate)} against ${formatPct(low.rate)} — a gap of ${formatPoints(diff)}${
        relative ? `, or ${relative} more common in relative terms` : ""
      }, ${counts}.`,
    };
  }

  return {
    ready: true,
    text: `So far, virtue is rarer at the top of the ladder: ${formatPct(high.rate)} against ${formatPct(low.rate)} — a gap of ${formatPoints(diff)}, ${counts}. Power did not select for virtue; it selected for something else.`,
  };
}

/**
 * Did the visitors who became powerful behave differently before they got there?
 * Counted in runs, because the claim is about people rather than decisions.
 */
export function earlyRunsReading(
  powerful: Sample & { runs: number },
  ordinary: Sample & { runs: number },
  earlyDecisions: number,
): Reading {
  const short = shortfall(
    [
      { label: "from visitors who reached the top", total: powerful.runs },
      { label: "from those who did not", total: ordinary.runs },
    ],
    MIN_RUNS,
    "run",
  );
  if (short) return short;
  if (powerful.rate === null || ordinary.rate === null) {
    return { ready: false, text: "Not enough data yet." };
  }

  const diff = powerful.rate - ordinary.rate;
  const counts = `${formatUnit(powerful.runs, "run")} against ${formatUnit(ordinary.runs, "run")}`;

  if (Math.abs(diff) < NOISE_FLOOR) {
    return {
      ready: true,
      text: `Their first ${earlyDecisions} decisions looked the same as everyone else's — ${formatPct(powerful.rate)} against ${formatPct(ordinary.rate)}, a gap of ${formatPoints(diff)} over ${counts}. Power did not select for virtue; it selected for something else.`,
    };
  }

  return {
    ready: true,
    text: `Visitors who reached the top were ${formatPoints(diff)} ${
      diff > 0 ? "more" : "less"
    } virtuous in their first ${earlyDecisions} decisions than those who never did — ${formatPct(powerful.rate)} against ${formatPct(ordinary.rate)}, over ${counts}.`,
  };
}

export type SocietyState = { state: "healthy" | "strained" | "failing" } & Sample;

/**
 * Do people behave worse once society is already failing? The honest answer so
 * far has been "no", and a chart with no pattern in it is a real result — as
 * long as the caption says so rather than implying the pattern it hoped for.
 */
export function societyStateReading(states: SocietyState[]): Reading {
  const by = new Map(states.map((s) => [s.state, s]));
  const healthy = by.get("healthy");
  const failing = by.get("failing");

  const short = shortfall(
    [
      { label: "in a healthy society", total: healthy?.total ?? 0 },
      { label: "in a failing one", total: failing?.total ?? 0 },
    ],
    MIN_DECISIONS,
    "decision",
  );
  if (short) return short;
  if (healthy?.rate == null || failing?.rate == null) {
    return { ready: false, text: "Not enough data yet." };
  }

  const listed = states
    .filter((s) => s.rate !== null)
    .map((s) => `${s.state} ${formatPct(s.rate!)}`)
    .join(", ");
  const diff = failing.rate - healthy.rate;

  if (diff <= -NOISE_FLOOR) {
    return {
      ready: true,
      text: `So far, yes — ${listed}. People are ${formatPoints(diff)} less likely to choose virtue once society is failing than when it is healthy.`,
    };
  }
  if (diff >= NOISE_FLOOR) {
    return {
      ready: true,
      text: `So far, no — ${listed}. The failing society scores highest, which is the opposite of what I expected.`,
    };
  }
  return {
    ready: true,
    text: `So far, no — ${listed}. The gap is ${formatPoints(diff)}, which is no clear pattern at all. That is still a result.`,
  };
}
