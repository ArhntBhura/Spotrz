# Sports Backend

A small Node.js backend for managing sports matches and live commentary.

## What it does

- Creates and lists matches
- Updates match scores
- Adds and fetches commentary
- Sends real-time updates through WebSockets

## Tech Stack

- Node.js
- Express
- PostgreSQL
- Drizzle ORM
- WebSocket (`ws`)
- Zod

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```env
DATABASE_URL=your_postgres_connection_string
PORT=8000
HOST=0.0.0.0
CORS_ORIGIN=https://your-frontend.example.com
API_URL=https://your-backend.example.com
SEED_ENABLED=true
```

3. Start the server:

```bash
npm run dev
```

## Scripts

- `npm run dev` - run the app in watch mode
- `npm start` - run the app normally
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - apply migrations
- `npm run db:studio` - open Drizzle Studio
- `npm run seed` - seed sample data

## API

### Matches

- `GET /matches`
- `POST /matches`
- `PATCH /matches/:id/score`

### Commentary

- `GET /matches/:id/commentary`
- `POST /matches/:id/commentary`

### Demo seeding

When `SEED_ENABLED=true`, the frontend can start the demo seed job with:

- `POST /admin/seed`
- `GET /admin/seed/status`

The seed job runs inside the backend service, writes to PostgreSQL, and
broadcasts commentary and score updates to connected WebSocket clients. Set
`API_URL` to the public backend URL because the seed job calls the backend
through its REST API.

## WebSocket

Connect to:

```bash
ws://localhost:8000/ws
```

Example subscribe message:

```json
{ "type": "subscribe", "matchId": 1 }
```

## Notes

- Match status is based on the start and end time.
- Real-time match and commentary updates are broadcast to connected clients.
- Use `/health` as the deployment health-check endpoint.
- Set `CORS_ORIGIN` to the exact deployed frontend origin. Multiple origins may
  be separated by commas.
