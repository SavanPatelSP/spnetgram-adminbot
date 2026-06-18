import { randomBytes } from 'node:crypto'

export function generateId(prefix?: string): string {
  const id = randomBytes(16).toString('hex')
  return prefix ? `${prefix}_${id}` : id
}

export function generateReference(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = randomBytes(4).toString('hex').toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}
