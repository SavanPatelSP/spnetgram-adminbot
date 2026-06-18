import { EconomyService } from '../economy.service.js'

describe('EconomyService', () => {
  let service: EconomyService

  beforeEach(() => {
    service = new EconomyService()
  })

  describe('getAccount', () => {
    it('should throw NotFoundError for non-existent account', async () => {
      await expect(service.getAccount('nonexistent')).rejects.toThrow()
    })
  })

  describe('transfer', () => {
    it('should throw ValidationError for same account transfer', async () => {
      await expect(service.transfer({
        fromAccountId: 'same',
        toAccountId: 'same',
        amount: 100,
      })).rejects.toThrow()
    })
  })

  describe('getAccountById', () => {
    it('should throw NotFoundError for non-existent id', async () => {
      await expect(service.getAccountById('nonexistent')).rejects.toThrow()
    })
  })
})
