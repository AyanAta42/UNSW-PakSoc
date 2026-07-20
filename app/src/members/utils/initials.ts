/**
 * Returns up to 2 uppercase initials from a full name, e.g. "Ali Raza" → "AR".
 * Tolerates empty / null / whitespace-only names, returning "?" as a fallback
 * so avatars never render blank or throw.
 */
export function initials(name?: string | null): string {
  const letters = (name ?? '').trim().split(/\s+/).filter(Boolean).map(w => w[0])
  return letters.join('').slice(0, 2).toUpperCase() || '?'
}
