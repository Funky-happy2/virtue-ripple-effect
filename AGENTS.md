# Base44 Agent Notes

## Project
Virtue Ripple — "The Leverage of Virtue Simulation". A Vite + TanStack Start SSR app (React 19, Tailwind v4) using Bun as the package manager/runtime. No backend services, databases, or external API keys required.

## Setup
- Runtime: `oven/bun:1` Docker image, source bind-mounted at `/app`.
- Dev command: `bun install && bun run dev -- --host 0.0.0.0 --port 3000`.
- The `@lovable.dev/vite-tanstack-config` preset handles TanStack/React/Tailwind/Nitro plugins and sandbox detection (port/host/strictPort). Do NOT add those plugins manually.
- `vite.config.ts` adds `server.allowedHosts: true` so the preview proxy hostname is accepted — without it, Vite 8 returns 403 on dev assets.

## Verification
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` must return 200 (page + assets).
- The app is purely client-side interactive after SSR hydration; no API calls.
