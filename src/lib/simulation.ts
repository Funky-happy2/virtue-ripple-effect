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

export type Choice = {
  id: string;
  label: string;
  kind: ActionKind;
  /** Stability move at zero power. Amplified toward the tier cap as power grows. */
  baseStability: number;
  /** How much of society this choice touches, relative to the tier's reach. */
  weight: number;
  /**
   * How much this choice grows your standing — deliberately independent of `kind`.
   * Power is not awarded for being good: ruthless self-interest is often the faster
   * climb, and costly integrity can set you back. Tying influence to virtue would
   * make the "virtue rate by power" chart self-fulfilling, since only virtuous
   * players would ever reach the upper tiers.
   */
  influence: number;
  outcome: (tier: PowerTier) => string;
};

export type Scenario = {
  id: string;
  situation: string;
  choices: Choice[];
};

function lower(label: string) {
  return /^[AEIOU]/.test(label) ? `an ${label}` : `a ${label}`;
}
function title(label: string) {
  const l = lower(label);
  return `${l.charAt(0).toUpperCase()}${l.slice(1)}`;
}

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
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} chooses disclosure. Uncertainty shrinks, rumours die, and everyone downstream can plan around the truth.`,
      },
      {
        id: "keep",
        label: "Leave it as it stands and say nothing",
        kind: "vice",
        baseStability: -0.5,
        weight: 1.3,
        influence: 3,
        outcome: (t) =>
          `Silence from ${lower(t.label)} prices fairness. The gain is kept and compounds — and everyone assumes the game is rigged.`,
      },
      {
        id: "quiet-fix",
        label: "Quietly correct it later, but only if asked",
        kind: "vice",
        baseStability: -0.2,
        weight: 0.8,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} waits to be caught before acting. Integrity that depends on discovery isn't really integrity — it's risk management.`,
      },
      {
        id: "allies",
        label: "Report it, but only to your allies — keep rivals in the dark",
        kind: "vice",
        baseStability: -0.12,
        weight: 0.5,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} turns honesty into a weapon. Truth shared selectively buys loyalty — and becomes just another form of leverage.`,
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
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} turns idle surplus into working capital for others — every unit released returns as resilience, and none of it returns as power.`,
      },
      {
        id: "stockpile",
        label: "Hold the stockpile until the price moves",
        kind: "vice",
        baseStability: -0.42,
        weight: 1.1,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} starves the system it depends on. Scarcity becomes manufactured, the stockpile appreciates, and desperation compounds faster than either.`,
      },
      {
        id: "sell-fair",
        label: "Sell at a fair price rather than give it away",
        kind: "virtue",
        baseStability: 0.05,
        weight: 0.7,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} meets the market halfway. It helps, and it pays — but extracting payment from the desperate still costs goodwill.`,
      },
      {
        id: "publicise",
        label: "Donate the surplus publicly and make sure everyone knows",
        kind: "virtue",
        baseStability: 0.03,
        weight: 0.5,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} gives generously — and loudly. The help is real, the reputation is realer, and the spectacle costs the gift some of its meaning.`,
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
        influence: 2,
        outcome: (t) =>
          `By shielding those without leverage, ${lower(t.label)} converts private power into public safety. Fear drops; participation rises; the balance sheet does not.`,
      },
      {
        id: "exploit",
        label: "Let the risk fall where it already lies",
        kind: "vice",
        baseStability: -0.45,
        weight: 1.2,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} lets the weakest carry the downside. The position strengthens, and everyone learns exactly how much protection they can expect: none.`,
      },
      {
        id: "terms",
        label: "Offer to help, but on terms that benefit you",
        kind: "vice",
        baseStability: -0.18,
        weight: 0.9,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} turns protection into a transaction. The vulnerable are helped — but now they owe, and owing to power is its own kind of exposure.`,
      },
      {
        id: "walk-away",
        label: "Do nothing — it's not your responsibility",
        kind: "vice",
        baseStability: -0.1,
        weight: 0.5,
        influence: 0,
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
        influence: 0,
        outcome: (t) =>
          `${title(t.label)} holds the line on shared reality and takes the hit for it. Trust is expensive to build, and it compounds.`,
      },
      {
        id: "convenient",
        label: "Let the convenient version travel",
        kind: "vice",
        baseStability: -0.55,
        weight: 1.5,
        influence: 3,
        outcome: (t) =>
          `The convenient story spreads from ${lower(t.label)} and settles the matter. Trust in shared reality erodes — people stop believing true things, not just false ones.`,
      },
      {
        id: "neither",
        label: "Say nothing and let others decide what happened",
        kind: "vice",
        baseStability: -0.15,
        weight: 0.6,
        influence: 0,
        outcome: (t) =>
          `${title(t.label)} abdicates the truth. In the vacuum, the loudest voice wins — and it is rarely the most honest one.`,
      },
      {
        id: "both-versions",
        label: "Publish both versions and let people judge for themselves",
        kind: "virtue",
        baseStability: 0.07,
        weight: 0.8,
        influence: 2,
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
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} keeps the decision unpurchasable. Process survives contact with self-interest.`,
      },
      {
        id: "accept",
        label: "Accept the arrangement quietly",
        kind: "vice",
        baseStability: -0.52,
        weight: 1.3,
        influence: 3,
        outcome: (t) =>
          `The arrangement is accepted by ${lower(t.label)}, and the patron remembers. Fairness now has a price, and everyone can guess it.`,
      },
      {
        id: "disclose-accept",
        label: "Accept it, but publicly disclose the arrangement",
        kind: "virtue",
        baseStability: 0.04,
        weight: 0.6,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} is transparent about the conflict. Disclosure blunts the corruption — but the arrangement still bends the outcome.`,
      },
      {
        id: "decline-warm",
        label: "Quietly decline but keep the relationship warm for later",
        kind: "vice",
        baseStability: -0.08,
        weight: 0.5,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} declines the bribe but banks the connection. The offer is refused — the door is left ajar, and everyone knows it.`,
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
        influence: -2,
        outcome: (t) =>
          `${title(t.label)} chooses short-term pain for long-term safety, and becomes a target for it. The disruption is real — but so are the lives spared downstream.`,
      },
      {
        id: "bury",
        label: "Bury it — the disruption isn't worth the truth",
        kind: "vice",
        baseStability: -0.48,
        weight: 1.2,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} silences the warning and is rewarded for the calm. The harm continues quietly, and the next discovery will be worse.`,
      },
      {
        id: "gradual",
        label: "Work quietly to fix it from within over time",
        kind: "virtue",
        baseStability: 0.08,
        weight: 0.9,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} chooses reform over spectacle. It is slower and riskier — but change that survives contact with power is change that lasts.`,
      },
      {
        id: "leak",
        label: "Leak it anonymously and let someone else take the heat",
        kind: "vice",
        baseStability: -0.2,
        weight: 0.7,
        influence: 0,
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
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} refuses to weaponise a mistake. The opening closes unused, rivals notice, and the norm against ruin spreads.`,
      },
      {
        id: "crush",
        label: "Use the opening to eliminate the rival",
        kind: "vice",
        baseStability: -0.4,
        weight: 1.1,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} destroys a rival over a mistake and inherits their ground. Everyone learns that defeat is permanent — and fights accordingly.`,
      },
      {
        id: "compete",
        label: "Compete harder on your own merits instead",
        kind: "virtue",
        baseStability: 0.06,
        weight: 0.7,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} ignores the opening and invests in being better. The rival survives — and so does the idea that the field is fair.`,
      },
      {
        id: "negotiate",
        label: "Use the opening to negotiate a better relationship",
        kind: "virtue",
        baseStability: 0.08,
        weight: 0.8,
        influence: 2,
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
        influence: -1,
        outcome: (t) =>
          `${title(t.label)} abandons years of work to meet the moment. The project is gone — but the people it would have served remember who showed up.`,
      },
      {
        id: "abandon-crisis",
        label: "Protect your investment and let the crisis run its course",
        kind: "vice",
        baseStability: -0.5,
        weight: 1.3,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} guards the project while people suffer. The investment matures — and the society it was built for is diminished.`,
      },
      {
        id: "partial",
        label: "Commit partial resources — help, but keep the project alive",
        kind: "virtue",
        baseStability: 0.07,
        weight: 0.9,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} splits the difference. Some are helped, some are not. Pragmatism saves more than heroism — until it doesn't.`,
      },
      {
        id: "delegate",
        label: "Delegate the response to subordinates and stay focused",
        kind: "vice",
        baseStability: -0.12,
        weight: 0.6,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} treats the crisis as someone else's problem. The hierarchy absorbs it — or doesn't — and either way, the distance is noted.`,
      },
    ],
  },
  {
    id: "succession",
    situation:
      "You are choosing who to elevate into the room where decisions get made. One candidate will owe you everything; one will tell you when you are wrong.",
    choices: [
      {
        id: "challenger",
        label: "Elevate the one who will argue with you",
        kind: "virtue",
        baseStability: 0.13,
        weight: 1.1,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} builds a room that can say no. Decisions get slower and considerably better — and the throne gets less comfortable.`,
      },
      {
        id: "loyalist",
        label: "Elevate the one who will owe you",
        kind: "vice",
        baseStability: -0.44,
        weight: 1.2,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} fills the room with debt. Every voice agrees, the grip tightens, and the first bad decision now travels unopposed.`,
      },
      {
        id: "outsider",
        label: "Open the role to people outside your network entirely",
        kind: "virtue",
        baseStability: 0.09,
        weight: 0.9,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} widens the door. The pool improves, the network weakens, and someone unexpected gets a career.`,
      },
      {
        id: "vacant",
        label: "Leave the seat empty and keep the decision yourself",
        kind: "vice",
        baseStability: -0.16,
        weight: 0.7,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} keeps the seat empty and the authority undivided. Nothing is delegated, so nothing is checked.`,
      },
    ],
  },
  {
    id: "platform",
    situation:
      "Someone with a large following wants your endorsement. They are effective, useful to you, and quietly cruel to people with no recourse.",
    choices: [
      {
        id: "refuse-platform",
        label: "Refuse, and say publicly why",
        kind: "virtue",
        baseStability: 0.14,
        weight: 1.2,
        influence: -1,
        outcome: (t) =>
          `${title(t.label)} spends real standing to withhold a platform. The cruelty loses its amplifier; the enmity is permanent.`,
      },
      {
        id: "endorse",
        label: "Endorse them — the reach is worth it",
        kind: "vice",
        baseStability: -0.5,
        weight: 1.4,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} lends legitimacy to cruelty and borrows the audience back. The reach is real. So is what it now carries.`,
      },
      {
        id: "private-word",
        label: "Endorse, but press them privately to change",
        kind: "vice",
        baseStability: -0.19,
        weight: 0.8,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} takes the public benefit and files the objection where nobody can see it. Private conscience, public consent.`,
      },
      {
        id: "abstain",
        label: "Say nothing either way",
        kind: "vice",
        baseStability: -0.11,
        weight: 0.5,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} stays out of it. Neutrality between the cruel and the defenceless is not neutral, but it is comfortable.`,
      },
    ],
  },
  {
    id: "data",
    situation:
      "You are sitting on information about the people who trust you. Using it would work — it would also be a betrayal they would never detect.",
    choices: [
      {
        id: "delete",
        label: "Delete what you don't need and publish what you keep",
        kind: "virtue",
        baseStability: 0.13,
        weight: 1.1,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} gives up an advantage nobody knew existed. The people who trusted ${lower(t.label)} were right to, and will never find out.`,
      },
      {
        id: "exploit-data",
        label: "Use it — nobody will ever know",
        kind: "vice",
        baseStability: -0.53,
        weight: 1.4,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} monetises the trust itself. It works beautifully, which is the problem: the incentive to do it again is now proven.`,
      },
      {
        id: "aggregate",
        label: "Use it, but only in aggregate — no individual is identifiable",
        kind: "vice",
        baseStability: -0.17,
        weight: 0.8,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} finds the defensible version of the betrayal. Nobody is named; everybody is still used.`,
      },
      {
        id: "ask",
        label: "Ask permission, and accept a no",
        kind: "virtue",
        baseStability: 0.1,
        weight: 0.9,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} asks a question that might be answered badly. Consent that can be refused is the only kind worth having.`,
      },
    ],
  },
  {
    id: "credit",
    situation:
      "Work that was mostly someone else's is about to be praised, and the praise is landing on you.",
    choices: [
      {
        id: "redirect",
        label: "Correct the record and name them",
        kind: "virtue",
        baseStability: 0.11,
        weight: 1,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} hands the credit back. It costs a story about ${lower(t.label)} and buys a person a career.`,
      },
      {
        id: "accept-credit",
        label: "Accept it — you led the effort, after all",
        kind: "vice",
        baseStability: -0.38,
        weight: 1.1,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} keeps the credit and the narrative. The reputation compounds; the person who did the work learns what their name is worth.`,
      },
      {
        id: "share-credit",
        label: "Share the credit without correcting the impression",
        kind: "vice",
        baseStability: -0.13,
        weight: 0.6,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} gestures at a team. Generous enough to look good, vague enough to keep the shine.`,
      },
      {
        id: "private-credit",
        label: "Thank them privately and move on",
        kind: "vice",
        baseStability: -0.09,
        weight: 0.5,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} settles the debt where the audience can't hear it. The gratitude is genuine; the ledger stays wrong.`,
      },
    ],
  },
  {
    id: "audit",
    situation:
      "Someone with the authority to ask is asking. A complete answer would be costly, and a narrow answer would be technically true.",
    choices: [
      {
        id: "full-answer",
        label: "Answer completely, including what they didn't think to ask",
        kind: "virtue",
        baseStability: 0.15,
        weight: 1.2,
        influence: 0,
        outcome: (t) =>
          `${title(t.label)} answers the question behind the question and pays for it. Oversight only works on people who let it.`,
      },
      {
        id: "narrow",
        label: "Answer exactly what was asked, nothing more",
        kind: "vice",
        baseStability: -0.41,
        weight: 1.2,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} tells the truth in the shape of a lie. The audit closes clean, and the next one will be asked worse questions.`,
      },
      {
        id: "delay",
        label: "Cooperate slowly enough that the moment passes",
        kind: "vice",
        baseStability: -0.29,
        weight: 1,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} runs out the clock. Nothing is refused, nothing arrives, and the inquiry quietly expires.`,
      },
      {
        id: "volunteer",
        label: "Answer, and volunteer to fix what the answer reveals",
        kind: "virtue",
        baseStability: 0.12,
        weight: 1,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} treats being caught as information. The problem gets smaller instead of quieter.`,
      },
    ],
  },
  {
    id: "numbers",
    situation:
      "You are short of a target that matters. Cutting people would close the gap, and the people are the easiest thing to cut.",
    choices: [
      {
        id: "absorb",
        label: "Miss the target and absorb the consequences yourself",
        kind: "virtue",
        baseStability: 0.14,
        weight: 1.2,
        influence: -2,
        outcome: (t) =>
          `${title(t.label)} takes the miss personally rather than distributing it downward. Standing falls; nobody else's does.`,
      },
      {
        id: "cut",
        label: "Cut deep enough to make the number",
        kind: "vice",
        baseStability: -0.47,
        weight: 1.3,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} makes the number out of other people's livelihoods. The target is hit, the credibility grows, and the cost is paid by people who never saw the target.`,
      },
      {
        id: "cut-shallow",
        label: "Cut, but protect the most vulnerable roles",
        kind: "vice",
        baseStability: -0.21,
        weight: 0.9,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} cuts carefully. Fewer people fall, the number is still made, and the principle is still that people are the variable.`,
      },
      {
        id: "renegotiate",
        label: "Go back and argue the target was wrong",
        kind: "virtue",
        baseStability: 0.09,
        weight: 0.9,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} attacks the target instead of the staff. It rarely works, and it is the only version where nobody is sacrificed.`,
      },
    ],
  },
  {
    id: "favour",
    situation:
      "Someone close to you wants something you can grant. They are not the best candidate, but they are not the worst either.",
    choices: [
      {
        id: "recuse",
        label: "Recuse yourself and let someone else decide",
        kind: "virtue",
        baseStability: 0.12,
        weight: 1,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} gives away a decision rather than be trusted with it. The outcome is uncertain; the process is clean.`,
      },
      {
        id: "grant",
        label: "Grant it — they're qualified enough",
        kind: "vice",
        baseStability: -0.36,
        weight: 1.1,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} converts public authority into private loyalty. The network thickens, and everyone outside it updates on how to get in.`,
      },
      {
        id: "grant-open",
        label: "Grant it, but disclose the relationship",
        kind: "vice",
        baseStability: -0.14,
        weight: 0.7,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} says the quiet part aloud and does it anyway. Disclosure without abstention is just a better-documented favour.`,
      },
      {
        id: "refuse-favour",
        label: "Refuse, and explain why to them directly",
        kind: "virtue",
        baseStability: 0.13,
        weight: 1,
        influence: 0,
        outcome: (t) =>
          `${title(t.label)} spends a relationship to protect a rule. They will not understand, and the rule survives.`,
      },
    ],
  },
  {
    id: "exit",
    situation:
      "You are leaving, and you are taking with you everything you learned about how this place actually works.",
    choices: [
      {
        id: "hand-over",
        label: "Write it all down and hand it to whoever comes next",
        kind: "virtue",
        baseStability: 0.13,
        weight: 1.1,
        influence: 2,
        outcome: (t) =>
          `${title(t.label)} leaves the map behind. The advantage of having been there evaporates, and the next person starts where ${lower(t.label)} finished.`,
      },
      {
        id: "sell-knowledge",
        label: "Take it to whoever pays most for it",
        kind: "vice",
        baseStability: -0.45,
        weight: 1.2,
        influence: 3,
        outcome: (t) =>
          `${title(t.label)} sells the inside of an institution to its competitors. It pays extremely well, and it teaches everyone to trust departures less.`,
      },
      {
        id: "keep-quiet",
        label: "Keep it to yourself — you earned it",
        kind: "vice",
        baseStability: -0.15,
        weight: 0.6,
        influence: 1,
        outcome: (t) =>
          `${title(t.label)} leaves with the map in their pocket. Nothing is betrayed and nothing is passed on; the same mistakes get made again on schedule.`,
      },
      {
        id: "warn",
        label: "Tell them the one thing that is genuinely broken",
        kind: "virtue",
        baseStability: 0.11,
        weight: 1,
        influence: 0,
        outcome: (t) =>
          `${title(t.label)} makes an unwelcome parting gift of the truth. It burns the last of the goodwill and might save the place.`,
      },
    ],
  },
];

const MAX_LOG = Math.log10(POWER_TIERS[POWER_TIERS.length - 1]!.level);

/** 0..1 log-scaled power, so each tier feels like a step rather than a leap. */
export function intensity(level: number) {
  return Math.log10(level) / MAX_LOG;
}

export function choiceLives(choice: Choice, tier: PowerTier) {
  return Math.round(tier.reach * choice.weight);
}

/**
 * Stability move for one choice. At zero power the raw `baseStability` applies; as
 * power grows the result is pulled toward a tier cap, so the same decision that
 * nudged a neighbourhood can move a civilisation.
 *
 * The two sides are deliberately asymmetric. Virtue is throttled by how much room
 * is left to improve, while vice gets harsher as the society gets more fragile —
 * trust is slow to build and collapses faster the less of it remains.
 */
export function choiceStability(choice: Choice, tier: PowerTier, currentStability: number) {
  const eased = Math.pow(intensity(tier.level), 1.6);

  if (choice.kind === "virtue") {
    const room = Math.max(0.2, (100 - currentStability) / 100);
    const cap = 25 * room;
    return choice.baseStability * (1 - eased) + cap * eased;
  }

  const fragility = 1 - currentStability / 100;
  // Floors the worst case at -35 even from a perfectly healthy society, so the
  // top-tier shockwave lands rather than being absorbed.
  const cap = -50 * (0.7 + 0.3 * fragility);
  return choice.baseStability * (1 - eased) + cap * eased;
}

/**
 * Standing gained or lost. Reads straight from the choice: power is not a reward
 * for virtue, and treating it as one is what makes the question interesting.
 */
export function influenceDelta(choice: Choice) {
  return choice.influence;
}

export const TIER_THRESHOLDS = [0, 3, 7, 12, 18, 25, 33, 42];

export function tierForInfluence(influence: number) {
  let idx = 0;
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (influence >= TIER_THRESHOLDS[i]!) idx = i;
  }
  return idx;
}

export function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return `${n}`;
}

export const QUOTES: { text: string; author: string }[] = [
  { text: "With great power comes great responsibility.", author: "Uncle Ben, Spider-Man" },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.",
    author: "Aristotle",
  },
  { text: "The measure of a man is what he does with power.", author: "Plato" },
  {
    text: "Nearly all men can stand adversity, but few can stand power.",
    author: "Abraham Lincoln",
  },
  { text: "The price of greatness is responsibility.", author: "Winston Churchill" },
  {
    text: "Power tends to corrupt, and absolute power corrupts absolutely.",
    author: "Lord Acton",
  },
  {
    text: "In a time of universal deceit, telling the truth is a revolutionary act.",
    author: "George Orwell",
  },
  { text: "From everyone who has been given much, much will be required.", author: "Luke 12:48" },
];

/**
 * Deterministic ordering helper — the same seed always yields the same permutation,
 * so a shuffled list rendered on the server matches the one rendered on the client.
 */
export function seededShuffle<T>(items: readonly T[], seedSource: string): T[] {
  let seed = 2166136261;
  for (const ch of seedSource) {
    seed ^= ch.charCodeAt(0);
    seed = Math.imul(seed, 16777619) >>> 0;
  }
  const next = () => {
    // xorshift32 — small, dependency-free, and good enough to decorrelate order.
    seed ^= seed << 13;
    seed >>>= 0;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    seed >>>= 0;
    return seed / 0x1_0000_0000;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The scenario for a given decision number. Scenarios are shuffled per lap through
 * the deck, so a long run does not replay the same sequence in the same order.
 */
export function scenarioForStep(step: number): Scenario {
  const lap = Math.floor(step / SCENARIOS.length);
  const deck = lap === 0 ? SCENARIOS : seededShuffle(SCENARIOS, `lap-${lap}`);
  return deck[step % SCENARIOS.length]!;
}

/** Choice order for a scenario, varied per lap so repeats do not look identical. */
export function choicesForStep(scenario: Scenario, step: number): Choice[] {
  const lap = Math.floor(step / SCENARIOS.length);
  return seededShuffle(scenario.choices, `${scenario.id}-${lap}`);
}

/**
 * How many decisions each strategy needs to reach the top rung, playing the same
 * way every time. Computed rather than written down so the numbers quoted on the
 * page can never drift from the scenario table.
 *
 * These are the honest caveat on the "virtue rate by power" chart: the ruthless
 * climb is roughly twice as fast, so the upper-tier bars are filled by visitors
 * who took the paying option most of the way up. That is a selection effect, and
 * the page has to say so rather than read the chart as "power makes people better".
 */
function decisionsToTopTier(pick: (scenario: Scenario) => Choice | undefined): number {
  let influence = 0;
  for (let step = 0; step < 500; step++) {
    const choice = pick(scenarioForStep(step));
    if (choice) influence = Math.max(0, influence + influenceDelta(choice));
    if (tierForInfluence(influence) === POWER_TIERS.length - 1) return step + 1;
  }
  return Infinity;
}

function highestPaying(choices: readonly Choice[]): Choice | undefined {
  return [...choices].sort((a, b) => b.influence - a.influence)[0];
}

export const CLIMB = {
  /** Best-paying virtuous option in every situation. */
  virtuous: decisionsToTopTier((s) => highestPaying(s.choices.filter((c) => c.kind === "virtue"))),
  /** Best-paying option of any kind — usually, but not always, a vice. */
  ruthless: decisionsToTopTier((s) => highestPaying(s.choices)),
};

/**
 * What the author labelled, counted from the scenario table so the page can
 * declare its own definition rather than presenting a value judgement as a
 * measurement. `costly` is the number of options that lose you standing — every
 * one of them is a virtuous one, which is the clearest statement the model makes.
 */
const ALL_AUTHORED = SCENARIOS.flatMap((s) => s.choices);

export const LABEL_COUNTS = {
  scenarios: SCENARIOS.length,
  choices: ALL_AUTHORED.length,
  virtuous: ALL_AUTHORED.filter((c) => c.kind === "virtue").length,
  costly: ALL_AUTHORED.filter((c) => c.influence < 0).length,
};
