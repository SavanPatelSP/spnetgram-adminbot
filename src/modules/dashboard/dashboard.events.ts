import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const DashboardEvents = {
  snapshotGenerated(dashboardId: string, snapshotType: string) {
    return eventBus.emit('dashboard:snapshot:generated', { dashboardId, snapshotType })
  },
}
