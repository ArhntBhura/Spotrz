const STATUS_STYLES = {
  connected: { dot: 'bg-emerald-500', label: 'Live Connected' },
  connecting: { dot: 'bg-amber-400 animate-pulse', label: 'Connecting' },
  disconnected: { dot: 'bg-live', label: 'Disconnected' },
}

export default function Header({ status }) {
  const { dot, label } = STATUS_STYLES[status] ?? STATUS_STYLES.connecting

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-ink bg-sun px-6 py-6 shadow-hard">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Spotrz</h1>
        <p className="mt-1 text-sm font-medium">Real-time match data demo</p>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="flex items-center gap-2 rounded-lg border-2 border-ink bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide shadow-hard-sm"
      >
        <span className={`size-2.5 rounded-full border border-ink/40 ${dot}`} />
        {label}
      </div>
    </header>
  )
}
