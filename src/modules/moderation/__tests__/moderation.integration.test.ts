import { describe, it, expect, vi } from 'vitest'
import { ModerationService } from '../moderation.service.js'
import { EventBus } from '../../../infrastructure/event-bus/event-bus.js'

describe('ModerationService Integration', () => {
  let service: ModerationService

  beforeEach(() => {
    service = new ModerationService()
  })

  describe('user:status:changed emission', () => {
    it('should emit user:status:changed on BAN action', async () => {
      const emit = vi.spyOn(EventBus.getInstance(), 'emit')

      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'mod-1' } as any)
      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'user-1', status: 'ACTIVE' } as any)
      vi.mocked(service['prisma'].moderationAction.create).mockResolvedValueOnce({
        id: 'action-1',
        actionType: 'BAN',
      } as any)
      vi.mocked(service['prisma'].user.update).mockResolvedValueOnce({ id: 'user-1', status: 'BANNED' } as any)

      await service.create({
        moderatorId: 'mod-1',
        targetId: 'user-1',
        actionType: 'BAN',
        reason: 'Test ban',
      })

      expect(emit).toHaveBeenCalledWith('user:status:changed', {
        userId: 'user-1',
        previousStatus: 'ACTIVE',
        newStatus: 'BANNED',
      })
    })

    it('should emit user:status:changed on UNBAN action', async () => {
      const emit = vi.spyOn(EventBus.getInstance(), 'emit')

      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'mod-1' } as any)
      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'user-1', status: 'BANNED' } as any)
      vi.mocked(service['prisma'].moderationAction.create).mockResolvedValueOnce({
        id: 'action-2',
        actionType: 'UNBAN',
      } as any)
      vi.mocked(service['prisma'].user.update).mockResolvedValueOnce({ id: 'user-1', status: 'ACTIVE' } as any)

      await service.create({
        moderatorId: 'mod-1',
        targetId: 'user-1',
        actionType: 'UNBAN',
        reason: 'Test unban',
      })

      expect(emit).toHaveBeenCalledWith('user:status:changed', {
        userId: 'user-1',
        previousStatus: 'BANNED',
        newStatus: 'ACTIVE',
      })
    })

    it('should emit user:status:changed on MUTE action', async () => {
      const emit = vi.spyOn(EventBus.getInstance(), 'emit')

      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'mod-1' } as any)
      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'user-1', status: 'ACTIVE' } as any)
      vi.mocked(service['prisma'].moderationAction.create).mockResolvedValueOnce({
        id: 'action-3',
        actionType: 'MUTE',
      } as any)
      vi.mocked(service['prisma'].user.update).mockResolvedValueOnce({ id: 'user-1', status: 'LIMITED' } as any)

      await service.create({
        moderatorId: 'mod-1',
        targetId: 'user-1',
        actionType: 'MUTE',
        reason: 'Test mute',
        duration: 60,
      })

      expect(emit).toHaveBeenCalledWith('user:status:changed', {
        userId: 'user-1',
        previousStatus: 'ACTIVE',
        newStatus: 'LIMITED',
      })
    })

    it('should emit user:status:changed on UNMUTE action', async () => {
      const emit = vi.spyOn(EventBus.getInstance(), 'emit')

      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'mod-1' } as any)
      vi.mocked(service['prisma'].user.findUnique).mockResolvedValueOnce({ id: 'user-1', status: 'LIMITED' } as any)
      vi.mocked(service['prisma'].moderationAction.create).mockResolvedValueOnce({
        id: 'action-4',
        actionType: 'UNMUTE',
      } as any)
      vi.mocked(service['prisma'].user.update).mockResolvedValueOnce({ id: 'user-1', status: 'ACTIVE' } as any)

      await service.create({
        moderatorId: 'mod-1',
        targetId: 'user-1',
        actionType: 'UNMUTE',
        reason: 'Test unmute',
      })

      expect(emit).toHaveBeenCalledWith('user:status:changed', {
        userId: 'user-1',
        previousStatus: 'LIMITED',
        newStatus: 'ACTIVE',
      })
    })
  })
})
