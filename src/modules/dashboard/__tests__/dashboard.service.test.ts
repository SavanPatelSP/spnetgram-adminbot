import { DashboardService } from '../dashboard.service.js'

describe('DashboardService', () => {
  let service: DashboardService

  beforeEach(() => {
    service = new DashboardService()
  })

  describe('getStaffOverview', () => {
    it('should return staff overview with totals', async () => {
      const result = await service.getStaffOverview()
      expect(result).toHaveProperty('totalStaff')
      expect(result).toHaveProperty('activeStaff')
      expect(result).toHaveProperty('byRole')
      expect(result).toHaveProperty('byDepartment')
    })
  })

  describe('getModerationStats', () => {
    it('should return moderation stats', async () => {
      const result = await service.getModerationStats()
      expect(result).toHaveProperty('totalActions')
      expect(result).toHaveProperty('byType')
      expect(result).toHaveProperty('recentActions')
      expect(result).toHaveProperty('topModerators')
    })
  })

  describe('getTicketStats', () => {
    it('should return ticket stats', async () => {
      const result = await service.getTicketStats()
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('byStatus')
      expect(result).toHaveProperty('byPriority')
      expect(result).toHaveProperty('avgResolutionTime')
      expect(result).toHaveProperty('unassigned')
    })
  })

  describe('getCaseStats', () => {
    it('should return case stats', async () => {
      const result = await service.getCaseStats()
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('byStatus')
      expect(result).toHaveProperty('byPriority')
      expect(result).toHaveProperty('avgResolutionTime')
    })
  })

  describe('getKpiSummary', () => {
    it('should return KPI summary', async () => {
      const result = await service.getKpiSummary()
      expect(result).toHaveProperty('totalDefinitions')
      expect(result).toHaveProperty('totalRecords')
      expect(result).toHaveProperty('topPerformers')
      expect(result).toHaveProperty('departmentRankings')
    })
  })

  describe('getSecuritySummary', () => {
    it('should return security summary', async () => {
      const result = await service.getSecuritySummary()
      expect(result).toHaveProperty('totalEvents')
      expect(result).toHaveProperty('byType')
      expect(result).toHaveProperty('recentAlerts')
      expect(result).toHaveProperty('activeSessions')
    })
  })

  describe('getSystemHealth', () => {
    it('should return system health', async () => {
      const result = await service.getSystemHealth()
      expect(result).toHaveProperty('totalServices')
      expect(result).toHaveProperty('upCount')
      expect(result).toHaveProperty('downCount')
      expect(result).toHaveProperty('recentAlerts')
    })
  })

  describe('getAggregatedSnapshot', () => {
    it('should return aggregated data for requested types', async () => {
      const result = await service.getAggregatedSnapshot(['STAFF_OVERVIEW', 'SYSTEM_HEALTH'])
      expect(result).toHaveProperty('STAFF_OVERVIEW')
      expect(result).toHaveProperty('SYSTEM_HEALTH')
    })
  })
})
