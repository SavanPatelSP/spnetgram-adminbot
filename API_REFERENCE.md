# SPNETGRAM Admin Bot — API Reference

## Overview

210 REST endpoints across 26 resource groups. All endpoints use:
- `auditMiddleware` (request logging)
- `correlationIdMiddleware` (correlation ID injection)
- `authGuard` (JWT Bearer token — except 5 public endpoints)
- Optional `requirePermission(resource, action)` guard (101 endpoints)

## Public Endpoints (5)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Overall health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (DB + Redis) |
| POST | `/api/auth/login` | Login, returns JWT + refresh token |
| POST | `/api/auth/refresh` | Refresh access token |

## Auth (2 authenticated)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/logout` | authGuard | Blacklist current token |
| POST | `/api/auth/revoke-all` | authGuard | Revoke all sessions for user |

## Users (7)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/users` | — | List users |
| GET | `/api/users/search` | — | Search users |
| GET | `/api/users/:id` | — | Get user by ID |
| GET | `/api/users/telegram/:telegramId` | — | Get user by Telegram ID |
| POST | `/api/users` | USERS:CREATE | Upsert user |
| PUT | `/api/users/:id/status` | USERS:UPDATE | Update user status |
| PUT | `/api/users/:id/intelligence` | USERS:UPDATE | Update user intelligence data |

## Staff (8)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff` | — | List staff |
| GET | `/api/staff/:id` | — | Get staff by ID |
| GET | `/api/staff/user/:userId` | — | Get staff by user ID |
| POST | `/api/staff` | STAFF:CREATE | Create staff member |
| PUT | `/api/staff/:id` | STAFF:UPDATE | Update staff member |
| POST | `/api/staff/:id/role` | STAFF:UPDATE | Assign role |
| POST | `/api/staff/:id/activate` | STAFF:UPDATE | Activate staff |
| POST | `/api/staff/:id/deactivate` | STAFF:UPDATE | Deactivate staff |

## Permissions (8)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/permissions/staff/:staffId` | — | Get permissions for staff |
| GET | `/api/permissions/check` | — | Check specific permission |
| POST | `/api/permissions/grant` | PERMISSIONS:GRANT | Grant permission |
| POST | `/api/permissions/revoke` | PERMISSIONS:REVOKE | Revoke permission |
| GET | `/api/permissions` | — | List permissions |
| POST | `/api/permissions/assign-role` | STAFF:UPDATE | Assign role to staff |
| POST | `/api/permissions/remove-role` | STAFF:UPDATE | Remove role from staff |

## Moderation (5)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/moderation/:id` | — | Get moderation action |
| GET | `/api/moderation/target/:targetId` | — | List by target |
| GET | `/api/moderation/moderator/:moderatorId` | — | List by moderator |
| GET | `/api/moderation/target/:targetId/summary` | — | Target summary |
| POST | `/api/moderation` | MODERATION:CREATE | Create moderation action |

## Cases (6)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/cases` | — | List cases |
| GET | `/api/cases/:id` | — | Get case by ID |
| POST | `/api/cases` | CASES:CREATE | Create case |
| PUT | `/api/cases/:id` | CASES:UPDATE | Update case |
| POST | `/api/cases/:id/assign` | CASES:UPDATE | Assign case |
| POST | `/api/cases/:id/transition` | CASES:UPDATE | Transition status |

## Tickets (7)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/tickets` | — | List tickets |
| GET | `/api/tickets/:id` | — | Get ticket |
| POST | `/api/tickets` | TICKETS:CREATE | Create ticket |
| PUT | `/api/tickets/:id` | TICKETS:UPDATE | Update ticket |
| POST | `/api/tickets/:id/assign` | TICKETS:UPDATE | Assign ticket |
| POST | `/api/tickets/:id/transition` | TICKETS:UPDATE | Transition status |
| POST | `/api/tickets/:id/reply` | TICKETS:UPDATE | Add reply |

## Investigations (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/investigations` | — | List investigations |
| GET | `/api/investigations/:id` | — | Get investigation |
| POST | `/api/investigations` | INVESTIGATIONS:CREATE | Create investigation |
| PUT | `/api/investigations/:id` | INVESTIGATIONS:UPDATE | Update investigation |
| POST | `/api/investigations/:id/transition` | INVESTIGATIONS:UPDATE | Transition status |
| POST | `/api/investigations/:id/assign` | INVESTIGATIONS:UPDATE | Assign |
| POST | `/api/investigations/:id/evidence` | INVESTIGATIONS:UPDATE | Add evidence |
| DELETE | `/api/investigations/:investigationId/evidence/:evidenceId` | INVESTIGATIONS:DELETE | Remove evidence |
| GET | `/api/investigations/:investigationId/evidence` | — | Get evidence |

## SLA (7)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/sla` | — | List active SLAs |
| GET | `/api/sla/:id` | — | Get SLA |
| POST | `/api/sla` | SLA:CREATE | Start SLA |
| POST | `/api/sla/check-breaches` | SLA:UPDATE | Check breaches |
| POST | `/api/sla/:id/resolve` | SLA:UPDATE | Resolve SLA |
| GET | `/api/sla/target/:targetType/:targetId` | — | Get SLAs by target |
| GET | `/api/sla/target/:targetType/:targetId/compliance` | — | Get compliance |

## Audit (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/audit` | — | Query audit logs |
| GET | `/api/audit/:id` | — | Get audit log |
| GET | `/api/audit/staff/:staffId` | — | By staff |
| GET | `/api/audit/actor/:actorId` | — | By actor |
| GET | `/api/audit/target/:targetId` | — | By target |
| GET | `/api/audit/resource/:resource/:resourceId` | — | By resource |
| GET | `/api/audit/compliance-report` | — | Compliance report |
| POST | `/api/audit/export` | AUDIT:EXPORT | Export logs |
| GET | `/api/audit/export/:id` | — | Get export status |

## Notifications (7)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/notifications/user/:userId` | — | List by user |
| GET | `/api/notifications/:id` | — | Get notification |
| POST | `/api/notifications` | NOTIFICATIONS:CREATE | Create notification |
| POST | `/api/notifications/:id/read` | NOTIFICATIONS:UPDATE | Mark as read |
| POST | `/api/notifications/user/:userId/read-all` | NOTIFICATIONS:UPDATE | Mark all read |
| GET | `/api/notifications/user/:userId/unread-count` | — | Unread count |
| DELETE | `/api/notifications/:id` | NOTIFICATIONS:DELETE | Delete notification |

## Departments (7)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/departments` | — | List departments |
| GET | `/api/departments/:id` | — | Get department |
| GET | `/api/departments/:id/staff` | — | List department staff |
| POST | `/api/departments` | DEPARTMENTS:CREATE | Create department |
| PUT | `/api/departments/:id` | DEPARTMENTS:UPDATE | Update department |
| POST | `/api/departments/staff` | DEPARTMENTS:UPDATE | Add staff to department |
| DELETE | `/api/departments/:departmentId/staff/:staffId` | DEPARTMENTS:DELETE | Remove staff from department |

## Premium (10)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/premium/plans` | — | List plans |
| GET | `/api/premium/plans/:id` | — | Get plan |
| POST | `/api/premium/plans` | PREMIUM:CREATE | Create plan |
| PUT | `/api/premium/plans/:id` | PREMIUM:UPDATE | Update plan |
| GET | `/api/premium/subscriptions` | — | List subscriptions |
| GET | `/api/premium/subscriptions/:id` | — | Get subscription |
| POST | `/api/premium/subscriptions` | PREMIUM:CREATE | Create subscription |
| POST | `/api/premium/subscriptions/:id/cancel` | PREMIUM:UPDATE | Cancel subscription |
| GET | `/api/premium/check/:userId/:feature` | — | Check feature access |
| POST | `/api/premium/expire` | PREMIUM:UPDATE | Expire subscriptions |

## Economy (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/economy/accounts/:userId` | ECONOMY:CREATE | Ensure account |
| GET | `/api/economy/accounts/:userId` | — | Get account |
| GET | `/api/economy/accounts/id/:id` | — | Get account by ID |
| GET | `/api/economy/accounts/:userId/balance` | — | Get balance |
| GET | `/api/economy/accounts/:accountId/transactions` | — | List transactions |
| POST | `/api/economy/transactions` | ECONOMY:CREATE | Create transaction |
| POST | `/api/economy/transfer` | ECONOMY:CREATE | Transfer |
| POST | `/api/economy/accounts/:id/freeze` | ECONOMY:UPDATE | Freeze account |
| POST | `/api/economy/accounts/:id/unfreeze` | ECONOMY:UPDATE | Unfreeze account |

## KPI (10)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/kpi/definitions` | — | List definitions |
| GET | `/api/kpi/definitions/:id` | — | Get definition |
| POST | `/api/kpi/definitions` | KPI:CREATE | Create definition |
| PUT | `/api/kpi/definitions/:id` | KPI:UPDATE | Update definition |
| GET | `/api/kpi/records` | — | List records |
| GET | `/api/kpi/records/:id` | — | Get record |
| POST | `/api/kpi/records` | KPI:CREATE | Create record |
| GET | `/api/kpi/targets` | — | List targets |
| POST | `/api/kpi/targets` | KPI:CREATE | Create target |
| GET | `/api/kpi/staff/:staffId/summary` | — | Staff KPI summary |

## Approvals (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/approvals` | — | List approval requests |
| GET | `/api/approvals/:id` | — | Get request |
| GET | `/api/approvals/reference/:referenceId` | — | Get by reference |
| GET | `/api/approvals/pending/:userId` | — | Pending for approver |
| POST | `/api/approvals` | APPROVALS:CREATE | Create request |
| POST | `/api/approvals/:id/cancel` | APPROVALS:UPDATE | Cancel request |
| POST | `/api/approvals/steps/approve` | APPROVALS:APPROVE | Approve step |
| POST | `/api/approvals/steps/reject` | APPROVALS:REJECT | Reject step |
| POST | `/api/approvals/steps/request-info` | APPROVALS:UPDATE | Request info |

## Security (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/security/events` | SECURITY:CREATE | Record security event |
| GET | `/api/security/events` | — | Query events |
| GET | `/api/security/events/:id` | — | Get event |
| POST | `/api/security/devices` | SECURITY:CREATE | Register device |
| POST | `/api/security/devices/:id/deactivate` | SECURITY:UPDATE | Deactivate device |
| GET | `/api/security/devices/user/:userId` | — | List sessions |
| POST | `/api/security/login-history` | SECURITY:CREATE | Record login |
| GET | `/api/security/login-history` | — | Login history |
| GET | `/api/security/login-history/recent-failed` | — | Recent failed logins |

## Monitoring (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/monitoring/services` | MONITORING:CREATE | Upsert service |
| GET | `/api/monitoring/services` | — | List services |
| GET | `/api/monitoring/services/:id` | — | Get service |
| PUT | `/api/monitoring/services/:id/status` | MONITORING:UPDATE | Update status |
| GET | `/api/monitoring/services/status/:status` | — | By status |
| POST | `/api/monitoring/alerts` | MONITORING:CREATE | Trigger alert |
| GET | `/api/monitoring/alerts` | — | List alerts |
| GET | `/api/monitoring/alerts/:id` | — | Get alert |
| POST | `/api/monitoring/alerts/:id/acknowledge` | MONITORING:UPDATE | Acknowledge alert |

## Incidents (13)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/incidents` | INCIDENTS:CREATE | Create incident |
| GET | `/api/incidents` | — | List incidents |
| GET | `/api/incidents/:id` | — | Get incident |
| PUT | `/api/incidents/:id` | INCIDENTS:UPDATE | Update incident |
| POST | `/api/incidents/:id/resolve` | INCIDENTS:UPDATE | Resolve incident |
| POST | `/api/incidents/:id/timeline` | INCIDENTS:UPDATE | Add timeline entry |
| GET | `/api/incidents/:id/timeline` | — | Get timeline |
| POST | `/api/incidents/:id/reports` | INCIDENTS:UPDATE | Create report |
| GET | `/api/incidents/:id/reports` | — | Get reports |
| GET | `/api/incidents/reports/:reportId` | — | Get report |
| POST | `/api/incidents/:id/rca` | INCIDENTS:UPDATE | Create RCA |
| GET | `/api/incidents/:id/rca` | — | Get RCA |
| POST | `/api/incidents/rca/:rcaId/approve` | INCIDENTS:UPDATE | Approve RCA |

## AI Operations (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/ai/summaries` | AI:CREATE | Create summary |
| GET | `/api/ai/summaries` | — | Query summaries |
| GET | `/api/ai/summaries/:id` | — | Get summary |
| GET | `/api/ai/summaries/target/:targetType/:targetId` | — | By target |
| POST | `/api/ai/recommendations` | AI:CREATE | Create recommendation |
| GET | `/api/ai/recommendations` | — | List recommendations |
| GET | `/api/ai/recommendations/:id` | — | Get recommendation |
| POST | `/api/ai/recommendations/:id/apply` | AI:UPDATE | Apply recommendation |
| POST | `/api/ai/recommendations/:id/dismiss` | AI:UPDATE | Dismiss recommendation |

## Analytics (9)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/analytics/metrics` | ANALYTICS:CREATE | Record metric |
| GET | `/api/analytics/metrics` | — | Query metrics |
| GET | `/api/analytics/metrics/aggregation/:metric` | — | Aggregation |
| POST | `/api/analytics/dashboards` | ANALYTICS:CREATE | Create dashboard |
| GET | `/api/analytics/dashboards` | — | List dashboards |
| GET | `/api/analytics/dashboards/:id` | — | Get dashboard |
| PUT | `/api/analytics/dashboards/:id` | ANALYTICS:UPDATE | Update dashboard |
| DELETE | `/api/analytics/dashboards/:id` | ANALYTICS:DELETE | Delete dashboard |
| POST | `/api/analytics/dashboards/:id/set-default` | ANALYTICS:UPDATE | Set default dashboard |

## Sync (8)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/sync/events` | SYNC:CREATE | Create sync event |
| GET | `/api/sync/events` | — | List sync events |
| GET | `/api/sync/events/:id` | — | Get sync event |
| PUT | `/api/sync/events/:id` | SYNC:UPDATE | Update sync event |
| POST | `/api/sync/events/:id/processed` | SYNC:UPDATE | Mark processed |
| POST | `/api/sync/events/:id/failed` | SYNC:UPDATE | Mark failed |
| GET | `/api/sync/events/pending` | — | Pending events |
| GET | `/api/sync/events/failed` | — | Failed events |

## Deep Links (6)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/deeplinks` | DEEPLINKS:CREATE | Create link |
| GET | `/api/deeplinks` | — | List links |
| GET | `/api/deeplinks/:id` | — | Get link |
| GET | `/api/deeplinks/code/:code` | — | Get by code |
| POST | `/api/deeplinks/resolve/:code` | DEEPLINKS:READ | Resolve link |
| POST | `/api/deeplinks/:id/deactivate` | DEEPLINKS:UPDATE | Deactivate link |

## Dashboard (8)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/dashboard/staff-overview` | — | Staff overview |
| GET | `/api/dashboard/moderation-stats` | — | Moderation stats |
| GET | `/api/dashboard/ticket-stats` | — | Ticket stats |
| GET | `/api/dashboard/case-stats` | — | Case stats |
| GET | `/api/dashboard/kpi-summary` | — | KPI summary |
| GET | `/api/dashboard/security-summary` | — | Security summary |
| GET | `/api/dashboard/system-health` | — | System health |
| GET | `/api/dashboard/snapshot` | — | Aggregated snapshot |

## Governance (15)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/governance/check-access` | GOVERNANCE:READ | Check access |
| POST | `/api/governance/temporary-permissions` | GOVERNANCE:CREATE | Grant temp permission |
| DELETE | `/api/governance/temporary-permissions/:id` | GOVERNANCE:DELETE | Revoke temp permission |
| POST | `/api/governance/overrides` | GOVERNANCE:CREATE | Grant override |
| DELETE | `/api/governance/overrides` | GOVERNANCE:DELETE | Revoke override |
| POST | `/api/governance/special-access` | GOVERNANCE:CREATE | Grant special access |
| DELETE | `/api/governance/special-access/:id` | GOVERNANCE:DELETE | Revoke special access |
| GET | `/api/governance/overrides` | — | List overrides |
| GET | `/api/governance/temporary-permissions` | — | List temp permissions |
| POST | `/api/governance/sensitive-actions` | GOVERNANCE:CREATE | Configure sensitive action |
| GET | `/api/governance/sensitive-actions` | — | List sensitive actions |
| POST | `/api/governance/validate-sensitive-action` | GOVERNANCE:READ | Validate sensitive action |
| POST | `/api/governance/audit-exports` | GOVERNANCE:CREATE | Create audit export |
| GET | `/api/governance/audit-exports/:id` | — | Get audit export |
| POST | `/api/governance/process-expired` | GOVERNANCE:UPDATE | Process expired permissions |

## Summary

| Metric | Count |
|--------|-------|
| Total endpoints | **210** |
| GET (read) | 107 |
| POST (create/action) | 83 |
| PUT (update) | 12 |
| DELETE | 8 |
| Auth-only (no permission check) | 109 |
| Permission-guarded | 101 |
| Fully public (no auth) | 5 |
| Distinct permission resources | 23 |
