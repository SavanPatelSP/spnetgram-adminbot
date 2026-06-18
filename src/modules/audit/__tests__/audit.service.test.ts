import { AuditService } from '../audit.service.js'

describe('AuditService', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
  })

  describe('create', () => {
    it('should create an audit log entry', async () => {
      vi.mocked(service['prisma'].auditLog.create).mockResolvedValue({
        id: 'test-id',
        staffId: null,
        actorId: null,
        targetId: null,
        action: 'TEST',
        resource: 'USERS',
        resourceId: null,
        reason: null,
        description: 'Test audit entry',
        beforeState: null,
        afterState: null,
        metadata: null,
        ipAddress: null,
        userAgent: null,
        result: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      const log = await service.create({
        action: 'TEST',
        resource: 'USERS',
        description: 'Test audit entry',
      })
      expect(log).toHaveProperty('id')
      expect(log.action).toBe('TEST')
    })
  })

  describe('findById', () => {
    it('should return null for non-existent log', async () => {
      const log = await service.findById('nonexistent')
      expect(log).toBeNull()
    })
  })

  describe('query', () => {
    it('should return paginated results', async () => {
      const result = await service.query({ page: 1, pageSize: 10 })
      expect(result).toHaveProperty('logs')
      expect(result).toHaveProperty('total')
      expect(result.page).toBe(1)
      expect(result.pageSize).toBe(10)
    })
  })

  describe('findByResource', () => {
    it('should return empty array for unknown resource', async () => {
      const logs = await service.findByResource('UNKNOWN', 'nonexistent')
      expect(logs).toEqual([])
    })
  })
})
