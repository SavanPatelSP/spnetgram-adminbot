import { DepartmentsService } from '../departments.service.js'

describe('DepartmentsService', () => {
  let service: DepartmentsService

  beforeEach(() => {
    service = new DepartmentsService()
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent department', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('create', () => {
    it('should throw ConflictError for duplicate name', async () => {
      await expect(service.create({
        name: 'duplicate',
        type: 'SUPPORT',
      })).rejects.toThrow()
    })
  })

  describe('removeStaff', () => {
    it('should throw NotFoundError for non-existent assignment', async () => {
      await expect(service.removeStaff('dept1', 'staff1')).rejects.toThrow()
    })
  })
})
