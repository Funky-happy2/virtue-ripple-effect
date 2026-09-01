export type PowerTier = {
  label: string;
  level: number;
  levelLabel: string;
  reach: number; // base lives touched at this tier
};

export const POWER_TIERS: PowerTier[] = [
  { label: "Average Citizen", level: 1, levelLabel: "1", reach: 2 },
  { label: "Community Organiser", level: 5, levelLabel: "5", reach: 15 },
  { label: "Business Owner", level: 10, levelLabel: "10", reach: 40 },
  { label: "Local Mayor", level: 100, levelLabel: "100", reach: 1_200 },
  { label: "Regional Governor", level: 1_000, levelLabel: "1,000", reach: 15_000 },
  { label: "National Leader", level: 10_000, levelLabel: "10,000", reach: 4_000_000 },
  {
    label: "Global CEO / Tech Titan",
    level: 1_000_000,
    levelLabel: "1,000,000",
    reach: 20_000_000,
  },
  {
    label: "Planetary Steward",
    level: 100_000_000,
    levelLabel: "100,000,000",
    reach: 500_000_000,
  },
];

export type ActionKind = "virtue" | "vice";

export type EthicalAction = {
  id: string;
  label: string;
  kind: ActionKind;
  baseStability: number;
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

const MAX_LOG = Math.log10(POWER_TIERS[POWER_TIERS.length - 1]!.level);
export function intensity(level: number) {
  return Math.log10(level) / MAX_LOG;
}

export function livesAffected(action: EthicalAction, tier: PowerTier) {
  return Math.round(tier.reach * action.weight);
}

export function stabilityDelta(
  action: EthicalAction,
  tier: PowerTier,
  currentStability: number,
) {
  return choiceStability(
    { kind: action.kind, baseStability: action.baseStability, weight: action.weight } as Choice,
    tier,
    currentStability,
  );
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

export const QUOTES: { text: string; author: string }[] = [
  { text: "With great power comes great responsibility.", author: "Uncle Ben, Spider-Man" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle" },
  { text: "The measure of a man is what he does with power.", author: "Plato" },
  { text: "Nearly all men can stand adversity, but few can stand power.", author: "Abraham Lincoln" },
  { text: "The price of greatness is responsibility.", author: "Winston Churchill" },
  { text: "Power tends to corrupt, and absolute power corrupts absolutely.", author: "Lord Acton" },
  { text: "In a time of universal deceit, telling the truth is a revolutionary act.", author: "George Orwell" },
  { text: "From everyone who has been given much, much will be required.", author: "Luke 12:48" },
];

export type Choice = {
  id: string;
  label: string;
  kind: ActionKind;
  baseStability: number;
  weight: number;
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
      {
        id: "quiet-fix",
        label: "Quietly correct it later, but only if asked",
        kind: "vice",
        baseStability: -0.2,
        weight: 0.8,
        outcome: (t) =>
          `${title(t.label)} waits to be caught before acting. Integrity that depends on discovery isn't really integrity — it's risk management.`,
      },
      {
        id: "allies",
        label: "Report it, but only to your allies — keep rivals in the dark",
        kind: "vice",
        baseStability: -0.12,
        weight: 0.5,
        outcome: (t) =>
          `${title(t.label)} turns honesty into a weapon. Truth shared selectively becomes just another form of leverage.`,
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
      {
        id: "sell-fair",
        label: "Sell at a fair price rather than give it away",
        kind: "virtue",
        baseStability: 0.05,
        weight: 0.7,
        outcome: (t) =>
          `${title(t.label)} meets the market halfway. It helps — but extracting payment from the desperate still costs goodwill.`,
      },
      {
        id: "publicise",
        label: "Donate the surplus publicly and make sure everyone knows",
        kind: "virtue",
        baseStability: 0.03,
        weight: 0.5,
        outcome: (t) =>
          `${title(t.label)} gives generously — and loudly. The help is real, but the spectacle costs the gift some of its meaning.`,
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
      {
        id: "terms",
        label: "Offer to help, but on terms that benefit you",
        kind: "vice",
        baseStability: -0.18,
        weight: 0.9,
        outcome: (t) =>
          `${title(t.label)} turns protection into a transaction. The vulnerable are helped — but now they owe, and owing to power is its own kind of exposure.`,
      },
      {
        id: "walk-away",
        label: "Do nothing — it's not your responsibility",
        kind: "vice",
        baseStability: -0.1,
        weight: 0.5,
        outcome: (t) =>
          `${title(t.label)} walks past. The risk falls, the vulnerable fall, and the distance between power and consequence grows by one more step.`,
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
      {
        id: "neither",
        label: "Say nothing and let others decide what happened",
        kind: "vice",
        baseStability: -0.15,
        weight: 0.6,
        outcome: (t) =>
          `${title(t.label)} abdicates the truth. In the vacuum, the loudest voice wins — and it is rarely the most honest one.`,
      },
      {
        id: "both-versions",
        label: "Publish both versions and let people judge for themselves",
        kind: "virtue",
        baseStability: 0.07,
        weight: 0.8,
        outcome: (t) =>
          `${title(t.label)} refuses to curate. People are trusted with the full picture — and trust, once given, tends to be returned.`,
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
      {
        id: "disclose-accept",
        label: "Accept it, but publicly disclose the arrangement",
        kind: "virtue",
        baseStability: 0.04,
        weight: 0.6,
        outcome: (t) =>
          `${title(t.label)} is transparent about the conflict. Disclosure blunts the corruption — but the arrangement still bends the outcome.`,
      },
      {
        id: "decline-warm",
        label: "Quietly decline but keep the relationship warm for later",
        kind: "vice",
        baseStability: -0.08,
        weight: 0.5,
        outcome: (t) =>
          `${title(t.label)} declines the bribe but banks the connection. The offer is refused — but the door is left ajar, and everyone knows it.`,
      },
    ],
  },
  {
    id: "whistle",
    situation:
      "You discover a systemic problem that, if exposed, will disrupt many lives but prevent future harm.",
    choices: [
      {
        id: "expose",
        label: "Expose the problem and accept the disruption",
        kind: "virtue",
        baseStability: 0.15,
        weight: 1.3,
        outcome: (t) =>
          `${title(t.label)} chooses short-term pain for long-term safety. The disruption is real — but so are the lives spared downstream.`,
      },
      {
        id: "bury",
        label: "Bury it — the disruption isn't worth the truth",
        kind: "vice",
        baseStability: -0.48,
        weight: 1.2,
        outcome: (t) =>
          `${title(t.label)} silences the warning. The harm continues quietly, and the next discovery will be worse.`,
      },
      {
        id: "gradual",
        label: "Work quietly to fix it from within over time",
        kind: "virtue",
        baseStability: 0.08,
        weight: 0.9,
        outcome: (t) =>
          `${title(t.label)} chooses reform over spectacle. It is slower and riskier — but change that survives contact with power is change that lasts.`,
      },
      {
        id: "leak",
        label: "Leak it anonymously and let someone else take the heat",
        kind: "vice",
        baseStability: -0.2,
        weight: 0.7,
        outcome: (t) =>
          `${title(t.label)} exposes the truth through a back channel. The problem surfaces — but so does the lesson that accountability is something you can outsource.`,
      },
    ],
  },
  {
    id: "rival",
    situation:
      "A rival's mistake has given you an opening. You could use it to eliminate them — or let it pass.",
    choices: [
      {
        id: "mercy",
        label: "Let the mistake pass without exploiting it",
        kind: "virtue",
        baseStability: 0.12,
        weight: 1.0,
        outcome: (t) =>
          `${title(t.label)} refuses to weaponise a mistake. Rivals notice, and the norm against ruin spreads.`,
      },
      {
        id: "crush",
        label: "Use the opening to eliminate the rival",
        kind: "vice",
        baseStability: -0.4,
        weight: 1.1,
        outcome: (t) =>
          `${title(t.label)} destroys a rival over a mistake. Everyone learns that defeat is permanent — and fights accordingly.`,
      },
      {
        id: "compete",
        label: "Compete harder on your own merits instead",
        kind: "virtue",
        baseStability: 0.06,
        weight: 0.7,
        outcome: (t) =>
          `${title(t.label)} ignores the opening and invests in being better. The rival survives — and so does the idea that the field is fair.`,
      },
      {
        id: "negotiate",
        label: "Use the opening to negotiate a better relationship with the rival",
        kind: "virtue",
        baseStability: 0.08,
        weight: 0.8,
        outcome: (t) =>
          `${title(t.label)} turns weakness into diplomacy. The rival keeps their dignity, and both sides gain something neither could take by force.`,
      },
    ],
  },
  {
    id: "crisis",
    situation:
      "A crisis is unfolding. You have the resources to help, but doing so means sacrificing a long-term project you've invested in heavily.",
    choices: [
      {
        id: "sacrifice",
        label: "Abandon the project and redirect everything to the crisis",
        kind: "virtue",
        baseStability: 0.16,
        weight: 1.4,
        outcome: (t) =>
          `${title(t.label)} abandons years of work to meet the moment. The project is gone — but the people it would have served remember who showed up.`,
      },
      {
        id: "abandon-crisis",
        label: "Protect your investment and let the crisis run its course",
        kind: "vice",
        baseStability: -0.5,
        weight: 1.3,
        outcome: (t) =>
          `${title(t.label)} guards the project while people suffer. The investment survives — but the society it was built for is diminished.`,
      },
      {
        id: "partial",
        label: "Commit partial resources — help, but keep the project alive",
        kind: "virtue",
        baseStability: 0.07,
        weight: 0.9,
        outcome: (t) =>
          `${title(t.label)} splits the difference. Some are helped, some are not. Pragmatism saves more than heroism — until it doesn't.`,
      },
      {
        id: "delegate",
        label: "Delegate the response to subordinates and stay focused",
        kind: "vice",
        baseStability: -0.12,
        weight: 0.6,
        outcome: (t) =>
          `${title(t.label)} treats the crisis as someone else's problem. The hierarchy absorbs it — or doesn't — and either way, the distance is noted.`,
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

export function choiceStability(
  choice: Choice,
  tier: PowerTier,
  currentStability: number,
) {
  const t = intensity(tier.level);
  const eased = Math.pow(t, 1.6);

  if (choice.kind === "virtue") {
    const room = Math.max(0.2, (100 - currentStability) / 100);
    const cap = 25 * room;
    return choice.baseStability * (1 - eased) + cap * eased;
  } else {
    const fragility = 1 - currentStability / 100;
    const cap = -50 * (0.4 + 0.6 * fragility);
    return choice.baseStability * (1 - eased) + cap * eased;
  }
}

export const TIER_THRESHOLDS = [0, 4, 10, 18, 28, 42, 60, 82];

export function tierForInfluence(influence: number) {
  let idx = 0;
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (influence >= TIER_THRESHOLDS[i]!) idx = i;
  }
  return idx;
}

export function influenceDelta(choice: Choice) {
  if (choice.kind === "virtue") {
    return choice.weight >= 1 ? 2 : 1;
  }
  return choice.weight >= 1 ? -3 : -1;
}
