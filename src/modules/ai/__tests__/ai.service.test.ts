import { AiService } from '../ai.service.js'

describe('AiService', () => {
  let service: AiService

  beforeEach(() => {
    service = new AiService()
  })

  describe('getSummary', () => {
    it('should throw NotFoundError for non-existent summary', async () => {
      await expect(service.getSummary('nonexistent')).rejects.toThrow()
    })
  })

  describe('getRecommendation', () => {
    it('should throw NotFoundError for non-existent recommendation', async () => {
      await expect(service.getRecommendation('nonexistent')).rejects.toThrow()
    })
  })

  describe('createSummary', () => {
    it('should throw ValidationError for missing required fields', async () => {
      await expect(service.createSummary({
        targetType: '',
        targetId: '',
        summaryType: '',
        content: '',
      })).rejects.toThrow()
    })
  })

  describe('createRecommendation', () => {
    it('should throw ValidationError for missing required fields', async () => {
      await expect(service.createRecommendation({
        category: '',
        title: '',
      })).rejects.toThrow()
    })
  })
})
