import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@infrastructure/database/prisma.service.js', () => ({
  PrismaService: {
    getInstance: vi.fn(() => ({
      client: {
        ticket: {
          create: vi.fn(),
          findUnique: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          update: vi.fn(),
        },
        ticketReply: {
          create: vi.fn(),
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

import { TicketsService } from '../tickets.service.js'

describe('TicketsService', () => {
  let service: TicketsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new TicketsService()
  })

  it('should create a ticket', async () => {
    const mockTicket = {
      id: 'test-uuid',
      referenceId: 'TKT-TEST-UUID',
      subject: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      status: 'open',
      reporterId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    vi.mocked(service['prisma'].ticket.create).mockResolvedValue(mockTicket)

    const result = await service.create({
      subject: 'Test Ticket',
      description: 'Test Description',
      priority: 'medium',
      reporterId: 'user-1',
    })

    expect(result.subject).toBe('Test Ticket')
    expect(service['eventBus'].emit).toHaveBeenCalledWith('ticket:created', expect.any(Object))
  })

  it('should throw NotFoundError for missing ticket', async () => {
    vi.mocked(service['prisma'].ticket.findUnique).mockResolvedValue(null)
    await expect(service.findById('nonexistent')).rejects.toThrowError('not found')
  })

  it('should reject invalid status transition', async () => {
    vi.mocked(service['prisma'].ticket.findUnique).mockResolvedValue({
      id: 'test-uuid',
      status: 'closed',
    } as any)

    await expect(service.transitionStatus('test-uuid', 'open', 'user-1')).rejects.toThrowError('Invalid ticket status transition')
  })

  it('should add a reply to a ticket', async () => {
    vi.mocked(service['prisma'].ticket.findUnique).mockResolvedValue({
      id: 'test-uuid',
      reporterId: 'user-1',
      status: 'in_progress',
    } as any)

    const mockReply = {
      id: 'reply-uuid',
      ticketId: 'test-uuid',
      userId: 'user-2',
      content: 'Reply content',
      attachments: [],
      createdAt: new Date(),
    }
    vi.mocked(service['prisma'].ticketReply.create).mockResolvedValue(mockReply)

    const result = await service.addReply({
      ticketId: 'test-uuid',
      userId: 'user-2',
      content: 'Reply content',
    })

    expect(result.content).toBe('Reply content')
    expect(service['eventBus'].emit).toHaveBeenCalledWith('ticket:replied', expect.any(Object))
  })
})
