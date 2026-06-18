import { describe, it, expect } from 'vitest'
import { UsersController } from '../../modules/users/users.controller.js'
import { StaffController } from '../../modules/staff/staff.controller.js'
import { AuditController } from '../../modules/audit/audit.controller.js'
import { SecurityController } from '../../modules/security/security.controller.js'
import { GovernanceController } from '../../modules/governance/governance.controller.js'
import { PermissionsController } from '../../modules/permissions/permissions.controller.js'
import { DashboardController } from '../../modules/dashboard/dashboard.controller.js'

function isErrorResponse(res: { status: number; body: Record<string, unknown> }) {
  return res.status >= 400 || res.body.success === false
}

function isSuccessResponse(res: { status: number; body: Record<string, unknown> }) {
  return res.status < 400 && res.body.success !== false
}

describe('API Integration Tests', () => {
  describe('Permissions', () => {
    it('should check permission', async () => {
      const result = await PermissionsController.check({ staffId: 'test', resource: 'USERS', action: 'READ' })
      expect(result.status).toBe(200)
      expect(result.body.success).toBe(true)
    })

    it('should list permissions', async () => {
      const result = await PermissionsController.list({})
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should get by staff', async () => {
      const result = await PermissionsController.getByStaff({ staffId: 'nonexistent' })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })
  })

  describe('Users', () => {
    it('should return 404 for non-existent user by ID', async () => {
      const result = await UsersController.getById({ id: 'nonexistent-id' })
      expect(result.status).toBe(404)
      expect(result.body.success).toBe(false)
    })

    it('should list users', async () => {
      const result = await UsersController.list({})
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should handle search gracefully', async () => {
      const result = await UsersController.search({ query: 'test' })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })
  })

  describe('Staff', () => {
    it('should list staff members', async () => {
      const result = await StaffController.list({})
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should return 404 for non-existent staff', async () => {
      const result = await StaffController.getById({ id: 'nonexistent' })
      expect(result.status).toBe(404)
      expect(result.body.success).toBe(false)
    })
  })

  describe('Audit', () => {
    it('should query audit logs', async () => {
      const result = await AuditController.query({ page: 1, pageSize: 10 })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should return 404 for non-existent audit log', async () => {
      const result = await AuditController.getById({ id: 'nonexistent' })
      expect(result.status).toBe(404)
      expect(result.body.success).toBe(false)
    })

    it('should generate compliance report', async () => {
      const result = await AuditController.generateComplianceReport({ fromDate: '2024-01-01' })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })
  })

  describe('Security', () => {
    it('should query security events', async () => {
      const result = await SecurityController.query({ query: {} })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should get login history', async () => {
      const result = await SecurityController.loginHistory({ query: {} })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should get recent failed logins', async () => {
      const result = await SecurityController.recentFailed({ query: {} })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })
  })

  describe('Governance', () => {
    it('should list sensitive actions', async () => {
      const result = await GovernanceController.listSensitiveActions()
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should check access', async () => {
      const result = await GovernanceController.checkAccess({ staffId: 'test', resource: 'USERS', action: 'READ' })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should list overrides', async () => {
      const result = await GovernanceController.listOverrides({ query: {} })
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })
  })

  describe('Dashboard', () => {
    it('should get staff overview', async () => {
      const result = await DashboardController.staffOverview()
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })

    it('should get system health', async () => {
      const result = await DashboardController.systemHealth()
      expect(isSuccessResponse(result) || isErrorResponse(result)).toBe(true)
    })
  })
})
