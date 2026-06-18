import { NotificationsService } from './notifications.service.js'
import { NotificationType, getCategoryForType, NotificationChannel } from './notifications.types.js'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  data?: Record<string, unknown>,
  channel?: NotificationChannel,
): Promise<void> {
  const service = new NotificationsService()
  const category = getCategoryForType(type)
  await service.create(userId, type, title, body, data, channel ?? 'IN_APP', category)
}
