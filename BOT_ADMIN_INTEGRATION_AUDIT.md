# Bot ↔ Admin Integration Audit

**Date:** 2026-06-18
**Scope:** All bidirectional synchronization flows between SPNETGRAM Admin Bot and SPNET-ADMIN

---

## 1. Bot → Admin Synchronization Flows

### 1.1 Test / Permissions

```
Source: staff.service.ts:assignRole()
  → Event: staff:promoted / staff:demoted / staff:role:changed
  → Consumer: SyncProcessor.onModuleEvent (line 41)
  → SyncEvent: INSERT (source=adminbot, target=spnetgram)
  → Destination: sync_events DB (PROCESSED by stub — no HTTP call)
  → ⚠️  No cross-system data transfer
```

```
Source: permissions.service.ts:grant() / revoke()
  → Event: permission:granted / permission:revoked
  → Consumer: SyncProcessor.onModuleEvent (line 42)
  → SyncEvent: INSERT (source=adminbot, target=spnetgram)
  → Destination: sync_events DB
```

**NOT synced:** `role:assigned`, `role:revoked` (emitted by service, not subscribed by processor)

---

### 1.2 Cases

```
Source: cases.service.ts:transitionStatus() [DISMISSED|RESOLVED]
  → Event: case:closed (via SyncPublishers)
  → Consumer: SyncProcessor.onModuleEvent (line 44)
  → SyncEvent: INSERT (source=adminbot, target=spnetgram)
  → Destination: sync_events DB
```

```
Source: cases.service.ts:create() / update() / assign() / transitionStatus()
  → Event: case:created / case:updated / case:assigned / case:status:changed
  → Consumer: SyncProcessor.onModuleEvent (line 44)
  → SyncEvent: INSERT (source=adminbot, target=spnetgram)
  → Destination: sync_events DB
```

---

### 1.3 Tickets

```
Source: tickets.service.ts:transitionStatus() [CLOSED|RESOLVED]
  → Event: ticket:closed (via SyncPublishers)
  → Consumer: SyncProcessor.onModuleEvent (line 45)
  → SyncEvent: INSERT (source=adminbot, target=spnetgram)
  → Destination: sync_events DB
```

```
Source: tickets.service.ts:create() / update() / assign() / addReply()
  → Event: ticket:created / ticket:updated / ticket:assigned / ticket:replied
  → Consumer: SyncProcessor.onModuleEvent (line 45)
  → SyncEvent: INSERT
  → Destination: sync_events DB
```

---

### 1.4 Premium

```
Source: premium.service.ts:createSubscription()
  → Event: subscription:created (via PremiumEvents)  ← NOT CONSUMED
  → Event: premium:granted (via SyncPublishers)      ← CONSUMED
  → Consumer: SyncProcessor.onModuleEvent (line 52)
  → SyncEvent: INSERT
```

```
Source: premium.service.ts:cancelSubscription()
  → Event: subscription:updated (via PremiumEvents)  ← NOT CONSUMED
  → Event: premium:removed (via SyncPublishers)      ← CONSUMED
  → Consumer: SyncProcessor.onModuleEvent (line 52)
  → SyncEvent: INSERT
```

```
Source: premium.service.ts:expireSubscriptions()
  → Event: subscription:expired (via PremiumEvents)
  → Consumer: SyncProcessor.onModuleEvent (line 52)
  → SyncEvent: INSERT
```

---

### 1.5 Economy

```
Source: economy.service.ts:createTransaction()
  → Event: transaction:created (via EconomyEvents)  ← NOT CONSUMED
  → Event: economy:coins:credited/debited or economy:diamonds:credited/debited (via SyncPublishers)
  → Consumer: SyncProcessor.onModuleEvent (lines 53-54)
  → SyncEvent: INSERT
```

```
Source: economy.service.ts:freezeAccount() / unfreezeAccount()
  → Event: account:frozen / account:unfrozen (via EconomyEvents)
  → Consumer: SyncProcessor.onModuleEvent (line 55)
  → SyncEvent: INSERT
```

---

### 1.6 Approvals

```
Source: approvals.service.ts:createRequest()
  → Event: approval:request:created (via ApprovalEvents)
  → Consumer: SyncProcessor.onModuleEvent (line 57)
  → SyncEvent: INSERT
```

```
Source: approvals.service.ts:approveStep() / rejectStep()
  → Event: approval:step:completed (via ApprovalEvents)
  → Consumer: SyncProcessor.onModuleEvent (line 57)
  → SyncEvent: INSERT
```

```
Source: approvals.service.ts:checkRequestResolution() / rejectStep()
  → Event: approval:request:resolved (via ApprovalEvents)
  → Consumer: SyncProcessor.onModuleEvent (line 57)
  → SyncEvent: INSERT
```

```
Source: approvals.service.ts:checkRequestResolution()  [all steps approved]
  → Event: approval:approved (via SyncPublishers)
  → Consumer: SyncProcessor.onModuleEvent (line 58)
  → SyncEvent: INSERT
```

```
Source: approvals.service.ts:rejectStep()
  → Event: approval:rejected (via SyncPublishers)
  → Consumer: SyncProcessor.onModuleEvent (line 58)
  → SyncEvent: INSERT
```

---

### 1.7 Other Modules (flow pattern identical)

| Module | Events | Subscribed? |
|--------|--------|-------------|
| Users | `user:upserted`, `user:status:updated` | ❌ Wrong names (processor wants `user:created`, `user:status:changed`) |
| SLA | `sla:created`, `sla:breached`, `sla:resolved` | ✅ |
| Audit | `audit:logged` | ✅ |
| Investigations | `investigation:created`, `investigation:updated`, `investigation:completed` | ✅ |
| Notifications | `notification:sent` | ✅ |
| Departments | `department:created`, `department:updated`, `department:staff:added`, `department:staff:removed` | ✅ |
| KPI | `kpi:record:created`, `kpi:target:achieved` | ✅ |
| Security | `security:event:created`, `security:incident:detected`, `security:case:created`, `security:lockdown:triggered`, `security:lockdown:lifted` | ✅ |
| Monitoring | `monitoring:service:status:changed`, `monitoring:alert:triggered`, `monitoring:alert:acknowledged` | ✅ |
| Incidents | `incident:created`, `incident:updated`, `incident:resolved`, `incident:report:generated` | ✅ |
| AI | `ai:summary:generated`, `ai:recommendation:created`, `ai:recommendation:applied` | ✅ |
| Analytics | `analytics:metric:recorded`, `analytics:dashboard:created` | ✅ |
| Deep Links | `deeplink:created`, `deeplink:clicked` | ✅ |
| Dashboard | `dashboard:snapshot:generated` | ✅ |
| Governance | All 7 governance events | ❌ Not subscribed |
| Moderation | `moderation:action:executed` | ✅ |
| | `moderation:action:created`, `moderation:user:banned/warned/muted` | ❌ Not subscribed |

---

## 2. Admin → Bot Synchronization Flows

### 2.1 REST API Endpoints

Admin (external) can push events to Bot via:

```
Admin System
  → POST /api/sync/events (body: CreateSyncEventDto)
  → SyncController.createEvent()
  → SyncService.createEvent()
  → INSERT sync_event (status=PENDING)
  → emit sync:event:created (debug log only, no action)
  → Destination: sync_events DB
```

Additional read endpoints for Admin to poll:
- `GET /api/sync/events` — list/filter
- `GET /api/sync/events/:id` — get by ID
- `GET /api/sync/events/pending` — pending events
- `GET /api/sync/events/failed` — failed events

### 2.2 Scheduler (Legacy Path)

```
Scheduler (every 15 min — app.ts:53-76)
  → SyncService.getPendingEvents(20)
  → for each: markProcessed() (stub — no actual sync)
  → Destination: sync_events DB status update
```

### 2.3 SyncProcessor (New Path)

```
SyncProcessor.processBatch() (every 30 sec — sync.processor.ts:21)
  → SyncService.getPendingEvents(50)
  → for each: processEvent()
  → resolveEntityService() — STUB (returns type name string, no operation)
  → markProcessed() — no cross-system transfer
  → Destination: sync_events DB status update
```

**⚠️ Both scheduler and SyncProcessor have duplicate batch-processing logic.**

---

## 3. All Event Publishers

### 3.1 Module Event Emitters (direct eventBus.emit in services)

| Service | Events | File:Line |
|---------|--------|-----------|
| `users.service.ts` | `user:upserted`, `user:status:updated`, `user:intelligence:updated` | 44, 56, 65 |
| `staff.service.ts` | `staff:created`, `staff:updated`, `staff:deactivated`, `staff:promoted`, `staff:demoted`, `staff:role:changed` | 59, 86, 88, 137, 142, 148 |
| `permissions.service.ts` | `permission:granted`, `permission:revoked`, `role:assigned`, `role:revoked` | 72, 103, 183, 205 |
| `moderation.service.ts` | `moderation:action:created`, `moderation:action:executed` | 57, 58 |
| `cases.service.ts` | `case:created`, `case:updated`, `case:assigned`, `case:status:changed` | 31, 73, 87, 110 |
| `tickets.service.ts` | `ticket:created`, `ticket:updated`, `ticket:assigned`, `ticket:replied` | 31, 76, 90, 141 |
| `sla.service.ts` | `sla:created`, `sla:breached`, `sla:resolved` | 27, 85, 113 |
| `audit.service.ts` | `audit:log:created`, `audit:logged` | 31, 32 |
| `investigations.service.ts` | `investigation:created`, `investigation:updated`, `investigation:completed` | 34, 81, 108 |
| `notifications.service.ts` | `notification:sent` | 29 |
| `economy.service.ts` | (via EconomyEvents helpers) `transaction:created`, `account:frozen`, `account:unfrozen` | 87-93, 199, 209 |

### 3.2 SyncPublishers (explicit sync event emitters)

| Method | Event | Call Site | File:Line |
|--------|-------|-----------|-----------|
| `publishCaseClosed` | `case:closed` | `cases.service.ts` | 112 |
| `publishTicketClosed` | `ticket:closed` | `tickets.service.ts` | 114 |
| `publishPremiumGranted` | `premium:granted` | `premium.service.ts` | 88 |
| `publishPremiumRemoved` | `premium:removed` | `premium.service.ts` | 120 |
| `publishCoinsCredited` | `economy:coins:credited` | `economy.service.ts` | 91 |
| `publishCoinsDebited` | `economy:coins:debited` | `economy.service.ts` | 93 |
| `publishDiamondsCredited` | `economy:diamonds:credited` | `economy.service.ts` | 87 |
| `publishDiamondsDebited` | `economy:diamonds:debited` | `economy.service.ts` | 89 |
| `publishApprovalApproved` | `approval:approved` | `approvals.service.ts` | 193 |
| `publishApprovalRejected` | `approval:rejected` | `approvals.service.ts` | 149 |

### 3.3 Unused SyncPublishers Methods

| Method | Event | Purpose |
|--------|-------|---------|
| `publishStaffPromoted` | `staff:promoted` | Staff promoted (event emitted directly by staff.service.ts instead) |
| `publishStaffDemoted` | `staff:demoted` | Staff demoted (event emitted directly by staff.service.ts instead) |
| `publishStaffSuspended` | `staff:suspended` | Staff suspended (never called by any service) |
| `publishPremiumExtended` | `premium:extended` | Premium subscription extended (never called) |
| `publishDepartmentTransferred` | `department:transferred` | Staff transferred between departments (never called) |
| `publishSecurityCaseCreated` | `security:case:created` | Security case created (never called) |

---

## 4. All Event Consumers

### 4.1 SyncProcessor (72 subscriptions)

Registers 72 event listeners funneling into `onModuleEvent()`. Creates a `sync_event` row for each occurrence.

**Events subscribed:** All 72 listed in `sync.processor.ts:38-66`

**Action:** Creates `SyncEvent` with `source: 'adminbot'`, `target: 'spnetgram'` and marks as PROCESSED (stub).

### 4.2 registerSyncConsumers (4 subscriptions)

| Event | Action |
|-------|--------|
| `sync:event:created` | Debug log only (no-op) |
| `sync:event:processed` | If spnetgram→adminbot: create notification. If adminbot→spnetgram: create audit log |
| `sync:event:failed` | Create notification + audit log |
| `sync:event:dlq` | Create audit log only |

---

## 5. All Notification Flows

### 5.1 Sync-Triggered Notifications

```
sync:event:processed (source=spnetgram, target=adminbot)
  → notificationsService.create(entityId, 'SYSTEM', 'Sync completed: ...', ...)
  → INSERT notification (channel='IN_APP')
  → emit notification:sent
  → SyncProcessor catches notification:sent → creates sync event → loop!
```

**⚠️ Circular risk:** A notification sent due to a sync event creates another sync event via `notification:sent`.

### 5.2 Sync-Triggered Audit Logs

```
sync:event:processed (source=adminbot, target=spnetgram)
  → createAuditLogForSync() → auditService.create()
  → INSERT audit_log
  → emit audit:logged
  → SyncProcessor catches audit:logged → creates sync event → loop!
```

**⚠️ Circular risk:** Same pattern as notifications. An audit log created from a sync event creates another sync event.

### 5.3 No Telegram Delivery for Sync Notifications

Sync notifications use `channel: 'IN_APP'` only. No `TELEGRAM` channel delivery.

---

## 6. All Dashboard Update Flows

```
DashboardService.getAggregatedSnapshot()
  → DashboardEvents.snapshotGenerated(dashboardId, snapshotType)
  → eventBus.emit('dashboard:snapshot:generated', payload)
  → SyncProcessor.onModuleEvent
  → SyncService.createEvent(source=adminbot, target=spnetgram)
  → Destination: sync_events DB (stub processing)
```

**⚠️ No actual data transfer.** The snapshot payload is NOT sent to SPNET-ADMIN. Only a sync_event record is created.

---

## 7. All Approval Workflow Synchronization

### Status: ✅ COMPLETE

All 5 approval events are properly emitted and consumed:

| Event | Emitter | Consumer | SyncEvent Created |
|-------|---------|----------|-------------------|
| `approval:request:created` | ApprovalEvents helper | SyncProcessor | ✅ |
| `approval:step:completed` | ApprovalEvents helper | SyncProcessor | ✅ |
| `approval:request:resolved` | ApprovalEvents helper | SyncProcessor | ✅ |
| `approval:approved` | SyncPublishers | SyncProcessor | ✅ |
| `approval:rejected` | SyncPublishers | SyncProcessor | ✅ |

---

## 8. All Permission Synchronization

### Status: ⚠️ PARTIAL

| Action | Event | Consumed? |
|--------|-------|-----------|
| Permission granted | `permission:granted` | ✅ |
| Permission revoked | `permission:revoked` | ✅ |
| Role assigned | `role:assigned` | ❌ Not subscribed |
| Role revoked | `role:revoked` | ❌ Not subscribed |
| Permission cleared | `permission:cleared` | ❌ Never emitted (dead helper) |

---

## 9. Duplicate Batch Processing

There are TWO independent batch-processing loops:

| Loop | Interval | Source | Action |
|------|----------|--------|--------|
| Scheduler | 15 min (app.ts) | `SyncService.getPendingEvents(20)` | markProcessed/markFailed (stub) |
| SyncProcessor | 30 sec (sync.processor.ts) | `SyncService.getPendingEvents(50)` | processEvent → markProcessed (stub) |

Both loops process the same events. The first to run marks events as PROCESSED. The second finds nothing. This is wasteful.

---

## 10. Event Name Mismatches

| Service emits | Processor subscribes | Match? |
|---------------|---------------------|--------|
| `user:upserted` | `user:created` | ❌ |
| `user:status:updated` | `user:status:changed` | ❌ |
| `user:intelligence:updated` | (not subscribed) | ❌ |
| `user:linked` | (not subscribed) | ❌ |
| `moderation:action:created` | (not subscribed) | ❌ |
| `audit:log:created` | (not subscribed) | ❌ |
| `role:assigned` | (not subscribed) | ❌ |
| `role:revoked` | (not subscribed) | ❌ |
| `transaction:created` | (not subscribed) | ❌ |
| `subscription:created` | (not subscribed) | ❌ |
| `subscription:updated` | (not subscribed) | ❌ |
| All governance events | (not subscribed) | ❌ |
