import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import type { Server } from 'node:http'

vi.mock('../../modules/sync/sync.service.js', () => {
  let callCount = 0
  const mockCreateEvent = vi.fn().mockImplementation(() => {
    callCount++
    return Promise.resolve({ id: `sync-${callCount}` })
  })
  return {
    SyncService: vi.fn().mockImplementation(() => ({
      getEvent: vi.fn(),
      list: vi.fn(),
      update: vi.fn(),
      markProcessed: vi.fn(),
      markFailed: vi.fn(),
      getPendingEvents: vi.fn(),
      getFailedEvents: vi.fn(),
      queryEvents: vi.fn(),
      createEvent: mockCreateEvent,
    })),
  }
})

describe('Webhook Endpoint', () => {
  let server: Server

  beforeAll(async () => {
    const { startServer } = await import('../server.js')
    server = await startServer()
  })

  afterAll(() => {
    server?.close()
  })

  it('should accept POST /api/webhooks/spnet-admin', async () => {
    const res = await fetch(`http://localhost:${(server.address() as any).port}/api/webhooks/spnet-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'user:created', entity: 'user', entityId: 'u1', action: 'created' }),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.syncId).toBe('sync-1')
  })

  it('should return 404 for GET /api/webhooks/spnet-admin', async () => {
    const res = await fetch(`http://localhost:${(server.address() as any).port}/api/webhooks/spnet-admin`)
    expect(res.status).toBe(404)
  })

  it('should handle empty payload', async () => {
    const res = await fetch(`http://localhost:${(server.address() as any).port}/api/webhooks/spnet-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
    expect(json.syncId).toBe('sync-2')
  })
})
