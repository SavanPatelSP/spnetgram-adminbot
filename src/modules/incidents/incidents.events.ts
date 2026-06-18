import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const IncidentsEvents = {
  created(incidentId: string, referenceId: string, title: string, priority: string) {
    return eventBus.emit('incident:created', { incidentId, referenceId, title, priority })
  },

  updated(incidentId: string, status: string) {
    return eventBus.emit('incident:updated', { incidentId, status })
  },

  resolved(incidentId: string, resolvedAt: string) {
    return eventBus.emit('incident:resolved', { incidentId, resolvedAt })
  },

  reportGenerated(reportId: string, incidentId: string, reportType: string) {
    return eventBus.emit('incident:report:generated', { reportId, incidentId, reportType })
  },
}
