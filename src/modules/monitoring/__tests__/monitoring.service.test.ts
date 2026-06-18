import { MonitoringService } from '../monitoring.service.js'

describe('MonitoringService', () => {
  let service: MonitoringService

  beforeEach(() => {
    service = new MonitoringService()
  })

  describe('upsertService', () => {
    it('should throw ValidationError when name is missing', async () => {
      await expect(service.upsertService({
        name: null as any,
      })).rejects.toThrow()
    })
  })

  describe('getService', () => {
    it('should throw NotFoundError for non-existent service', async () => {
      await expect(service.getService('nonexistent')).rejects.toThrow()
    })
  })

  describe('acknowledgeAlert', () => {
    it('should throw NotFoundError for non-existent alert', async () => {
      await expect(service.acknowledgeAlert('nonexistent', 'user1')).rejects.toThrow()
    })
  })
})
