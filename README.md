# Spotrz — Real-time Sports Dashboard

A full-stack demo that streams live match data to the browser. The backend stores matches and play-by-play commentary in PostgreSQL and pushes every new event over WebSockets; the frontend shows live match cards and a real-time commentary feed for whichever match you're watching.

## Features

- Live list of current matches (football, cricket, basketball, …) with scores and status
- **Watch Live** on any match to open its real-time commentary timeline
- New matches appear instantly, with a "N new matches added" banner
- Connection status indicator with automatic reconnect
- Seed script that simulates a live match day

## Tech stack

| Layer    | Tools                                     |
| -------- | ----------------------------------------- |
| Backend  | Node.js, Express 5, WebSocket (`ws`), Zod |
| Database | PostgreSQL, Drizzle ORM + Drizzle Kit     |
| Frontend | React, Vite, Tailwind CSS                 |

## Project structure

```
SportsDashboard/
├── backend/
│   ├── drizzle/            # generated SQL migrations
│   ├── drizzle.config.js
│   └── src/
│       ├── index.js        # Express app + HTTP server
│       ├── db/             # Drizzle client and schema
│       ├── routes/         # /matches and /matches/:id/commentary
│       ├── validation/     # Zod request schemas
│       ├── ws/server.js    # WebSocket server (subscribe / broadcast)
│       ├── seed/seed.js    # streams demo data through the REST API
│       └── data/data.json  # seed matches + commentary
└── frontend/
    ├── vite.config.js      # dev proxy to the backend
    └── src/
        ├── App.jsx
        ├── components/     # Header, MatchCard, CommentaryPanel
        ├── hooks/          # useLiveSocket (WebSocket + reconnect)
        └── lib/            # REST client, formatting helpers
```

## How it works

```
 Browser (React)                     Backend (Express)              PostgreSQL
 ───────────────                     ─────────────────              ──────────
 GET /api/matches  ──(Vite proxy)──▶ GET /matches        ─────────▶ matches
 GET /api/matches/:id/commentary ──▶ GET …/commentary    ─────────▶ commentary

 ws://…/ws  ◀────── match_created ── POST /matches        (sent to every client)
            ◀────── commentary ───── POST …/commentary    (sent to subscribers of that match)
            ─────── { type: "subscribe", matchId } ──▶
```

When you click **Watch Live**, the frontend loads the latest commentary over REST, then subscribes to that match on the WebSocket so new entries arrive instantly. In development the Vite dev server proxies `/api` and `/ws` to `http://localhost:8000`; in production, configure the frontend backend URLs and the backend's allowed CORS origin.

## Getting started

### Prerequisites

- Node.js 20+ (developed on Node 22)
- A PostgreSQL database — local, Docker, or hosted (Neon, Supabase, …)

### 1. Configure the backend

```bash
cd backend
npm install
cp .env.example .env
```

Open `backend/.env` and set `DATABASE_URL` to your Postgres connection string:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/sports
```

No Postgres yet? One quick way is Docker:

```bash
docker run --name sports-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=sports -p 5432:5432 -d postgres:16
# DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sports
```

### 2. Create the database tables

```bash
npm run db:generate   # generate SQL migrations from src/db/schema.js (only needed after schema changes)
npm run db:migrate    # apply migrations — creates the matches and commentary tables
```

Optional: `npm run db:studio` opens Drizzle Studio to browse the data.

### 3. Start the backend

```bash
npm run dev
```

The API runs on `http://localhost:8000` and the WebSocket on `ws://localhost:8000/ws`.

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The header should show **LIVE CONNECTED**.

### 5. Stream demo data (optional)

With both servers running, in another terminal:

```bash
cd backend
npm run seed
```

Matches pop into the dashboard every few seconds, and commentary streams in once you click **Watch Live** on a match.

## Scripts

| Where    | Command               | What it does                          |
| -------- | --------------------- | ------------------------------------- |
| backend  | `npm run dev`         | Start the API in watch mode           |
| backend  | `npm start`           | Start the API                         |
| backend  | `npm run db:generate` | Generate migrations from the schema   |
| backend  | `npm run db:migrate`  | Apply migrations to the database      |
| backend  | `npm run db:studio`   | Open Drizzle Studio                   |
| backend  | `npm run seed`        | Stream demo matches + commentary      |
| frontend | `npm run dev`         | Start the dashboard on port 5173      |
| frontend | `npm run build`       | Production build into `frontend/dist` |

## API reference

| Method | Endpoint                           | Description                                 |
| ------ | ---------------------------------- | ------------------------------------------- |
| GET    | `/matches?limit=50`                | List matches, newest first (max 100)        |
| POST   | `/matches`                         | Create a match — broadcasts `match_created` |
| GET    | `/matches/:id/commentary?limit=10` | Latest commentary for a match (max 100)     |
| POST   | `/matches/:id/commentary`          | Add commentary — broadcasts `commentary`    |

**WebSocket** — connect to `/ws`, then:

```json
{ "type": "subscribe", "matchId": 1 }
{ "type": "unsubscribe", "matchId": 1 }
```

Server messages: `welcome`, `subscribed`, `unsubscribed`, `match_created`, `commentary`.

## Environment variables (backend)

| Variable                      | Default   | Purpose                                               |
| ----------------------------- | --------- | ----------------------------------------------------- |
| `DATABASE_URL`                | —         | PostgreSQL connection string (required)               |
| `PORT`                        | `8000`    | API port                                              |
| `HOST`                        | `0.0.0.0` | API host                                              |
| `CORS_ORIGIN`                 | —         | Comma-separated frontend origins allowed to call API  |
| `API_URL`                     | —         | Base URL the seed script calls (required for seeding) |
| `DELAY_MS`                    | `250`     | Delay between seeded commentary entries               |
| `SEED_MATCH_DURATION_MINUTES` | `120`     | Length of seeded matches                              |
| `SEED_FORCE_LIVE`             | `1`       | Shift seeded matches so they're live now              |

The frontend reads `BACKEND_URL` (default `http://localhost:8000`) for the
development proxy. For production builds, set `VITE_API_BASE` to the backend
HTTPS URL and `VITE_WS_URL` to its `wss://.../ws` URL before `npm run build`.

## Known limitations

- `PATCH /matches/:id/score` is not wired up yet, so scores stay at their initial values.
- A match's stored `status` is set only when it's created; the dashboard derives Live / Upcoming / Full time from the start and end times instead.
