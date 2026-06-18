export type MonitoringMetricType = 'HEALTH' | 'LATENCY' | 'UPTIME' | 'CPU' | 'MEMORY' | 'DISK' | 'DATABASE' | 'CACHE' | 'QUEUE' | 'ERRORS'

export interface CreateServiceStatusDto {
  name: string
  displayName?: string
  type?: string
  status?: string
  metric?: MonitoringMetricType
  value?: number
  unit?: string
  message?: string
}

export interface UpdateServiceStatusDto {
  status?: string
  message?: string
  isUp?: boolean
}

export interface ServiceQueryParams {
  status?: string
  isUp?: boolean
  type?: string
  page?: number
  limit?: number
}

export interface CreateMonitoringAlertDto {
  serviceId?: string
  type: string
  severity?: string
  metric?: string
  value?: number
  threshold?: number
  message?: string
}

export interface AlertQueryParams {
  serviceId?: string
  severity?: string
  acknowledged?: boolean
  page?: number
  limit?: number
}
