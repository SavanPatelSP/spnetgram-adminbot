import { NotificationsService } from './notifications.service.js'
import { CreateNotificationDto, NotificationQueryParams } from './notifications.types.js'

const service = new NotificationsService()

export const NotificationsController = {
  async create(req: { body: CreateNotificationDto }) {
    const { userId, type, title, body, data, channel, category } = req.body
    const notification = await service.create(userId, type, title, body, data, channel, category)
    return { status: 201, body: notification }
  },

  async getById(req: { params: { id: string } }) {
    const data = await service.findById(req.params.id)
    return { status: 200, body: data }
  },

  async listByUser(req: { params: { userId: string }; query: Record<string, string | undefined> }) {
    const params: NotificationQueryParams = {
      userId: req.params.userId,
      readStatus: req.query.readStatus as any,
      type: req.query.type as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    }
    const data = await service.findByUser(params)
    return { status: 200, body: data }
  },

  async markAsRead(req: { params: { id: string } }) {
    const data = await service.markAsRead(req.params.id)
    return { status: 200, body: data }
  },

  async markAllAsRead(req: { params: { userId: string } }) {
    const data = await service.markAllAsRead(req.params.userId)
    return { status: 200, body: data }
  },

  async getUnreadCount(req: { params: { userId: string } }) {
    const data = await service.getUnreadCount(req.params.userId)
    return { status: 200, body: data }
  },

  async delete(req: { params: { id: string } }) {
    const data = await service.delete(req.params.id)
    return { status: 200, body: data }
  },
}
