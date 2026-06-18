import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { generateId } from '../../shared/utils/id.js'
import { SlaTargetType, CreateSlaDto, SlaStatus, SlaBreachCheckResult } from './sla.types.js'

export class SlaService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async startSla(dto: CreateSlaDto) {
    const slaId = generateId()

    const data = await this.prisma.slaEntry.create({
      data: {
        id: slaId,
        caseId: dto.caseId ?? null,
        ticketId: dto.ticketId ?? null,
        policyName: dto.policyName,
        targetHours: dto.targetHours,
        deadlineAt: dto.deadlineAt,
      },
    })

    logger.info({ slaId, policyName: dto.policyName }, 'SLA started')
    await this.eventBus.emit('sla:created', {
      slaId,
      targetEntity: dto.caseId ? 'case' : 'ticket',
      deadlineAt: dto.deadlineAt.toISOString(),
    })

    return data
  }

  async findSlaById(id: string) {
    const data = await this.prisma.slaEntry.findUnique({ where: { id } })
    if (!data) throw new NotFoundError('SlaEntry', id)
    return data
  }

  async findSlasByTarget(targetType: SlaTargetType, targetId: string) {
    const where = targetType === 'case' ? { caseId: targetId } : { ticketId: targetId }
    return this.prisma.slaEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  async findActiveSlas(params: { status?: SlaStatus; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status

    const [items, total] = await Promise.all([
      this.prisma.slaEntry.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.slaEntry.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async checkForBreaches(): Promise<SlaBreachCheckResult[]> {
    const now = new Date()
    const activeSlas = await this.prisma.slaEntry.findMany({
      where: { status: 'ACTIVE' },
    })

    const results: SlaBreachCheckResult[] = []

    for (const sla of activeSlas) {
      const breached = !sla.breachedAt && sla.deadlineAt <= now

      if (breached) {
        await this.prisma.slaEntry.update({
          where: { id: sla.id },
          data: { breachedAt: now, status: 'BREACHED' },
        })

        logger.warn({ slaId: sla.id, targetId: sla.caseId ?? sla.ticketId, breached }, 'SLA breached')
        await this.eventBus.emit('sla:breached', {
          slaId: sla.id,
          targetEntity: sla.caseId ? 'case' : 'ticket',
          entityId: sla.caseId ?? sla.ticketId,
        })

        results.push({
          slaId: sla.id,
          targetId: sla.caseId ?? sla.ticketId ?? '',
          targetType: sla.caseId ? 'case' : 'ticket',
          breached,
        })
      }
    }

    return results
  }

  async resolveSla(id: string) {
    const sla = await this.findSlaById(id)
    if (sla.status === 'RESOLVED') throw new ValidationError('SLA is already resolved')

    const data = await this.prisma.slaEntry.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    })

    logger.info({ slaId: id }, 'SLA resolved')
    await this.eventBus.emit('sla:resolved', { slaId: id })

    return data
  }

  async calculateCompliance(targetType: SlaTargetType, targetId: string) {
    const where = targetType === 'case' ? { caseId: targetId } : { ticketId: targetId }
    const slas = await this.prisma.slaEntry.findMany({ where })

    const total = slas.length
    const breached = slas.filter((s) => s.status === 'BREACHED').length
    const resolved = slas.filter((s) => s.status === 'RESOLVED').length

    return {
      total,
      breached,
      resolved,
      active: slas.filter((s) => s.status === 'ACTIVE').length,
      complianceRate: total > 0 ? Math.round(((total - breached) / total) * 100) : 100,
    }
  }
}
