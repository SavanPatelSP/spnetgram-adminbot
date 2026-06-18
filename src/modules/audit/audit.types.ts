export interface CreateAuditLogDto {
  staffId?: string
  actorId?: string
  targetId?: string
  action: string
  resource: string
  resourceId?: string
  reason?: string
  description?: string
  beforeState?: Record<string, unknown>
  afterState?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  result?: string
}

export interface AuditLogFilter {
  staffId?: string
  actorId?: string
  targetId?: string
  action?: string
  resource?: string
  resourceId?: string
  reason?: string
  fromDate?: Date
  toDate?: Date
  page?: number
  pageSize?: number
}

export interface AuditLogQueryResult {
  logs: Array<{
    id: string
    action: string
    resource: string
    resourceId: string | null
    description: string | null
    staffId: string | null
    actorId: string | null
    targetId: string | null
    reason: string | null
    createdAt: Date
  }>
  total: number
  page: number
  pageSize: number
}

export interface ComplianceReport {
  id: string
  period: {
    from: string
    to: string
  }
  generatedAt: string
  totalLogs: number
  actionBreakdown: Record<string, number>
  resourceBreakdown: Record<string, number>
  staffActivitySummary: Array<{
    staffId: string
    count: number
  }>
}

export interface AuditExportDto {
  format: 'CSV' | 'JSON' | 'PDF'
  filters: AuditLogFilter
  requestedBy: string
}
