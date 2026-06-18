import { vi } from 'vitest'

function createModelStub() {
  return {
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
  }
}

const modelNames = [
  'user', 'staffMember', 'staffRoleAssignment', 'role', 'rolePermission',
  'permission', 'permissionOverride', 'specialAccessGrant', 'temporaryPermission',
  'sensitiveAction', 'moderationAction', 'case', 'caseAssignment', 'ticket',
  'ticketReply', 'investigation', 'investigationEvidence', 'sla',
  'auditLog', 'auditExport', 'notification', 'department', 'departmentStaff', 'departmentMembership',
  'premiumPlan', 'premiumSubscription', 'economyAccount', 'economyTransaction',
  'kpiDefinition', 'kpiRecord', 'kpiTarget', 'approvalRequest', 'approvalStep',
  'securityEvent', 'deviceSession', 'loginHistory', 'serviceStatus',
  'monitoringAlert', 'incident', 'incidentTimeline', 'incidentReport',
  'incidentRca', 'aiSummary', 'aiRecommendation', 'analyticsDashboard',
  'analyticsMetricRecord', 'syncEvent', 'deepLink',
]

const mockPrisma: Record<string, any> = {}
for (const m of modelNames) { mockPrisma[m] = createModelStub() }

vi.mock('./infrastructure/database/prisma.service.js', () => ({
  PrismaService: {
    getInstance: vi.fn().mockReturnValue({ client: mockPrisma }),
  },
}))

const mockRedisClient = {
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue('OK'),
  setex: vi.fn().mockResolvedValue('OK'),
  del: vi.fn().mockResolvedValue(1),
  incr: vi.fn().mockResolvedValue(1),
  expire: vi.fn().mockResolvedValue(1),
  ttl: vi.fn().mockResolvedValue(-1),
  smembers: vi.fn().mockResolvedValue([]),
  sadd: vi.fn().mockResolvedValue(1),
  keys: vi.fn().mockResolvedValue([]),
  quit: vi.fn().mockResolvedValue('OK'),
}

vi.mock('./infrastructure/redis/redis.service.js', () => ({
  RedisService: {
    getInstance: vi.fn().mockReturnValue({ client: mockRedisClient }),
  },
}))
