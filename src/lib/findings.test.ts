import { describe, expect, test } from "bun:test";

import {
  MIN_DECISIONS,
  MIN_RUNS,
  earlyRunsReading,
  formatPoints,
  formatRelative,
  formatUnit,
  powerCurveReading,
  societyStateReading,
} from "./findings";

const enough = MIN_DECISIONS;

describe("units", () => {
  // The difference of two percentages is percentage points. Printing it with a
  // percent sign is the single most common error in published statistics, and it
  // used to sit on the most-read line of this page.
  test("a difference of rates is reported in percentage points, not percent", () => {
    expect(formatPoints(0.74 - 0.5)).toBe("24 percentage points");
    expect(formatPoints(0.01)).toBe("1 percentage point");
  });

  test("'more common' is the relative figure, and differs from the point gap", () => {
    expect(formatRelative(0.74, 0.5)).toBe("48%");
  });

  test("counts are singular at one", () => {
    expect(formatUnit(1, "decision")).toBe("1 decision");
    expect(formatUnit(2, "run")).toBe("2 runs");
    expect(formatUnit(0, "decision")).toBe("0 decisions");
  });
});

describe("powerCurveReading", () => {
  test("says nothing until both sides clear the minimum", () => {
    const reading = powerCurveReading({ total: 7, rate: 0.5 }, { total: 60, rate: 0.74 });
    expect(reading.ready).toBe(false);
    expect(reading.text).toContain(`7 of ${MIN_DECISIONS}`);
  });

  test("a single decision cannot produce a finding", () => {
    expect(powerCurveReading({ total: 1, rate: 1 }, { total: 1, rate: 0 }).ready).toBe(false);
  });

  test("reports the gap in points and the relative figure separately", () => {
    const reading = powerCurveReading({ total: enough, rate: 0.5 }, { total: enough, rate: 0.74 });
    expect(reading.ready).toBe(true);
    expect(reading.text).toContain("24 percentage points");
    expect(reading.text).toContain("48% more common");
  });

  test("a small gap is reported as no difference rather than a trend", () => {
    const reading = powerCurveReading({ total: enough, rate: 0.52 }, { total: enough, rate: 0.55 });
    expect(reading.ready).toBe(true);
    expect(reading.text).toContain("barely moves the needle");
  });

  test("the losing result gets a sentence too", () => {
    const reading = powerCurveReading({ total: enough, rate: 0.7 }, { total: enough, rate: 0.4 });
    expect(reading.text).toContain("rarer at the top");
    expect(reading.text).toContain("selected for something else");
  });
});

describe("earlyRunsReading", () => {
  test("three runs against one is not a finding", () => {
    const reading = earlyRunsReading(
      { runs: 3, total: 15, rate: 0.53 },
      { runs: 1, total: 5, rate: 0.4 },
      5,
    );
    expect(reading.ready).toBe(false);
    expect(reading.text).toContain(`1 of ${MIN_RUNS}`);
  });

  test("reads in points once both sides have enough runs", () => {
    const reading = earlyRunsReading(
      { runs: MIN_RUNS, total: 50, rate: 0.53 },
      { runs: MIN_RUNS, total: 50, rate: 0.4 },
      5,
    );
    expect(reading.ready).toBe(true);
    expect(reading.text).toContain("13 percentage points");
    expect(reading.text).not.toContain("13% more");
  });
});

describe("societyStateReading", () => {
  const states = (healthy: number, strained: number, failing: number) => [
    { state: "healthy" as const, total: enough, rate: healthy },
    { state: "strained" as const, total: enough, rate: strained },
    { state: "failing" as const, total: enough, rate: failing },
  ];

  test("the figures actually recorded read as no pattern, not as the hoped-for one", () => {
    // Healthy 67%, strained 55%, failing 69% — the shape the site was captioning
    // as "people behave worse as things fall apart" when it plainly was not.
    const reading = societyStateReading(states(0.67, 0.55, 0.69));
    expect(reading.ready).toBe(true);
    expect(reading.text).toContain("So far, no");
    expect(reading.text).toContain("no clear pattern");
  });

  test("names the reversal when the failing society clearly scores highest", () => {
    const reading = societyStateReading(states(0.55, 0.6, 0.72));
    expect(reading.text).toContain("failing society scores highest");
  });

  test("confirms the hypothesis only when the data does", () => {
    expect(societyStateReading(states(0.7, 0.55, 0.4)).text).toContain("So far, yes");
  });

  test("a flat result is reported as no pattern, and still as a result", () => {
    expect(societyStateReading(states(0.6, 0.6, 0.62)).text).toContain("no clear pattern");
  });

  test("waits for both ends before saying anything", () => {
    const reading = societyStateReading([
      { state: "healthy", total: 5, rate: 0.6 },
      { state: "failing", total: 2, rate: 0.9 },
    ]);
    expect(reading.ready).toBe(false);
  });
});
