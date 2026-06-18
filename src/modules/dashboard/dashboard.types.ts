export type DashboardSnapshotType = 'STAFF_OVERVIEW' | 'MODERATION_STATS' | 'TICKET_STATS' | 'CASE_STATS' | 'KPI_SUMMARY' | 'SECURITY_SUMMARY' | 'SYSTEM_HEALTH'

export interface DashboardStatsResult {
  timestamp: string
  summary: string
  metrics: Record<string, number>
}

export interface StaffOverviewResult {
  totalStaff: number
  activeStaff: number
  byRole: Record<string, number>
  byDepartment: Record<string, number>
}

export interface ModerationStatsResult {
  totalActions: number
  byType: Record<string, number>
  recentActions: number
  topModerators: Array<{ staffId: string; count: number }>
}

export interface TicketStatsResult {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  avgResolutionTime: number | null
  unassigned: number
}

export interface CaseStatsResult {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  avgResolutionTime: number | null
}

export interface KpiSummaryResult {
  totalDefinitions: number
  totalRecords: number
  topPerformers: Array<{ staffId: string; score: number }>
  departmentRankings: Array<{ departmentId: string; score: number }>
}

export interface SecuritySummaryResult {
  totalEvents: number
  byType: Record<string, number>
  recentAlerts: number
  activeSessions: number
}

export interface SystemHealthResult {
  totalServices: number
  upCount: number
  downCount: number
  recentAlerts: number
}

export interface SnapshotQueryParams {
  type?: DashboardSnapshotType
  page?: number
  limit?: number
}
