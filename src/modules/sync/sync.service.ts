import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateSyncEventDto, SyncEventQueryParams, UpdateSyncEventDto } from './sync.types.js'
import { SyncEvents } from './sync.events.js'

export class SyncService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async createEvent(dto: CreateSyncEventDto) {
    const event = await this.prisma.syncEvent.create({
      data: {
        eventType: dto.eventType,
        source: dto.source ?? 'spnetgram',
        target: dto.target ?? 'adminbot',
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action,
        payload: dto.payload as any,
        status: 'PENDING',
      },
    })

    logger.info({ syncEventId: event.id, eventType: dto.eventType }, 'Sync event created')
    await SyncEvents.created(event.id, dto.eventType, dto.entityType, dto.entityId)
    return event
  }

  async getEvent(id: string) {
    const event = await this.prisma.syncEvent.findUnique({ where: { id } })
    if (!event) throw new NotFoundError('SyncEvent', id)
    return event
  }

  async queryEvents(params: SyncEventQueryParams) {
    const { status, eventType, entityType, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (eventType) where.eventType = eventType
    if (entityType) where.entityType = entityType

    const [items, total] = await Promise.all([
      this.prisma.syncEvent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.syncEvent.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async updateEvent(id: string, dto: UpdateSyncEventDto) {
    await this.getEvent(id)
    const event = await this.prisma.syncEvent.update({
      where: { id },
      data: {
        status: dto.status,
        error: dto.error,
        retryCount: dto.retryCount,
      },
    })
    logger.info({ syncEventId: id, status: dto.status }, 'Sync event updated')
    return event
  }

  async markProcessed(id: string) {
    await this.getEvent(id)
    const event = await this.prisma.syncEvent.update({
      where: { id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date(),
      },
    })
    logger.info({ syncEventId: id }, 'Sync event marked as processed')
    await SyncEvents.processed(id, 'PROCESSED')
    return event
  }

  async markFailed(id: string, error: string) {
    await this.getEvent(id)
    const event = await this.prisma.syncEvent.update({
      where: { id },
      data: {
        status: 'FAILED',
        error,
      },
    })
    logger.info({ syncEventId: id, error }, 'Sync event marked as failed')
    await SyncEvents.failed(id, error)
    return event
  }

  async getPendingEvents(limit = 50) {
    return this.prisma.syncEvent.findMany({
      where: { status: 'PENDING' },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })
  }

  async getFailedEvents(retryCountMax = 3, limit = 50) {
    return this.prisma.syncEvent.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lte: retryCountMax },
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })
  }
}
