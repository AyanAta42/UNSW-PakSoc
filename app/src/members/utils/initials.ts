/** Returns up to 2 uppercase initials from a full name, e.g. "Ali Raza" → "AR". */
export function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
