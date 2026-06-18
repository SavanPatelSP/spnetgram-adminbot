# Sync Gap Analysis

**Date:** 2026-06-18
**Audit scope:** SPNETGRAM Admin Bot ↔ SPNET-ADMIN integration

---

## Score: 3.5 / 10

| Category | Score | Rationale |
|----------|-------|-----------|
| Framework design | 7/10 | EventBus + SyncProcessor + SyncService is well-architected |
| Event subscription coverage | 6/10 | ~85% of emitted events are subscribed, but critical user events are wrong |
| Cross-system transfer | 0/10 | No actual HTTP/API integration exists |
| Publisher completeness | 5/10 | 6/16 SyncPublishers methods unused; dual emission paths |
| Consumer correctness | 4/10 | processEvent is a stub; duplicate batch loops |
| Notification integration | 5/10 | Notifications created for sync events, but circular risk |
| Documentation accuracy | 3/10 | ADMIN_SYNC_REFERENCE.md describes features that don't exist |

---

## Critical Gaps

### GAP-1: No Cross-System Data Transfer (CRITICAL)

**Severity:** BLOCKER

The `SyncProcessor.processEvent()` method at `sync.processor.ts:199` does NOT make any HTTP calls or API requests to SPNET-ADMIN. It resolves an entity service name string and marks the event as PROCESSED. No data ever leaves the database.

```typescript
private async processEvent(event): Promise<void> {
  const entityService = this.resolveEntityService(event.entityType)
  if (!entityService) {
    logger.warn(..., 'No handler for sync event entity type')
    await this.syncService.markProcessed(event.id)
    return
  }
  await this.syncService.markProcessed(event.id)
}
```

**Impact:** All 72 subscribed events create DB records but never reach SPNET-ADMIN. The entire sync infrastructure is a logging system.

### GAP-2: Users Module Event Name Mismatch (CRITICAL)

**Severity:** HIGH

`users.service.ts` emits `user:upserted` and `user:status:updated`. `SyncProcessor` subscribes to `user:created` and `user:status:changed`. Neither event name matches.

**Impact:** ALL user lifecycle events (creation, status changes) are silently dropped. No User sync events are ever created.

**Fix:** Change `users.service.ts` to emit `user:created` instead of `user:upserted`, and `user:status:changed` instead of `user:status:updated`. Or update the processor subscription list.

### GAP-3: SyncProcessor.processEvent() is a Stub (CRITICAL)

**Severity:** HIGH

`processEvent()` verifies the entity type is "known" and marks the event as processed. No entity service is actually invoked. The `resolveEntityService()` returns a string, not a service instance.

**Impact:** Even if events reached the processor correctly, no cross-system communication happens.

### GAP-4: Duplicate Batch Processing Loops (MEDIUM)

**Severity:** MEDIUM

Two independent loops process the same `PENDING` sync events:

| Loop | Interval | Batch Size | Started From |
|------|----------|------------|--------------|
| Scheduler `sync-processing` | 15 min | 20 | `app.ts:53-76` |
| SyncProcessor `processBatch` | 30 sec | 50 | `sync.processor.ts:21` |

**Impact:** Race conditions on event status updates. The scheduler (older code path) may interfere with the SyncProcessor (newer code path).

### GAP-5: Circular Sync Events via Notifications and Audit (MEDIUM)

**Severity:** MEDIUM

```
sync:event:processed → registerSyncConsumers → notificationService.create()
  → emits notification:sent → SyncProcessor.onModuleEvent → creates sync event → loop
```

```
sync:event:processed → registerSyncConsumers → auditService.create()
  → emits audit:logged → SyncProcessor.onModuleEvent → creates sync event → loop
```

**Impact:** Every processed sync event creates a notification and audit log, which in turn creates NEW sync events. The idempotency check (`checkIdempotency` at `sync.processor.ts:100`) always returns `false` (`isIdempotent()` is hardcoded to return `false`).

### GAP-6: Unused SyncPublishers Methods (LOW)

**Severity:** LOW

Six methods defined in `SyncPublishers` are never called:

| Method | Event | Defined at |
|--------|-------|-----------|
| `publishStaffPromoted` | `staff:promoted` | `sync.publishers.ts:6` |
| `publishStaffDemoted` | `staff:demoted` | `sync.publishers.ts:10` |
| `publishStaffSuspended` | `staff:suspended` | `sync.publishers.ts:14` |
| `publishPremiumExtended` | `premium:extended` | `sync.publishers.ts:30` |
| `publishDepartmentTransferred` | `department:transferred` | `sync.publishers.ts:62` |
| `publishSecurityCaseCreated` | `security:case:created` | `sync.publishers.ts:66` |

**Note:** For `staff:promoted`/`staff:demoted`, the events ARE emitted (by `staff.service.ts` directly via `eventBus.emit()`). The SyncPublishers methods are just never used. The other four events are never emitted at all.

### GAP-7: Unused Event Helper Functions (LOW)

**Severity:** LOW

Seven helper functions in `.events.ts` files are defined but never called:

| Function | Event | File |
|----------|-------|------|
| `emitUserLinked` | `user:linked` | `users.events.ts:15` |
| `emitPermissionsCleared` | `permission:cleared` | `permissions.events.ts:14` |
| `emitUserBanned` | `moderation:user:banned` | `moderation.events.ts:11` |
| `emitUserWarned` | `moderation:user:warned` | `moderation.events.ts:15` |
| `emitUserMuted` | `moderation:user:muted` | `moderation.events.ts:19` |
| `emitStaffAuditAction` | `audit:staff:action` | `audit.events.ts:10` |
| `emitSystemAuditAction` | `audit:system:action` | `audit.events.ts:14` |

### GAP-8: Events Not Subscribed by SyncProcessor (LOW)

**Severity:** LOW

The following emitted events have NO consumer:

| Event | Emitted From | Purpose |
|-------|-------------|---------|
| `governance:override:granted` | `governance.events.ts` | Override access granted |
| `governance:override:revoked` | `governance.events.ts` | Override access revoked |
| `governance:temporary:granted` | `governance.events.ts` | Temporary access granted |
| `governance:temporary:revoked` | `governance.events.ts` | Temporary access revoked |
| `governance:access:granted` | `governance.events.ts` | Access granted |
| `governance:sensitive:configured` | `governance.events.ts` | Sensitive config changed |
| `governance:audit:export:created` | `governance.events.ts` | Audit export created |
| `role:assigned` | `permissions.service.ts:183` | Role assignment made |
| `role:revoked` | `permissions.service.ts:205` | Role revoked |
| `moderation:action:created` | `moderation.service.ts:57` | Moderation action recorded |
| `transaction:created` | `economy.service.ts` (via EconomyEvents) | Economy transaction (separate from coins/diamonds events) |
| `subscription:created` | `premium.service.ts` (via PremiumEvents) | Subscription created (separate from premium:granted) |
| `subscription:updated` | `premium.service.ts` (via PremiumEvents) | Subscription updated (separate from premium:removed) |

### GAP-9: Wrong Payload Shape for Some Events (LOW)

**Severity:** LOW

The `SyncProcessor.guessEntityId()` method (line 128-142) enumerates known ID fields. Events that use non-standard field names may fail to extract an entity ID, causing them to be skipped.

Potential issues:
- `governance` events use generic `Record<string, unknown>` payloads with no standard ID field
- `audit:logged` payload uses `auditId` — this IS in the candidate list ✓
- `notification:sent` payload uses `notificationId` — this IS in the candidate list ✓

---

## Missing Integrations

| Feature | Bot→Admin Sync | Admin→Bot Sync | Status |
|---------|---------------|---------------|--------|
| User create/update | ❌ Wrong event names | ❌ No consumer | ❌ |
| User status change | ❌ Wrong event names | ❌ No consumer | ❌ |
| Staff create/update | ✅ | ❌ No consumer | ⚠️ |
| Staff role change | ✅ | ❌ No consumer | ⚠️ |
| Staff promote/demote | ✅ | ❌ No consumer | ⚠️ |
| Permission grant/revoke | ✅ | ❌ No consumer | ⚠️ |
| Case CRUD | ✅ | ❌ No consumer | ⚠️ |
| Ticket CRUD | ✅ | ❌ No consumer | ⚠️ |
| Premium grant/remove/expire | ✅ | ❌ No consumer | ⚠️ |
| Economy transactions | ✅ | ❌ No consumer | ⚠️ |
| Approval workflow | ✅ | ❌ No consumer | ⚠️ |
| Department changes | ✅ (partial) | ❌ No consumer | ⚠️ |
| Security events | ✅ (partial) | ❌ No consumer | ⚠️ |
| Governance | ❌ Not subscribed | ❌ No consumer | ❌ |
| Dashboard snapshots | ✅ (stub) | ❌ No consumer | ⚠️ |

**Key:** ✅ = Event flows to sync_event DB, ⚠️ = No cross-system transfer, ❌ = Broken

---

## Broken Event Chains

| Chain | Break Point | Impact |
|-------|------------|--------|
| User created → sync event | Event name mismatch (`user:upserted` vs `user:created`) | Zero user sync events |
| User status change → sync event | Event name mismatch (`user:status:updated` vs `user:status:changed`) | Zero user status sync events |
| Any sync event → SPNET-ADMIN | `processEvent()` is stub | No data ever reaches SPNET-ADMIN |
| Admin push → Bot → process | No Admin→Bot consumer logic exists | Admin→Bot sync is manual polling only |
| Sync event → notification → sync event | Circular chain with no idempotency guard | Potential infinite loop |

---

## Unused Events

Events declared in `contracts.ts` that are never emitted:

All events in contracts.ts are emitted by at least one service. However, the following helper functions exist but are never called (see GAP-7).

---

## Missing Consumers

| Consumer Type | Status |
|--------------|--------|
| SPNET-ADMIN HTTP API consumer | ❌ Not implemented |
| SPNET-ADMIN webhook receiver | ❌ Not implemented |
| Admin→Bot event processing logic | ❌ Not implemented — `processEvent` is a stub |
| Governance event consumer | ❌ Not subscribed |
| Role assignment event consumer | ❌ Not subscribed |
| User created event consumer | ❌ Subscribes to `user:created` but service emits `user:upserted` |

---

## Missing Publishers

| Publisher | Status |
|-----------|--------|
| `publishStaffPromoted` | ✅ Event emitted (by staff.service.ts directly), SyncPublishers method unused |
| `publishStaffDemoted` | ✅ Event emitted (by staff.service.ts directly), SyncPublishers method unused |
| `publishStaffSuspended` | ❌ No service calls this; no deactivation→suspension mapping |
| `publishPremiumExtended` | ❌ No `extendSubscription()` method exists in premium.service.ts |
| `publishDepartmentTransferred` | ❌ No `transferStaff()` method exists in departments.service.ts |
| `publishSecurityCaseCreated` | ❌ No security case creation method calls this |

---

## Priority Remediation Roadmap

| Priority | Gap | Effort | Impact |
|----------|-----|--------|--------|
| P0 | GAP-1: Implement actual cross-system HTTP integration | Large | Unlocks all sync |
| P0 | GAP-3: Wire processEvent to real entity service calls | Medium | Enables data transfer |
| P1 | GAP-2: Fix user event names | Small | Fixes silent user data loss |
| P1 | GAP-5: Implement isIdempotent or fix circular loops | Small | Prevents infinite loops |
| P2 | GAP-4: Remove duplicate scheduler path | Small | Eliminates race condition |
| P2 | GAP-6: Wire up unused SyncPublishers or remove them | Medium | Cleans code |
| P3 | GAP-8: Add governance/role events to subscription list | Small | Covers remaining modules |
| P3 | GAP-9: Audit payload ID field extraction | Medium | Ensures correct entity IDs |
