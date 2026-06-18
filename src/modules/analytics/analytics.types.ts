export type AnalyticsMetricName = 'GROWTH' | 'REVENUE' | 'STAFF' | 'MODERATION' | 'SECURITY' | 'ECONOMY'

export interface RecordMetricDto {
  metric: AnalyticsMetricName
  category?: string
  value: number
  unit?: string
  period?: string
  label?: string
  tags?: Record<string, unknown>
}

export interface MetricQueryParams {
  metric?: AnalyticsMetricName
  category?: string
  period?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface CreateDashboardDto {
  name: string
  description?: string
  layout?: Record<string, unknown>
  widgets?: Record<string, unknown>
  filters?: Record<string, unknown>
  ownerId?: string
  isDefault?: boolean
  isPublic?: boolean
}

export interface UpdateDashboardDto {
  name?: string
  description?: string
  layout?: Record<string, unknown>
  widgets?: Record<string, unknown>
  filters?: Record<string, unknown>
  isDefault?: boolean
  isPublic?: boolean
}

export interface DashboardQueryParams {
  ownerId?: string
  isDefault?: boolean
  isPublic?: boolean
  page?: number
  limit?: number
}
