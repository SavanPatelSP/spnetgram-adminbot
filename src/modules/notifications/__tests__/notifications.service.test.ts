import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@infrastructure/database/prisma.service.js', () => ({
  PrismaService: {
    getInstance: vi.fn(() => ({
      client: {
        notification: {
          create: vi.fn(),
          findUnique: vi.fn(),
          findMany: vi.fn(),
          count: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
          delete: vi.fn(),
        },
        user: {
          findUnique: vi.fn(),
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

import { NotificationsService } from '../notifications.service.js'

describe('NotificationsService', () => {
  let service: NotificationsService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new NotificationsService()
  })

  it('should create a notification', async () => {
    const mockNotification = {
      id: 'test-uuid',
      userId: 'user-1',
      type: 'CASE_ASSIGNMENT' as const,
      title: 'Case Assigned',
      body: 'You have been assigned to case CASE-123',
      channel: 'IN_APP' as const,
      readAt: null,
      createdAt: new Date(),
    }
    vi.mocked(service['prisma'].notification.create).mockResolvedValue(mockNotification as any)

    const result = await service.create('user-1', 'CASE_ASSIGNMENT', 'Case Assigned', 'You have been assigned to case CASE-123')

    expect(result.title).toBe('Case Assigned')
    expect(service['eventBus'].emit).toHaveBeenCalledWith('notification:sent', expect.any(Object))
  })

  it('should throw NotFoundError for missing notification', async () => {
    vi.mocked(service['prisma'].notification.findUnique).mockResolvedValue(null)
    await expect(service.findById('nonexistent')).rejects.toThrowError('not found')
  })

  it('should mark a notification as read', async () => {
    const mockNotification = {
      id: 'test-uuid',
      userId: 'user-1',
      readAt: null,
    }
    vi.mocked(service['prisma'].notification.findUnique).mockResolvedValue(mockNotification as any)
    vi.mocked(service['prisma'].notification.update).mockResolvedValue({
      ...mockNotification,
      readAt: new Date(),
    } as any)

    const result = await service.markAsRead('test-uuid')
    expect(result.readAt).not.toBeNull()
  })

  it('should mark all notifications as read for user', async () => {
    vi.mocked(service['prisma'].notification.updateMany).mockResolvedValue({ count: 3 })

    const result = await service.markAllAsRead('user-1')
    expect(result.count).toBe(3)
  })

  it('should return unread count', async () => {
    vi.mocked(service['prisma'].notification.count).mockResolvedValue(5)

    const result = await service.getUnreadCount('user-1')
    expect(result.count).toBe(5)
    expect(result.userId).toBe('user-1')
  })
})
