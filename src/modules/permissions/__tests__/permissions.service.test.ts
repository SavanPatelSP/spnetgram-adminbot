import { PermissionsService } from '../permissions.service.js'

describe('PermissionsService', () => {
  let service: PermissionsService

  beforeEach(() => {
    service = new PermissionsService()
  })

  describe('findByStaffId', () => {
    it('should throw NotFoundError for non-existent staff', async () => {
      await expect(service.findByStaffId('nonexistent')).rejects.toThrow()
    })
  })

  describe('grant', () => {
    it('should throw NotFoundError when staff does not exist', async () => {
      await expect(
        service.grant({
          staffId: 'nonexistent',
          resource: 'USERS',
          action: 'READ',
        }),
      ).rejects.toThrow()
    })
  })

  describe('check', () => {
    it('should return false for non-existent permission', async () => {
      const result = await service.check('nonexistent', 'USERS', 'READ')
      expect(result).toBe(false)
    })
  })
})
