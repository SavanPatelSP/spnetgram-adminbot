export const Events = {
  // Users
  UserCreated: 'user:created',
  UserStatusChanged: 'user:status:changed',

  // Staff
  StaffCreated: 'staff:created',
  StaffUpdated: 'staff:updated',
  StaffRoleChanged: 'staff:role:changed',
  StaffDeactivated: 'staff:deactivated',
  StaffPromoted: 'staff:promoted',
  StaffDemoted: 'staff:demoted',
  StaffSuspended: 'staff:suspended',

  // Permissions
  PermissionGranted: 'permission:granted',
  PermissionRevoked: 'permission:revoked',

  // Moderation
  ModerationActionExecuted: 'moderation:action:executed',
  ModerationActionCreated: 'moderation:action:created',

  // Roles
  RoleAssigned: 'role:assigned',
  RoleRevoked: 'role:revoked',

  // Cases
  CaseCreated: 'case:created',
  CaseUpdated: 'case:updated',
  CaseAssigned: 'case:assigned',
  CaseStatusChanged: 'case:status:changed',
  CaseClosed: 'case:closed',

  // Tickets
  TicketCreated: 'ticket:created',
  TicketUpdated: 'ticket:updated',
  TicketAssigned: 'ticket:assigned',
  TicketReplied: 'ticket:replied',
  TicketClosed: 'ticket:closed',

  // SLA
  SlaCreated: 'sla:created',
  SlaBreached: 'sla:breached',
  SlaResolved: 'sla:resolved',

  // Audit
  AuditLogCreated: 'audit:log:created',
  AuditLogged: 'audit:logged',

  // Investigations
  InvestigationCreated: 'investigation:created',
  InvestigationUpdated: 'investigation:updated',
  InvestigationCompleted: 'investigation:completed',

  // Notifications
  NotificationSent: 'notification:sent',

  // Users
  UserIntelligenceUpdated: 'user:intelligence:updated',
  UserLinked: 'user:linked',

  // Departments
  DepartmentCreated: 'department:created',
  DepartmentUpdated: 'department:updated',
  DepartmentStaffAdded: 'department:staff:added',
  DepartmentStaffRemoved: 'department:staff:removed',
  DepartmentTransferred: 'department:transferred',

  // Premium
  PremiumGranted: 'premium:granted',
  PremiumExtended: 'premium:extended',
  PremiumRemoved: 'premium:removed',
  SubscriptionExpired: 'subscription:expired',
  SubscriptionCreated: 'subscription:created',
  SubscriptionUpdated: 'subscription:updated',

  // Economy
  TransactionCreated: 'transaction:created',
  CoinsCredited: 'economy:coins:credited',
  CoinsDebited: 'economy:coins:debited',
  DiamondsCredited: 'economy:diamonds:credited',
  DiamondsDebited: 'economy:diamonds:debited',
  AccountFrozen: 'account:frozen',
  AccountUnfrozen: 'account:unfrozen',

  // KPI
  KpiRecordCreated: 'kpi:record:created',
  KpiTargetAchieved: 'kpi:target:achieved',

  // Approval
  ApprovalRequestCreated: 'approval:request:created',
  ApprovalStepCompleted: 'approval:step:completed',
  ApprovalRequestResolved: 'approval:request:resolved',
  ApprovalApproved: 'approval:approved',
  ApprovalRejected: 'approval:rejected',

  // Security
  SecurityEventCreated: 'security:event:created',
  SecurityIncidentDetected: 'security:incident:detected',
  SecurityCaseCreated: 'security:case:created',
  SecurityLockdownTriggered: 'security:lockdown:triggered',
  SecurityLockdownLifted: 'security:lockdown:lifted',

  // Monitoring
  ServiceStatusChanged: 'monitoring:service:status:changed',
  MonitoringAlertTriggered: 'monitoring:alert:triggered',
  MonitoringAlertAcknowledged: 'monitoring:alert:acknowledged',

  // Incidents
  IncidentCreated: 'incident:created',
  IncidentUpdated: 'incident:updated',
  IncidentResolved: 'incident:resolved',
  IncidentReportGenerated: 'incident:report:generated',

  // AI
  AiSummaryGenerated: 'ai:summary:generated',
  AiRecommendationCreated: 'ai:recommendation:created',
  AiRecommendationApplied: 'ai:recommendation:applied',

  // Analytics
  AnalyticsMetricRecorded: 'analytics:metric:recorded',
  AnalyticsDashboardCreated: 'analytics:dashboard:created',

  // Sync
  SyncEventCreated: 'sync:event:created',
  SyncEventProcessed: 'sync:event:processed',
  SyncEventFailed: 'sync:event:failed',
  SyncEventDlq: 'sync:event:dlq',

  // Deep Links
  DeepLinkCreated: 'deeplink:created',
  DeepLinkClicked: 'deeplink:clicked',

  // Dashboard
  DashboardSnapshotGenerated: 'dashboard:snapshot:generated',

  // Governance
  GovernanceOverrideGranted: 'governance:override:granted',
  GovernanceOverrideRevoked: 'governance:override:revoked',
  GovernanceTemporaryGranted: 'governance:temporary:granted',
  GovernanceTemporaryRevoked: 'governance:temporary:revoked',
  GovernanceAccessGranted: 'governance:access:granted',
  GovernanceSensitiveConfigured: 'governance:sensitive:configured',
  GovernanceAuditExportCreated: 'governance:audit:export:created',
} as const

export interface EventPayloads {
  'user:created': { userId: string; telegramId?: bigint }
  'user:status:changed': { userId: string; previousStatus: string; newStatus: string }
  'staff:created': { staffId: string; userId: string; role: string }
  'staff:updated': { staffId: string; userId: string }
  'staff:role:changed': { staffId: string; previousRole: string; newRole: string }
  'staff:deactivated': { staffId: string; userId: string }
  'staff:promoted': { staffId: string; userId: string; newRole: string; previousRole: string }
  'staff:demoted': { staffId: string; userId: string; newRole: string; previousRole: string }
  'staff:suspended': { staffId: string; userId: string; reason?: string }
  'permission:granted': { staffId: string; resource: string; action: string }
  'permission:revoked': { staffId: string; resource: string; action: string }
  'moderation:action:executed': { actionId: string; moderatorId: string; targetId: string; actionType: string }
  'case:created': { caseId: string; referenceId: string; reporterId: string }
  'case:updated': { caseId: string }
  'case:assigned': { caseId: string; assigneeId: string }
  'case:status:changed': { caseId: string; previousStatus: string; newStatus: string }
  'case:closed': { caseId: string; closedBy: string; reason?: string }
  'ticket:created': { ticketId: string; referenceId: string; reporterId: string }
  'ticket:updated': { ticketId: string }
  'ticket:assigned': { ticketId: string; assigneeId: string }
  'ticket:replied': { ticketId: string; userId: string }
  'ticket:closed': { ticketId: string; closedBy: string; reason?: string }
  'sla:created': { slaId: string; targetEntity: string; deadlineAt: string }
  'sla:breached': { slaId: string; targetEntity: string; entityId: string }
  'sla:resolved': { slaId: string }
  'audit:logged': { auditId: string; staffId?: string; action: string; resource: string }
  'investigation:created': { investigationId: string; caseId?: string; reporterId: string }
  'investigation:updated': { investigationId: string }
  'investigation:completed': { investigationId: string }
  'notification:sent': { notificationId: string; userId: string; type: string; data?: Record<string, unknown> }
  'department:created': { departmentId: string; name: string; type: string }
  'department:updated': { departmentId: string }
  'department:staff:added': { departmentId: string; staffId: string; role: string }
  'department:staff:removed': { departmentId: string; staffId: string }
  'department:transferred': { staffId: string; fromDepartmentId: string; toDepartmentId: string; initiatedBy: string }
  'premium:granted': { subscriptionId: string; userId: string; planId: string; durationDays: number }
  'premium:extended': { subscriptionId: string; userId: string; planId: string; additionalDays: number }
  'premium:removed': { subscriptionId: string; userId: string; planId: string; reason?: string }
  'subscription:expired': { subscriptionId: string; userId: string }
  'economy:coins:credited': { transactionId: string; accountId: string; userId: string; amount: number; balance: number; reason?: string }
  'economy:coins:debited': { transactionId: string; accountId: string; userId: string; amount: number; balance: number; reason?: string }
  'economy:diamonds:credited': { transactionId: string; accountId: string; userId: string; amount: number; balance: number; reason?: string }
  'economy:diamonds:debited': { transactionId: string; accountId: string; userId: string; amount: number; balance: number; reason?: string }
  'account:frozen': { accountId: string; userId: string }
  'account:unfrozen': { accountId: string; userId: string }
  'kpi:record:created': { recordId: string; definitionId: string; staffId?: string; value: number }
  'kpi:target:achieved': { targetId: string; definitionId: string; achievedValue: number }
  'approval:request:created': { requestId: string; referenceId: string; requesterId: string; resourceType: string }
  'approval:step:completed': { stepId: string; requestId: string; status: string }
  'approval:request:resolved': { requestId: string; status: string }
  'approval:approved': { requestId: string; referenceId: string; approvedBy: string; resourceType: string }
  'approval:rejected': { requestId: string; referenceId: string; rejectedBy: string; resourceType: string; reason?: string }
  'security:event:created': { eventId: string; eventType: string; userId?: string; severity: string }
  'security:incident:detected': { incidentId: string; title: string; severity: string }
  'security:case:created': { caseId: string; referenceId: string; title: string; severity: string; reportedBy: string }
  'security:lockdown:triggered': { triggeredBy: string; reason?: string }
  'security:lockdown:lifted': { liftedBy: string }
  'monitoring:service:status:changed': { serviceId: string; name: string; previousStatus: string; newStatus: string }
  'monitoring:alert:triggered': { alertId: string; serviceId?: string; severity: string; message: string }
  'monitoring:alert:acknowledged': { alertId: string; acknowledgedBy: string }
  'incident:created': { incidentId: string; referenceId: string; title: string; priority: string }
  'incident:updated': { incidentId: string; status: string }
  'incident:resolved': { incidentId: string; resolvedAt: string }
  'incident:report:generated': { reportId: string; incidentId: string; reportType: string }
  'ai:summary:generated': { summaryId: string; targetType: string; targetId: string; summaryType: string }
  'ai:recommendation:created': { recommendationId: string; category: string; title: string; priority: string }
  'ai:recommendation:applied': { recommendationId: string; appliedBy: string }
  'analytics:metric:recorded': { recordId: string; metric: string; value: number; period?: string }
  'analytics:dashboard:created': { dashboardId: string; name: string; ownerId?: string }
  'sync:event:created': { syncEventId: string; eventType: string; entityType: string; entityId: string }
  'sync:event:processed': { syncEventId: string; status: string }
  'sync:event:failed': { syncEventId: string; error: string }
  'sync:event:dlq': { syncEventId: string; eventType: string; entityType: string; entityId: string; error: string }
  'deeplink:created': { deeplinkId: string; code: string; targetModule: string; targetId: string }
  'deeplink:clicked': { deeplinkId: string; code: string }
  'dashboard:snapshot:generated': { dashboardId: string; snapshotType: string }

  // New events not yet in contracts
  'user:intelligence:updated': { userId: string; data: Record<string, unknown> }
  'user:linked': { userId: string; telegramId: bigint }
  'role:assigned': Record<string, unknown>
  'role:revoked': Record<string, unknown>
  'moderation:action:created': Record<string, unknown>
  'audit:log:created': { log: Record<string, unknown> }
  'transaction:created': { transactionId: string; accountId: string; type: string; amount: number }
  'subscription:created': { subscriptionId: string; userId: string; planId: string }
  'subscription:updated': { subscriptionId: string; status: string }
  'governance:override:granted': Record<string, unknown>
  'governance:override:revoked': Record<string, unknown>
  'governance:temporary:granted': Record<string, unknown>
  'governance:temporary:revoked': Record<string, unknown>
  'governance:access:granted': Record<string, unknown>
  'governance:sensitive:configured': Record<string, unknown>
  'governance:audit:export:created': Record<string, unknown>
}
