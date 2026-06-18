import { ModerationService } from '../moderation.service.js'

describe('ModerationService', () => {
  let service: ModerationService

  beforeEach(() => {
    service = new ModerationService()
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent action', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('create', () => {
    it('should throw ValidationError when moderator targets themselves', async () => {
      vi.mocked(service['prisma'].user.findUnique).mockImplementation(({ where }: any) =>
        Promise.resolve(where.id === 'same-id' ? { id: 'same-id' } as any : null),
      )
      await expect(
        service.create({
          moderatorId: 'same-id',
          targetId: 'same-id',
          actionType: 'WARN',
        }),
      ).rejects.toThrow('cannot act on themselves')
    })

    it('should throw NotFoundError for non-existent moderator', async () => {
      await expect(
        service.create({
          moderatorId: 'nonexistent',
          targetId: 'target-id',
          actionType: 'WARN',
        }),
      ).rejects.toThrow()
    })
  })

  describe('getTargetSummary', () => {
    it('should return summary with zero actions for unknown target', async () => {
      const summary = await service.getTargetSummary('unknown')
      expect(summary.totalActions).toBe(0)
    })
  })
})
