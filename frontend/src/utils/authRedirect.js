export function safeRedirectPath(value, fallback = '/') {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
    ? value
    : fallback
}

export function loginPathFor(targetRoute) {
  return `/login?redirect=${encodeURIComponent(safeRedirectPath(targetRoute))}`
}
