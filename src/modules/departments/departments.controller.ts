import { DepartmentsService } from './departments.service.js'
import { CreateDepartmentDto, UpdateDepartmentDto, AddStaffDto } from './departments.types.js'

const service = new DepartmentsService()

export const DepartmentsController = {
  async create(req: { body: CreateDepartmentDto }) {
    const data = await service.create(req.body)
    return { status: 201, body: data }
  },

  async getById(req: { params: { id: string } }) {
    const data = await service.findById(req.params.id)
    return { status: 200, body: data }
  },

  async list(req: { query: Record<string, string | undefined> }) {
    const data = await service.findMany({
      type: req.query.type as any,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async update(req: { params: { id: string }; body: UpdateDepartmentDto }) {
    const data = await service.update(req.params.id, req.body)
    return { status: 200, body: data }
  },

  async addStaff(req: { body: AddStaffDto }) {
    const data = await service.addStaff(req.body)
    return { status: 201, body: data }
  },

  async removeStaff(req: { params: { departmentId: string; staffId: string } }) {
    const data = await service.removeStaff(req.params.departmentId, req.params.staffId)
    return { status: 200, body: data }
  },

  async getStaff(req: { params: { id: string } }) {
    const data = await service.getStaffByDepartment(req.params.id)
    return { status: 200, body: data }
  },
}
