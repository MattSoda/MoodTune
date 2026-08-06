export default function ErrorMessage({ message }) {
  if (!message) return null
  return <p className="rounded-lg border border-rose-400/40 bg-rose-400/10 p-3 text-sm leading-6 text-rose-100" role="alert">{message}</p>
}
