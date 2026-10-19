import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Header from './components/Header.jsx'
import MatchCard from './components/MatchCard.jsx'
import CommentaryPanel from './components/CommentaryPanel.jsx'
import { useLiveSocket } from './hooks/useLiveSocket.js'
import { apiCounter, fetchCommentary, fetchMatches, fetchSeedStatus, startSeed } from './lib/api.js'
import { getMatchStatus, mergeById } from './lib/format.js'

const MAX_COMMENTARY = 100

export default function App() {
  const [matches, setMatches] = useState([])
  const [matchesState, setMatchesState] = useState({ loading: true, error: null })
  const [newMatchCount, setNewMatchCount] = useState(0)
  const [seedState, setSeedState] = useState({ status: 'idle', error: null })

  const [selectedId, setSelectedId] = useState(null)
  const [commentary, setCommentary] = useState([])
  const [commentaryState, setCommentaryState] = useState({ loading: false, error: null })

  const [now, setNow] = useState(() => Date.now())
  const apiCount = useSyncExternalStore(apiCounter.subscribe, apiCounter.getSnapshot)

  const selectedIdRef = useRef(null)
  const knownMatchIdsRef = useRef(new Set())
  const commentaryRequestRef = useRef(0)
  const panelRef = useRef(null)

  const loadMatches = useCallback(async () => {
    setMatchesState((state) => ({ ...state, loading: true, error: null }))
    try {
      const data = await fetchMatches()
      data.forEach((match) => knownMatchIdsRef.current.add(match.id))
      setMatches((current) => mergeById(current, data))
      setMatchesState({ loading: false, error: null })
    } catch (error) {
      setMatchesState({ loading: false, error: error.message })
    }
  }, [])

  const loadCommentary = useCallback(async (matchId) => {
    const requestId = ++commentaryRequestRef.current
    setCommentaryState({ loading: true, error: null })
    try {
      const data = await fetchCommentary(matchId)
      // Ignore responses for a match the user has already moved away from.
      if (requestId !== commentaryRequestRef.current) return
      setCommentary((current) => mergeById(current, data, MAX_COMMENTARY))
      setCommentaryState({ loading: false, error: null })
    } catch (error) {
      if (requestId !== commentaryRequestRef.current) return
      setCommentaryState({ loading: false, error: error.message })
    }
  }, [])

  const handleMessage = useCallback((message) => {
    if (message.type === 'match_created' && message.data) {
      if (knownMatchIdsRef.current.has(message.data.id)) return
      knownMatchIdsRef.current.add(message.data.id)
      setNewMatchCount((count) => count + 1)
      setMatches((current) => mergeById(current, [message.data]))
    }

    if (message.type === 'commentary' && message.data?.matchId === selectedIdRef.current) {
      setCommentary((current) => mergeById(current, [message.data], MAX_COMMENTARY))
    }

    if (message.type === 'score_updated' && message.data?.matchId != null) {
      setMatches((current) =>
        current.map((match) =>
          match.id === message.data.matchId
            ? {
                ...match,
                homeScore: message.data.homeScore,
                awayScore: message.data.awayScore,
              }
            : match,
        ),
      )
    }
  }, [])

  // After a dropped connection, catch up on anything broadcast while offline.
  const handleReconnect = useCallback(() => {
    loadMatches()
    if (selectedIdRef.current != null) loadCommentary(selectedIdRef.current)
  }, [loadMatches, loadCommentary])

  const { status, watch } = useLiveSocket({ onMessage: handleMessage, onReconnect: handleReconnect })

  async function handleRunSeed() {
    setSeedState({ status: 'starting', error: null })
    try {
      const nextState = await startSeed()
      setSeedState({ status: nextState.status, error: null })
    } catch (error) {
      setSeedState({ status: 'failed', error: error.message })
    }
  }

  useEffect(() => {
    if (seedState.status !== 'running' && seedState.status !== 'starting') return undefined

    const timer = setInterval(async () => {
      try {
        const nextState = await fetchSeedStatus()
        setSeedState({ status: nextState.status, error: nextState.error })
        if (nextState.status === 'completed' || nextState.status === 'failed') {
          loadMatches()
        }
      } catch (error) {
        setSeedState({ status: 'failed', error: error.message })
      }
    }, 2000)

    return () => clearInterval(timer)
  }, [seedState.status, loadMatches])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  // Re-derive live/finished badges as time passes.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(timer)
  }, [])

  function selectMatch(matchId) {
    selectedIdRef.current = matchId
    setSelectedId(matchId)
    setCommentary([])
    watch(matchId)

    if (matchId == null) {
      commentaryRequestRef.current++
      setCommentaryState({ loading: false, error: null })
      return
    }

    loadCommentary(matchId)
    // On stacked (mobile) layouts the panel sits below the list.
    if (window.matchMedia('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: 'smooth' }))
    }
  }

  const selectedMatch = matches.find((match) => match.id === selectedId) ?? null

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <Header status={status} />
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRunSeed}
          disabled={seedState.status === 'starting' || seedState.status === 'running'}
          className="rounded-full border-2 border-ink bg-sun px-4 py-2 text-sm font-bold shadow-hard-sm transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {seedState.status === 'starting' || seedState.status === 'running'
            ? 'Seeding matches...'
            : 'Run Seed Matches'}
        </button>
        {seedState.status === 'completed' && (
          <span className="text-sm font-semibold text-emerald-700">Seed completed.</span>
        )}
        {seedState.error && <span className="text-sm font-semibold text-live">{seedState.error}</span>}
      </div>

      <main className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        <section aria-labelledby="matches-heading">
          <div className="flex items-center justify-between">
            <h2 id="matches-heading" className="border-l-4 border-sky pl-3 text-xl font-bold">
              Current Matches
            </h2>
            <span
              title="REST requests made this session"
              className="rounded-md bg-ink px-2 py-1 font-mono text-xs font-bold text-white"
            >
              API: {apiCount}
            </span>
          </div>

          {newMatchCount > 0 && (
            <div
              role="status"
              className="animate-slide-in mt-5 flex items-center justify-between gap-3 rounded-xl border-2 border-ink bg-sun px-4 py-3 shadow-hard"
            >
              <p className="text-sm font-bold">
                {newMatchCount} new {newMatchCount === 1 ? 'match' : 'matches'} added
              </p>
              <button
                type="button"
                onClick={() => setNewMatchCount(0)}
                className="rounded-full border-2 border-ink bg-white px-3 py-1 text-xs font-bold transition hover:bg-slate-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {matchesState.error && (
            <div className="mt-5 rounded-xl border-2 border-live/50 bg-red-50 p-4 text-sm">
              <p className="font-semibold text-live">
                Couldn't reach the backend: {matchesState.error}
              </p>
              <p className="mt-1 text-slate-600">Make sure it's running on port 8000.</p>
              <button type="button" onClick={loadMatches} className="mt-2 font-bold underline">
                Try again
              </button>
            </div>
          )}

          {matchesState.loading && matches.length === 0 && (
            <p className="mt-10 text-center text-sm text-slate-500">Loading matches…</p>
          )}

          {!matchesState.loading && !matchesState.error && matches.length === 0 && (
            <div className="mt-5 rounded-2xl border-2 border-dashed border-ink/40 p-10 text-center text-sm text-slate-500">
              No matches yet. Run <code className="font-mono">npm run seed</code> in the backend —
              new matches will appear here live.
            </div>
          )}

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                status={getMatchStatus(match, now)}
                isWatching={match.id === selectedId}
                onWatch={() => selectMatch(match.id)}
                onClose={() => selectMatch(null)}
              />
            ))}
          </div>
        </section>

        <aside ref={panelRef} className="scroll-mt-4 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
          <CommentaryPanel
            match={selectedMatch}
            entries={commentary}
            loading={commentaryState.loading}
            error={commentaryState.error}
            onRetry={() => loadCommentary(selectedId)}
          />
        </aside>
      </main>
    </div>
  )
}
