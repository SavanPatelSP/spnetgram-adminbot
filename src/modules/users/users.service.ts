import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { UserStatus } from '@prisma/client'
import { UpsertTelegramUserDto, UserIntelligenceDto } from './users.types.js'

export class UsersService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) throw new NotFoundError('User', id)
    return user
  }

  async findByTelegramId(telegramId: bigint) {
    return this.prisma.user.findUnique({ where: { telegramId } })
  }

  async findByTelegramUsername(username: string) {
    return this.prisma.user.findFirst({ where: { telegramUsername: username } })
  }

  async upsertByTelegram(data: UpsertTelegramUserDto) {
    const user = await this.prisma.user.upsert({
      where: { telegramId: data.telegramId },
      create: {
        telegramId: data.telegramId,
        telegramUsername: data.telegramUsername,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
      },
      update: {
        telegramUsername: data.telegramUsername,
        firstName: data.firstName,
        lastName: data.lastName,
        languageCode: data.languageCode,
      },
    })
    logger.info({ userId: user.id }, 'User upserted via Telegram')
    await this.eventBus.emit('user:created', { userId: user.id, telegramId: user.telegramId ?? undefined })
    return user
  }

  async updateStatus(id: string, status: UserStatus) {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('User', id)
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    })
    logger.info({ userId: id, status }, 'User status updated')
    await this.eventBus.emit('user:status:changed', { userId: id, previousStatus: existing.status, newStatus: status })
    return user
  }

  async updateIntelligence(id: string, data: UserIntelligenceDto) {
    const existing = await this.prisma.user.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('User', id)
    const user = await this.prisma.user.update({ where: { id }, data })
    logger.info({ userId: id, ...data }, 'User intelligence updated')
    await this.eventBus.emit('user:intelligence:updated', { userId: id, data })
    return user
  }

  async list(ids?: string[]) {
    return this.prisma.user.findMany({
      where: ids ? { id: { in: ids } } : undefined,
      orderBy: { createdAt: 'desc' },
    })
  }

  async search(query: string) {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { telegramUsername: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }
}
