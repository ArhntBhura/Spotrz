// REST client for the sports backend. All paths go through the Vite proxy
// (`/api` -> backend) so the browser never makes a cross-origin request.
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

// Tiny external store counting REST calls, shown as the "API: N" pill.
let requestCount = 0
const listeners = new Set()

export const apiCounter = {
  subscribe(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return requestCount
  },
}

async function request(path) {
  requestCount += 1
  listeners.forEach((listener) => listener())

  const response = await fetch(`${API_BASE}${path}`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`)
  }
  return payload.data
}

export function fetchMatches(limit = 50) {
  return request(`/matches?limit=${limit}`)
}

export function fetchCommentary(matchId, limit = 50) {
  return request(`/matches/${matchId}/commentary?limit=${limit}`)
}

export async function startSeed() {
  const response = await fetch(`${API_BASE}/admin/seed`, { method: 'POST' })
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || `Seed failed (${response.status})`)
  }

  return payload.data
}

export async function fetchSeedStatus() {
  const response = await fetch(`${API_BASE}/admin/seed/status`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload.error || `Seed status failed (${response.status})`)
  }

  return payload.data
}
