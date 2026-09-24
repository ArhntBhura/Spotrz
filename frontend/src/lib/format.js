export function getMatchStatus(match, now = Date.now()) {
  const start = new Date(match.startTime).getTime()
  const end = new Date(match.endTime).getTime()

  // The backend only sets `status` when a match is created, so derive it
  // from the time window and fall back to the stored value.
  if (Number.isNaN(start) || Number.isNaN(end)) return match.status
  if (now < start) return 'scheduled'
  if (now >= end) return 'finished'
  return 'live'
}

export function formatClock(value) {
  if (!value) return '--:--'
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatClockWithSeconds(value) {
  if (!value) return '--:--:--'
  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

// Merge items into a list keyed by `id`, newest (highest id) first.
export function mergeById(existing, incoming, max = Infinity) {
  const byId = new Map(existing.map((item) => [item.id, item]))
  for (const item of incoming) byId.set(item.id, item)
  return [...byId.values()].sort((a, b) => b.id - a.id).slice(0, max)
}
