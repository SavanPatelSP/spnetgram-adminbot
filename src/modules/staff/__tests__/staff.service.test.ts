import { StaffService } from '../staff.service.js'

describe('StaffService', () => {
  let service: StaffService

  beforeEach(() => {
    service = new StaffService()
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent staff', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('findByUserId', () => {
    it('should return null for non-existent user', async () => {
      const result = await service.findByUserId('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('create', () => {
    it('should throw NotFoundError when user does not exist', async () => {
      await expect(service.create({ userId: 'nonexistent' })).rejects.toThrow()
    })
  })
})
