import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export function emitPermissionGranted(payload: Record<string, unknown>) {
  return eventBus.emit('permission:granted', payload)
}

export function emitPermissionRevoked(payload: Record<string, unknown>) {
  return eventBus.emit('permission:revoked', payload)
}


