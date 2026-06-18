import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const SyncEvents = {
  created(syncEventId: string, eventType: string, entityType: string, entityId: string) {
    return eventBus.emit('sync:event:created', { syncEventId, eventType, entityType, entityId })
  },

  processed(syncEventId: string, status: string) {
    return eventBus.emit('sync:event:processed', { syncEventId, status })
  },

  failed(syncEventId: string, error: string) {
    return eventBus.emit('sync:event:failed', { syncEventId, error })
  },
}
