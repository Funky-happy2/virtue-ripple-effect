# Virtue Ripple — The Leverage of Virtue Simulation

**Should people with more power do more virtuous actions?**

An interactive ethical sandbox built around that question. You start as an average
citizen and face a series of unlabelled situations — no option is marked "virtuous"
or "vicious", and no score is shown in advance. Only the consequences reveal what
your choice was worth.

Every decision does two things: it moves society's stability, and it moves *your own
influence*. Influence is what moves you up the ladder, from Average Citizen through
Local Mayor and National Leader to Planetary Steward — and the higher you climb, the
more your choices are multiplied. The same decision that touched two people now
touches five hundred million.

Crucially, **influence is not a reward for virtue.** Ruthless self-interest is the
faster climb; costly integrity can set you back. A player who takes every bribe
reaches the top in about fourteen decisions with society in ruins. A player who does
the right thing *visibly and competently* gets there in about twenty-four with
society thriving. A player who sacrifices themselves at every turn stays small.

That separation is deliberate. If power were awarded for goodness, the chart below
would only ever measure its own scoring rule.

## The empirical half

The prescriptive question ("should they?") is the visitor's to answer. The app answers
the descriptive one ("do they?") with real data: every decision is recorded to Postgres,
and two panels feed it back.

- **What everyone else did** — for the situation you just faced, how everyone else
  answered it, broken down by how much power *they* held at the time.
- **Virtue rate by power** — the virtue rate at each tier of the ladder across every
  decision ever made here, with a plain-language reading of the trend.
- **Across every run** — whether the visitors who *became* powerful behaved
  differently in their first five decisions than those who never did, and whether
  people act better or worse once society is already failing.

Each panel refuses to state a finding until both sides of its comparison have enough
behind them, reports differences in percentage points rather than percent, and says
whether it is counting decisions or visitors. The headline chart also carries its own
confound in plain sight: ruthlessness climbs the ladder in about fourteen decisions and
virtue needs about twenty-four, so the upper-tier bars over-represent players who took
whatever paid. The chart shows how people behave once they have arrived, not what
arriving did to them.

The whole decision log can be downloaded as CSV from the footer — Render's free instance
has no durable disk, so a day's collected data needs somewhere else to live.

## Stack

Vite · TanStack Start (SSR) · React 19 · Tailwind v4 · Postgres (Neon) · deployed on Render.

## Development

Requires Node 22+ and [Bun](https://bun.sh) (or npm).

```sh
bun install
cp .env.example .env      # then fill in DATABASE_URL
bun run db:migrate        # creates the runs + decisions tables
bun run dev
```

The simulation runs fine without `DATABASE_URL` — the aggregate panels just report
that they have no data yet.

### Production build

```sh
bun run build
bun run start             # serves .output/server/index.mjs
```

## Deployment

`render.yaml` describes the Render web service. `DATABASE_URL` is marked `sync: false`,
so set it in the Render dashboard rather than committing it.

## Database

`db/schema.sql` is idempotent — re-running it is safe.

| table | holds |
| --- | --- |
| `runs` | one row per visitor session |
| `decisions` | one row per choice: scenario, choice, virtue/vice, power tier, stability before and delta, lives affected |

## Tests

```sh
bun test
```

Covers the simulation maths: tier and threshold consistency, that power amplifies a
choice, that vice hits harder as society weakens, that stability stays inside 0..100
under repeated application, that the deterministic shuffle is stable (the SSR
contract), and that both a vicious and a virtuous run can reach the top tier.
