export { GovernanceService } from './governance.service.js'
export { GovernanceController } from './governance.controller.js'
export {
  emitOverrideGranted,
  emitOverrideRevoked,
  emitTemporaryGranted,
  emitTemporaryRevoked,
  emitAccessGranted,
  emitSensitiveConfigured,
  emitAuditExportCreated,
} from './governance.events.js'
export type {
  PermissionOverrideDto,
  SpecialAccessGrantDto,
  TemporaryPermissionDto,
  SensitiveActionConfig,
  HierarchyCheckResult,
  PermissionAuditRecord,
  StaffRoleName,
  PermissionSourceType,
} from './governance.types.js'
export { RoleHierarchy } from './governance.types.js'
