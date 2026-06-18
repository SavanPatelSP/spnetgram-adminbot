import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const ApprovalEvents = {
  requestCreated(requestId: string, referenceId: string, requesterId: string, resourceType: string) {
    return eventBus.emit('approval:request:created', { requestId, referenceId, requesterId, resourceType })
  },

  stepCompleted(stepId: string, requestId: string, status: string) {
    return eventBus.emit('approval:step:completed', { stepId, requestId, status })
  },

  requestResolved(requestId: string, status: string) {
    return eventBus.emit('approval:request:resolved', { requestId, status })
  },
}
