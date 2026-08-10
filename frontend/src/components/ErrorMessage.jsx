export default function ErrorMessage({ message }) {
  if (!message) return null
  return <p className="rounded-xl border border-rose-400/25 bg-rose-400/[0.07] px-4 py-3 text-sm leading-6 text-rose-100" role="alert">{message}</p>
}
