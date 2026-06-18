import { DashboardService } from './dashboard.service.js'
import { DashboardSnapshotType, SnapshotQueryParams } from './dashboard.types.js'

const service = new DashboardService()

export const DashboardController = {
  async staffOverview() {
    const data = await service.getStaffOverview()
    return { status: 200, body: data }
  },

  async moderationStats(req: { query: Record<string, string | undefined> }) {
    const data = await service.getModerationStats({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async ticketStats(req: { query: Record<string, string | undefined> }) {
    const data = await service.getTicketStats({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async caseStats(req: { query: Record<string, string | undefined> }) {
    const data = await service.getCaseStats({
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async kpiSummary() {
    const data = await service.getKpiSummary()
    return { status: 200, body: data }
  },

  async securitySummary() {
    const data = await service.getSecuritySummary()
    return { status: 200, body: data }
  },

  async systemHealth() {
    const data = await service.getSystemHealth()
    return { status: 200, body: data }
  },

  async snapshot(req: { body: { types: DashboardSnapshotType[] } }) {
    const data = await service.getAggregatedSnapshot(req.body.types)
    return { status: 200, body: data }
  },
}
