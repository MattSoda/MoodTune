export default function LoadingState({ label = 'Loading…' }) {
  return <div className="surface flex items-center gap-3 px-5 py-4 text-sm text-zinc-300" role="status"><span className="h-4 w-4 animate-spin rounded-full border-2 border-lavender-300 border-t-transparent shadow-[0_0_10px_rgba(196,181,253,.35)]" />{label}</div>
}
