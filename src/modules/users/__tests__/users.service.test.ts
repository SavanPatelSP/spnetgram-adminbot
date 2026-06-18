import { UsersService } from '../users.service.js'

describe('UsersService', () => {
  let service: UsersService

  beforeEach(() => {
    service = new UsersService()
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent user', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('findByTelegramId', () => {
    it('should return null for non-existent telegram id', async () => {
      const result = await service.findByTelegramId(-1n)
      expect(result).toBeNull()
    })
  })

  describe('upsertByTelegram', () => {
    it('should create a new user from telegram data', async () => {
      vi.mocked(service['prisma'].user.upsert).mockResolvedValue({
        id: 'new-user-id',
        telegramId: 12345n,
        telegramUsername: 'test_user',
        firstName: 'Test',
        lastName: 'User',
        languageCode: 'en',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      const user = await service.upsertByTelegram({
        telegramId: 12345n,
        telegramUsername: 'test_user',
        firstName: 'Test',
        lastName: 'User',
        languageCode: 'en',
      })
      expect(user).toHaveProperty('id')
      expect(user.telegramId).toBe(12345n)
    })
  })
})
