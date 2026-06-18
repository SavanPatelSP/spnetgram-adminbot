import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export function emitOverrideGranted(payload: Record<string, unknown>) {
  return eventBus.emit('governance:override:granted', payload)
}

export function emitOverrideRevoked(payload: Record<string, unknown>) {
  return eventBus.emit('governance:override:revoked', payload)
}

export function emitTemporaryGranted(payload: Record<string, unknown>) {
  return eventBus.emit('governance:temporary:granted', payload)
}

export function emitTemporaryRevoked(payload: Record<string, unknown>) {
  return eventBus.emit('governance:temporary:revoked', payload)
}

export function emitAccessGranted(payload: Record<string, unknown>) {
  return eventBus.emit('governance:access:granted', payload)
}

export function emitSensitiveConfigured(payload: Record<string, unknown>) {
  return eventBus.emit('governance:sensitive:configured', payload)
}

export function emitAuditExportCreated(payload: Record<string, unknown>) {
  return eventBus.emit('governance:audit:export:created', payload)
}
