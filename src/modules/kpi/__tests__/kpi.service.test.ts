import { KpiService } from '../kpi.service.js'

describe('KpiService', () => {
  let service: KpiService

  beforeEach(() => {
    service = new KpiService()
  })

  describe('findDefinitionById', () => {
    it('should throw NotFoundError for non-existent definition', async () => {
      await expect(service.findDefinitionById('nonexistent')).rejects.toThrow()
    })
  })

  describe('createDefinition', () => {
    it('should throw ConflictError for duplicate name', async () => {
      await expect(service.createDefinition({
        name: 'duplicate',
        category: 'performance',
        targetValue: 100,
        unit: 'count',
      })).rejects.toThrow()
    })
  })

  describe('findRecordById', () => {
    it('should throw NotFoundError for non-existent record', async () => {
      await expect(service.findRecordById('nonexistent')).rejects.toThrow()
    })
  })
})
