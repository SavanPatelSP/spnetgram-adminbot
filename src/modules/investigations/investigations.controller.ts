import { InvestigationsService } from './investigations.service.js'
import { CreateInvestigationDto, UpdateInvestigationDto, AddEvidenceDto, InvestigationStatusTransitionDto } from './investigations.types.js'

const service = new InvestigationsService()

export const InvestigationsController = {
  async create(req: { body: CreateInvestigationDto }) {
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
      assigneeId: req.query.assigneeId,
      caseId: req.query.caseId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async update(req: { params: { id: string }; body: UpdateInvestigationDto }) {
    const data = await service.update(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async transitionStatus(req: { body: InvestigationStatusTransitionDto }) {
    const { investigationId, status, changedBy, reason } = req.body
    const data = await service.transitionStatus(investigationId, status, changedBy, reason)
    return { status: 200, body: data }
  },

  async assign(req: { body: { investigationId: string; assigneeId: string; assignedBy: string } }) {
    const { investigationId, assigneeId, assignedBy } = req.body
    const data = await service.assign(investigationId, assigneeId, assignedBy)
    return { status: 200, body: data }
  },

  async addEvidence(req: { body: AddEvidenceDto }) {
    const data = await service.addEvidence(req.body)
    return { status: 201, body: data }
  },

  async removeEvidence(req: { params: { investigationId: string; evidenceId: string } }) {
    const data = await service.removeEvidence(req.params.investigationId, req.params.evidenceId)
    return { status: 200, body: data }
  },

  async getEvidence(req: { params: { investigationId: string } }) {
    const data = await service.getEvidence(req.params.investigationId)
    return { status: 200, body: data }
  },
}
