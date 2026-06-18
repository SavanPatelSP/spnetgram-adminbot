import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const PremiumEvents = {
  subscriptionCreated(subscriptionId: string, userId: string, planId: string) {
    return eventBus.emit('subscription:created', { subscriptionId, userId, planId })
  },

  subscriptionUpdated(subscriptionId: string, status: string) {
    return eventBus.emit('subscription:updated', { subscriptionId, status })
  },

  subscriptionExpired(subscriptionId: string, userId: string) {
    return eventBus.emit('subscription:expired', { subscriptionId, userId })
  },
}
