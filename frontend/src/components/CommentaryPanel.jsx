import { formatClockWithSeconds } from '../lib/format.js'

function Pill({ children, className = '' }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {children}
    </span>
  )
}

function CommentaryItem({ entry }) {
  const byline = [entry.actor, entry.team].filter(Boolean).join(' · ')

  return (
    <li className="animate-slide-in relative pb-6 pl-6">
      <span className="absolute top-1.5 left-0 size-2.5 rounded-full border-2 border-ink bg-sun" />

      <div className="flex flex-wrap items-center gap-1.5">
        <time dateTime={entry.createdAt} className="mr-1 font-mono text-xs text-slate-500">
          {formatClockWithSeconds(entry.createdAt)}
        </time>
        {entry.minute != null && (
          <Pill className="border-slate-200 bg-slate-100 text-slate-700">{entry.minute}'</Pill>
        )}
        {entry.sequence != null && (
          <Pill className="border-slate-200 bg-slate-100 text-slate-700">Seq {entry.sequence}</Pill>
        )}
        {entry.period && (
          <Pill className="border-slate-200 bg-slate-100 text-slate-700">{entry.period}</Pill>
        )}
        {entry.eventType && (
          <Pill className="border-ink/70 bg-sun uppercase">{entry.eventType}</Pill>
        )}
      </div>

      {byline && <p className="mt-1.5 text-xs font-semibold">{byline}</p>}

      <p className="mt-2 inline-block rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[15px] font-medium">
        {entry.message}
      </p>

      {entry.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entry.tags.map((tag) => (
            <Pill key={tag} className="border-slate-300 text-[10px] uppercase tracking-wide text-slate-600">
              {tag}
            </Pill>
          ))}
        </div>
      )}
    </li>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full min-h-80 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink px-8 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-full border-2 border-ink bg-sun">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="13" height="12" rx="2" />
          <path d="m16 10 5-3v10l-5-3z" />
        </svg>
      </div>
      <h2 className="mt-4 text-xl font-bold">No Match Selected</h2>
      <p className="mt-2 max-w-64 text-sm text-slate-500">
        Select a match from the list to view live commentary and real-time updates.
      </p>
    </div>
  )
}

export default function CommentaryPanel({ match, entries, loading, error, onRetry }) {
  if (!match) return <EmptyState />

  return (
    <section
      aria-label={`Live commentary for ${match.homeTeam} vs ${match.awayTeam}`}
      className="flex h-full min-h-80 flex-col overflow-hidden rounded-2xl border-2 border-ink bg-white shadow-hard"
    >
      <header className="border-b-2 border-ink bg-sky px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Live Commentary</h2>
          <span className="rounded-md border-2 border-ink bg-white px-2 py-0.5 text-xs font-semibold">
            Real-time
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium text-ink/70">
          {match.homeTeam} vs {match.awayTeam}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pt-5">
        {loading && entries.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">Loading commentary…</p>
        )}

        {error && (
          <div className="mb-4 rounded-xl border-2 border-live/40 bg-red-50 p-3 text-sm">
            <p className="font-semibold text-live">Couldn't load commentary: {error}</p>
            <button type="button" onClick={onRetry} className="mt-2 font-bold underline">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-500">
            Waiting for the first update… new commentary appears here instantly.
          </p>
        )}

        {entries.length > 0 && (
          <ol className="relative before:absolute before:top-2 before:bottom-6 before:left-[4px] before:w-0.5 before:bg-slate-200">
            {entries.map((entry) => (
              <CommentaryItem key={entry.id} entry={entry} />
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
