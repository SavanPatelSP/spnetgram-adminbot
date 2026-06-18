import { PermissionResource, PermissionAction, PermissionSource } from '@prisma/client'

export type PermissionSourceType = keyof typeof PermissionSource

export type StaffRoleName = 'OWNER' | 'SUPER_ADMINISTRATOR' | 'CEO' | 'CTO' | 'COO' | 'ADMIN' | 'DEPARTMENT_HEAD' | 'MANAGER' | 'SENIOR_STAFF' | 'STAFF' | 'HELPER'

export const RoleHierarchy: Record<StaffRoleName, number> = {
  OWNER: 1000,
  SUPER_ADMINISTRATOR: 900,
  CEO: 800,
  CTO: 700,
  COO: 650,
  ADMIN: 600,
  DEPARTMENT_HEAD: 500,
  MANAGER: 400,
  SENIOR_STAFF: 300,
  STAFF: 200,
  HELPER: 100,
}

export interface HierarchyCheckResult {
  valid: boolean
  seniorPriority: number
  juniorPriority: number
  message: string
}

export interface PermissionOverrideDto {
  staffId: string
  resource: PermissionResource
  action: PermissionAction
  source?: PermissionSource
  isGranted?: boolean
  reason?: string
  expiresAt?: string
  grantedBy?: string
}

export interface SpecialAccessGrantDto {
  staffId: string
  accessLevel: string
  scope?: string
  reason?: string
  expiresAt?: string
  grantedBy?: string
}

export interface TemporaryPermissionDto {
  staffId: string
  resource: PermissionResource
  action: PermissionAction
  reason?: string
  expiresAt: string
  grantedBy?: string
}

export interface SensitiveActionConfig {
  actionType: string
  title: string
  description?: string
  requiredApprovals: number
  approvalRoles?: string[]
  metadata?: Record<string, unknown>
}

export interface PermissionAuditRecord {
  action: string
  resource: string
  staffId: string
  grantedBy?: string
  source: string
  timestamp: Date
  expiresAt?: Date
}
