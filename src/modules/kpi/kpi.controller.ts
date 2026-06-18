import { KpiService } from './kpi.service.js'
import { CreateKpiDefinitionDto, UpdateKpiDefinitionDto, CreateKpiRecordDto, CreateKpiTargetDto } from './kpi.types.js'

const service = new KpiService()

export const KpiController = {
  async createDefinition(req: { body: CreateKpiDefinitionDto }) {
    const data = await service.createDefinition(req.body)
    return { status: 201, body: data }
  },

  async getDefinition(req: { params: { id: string } }) {
    const data = await service.findDefinitionById(req.params.id)
    return { status: 200, body: data }
  },

  async listDefinitions(req: { query: Record<string, string | undefined> }) {
    const activeOnly = req.query.activeOnly !== 'false'
    const data = await service.listDefinitions(activeOnly)
    return { status: 200, body: data }
  },

  async updateDefinition(req: { params: { id: string }; body: UpdateKpiDefinitionDto }) {
    const data = await service.updateDefinition(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async createRecord(req: { body: CreateKpiRecordDto }) {
    const data = await service.createRecord(req.body)
    return { status: 201, body: data }
  },

  async getRecord(req: { params: { id: string } }) {
    const data = await service.findRecordById(req.params.id)
    return { status: 200, body: data }
  },

  async listRecords(req: { query: Record<string, string | undefined> }) {
    const data = await service.listRecords({
      definitionId: req.query.definitionId,
      staffId: req.query.staffId,
      departmentId: req.query.departmentId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async createTarget(req: { body: CreateKpiTargetDto }) {
    const data = await service.createTarget(req.body)
    return { status: 201, body: data }
  },

  async listTargets(req: { query: Record<string, string | undefined> }) {
    const data = await service.listTargets({
      definitionId: req.query.definitionId,
      staffId: req.query.staffId,
      departmentId: req.query.departmentId,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async getStaffSummary(req: { params: { staffId: string } }) {
    const data = await service.getStaffSummary(req.params.staffId)
    return { status: 200, body: data }
  },
}
