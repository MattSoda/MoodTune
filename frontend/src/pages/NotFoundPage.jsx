import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <section className="mx-auto max-w-xl py-10 text-center sm:py-16">
    <p className="page-eyebrow">404 · Lost track</p>
    <p className="lavender-text text-6xl font-bold tracking-[-0.08em] sm:text-8xl">404</p>
    <h1 className="page-title mt-4">Page not found</h1>
    <p className="page-copy mx-auto">This page slipped out of the playlist. Let&apos;s get you back to the music.</p>
    <Link className="button-primary mt-7 inline-flex" to="/">Return home</Link>
  </section>
}
