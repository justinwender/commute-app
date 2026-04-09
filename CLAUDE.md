@AGENTS.md

# Commute Route PWA

## Stack
- Next.js (App Router) + TypeScript, plain CSS (no Tailwind), Upstash Redis (not @vercel/kv — deprecated)
- MTA GTFS-RT feeds via `gtfs-realtime-bindings`, push via `web-push` (VAPID)
- PWA with manual service worker (`public/sw.js`), no next-pwa plugin

## Architecture
- Static route data in `app/data.ts`, live MTA conditions overlay from `/api/alerts` (reads Upstash Redis)
- Cron agent `/api/notify` runs every 10 min weekdays 6am–9pm, fetches MTA feeds → updates KV → pushes if threshold met
- `lib/mta.ts` parses protobuf feeds; `lib/conditions.ts` maps to dot ratings
- Reference UI in `Reference/index.html` — source of truth for design, do not modify

## Gotchas
- `@vercel/kv` is deprecated → use `@upstash/redis` with `KV_REST_API_URL` / `KV_REST_API_TOKEN`
- TypeScript strict mode: `Uint8Array` not assignable to `BufferSource` — return `.buffer as ArrayBuffer`
- GTFS-RT `alert.effect` type is `Effect | null` not `number` — cast with `as number | undefined`
- Redis warnings during build are expected when KV env vars are unset (they're set in Vercel)

## Commands
- `npx next build` — build and type-check
- `npm run dev` — local dev server on port 3000

## Deploy
- Vercel with Upstash Redis integration
- Required env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`, `CRON_SECRET`, `MTA_API_KEY`
