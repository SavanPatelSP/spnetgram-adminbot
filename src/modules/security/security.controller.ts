import { SecurityService } from './security.service.js'
import { RecordSecurityEventDto, SecurityQueryParams, CreateDeviceSessionDto, CreateLoginHistoryDto } from './security.types.js'

const service = new SecurityService()

export const SecurityController = {
  async record(req: { body: RecordSecurityEventDto }) {
    const data = await service.recordEvent(req.body)
    return { status: 201, body: data }
  },

  async query(req: { query: Record<string, string | undefined> }) {
    const data = await service.queryEvents({
      userId: req.query.userId,
      eventType: req.query.eventType as any,
      severity: req.query.severity as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async getById(req: { params: { id: string } }) {
    const data = await service.getEventById(req.params.id)
    return { status: 200, body: data }
  },

  async registerDevice(req: { body: CreateDeviceSessionDto }) {
    const data = await service.registerDeviceSession(req.body)
    return { status: 201, body: data }
  },

  async deactivateDevice(req: { params: { sessionId: string } }) {
    const data = await service.deactivateDeviceSession(req.params.sessionId)
    return { status: 200, body: data }
  },

  async listSessions(req: { params: { userId: string } }) {
    const data = await service.listSessionsByUser(req.params.userId)
    return { status: 200, body: data }
  },

  async recordLogin(req: { body: CreateLoginHistoryDto }) {
    const data = await service.recordLogin(req.body)
    return { status: 201, body: data }
  },

  async loginHistory(req: { query: Record<string, string | undefined> }) {
    const data = await service.getLoginHistory({
      userId: req.query.userId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async recentFailed(req: { query: { thresholdMinutes?: string } }) {
    const data = await service.getRecentFailedLogins(
      req.query.thresholdMinutes ? Number(req.query.thresholdMinutes) : undefined,
    )
    return { status: 200, body: data }
  },
}
