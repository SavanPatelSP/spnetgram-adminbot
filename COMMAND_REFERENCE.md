# SPNETGRAM Admin Bot — Command Reference

## Overview

- **Total commands**: 53 (2 public, 51 staff-guarded)
- **Bot framework**: Telegraf
- **Middleware**: `staffGuard()` for role-based access, `rateLimiter()` for rate limiting

---

## Public Commands (no authentication)

| Command | Handler | Description |
|---------|---------|-------------|
| `/start` | `commands/start.ts` | Upserts user into DB, sends welcome message |
| `/help` | `commands/help.ts` | Lists key commands in markdown |

---

## Staff Commands (guarded by `staffGuard()`)

### Staff Management

| Command | Description |
|---------|-------------|
| `/staff` | List all staff members with roles and active status |
| `/departments` | List departments with type, lead, and member count |
| `/grantrole <staffId> <roleName>` | Assign a role to a staff member |
| `/revokerole <staffId> <roleName>` | Remove a role from a staff member |
| `/grantpermission <staffId> <resource> <action>` | Grant a specific permission override |
| `/revokepermission <staffId> <resource> <action>` | Revoke a permission override |
| `/temporaryaccess <staffId> <resource> <action> <hours>` | Grant time-bound temporary access |
| `/accessaudit <staffId>` | Check all granted permissions and access levels |

### Moderation

| Command | Description |
|---------|-------------|
| `/warn <user> <reason>` | Issue a warning to a user |
| `/mute <user> <minutes> <reason>` | Mute a user for N minutes |
| `/ban <user> <reason>` | Ban a user from the platform |
| `/unban <user> <reason>` | Unban a previously banned user |
| `/unmute <user> <reason>` | Unmute a previously muted user |

### Cases

| Command | Description |
|---------|-------------|
| `/cases [status]` | List cases, optionally filtered by status |

### Tickets

| Command | Description |
|---------|-------------|
| `/tickets [status]` | List tickets, optionally filtered by status |
| `/ticketsummary` | Ticket summary statistics |

### Investigations

| Command | Description |
|---------|-------------|
| `/investigations [status]` | List investigations, optionally filtered by status |

### Security

| Command | Description |
|---------|-------------|
| `/security` | Security summary dashboard |
| `/securitylogs` | Recent security events (24h) |
| `/risk` | Risk analysis and scoring |
| `/fraud` | Fraud pattern detection |
| `/sessionaudit` | User login session history |

### Monitoring

| Command | Description |
|---------|-------------|
| `/services` | Monitoring service status |
| `/health` | System health check |
| `/system` | Full system status |
| `/stats` | System performance statistics |
| `/latency` | System latency metrics |

### Incidents

| Command | Description |
|---------|-------------|
| `/incident` | List current active incidents |
| `/incidentstatus <id>` | Check incident status |
| `/resolveincident <id>` | Resolve an active incident |
| `/incidenttimeline <id>` | View incident timeline |

### AI Operations

| Command | Description |
|---------|-------------|
| `/summarize` | Generate AI summarization |
| `/ticketsummary` | Ticket summary via AI |
| `/recommendation` | AI recommendation engine |

### Analytics

| Command | Description |
|---------|-------------|
| `/executivedashboard` | Executive view dashboard |
| `/companyreport` | Company metrics report |

### Audit

| Command | Description |
|---------|-------------|
| `/audit` | Global audit log query |
| `/audituser <userId>` | Audit trail for a specific user |
| `/auditstaff <staffId>` | Audit trail for a specific staff member |

### Premium

| Command | Description |
|---------|-------------|
| `/premium` | Premium overview and plan summary |
| `/plans` | List all premium plans and pricing |
| `/requestpremium <userId> <planId>` | Grant premium subscription to a user |
| `/mypremium` | Check your own premium subscriptions |

### Emergency

| Command | Description |
|---------|-------------|
| `/lockdown <reason>` | Activate emergency lockdown (exempt roles bypass) |
| `/liftlockdown` | Deactivate emergency lockdown |

### Dashboards

| Command | Description |
|---------|-------------|
| `/staffdashboard` | Staff overview dashboard |
| `/activedashboard` | Active items dashboard |

### Sync

| Command | Description |
|---------|-------------|
| `/syncstatus` | Sync pipeline health and DLQ count |

### Deep Links

| Command | Description |
|---------|-------------|
| `/deeplinks` | View active deep links |

### Governance (also under Staff)

| Command | Description |
|---------|-------------|
| `/grantrole` | Assign role |
| `/revokerole` | Remove role |
| `/grantpermission` | Grant permission |
| `/revokepermission` | Revoke permission |
| `/temporaryaccess` | Temporary access grant |
| `/accessaudit` | Access audit |

### Help

| Command | Description |
|---------|-------------|
| `/guide` | Full platform guide (departments, roles, permissions, modules) |
| `/commands` | Complete command listing |
| `/examples` | Usage examples with arguments |

---

## API Routes (142 total)

### Health (no auth)
| Method | Route | Handler |
|--------|-------|---------|
| GET | `/health` | health |
| GET | `/health/live` | health |
| GET | `/health/ready` | health |

### Auth
| Method | Route |
|--------|-------|
| POST | `/api/auth/login` |
| POST | `/api/auth/refresh` |
| POST | `/api/auth/logout` |
| POST | `/api/auth/revoke-all` |

### Users
| Method | Route |
|--------|-------|
| GET | `/api/users` |
| GET | `/api/users/search` |
| GET | `/api/users/:id` |
| GET | `/api/users/telegram/:telegramId` |
| POST | `/api/users` |
| PUT | `/api/users/:id/status` |
| PUT | `/api/users/:id/intelligence` |

### Staff
| Method | Route |
|--------|-------|
| GET | `/api/staff` |
| GET | `/api/staff/:id` |
| GET | `/api/staff/user/:userId` |
| POST | `/api/staff` |
| PUT | `/api/staff/:id` |
| POST | `/api/staff/:id/role` |
| POST | `/api/staff/:id/activate` |
| POST | `/api/staff/:id/deactivate` |

### Permissions
| Method | Route |
|--------|-------|
| GET | `/api/permissions/staff/:staffId` |
| GET | `/api/permissions/check` |
| POST | `/api/permissions/grant` |
| POST | `/api/permissions/revoke` |
| GET | `/api/permissions` |
| POST | `/api/permissions/assign-role` |
| POST | `/api/permissions/remove-role` |

### Moderation
| Method | Route |
|--------|-------|
| GET | `/api/moderation/:id` |
| GET | `/api/moderation/target/:targetId` |
| GET | `/api/moderation/moderator/:moderatorId` |
| GET | `/api/moderation/target/:targetId/summary` |
| POST | `/api/moderation` |

### Cases
| Method | Route |
|--------|-------|
| GET | `/api/cases` |
| GET | `/api/cases/:id` |
| POST | `/api/cases` |
| PUT | `/api/cases/:id` |
| POST | `/api/cases/:id/assign` |
| POST | `/api/cases/:id/transition` |

### Tickets
| Method | Route |
|--------|-------|
| GET | `/api/tickets` |
| GET | `/api/tickets/:id` |
| POST | `/api/tickets` |
| PUT | `/api/tickets/:id` |
| POST | `/api/tickets/:id/assign` |
| POST | `/api/tickets/:id/transition` |
| POST | `/api/tickets/:id/reply` |

### Investigations
| Method | Route |
|--------|-------|
| GET | `/api/investigations` |
| GET | `/api/investigations/:id` |
| POST | `/api/investigations` |
| PUT | `/api/investigations/:id` |
| POST | `/api/investigations/:id/transition` |
| POST | `/api/investigations/:id/assign` |
| POST | `/api/investigations/:id/evidence` |
| DELETE | `/api/investigations/:investigationId/evidence/:evidenceId` |
| GET | `/api/investigations/:investigationId/evidence` |

### SLA
| Method | Route |
|--------|-------|
| GET | `/api/sla` |
| GET | `/api/sla/:id` |
| POST | `/api/sla` |
| POST | `/api/sla/check-breaches` |
| POST | `/api/sla/:id/resolve` |
| GET | `/api/sla/target/:targetType/:targetId` |
| GET | `/api/sla/target/:targetType/:targetId/compliance` |

### Audit
| Method | Route |
|--------|-------|
| GET | `/api/audit` |
| GET | `/api/audit/:id` |
| GET | `/api/audit/staff/:staffId` |
| GET | `/api/audit/actor/:actorId` |
| GET | `/api/audit/target/:targetId` |
| GET | `/api/audit/resource/:resource/:resourceId` |
| GET | `/api/audit/compliance-report` |
| POST | `/api/audit/export` |
| GET | `/api/audit/export/:id` |

### Notifications
| Method | Route |
|--------|-------|
| GET | `/api/notifications/user/:userId` |
| GET | `/api/notifications/:id` |
| POST | `/api/notifications` |
| POST | `/api/notifications/:id/read` |
| POST | `/api/notifications/user/:userId/read-all` |
| GET | `/api/notifications/user/:userId/unread-count` |
| DELETE | `/api/notifications/:id` |

### Departments
| Method | Route |
|--------|-------|
| GET | `/api/departments` |
| GET | `/api/departments/:id` |
| GET | `/api/departments/:id/staff` |
| POST | `/api/departments` |
| PUT | `/api/departments/:id` |
| POST | `/api/departments/staff` |
| DELETE | `/api/departments/:departmentId/staff/:staffId` |

### Premium
| Method | Route |
|--------|-------|
| GET | `/api/premium/plans` |
| GET | `/api/premium/plans/:id` |
| POST | `/api/premium/plans` |
| PUT | `/api/premium/plans/:id` |
| GET | `/api/premium/subscriptions` |
| GET | `/api/premium/subscriptions/:id` |
| POST | `/api/premium/subscriptions` |
| POST | `/api/premium/subscriptions/:id/cancel` |
| GET | `/api/premium/check/:userId/:feature` |
| POST | `/api/premium/expire` |

### Economy
| Method | Route |
|--------|-------|
| POST | `/api/economy/accounts/:userId` |
| GET | `/api/economy/accounts/:userId` |
| GET | `/api/economy/accounts/id/:id` |
| GET | `/api/economy/accounts/:userId/balance` |
| GET | `/api/economy/accounts/:accountId/transactions` |
| POST | `/api/economy/transactions` |
| POST | `/api/economy/transfer` |
| POST | `/api/economy/accounts/:id/freeze` |
| POST | `/api/economy/accounts/:id/unfreeze` |

### KPI
| Method | Route |
|--------|-------|
| GET | `/api/kpi/definitions` |
| GET | `/api/kpi/definitions/:id` |
| POST | `/api/kpi/definitions` |
| PUT | `/api/kpi/definitions/:id` |
| GET | `/api/kpi/records` |
| GET | `/api/kpi/records/:id` |
| POST | `/api/kpi/records` |
| GET | `/api/kpi/targets` |
| POST | `/api/kpi/targets` |
| GET | `/api/kpi/staff/:staffId/summary` |

### Approvals
| Method | Route |
|--------|-------|
| GET | `/api/approvals` |
| GET | `/api/approvals/:id` |
| GET | `/api/approvals/reference/:referenceId` |
| GET | `/api/approvals/pending/:userId` |
| POST | `/api/approvals` |
| POST | `/api/approvals/:id/cancel` |
| POST | `/api/approvals/steps/approve` |
| POST | `/api/approvals/steps/reject` |
| POST | `/api/approvals/steps/request-info` |

### Security
| Method | Route |
|--------|-------|
| POST | `/api/security/events` |
| GET | `/api/security/events` |
| GET | `/api/security/events/:id` |
| POST | `/api/security/devices` |
| POST | `/api/security/devices/:id/deactivate` |
| GET | `/api/security/devices/user/:userId` |
| POST | `/api/security/login-history` |
| GET | `/api/security/login-history` |
| GET | `/api/security/login-history/recent-failed` |

### Monitoring
| Method | Route |
|--------|-------|
| POST | `/api/monitoring/services` |
| GET | `/api/monitoring/services` |
| GET | `/api/monitoring/services/:id` |
| PUT | `/api/monitoring/services/:id/status` |
| GET | `/api/monitoring/services/status/:status` |
| POST | `/api/monitoring/alerts` |
| GET | `/api/monitoring/alerts` |
| GET | `/api/monitoring/alerts/:id` |
| POST | `/api/monitoring/alerts/:id/acknowledge` |

### Incidents
| Method | Route |
|--------|-------|
| POST | `/api/incidents` |
| GET | `/api/incidents` |
| GET | `/api/incidents/:id` |
| PUT | `/api/incidents/:id` |
| POST | `/api/incidents/:id/resolve` |
| POST | `/api/incidents/:id/timeline` |
| GET | `/api/incidents/:id/timeline` |
| POST | `/api/incidents/:id/reports` |
| GET | `/api/incidents/:id/reports` |
| GET | `/api/incidents/reports/:reportId` |
| POST | `/api/incidents/:id/rca` |
| GET | `/api/incidents/:id/rca` |
| POST | `/api/incidents/rca/:rcaId/approve` |

### AI
| Method | Route |
|--------|-------|
| POST | `/api/ai/summaries` |
| GET | `/api/ai/summaries` |
| GET | `/api/ai/summaries/:id` |
| GET | `/api/ai/summaries/target/:targetType/:targetId` |
| POST | `/api/ai/recommendations` |
| GET | `/api/ai/recommendations` |
| GET | `/api/ai/recommendations/:id` |
| POST | `/api/ai/recommendations/:id/apply` |
| POST | `/api/ai/recommendations/:id/dismiss` |

### Analytics
| Method | Route |
|--------|-------|
| POST | `/api/analytics/metrics` |
| GET | `/api/analytics/metrics` |
| GET | `/api/analytics/metrics/aggregation/:metric` |
| POST | `/api/analytics/dashboards` |
| GET | `/api/analytics/dashboards` |
| GET | `/api/analytics/dashboards/:id` |
| PUT | `/api/analytics/dashboards/:id` |
| DELETE | `/api/analytics/dashboards/:id` |
| POST | `/api/analytics/dashboards/:id/set-default` |

### Sync
| Method | Route |
|--------|-------|
| POST | `/api/sync/events` |
| GET | `/api/sync/events` |
| GET | `/api/sync/events/:id` |
| PUT | `/api/sync/events/:id` |
| POST | `/api/sync/events/:id/processed` |
| POST | `/api/sync/events/:id/failed` |
| GET | `/api/sync/events/pending` |
| GET | `/api/sync/events/failed` |

### Deep Links
| Method | Route |
|--------|-------|
| POST | `/api/deeplinks` |
| GET | `/api/deeplinks` |
| GET | `/api/deeplinks/:id` |
| GET | `/api/deeplinks/code/:code` |
| POST | `/api/deeplinks/resolve/:code` |
| POST | `/api/deeplinks/:id/deactivate` |

### Dashboard
| Method | Route |
|--------|-------|
| GET | `/api/dashboard/staff-overview` |
| GET | `/api/dashboard/moderation-stats` |
| GET | `/api/dashboard/ticket-stats` |
| GET | `/api/dashboard/case-stats` |
| GET | `/api/dashboard/kpi-summary` |
| GET | `/api/dashboard/security-summary` |
| GET | `/api/dashboard/system-health` |
| GET | `/api/dashboard/snapshot` |

### Governance
| Method | Route |
|--------|-------|
| POST | `/api/governance/check-access` |
| POST | `/api/governance/temporary-permissions` |
| DELETE | `/api/governance/temporary-permissions/:id` |
| POST | `/api/governance/overrides` |
| DELETE | `/api/governance/overrides` |
| POST | `/api/governance/special-access` |
| DELETE | `/api/governance/special-access/:id` |
| GET | `/api/governance/overrides` |
| GET | `/api/governance/temporary-permissions` |
| POST | `/api/governance/sensitive-actions` |
| GET | `/api/governance/sensitive-actions` |
| POST | `/api/governance/validate-sensitive-action` |
| POST | `/api/governance/audit-exports` |
| GET | `/api/governance/audit-exports/:id` |
| POST | `/api/governance/process-expired` |

---

## Dashboard Widgets (7)

| Widget | Service Method | Cache TTL | Data Sources |
|--------|---------------|-----------|-------------|
| `STAFF_OVERVIEW` | `getStaffOverview()` | 300s | StaffMember, StaffRoleAssignment, DepartmentStaff |
| `MODERATION_STATS` | `getModerationStats()` | 300s | ModerationAction (type groups, 24h count, top moderators) |
| `TICKET_STATS` | `getTicketStats()` | 300s | Ticket (status/priority, avg resolution, unassigned) |
| `CASE_STATS` | `getCaseStats()` | 300s | Case (status/priority, avg resolution) |
| `KPI_SUMMARY` | `getKpiSummary()` | 300s | KpiDefinition, KpiRecord (top 10, dept rankings) |
| `SECURITY_SUMMARY` | `getSecuritySummary()` | 300s | SecurityEvent (24h), DeviceSession (active), MonitoringAlert |
| `SYSTEM_HEALTH` | `getSystemHealth()` | 300s | ServiceStatus (up/down), MonitoringAlert (24h) |
