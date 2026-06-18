import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateDeepLinkDto, DeepLinkQueryParams } from './deeplinks.types.js'
import { DeepLinkEvents } from './deeplinks.events.js'

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export class DeepLinkService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async createLink(dto: CreateDeepLinkDto) {
    const code = generateCode()

    const link = await this.prisma.deepLink.create({
      data: {
        code,
        targetModule: dto.targetModule,
        targetId: dto.targetId,
        source: dto.source,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        maxClicks: dto.maxClicks,
        metadata: dto.metadata as any,
        createdBy: dto.createdBy,
      },
    })

    logger.info({ deeplinkId: link.id, code }, 'Deep link created')
    await DeepLinkEvents.created(link.id, link.code, link.targetModule, link.targetId)
    return link
  }

  async getLink(id: string) {
    const link = await this.prisma.deepLink.findUnique({ where: { id } })
    if (!link) throw new NotFoundError('DeepLink', id)
    return link
  }

  async getLinkByCode(code: string) {
    const link = await this.prisma.deepLink.findUnique({ where: { code } })
    if (!link) throw new NotFoundError('DeepLink', `code: ${code}`)
    return link
  }

  async resolveLink(code: string) {
    const link = await this.prisma.deepLink.findUnique({ where: { code } })
    if (!link) throw new NotFoundError('DeepLink', `code: ${code}`)

    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new ValidationError('Deep link has expired')
    }

    if (link.maxClicks && link.clickCount >= link.maxClicks) {
      throw new ValidationError('Deep link has reached maximum clicks')
    }

    await this.prisma.deepLink.update({
      where: { id: link.id },
      data: { clickCount: { increment: 1 } },
    })

    await DeepLinkEvents.clicked(link.id, link.code)

    return {
      targetModule: link.targetModule,
      targetId: link.targetId,
      source: link.source,
      metadata: link.metadata,
    }
  }

  async listLinks(params: DeepLinkQueryParams) {
    const { targetModule, targetId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (targetModule) where.targetModule = targetModule
    if (targetId) where.targetId = targetId

    const [items, total] = await Promise.all([
      this.prisma.deepLink.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.deepLink.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async deactivateLink(id: string) {
    const link = await this.prisma.deepLink.findUnique({ where: { id } })
    if (!link) throw new NotFoundError('DeepLink', id)

    const updated = await this.prisma.deepLink.update({
      where: { id },
      data: { expiresAt: new Date() },
    })

    logger.info({ deeplinkId: id }, 'Deep link deactivated')
    return updated
  }
}
