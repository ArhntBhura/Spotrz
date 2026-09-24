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

The backend has no CORS, so the Vite dev server proxies everything:

- `/api/*` → `http://localhost:8000/*` (REST)
- `/ws` → `ws://localhost:8000/ws` (WebSocket)

Point it at a different backend with `BACKEND_URL=http://host:port npm run dev`.

## Structure

- `src/App.jsx` — page layout and state (matches, selected match, commentary)
- `src/hooks/useLiveSocket.js` — one WebSocket with auto-reconnect and subscribe/unsubscribe
- `src/lib/api.js` — REST calls + the `API: N` request counter
- `src/components/` — `Header`, `MatchCard`, `CommentaryPanel`
