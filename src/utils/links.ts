export const base = import.meta.env.BASE_URL.replace(/\/$/, '')

/**
 * Returns a base-aware link.
 * Ensures exactly one slash between base and path, root ends with slash.
 */
export const link = (path: string) => {
  if (!path || path === '/') return `${base}/` // root
  return `${base}/${path.replace(/^\/|\/$/g, '')}` // strip leading/trailing slash from path
}