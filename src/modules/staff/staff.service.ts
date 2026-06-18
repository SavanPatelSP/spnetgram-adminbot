import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ConflictError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateStaffDto, UpdateStaffDto, StaffRoleName } from './staff.types.js'
import { SyncPublishers } from '@modules/sync/sync.publishers.js'

export class StaffService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  private async ensureRole(name: StaffRoleName) {
    const existing = await this.prisma.role.findUnique({ where: { name: name as any } })
    if (existing) return existing
    return this.prisma.role.create({ data: { name: name as any, label: name, isSystem: true } })
  }

  async findById(id: string) {
    const member = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { user: true, roleAssignments: { include: { role: true }, where: { revokedAt: null } } },
    })
    if (!member) throw new NotFoundError('StaffMember', id)
    return member
  }

  async findByUserId(userId: string) {
    return this.prisma.staffMember.findUnique({
      where: { userId },
      include: { user: true, roleAssignments: { include: { role: true }, where: { revokedAt: null } } },
    })
  }

  async create(data: CreateStaffDto) {
    const existing = await this.prisma.staffMember.findUnique({ where: { userId: data.userId } })
    if (existing) throw new ConflictError('User is already a staff member')

    const user = await this.prisma.user.findUnique({ where: { id: data.userId } })
    if (!user) throw new NotFoundError('User', data.userId)

    const roleName = data.role ?? 'SUPPORT_AGENT'
    const role = await this.ensureRole(roleName)

    const member = await this.prisma.staffMember.create({
      data: {
        userId: data.userId,
        roleAssignments: {
          create: { roleId: role.id },
        },
      },
      include: { user: true, roleAssignments: { include: { role: true }, where: { revokedAt: null } } },
    })

    await this.prisma.user.update({
      where: { id: data.userId },
      data: { isStaff: true },
    })

    logger.info({ staffId: member.id, userId: data.userId, role: roleName }, 'Staff member created')
    await this.eventBus.emit('staff:created', { staff: member })
    return member
  }

  async update(id: string, data: UpdateStaffDto) {
    const existing = await this.prisma.staffMember.findUnique({ where: { id } })
    if (!existing) throw new NotFoundError('StaffMember', id)

    const member = await this.prisma.staffMember.update({
      where: { id },
      data,
      include: { user: true },
    })

    if (data.isActive === false) {
      await this.prisma.user.update({
        where: { id: member.userId },
        data: { isStaff: false },
      })
    } else if (data.isActive === true) {
      await this.prisma.user.update({
        where: { id: member.userId },
        data: { isStaff: true },
      })
    }

    logger.info({ staffId: id, updates: data }, 'Staff member updated')
    await this.eventBus.emit('staff:updated', { staffId: id, data })
    if (data.isActive === false) {
      await this.eventBus.emit('staff:deactivated', { staffId: id, userId: member.userId })
      SyncPublishers.publishStaffSuspended(id, member.userId, 'Staff deactivated')
    }
    return member
  }

  async list(filters?: { isActive?: boolean }) {
    return this.prisma.staffMember.findMany({
      where: {
        ...(filters?.isActive !== undefined ? { isActive: filters.isActive } : {}),
      },
      include: { user: true, roleAssignments: { include: { role: true }, where: { revokedAt: null } } },
      orderBy: { joinedAt: 'desc' },
    })
  }

  private readonly ROLE_LEVELS: Record<string, number> = {
    OWNER: 1000, SUPER_ADMINISTRATOR: 900, CEO: 850, CTO: 800,
    COO: 750, ADMIN: 700, DEPARTMENT_HEAD: 600, MANAGER: 500,
    SENIOR_STAFF: 400, STAFF: 300, HELPER: 100,
  }

  async assignRole(id: string, roleName: StaffRoleName) {
    const member = await this.prisma.staffMember.findUnique({ where: { id } })
    if (!member) throw new NotFoundError('StaffMember', id)

    const role = await this.ensureRole(roleName)

    const currentAssignments = await this.prisma.staffRoleAssignment.findMany({
      where: { staffId: id, revokedAt: null },
      include: { role: true },
    })
    const currentHighest = currentAssignments.reduce((max, a) => {
      const level = this.ROLE_LEVELS[a.role.name] ?? 0
      return level > max ? level : max
    }, 0)

    const assignment = await this.prisma.staffRoleAssignment.create({
      data: { staffId: id, roleId: role.id },
      include: { role: true },
    })

    const newLevel = this.ROLE_LEVELS[roleName] ?? 0
    if (currentHighest > 0) {
      const prevRole = currentAssignments.reduce((highest, a) => {
        const level = this.ROLE_LEVELS[a.role.name] ?? 0
        return level > (this.ROLE_LEVELS[highest] ?? 0) ? a.role.name : highest
      }, currentAssignments[0]?.role.name ?? 'NONE')

      if (newLevel > currentHighest) {
        SyncPublishers.publishStaffPromoted(id, member.userId, prevRole, roleName)
      } else if (newLevel < currentHighest) {
        SyncPublishers.publishStaffDemoted(id, member.userId, prevRole, roleName)
      }
    }
    await this.eventBus.emit('staff:role:changed', { staffId: id, userId: member.userId, previousRole: currentAssignments[0]?.role.name ?? 'NONE', newRole: roleName })
    return assignment
  }

  async activate(id: string) {
    return this.update(id, { isActive: true })
  }

  async deactivate(id: string) {
    return this.update(id, { isActive: false })
  }
}
