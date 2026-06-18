import { StaffService } from './staff.service.js'
import { CreateStaffDto, UpdateStaffDto, StaffRoleName } from './staff.types.js'

const service = new StaffService()

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

function notFound(message: string): HandlerResponse {
  return { status: 404, body: { success: false, error: message } }
}

function conflict(message: string): HandlerResponse {
  return { status: 409, body: { success: false, error: message } }
}

export const StaffController = {
  async getById(params: { id: string }): Promise<HandlerResponse> {
    try {
      const member = await service.findById(params.id)
      return ok(member)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async getByUserId(params: { userId: string }): Promise<HandlerResponse> {
    const member = await service.findByUserId(params.userId)
    if (!member) return notFound('Staff member not found')
    return ok(member)
  },

  async create(params: CreateStaffDto): Promise<HandlerResponse> {
    try {
      const member = await service.create(params)
      return created(member)
    } catch (e) {
      const err = e as Error
      if (err.message.includes('already a staff member')) return conflict(err.message)
      throw e
    }
  },

  async update(params: { id: string } & UpdateStaffDto): Promise<HandlerResponse> {
    try {
      const member = await service.update(params.id, { isActive: params.isActive })
      return ok(member)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async list(params: { isActive?: boolean }): Promise<HandlerResponse> {
    const members = await service.list({ isActive: params.isActive })
    return ok(members)
  },

  async assignRole(params: { id: string; role: string }): Promise<HandlerResponse> {
    try {
      const member = await service.assignRole(params.id, params.role as StaffRoleName)
      return ok(member)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async activate(params: { id: string }): Promise<HandlerResponse> {
    try {
      const member = await service.activate(params.id)
      return ok(member)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async deactivate(params: { id: string }): Promise<HandlerResponse> {
    try {
      const member = await service.deactivate(params.id)
      return ok(member)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },
}
