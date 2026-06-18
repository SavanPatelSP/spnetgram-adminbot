import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const NotificationsEvents = {
  sent(notificationId: string, userId: string, type: string, data?: Record<string, unknown>) {
    return eventBus.emit('notification:sent', { notificationId, userId, type, data })
  },
}
