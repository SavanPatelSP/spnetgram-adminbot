import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CacheService } from '@infrastructure/cache/cache.service.js'
import { AuditService } from '../audit/audit.service.js'
import {
  RoleHierarchy,
  HierarchyCheckResult,
  PermissionOverrideDto,
  SpecialAccessGrantDto,
  TemporaryPermissionDto,
  SensitiveActionConfig,
  StaffRoleName,
} from './governance.types.js'
import {
  emitOverrideGranted,
  emitOverrideRevoked,
  emitTemporaryGranted,
  emitTemporaryRevoked,
  emitAccessGranted,
  emitSensitiveConfigured,
  emitAuditExportCreated,
} from './governance.events.js'

export class GovernanceService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()
  private cache = new CacheService()
  private auditService = new AuditService()

  getRoleHierarchy(): Record<string, number> {
    return { ...RoleHierarchy }
  }

  async checkHierarchy(seniorRole: string, juniorRole: string): Promise<HierarchyCheckResult> {
    const seniorPriority = RoleHierarchy[seniorRole as StaffRoleName] ?? 0
    const juniorPriority = RoleHierarchy[juniorRole as StaffRoleName] ?? 0

    if (seniorPriority === 0) {
      return { valid: false, seniorPriority: 0, juniorPriority, message: `Unknown senior role: ${seniorRole}` }
    }
    if (juniorPriority === 0) {
      return { valid: false, seniorPriority, juniorPriority: 0, message: `Unknown junior role: ${juniorRole}` }
    }

    const valid = seniorPriority > juniorPriority
    return {
      valid,
      seniorPriority,
      juniorPriority,
      message: valid
        ? `${seniorRole} (${seniorPriority}) outranks ${juniorRole} (${juniorPriority})`
        : `${seniorRole} (${seniorPriority}) does not outrank ${juniorRole} (${juniorPriority})`,
    }
  }

  async hasOverride(staffId: string, resource: string, action: string): Promise<boolean> {
    const override = await this.prisma.permissionOverride.findUnique({
      where: {
        staffId_resource_action: {
          staffId,
          resource: resource as any,
          action: action as any,
        },
      },
    })
    if (!override || override.revokedAt) return false
    if (override.expiresAt && override.expiresAt < new Date()) return false
    return override.isGranted
  }

  async grantTemporaryPermission(data: TemporaryPermissionDto) {
    const member = await this.prisma.staffMember.findUnique({ where: { id: data.staffId } })
    if (!member) throw new NotFoundError('StaffMember', data.staffId)

    const permission = await this.prisma.temporaryPermission.create({
      data: {
        staffId: data.staffId,
        resource: data.resource,
        action: data.action,
        reason: data.reason,
        expiresAt: new Date(data.expiresAt),
        grantedBy: data.grantedBy,
      },
    })

    logger.info({ staffId: data.staffId, resource: data.resource, action: data.action }, 'Temporary permission granted')
    await emitTemporaryGranted({ permission })
    return permission
  }

  async revokeTemporaryPermission(id: string, revokedBy?: string) {
    const existing = await this.prisma.temporaryPermission.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('TemporaryPermission', id)

    const permission = await this.prisma.temporaryPermission.update({
      where: { id },
      data: { revokedAt: new Date(), revokedBy },
    })

    logger.info({ id }, 'Temporary permission revoked')
    await emitTemporaryRevoked({ permission })
    return permission
  }

  async grantOverride(data: PermissionOverrideDto) {
    const member = await this.prisma.staffMember.findUnique({ where: { id: data.staffId } })
    if (!member) throw new NotFoundError('StaffMember', data.staffId)

    const override = await this.prisma.permissionOverride.upsert({
      where: {
        staffId_resource_action: {
          staffId: data.staffId,
          resource: data.resource,
          action: data.action,
        },
      },
      create: {
        staffId: data.staffId,
        resource: data.resource,
        action: data.action,
        source: data.source ?? 'CUSTOM',
        isGranted: data.isGranted ?? true,
        reason: data.reason,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        grantedBy: data.grantedBy,
      },
      update: {
        source: data.source ?? 'CUSTOM',
        isGranted: data.isGranted ?? true,
        reason: data.reason,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        grantedBy: data.grantedBy,
        revokedAt: null,
        revokedBy: null,
      },
    })

    logger.info({ staffId: data.staffId, resource: data.resource, action: data.action }, 'Permission override granted')
    await emitOverrideGranted({ override })
    return override
  }

  async revokeOverride(staffId: string, resource: string, action: string, revokedBy?: string) {
    const existing = await this.prisma.permissionOverride.findUnique({
      where: {
        staffId_resource_action: {
          staffId,
          resource: resource as any,
          action: action as any,
        },
      },
    })
    if (!existing) throw new NotFoundError('PermissionOverride')

    const override = await this.prisma.permissionOverride.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), revokedBy },
    })

    logger.info({ staffId, resource, action }, 'Permission override revoked')
    await emitOverrideRevoked({ override })
    return override
  }

  async grantSpecialAccess(data: SpecialAccessGrantDto) {
    const member = await this.prisma.staffMember.findUnique({ where: { id: data.staffId } })
    if (!member) throw new NotFoundError('StaffMember', data.staffId)

    const grant = await this.prisma.specialAccessGrant.create({
      data: {
        staffId: data.staffId,
        accessLevel: data.accessLevel,
        scope: data.scope,
        reason: data.reason,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        grantedBy: data.grantedBy,
      },
    })

    logger.info({ staffId: data.staffId, accessLevel: data.accessLevel }, 'Special access granted')
    return grant
  }

  async revokeSpecialAccess(id: string, revokedBy?: string) {
    const existing = await this.prisma.specialAccessGrant.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('SpecialAccessGrant', id)

    const grant = await this.prisma.specialAccessGrant.update({
      where: { id },
      data: { revokedAt: new Date(), revokedBy },
    })

    logger.info({ id }, 'Special access revoked')
    return grant
  }

  async listActiveOverrides(staffId?: string) {
    const where: Record<string, unknown> = {
      revokedAt: null,
    }
    if (staffId) where.staffId = staffId

    if (where.expiresAt === undefined) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } },
      ]
    }

    return this.prisma.permissionOverride.findMany({
      where: where as any,
      include: { staff: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listTemporaryPermissions(staffId?: string) {
    const where: Record<string, unknown> = {
      revokedAt: null,
      expiresAt: { gte: new Date() },
    }
    if (staffId) where.staffId = staffId

    return this.prisma.temporaryPermission.findMany({
      where: where as any,
      include: { staff: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async checkAccess(staffId: string, resource: string, action: string) {
    const result = {
      allowed: false,
      source: null as string | null,
      override: null as any,
      temporaryPermission: null as any,
    }

    const member = await this.prisma.staffMember.findUnique({ where: { id: staffId } })
    if (!member) throw new NotFoundError('StaffMember', staffId)

    const assignments = await this.prisma.staffRoleAssignment.findMany({
      where: { staffId, revokedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              where: {
                permission: {
                  resource: resource as any,
                  action: action as any,
                },
              },
            },
          },
        },
      },
    })

    const hasRolePermission = assignments.some((a) => a.role.permissions.length > 0)
    if (hasRolePermission) {
      result.allowed = true
      result.source = 'ROLE'
    }

    const override = await this.prisma.permissionOverride.findUnique({
      where: {
        staffId_resource_action: {
          staffId,
          resource: resource as any,
          action: action as any,
        },
      },
    })

    if (override && !override.revokedAt) {
      if (override.expiresAt && override.expiresAt < new Date()) {
        // expired
      } else {
        result.allowed = override.isGranted
        result.source = override.isGranted ? 'OVERRIDE' : 'OVERRIDE_DENY'
        result.override = override
      }
    }

    if (!result.allowed) {
      const tempPermission = await this.prisma.temporaryPermission.findFirst({
        where: {
          staffId,
          resource: resource as any,
          action: action as any,
          revokedAt: null,
          expiresAt: { gte: new Date() },
        },
      })

      if (tempPermission) {
        result.allowed = true
        result.source = 'TEMPORARY'
        result.temporaryPermission = tempPermission
      }
    }

    if (result.allowed) {
      await emitAccessGranted({ staffId, resource, action, source: result.source })
    }

    return result
  }

  async configureSensitiveAction(data: SensitiveActionConfig) {
    const action = await this.prisma.sensitiveAction.upsert({
      where: { actionType: data.actionType },
      create: {
        actionType: data.actionType,
        title: data.title,
        description: data.description,
        requiredApprovals: data.requiredApprovals,
        approvalRoles: data.approvalRoles,
        metadata: (data.metadata ?? undefined) as any,
      },
      update: {
        title: data.title,
        description: data.description,
        requiredApprovals: data.requiredApprovals,
        approvalRoles: data.approvalRoles,
        metadata: (data.metadata ?? undefined) as any,
        isActive: true,
      },
    })

    logger.info({ actionType: data.actionType }, 'Sensitive action configured')
    await emitSensitiveConfigured({ action })
    return action
  }

  async listSensitiveActions() {
    return this.prisma.sensitiveAction.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async validateSensitiveAction(actionType: string, staffId: string) {
    const action = await this.prisma.sensitiveAction.findUnique({ where: { actionType } })
    if (!action) throw new NotFoundError('SensitiveAction', actionType)
    if (!action.isActive) {
      await this.auditService.create({
        staffId,
        action: 'SENSITIVE_ACTION_VALIDATE',
        resource: 'SENSITIVE_ACTION',
        resourceId: actionType,
        description: `Sensitive action validation failed: action is inactive (${actionType})`,
        result: 'DENIED',
      })
      return { valid: false, reason: 'Action is inactive' }
    }

    const member = await this.prisma.staffMember.findUnique({
      where: { id: staffId },
      include: {
        roleAssignments: {
          where: { revokedAt: null },
          include: { role: true },
        },
      },
    })
    if (!member) throw new NotFoundError('StaffMember', staffId)

    const staffRoles = member.roleAssignments.map((ra) => ra.role.name)
    const hasApprovalRole = action.approvalRoles
      ? action.approvalRoles.some((role: string) => staffRoles.includes(role as any))
      : false

    await this.auditService.create({
      staffId,
      action: 'SENSITIVE_ACTION_VALIDATE',
      resource: 'SENSITIVE_ACTION',
      resourceId: actionType,
      description: `Sensitive action validation for ${actionType}: ${hasApprovalRole ? 'APPROVED' : 'DENIED'}`,
      metadata: {
        actionType,
        title: action.title,
        staffRoles,
        approvalRoles: action.approvalRoles,
        requiredApprovals: action.requiredApprovals,
      },
      result: hasApprovalRole ? 'APPROVED' : 'DENIED',
    })

    return {
      valid: hasApprovalRole,
      actionType: action.actionType,
      title: action.title,
      requiredApprovals: action.requiredApprovals,
      staffRoles,
      hasApprovalRole,
    }
  }

  async createAuditExport(format: string, filters: Record<string, unknown> | null, requestedBy?: string) {
    const exportRecord = await this.prisma.auditExport.create({
      data: {
        format,
        filters: (filters ?? undefined) as any,
        requestedBy,
        status: 'PENDING',
      },
    })

    logger.info({ id: exportRecord.id, format }, 'Audit export created')
    await emitAuditExportCreated({ exportRecord })
    return exportRecord
  }

  async getAuditExport(id: string) {
    const exportRecord = await this.prisma.auditExport.findUnique({ where: { id } })
    if (!exportRecord) throw new NotFoundError('AuditExport', id)
    return exportRecord
  }

  async processExpiredPermissions() {
    const now = new Date()
    let revokedCount = 0

    const expiredOverrides = await this.prisma.permissionOverride.updateMany({
      where: {
        revokedAt: null,
        expiresAt: { lte: now },
      },
      data: { revokedAt: now },
    })
    revokedCount += expiredOverrides.count

    const expiredTempPermissions = await this.prisma.temporaryPermission.updateMany({
      where: {
        revokedAt: null,
        expiresAt: { lte: now },
      },
      data: { revokedAt: now },
    })
    revokedCount += expiredTempPermissions.count

    const expiredSpecialAccess = await this.prisma.specialAccessGrant.updateMany({
      where: {
        revokedAt: null,
        expiresAt: { lte: now },
      },
      data: { revokedAt: now },
    })
    revokedCount += expiredSpecialAccess.count

    logger.info({ revokedCount }, 'Expired permissions processed')
    await this.cache.invalidateByTag('dashboard')
    return { revokedCount, processedAt: now }
  }
}
