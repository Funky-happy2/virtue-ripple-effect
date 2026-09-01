# Agent Notes

## Project
Virtue Ripple — "The Leverage of Virtue Simulation". A Vite + TanStack Start SSR app
(React 19, Tailwind v4) exploring whether people with more power should — and do —
act more virtuously. Bun is the local package manager; Render builds with npm.

## Architecture
- `src/lib/simulation.ts` — power tiers, scenarios, and the stability/influence maths. Pure, no I/O.
- `src/components/SocietyCanvas.tsx` — the canvas ripple visualiser.
- `src/lib/telemetry.ts` — TanStack Start server functions that read and write decisions.
- `src/server/db.ts` — Postgres (Neon) connection. Server-only; `vite.config.ts` enforces
  this via `importProtection` on `**/server/**`.
- `db/schema.sql` — idempotent schema; apply with `npm run db:migrate`.

## Conventions
- Aggregate reads are **POST** server functions on purpose. A GET server fn is a plain
  cacheable URL, and the browser HTTP cache will serve a stale count back, hiding the
  visitor's own decision from the totals they are shown.
- Everything DB-touching goes through `withDb(fn, fallback)`. The simulation must stay
  fully playable when Postgres is unreachable — a database outage degrades the aggregate
  panels, it never takes the page down.
- Anything rendered during SSR must be deterministic. The scenario choice order is
  seeded from the scenario id for exactly this reason.

## Verification
- `npm run build && npm start` then `curl -sf localhost:3000/` must return 200.
- When testing in a browser, wait for hydration before clicking — a click on the SSR
  markup before React attaches does nothing, and reads like a broken button.
