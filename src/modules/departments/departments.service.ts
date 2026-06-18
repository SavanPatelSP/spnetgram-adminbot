import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ConflictError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateDepartmentDto, UpdateDepartmentDto, AddStaffDto, DepartmentTypeName } from './departments.types.js'
import { DepartmentsEvents } from './departments.events.js'

export class DepartmentsService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findUnique({ where: { name: dto.name } })
    if (existing) throw new ConflictError(`Department '${dto.name}' already exists`)

    const dept = await this.prisma.department.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type as any,
        leadId: dto.leadId,
      },
      include: { members: { include: { staff: { include: { user: true } } } } },
    })

    logger.info({ departmentId: dept.id, name: dto.name }, 'Department created')
    await DepartmentsEvents.created(dept.id, dept.name, dept.type)
    return dept
  }

  async findById(id: string) {
    const dept = await this.prisma.department.findUnique({
      where: { id },
      include: { members: { include: { staff: { include: { user: true } } } } },
    })
    if (!dept) throw new NotFoundError('Department', id)
    return dept
  }

  async findMany(params: { type?: DepartmentTypeName; isActive?: boolean; page?: number; limit?: number }) {
    const { type, isActive, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (isActive !== undefined) where.isActive = isActive

    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { members: { include: { staff: { include: { user: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.department.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findById(id)
    const dept = await this.prisma.department.update({
      where: { id },
      data: dto,
      include: { members: { include: { staff: { include: { user: true } } } } },
    })
    logger.info({ departmentId: id }, 'Department updated')
    await DepartmentsEvents.updated(id)
    return dept
  }

  async addStaff(dto: AddStaffDto) {
    const dept = await this.findById(dto.departmentId)
    const staff = await this.prisma.staffMember.findUnique({ where: { id: dto.staffId } })
    if (!staff) throw new NotFoundError('StaffMember', dto.staffId)

    const existing = await this.prisma.departmentStaff.findUnique({
      where: { departmentId_staffId: { departmentId: dto.departmentId, staffId: dto.staffId } },
    })
    if (existing) throw new ConflictError('Staff member already in this department')

    const member = await this.prisma.departmentStaff.create({
      data: {
        departmentId: dto.departmentId,
        staffId: dto.staffId,
        role: dto.role ?? 'MEMBER',
      },
      include: { staff: { include: { user: true } } },
    })

    logger.info({ departmentId: dto.departmentId, staffId: dto.staffId, role: member.role }, 'Staff added to department')
    await DepartmentsEvents.staffAdded(dto.departmentId, dto.staffId, member.role)
    return member
  }

  async removeStaff(departmentId: string, staffId: string) {
    const existing = await this.prisma.departmentStaff.findUnique({
      where: { departmentId_staffId: { departmentId, staffId } },
    })
    if (!existing) throw new NotFoundError('DepartmentStaff assignment')

    await this.prisma.departmentStaff.delete({
      where: { departmentId_staffId: { departmentId, staffId } },
    })

    logger.info({ departmentId, staffId }, 'Staff removed from department')
    await DepartmentsEvents.staffRemoved(departmentId, staffId)
    return { removed: true }
  }

  async getStaffByDepartment(departmentId: string) {
    await this.findById(departmentId)
    return this.prisma.departmentStaff.findMany({
      where: { departmentId },
      include: { staff: { include: { user: true, roleAssignments: { include: { role: true }, where: { revokedAt: null } } } } },
    })
  }
}
