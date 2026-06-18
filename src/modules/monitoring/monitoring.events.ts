import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const MonitoringEvents = {
  statusChanged(serviceId: string, name: string, previousStatus: string, newStatus: string) {
    return eventBus.emit('monitoring:service:status:changed', { serviceId, name, previousStatus, newStatus })
  },

  alertTriggered(alertId: string, serviceId: string | undefined, severity: string, message: string) {
    return eventBus.emit('monitoring:alert:triggered', { alertId, serviceId, severity, message })
  },

  alertAcknowledged(alertId: string, acknowledgedBy: string) {
    return eventBus.emit('monitoring:alert:acknowledged', { alertId, acknowledgedBy })
  },
}
