# Sync Architecture — SPNETGRAM ↔ Admin Bot

## Overview

Generic queue-based event synchronization between SP-Network Game/Telegram (`spnetgram`) and this Admin Bot (`adminbot`). Uses a database-backed outbox pattern with scheduled polling.

## Data Model

**Table:** `sync_events` (Prisma model `SyncEvent`, lines 1203–1224)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String (cuid) | Primary key |
| `eventType` | String | Logical event name (e.g. `user.updated`, `ticket.created`) |
| `source` | String | Origin system (default: `spnetgram`) |
| `target` | String | Destination system (default: `adminbot`) |
| `entityType` | String | Entity class (e.g. `User`, `Ticket`, `Case`) |
| `entityId` | String | Entity ID in the source system |
| `action` | String | `CREATE`, `UPDATE`, `DELETE` |
| `payload` | Json? | Arbitrary extra data |
| `status` | String | `PENDING` → `PROCESSED` or `FAILED` |
| `error` | String? | Error message on failure |
| `retryCount` | Int | Incremented on retry |
| `processedAt` | DateTime? | When it was processed |
| `createdAt` | DateTime | Auto |
| `updatedAt` | DateTime | Auto |

**Indexes:** `status`, `entityType+entityId`, `createdAt`, `eventType`

## Event Lifecycle

```
PENDING ──→ PROCESSED
    │
    └──→ FAILED (retry ≤ 3)
```

## Trigger Mechanisms (3 total)

### 1. Scheduled Polling (Scheduler)

- **Interval:** Every 15 minutes (`app.ts:53-76`)
- **Batch:** Processes up to 20 pending events (oldest first)
- **Processing:** Currently a stub — marks as `PROCESSED` without actual cross-system transfer

```typescript
for (const event of pending) {
  try { await service.markProcessed(event.id) }
  catch (err) { await service.markFailed(event.id, (err as Error).message) }
}
```

### 2. REST API (9 endpoints)

| Method | Path | Permission | Purpose |
|--------|------|------------|---------|
| POST | `/api/sync/events` | SYNC:CREATE | Create sync event (external systems push here) |
| GET | `/api/sync/events` | — | List/filter events |
| GET | `/api/sync/events/:id` | — | Get single event |
| PUT | `/api/sync/events/:id` | SYNC:UPDATE | Update event |
| POST | `/api/sync/events/:id/processed` | SYNC:UPDATE | Mark processed |
| POST | `/api/sync/events/:id/failed` | SYNC:UPDATE | Mark failed |
| GET | `/api/sync/events/pending` | — | List pending |
| GET | `/api/sync/events/failed` | — | List failed |

### 3. Telegram Bot Command

- `/syncstatus` — displays pending/failed counts and recent events

## Event Bus Integration

Three events emitted but **no listeners currently registered**:

| Event | Payload | Emitted By |
|-------|---------|------------|
| `sync:event:created` | `{ syncEventId, eventType, entityType, entityId }` | `SyncService.createEvent()` |
| `sync:event:processed` | `{ syncEventId, status }` | `SyncService.markProcessed()` |
| `sync:event:failed` | `{ syncEventId, error }` | `SyncService.markFailed()` |

## Service Layer — `SyncService`

| Method | Description |
|--------|-------------|
| `createEvent(dto)` | Insert PENDING row, emit `sync:event:created` |
| `getEvent(id)` | Fetch by ID, throws NotFoundError |
| `queryEvents(params)` | Paginated list with filters |
| `updateEvent(id, dto)` | Update status/error/retryCount |
| `markProcessed(id)` | Set status=PROCESSED + processedAt timestamp |
| `markFailed(id, error)` | Set status=FAILED + error message |
| `getPendingEvents(limit)` | Oldest unprocessed events |
| `getFailedEvents(retryCountMax, limit)` | Failed events below retry threshold |

## End-to-End Flow

```
External System (spnetgram)
    │
    │ POST /api/sync/events
    ▼
SyncController.createEvent()
    │
    ▼
SyncService.createEvent()
    ├── INSERT sync_event (status=PENDING)
    └── emit sync:event:created (no listeners)
    │
    ▼
sync_events DB (persistent queue)
    │
    │ Scheduler (every 15 min)
    ▼
SyncService.getPendingEvents(20)
    for each:
        try   → markProcessed(id) → emit sync:event:processed
        catch → markFailed(id)    → emit sync:event:failed
    │
    ▼
sync_events DB (status updated)
```

## Current Limitations

| Issue | Details |
|-------|---------|
| **No actual sync logic** | Processing is a stub — only updates status, no cross-system data transfer |
| **No webhook receiver** | There is no webhook endpoint for push-based sync |
| **No event bus consumers** | `sync:event:*` events are emitted but no handlers are registered |
| **No retry logic** | `getFailedEvents` accepts a `retryCountMax` param but the scheduler loop does not implement retry |
| **Container bypass** | Bot command and controller instantiate `new SyncService()` directly instead of using DI |

## Future Improvements

1. Implement actual sync handlers (register event bus listeners for `sync:event:processed`)
2. Add webhook endpoint for push-based sync from spnetgram
3. Implement retry logic with exponential backoff
4. Add DLQ for permanently failed events
5. Wire DI container into bot commands and controllers

## Files

| File | Role |
|------|------|
| `src/modules/sync/sync.service.ts` | Core sync logic |
| `src/modules/sync/sync.controller.ts` | REST API handlers |
| `src/modules/sync/sync.events.ts` | Event bus helpers |
| `src/modules/sync/sync.types.ts` | DTOs and interfaces |
| `src/modules/sync/__tests__/sync.service.test.ts` | Unit tests |
| `src/app.ts` (lines 53–76) | Scheduler task registration |
| `src/api/server.ts` (lines 416–423) | Route mounting |
| `src/bot/commands/staff/new-modules.ts` (line 603) | `/syncstatus` command |
| `src/infrastructure/event-bus/contracts.ts` (lines 97–100) | Event type declarations |
| `prisma/schema.prisma` (lines 1203–1224) | Database model |
