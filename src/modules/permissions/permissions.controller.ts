import { PermissionsService } from './permissions.service.js'
import { GrantPermissionDto, RevokePermissionDto, PermissionFilter, AssignRoleDto } from './permissions.types.js'

const service = new PermissionsService()

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

export const PermissionsController = {
  async getByStaff(params: { staffId: string }): Promise<HandlerResponse> {
    try {
      const permissions = await service.findByStaffId(params.staffId)
      return ok(permissions)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async grant(params: GrantPermissionDto): Promise<HandlerResponse> {
    try {
      const rolePermission = await service.grant(params)
      return created(rolePermission)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async revoke(params: RevokePermissionDto): Promise<HandlerResponse> {
    try {
      await service.revoke(params)
      return ok({ revoked: true })
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async list(params: PermissionFilter): Promise<HandlerResponse> {
    const permissions = await service.list(params)
    return ok(permissions)
  },

  async check(params: { staffId: string; resource: string; action: string }): Promise<HandlerResponse> {
    const allowed = await service.check(params.staffId, params.resource, params.action)
    return ok({ allowed })
  },

  async listByStaffMember(params: { staffId: string }): Promise<HandlerResponse> {
    try {
      const member = await service.listByStaffMember(params.staffId)
      return ok(member)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async assignRoleToStaff(params: AssignRoleDto): Promise<HandlerResponse> {
    try {
      const assignment = await service.assignRoleToStaff(params.staffId, params.roleName, params.assignedBy)
      return created(assignment)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async removeRoleFromStaff(params: { staffId: string; roleName: string }): Promise<HandlerResponse> {
    try {
      await service.removeRoleFromStaff(params.staffId, params.roleName)
      return ok({ revoked: true })
    } catch (e) {
      return notFound((e as Error).message)
    }
  },
}
