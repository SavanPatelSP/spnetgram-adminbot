# SPNETGRAM Admin Bot — Event Catalog

## Overview

**76 total events** declared in `src/infrastructure/event-bus/contracts.ts`. Events flow through the `EventBus` singleton (in-memory pub/sub) and are consumed by the `SyncProcessor` to create sync events for the cross-platform synchronization layer.

## Module Events (72)

### Users (2)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `user:created` | `{ userId, telegramId? }` | `users.service.ts` |
| `user:status:changed` | `{ userId, previousStatus, newStatus }` | `users.service.ts` |

### Staff (7)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `staff:created` | `{ staffId, userId, role }` | `staff.service.ts:59` |
| `staff:updated` | `{ staffId, data }` | `staff.service.ts:86` |
| `staff:role:changed` | `{ staffId, userId, previousRole, newRole }` | `staff.service.ts` |
| `staff:deactivated` | `{ staffId, userId }` | `staff.service.ts` (on deactivate) |
| `staff:promoted` | `{ staffId, userId, previousRole, newRole }` | `staff.service.ts` (role level increased) |
| `staff:demoted` | `{ staffId, userId, previousRole, newRole }` | `staff.service.ts` (role level decreased) |
| `staff:suspended` | `{ staffId, userId, reason? }` | `staff.service.ts` (on deactivate) |

### Permissions (2)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `permission:granted` | `{ staffId, resource, action }` | `permissions.service.ts:72` |
| `permission:revoked` | `{ staffId, resource, action }` | `permissions.service.ts:103` |

### Moderation (1)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `moderation:action:executed` | `{ actionId, moderatorId, targetId, actionType }` | `moderation.service.ts:57` |

### Cases (5)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `case:created` | `{ caseId, referenceId, reporterId }` | `cases.service.ts:30` |
| `case:updated` | `{ caseId }` | `cases.service.ts:72` |
| `case:assigned` | `{ caseId, assigneeId }` | `cases.service.ts:86` |
| `case:status:changed` | `{ caseId, previousStatus, newStatus }` | `cases.service.ts:109` |
| `case:closed` | `{ caseId, closedBy, reason? }` | `cases.service.ts` (on DISMISSED/RESOLVED) |

### Tickets (5)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `ticket:created` | `{ ticketId, referenceId, reporterId }` | `tickets.service.ts:30` |
| `ticket:updated` | `{ ticketId }` | `tickets.service.ts:75` |
| `ticket:assigned` | `{ ticketId, assigneeId }` | `tickets.service.ts:89` |
| `ticket:replied` | `{ ticketId, userId }` | `tickets.service.ts:137` |
| `ticket:closed` | `{ ticketId, closedBy, reason? }` | `tickets.service.ts` (on CLOSED/RESOLVED) |

### SLA (3)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `sla:created` | `{ slaId, targetEntity, deadlineAt }` | `sla.service.ts:27` |
| `sla:breached` | `{ slaId, targetEntity, entityId }` | `sla.service.ts:85` |
| `sla:resolved` | `{ slaId }` | `sla.service.ts:113` |

### Audit (1)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `audit:logged` | `{ auditId, staffId?, action, resource }` | `audit.service.ts:31` |

### Investigations (3)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `investigation:created` | `{ investigationId, caseId?, reporterId }` | `investigations.service.ts:34` |
| `investigation:updated` | `{ investigationId }` | `investigations.service.ts:81` |
| `investigation:completed` | `{ investigationId }` | `investigations.service.ts:108` |

### Notifications (1)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `notification:sent` | `{ notificationId, userId, type }` | `notifications.service.ts:29` |

### Departments (5)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `department:created` | `{ departmentId, name, type }` | `departments.events.ts:7` |
| `department:updated` | `{ departmentId }` | `departments.events.ts:11` |
| `department:staff:added` | `{ departmentId, staffId, role }` | `departments.events.ts:15` |
| `department:staff:removed` | `{ departmentId, staffId }` | `departments.events.ts:19` |
| `department:transferred` | `{ staffId, fromDepartmentId, toDepartmentId, initiatedBy }` | `sync.publishers.ts` |

### Premium (4)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `premium:granted` | `{ subscriptionId, userId, planId, durationDays }` | `premium.service.ts` + `sync.publishers.ts` |
| `premium:extended` | `{ subscriptionId, userId, planId, additionalDays }` | `sync.publishers.ts` |
| `premium:removed` | `{ subscriptionId, userId, planId, reason? }` | `premium.service.ts` (on cancel) |
| `subscription:expired` | `{ subscriptionId, userId }` | `premium.service.ts` (expiry check) |

### Economy (5)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `economy:coins:credited` | `{ transactionId, accountId, userId, amount, balance, reason? }` | `economy.service.ts` + `sync.publishers.ts` |
| `economy:coins:debited` | `{ transactionId, accountId, userId, amount, balance, reason? }` | `economy.service.ts` + `sync.publishers.ts` |
| `economy:diamonds:credited` | `{ transactionId, accountId, userId, amount, balance, reason? }` | `sync.publishers.ts` |
| `economy:diamonds:debited` | `{ transactionId, accountId, userId, amount, balance, reason? }` | `sync.publishers.ts` |
| `account:frozen` | `{ accountId, userId }` | `economy.events.ts:11` |
| `account:unfrozen` | `{ accountId, userId }` | `economy.events.ts:15` |

### KPI (2)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `kpi:record:created` | `{ recordId, definitionId, staffId?, value }` | `kpi.events.ts:7` |
| `kpi:target:achieved` | `{ targetId, definitionId, achievedValue }` | `kpi.events.ts:11` |

### Approvals (5)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `approval:request:created` | `{ requestId, referenceId, requesterId, resourceType }` | `approvals.events.ts:7` |
| `approval:step:completed` | `{ stepId, requestId, status }` | `approvals.events.ts:11` |
| `approval:request:resolved` | `{ requestId, status }` | `approvals.events.ts:15` |
| `approval:approved` | `{ requestId, referenceId, approvedBy, resourceType }` | `sync.publishers.ts` |
| `approval:rejected` | `{ requestId, referenceId, rejectedBy, resourceType, reason? }` | `sync.publishers.ts` |

### Security (5)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `security:event:created` | `{ eventId, eventType, userId?, severity }` | `security.events.ts:7` |
| `security:incident:detected` | `{ incidentId, title, severity }` | `sync.publishers.ts` |
| `security:case:created` | `{ caseId, referenceId, title, severity, reportedBy }` | `sync.publishers.ts` |
| `security:lockdown:triggered` | `{ triggeredBy, reason? }` | `sync.publishers.ts` |
| `security:lockdown:lifted` | `{ liftedBy }` | `sync.publishers.ts` |

### Monitoring (3)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `monitoring:service:status:changed` | `{ serviceId, name, previousStatus, newStatus }` | `monitoring.events.ts:7` |
| `monitoring:alert:triggered` | `{ alertId, serviceId?, severity, message }` | `monitoring.events.ts:11` |
| `monitoring:alert:acknowledged` | `{ alertId, acknowledgedBy }` | `monitoring.events.ts:15` |

### Incidents (4)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `incident:created` | `{ incidentId, referenceId, title, priority }` | `incidents.events.ts:7` |
| `incident:updated` | `{ incidentId, status }` | `incidents.events.ts:11` |
| `incident:resolved` | `{ incidentId, resolvedAt }` | `incidents.events.ts:15` |
| `incident:report:generated` | `{ reportId, incidentId, reportType }` | `incidents.events.ts:19` |

### AI (3)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `ai:summary:generated` | `{ summaryId, targetType, targetId, summaryType }` | `ai.events.ts:7` |
| `ai:recommendation:created` | `{ recommendationId, category, title, priority }` | `ai.events.ts:11` |
| `ai:recommendation:applied` | `{ recommendationId, appliedBy }` | `ai.events.ts:15` |

### Analytics (2)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `analytics:metric:recorded` | `{ recordId, metric, value, period? }` | `analytics.events.ts:7` |
| `analytics:dashboard:created` | `{ dashboardId, name, ownerId? }` | `analytics.events.ts:11` |

### Deep Links (2)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `deeplink:created` | `{ deeplinkId, code, targetModule, targetId }` | `deeplinks.events.ts:7` |
| `deeplink:clicked` | `{ deeplinkId, code }` | `deeplinks.events.ts:11` |

### Dashboard (1)

| Event | Payload | Publisher |
|-------|---------|-----------|
| `dashboard:snapshot:generated` | `{ dashboardId, snapshotType }` | `dashboard.events.ts:7` |

## Sync Events (4)

| Event | Payload | Purpose |
|-------|---------|---------|
| `sync:event:created` | `{ syncEventId, eventType, entityType, entityId }` | A sync event was enqueued |
| `sync:event:processed` | `{ syncEventId, status }` | A sync event was processed successfully |
| `sync:event:failed` | `{ syncEventId, error }` | A sync event failed (will retry) |
| `sync:event:dlq` | `{ syncEventId, eventType, entityType, entityId, error }` | A sync event moved to Dead Letter Queue |

## Dead Event Helpers (unused)

These helper functions exist in `.events.ts` files but are not called by any service:

| Helper | Event | Location |
|--------|-------|----------|
| `emitUserLinked` | `user:linked` | `users.events.ts:15` |
| `emitPermissionsCleared` | `permission:cleared` | `permissions.events.ts:14` |
| `emitUserBanned` | `moderation:user:banned` | `moderation.events.ts:11` |
| `emitUserWarned` | `moderation:user:warned` | `moderation.events.ts:15` |
| `emitUserMuted` | `moderation:user:muted` | `moderation.events.ts:19` |
| `emitStaffAuditAction` | `audit:staff:action` | `audit.events.ts:10` |
| `emitSystemAuditAction` | `audit:system:action` | `audit.events.ts:14` |

## Event Flow

```
Service Method
    ↓ (DB write)
this.eventBus.emit('module:event', payload)
    ↓
SyncProcessor.onModuleEvent()          ← consumer registered in constructor
    ↓ (idempotency check)
SyncService.createEvent()              ← creates sync_event row
    ↓
sync_events DB (status=PENDING)
    ↓ (every 30s)
SyncProcessor.processBatch()
    ↓ (attempt sync)
markProcessed() or markFailed()
    ↓ (max retries exceeded)
moveToDlq()                            ← status=DLQ
    ↓
sync:event:processed/failed/dlq       ← event bus notification
    ↓
registerSyncConsumers()                ← creates notifications + audit logs
```
