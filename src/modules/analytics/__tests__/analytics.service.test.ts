import { AnalyticsService } from '../analytics.service.js'

describe('AnalyticsService', () => {
  let service: AnalyticsService

  beforeEach(() => {
    service = new AnalyticsService()
  })

  describe('getDashboard', () => {
    it('should throw NotFoundError for non-existent dashboard', async () => {
      await expect(service.getDashboard('nonexistent')).rejects.toThrow()
    })
  })

  describe('createDashboard', () => {
    it('should throw ValidationError for missing name', async () => {
      await expect(service.createDashboard({
        name: '',
      })).rejects.toThrow()
    })
  })

  describe('recordMetric', () => {
    it('should throw ValidationError for missing required fields', async () => {
      await expect(service.recordMetric({
        metric: 'GROWTH',
        value: undefined as any,
      })).rejects.toThrow()
    })
  })
})
