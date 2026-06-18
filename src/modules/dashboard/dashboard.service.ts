import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CacheService } from '@infrastructure/cache/cache.service.js'
import {
  DashboardSnapshotType,
  StaffOverviewResult,
  ModerationStatsResult,
  TicketStatsResult,
  CaseStatsResult,
  KpiSummaryResult,
  SecuritySummaryResult,
  SystemHealthResult,
} from './dashboard.types.js'
import { DashboardEvents } from './dashboard.events.js'

export class DashboardService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()
  private cache = new CacheService()

  async getStaffOverview(): Promise<StaffOverviewResult> {
    return this.cache.getOrSet(
      'dashboard:staff-overview',
      async () => {
        const [staffMembers, roleAssignments, departmentMemberships] = await Promise.all([
          this.prisma.staffMember.findMany(),
          this.prisma.staffRoleAssignment.findMany({ where: { revokedAt: null }, include: { role: true } }),
          this.prisma.departmentStaff.findMany(),
        ])

        const byRole: Record<string, number> = {}
        for (const ra of roleAssignments) {
          const roleName = ra.role.name ?? ra.roleId
          byRole[roleName] = (byRole[roleName] ?? 0) + 1
        }

        const byDepartment: Record<string, number> = {}
        for (const dm of departmentMemberships) {
          byDepartment[dm.departmentId] = (byDepartment[dm.departmentId] ?? 0) + 1
        }

        return {
          totalStaff: staffMembers.length,
          activeStaff: staffMembers.filter((s) => s.isActive).length,
          byRole,
          byDepartment,
        }
      },
      { ttl: 300, tags: ['dashboard', 'staff'] },
    )
  }

  async getModerationStats(params?: { page?: number; limit?: number }): Promise<ModerationStatsResult> {
    const cacheKey = `dashboard:moderation-stats:${JSON.stringify(params ?? {})}`
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const page = params?.page ?? 1
        const limit = params?.limit ?? 20

        const [actions, byTypeRaw, recentCount] = await Promise.all([
          this.prisma.moderationAction.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.moderationAction.groupBy({
            by: ['actionType'],
            _count: { actionType: true },
          }),
          this.prisma.moderationAction.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          }),
        ])

        const byType: Record<string, number> = {}
        for (const row of byTypeRaw) {
          byType[row.actionType] = row._count.actionType
        }

        const moderatorCounts: Record<string, number> = {}
        for (const a of actions) {
          moderatorCounts[a.moderatorId] = (moderatorCounts[a.moderatorId] ?? 0) + 1
        }
        const topModerators = Object.entries(moderatorCounts)
          .map(([staffId, count]) => ({ staffId, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)

        return {
          totalActions: byTypeRaw.reduce((sum, r) => sum + r._count.actionType, 0),
          byType,
          recentActions: recentCount,
          topModerators,
        }
      },
      { ttl: 300, tags: ['dashboard', 'moderation'] },
    )
  }

  async getTicketStats(params?: { page?: number; limit?: number }): Promise<TicketStatsResult> {
    const cacheKey = `dashboard:ticket-stats:${JSON.stringify(params ?? {})}`
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const page = params?.page ?? 1
        const limit = params?.limit ?? 20

        const [tickets, byStatusRaw, byPriorityRaw, ticketsWithResolution] = await Promise.all([
          this.prisma.ticket.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.ticket.groupBy({
            by: ['status'],
            _count: { status: true },
          }),
          this.prisma.ticket.groupBy({
            by: ['priority'],
            _count: { priority: true },
          }),
          this.prisma.ticket.findMany({
            where: { closedAt: { not: null as any }, createdAt: { not: null as any } },
            select: { createdAt: true, closedAt: true },
          }),
        ])

        const byStatus: Record<string, number> = {}
        for (const row of byStatusRaw) {
          byStatus[row.status] = row._count.status
        }

        const byPriority: Record<string, number> = {}
        for (const row of byPriorityRaw) {
          byPriority[row.priority] = row._count.priority
        }

        let avgResolutionTime: number | null = null
        if (ticketsWithResolution.length > 0) {
          const totalMs = ticketsWithResolution.reduce((sum, t) => {
            return sum + (t.closedAt!.getTime() - t.createdAt.getTime())
          }, 0)
          avgResolutionTime = totalMs / ticketsWithResolution.length
        }

        const unassigned = tickets.filter((t) => !t.assigneeId).length

        return {
          total: byStatusRaw.reduce((sum, r) => sum + r._count.status, 0),
          byStatus,
          byPriority,
          avgResolutionTime,
          unassigned,
        }
      },
      { ttl: 300, tags: ['dashboard', 'tickets'] },
    )
  }

  async getCaseStats(params?: { page?: number; limit?: number }): Promise<CaseStatsResult> {
    const cacheKey = `dashboard:case-stats:${JSON.stringify(params ?? {})}`
    return this.cache.getOrSet(
      cacheKey,
      async () => {
        const page = params?.page ?? 1
        const limit = params?.limit ?? 20

        const [cases, byStatusRaw, byPriorityRaw, casesWithResolution] = await Promise.all([
          this.prisma.case.findMany({
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          this.prisma.case.groupBy({
            by: ['status'],
            _count: { status: true },
          }),
          this.prisma.case.groupBy({
            by: ['priority'],
            _count: { priority: true },
          }),
          this.prisma.case.findMany({
            where: { closedAt: { not: null as any }, createdAt: { not: null as any } },
            select: { createdAt: true, closedAt: true },
          }),
        ])

        const byStatus: Record<string, number> = {}
        for (const row of byStatusRaw) {
          byStatus[row.status] = row._count.status
        }

        const byPriority: Record<string, number> = {}
        for (const row of byPriorityRaw) {
          byPriority[row.priority] = row._count.priority
        }

        let avgResolutionTime: number | null = null
        if (casesWithResolution.length > 0) {
          const totalMs = casesWithResolution.reduce((sum, c) => {
            return sum + (c.closedAt!.getTime() - c.createdAt.getTime())
          }, 0)
          avgResolutionTime = totalMs / casesWithResolution.length
        }

        return {
          total: byStatusRaw.reduce((sum, r) => sum + r._count.status, 0),
          byStatus,
          byPriority,
          avgResolutionTime,
        }
      },
      { ttl: 300, tags: ['dashboard', 'cases'] },
    )
  }

  async getKpiSummary(): Promise<KpiSummaryResult> {
    return this.cache.getOrSet(
      'dashboard:kpi-summary',
      async () => {
        const [definitions, records] = await Promise.all([
          this.prisma.kpiDefinition.findMany({ where: { isActive: true } }),
          this.prisma.kpiRecord.findMany({ orderBy: { achievedAt: 'desc' } }),
        ])

        const staffScores: Record<string, number> = {}
        const deptScores: Record<string, number> = {}
        for (const r of records) {
          if (r.staffId) {
            staffScores[r.staffId] = (staffScores[r.staffId] ?? 0) + r.value
          }
          if (r.departmentId) {
            deptScores[r.departmentId] = (deptScores[r.departmentId] ?? 0) + r.value
          }
        }

        const topPerformers = Object.entries(staffScores)
          .map(([staffId, score]) => ({ staffId, score }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)

        const departmentRankings = Object.entries(deptScores)
          .map(([departmentId, score]) => ({ departmentId, score }))
          .sort((a, b) => b.score - a.score)

        return {
          totalDefinitions: definitions.length,
          totalRecords: records.length,
          topPerformers,
          departmentRankings,
        }
      },
      { ttl: 300, tags: ['dashboard', 'kpi'] },
    )
  }

  async getSecuritySummary(): Promise<SecuritySummaryResult> {
    return this.cache.getOrSet(
      'dashboard:security-summary',
      async () => {
        const [events, byTypeRaw, recentAlerts, sessions] = await Promise.all([
          this.prisma.securityEvent.findMany({ orderBy: { timestamp: 'desc' } }),
          this.prisma.securityEvent.groupBy({
            by: ['eventType'],
            _count: { eventType: true },
          }),
          this.prisma.monitoringAlert.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          }),
          this.prisma.deviceSession.count({ where: { isActive: true } }),
        ])

        const byType: Record<string, number> = {}
        for (const row of byTypeRaw) {
          byType[row.eventType] = row._count.eventType
        }

        return {
          totalEvents: events.length,
          byType,
          recentAlerts,
          activeSessions: sessions,
        }
      },
      { ttl: 300, tags: ['dashboard', 'security'] },
    )
  }

  async getSystemHealth(): Promise<SystemHealthResult> {
    return this.cache.getOrSet(
      'dashboard:system-health',
      async () => {
        const [services, recentAlerts] = await Promise.all([
          this.prisma.serviceStatus.findMany(),
          this.prisma.monitoringAlert.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          }),
        ])

        const upCount = services.filter((s) => s.isUp).length
        const downCount = services.filter((s) => !s.isUp).length

        return {
          totalServices: services.length,
          upCount,
          downCount,
          recentAlerts,
        }
      },
      { ttl: 300, tags: ['dashboard', 'health'] },
    )
  }

  async getAggregatedSnapshot(types: DashboardSnapshotType[]): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {}

    const tasks: Array<Promise<void>> = types.map(async (type) => {
      switch (type) {
        case 'STAFF_OVERVIEW':
          results[type] = await this.getStaffOverview()
          break
        case 'MODERATION_STATS':
          results[type] = await this.getModerationStats()
          break
        case 'TICKET_STATS':
          results[type] = await this.getTicketStats()
          break
        case 'CASE_STATS':
          results[type] = await this.getCaseStats()
          break
        case 'KPI_SUMMARY':
          results[type] = await this.getKpiSummary()
          break
        case 'SECURITY_SUMMARY':
          results[type] = await this.getSecuritySummary()
          break
        case 'SYSTEM_HEALTH':
          results[type] = await this.getSystemHealth()
          break
      }
    })

    await Promise.all(tasks)

    const dashboardId = `snapshot-${Date.now()}`
    await DashboardEvents.snapshotGenerated(dashboardId, types.join(','))

    return results
  }
}
