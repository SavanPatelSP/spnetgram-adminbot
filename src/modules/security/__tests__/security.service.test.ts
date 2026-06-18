import { SecurityService } from '../security.service.js'

describe('SecurityService', () => {
  let service: SecurityService

  beforeEach(() => {
    service = new SecurityService()
  })

  describe('recordEvent', () => {
    it('should throw ValidationError when eventType is missing', async () => {
      await expect(service.recordEvent({
        eventType: null as any,
        severity: 'HIGH',
      })).rejects.toThrow()
    })
  })

  describe('getEventById', () => {
    it('should throw NotFoundError for non-existent event', async () => {
      await expect(service.getEventById('nonexistent')).rejects.toThrow()
    })
  })

  describe('deactivateDeviceSession', () => {
    it('should throw NotFoundError for non-existent session', async () => {
      await expect(service.deactivateDeviceSession('nonexistent')).rejects.toThrow()
    })
  })
})
