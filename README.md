# Commute

A PWA that compares commute routes from Hudson Yards / Port Authority to 594 Broadway (SoHo), overlaying live MTA data on top of static route analysis.

## Features

- **Route comparison** — ranked route cards with dot ratings for reliability, crowding, walk time, and transfers
- **Origin + weather toggles** — Hudson Yards vs Port Authority, good vs bad weather rankings
- **Live MTA overlay** — reliability and crowding dots update from real-time GTFS-RT feeds
- **Alert banner** — active service alerts for watched lines (7, E, C, R, W, B, D, F, M)
- **Push notifications** — alerts for significant delays on high-priority lines (7, E, C, R)
- **PWA** — installable to iPhone home screen, offline support for static UI
- **Dark mode** — automatic via `prefers-color-scheme`

## Architecture

```
Static layer (route cards, walk times, rankings)
  ↕ merged at render time
Live layer (reliability dots, crowding dots, est. time deltas, alert banner)
  ↑ read from Upstash Redis on page load
  ↑ written by cron agent every 10 min from MTA GTFS-RT feeds
```

## Setup

```bash
npm install
cp .env.local.example .env.local
# Fill in env vars (see below)
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key |
| `VAPID_SUBJECT` | VAPID subject (mailto: URI) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Same public key, exposed to client |
| `KV_REST_API_URL` | Upstash Redis REST URL |
| `KV_REST_API_TOKEN` | Upstash Redis REST token |
| `CRON_SECRET` | Secret for authenticating cron endpoint |
| `MTA_API_KEY` | Free key from [api.mta.info](https://api.mta.info) |

Generate VAPID keys: `npx web-push generate-vapid-keys`

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/alerts` | GET | Returns cached conditions from Redis |
| `/api/subscribe` | POST | Saves push subscription to Redis |
| `/api/notify` | POST | Cron: fetches MTA feeds, updates Redis, sends push if needed |
| `/api/test-push` | POST | Sends a test push notification |

## Deploy

Deploy to Vercel with Upstash Redis integration. The cron job (`vercel.json`) runs `/api/notify` every 10 minutes on weekdays 6am-9pm.

## Tech Stack

- Next.js (App Router) + TypeScript
- Plain CSS with CSS variables + dark mode
- Upstash Redis
- MTA GTFS-RT feeds via `gtfs-realtime-bindings`
- Web Push API via `web-push`
