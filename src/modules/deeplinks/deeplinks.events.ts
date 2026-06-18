import { EventBus } from '@infrastructure/event-bus/event-bus.js'

const eventBus = EventBus.getInstance()

export const DeepLinkEvents = {
  created(deeplinkId: string, code: string, targetModule: string, targetId: string) {
    return eventBus.emit('deeplink:created', { deeplinkId, code, targetModule, targetId })
  },

  clicked(deeplinkId: string, code: string) {
    return eventBus.emit('deeplink:clicked', { deeplinkId, code })
  },
}
