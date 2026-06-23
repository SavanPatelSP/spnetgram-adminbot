export function serializeBigInt(key: string, value: unknown): unknown {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

export function safeStringify(obj: unknown, space?: number): string {
  try {
    return JSON.stringify(obj, serializeBigInt, space)
  } catch {
    try {
      return String(obj)
    } catch {
      return '[Unserializable]'
    }
  }
}
