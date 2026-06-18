import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { TicketStatus, TicketPriority, CreateTicketDto, UpdateTicketDto, TicketReplyDto, VALID_TICKET_TRANSITIONS } from './tickets.types.js'
import { generateId } from '../../shared/utils/id.js'
import { SyncPublishers } from '@modules/sync/sync.publishers.js'

export class TicketsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(dto: CreateTicketDto) {
    const id = generateId()
    const ref = `TKT-${id.slice(0, 8).toUpperCase()}`

    const data = await this.prisma.ticket.create({
      data: {
        id,
        referenceId: ref,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority,
        status: 'OPEN',
        reporterId: dto.reporterId,
        caseId: dto.caseId,
      },
    })

    logger.info({ ticketId: id, referenceId: ref }, 'Ticket created')
    await this.eventBus.emit('ticket:created', { ticketId: id, referenceId: ref, reporterId: dto.reporterId })

    return data
  }

  async findById(id: string) {
    const data = await this.prisma.ticket.findUnique({
      where: { id },
      include: { ticketReplies: { orderBy: { createdAt: 'asc' } } },
    })
    if (!data) throw new NotFoundError('Ticket', id)
    return data
  }

  async findMany(params: { status?: TicketStatus; priority?: TicketPriority; assigneeId?: string; reporterId?: string; page?: number; limit?: number }) {
    const { status, priority, assigneeId, reporterId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (reporterId) where.reporterId = reporterId

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.ticket.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async update(id: string, dto: UpdateTicketDto) {
    await this.findById(id)

    const data = await this.prisma.ticket.update({
      where: { id },
      data: dto,
    })

    logger.info({ ticketId: id }, 'Ticket updated')
    await this.eventBus.emit('ticket:updated', { ticketId: id })

    return data
  }

  async assign(ticketId: string, assigneeId: string, assignedBy: string) {
    await this.findById(ticketId)

    const data = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId },
    })

    logger.info({ ticketId, assigneeId, assignedBy }, 'Ticket assigned')
    await this.eventBus.emit('ticket:assigned', { ticketId, assigneeId })

    return data
  }

  async transitionStatus(ticketId: string, newStatus: TicketStatus, changedBy: string, reason?: string) {
    const existing = await this.findById(ticketId)
    const current = existing.status as TicketStatus

    const allowed = VALID_TICKET_TRANSITIONS[current]
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(`Invalid ticket status transition from '${current}' to '${newStatus}'`)
    }

    const data = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: newStatus,
        closedAt: newStatus === 'CLOSED' ? new Date() : undefined,
      },
    })

    logger.info({ ticketId, from: current, to: newStatus, changedBy, reason }, 'Ticket status changed')
    if (newStatus === 'CLOSED' || newStatus === 'RESOLVED') {
      SyncPublishers.publishTicketClosed(ticketId, changedBy, reason)
    }

    return data
  }

  async addReply(dto: TicketReplyDto) {
    await this.findById(dto.ticketId)

    const replyId = generateId()
    const reply = await this.prisma.ticketReply.create({
      data: {
        id: replyId,
        ticketId: dto.ticketId,
        userId: dto.userId,
        content: dto.content,
      },
    })

    if (dto.userId !== (await this.findById(dto.ticketId)).reporterId) {
      await this.prisma.ticket.update({
        where: { id: dto.ticketId },
        data: { status: 'WAITING_REPLY' },
      })
    }

    logger.info({ ticketId: dto.ticketId, replyId, userId: dto.userId }, 'Ticket reply added')
    await this.eventBus.emit('ticket:replied', { ticketId: dto.ticketId, userId: dto.userId })

    return reply
  }
}
