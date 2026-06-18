import { AnalyticsService } from './analytics.service.js'
import { RecordMetricDto, MetricQueryParams, CreateDashboardDto, UpdateDashboardDto, DashboardQueryParams, AnalyticsMetricName } from './analytics.types.js'

const service = new AnalyticsService()

export const AnalyticsController = {
  async recordMetric(req: { body: RecordMetricDto }) {
    const data = await service.recordMetric(req.body)
    return { status: 201, body: data }
  },

  async queryMetrics(req: { query: Record<string, string | undefined> }) {
    const data = await service.queryMetrics({
      metric: req.query.metric as AnalyticsMetricName,
      category: req.query.category,
      period: req.query.period,
      from: req.query.from,
      to: req.query.to,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async aggregation(req: { params: { metric: AnalyticsMetricName }; query: Record<string, string | undefined> }) {
    const data = await service.getMetricAggregation(
      req.params.metric,
      req.query.period,
      req.query.from,
      req.query.to,
    )
    return { status: 200, body: data }
  },

  async createDashboard(req: { body: CreateDashboardDto }) {
    const data = await service.createDashboard(req.body)
    return { status: 201, body: data }
  },

  async getDashboard(req: { params: { id: string } }) {
    const data = await service.getDashboard(req.params.id)
    return { status: 200, body: data }
  },

  async updateDashboard(req: { params: { id: string }; body: UpdateDashboardDto }) {
    const data = await service.updateDashboard(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async deleteDashboard(req: { params: { id: string } }) {
    const data = await service.deleteDashboard(req.params.id)
    return { status: 200, body: data }
  },

  async listDashboards(req: { query: Record<string, string | undefined> }) {
    const data = await service.listDashboards({
      ownerId: req.query.ownerId,
      isDefault: req.query.isDefault !== undefined ? req.query.isDefault === 'true' : undefined,
      isPublic: req.query.isPublic !== undefined ? req.query.isPublic === 'true' : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async setDefault(req: { params: { id: string }; body: { ownerId: string } }) {
    const data = await service.setDefaultDashboard(req.params.id, req.body.ownerId)
    return { status: 200, body: data }
  },
}
