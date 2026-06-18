import { BotNotificationDispatcher } from '../bot-notification-dispatcher.js'

describe('BotNotificationDispatcher', () => {
  let dispatcher: BotNotificationDispatcher

  beforeEach(() => {
    dispatcher = new BotNotificationDispatcher()
  })

  describe('buildDispatchInfo', () => {
    it('should return null for unknown event type', () => {
      expect(dispatcher.buildDispatchInfo('unknown:event', {})).toBeNull()
    })

    it('should build ticket:assigned notification', () => {
      const info = dispatcher.buildDispatchInfo('ticket:assigned', { ticketId: 'T-1', assignedTo: 'user-1', assignedBy: 'admin-1' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('TICKET_ASSIGNED')
      expect(info!.category).toBe('TICKET')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.title).toBe('Ticket Assigned')
      expect(info!.body).toContain('T-1')
      expect(info!.body).toContain('admin-1')
    })

    it('should build ticket:escalated notification', () => {
      const info = dispatcher.buildDispatchInfo('ticket:escalated', { ticketId: 'T-2', escalatedTo: 'user-2', escalatedBy: 'admin-1' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('TICKET_ESCALATED')
      expect(info!.targetUserId).toBe('user-2')
      expect(info!.body).toContain('T-2')
      expect(info!.body).toContain('admin-1')
    })

    it('should build premium:approved notification', () => {
      const info = dispatcher.buildDispatchInfo('premium:approved', { subscriptionId: 'sub-1', userId: 'user-1', approvedBy: 'admin-1' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('PREMIUM_APPROVAL')
      expect(info!.category).toBe('PREMIUM')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.body).toContain('sub-1')
    })

    it('should build premium:rejected notification with reason', () => {
      const info = dispatcher.buildDispatchInfo('premium:rejected', { subscriptionId: 'sub-2', userId: 'user-2', rejectedBy: 'admin-1', reason: 'no' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('PREMIUM_APPROVAL')
      expect(info!.targetUserId).toBe('user-2')
      expect(info!.body).toContain('no')
    })

    it('should build premium:rejected notification without reason', () => {
      const info = dispatcher.buildDispatchInfo('premium:rejected', { subscriptionId: 'sub-3', userId: 'user-3', rejectedBy: 'admin-1' })
      expect(info).not.toBeNull()
      expect(info!.body).not.toContain('undefined')
    })

    it('should build security:alert notification', () => {
      const info = dispatcher.buildDispatchInfo('security:alert', { alertId: 'a-1', severity: 'HIGH', userId: 'user-1', message: 'Suspicious login' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('SECURITY_ALERT')
      expect(info!.category).toBe('SECURITY')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.title).toContain('HIGH')
      expect(info!.body).toContain('Suspicious login')
    })

    it('should build security:alert with staffId fallback', () => {
      const info = dispatcher.buildDispatchInfo('security:alert', { alertId: 'a-2', severity: 'LOW', staffId: 'staff-1' })
      expect(info).not.toBeNull()
      expect(info!.targetUserId).toBe('staff-1')
    })

    it('should build security:incident:detected notification', () => {
      const info = dispatcher.buildDispatchInfo('security:incident:detected', { incidentId: 'i-1', severity: 'CRITICAL', userId: 'user-1' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('SECURITY_ALERT')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.title).toContain('CRITICAL')
    })

    it('should build security:case:created notification', () => {
      const info = dispatcher.buildDispatchInfo('security:case:created', { eventId: 'e-1', caseId: 'c-1', userId: 'user-1' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('SECURITY_ALERT')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.body).toContain('c-1')
    })

    it('should build approval:request:created notification', () => {
      const info = dispatcher.buildDispatchInfo('approval:request:created', { requestId: 'r-1', approverId: 'user-1', resourceType: 'premium', resourceId: 'sub-1' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('APPROVAL_REQUEST')
      expect(info!.category).toBe('SYSTEM')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.body).toContain('premium')
    })

    it('should build staff:promoted notification', () => {
      const info = dispatcher.buildDispatchInfo('staff:promoted', { staffId: 's-1', userId: 'user-1', newRole: 'ADMIN', previousRole: 'MOD' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('STAFF_PROMOTION')
      expect(info!.category).toBe('STAFF')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.title).toBe('You Have Been Promoted')
      expect(info!.body).toContain('ADMIN')
      expect(info!.body).toContain('MOD')
    })

    it('should build staff:promoted without previousRole', () => {
      const info = dispatcher.buildDispatchInfo('staff:promoted', { staffId: 's-2', userId: 'user-2', newRole: 'ADMIN' })
      expect(info).not.toBeNull()
      expect(info!.body).toContain('ADMIN')
      expect(info!.body).not.toContain('undefined')
    })

    it('should build staff:suspended notification', () => {
      const info = dispatcher.buildDispatchInfo('staff:suspended', { staffId: 's-1', userId: 'user-1', reason: 'Violation' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('STAFF_SUSPENSION')
      expect(info!.category).toBe('STAFF')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.body).toContain('Violation')
    })

    it('should build staff:suspended without reason', () => {
      const info = dispatcher.buildDispatchInfo('staff:suspended', { staffId: 's-2', userId: 'user-2' })
      expect(info).not.toBeNull()
      expect(info!.body).not.toContain('undefined')
    })

    it('should build department:transferred notification', () => {
      const info = dispatcher.buildDispatchInfo('department:transferred', { departmentId: 'd-1', staffId: 's-1', userId: 'user-1', fromDepartment: 'Engineering', toDepartment: 'QA' })
      expect(info).not.toBeNull()
      expect(info!.type).toBe('STAFF_DEPARTMENT_TRANSFER')
      expect(info!.category).toBe('STAFF')
      expect(info!.targetUserId).toBe('user-1')
      expect(info!.body).toContain('Engineering')
      expect(info!.body).toContain('QA')
    })
  })
})
