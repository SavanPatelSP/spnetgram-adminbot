import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const SlaEvents = {
  created(slaId: string, targetEntity: string, deadlineAt: string) {
    return eventBus.emit('sla:created', { slaId, targetEntity, deadlineAt })
  },

  breached(slaId: string, targetEntity: string, entityId: string) {
    return eventBus.emit('sla:breached', { slaId, targetEntity, entityId })
  },

  resolved(slaId: string) {
    return eventBus.emit('sla:resolved', { slaId })
  },
}
