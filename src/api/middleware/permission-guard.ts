import type { IncomingMessage, ServerResponse } from 'node:http'
import { PermissionsService } from '../../modules/permissions/permissions.service.js'
import { GovernanceService } from '../../modules/governance/governance.service.js'
import { safeStringify } from '../../shared/utils/safe-json.js'

const permissionsService = new PermissionsService()
const governanceService = new GovernanceService()

export interface PermissionCheck {
  resource: string
  action: string
}

export function requirePermission(resource: string, action: string) {
  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const userId = (req as any).userId
    const staffId = (req as any).staffId
    
    if (!staffId) {
      res.statusCode = 401
      res.end(safeStringify({ error: 'Unauthorized', code: 'UNAUTHORIZED' }))
      return false
    }

    // Check role-based permissions first
    const hasRolePermission = await permissionsService.check(staffId, resource, action)
    if (hasRolePermission) return true

    // Check governance overrides
    const hasOverride = await governanceService.hasOverride(staffId, resource, action)
    if (hasOverride) return true

    // Check temporary permissions
    const tempCheck = await governanceService.checkAccess(staffId, resource, action)
    if (tempCheck.allowed) return true

    res.statusCode = 403
    res.end(safeStringify({ error: 'Forbidden: insufficient permissions', code: 'FORBIDDEN' }))
    return false
  }
}
