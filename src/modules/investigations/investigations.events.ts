import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const InvestigationsEvents = {
  created(investigationId: string, caseId?: string, reporterId?: string) {
    return eventBus.emit('investigation:created', { investigationId, caseId, reporterId: reporterId || '' })
  },

  updated(investigationId: string) {
    return eventBus.emit('investigation:updated', { investigationId })
  },

  completed(investigationId: string) {
    return eventBus.emit('investigation:completed', { investigationId })
  },
}
