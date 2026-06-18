import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { User } from '@prisma/client'

const eventBus = EventBus.getInstance()

export function emitUserCreated(userId: string, telegramId?: bigint) {
  return eventBus.emit('user:created', { userId, telegramId })
}

export function emitUserStatusChanged(userId: string, previousStatus: string, newStatus: string) {
  return eventBus.emit('user:status:changed', { userId, previousStatus, newStatus })
}
