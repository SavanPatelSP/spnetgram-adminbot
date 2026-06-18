import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const AnalyticsEvents = {
  metricRecorded(recordId: string, metric: string, value: number, period?: string) {
    return eventBus.emit('analytics:metric:recorded', { recordId, metric, value, period })
  },

  dashboardCreated(dashboardId: string, name: string, ownerId?: string) {
    return eventBus.emit('analytics:dashboard:created', { dashboardId, name, ownerId })
  },
}
