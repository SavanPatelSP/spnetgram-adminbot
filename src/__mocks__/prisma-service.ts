import { vi } from 'vitest'

function createDbStub() {
  const modelStub = () => ({
    findUnique: vi.fn().mockResolvedValue(null),
    findUniqueOrThrow: vi.fn().mockRejectedValue(new Error('Not found')),
    findMany: vi.fn().mockResolvedValue([]),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockRejectedValue(new Error('No database: use a real DB or mock this call')),
    update: vi.fn().mockRejectedValue(new Error('No database: use a real DB or mock this call')),
    upsert: vi.fn().mockRejectedValue(new Error('No database: use a real DB or mock this call')),
    delete: vi.fn().mockRejectedValue(new Error('No database: use a real DB or mock this call')),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue({}),
    groupBy: vi.fn().mockResolvedValue([]),
    findRaw: vi.fn().mockResolvedValue({}),
    aggregateRaw: vi.fn().mockResolvedValue({}),
  })

  const models = [
    'user', 'staffMember', 'staffRoleAssignment', 'role', 'rolePermission',
    'permission', 'permissionOverride', 'specialAccessGrant', 'temporaryPermission',
    'sensitiveAction', 'moderationAction', 'case', 'caseAssignment', 'ticket',
    'ticketReply', 'investigation', 'investigationEvidence', 'sla',
    'auditLog', 'auditExport', 'notification', 'department', 'departmentMembership',
    'premiumPlan', 'premiumSubscription', 'economyAccount', 'economyTransaction',
    'kpiDefinition', 'kpiRecord', 'kpiTarget', 'approvalRequest', 'approvalStep',
    'securityEvent', 'deviceSession', 'loginHistory', 'serviceStatus',
    'monitoringAlert', 'incident', 'incidentTimeline', 'incidentReport',
    'incidentRca', 'aiSummary', 'aiRecommendation', 'analyticsDashboard',
    'analyticsMetricRecord', 'syncEvent', 'deepLink',
  ]

  const db: Record<string, any> = {}
  for (const m of models) { db[m] = modelStub() }
  return db as any
}

export function mockPrismaService() {
  const mockDb = createDbStub()
  vi.mock('../../infrastructure/database/prisma.service.js', () => ({
    PrismaService: {
      getInstance: vi.fn().mockReturnValue({ client: mockDb }),
    },
  }))
  return mockDb
}
