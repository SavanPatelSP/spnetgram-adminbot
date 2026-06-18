import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@infrastructure/database/prisma.service.js', () => ({
  PrismaService: {
    getInstance: vi.fn(() => ({
      client: {
        slaEntry: {
          create: vi.fn(),
          findUnique: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          update: vi.fn(),
        },
      },
    })),
  },
}))

vi.mock('@infrastructure/event-bus/event-bus.js', () => ({
  EventBus: {
    getInstance: vi.fn(() => ({
      emit: vi.fn(),
    })),
  },
}))

vi.mock('../../../shared/utils/id.js', () => ({
  generateId: vi.fn(() => 'test-id'),
}))

import { SlaService } from '../sla.service.js'

describe('SlaService', () => {
  let service: SlaService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SlaService()
  })

  it('should start an SLA timer', async () => {
    const mockSla = {
      id: 'test-id',
      caseId: 'case-1',
      ticketId: null,
      policyName: 'Critical Cases',
      targetHours: 2,
      startedAt: new Date(),
      deadlineAt: new Date(),
      breachedAt: null,
      resolvedAt: null,
      status: 'ACTIVE',
      createdAt: new Date(),
    }
    vi.mocked(service['prisma'].slaEntry.create).mockResolvedValue(mockSla)

    const result = await service.startSla({
      caseId: 'case-1',
      policyName: 'Critical Cases',
      targetHours: 2,
      deadlineAt: new Date(),
    })

    expect(result.status).toBe('ACTIVE')
    expect(service['eventBus'].emit).toHaveBeenCalledWith('sla:created', expect.any(Object))
  })

  it('should throw NotFoundError for missing SLA', async () => {
    vi.mocked(service['prisma'].slaEntry.findUnique).mockResolvedValue(null)
    await expect(service.findSlaById('nonexistent')).rejects.toThrowError('not found')
  })

  it('should check and detect breaches', async () => {
    const past = new Date(Date.now() - 100000)
    const mockSlas = [{
      id: 'sla-1',
      caseId: 'case-1',
      ticketId: null,
      policyName: 'Test Policy',
      targetHours: 1,
      startedAt: new Date(),
      deadlineAt: past,
      breachedAt: null,
      resolvedAt: null,
      status: 'ACTIVE',
      createdAt: new Date(),
    }]

    vi.mocked(service['prisma'].slaEntry.findMany).mockResolvedValue(mockSlas)
    vi.mocked(service['prisma'].slaEntry.update).mockResolvedValue(mockSlas[0] as any)

    const results = await service.checkForBreaches()

    expect(results).toHaveLength(1)
    expect(results[0].breached).toBe(true)
    expect(service['eventBus'].emit).toHaveBeenCalledWith('sla:breached', expect.any(Object))
  })
})
