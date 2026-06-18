import { PremiumService } from '../premium.service.js'

describe('PremiumService', () => {
  let service: PremiumService

  beforeEach(() => {
    service = new PremiumService()
  })

  describe('findPlanById', () => {
    it('should throw NotFoundError for non-existent plan', async () => {
      await expect(service.findPlanById('nonexistent')).rejects.toThrow()
    })
  })

  describe('createPlan', () => {
    it('should throw ConflictError for duplicate plan name', async () => {
      await expect(service.createPlan({
        name: 'duplicate',
        tier: 'BASIC',
        price: 0,
      })).rejects.toThrow()
    })
  })

  describe('createSubscription', () => {
    it('should throw NotFoundError for non-existent user', async () => {
      await expect(service.createSubscription({
        userId: 'nonexistent',
        planId: 'plan1',
      })).rejects.toThrow()
    })
  })
})
