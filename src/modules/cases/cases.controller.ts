import { CasesService } from './cases.service.js'
import { CreateCaseDto, UpdateCaseDto, CaseStatusTransitionDto } from './cases.types.js'

const service = new CasesService()

export const CasesController = {
  async create(req: { body: CreateCaseDto }) {
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
      reporterId: req.query.reporterId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async update(req: { params: { id: string }; body: UpdateCaseDto }) {
    const data = await service.update(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async assign(req: { body: { caseId: string; assigneeId: string; assignedBy: string } }) {
    const { caseId, assigneeId, assignedBy } = req.body
    const data = await service.assign(caseId, assigneeId, assignedBy)
    return { status: 200, body: data }
  },

  async transitionStatus(req: { body: CaseStatusTransitionDto }) {
    const { caseId, status, changedBy, reason } = req.body
    const data = await service.transitionStatus(caseId, status, changedBy, reason)
    return { status: 200, body: data }
  },
}
