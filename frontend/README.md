# Spotrz — Frontend

React + Tailwind dashboard for the sports backend: live match cards and a real-time commentary feed over WebSockets.

## Run

1. Start the backend on port 8000 (`cd ../backend && npm run dev`).
2. In this folder:

```bash
npm install
npm run dev
```

3. Open http://localhost:5173 and, optionally, run `npm run seed` in the backend to stream demo matches and commentary.

## How it talks to the backend

In development, the Vite dev server proxies everything:

- `/api/*` → `http://localhost:8000/*` (REST)
- `/ws` → `ws://localhost:8000/ws` (WebSocket)

Point it at a different backend with `BACKEND_URL=http://host:port npm run dev`.

For a production frontend deployed on a different origin, copy `.env.example`
to `.env.production` and set both values to the deployed backend:

```env
VITE_API_BASE=https://api.example.com
VITE_WS_URL=wss://api.example.com/ws
```

These values are embedded at build time, so set them before running
`npm run build`.

## Structure

- `src/App.jsx` — page layout and state (matches, selected match, commentary)
- `src/hooks/useLiveSocket.js` — one WebSocket with auto-reconnect and subscribe/unsubscribe
- `src/lib/api.js` — REST calls + the `API: N` request counter
- `src/components/` — `Header`, `MatchCard`, `CommentaryPanel`
