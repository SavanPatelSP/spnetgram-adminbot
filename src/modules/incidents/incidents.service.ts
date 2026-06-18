import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateIncidentDto, UpdateIncidentDto, IncidentQueryParams, AddTimelineEntryDto, CreateReportDto, CreateRcaDto } from './incidents.types.js'
import { IncidentsEvents } from './incidents.events.js'

export class IncidentsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(dto: CreateIncidentDto) {
    if (!dto.title) throw new ValidationError('title is required')

    const incident = await this.prisma.incident.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'P3',
        severity: dto.severity ?? 'MEDIUM',
        category: dto.category,
        source: dto.source,
        assigneeId: dto.assigneeId,
        tags: dto.tags ?? [],
      },
    })

    logger.info({ incidentId: incident.id, referenceId: incident.referenceId, title: incident.title }, 'Incident created')
    await IncidentsEvents.created(incident.id, incident.referenceId, incident.title, incident.priority)

    await this.prisma.incidentTimeline.create({
      data: {
        incidentId: incident.id,
        action: 'CREATED',
        description: 'Incident detected and created',
      },
    })

    return incident
  }

  async findById(id: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id },
      include: { timeline: { orderBy: { createdAt: 'asc' } }, reports: true, rcaFindings: true },
    })
    if (!incident) throw new NotFoundError('Incident', id)
    return incident
  }

  async findMany(params: IncidentQueryParams) {
    const { status, priority, assigneeId, category, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    if (assigneeId) where.assigneeId = assigneeId
    if (category) where.category = category

    const [items, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.incident.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async update(id: string, dto: UpdateIncidentDto) {
    const existing = await this.findById(id)

    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: dto.status,
        priority: dto.priority,
        severity: dto.severity,
        description: dto.description,
        assigneeId: dto.assigneeId,
        tags: dto.tags,
      },
    })

    if (dto.status && dto.status !== existing.status) {
      logger.info({ incidentId: id, previousStatus: existing.status, newStatus: dto.status }, 'Incident status updated')
      await IncidentsEvents.updated(id, incident.status)
    }

    return incident
  }

  async resolve(id: string) {
    const existing = await this.findById(id)

    const incident = await this.prisma.incident.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    })

    await this.prisma.incidentTimeline.create({
      data: {
        incidentId: id,
        action: 'RESOLVED',
        description: 'Incident marked as resolved',
      },
    })

    logger.info({ incidentId: id }, 'Incident resolved')
    await IncidentsEvents.resolved(id, incident.resolvedAt!.toISOString())
    return incident
  }

  async addTimelineEntry(dto: AddTimelineEntryDto) {
    const incident = await this.findById(dto.incidentId)

    const entry = await this.prisma.incidentTimeline.create({
      data: {
        incidentId: dto.incidentId,
        action: dto.action,
        description: dto.description,
        actorId: dto.actorId,
      },
    })

    logger.info({ incidentId: dto.incidentId, action: dto.action }, 'Timeline entry added')
    return entry
  }

  async getTimeline(incidentId: string) {
    await this.findById(incidentId)
    return this.prisma.incidentTimeline.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createReport(dto: CreateReportDto) {
    const report = await this.prisma.incidentReport.create({
      data: {
        incidentId: dto.incidentId,
        title: dto.title,
        body: dto.body,
        reportType: dto.reportType ?? 'INITIAL',
        authorId: dto.authorId,
      },
    })

    logger.info({ reportId: report.id, incidentId: dto.incidentId, reportType: report.reportType }, 'Incident report generated')
    await IncidentsEvents.reportGenerated(report.id, dto.incidentId, report.reportType)
    return report
  }

  async getReports(incidentId: string) {
    await this.findById(incidentId)
    return this.prisma.incidentReport.findMany({
      where: { incidentId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getReportById(id: string) {
    const report = await this.prisma.incidentReport.findUnique({ where: { id } })
    if (!report) throw new NotFoundError('IncidentReport', id)
    return report
  }

  async createRca(dto: CreateRcaDto) {
    const existing = await this.prisma.incidentRca.findUnique({ where: { incidentId: dto.incidentId } })
    if (existing) throw new ConflictError('RCA already exists for this incident')

    const rca = await this.prisma.incidentRca.create({
      data: {
        incidentId: dto.incidentId,
        rootCause: dto.rootCause,
        contributingFactors: dto.contributingFactors as any,
        impact: dto.impact,
        recommendation: dto.recommendation,
        actionItems: dto.actionItems as any,
        severity: dto.severity,
        authorId: dto.authorId,
      },
    })

    logger.info({ rcaId: rca.id, incidentId: dto.incidentId }, 'RCA created')
    return rca
  }

  async getRcaByIncident(incidentId: string) {
    const rca = await this.prisma.incidentRca.findUnique({ where: { incidentId } })
    if (!rca) throw new NotFoundError('IncidentRca', incidentId)
    return rca
  }

  async approveRca(rcaId: string, approvedBy: string) {
    const existing = await this.prisma.incidentRca.findUnique({ where: { id: rcaId } })
    if (!existing) throw new NotFoundError('IncidentRca', rcaId)

    const rca = await this.prisma.incidentRca.update({
      where: { id: rcaId },
      data: { isApproved: true, approvedBy, approvedAt: new Date() },
    })

    logger.info({ rcaId, approvedBy }, 'RCA approved')
    return rca
  }
}
