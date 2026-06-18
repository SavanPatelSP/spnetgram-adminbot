import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { generateId } from '../../shared/utils/id.js'
import {
  InvestigationStatus,
  CreateInvestigationDto,
  UpdateInvestigationDto,
  AddEvidenceDto,
  VALID_INVESTIGATION_TRANSITIONS,
} from './investigations.types.js'

export class InvestigationsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(dto: CreateInvestigationDto) {
    const id = generateId()
    const data = await this.prisma.investigation.create({
      data: {
        id,
        caseId: dto.caseId ?? null,
        title: dto.title,
        description: dto.description ?? null,
        status: 'DRAFT',
        severity: dto.severity ?? 'MEDIUM',
        reporterId: dto.reporterId,
        assigneeId: dto.assigneeId ?? null,
      } as any,
    })

    logger.info({ investigationId: id, title: dto.title }, 'Investigation created')
    await this.eventBus.emit('investigation:created', {
      investigationId: id,
      caseId: dto.caseId,
      reporterId: dto.reporterId,
    })

    return data
  }

  async findById(id: string) {
    const data = await this.prisma.investigation.findUnique({
      where: { id },
    })
    if (!data) throw new NotFoundError('Investigation', id)
    return data
  }

  async findMany(params: { status?: InvestigationStatus; assigneeId?: string; caseId?: string; page?: number; limit?: number }) {
    const { status, assigneeId, caseId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}

    if (status) where.status = status
    if (assigneeId) where.assigneeId = assigneeId
    if (caseId) where.caseId = caseId

    const [items, total] = await Promise.all([
      this.prisma.investigation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.investigation.count({ where }),
    ])

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async update(id: string, dto: UpdateInvestigationDto) {
    await this.findById(id)

    const data = await this.prisma.investigation.update({
      where: { id },
      data: dto as any,
    })

    logger.info({ investigationId: id }, 'Investigation updated')
    await this.eventBus.emit('investigation:updated', { investigationId: id })

    return data
  }

  async transitionStatus(investigationId: string, newStatus: InvestigationStatus, changedBy: string, reason?: string) {
    const existing = await this.findById(investigationId)
    const current = existing.status as InvestigationStatus

    const allowed = VALID_INVESTIGATION_TRANSITIONS[current]
    if (!allowed || !allowed.includes(newStatus)) {
      throw new ValidationError(`Invalid investigation status transition from '${current}' to '${newStatus}'`)
    }

    const updateData: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const data = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: updateData,
    })

    logger.info({ investigationId, from: current, to: newStatus, changedBy, reason }, 'Investigation status changed')

    if (newStatus === 'COMPLETED') {
      await this.eventBus.emit('investigation:completed', { investigationId })
    }

    return data
  }

  async addEvidence(dto: AddEvidenceDto) {
    const investigation = await this.findById(dto.investigationId)
    if ((investigation.status as InvestigationStatus) === 'COMPLETED' || (investigation.status as InvestigationStatus) === 'ARCHIVED') {
      throw new ValidationError('Cannot add evidence to a completed or archived investigation')
    }

    const currentEvidence = (investigation.evidence as Record<string, unknown>[]) || []
    const evidenceItem = {
      id: generateId(),
      type: dto.type,
      description: dto.description,
      fileUrl: dto.fileUrl,
      metadata: dto.metadata || {},
      submittedById: dto.submittedById,
      createdAt: new Date().toISOString(),
    }

    await this.prisma.investigation.update({
      where: { id: dto.investigationId },
      data: { evidence: [...currentEvidence, evidenceItem] as any },
    })

    logger.info({ evidenceId: evidenceItem.id, investigationId: dto.investigationId, type: dto.type }, 'Evidence added')
    return evidenceItem
  }

  async removeEvidence(investigationId: string, evidenceId: string) {
    const investigation = await this.findById(investigationId)
    if ((investigation.status as InvestigationStatus) === 'COMPLETED' || (investigation.status as InvestigationStatus) === 'ARCHIVED') {
      throw new ValidationError('Cannot remove evidence from a completed or archived investigation')
    }

    const currentEvidence = (investigation.evidence as Record<string, unknown>[]) || []
    const filtered = currentEvidence.filter((e) => e.id !== evidenceId)

    if (filtered.length === currentEvidence.length) {
      throw new NotFoundError('Evidence', evidenceId)
    }

    await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { evidence: filtered as any },
    })

    logger.info({ evidenceId, investigationId }, 'Evidence removed')
    return { removed: true }
  }

  async getEvidence(investigationId: string) {
    const investigation = await this.findById(investigationId)
    return (investigation.evidence as Record<string, unknown>[]) || []
  }

  async assign(investigationId: string, assigneeId: string, assignedBy: string) {
    await this.findById(investigationId)

    const data = await this.prisma.investigation.update({
      where: { id: investigationId },
      data: { assigneeId },
    })

    logger.info({ investigationId, assigneeId, assignedBy }, 'Investigation assigned')
    return data
  }
}
