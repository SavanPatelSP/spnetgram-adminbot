import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { RecordMetricDto, MetricQueryParams, CreateDashboardDto, UpdateDashboardDto, DashboardQueryParams, AnalyticsMetricName } from './analytics.types.js'
import { AnalyticsEvents } from './analytics.events.js'

export class AnalyticsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async recordMetric(dto: RecordMetricDto) {
    if (!dto.metric || dto.value === undefined || dto.value === null) {
      throw new ValidationError('Missing required fields for metric record')
    }

    const record = await this.prisma.analyticsMetricRecord.create({
      data: {
        metric: dto.metric as any,
        category: dto.category,
        value: dto.value,
        unit: dto.unit,
        period: dto.period,
        label: dto.label,
        tags: dto.tags as any,
      },
    })

    logger.info({ recordId: record.id, metric: dto.metric, value: dto.value }, 'Analytic metric recorded')
    await AnalyticsEvents.metricRecorded(record.id, dto.metric, dto.value, dto.period)
    return record
  }

  async queryMetrics(params: MetricQueryParams) {
    const { metric, category, period, from, to, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (metric) where.metric = metric
    if (category) where.category = category
    if (period) where.period = period
    if (from || to) {
      const recordedAt: Record<string, unknown> = {}
      if (from) recordedAt.gte = new Date(from)
      if (to) recordedAt.lte = new Date(to)
      where.recordedAt = recordedAt
    }

    const [items, total] = await Promise.all([
      this.prisma.analyticsMetricRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.analyticsMetricRecord.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getMetricAggregation(metric: AnalyticsMetricName, period?: string, from?: string, to?: string) {
    const where: Record<string, unknown> = { metric }
    if (period) where.period = period
    if (from || to) {
      const recordedAt: Record<string, unknown> = {}
      if (from) recordedAt.gte = new Date(from)
      if (to) recordedAt.lte = new Date(to)
      where.recordedAt = recordedAt
    }

    const records = await this.prisma.analyticsMetricRecord.findMany({ where })

    const values = records.map(r => r.value)
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = values.length > 0 ? sum / values.length : 0
    const min = values.length > 0 ? Math.min(...values) : 0
    const max = values.length > 0 ? Math.max(...values) : 0

    return { metric, period, count: values.length, sum, avg, min, max }
  }

  async createDashboard(dto: CreateDashboardDto) {
    if (!dto.name) {
      throw new ValidationError('Dashboard name is required')
    }

    const dashboard = await this.prisma.analyticsDashboard.create({
      data: {
        name: dto.name,
        description: dto.description,
        layout: dto.layout as any,
        widgets: dto.widgets as any,
        filters: dto.filters as any,
        ownerId: dto.ownerId,
        isDefault: dto.isDefault ?? false,
        isPublic: dto.isPublic ?? false,
      },
    })

    logger.info({ dashboardId: dashboard.id, name: dto.name }, 'Analytics dashboard created')
    await AnalyticsEvents.dashboardCreated(dashboard.id, dto.name, dto.ownerId)
    return dashboard
  }

  async getDashboard(id: string) {
    const dashboard = await this.prisma.analyticsDashboard.findUnique({ where: { id } })
    if (!dashboard) throw new NotFoundError('AnalyticsDashboard', id)
    return dashboard
  }

  async updateDashboard(id: string, dto: UpdateDashboardDto) {
    await this.getDashboard(id)
    const dashboard = await this.prisma.analyticsDashboard.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        layout: dto.layout as any,
        widgets: dto.widgets as any,
        filters: dto.filters as any,
        isDefault: dto.isDefault,
        isPublic: dto.isPublic,
      },
    })
    logger.info({ dashboardId: id }, 'Analytics dashboard updated')
    return dashboard
  }

  async deleteDashboard(id: string) {
    await this.getDashboard(id)
    await this.prisma.analyticsDashboard.delete({ where: { id } })
    logger.info({ dashboardId: id }, 'Analytics dashboard deleted')
    return { deleted: true }
  }

  async listDashboards(params: DashboardQueryParams) {
    const { ownerId, isDefault, isPublic, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (ownerId) where.ownerId = ownerId
    if (isDefault !== undefined) where.isDefault = isDefault
    if (isPublic !== undefined) where.isPublic = isPublic

    const [items, total] = await Promise.all([
      this.prisma.analyticsDashboard.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.analyticsDashboard.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async setDefaultDashboard(id: string, ownerId: string) {
    await this.getDashboard(id)

    await this.prisma.analyticsDashboard.updateMany({
      where: { ownerId, isDefault: true },
      data: { isDefault: false },
    })

    const dashboard = await this.prisma.analyticsDashboard.update({
      where: { id },
      data: { isDefault: true },
    })

    logger.info({ dashboardId: id, ownerId }, 'Default analytics dashboard set')
    return dashboard
  }
}
