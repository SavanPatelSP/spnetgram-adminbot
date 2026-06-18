import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { GrantPermissionDto, RevokePermissionDto, PermissionFilter } from './permissions.types.js'

export class PermissionsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async findByStaffId(staffId: string) {
    const member = await this.prisma.staffMember.findUnique({ where: { id: staffId } })
    if (!member) throw new NotFoundError('StaffMember', staffId)

    const assignments = await this.prisma.staffRoleAssignment.findMany({
      where: { staffId, revokedAt: null },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    })

    const seen = new Map<string, (typeof assignments)[0]['role']['permissions'][0]['permission']>()
    for (const a of assignments) {
      for (const rp of a.role.permissions) {
        const key = `${rp.permission.resource}:${rp.permission.action}`
        if (!seen.has(key)) seen.set(key, rp.permission)
      }
    }

    return Array.from(seen.values())
  }

  async grant(data: GrantPermissionDto) {
    const role = await this.prisma.role.findUnique({ where: { id: data.roleId } })
    if (!role) throw new NotFoundError('Role', data.roleId)

    const permission = await this.prisma.permission.upsert({
      where: {
        resource_action: {
          resource: data.resource as any,
          action: data.action as any,
        },
      },
      create: {
        resource: data.resource as any,
        action: data.action as any,
      },
      update: {},
    })

    const rolePermission = await this.prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: data.roleId,
          permissionId: permission.id,
        },
      },
      create: {
        roleId: data.roleId,
        permissionId: permission.id,
      },
      update: {},
    })

    logger.info({ roleId: data.roleId, resource: data.resource, action: data.action }, 'Permission granted to role')
    await this.eventBus.emit('permission:granted', { rolePermission })
    return rolePermission
  }

  async revoke(data: RevokePermissionDto) {
    const role = await this.prisma.role.findUnique({ where: { id: data.roleId } })
    if (!role) throw new NotFoundError('Role', data.roleId)

    const permission = await this.prisma.permission.findUnique({
      where: {
        resource_action: {
          resource: data.resource as any,
          action: data.action as any,
        },
      },
    })
    if (!permission) throw new NotFoundError('Permission')

    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId: data.roleId,
          permissionId: permission.id,
        },
      },
    })
    if (!existing) throw new NotFoundError('RolePermission')

    await this.prisma.rolePermission.delete({ where: { id: existing.id } })

    logger.info({ roleId: data.roleId, resource: data.resource, action: data.action }, 'Permission revoked from role')
    await this.eventBus.emit('permission:revoked', { roleId: data.roleId, resource: data.resource, action: data.action })
  }

  async list(filters?: PermissionFilter) {
    return this.prisma.permission.findMany({
      where: {
        ...(filters?.resource ? { resource: filters.resource as any } : {}),
        ...(filters?.action ? { action: filters.action as any } : {}),
        ...(filters?.roleId ? { roleAssignments: { some: { roleId: filters.roleId } } } : {}),
      },
      include: { roleAssignments: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async check(staffId: string, resource: string, action: string): Promise<boolean> {
    const member = await this.prisma.staffMember.findUnique({ where: { id: staffId } })
    if (!member) return false

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

    return assignments.some((a) => a.role.permissions.length > 0)
  }

  async listByStaffMember(staffId: string) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id: staffId },
      include: {
        user: true,
        roleAssignments: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    })
    if (!member) throw new NotFoundError('StaffMember', staffId)
    return member
  }

  async assignRoleToStaff(staffId: string, roleName: string, assignedBy?: string) {
    const member = await this.prisma.staffMember.findUnique({ where: { id: staffId } })
    if (!member) throw new NotFoundError('StaffMember', staffId)

    const role = await this.prisma.role.findUnique({ where: { name: roleName as any } })
    if (!role) throw new NotFoundError('Role', roleName)

    await this.prisma.staffRoleAssignment.updateMany({
      where: { staffId, roleId: role.id, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    const assignment = await this.prisma.staffRoleAssignment.create({
      data: { staffId, roleId: role.id, assignedBy },
      include: { role: true, staff: { include: { user: true } } },
    })

    logger.info({ staffId, roleName, assignedBy }, 'Role assigned to staff')
    await this.eventBus.emit('role:assigned', { assignment })
    return assignment
  }

  async removeRoleFromStaff(staffId: string, roleName: string) {
    const member = await this.prisma.staffMember.findUnique({ where: { id: staffId } })
    if (!member) throw new NotFoundError('StaffMember', staffId)

    const role = await this.prisma.role.findUnique({ where: { name: roleName as any } })
    if (!role) throw new NotFoundError('Role', roleName)

    const existing = await this.prisma.staffRoleAssignment.findFirst({
      where: { staffId, roleId: role.id, revokedAt: null },
    })
    if (!existing) throw new NotFoundError('StaffRoleAssignment')

    await this.prisma.staffRoleAssignment.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    })

    logger.info({ staffId, roleName }, 'Role revoked from staff')
    await this.eventBus.emit('role:revoked', { staffId, roleName })
  }
}
