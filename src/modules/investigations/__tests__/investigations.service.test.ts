import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@infrastructure/database/prisma.service.js', () => ({
  PrismaService: {
    getInstance: vi.fn(() => ({
      client: {
        investigation: {
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
  generateId: vi.fn(() => 'test-uuid'),
}))

import { InvestigationsService } from '../investigations.service.js'

describe('InvestigationsService', () => {
  let service: InvestigationsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new InvestigationsService()
  })

  it('should create an investigation', async () => {
    const mockInvestigation = {
      id: 'test-uuid',
      caseId: null,
      title: 'Test Investigation',
      description: 'Test Description',
      status: 'DRAFT',
      severity: 'MEDIUM',
      reporterId: 'user-1',
      assigneeId: null,
      evidence: null,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(service['prisma'].investigation.create).mockResolvedValue(mockInvestigation as any)

    const result = await service.create({
      title: 'Test Investigation',
      description: 'Test Description',
      reporterId: 'user-1',
    })

    expect(result.title).toBe('Test Investigation')
    expect(service['eventBus'].emit).toHaveBeenCalledWith('investigation:created', expect.any(Object))
  })

  it('should throw NotFoundError for missing investigation', async () => {
    vi.mocked(service['prisma'].investigation.findUnique).mockResolvedValue(null)
    await expect(service.findById('nonexistent')).rejects.toThrowError('not found')
  })

  it('should reject invalid status transition', async () => {
    vi.mocked(service['prisma'].investigation.findUnique).mockResolvedValue({
      id: 'test-uuid',
      status: 'COMPLETED',
    } as any)

    await expect(service.transitionStatus('test-uuid', 'DRAFT', 'user-1')).rejects.toThrowError('Invalid investigation status transition')
  })

  it('should add evidence to an investigation', async () => {
    vi.mocked(service['prisma'].investigation.findUnique).mockResolvedValue({
      id: 'test-uuid',
      status: 'ACTIVE',
      evidence: [],
    } as any)

    const result = await service.addEvidence({
      investigationId: 'test-uuid',
      type: 'message',
      description: 'Screenshot of conversation',
      submittedById: 'user-1',
    })

    expect(result.description).toBe('Screenshot of conversation')
  })

  it('should reject evidence on completed investigation', async () => {
    vi.mocked(service['prisma'].investigation.findUnique).mockResolvedValue({
      id: 'test-uuid',
      status: 'COMPLETED',
    } as any)

    await expect(service.addEvidence({
      investigationId: 'test-uuid',
      type: 'message',
      description: 'Late evidence',
      submittedById: 'user-1',
    })).rejects.toThrowError('Cannot add evidence')
  })

  it('should emit completed event on status transition to completed', async () => {
    vi.mocked(service['prisma'].investigation.findUnique).mockResolvedValue({
      id: 'test-uuid',
      status: 'ACTIVE',
    } as any)

    await service.transitionStatus('test-uuid', 'COMPLETED', 'user-1')

    expect(service['eventBus'].emit).toHaveBeenCalledWith('investigation:completed', { investigationId: 'test-uuid' })
  })
})
