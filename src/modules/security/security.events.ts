import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const SecurityEvents = {
  created(eventId: string, eventType: string, userId?: string, severity?: string) {
    return eventBus.emit('security:event:created', { eventId, eventType, userId, severity: severity ?? 'MEDIUM' })
  },

  incidentDetected(incidentId: string, title: string, severity: string) {
    return eventBus.emit('security:incident:detected', { incidentId, title, severity })
  },

  lockdownTriggered(triggeredBy: string, reason?: string) {
    return eventBus.emit('security:lockdown:triggered', { triggeredBy, reason })
  },

  lockdownLifted(liftedBy: string) {
    return eventBus.emit('security:lockdown:lifted', { liftedBy })
  },
}
