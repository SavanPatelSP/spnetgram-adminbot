import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { ModerationAction } from '@prisma/client'

const eventBus = EventBus.getInstance()

export function emitModerationActionCreated(action: ModerationAction, newStatus?: string) {
  return eventBus.emit('moderation:action:created', { action, newStatus })
}


