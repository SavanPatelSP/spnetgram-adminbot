import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export function emitAuditLogCreated(log: Record<string, unknown>) {
  return eventBus.emit('audit:log:created', { log })
}
