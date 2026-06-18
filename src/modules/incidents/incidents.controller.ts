import { IncidentsService } from './incidents.service.js'
import { CreateIncidentDto, UpdateIncidentDto, IncidentQueryParams, AddTimelineEntryDto, CreateReportDto, CreateRcaDto } from './incidents.types.js'

const service = new IncidentsService()

export const IncidentsController = {
  async create(req: { body: CreateIncidentDto }) {
    const data = await service.create(req.body)
    return { status: 201, body: data }
  },

  async getById(req: { params: { id: string } }) {
    const data = await service.findById(req.params.id)
    return { status: 200, body: data }
  },

  async list(req: { query: Record<string, string | undefined> }) {
    const data = await service.findMany({
      status: req.query.status as any,
      priority: req.query.priority as any,
      assigneeId: req.query.assigneeId,
      category: req.query.category,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async update(req: { params: { id: string }; body: UpdateIncidentDto }) {
    const data = await service.update(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async resolve(req: { params: { id: string } }) {
    const data = await service.resolve(req.params.id)
    return { status: 200, body: data }
  },

  async addTimeline(req: { body: AddTimelineEntryDto }) {
    const data = await service.addTimelineEntry(req.body)
    return { status: 201, body: data }
  },

  async getTimeline(req: { params: { incidentId: string } }) {
    const data = await service.getTimeline(req.params.incidentId)
    return { status: 200, body: data }
  },

  async createReport(req: { body: CreateReportDto }) {
    const data = await service.createReport(req.body)
    return { status: 201, body: data }
  },

  async getReports(req: { params: { incidentId: string } }) {
    const data = await service.getReports(req.params.incidentId)
    return { status: 200, body: data }
  },

  async getReport(req: { params: { id: string } }) {
    const data = await service.getReportById(req.params.id)
    return { status: 200, body: data }
  },

  async createRca(req: { body: CreateRcaDto }) {
    const data = await service.createRca(req.body)
    return { status: 201, body: data }
  },

  async getRca(req: { params: { incidentId: string } }) {
    const data = await service.getRcaByIncident(req.params.incidentId)
    return { status: 200, body: data }
  },

  async approveRca(req: { params: { rcaId: string }; body: { approvedBy: string } }) {
    const data = await service.approveRca(req.params.rcaId, req.body.approvedBy)
    return { status: 200, body: data }
  },
}
