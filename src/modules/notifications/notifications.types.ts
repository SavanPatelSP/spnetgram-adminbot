export type NotificationChannel = 'IN_APP' | 'TELEGRAM' | 'EMAIL'

export type NotificationType =
  | 'SYSTEM'
  | 'CASE_ASSIGNMENT'
  | 'TICKET_REPLY'
  | 'SLA_BREACH'
  | 'MODERATION_ACTION'
  | 'INVESTIGATION_UPDATE'
  | 'PERMISSION_CHANGE'
  | 'PREMIUM_EXPIRY'
  | 'ECONOMY_TRANSACTION'
  | 'SECURITY_ALERT'
  | 'APPROVAL_REQUEST'
  | 'KPI_ALERT'
  | 'STAFF_ANNOUNCEMENT'
  // New values for Phase 10:
  | 'TICKET_NEW'
  | 'TICKET_ASSIGNED'
  | 'TICKET_CLAIMED'
  | 'TICKET_ESCALATED'
  | 'TICKET_RESOLVED'
  | 'TICKET_REOPENED'
  | 'MODERATION_WARNING'
  | 'MODERATION_BAN'
  | 'MODERATION_SUSPENSION'
  | 'MODERATION_APPEAL'
  | 'MODERATION_CRITICAL'
  | 'PREMIUM_PURCHASE'
  | 'PREMIUM_APPROVAL'
  | 'PREMIUM_RENEWAL'
  | 'ECONOMY_LARGE_TRANSFER'
  | 'ECONOMY_COMPENSATION'
  | 'ECONOMY_REFUND'
  | 'ECONOMY_SUSPICIOUS'
  | 'SECURITY_LOGIN_ANOMALY'
  | 'SECURITY_MULTI_DEVICE'
  | 'SECURITY_RISK'
  | 'SECURITY_FRAUD'
  | 'SECURITY_BREACH'
  | 'STAFF_PROMOTION'
  | 'STAFF_DEMOTION'
  | 'STAFF_SUSPENSION'
  | 'STAFF_KPI_ALERT'
  | 'STAFF_DEPARTMENT_TRANSFER'
  | 'SYSTEM_DOWNTIME'
  | 'SYSTEM_DATABASE'
  | 'SYSTEM_INFRASTRUCTURE'
  | 'SYSTEM_MAINTENANCE'

export type NotificationCategory = 'TICKET' | 'MODERATION' | 'PREMIUM' | 'ECONOMY' | 'SECURITY' | 'STAFF' | 'SYSTEM'

export function getCategoryForType(type: NotificationType): NotificationCategory {
  if (type.startsWith('TICKET')) return 'TICKET'
  if (type.startsWith('MODERATION')) return 'MODERATION'
  if (type.startsWith('PREMIUM')) return 'PREMIUM'
  if (type.startsWith('ECONOMY')) return 'ECONOMY'
  if (type.startsWith('SECURITY')) return 'SECURITY'
  if (type.startsWith('STAFF')) return 'STAFF'
  return 'SYSTEM'
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string | null
  data?: Record<string, unknown> | null
  channel: NotificationChannel
  category?: NotificationCategory | null
  readAt?: Date | null
  createdAt: Date
}

export interface CreateNotificationDto {
  userId: string
  type: NotificationType
  title: string
  body?: string
  data?: Record<string, unknown>
  channel?: NotificationChannel
  category?: NotificationCategory
}

export interface NotificationQueryParams {
  userId: string
  readStatus?: 'read' | 'unread'
  type?: NotificationType
  page?: number
  limit?: number
}

export interface UnreadCount {
  userId: string
  count: number
}

export interface MarkAsReadDto {
  id: string
  userId: string
}
