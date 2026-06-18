import { DeepLinkService } from '../deeplinks.service.js'

describe('DeepLinkService', () => {
  let service: DeepLinkService

  beforeEach(() => {
    service = new DeepLinkService()
  })

  describe('getLink', () => {
    it('should throw NotFoundError for non-existent deep link', async () => {
      await expect(service.getLink('nonexistent')).rejects.toThrow()
    })
  })

  describe('getLinkByCode', () => {
    it('should throw NotFoundError for non-existent code', async () => {
      await expect(service.getLinkByCode('badcode')).rejects.toThrow()
    })
  })

  describe('resolveLink', () => {
    it('should throw NotFoundError for non-existent code', async () => {
      await expect(service.resolveLink('badcode')).rejects.toThrow()
    })
  })

  describe('deactivateLink', () => {
    it('should throw NotFoundError for non-existent deep link', async () => {
      await expect(service.deactivateLink('nonexistent')).rejects.toThrow()
    })
  })
})
