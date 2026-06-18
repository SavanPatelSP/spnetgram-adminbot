import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GovernanceService } from '../governance.service.js'

describe('GovernanceService', () => {
  let service: GovernanceService

  beforeEach(() => {
    service = new GovernanceService()
  })

  describe('getRoleHierarchy', () => {
    it('should return role priority map', () => {
      const hierarchy = service.getRoleHierarchy()
      expect(hierarchy.OWNER).toBeGreaterThan(hierarchy.STAFF)
      expect(hierarchy.SUPER_ADMINISTRATOR).toBeGreaterThan(hierarchy.HELPER)
    })
  })

  describe('checkHierarchy', () => {
    it('should validate senior outranks junior', async () => {
      const result = await service.checkHierarchy('OWNER', 'STAFF')
      expect(result.valid).toBe(true)
    })

    it('should reject junior outranking senior', async () => {
      const result = await service.checkHierarchy('STAFF', 'OWNER')
      expect(result.valid).toBe(false)
    })

    it('should reject unknown roles', async () => {
      const result = await service.checkHierarchy('UNKNOWN', 'STAFF')
      expect(result.valid).toBe(false)
    })
  })

  describe('listSensitiveActions', () => {
    it('should return an array', async () => {
      const result = await service.listSensitiveActions()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('processExpiredPermissions', () => {
    it('should return a result object', async () => {
      const result = await service.processExpiredPermissions()
      expect(result).toHaveProperty('revokedCount')
      expect(result).toHaveProperty('processedAt')
    })
  })
})
