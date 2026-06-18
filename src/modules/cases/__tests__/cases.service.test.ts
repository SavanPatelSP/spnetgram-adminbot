import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@infrastructure/database/prisma.service.js', () => ({
  PrismaService: {
    getInstance: vi.fn(() => ({
      client: {
        case: {
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

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid'),
}))

import { CasesService } from '../cases.service.js'

describe('CasesService', () => {
  let service: CasesService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new CasesService()
  })

  it('should create a case', async () => {
    const mockCase = {
      id: 'test-uuid',
      referenceId: 'CASE-TEST-UUID',
      title: 'Test Case',
      description: 'Test Description',
      priority: 'high',
      status: 'open',
      reporterId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(service['prisma'].case.create).mockResolvedValue(mockCase)

    const result = await service.create({
      title: 'Test Case',
      description: 'Test Description',
      priority: 'high',
      reporterId: 'user-1',
    })

    expect(result.title).toBe('Test Case')
    expect(service['eventBus'].emit).toHaveBeenCalledWith('case:created', expect.any(Object))
  })

  it('should throw NotFoundError for missing case', async () => {
    vi.mocked(service['prisma'].case.findUnique).mockResolvedValue(null)
    await expect(service.findById('nonexistent')).rejects.toThrowError('not found')
  })

  it('should reject invalid status transition', async () => {
    vi.mocked(service['prisma'].case.findUnique).mockResolvedValue({
      id: 'test-uuid',
      status: 'closed',
    } as any)

    await expect(service.transitionStatus('test-uuid', 'open', 'user-1')).rejects.toThrowError('Invalid status transition')
  })
})
