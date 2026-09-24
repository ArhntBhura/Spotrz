import { formatClock } from '../lib/format.js'

const STATUS_LABEL = {
  live: { text: 'Live', className: 'text-live', dot: 'bg-live animate-pulse-dot' },
  scheduled: { text: 'Upcoming', className: 'text-slate-500', dot: 'bg-slate-400' },
  finished: { text: 'Full time', className: 'text-slate-500', dot: 'bg-slate-300' },
}

function TeamRow({ name, score, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="truncate text-lg font-bold">{name}</span>
      <span
        className={`grid h-10 min-w-10 place-items-center rounded-lg border-2 border-ink px-2 text-xl font-extrabold tabular-nums transition-colors ${
          highlight ? 'bg-sun' : 'bg-slate-100'
        }`}
      >
        {score}
      </span>
    </div>
  )
}

export default function MatchCard({ match, status, isWatching, onWatch, onClose }) {
  const label = STATUS_LABEL[status] ?? STATUS_LABEL.scheduled
  const leader =
    match.homeScore === match.awayScore ? null : match.homeScore > match.awayScore ? 'home' : 'away'

  return (
    <article
      className={`animate-slide-in flex flex-col rounded-2xl border-2 border-ink bg-white p-5 transition-shadow ${
        isWatching ? 'shadow-[0_0_0_4px_var(--color-sun)]' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full border-2 border-slate-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {match.sport}
        </span>
        <span className={`flex items-center gap-1.5 text-sm font-semibold ${label.className}`}>
          <span className={`size-2.5 rounded-full border border-ink/50 ${label.dot}`} />
          {label.text}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <TeamRow name={match.homeTeam} score={match.homeScore} highlight={isWatching && leader === 'home'} />
        <TeamRow name={match.awayTeam} score={match.awayScore} highlight={isWatching && leader === 'away'} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 border-t-2 border-dashed border-slate-100 pt-4">
        <time dateTime={match.startTime} className="text-xs font-medium text-slate-600">
          {formatClock(match.startTime)}
        </time>

        {isWatching ? (
          <div className="flex gap-2">
            <span className="rounded-full border-2 border-ink bg-sky px-4 py-1.5 text-sm font-bold">
              Watching Live
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Close
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onWatch}
            className="rounded-full border-2 border-ink bg-sun px-4 py-1.5 text-sm font-bold transition hover:-translate-y-0.5 hover:shadow-hard-sm active:translate-y-0 active:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Watch Live
          </button>
        )}
      </div>
    </article>
  )
}
