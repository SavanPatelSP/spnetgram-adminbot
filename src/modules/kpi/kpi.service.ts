import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ConflictError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateKpiDefinitionDto, UpdateKpiDefinitionDto, CreateKpiRecordDto, CreateKpiTargetDto, KpiPeriodName } from './kpi.types.js'
import { KpiEvents } from './kpi.events.js'

export class KpiService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async createDefinition(dto: CreateKpiDefinitionDto) {
    const existing = await this.prisma.kpiDefinition.findUnique({ where: { name: dto.name } })
    if (existing) throw new ConflictError(`KPI definition '${dto.name}' already exists`)

    const def = await this.prisma.kpiDefinition.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        targetValue: dto.targetValue,
        unit: dto.unit,
        period: (dto.period ?? 'MONTHLY') as any,
        formula: dto.formula,
      },
    })

    logger.info({ definitionId: def.id, name: dto.name, category: dto.category }, 'KPI definition created')
    return def
  }

  async findDefinitionById(id: string) {
    const def = await this.prisma.kpiDefinition.findUnique({ where: { id } })
    if (!def) throw new NotFoundError('KpiDefinition', id)
    return def
  }

  async listDefinitions(activeOnly = true) {
    return this.prisma.kpiDefinition.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { category: 'asc' },
    })
  }

  async updateDefinition(id: string, dto: UpdateKpiDefinitionDto) {
    await this.findDefinitionById(id)
    const def = await this.prisma.kpiDefinition.update({
      where: { id },
      data: dto,
    })
    logger.info({ definitionId: id }, 'KPI definition updated')
    return def
  }

  async createRecord(dto: CreateKpiRecordDto) {
    const def = await this.findDefinitionById(dto.definitionId)
    if (!def.isActive) throw new ConflictError('KPI definition is not active')

    if (dto.staffId) {
      const staff = await this.prisma.staffMember.findUnique({ where: { id: dto.staffId } })
      if (!staff) throw new NotFoundError('StaffMember', dto.staffId)
    }
    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } })
      if (!dept) throw new NotFoundError('Department', dto.departmentId)
    }

    const record = await this.prisma.kpiRecord.create({
      data: {
        definitionId: dto.definitionId,
        staffId: dto.staffId,
        departmentId: dto.departmentId,
        value: dto.value,
      },
      include: { definition: true },
    })

    logger.info({ recordId: record.id, definitionId: dto.definitionId, value: dto.value }, 'KPI record created')
    await KpiEvents.recordCreated(record.id, dto.definitionId, dto.value, dto.staffId)

    await this.checkTargets(dto.definitionId, dto.staffId, dto.departmentId, dto.value)

    return record
  }

  private async checkTargets(definitionId: string, staffId?: string, departmentId?: string, value?: number) {
    if (value === undefined) return
    const targets = await this.prisma.kpiTarget.findMany({
      where: {
        definitionId,
        isActive: true,
        ...(staffId ? { staffId } : {}),
        ...(departmentId ? { departmentId } : {}),
      },
    })

    for (const target of targets) {
      if (value >= target.targetValue) {
        await KpiEvents.targetAchieved(target.id, definitionId, value)
        logger.info({ targetId: target.id, definitionId, value }, 'KPI target achieved')
      }
    }
  }

  async findRecordById(id: string) {
    const record = await this.prisma.kpiRecord.findUnique({
      where: { id },
      include: { definition: true, staff: { include: { user: true } }, department: true },
    })
    if (!record) throw new NotFoundError('KpiRecord', id)
    return record
  }

  async listRecords(params: { definitionId?: string; staffId?: string; departmentId?: string; page?: number; limit?: number }) {
    const { definitionId, staffId, departmentId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (definitionId) where.definitionId = definitionId
    if (staffId) where.staffId = staffId
    if (departmentId) where.departmentId = departmentId

    const [items, total] = await Promise.all([
      this.prisma.kpiRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { definition: true, staff: { include: { user: true } }, department: true },
        orderBy: { achievedAt: 'desc' },
      }),
      this.prisma.kpiRecord.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async createTarget(dto: CreateKpiTargetDto) {
    await this.findDefinitionById(dto.definitionId)

    if (dto.staffId) {
      const staff = await this.prisma.staffMember.findUnique({ where: { id: dto.staffId } })
      if (!staff) throw new NotFoundError('StaffMember', dto.staffId)
    }
    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } })
      if (!dept) throw new NotFoundError('Department', dto.departmentId)
    }

    const target = await this.prisma.kpiTarget.create({
      data: {
        definitionId: dto.definitionId,
        departmentId: dto.departmentId,
        staffId: dto.staffId,
        targetValue: dto.targetValue,
        period: (dto.period ?? 'MONTHLY') as any,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      },
      include: { definition: true },
    })

    logger.info({ targetId: target.id, definitionId: dto.definitionId, targetValue: dto.targetValue }, 'KPI target created')
    return target
  }

  async listTargets(params: { definitionId?: string; staffId?: string; departmentId?: string; page?: number; limit?: number }) {
    const { definitionId, staffId, departmentId, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = { isActive: true }
    if (definitionId) where.definitionId = definitionId
    if (staffId) where.staffId = staffId
    if (departmentId) where.departmentId = departmentId

    const [items, total] = await Promise.all([
      this.prisma.kpiTarget.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { definition: true, department: true },
        orderBy: { endDate: 'asc' },
      }),
      this.prisma.kpiTarget.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getStaffSummary(staffId: string) {
    const records = await this.prisma.kpiRecord.groupBy({
      by: ['definitionId'],
      where: { staffId },
      _avg: { value: true },
      _max: { value: true },
      _min: { value: true },
      _count: { value: true },
    })

    const definitions = await this.prisma.kpiDefinition.findMany({
      where: { id: { in: records.map(r => r.definitionId) } },
    })

    const defMap = new Map(definitions.map(d => [d.id, d]))
    return records.map(r => ({
      definition: defMap.get(r.definitionId),
      average: r._avg.value,
      max: r._max.value,
      min: r._min.value,
      count: r._count.value,
    }))
  }
}
