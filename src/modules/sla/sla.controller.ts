import { SlaService } from './sla.service.js'
import { CreateSlaDto } from './sla.types.js'

const service = new SlaService()

export const SlaController = {
  async startSla(req: { body: CreateSlaDto }) {
    const data = await service.startSla(req.body)
    return { status: 201, body: data }
  },

  async getSla(req: { params: { id: string } }) {
    const data = await service.findSlaById(req.params.id)
    return { status: 200, body: data }
  },

  async getSlasByTarget(req: { params: { targetType: string; targetId: string } }) {
    const data = await service.findSlasByTarget(req.params.targetType as any, req.params.targetId)
    return { status: 200, body: data }
  },

  async listActiveSlas(req: { query: Record<string, string | undefined> }) {
    const data = await service.findActiveSlas({
      status: req.query.status as any,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async checkBreaches() {
    const data = await service.checkForBreaches()
    return { status: 200, body: data }
  },

  async resolveSla(req: { params: { id: string } }) {
    const data = await service.resolveSla(req.params.id)
    return { status: 200, body: data }
  },

  async getCompliance(req: { params: { targetType: string; targetId: string } }) {
    const data = await service.calculateCompliance(req.params.targetType as any, req.params.targetId)
    return { status: 200, body: data }
  },
}
