import { ApprovalsService } from '../approvals.service.js'

describe('ApprovalsService', () => {
  let service: ApprovalsService

  beforeEach(() => {
    service = new ApprovalsService()
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent request', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('createRequest', () => {
    it('should throw ValidationError when no steps provided', async () => {
      await expect(service.createRequest({
        title: 'Test',
        requesterId: 'user1',
        resourceType: 'staff',
        steps: [],
      })).rejects.toThrow()
    })
  })

  describe('findByReferenceId', () => {
    it('should throw NotFoundError for non-existent reference', async () => {
      await expect(service.findByReferenceId('NONEXISTENT')).rejects.toThrow()
    })
  })
})
