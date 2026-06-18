import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const CasesEvents = {
  created(caseId: string, referenceId: string, reporterId: string) {
    return eventBus.emit('case:created', { caseId, referenceId, reporterId })
  },

  updated(caseId: string) {
    return eventBus.emit('case:updated', { caseId })
  },

  assigned(caseId: string, assigneeId: string) {
    return eventBus.emit('case:assigned', { caseId, assigneeId })
  },

  statusChanged(caseId: string, previousStatus: string, newStatus: string) {
    return eventBus.emit('case:status:changed', { caseId, previousStatus, newStatus })
  },
}
