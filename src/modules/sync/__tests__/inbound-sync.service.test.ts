import { InboundSyncService } from '../inbound-sync.service.js'

describe('InboundSyncService', () => {
  let service: InboundSyncService

  beforeEach(() => {
    service = new InboundSyncService()
  })

  describe('validate', () => {
    it('should return null for unsupported event type', () => {
      expect(service.validate('unknown:event', {})).toBeNull()
    })

    it('should reject ticket:assigned without required fields', () => {
      const err = service.validate('ticket:assigned', {})
      expect(err).toContain('Missing required field')
    })

    it('should pass ticket:assigned with all required fields', () => {
      const err = service.validate('ticket:assigned', { ticketId: 't1', assignedTo: 'u1', assignedBy: 'u2' })
      expect(err).toBeNull()
    })

    it('should reject ticket:escalated without escalatedTo', () => {
      const err = service.validate('ticket:escalated', { ticketId: 't1' })
      expect(err).toContain('escalatedTo')
    })

    it('should pass ticket:escalated with all required fields', () => {
      const err = service.validate('ticket:escalated', { ticketId: 't1', escalatedTo: 'u1', escalatedBy: 'u2' })
      expect(err).toBeNull()
    })

    it('should reject premium:approved without approvedBy', () => {
      const err = service.validate('premium:approved', { subscriptionId: 's1', userId: 'u1' })
      expect(err).toContain('approvedBy')
    })

    it('should pass premium:approved with all required fields', () => {
      const err = service.validate('premium:approved', { subscriptionId: 's1', userId: 'u1', approvedBy: 'u2' })
      expect(err).toBeNull()
    })

    it('should reject premium:rejected without rejectedBy', () => {
      const err = service.validate('premium:rejected', { subscriptionId: 's1', userId: 'u1' })
      expect(err).toContain('rejectedBy')
    })

    it('should pass premium:rejected with optional reason', () => {
      const err = service.validate('premium:rejected', { subscriptionId: 's1', userId: 'u1', rejectedBy: 'u2', reason: 'too expensive' })
      expect(err).toBeNull()
    })

    it('should reject security:alert without severity', () => {
      const err = service.validate('security:alert', { alertId: 'a1' })
      expect(err).toContain('severity')
    })

    it('should pass security:alert with minimal fields', () => {
      const err = service.validate('security:alert', { alertId: 'a1', severity: 'HIGH' })
      expect(err).toBeNull()
    })

    it('should reject approval:request:created without approverId', () => {
      const err = service.validate('approval:request:created', { requestId: 'r1' })
      expect(err).toContain('approverId')
    })

    it('should pass approval:request:created with all required fields', () => {
      const err = service.validate('approval:request:created', { requestId: 'r1', approverId: 'u1', resourceType: 'premium' })
      expect(err).toBeNull()
    })

    it('should reject staff:promoted without newRole', () => {
      const err = service.validate('staff:promoted', { staffId: 's1', userId: 'u1' })
      expect(err).toContain('newRole')
    })

    it('should pass staff:promoted with all required fields', () => {
      const err = service.validate('staff:promoted', { staffId: 's1', userId: 'u1', newRole: 'ADMIN' })
      expect(err).toBeNull()
    })

    it('should reject staff:suspended without userId', () => {
      const err = service.validate('staff:suspended', { staffId: 's1' })
      expect(err).toContain('userId')
    })

    it('should pass staff:suspended with all required fields', () => {
      const err = service.validate('staff:suspended', { staffId: 's1', userId: 'u1' })
      expect(err).toBeNull()
    })

    it('should reject department:transferred without toDepartment', () => {
      const err = service.validate('department:transferred', { departmentId: 'd1', staffId: 's1', userId: 'u1', fromDepartment: 'Eng' })
      expect(err).toContain('toDepartment')
    })

    it('should pass department:transferred with all required fields', () => {
      const err = service.validate('department:transferred', { departmentId: 'd1', staffId: 's1', userId: 'u1', fromDepartment: 'Eng', toDepartment: 'QA' })
      expect(err).toBeNull()
    })

    it('should reject security:incident:detected without incidentId', () => {
      const err = service.validate('security:incident:detected', { severity: 'HIGH' })
      expect(err).toContain('incidentId')
    })

    it('should pass security:incident:detected with all required fields', () => {
      const err = service.validate('security:incident:detected', { incidentId: 'i1', severity: 'CRITICAL' })
      expect(err).toBeNull()
    })

    it('should reject null/undefined values as missing', () => {
      const err = service.validate('ticket:assigned', { ticketId: 't1', assignedTo: null, assignedBy: 'u2' })
      expect(err).toContain('assignedTo')
    })

    it('should reject empty string values as missing', () => {
      const err = service.validate('ticket:assigned', { ticketId: 't1', assignedTo: '', assignedBy: 'u2' })
      expect(err).toContain('assignedTo')
    })
  })
})
