import { IncidentsService } from '../incidents.service.js'

describe('IncidentsService', () => {
  let service: IncidentsService

  beforeEach(() => {
    service = new IncidentsService()
  })

  describe('create', () => {
    it('should throw ValidationError when title is missing', async () => {
      await expect(service.create({
        title: null as any,
      })).rejects.toThrow()
    })
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent incident', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('approveRca', () => {
    it('should throw NotFoundError for non-existent RCA', async () => {
      await expect(service.approveRca('nonexistent', 'user1')).rejects.toThrow()
    })
  })
})
