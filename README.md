# Virtue Ripple — The Leverage of Virtue Simulation

**Should people with more power do more virtuous actions?**

An interactive ethical sandbox built around that question. You start as an average
citizen and face a series of unlabelled situations — no option is marked "virtuous"
or "vicious", and no score is shown in advance. Only the consequences reveal what
your choice was worth.

Every decision does two things: it moves society's stability, and it moves *your own
influence*. Act well and you climb the power ladder, from Average Citizen through
Local Mayor and National Leader to Planetary Steward. The higher you climb, the more
your choices are multiplied — the same decision that touched two people now touches
five hundred million.

## The empirical half

The prescriptive question ("should they?") is the visitor's to answer. The app answers
the descriptive one ("do they?") with real data: every decision is recorded to Postgres,
and two panels feed it back.

- **What everyone else did** — for the situation you just faced, how everyone else
  answered it, broken down by how much power *they* held at the time.
- **Virtue rate by power** — the virtue rate at each tier of the ladder across every
  decision ever made here, with a plain-language reading of the trend.

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
| `decisions` | one row per choice: scenario, choice, virtue/vice, power tier, stability delta, lives affected |
