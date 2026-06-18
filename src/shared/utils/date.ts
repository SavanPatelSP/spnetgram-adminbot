export function now(): Date {
  return new Date()
}

export function addHours(hours: number): Date {
  const d = new Date()
  d.setHours(d.getHours() + hours)
  return d
}

export function isBefore(a: Date, b: Date): boolean {
  return a.getTime() < b.getTime()
}

export function isAfter(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime()
}

export function diffMinutes(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / 60_000
}
