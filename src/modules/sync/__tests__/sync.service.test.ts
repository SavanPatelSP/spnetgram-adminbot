import { SyncService } from '../sync.service.js'

describe('SyncService', () => {
  let service: SyncService

  beforeEach(() => {
    service = new SyncService()
  })

  describe('getEvent', () => {
    it('should throw NotFoundError for non-existent event', async () => {
      await expect(service.getEvent('nonexistent')).rejects.toThrow()
    })
  })

  describe('markProcessed', () => {
    it('should throw NotFoundError for non-existent event', async () => {
      await expect(service.markProcessed('nonexistent')).rejects.toThrow()
    })
  })

  describe('markFailed', () => {
    it('should throw NotFoundError for non-existent event', async () => {
      await expect(service.markFailed('nonexistent', 'error')).rejects.toThrow()
    })
  })
})
