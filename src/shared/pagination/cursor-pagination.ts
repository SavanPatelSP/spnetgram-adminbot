export interface CursorPageParams {
  cursor?: string
  limit: number
}

export interface CursorPageResult<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

export function encodeCursor(id: string, timestamp: Date): string {
  return Buffer.from(`${id}:${timestamp.toISOString()}`).toString('base64')
}

export function decodeCursor(cursor: string): { id: string; timestamp: Date } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    const [id, timestamp] = decoded.split(':')
    return { id, timestamp: new Date(timestamp) }
  } catch {
    return null
  }
}

export function cursorPaginateResponse<T>(
  items: T[],
  getId: (item: T) => string,
  getTimestamp: (item: T) => Date,
  limit: number,
): CursorPageResult<T> {
  const hasMore = items.length > limit
  const resultItems = hasMore ? items.slice(0, limit) : items
  const lastItem = resultItems[resultItems.length - 1]

  return {
    items: resultItems,
    nextCursor: lastItem ? encodeCursor(getId(lastItem), getTimestamp(lastItem)) : undefined,
    hasMore,
  }
}
