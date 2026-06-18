import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const TicketsEvents = {
  created(ticketId: string, referenceId: string, reporterId: string) {
    return eventBus.emit('ticket:created', { ticketId, referenceId, reporterId })
  },

  updated(ticketId: string) {
    return eventBus.emit('ticket:updated', { ticketId })
  },

  assigned(ticketId: string, assigneeId: string) {
    return eventBus.emit('ticket:assigned', { ticketId, assigneeId })
  },

  replied(ticketId: string, userId: string) {
    return eventBus.emit('ticket:replied', { ticketId, userId })
  },
}
