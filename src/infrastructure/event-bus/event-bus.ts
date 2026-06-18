type EventHandler<T = unknown> = (payload: T) => void | Promise<void>

export class EventBus {
  private static instance: EventBus
  private handlers = new Map<string, EventHandler[]>()

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus()
    }
    return EventBus.instance
  }

  on<T>(event: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(event) || []
    existing.push(handler as EventHandler)
    this.handlers.set(event, existing)
  }

  off<T>(event: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(event) || []
    const filtered = existing.filter((h) => h !== handler)
    if (filtered.length === 0) {
      this.handlers.delete(event)
    } else {
      this.handlers.set(event, filtered)
    }
  }

  async emit<T>(event: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(event) || []
    await Promise.all(handlers.map((handler) => handler(payload)))
  }
}
