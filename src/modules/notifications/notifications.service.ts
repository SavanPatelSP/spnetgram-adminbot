import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { env } from '@infrastructure/config/env.js'
import { generateId } from '../../shared/utils/id.js'
import { NotificationChannel, NotificationType, NotificationCategory, NotificationQueryParams } from './notifications.types.js'

export class NotificationsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(userId: string, type: NotificationType, title: string, body?: string, data?: Record<string, unknown>, channel: NotificationChannel = 'IN_APP', category?: NotificationCategory) {
    const id = generateId()

    const notification = await this.prisma.notification.create({
      data: {
        id,
        userId,
        type,
        title,
        body: body ?? null,
        data: (data || {}) as any,
        channel,
        category,
      },
    })

    logger.info({ notificationId: id, userId, type, channel }, 'Notification created')
    await this.eventBus.emit('notification:sent', { notificationId: id, userId, type, data: (data || {}) as Record<string, unknown> })

    if (channel === 'TELEGRAM') {
      await this.deliverViaTelegram(userId, title, body ?? '')
    }

    return notification
  }

  async findById(id: string) {
    const data = await this.prisma.notification.findUnique({ where: { id } })
    if (!data) throw new NotFoundError('Notification', id)
    return data
  }

  async findByUser(params: NotificationQueryParams) {
    const { userId, readStatus, type, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = { userId }

    if (readStatus === 'read') where.readAt = { not: null }
    else if (readStatus === 'unread') where.readAt = null

    if (type) where.type = type

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async markAsRead(id: string) {
    await this.findById(id)

    const data = await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    })

    logger.info({ notificationId: id }, 'Notification marked as read')
    return data
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    })

    logger.info({ userId, count: result.count }, 'All notifications marked as read')
    return { count: result.count }
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    })
    return { userId, count }
  }

  async delete(id: string) {
    await this.findById(id)
    await this.prisma.notification.delete({ where: { id } })
    logger.info({ notificationId: id }, 'Notification deleted')
    return { deleted: true }
  }

  private async deliverViaTelegram(userId: string, title: string, body: string) {
    const botToken = env.BOT_TOKEN
    if (!botToken) return

    const userTelegramId = await this.getUserTelegramId(userId)
    if (!userTelegramId) return

    const { Telegraf } = await import('telegraf')
    const bot = new Telegraf(botToken)
    const delays = [1_000, 2_000, 4_000]

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await bot.telegram.sendMessage(userTelegramId, `*${title}*\n\n${body}`, { parse_mode: 'Markdown' })
        logger.info({ userId, telegramId: userTelegramId, attempt }, 'Telegram notification delivered')
        return
      } catch (err) {
        logger.warn({ userId, telegramId: userTelegramId, attempt, err }, 'Telegram delivery attempt failed')
        if (attempt < 3) {
          await new Promise(r => setTimeout(r, delays[attempt - 1]))
        } else {
          logger.error({ userId, telegramId: userTelegramId }, 'Telegram delivery failed after 3 retries')
        }
      }
    }
  }

  private async getUserTelegramId(userId: string): Promise<number | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { telegramId: true },
      })
      return user?.telegramId ? Number(user.telegramId) : null
    } catch {
      return null
    }
  }
}
