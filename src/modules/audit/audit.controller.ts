import { AuditService } from './audit.service.js'
import { CreateAuditLogDto, AuditLogFilter } from './audit.types.js'

const service = new AuditService()

interface HandlerResponse {
  status: number
  body: Record<string, unknown>
}

function ok(data: unknown): HandlerResponse {
  return { status: 200, body: { success: true, data } }
}

function created(data: unknown): HandlerResponse {
  return { status: 201, body: { success: true, data } }
}

export const AuditController = {
  async create(params: CreateAuditLogDto): Promise<HandlerResponse> {
    const log = await service.create(params)
    return created(log)
  },

  async getById(params: { id: string }): Promise<HandlerResponse> {
    const log = await service.findById(params.id)
    if (!log) return { status: 404, body: { success: false, error: 'Audit log not found' } }
    return ok(log)
  },

  async query(params: AuditLogFilter): Promise<HandlerResponse> {
    const result = await service.query(params)
    return ok(result)
  },

  async findByStaff(params: { staffId: string; limit?: number }): Promise<HandlerResponse> {
    const logs = await service.findByStaff(params.staffId, params.limit)
    return ok(logs)
  },

  async findByActor(params: { actorId: string; limit?: number }): Promise<HandlerResponse> {
    const logs = await service.findByActor(params.actorId, params.limit)
    return ok(logs)
  },

  async findByTarget(params: { targetId: string; limit?: number }): Promise<HandlerResponse> {
    const logs = await service.findByTarget(params.targetId, params.limit)
    return ok(logs)
  },

  async findByResource(params: { resource: string; resourceId: string; limit?: number }): Promise<HandlerResponse> {
    const logs = await service.findByResource(params.resource, params.resourceId, params.limit)
    return ok(logs)
  },

  async generateComplianceReport(params: { fromDate: string; toDate?: string }): Promise<HandlerResponse> {
    const from = new Date(params.fromDate)
    const to = params.toDate ? new Date(params.toDate) : undefined
    const report = await service.generateComplianceReport(from, to)
    return ok(report)
  },

  async exportLogs(params: { format: string; filters: any; requestedBy: string }): Promise<HandlerResponse> {
    const result = await service.exportAuditLogs(params.format, params.filters, params.requestedBy)
    return created(result)
  },

  async getExportStatus(params: { id: string }): Promise<HandlerResponse> {
    const result = await service.getExportStatus(params.id)
    return ok(result)
  },
}
