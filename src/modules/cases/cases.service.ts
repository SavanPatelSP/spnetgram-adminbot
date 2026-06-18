import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CaseStatus, CasePriority, CreateCaseDto, UpdateCaseDto, VALID_STATUS_TRANSITIONS } from './cases.types.js'
import { generateId } from '../../shared/utils/id.js'
import { SyncPublishers } from '@modules/sync/sync.publishers.js'

export class CasesService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(dto: CreateCaseDto) {
    const id = generateId()
    const ref = `CASE-${id.slice(0, 8).toUpperCase()}`

    const data = await this.prisma.case.create({
      data: {
        id,
        referenceId: ref,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: 'OPEN',
        reporterId: dto.reporterId,
        module: dto.module,
      },
    })

    logger.info({ caseId: id, referenceId: ref }, 'Case created')
    await this.eventBus.emit('case:created', { caseId: id, referenceId: ref, reporterId: dto.reporterId })

    return data
  }

  async findById(id: string) {
    const data = await this.prisma.case.findUnique({ where: { id } })
    if (!data) throw new NotFoundError('Case', id)
    return data
  }

  async findMany(params: { status?: CaseStatus; priority?: CasePriority; assigneeId?: string; reporterId?: string; page?: number; limit?: number }) {
    const { status, priority, assigneeId, reporterId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (reporterId) where.reporterId = reporterId

    const [items, total] = await Promise.all([
      this.prisma.case.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.case.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async update(id: string, dto: UpdateCaseDto) {
    const existing = await this.findById(id)

    const data = await this.prisma.case.update({
      where: { id },
      data: dto,
    })

    logger.info({ caseId: id }, 'Case updated')
    await this.eventBus.emit('case:updated', { caseId: id })

    return data
  }

  async assign(caseId: string, assigneeId: string, assignedBy: string) {
    const existing = await this.findById(caseId)

    const data = await this.prisma.case.update({
      where: { id: caseId },
      data: { assigneeId },
    })

    logger.info({ caseId, assigneeId, assignedBy }, 'Case assigned')
    await this.eventBus.emit('case:assigned', { caseId, assigneeId })

    return data
  }

  async transitionStatus(caseId: string, newStatus: CaseStatus, changedBy: string, reason?: string) {
    const existing = await this.findById(caseId)
    const current = existing.status as CaseStatus

    const allowed = VALID_STATUS_TRANSITIONS[current]
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(`Invalid status transition from '${current}' to '${newStatus}'`)
    }

    const data = await this.prisma.case.update({
      where: { id: caseId },
      data: {
        status: newStatus,
        closedAt: newStatus === 'DISMISSED' ? new Date() : undefined,
      },
    })

    logger.info({ caseId, from: current, to: newStatus, changedBy, reason }, 'Case status changed')
    await this.eventBus.emit('case:status:changed', { caseId, previousStatus: current, newStatus })
    if (newStatus === 'DISMISSED' || newStatus === 'RESOLVED') {
      SyncPublishers.publishCaseClosed(caseId, changedBy, reason)
    }

    return data
  }
}
