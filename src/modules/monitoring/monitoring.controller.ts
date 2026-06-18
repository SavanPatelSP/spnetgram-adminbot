import { MonitoringService } from './monitoring.service.js'
import { CreateServiceStatusDto, UpdateServiceStatusDto, ServiceQueryParams, CreateMonitoringAlertDto, AlertQueryParams } from './monitoring.types.js'

const service = new MonitoringService()

export const MonitoringController = {
  async upsertService(req: { body: CreateServiceStatusDto }) {
    const data = await service.upsertService(req.body)
    return { status: 200, body: data }
  },

  async getService(req: { params: { id: string } }) {
    const data = await service.getService(req.params.id)
    return { status: 200, body: data }
  },

  async listServices(req: { query: Record<string, string | undefined> }) {
    const data = await service.listServices({
      status: req.query.status,
      isUp: req.query.isUp !== undefined ? req.query.isUp === 'true' : undefined,
      type: req.query.type,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async updateStatus(req: { params: { id: string }; body: UpdateServiceStatusDto }) {
    const data = await service.updateServiceStatus(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async triggerAlert(req: { body: CreateMonitoringAlertDto }) {
    const data = await service.triggerAlert(req.body)
    return { status: 201, body: data }
  },

  async acknowledgeAlert(req: { params: { alertId: string }; body: { acknowledgedBy: string } }) {
    const data = await service.acknowledgeAlert(req.params.alertId, req.body.acknowledgedBy)
    return { status: 200, body: data }
  },

  async listAlerts(req: { query: Record<string, string | undefined> }) {
    const data = await service.listAlerts({
      serviceId: req.query.serviceId,
      severity: req.query.severity,
      acknowledged: req.query.acknowledged !== undefined ? req.query.acknowledged === 'true' : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async getAlert(req: { params: { id: string } }) {
    const data = await service.getAlertById(req.params.id)
    return { status: 200, body: data }
  },

  async byStatus(req: { params: { status: string } }) {
    const data = await service.getServicesByStatus(req.params.status)
    return { status: 200, body: data }
  },
}
