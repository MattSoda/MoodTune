export default function LoadingState({ label = 'Loading…' }) {
  return <p className="flex items-center gap-3 text-slate-300" role="status"><span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-transparent" />{label}</p>
}
