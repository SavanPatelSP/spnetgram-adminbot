import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { logger } from '@infrastructure/logger/logger.js'
import { generateId } from '../../shared/utils/id.js'
import { safeStringify } from '../../shared/utils/safe-json.js'
import { CreateAuditLogDto, AuditLogFilter, AuditLogQueryResult, ComplianceReport, AuditExportDto } from './audit.types.js'

export class AuditService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(data: CreateAuditLogDto) {
    const log = await this.prisma.auditLog.create({
      data: {
        staffId: data.staffId ?? null,
        actorId: data.actorId ?? null,
        targetId: data.targetId ?? null,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId ?? null,
        reason: data.reason ?? null,
        description: data.description ?? null,
        beforeState: data.beforeState as any ?? null,
        afterState: data.afterState as any ?? null,
        metadata: data.metadata as any,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
        result: data.result ?? null,
      },
    })
    logger.debug({ auditLogId: log.id, action: data.action }, 'Audit log created')
    await this.eventBus.emit('audit:log:created', { log })
    await this.eventBus.emit('audit:logged', { auditId: log.id, staffId: data.staffId ?? undefined, action: data.action, resource: data.resource })
    return log
  }

  async findById(id: string) {
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: { staffMember: { include: { user: true } }, actor: true, target: true },
    })
    return log
  }

  async query(filters: AuditLogFilter): Promise<AuditLogQueryResult> {
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 50
    const skip = (page - 1) * pageSize

    const where = {
      ...(filters.staffId ? { staffId: filters.staffId } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.resource ? { resource: filters.resource } : {}),
      ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
      ...(filters.reason ? { reason: { contains: filters.reason } } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            createdAt: {
              ...(filters.fromDate ? { gte: filters.fromDate } : {}),
              ...(filters.toDate ? { lte: filters.toDate } : {}),
            },
          }
        : {}),
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return { logs, total, page, pageSize }
  }

  async findByStaff(staffId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { staffId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async findByActor(actorId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async findByTarget(targetId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async findByResource(resource: string, resourceId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { resource, resourceId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  async generateComplianceReport(fromDate: Date, toDate?: Date): Promise<ComplianceReport> {
    const end = toDate ?? new Date()
    const where = {
      createdAt: {
        gte: fromDate,
        lte: end,
      },
    }

    const [totalLogs, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: { action: true, resource: true, staffId: true },
      }),
    ])

    const actionBreakdown: Record<string, number> = {}
    const resourceBreakdown: Record<string, number> = {}
    const staffCount: Record<string, number> = {}

    for (const log of logs) {
      actionBreakdown[log.action] = (actionBreakdown[log.action] ?? 0) + 1
      resourceBreakdown[log.resource] = (resourceBreakdown[log.resource] ?? 0) + 1
      if (log.staffId) {
        staffCount[log.staffId] = (staffCount[log.staffId] ?? 0) + 1
      }
    }

    const staffActivitySummary = Object.entries(staffCount)
      .map(([staffId, count]) => ({ staffId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      id: generateId(),
      period: {
        from: fromDate.toISOString(),
        to: end.toISOString(),
      },
      generatedAt: new Date().toISOString(),
      totalLogs,
      actionBreakdown,
      resourceBreakdown,
      staffActivitySummary,
    }
  }

  async exportAuditLogs(format: string, filters: AuditLogFilter, requestedBy: string) {
    const export_ = await this.prisma.auditExport.create({
      data: {
        format,
        filters: filters as any,
        status: 'PENDING',
        requestedBy,
      },
    })

    const where = {
      ...(filters.staffId ? { staffId: filters.staffId } : {}),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.resource ? { resource: filters.resource } : {}),
      ...(filters.resourceId ? { resourceId: filters.resourceId } : {}),
      ...(filters.reason ? { reason: { contains: filters.reason } } : {}),
      ...(filters.fromDate || filters.toDate
        ? {
            createdAt: {
              ...(filters.fromDate ? { gte: filters.fromDate } : {}),
              ...(filters.toDate ? { lte: filters.toDate } : {}),
            },
          }
        : {}),
    }

    const [totalRecords, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' } }),
    ])

    let fileUrl: string
    if (format.toUpperCase() === 'CSV') {
      const headers = ['id', 'action', 'resource', 'resourceId', 'description', 'staffId', 'actorId', 'targetId', 'reason', 'createdAt']
      const csvRows = [headers.join(',')]
      for (const log of logs) {
        const row = [
          log.id,
          log.action,
          log.resource,
          log.resourceId ?? '',
          (log.description ?? '').replace(/"/g, '""'),
          log.staffId ?? '',
          log.actorId ?? '',
          log.targetId ?? '',
          (log.reason ?? '').replace(/"/g, '""'),
          log.createdAt instanceof Date ? log.createdAt.toISOString() : String(log.createdAt),
        ].map(v => `"${v}"`).join(',')
        csvRows.push(row)
      }
      const csvContent = csvRows.join('\n')
      fileUrl = `data:text/csv;base64,${Buffer.from(csvContent).toString('base64')}`
    } else {
      const jsonContent = safeStringify(logs)
      fileUrl = `data:application/json;base64,${Buffer.from(jsonContent).toString('base64')}`
    }

    await this.prisma.auditExport.update({
      where: { id: export_.id },
      data: {
        totalRecords,
        status: 'COMPLETED',
        completedAt: new Date(),
        fileUrl,
      },
    })

    logger.info({ exportId: export_.id, format, totalRecords }, 'Audit export completed')
    return export_
  }

  async getExportStatus(id: string) {
    const export_ = await this.prisma.auditExport.findUnique({ where: { id } })
    if (!export_) {
      const { NotFoundError } = await import('@shared/errors/index.js')
      throw new NotFoundError('AuditExport', id)
    }
    return export_
  }
}
