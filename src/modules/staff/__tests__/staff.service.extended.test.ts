import { describe, it, expect, vi, beforeEach } from 'vitest'
import { StaffService } from '../staff.service.js'

describe('StaffService Extended', () => {
  let service: StaffService

  beforeEach(() => {
    service = new StaffService()
  })

  describe('findById', () => {
    it('should throw NotFoundError for non-existent staff', async () => {
      await expect(service.findById('nonexistent')).rejects.toThrow()
    })
  })

  describe('findByUserId', () => {
    it('should return null for non-existent user', async () => {
      const result = await service.findByUserId('nonexistent')
      expect(result).toBeNull()
    })
  })

  describe('list', () => {
    it('should return an array', async () => {
      const result = await service.list({})
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('create', () => {
    it('should throw when creating with non-existent user', async () => {
      await expect(service.create({
        userId: 'nonexistent',
        role: 'STAFF',
        departmentId: 'dept1',
        invitedBy: 'admin',
      } as any)).rejects.toThrow()
    })
  })
})
