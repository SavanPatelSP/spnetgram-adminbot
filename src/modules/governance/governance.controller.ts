import { GovernanceService } from './governance.service.js'
import { PermissionOverrideDto, SpecialAccessGrantDto, TemporaryPermissionDto, SensitiveActionConfig } from './governance.types.js'

const service = new GovernanceService()

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

export const GovernanceController = {
  async checkAccess(params: { staffId: string; resource: string; action: string }): Promise<HandlerResponse> {
    try {
      const result = await service.checkAccess(params.staffId, params.resource, params.action)
      return ok(result)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async grantTemporaryPermission(params: TemporaryPermissionDto): Promise<HandlerResponse> {
    try {
      const permission = await service.grantTemporaryPermission(params)
      return created(permission)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async revokeTemporaryPermission(params: { id: string }): Promise<HandlerResponse> {
    try {
      const permission = await service.revokeTemporaryPermission(params.id)
      return ok(permission)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async grantOverride(params: PermissionOverrideDto): Promise<HandlerResponse> {
    try {
      const override = await service.grantOverride(params)
      return created(override)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async revokeOverride(params: { staffId: string; resource: string; action: string }): Promise<HandlerResponse> {
    try {
      const override = await service.revokeOverride(params.staffId, params.resource, params.action)
      return ok(override)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async grantSpecialAccess(params: SpecialAccessGrantDto): Promise<HandlerResponse> {
    try {
      const grant = await service.grantSpecialAccess(params)
      return created(grant)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async revokeSpecialAccess(params: { id: string }): Promise<HandlerResponse> {
    try {
      const grant = await service.revokeSpecialAccess(params.id)
      return ok(grant)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async listOverrides(params: { query: { staffId?: string } }): Promise<HandlerResponse> {
    const overrides = await service.listActiveOverrides(params.query?.staffId)
    return ok(overrides)
  },

  async listTemporaryPermissions(params: { query: { staffId?: string } }): Promise<HandlerResponse> {
    const permissions = await service.listTemporaryPermissions(params.query?.staffId)
    return ok(permissions)
  },

  async configureSensitiveAction(params: SensitiveActionConfig): Promise<HandlerResponse> {
    try {
      const action = await service.configureSensitiveAction(params)
      return created(action)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async listSensitiveActions(): Promise<HandlerResponse> {
    const actions = await service.listSensitiveActions()
    return ok(actions)
  },

  async validateSensitiveAction(params: { actionType: string; staffId: string }): Promise<HandlerResponse> {
    try {
      const result = await service.validateSensitiveAction(params.actionType, params.staffId)
      return ok(result)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async createAuditExport(params: { format: string; filters?: Record<string, unknown>; requestedBy?: string }): Promise<HandlerResponse> {
    try {
      const exportRecord = await service.createAuditExport(params.format, params.filters ?? null, params.requestedBy)
      return created(exportRecord)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async getAuditExport(params: { id: string }): Promise<HandlerResponse> {
    try {
      const exportRecord = await service.getAuditExport(params.id)
      return ok(exportRecord)
    } catch (e) {
      return notFound((e as Error).message)
    }
  },

  async processExpired(): Promise<HandlerResponse> {
    const result = await service.processExpiredPermissions()
    return ok(result)
  },
}
