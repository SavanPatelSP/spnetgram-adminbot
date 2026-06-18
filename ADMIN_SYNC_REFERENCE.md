# SPNETGRAM Admin Bot — Admin Sync Reference

## Architecture

```
Bot Module Events                          SPNET-ADMIN API
     │                                          │
     ▼                                          │
SyncProcessor (30s batch)                      │
     │                                          │
     ├── onModuleEvent() ──→ createEvent()      │
     │    (source=adminbot, target=spnetgram)   │
     │                                          │
     └── processBatch()                         │
          │                                     │
          ├── Bot→Admin: HTTP POST ─────────────┤
          │    (source=adminbot, target=spnetgram)
          │                                     │
          └── Admin→Bot: InboundSyncService     │
               (source=spnetgram, target=adminbot)
               │                                │
               ├── validate()                   │
               ├── BotNotificationDispatcher    │
               │    ├── dispatch()              │
               │    ├── dispatchBroadcast()     │
               │    ├── notifyRole()            │
               │    ├── notifyDepartment()      │
               │    └── notifyExecutives()      │
               └── markProcessed()/markFailed() │
```

---

## SyncEvent Model

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | String | cuid() | Primary key |
| `eventType` | String | — | e.g. `user:created`, `ticket:assigned` |
| `source` | String | `"spnetgram"` | Origin system |
| `target` | String | `"adminbot"` | Destination system |
| `entityType` | String | — | e.g. `User`, `Case`, `Ticket` |
| `entityId` | String | — | ID of the entity |
| `action` | String | — | e.g. `CREATE`, `UPDATE`, `ASSIGN` |
| `payload` | Json? | — | Event data |
| `status` | String | `"PENDING"` | PENDING → PROCESSED / FAILED / DLQ |
| `error` | String? | — | Error message on failure |
| `retryCount` | Int | 0 | Number of retries |
| `processedAt` | DateTime? | — | When processed |
| `createdAt` | DateTime | now() | Creation timestamp |
| `updatedAt` | DateTime | updatedAt | Last update |

**Statuses**: `PENDING` → `PROCESSED` (success), `FAILED` (retryable, < 3 attempts), `DLQ` (dead letter, ≥ 3 attempts)

---

## Bot → Admin (80+ Events)

All module events → HTTP POST to SPNET-ADMIN.

### Event Categories

| Prefix | Events |
|--------|--------|
| `user:` | created, status:changed |
| `staff:` | created, updated, role:changed, deactivated, promoted, demoted, suspended |
| `permission:` | granted, revoked |
| `role:` | assigned, revoked |
| `moderation:` | action:executed, action:created |
| `case:` | created, updated, assigned, status:changed, closed |
| `ticket:` | created, updated, assigned, replied, closed |
| `sla:` | created, breached, resolved |
| `audit:` | logged |
| `investigation:` | created, updated, completed |
| `notification:` | sent |
| `department:` | created, updated, staff:added, staff:removed, transferred |
| `premium:` | granted, extended, removed |
| `subscription:` | created, updated, expired |
| `transaction:` | created |
| `economy:` | coins:credited, coins:debited, diamonds:credited, diamonds:debited |
| `account:` | frozen, unfrozen |
| `kpi:` | record:created, target:achieved |
| `approval:` | request:created, step:completed, request:resolved, approved, rejected |
| `security:` | event:created, incident:detected, case:created, lockdown:triggered, lockdown:lifted |
| `monitoring:` | service:status:changed, alert:triggered, alert:acknowledged |
| `incident:` | created, updated, resolved, report:generated |
| `ai:` | summary:generated, recommendation:created, recommendation:applied |
| `analytics:` | metric:recorded, dashboard:created |
| `deeplink:` | created, clicked |
| `dashboard:` | snapshot:generated |
| `governance:` | override:granted, override:revoked, temporary:granted, temporary:revoked, access:granted, sensitive:configured, audit:export:created |

### Delivery Details

- **Endpoint**: `SPNET_ADMIN_API_URL/api/sync/events`
- **Auth**: Bearer token (`SPNET_ADMIN_API_KEY`)
- **Idempotency**: 5-min window by `(eventType, entityType, entityId)`
- **Retry**: 3 attempts max → DLQ
- **Circular Protection**: `syncOriginEvents` Set skips events created as sync side-effects

---

## Admin → Bot (11 Event Types)

Events from SPNET-ADMIN → validated → Telegram notification to target user(s).

### Validated Events

| Event | Required Fields | Optional | Notification Type | Category |
|-------|----------------|----------|------------------|----------|
| `ticket:assigned` | ticketId, assignedTo, assignedBy | — | TICKET_ASSIGNED | TICKET |
| `ticket:escalated` | ticketId, escalatedTo, escalatedBy | — | TICKET_ESCALATED | TICKET |
| `premium:approved` | subscriptionId, userId, approvedBy | — | PREMIUM_APPROVAL | PREMIUM |
| `premium:rejected` | subscriptionId, userId, rejectedBy | reason | PREMIUM_APPROVAL | PREMIUM |
| `security:alert` | alertId, severity | userId, staffId, message | SECURITY_ALERT | SECURITY |
| `security:incident:detected` | incidentId, severity | userId, staffId, message | SECURITY_ALERT | SECURITY |
| `security:case:created` | eventId, caseId, userId | staffId | SECURITY_ALERT | SECURITY |
| `approval:request:created` | requestId, approverId, resourceType | — | APPROVAL_REQUEST | SYSTEM |
| `staff:promoted` | staffId, userId, newRole | previousRole | STAFF_PROMOTION | STAFF |
| `staff:suspended` | staffId, userId | reason | STAFF_SUSPENSION | STAFF |
| `department:transferred` | departmentId, staffId, userId, fromDepartment, toDepartment | — | STAFF_DEPARTMENT_TRANSFER | STAFF |

### Broadcast Fan-Out

When no specific user is targeted (empty `targetUserId`), the dispatcher fans out:

- **Security CRITICAL/HIGH** → All executives (`notifyExecutives()` — OWNER, SUPER_ADMINISTRATOR, CEO, CTO, COO, ADMIN)
- **Security MEDIUM/LOW** → All ADMIN role members (`notifyRole('ADMIN')`)
- **With departmentId** → All department members (`notifyDepartment(id)`)
- **Other events with no target** → Skipped (logged)

---

## Telegram Delivery

### Retry (Exponential Backoff)

| Attempt | Delay Before |
|---------|-------------|
| 1 | 0ms (immediate) |
| 2 | 1,000ms |
| 3 | 2,000ms |

After 3 failed attempts: logged as error, exception propagates to InboundSyncService → event marked FAILED.

### Channel

All admin→bot notifications use `channel: 'TELEGRAM'`, which triggers `deliverViaTelegram()` in `NotificationsService`.

---

## Replay System

### InboundSyncService

| Method | Source Status | Target Status | Limit |
|--------|-------------|--------------|-------|
| `replayFromDlq()` | DLQ → PENDING | PROCESSED / FAILED | 50 |
| `replayFromFailed()` | FAILED (retryCount ≥ 3) → PENDING | PROCESSED / FAILED | 50 |

Both methods:
1. Reset event to PENDING with retryCount=0
2. Call `processEvent()` for each
3. Audit log each replay (action: `SYNC_REPLAY_DLQ` / `SYNC_REPLAY_FAILED`)

---

## Sync Processor Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| PROCESS_INTERVAL_MS | 30,000 | Batch polling interval |
| MAX_RETRIES | 3 | Max delivery attempts before DLQ |
| IDEMPOTENCY_WINDOW_MS | 300,000 (5 min) | Duplicate detection window |
| SPNET_ADMIN_API_URL | env var | SPNET-ADMIN API base URL |
| SPNET_ADMIN_API_KEY | env var | Bearer token for API auth |

---

## API Routes (Sync Module)

| Method | Route | Handler |
|--------|-------|---------|
| POST | `/api/sync/events` | Create sync event |
| GET | `/api/sync/events` | Query events |
| GET | `/api/sync/events/:id` | Get event by ID |
| PUT | `/api/sync/events/:id` | Update event |
| POST | `/api/sync/events/:id/processed` | Mark as processed |
| POST | `/api/sync/events/:id/failed` | Mark as failed |
| GET | `/api/sync/events/pending` | List pending events |
| GET | `/api/sync/events/failed` | List failed events |

---

## Bot Commands (Sync)

| Command | Description |
|---------|-------------|
| `/syncstatus` | Sync pipeline health, consumer count, processing state, DLQ count |
