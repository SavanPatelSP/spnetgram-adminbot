# SPNETGRAM Admin Bot — Testing Guide

## Overview

- **Test framework**: Vitest v2.1.9
- **Test runner**: `npx vitest run`
- **Total tests**: 161 (30 files)
- **Coverage**: All 24 service modules + bot commands + API integration

---

## Running Tests

```bash
# Run all tests
npx vitest run

# Run with watch mode
npx vitest

# Run specific test file
npx vitest run src/modules/sync/__tests__/inbound-sync.service.test.ts

# Run with coverage
npx vitest run --coverage
```

---

## Test Files (30 total)

### Modules (28 test files)

| Module | File | Tests | Type |
|--------|------|-------|------|
| Sync - Inbound | `sync/__tests__/inbound-sync.service.test.ts` | 23 | Unit (validation rules) |
| Sync - Dispatcher | `sync/__tests__/bot-notification-dispatcher.test.ts` | 16 | Unit (notification building) |
| Sync - Service | `sync/__tests__/sync.service.test.ts` | 3 | Unit (CRUD error cases) |
| Notifications | `notifications/__tests__/notifications.service.test.ts` | 5 | Integration |
| SLA | `sla/__tests__/sla.service.test.ts` | 3 | Integration |
| Dashboard | `dashboard/__tests__/dashboard.service.test.ts` | 8 | Integration |
| Audit | `audit/__tests__/audit.service.test.ts` | 4 | Integration |
| Investigations | `investigations/__tests__/investigations.service.test.ts` | 6 | Integration |
| Cases | `cases/__tests__/cases.service.test.ts` | 3 | Integration |
| Tickets | `tickets/__tests__/tickets.service.test.ts` | 4 | Integration |
| API Integration | `api/__tests__/api.integration.test.ts` | 19 | Integration |
| Bot Commands | `bot/commands/__tests__/commands.test.ts` | 7 | Integration |
| Governance | `governance/__tests__/governance.service.test.ts` | 6 | Integration |
| Users | `users/__tests__/users.service.test.ts` | 3 | Integration |
| Moderation | `moderation/__tests__/moderation.service.test.ts` | 4 | Integration |
| Staff (extended) | `staff/__tests__/staff.service.extended.test.ts` | 4 | Integration |
| Permissions | `permissions/__tests__/permissions.service.test.ts` | 3 | Integration |
| AI | `ai/__tests__/ai.service.test.ts` | 4 | Integration |
| Deeplinks | `deeplinks/__tests__/deeplinks.service.test.ts` | 4 | Integration |
| Premium | `premium/__tests__/premium.service.test.ts` | 3 | Integration |
| Approvals | `approvals/__tests__/approvals.service.test.ts` | 3 | Integration |
| Security | `security/__tests__/security.service.test.ts` | 3 | Integration |
| Analytics | `analytics/__tests__/analytics.service.test.ts` | 3 | Integration |
| Monitoring | `monitoring/__tests__/monitoring.service.test.ts` | 3 | Integration |
| KPI | `kpi/__tests__/kpi.service.test.ts` | 3 | Integration |
| Departments | `departments/__tests__/departments.service.test.ts` | 3 | Integration |
| Economy | `economy/__tests__/economy.service.test.ts` | 3 | Integration |
| Incidents | `incidents/__tests__/incidents.service.test.ts` | 3 | Integration |
| Staff | `staff/__tests__/staff.service.test.ts` | 3 | Integration |
| Bot Guide | `bot/commands/staff/__tests__/guide.test.ts` | 2 | Integration |

### Test Categories

1. **Unit Tests** (39 tests)
   - InboundSyncService validation rules (23 tests) — validates required fields for 11 event types
   - BotNotificationDispatcher notification building (16 tests) — verifies dispatch info for all 11 event types

2. **Integration Tests** (122 tests)
   - Service-layer tests (Prisma-dependent) — CRUD operations, state transitions
   - Bot command tests — command registration and execution
   - API integration tests — route handling and request processing

---

## Sync Module Test Coverage

### InboundSyncService (23 tests)

- Unsupported event type returns `null`
- All event types reject missing required fields
- All event types pass with complete payloads
- Null, undefined, and empty string rejection
- Optional fields do not cause false failures

### BotNotificationDispatcher (16 tests)

- Unknown event type returns `null`
- All 11 event types produce correct type, category, title, body, targetUserId
- Fallback fields (e.g., `staffId` when `userId` absent)
- Missing `reason` in premium:rejected does not produce `undefined` in body
- All notification types map to correct Telegram delivery

### SyncService (3 tests)

- `getEvent` throws `NotFoundError` for non-existent event
- `markProcessed` throws `NotFoundError` for non-existent event
- `markFailed` throws `NotFoundError` for non-existent event

---

## TypeScript Validation

```bash
npx tsc --noEmit
# Expected: no output (zero errors)
```

---

## Pre-Commit Checklist

1. Run TypeScript check: `npx tsc --noEmit`
2. Run full test suite: `npx vitest run`
3. Verify sync module tests pass (3 test files, 42 tests)
4. Verify bot command tests pass (2 test files, 9 tests)
5. Verify all 161 tests pass across 30 files
