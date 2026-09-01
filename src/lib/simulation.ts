export type PowerTier = {
  label: string;
  level: number;
  levelLabel: string;
  reach: number; // base lives touched at this tier
};

export const POWER_TIERS: PowerTier[] = [
  { label: "Average Citizen", level: 1, levelLabel: "1", reach: 2 },
  { label: "Business Owner", level: 10, levelLabel: "10", reach: 40 },
  { label: "Local Mayor", level: 100, levelLabel: "100", reach: 1_200 },
  { label: "National Leader", level: 10_000, levelLabel: "10,000", reach: 4_000_000 },
  {
    label: "Global CEO / Tech Titan",
    level: 1_000_000,
    levelLabel: "1,000,000",
    reach: 20_000_000,
  },
];

export type ActionKind = "virtue" | "vice";

export type EthicalAction = {
  id: string;
  label: string;
  kind: ActionKind;
  /** base stability delta at power level 1 */
  baseStability: number;
  /** base lives multiplier */
  weight: number;
  describe: (tier: PowerTier) => string;
};

export const ACTIONS: EthicalAction[] = [
  {
    id: "honesty",
    label: "Honesty & Transparency",
    kind: "virtue",
    baseStability: 0.1,
    weight: 1,
    describe: (t) =>
      `When ${article(t.label)} chooses radical honesty, uncertainty shrinks. Records open, rumours die, and everyone downstream can finally plan around the truth.`,
  },
  {
    id: "generosity",
    label: "Generous Resource Sharing",
    kind: "virtue",
    baseStability: 0.12,
    weight: 1.2,
    describe: (t) =>
      `${article(t.label, true)} sharing surplus turns idle resources into working capital for others — every unit given away returns as resilience.`,
  },
  {
    id: "protect",
    label: "Protecting the Vulnerable",
    kind: "virtue",
    baseStability: 0.14,
    weight: 1.1,
    describe: (t) =>
      `By shielding those with no leverage of their own, ${article(t.label)} converts private power into public safety. Fear drops; participation rises.`,
  },
  {
    id: "bribe",
    label: "Taking a Bribe / Corruption",
    kind: "vice",
    baseStability: -0.5,
    weight: 1.3,
    describe: (t) =>
      `A bribe accepted by ${article(t.label)} prices fairness. Once outcomes can be bought, everyone must assume the game is rigged.`,
  },
  {
    id: "hoard",
    label: "Hoarding Resources",
    kind: "vice",
    baseStability: -0.42,
    weight: 1.1,
    describe: (t) =>
      `${article(t.label, true)} hoarding starves the system it depends on. Scarcity is manufactured, and desperation compounds faster than the stockpile.`,
  },
  {
    id: "misinfo",
    label: "Spreading Misinformation",
    kind: "vice",
    baseStability: -0.55,
    weight: 1.5,
    describe: (t) =>
      `When ${article(t.label)} spreads misinformation, trust in shared reality erodes. People stop believing true things, not just false ones.`,
  },
];

function article(label: string, possessive = false) {
  const lower = /^[AEIOU]/.test(label) ? `an ${label}` : `a ${label}`;
  return possessive ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}'s` : lower;
}

/** log-scaled intensity 0..1 across the tier range */
export function intensity(level: number) {
  return Math.log10(level) / 6;
}

export function livesAffected(action: EthicalAction, tier: PowerTier) {
  return Math.round(tier.reach * action.weight);
}

export function stabilityDelta(action: EthicalAction, tier: PowerTier) {
  const t = intensity(tier.level);
  const cap = action.kind === "virtue" ? 25 : -50;
  const eased = Math.pow(t, 1.6);
  return action.baseStability * (1 - eased) + cap * eased;
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

export const QUOTES: { text: string; author: string }[] = [
  {
    text: "With great power comes great responsibility.",
    author: "Uncle Ben, Spider-Man",
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.",
    author: "Aristotle",
  },
  {
    text: "The measure of a man is what he does with power.",
    author: "Plato",
  },
  {
    text: "Nearly all men can stand adversity, but few can stand power.",
    author: "Abraham Lincoln",
  },
  {
    text: "Power tends to corrupt, and absolute power corrupts absolutely.",
    author: "Lord Acton",
  },
];

/* ---------- Situations: neutral choices, hidden moral valence ---------- */

export type Choice = {
  id: string;
  /** neutral, non-judgemental phrasing shown to the player */
  label: string;
  /** hidden from the UI until after the choice is made */
  kind: ActionKind;
  baseStability: number;
  weight: number;
  /** consequence narration revealed after choosing */
  outcome: (tier: PowerTier) => string;
};

export type Scenario = {
  id: string;
  situation: string;
  choices: Choice[];
};

export const SCENARIOS: Scenario[] = [
  {
    id: "ledger",
    situation:
      "An error in the ledger has quietly worked in your favour. Nobody has noticed, and correcting it costs you.",
    choices: [
      {
        id: "disclose",
        label: "Open the books and report the error yourself",
        kind: "virtue",
        baseStability: 0.1,
        weight: 1,
        outcome: (t) =>
          `${title(t.label)} chooses disclosure. Uncertainty shrinks, rumours die, and everyone downstream can plan around the truth.`,
      },
      {
        id: "keep",
        label: "Leave it as it stands and say nothing",
        kind: "vice",
        baseStability: -0.5,
        weight: 1.3,
        outcome: (t) =>
          `Silence from ${lower(t.label)} prices fairness. Once outcomes can quietly be kept, everyone assumes the game is rigged.`,
      },
    ],
  },
  {
    id: "surplus",
    situation:
      "You are holding more of a scarce resource than you need. Others nearby are running short.",
    choices: [
      {
        id: "share",
        label: "Release the surplus to those running short",
        kind: "virtue",
        baseStability: 0.12,
        weight: 1.2,
        outcome: (t) =>
          `${title(t.label)} turns idle surplus into working capital for others — every unit released returns as resilience.`,
      },
      {
        id: "stockpile",
        label: "Hold the stockpile until the price moves",
        kind: "vice",
        baseStability: -0.42,
        weight: 1.1,
        outcome: (t) =>
          `${title(t.label)} starves the system it depends on. Scarcity becomes manufactured, and desperation compounds faster than the stockpile.`,
      },
    ],
  },
  {
    id: "leverage",
    situation:
      "Someone with no leverage of their own is exposed to a risk you could absorb — or exploit.",
    choices: [
      {
        id: "shield",
        label: "Absorb the risk on their behalf",
        kind: "virtue",
        baseStability: 0.14,
        weight: 1.1,
        outcome: (t) =>
          `By shielding those without leverage, ${lower(t.label)} converts private power into public safety. Fear drops; participation rises.`,
      },
      {
        id: "exploit",
        label: "Let the risk fall where it already lies",
        kind: "vice",
        baseStability: -0.45,
        weight: 1.2,
        outcome: (t) =>
          `${title(t.label)} lets the weakest carry the downside. Everyone learns exactly how much protection they can expect: none.`,
      },
    ],
  },
  {
    id: "story",
    situation:
      "A convenient version of events would settle the matter today. The accurate version takes longer and costs you standing.",
    choices: [
      {
        id: "accurate",
        label: "Publish the slower, accurate account",
        kind: "virtue",
        baseStability: 0.11,
        weight: 1,
        outcome: (t) =>
          `${title(t.label)} holds the line on shared reality. Trust is expensive to build and it compounds.`,
      },
      {
        id: "convenient",
        label: "Let the convenient version travel",
        kind: "vice",
        baseStability: -0.55,
        weight: 1.5,
        outcome: (t) =>
          `The convenient story spreads from ${lower(t.label)}. Trust in shared reality erodes — people stop believing true things, not just false ones.`,
      },
    ],
  },
  {
    id: "access",
    situation:
      "A decision is yours to make, and an interested party offers to make your life considerably easier.",
    choices: [
      {
        id: "refuse",
        label: "Decide on the merits and log the offer",
        kind: "virtue",
        baseStability: 0.13,
        weight: 1.1,
        outcome: (t) =>
          `${title(t.label)} keeps the decision unpurchasable. Process survives contact with self-interest.`,
      },
      {
        id: "accept",
        label: "Accept the arrangement quietly",
        kind: "vice",
        baseStability: -0.52,
        weight: 1.3,
        outcome: (t) =>
          `The arrangement is accepted by ${lower(t.label)}. Fairness now has a price, and everyone can guess it.`,
      },
    ],
  },
];

function lower(label: string) {
  return /^[AEIOU]/.test(label) ? `an ${label}` : `a ${label}`;
}
function title(label: string) {
  const l = lower(label);
  return `${l.charAt(0).toUpperCase()}${l.slice(1)}`;
}

export function choiceLives(choice: Choice, tier: PowerTier) {
  return Math.round(tier.reach * choice.weight);
}

export function choiceStability(choice: Choice, tier: PowerTier) {
  const t = intensity(tier.level);
  const cap = choice.kind === "virtue" ? 25 : -50;
  const eased = Math.pow(t, 1.6);
  return choice.baseStability * (1 - eased) + cap * eased;
}

/** influence required to reach each tier index */
export const TIER_THRESHOLDS = [0, 3, 8, 16, 28];

export function tierForInfluence(influence: number) {
  let idx = 0;
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (influence >= TIER_THRESHOLDS[i]!) idx = i;
  }
  return idx;
}

/** influence gained (virtue) or lost (vice) by a choice */
export function influenceDelta(choice: Choice) {
  return choice.kind === "virtue" ? 2 : -3;
}
