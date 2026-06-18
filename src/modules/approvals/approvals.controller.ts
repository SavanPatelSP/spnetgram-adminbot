import { ApprovalsService } from './approvals.service.js'
import { CreateApprovalRequestDto, ApproveStepDto, RejectStepDto, RequestInfoDto } from './approvals.types.js'

const service = new ApprovalsService()

export const ApprovalsController = {
  async createRequest(req: { body: CreateApprovalRequestDto }) {
    const data = await service.createRequest(req.body)
    return { status: 201, body: data }
  },

  async getById(req: { params: { id: string } }) {
    const data = await service.findById(req.params.id)
    return { status: 200, body: data }
  },

  async getByReference(req: { params: { referenceId: string } }) {
    const data = await service.findByReferenceId(req.params.referenceId)
    return { status: 200, body: data }
  },

  async list(req: { query: Record<string, string | undefined> }) {
    const data = await service.findMany({
      status: req.query.status as any,
      requesterId: req.query.requesterId,
      resourceType: req.query.resourceType,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async getPendingForApprover(req: { params: { userId: string } }) {
    const data = await service.getPendingForApprover(req.params.userId)
    return { status: 200, body: data }
  },

  async approveStep(req: { body: ApproveStepDto }) {
    const data = await service.approveStep(req.body)
    return { status: 200, body: data ?? { success: true } }
  },

  async rejectStep(req: { body: RejectStepDto }) {
    const data = await service.rejectStep(req.body)
    return { status: 200, body: data ?? { success: true } }
  },

  async requestInfo(req: { body: RequestInfoDto }) {
    const data = await service.requestInfo(req.body)
    return { status: 200, body: data ?? { success: true } }
  },

  async cancelRequest(req: { params: { id: string }; body: { userId: string } }) {
    const data = await service.cancelRequest(req.params.id, req.body.userId)
    return { status: 200, body: data ?? { success: true } }
  },
}
