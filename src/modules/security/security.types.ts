export type SecurityEventTypeName = 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'SESSION_CREATED' | 'SESSION_EXPIRED' | 'DEVICE_REGISTERED' | 'DEVICE_UNREGISTERED' | 'RISK_SCORE_CHANGED' | 'FRAUD_DETECTED' | 'SECURITY_INCIDENT' | 'EMERGENCY' | 'PANIC' | 'LOCKDOWN' | 'UNLOCKDOWN'

export type SecuritySeverityName = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface RecordSecurityEventDto {
  userId?: string
  eventType: SecurityEventTypeName
  severity: SecuritySeverityName
  source?: string
  ipAddress?: string
  userAgent?: string
  location?: Record<string, unknown>
  description?: string
}

export interface SecurityQueryParams {
  userId?: string
  eventType?: SecurityEventTypeName
  severity?: SecuritySeverityName
  page?: number
  limit?: number
}

export interface CreateDeviceSessionDto {
  userId: string
  deviceId?: string
  deviceName?: string
  deviceType?: string
  ipAddress?: string
  userAgent?: string
}

export interface CreateLoginHistoryDto {
  userId?: string
  staffId?: string
  ipAddress?: string
  userAgent?: string
  success?: boolean
  failReason?: string
}
