import { createServer as createHttpServer, type Server, type IncomingMessage, type ServerResponse } from 'node:http'
import jwt from 'jsonwebtoken'
import { env } from '../infrastructure/config/env.js'
import { logger } from '../infrastructure/logger/logger.js'
import { authGuard } from './middleware/auth-guard.js'
import { requirePermission } from './middleware/permission-guard.js'
import { errorHandler } from './middleware/error-handler.js'
import { auditMiddleware } from './middleware/audit-logger.js'
import { correlationIdMiddleware } from '../infrastructure/middleware/correlation-id.js'
import { AuthService } from '../infrastructure/auth/auth.service.js'
import { AppError } from '../shared/errors/index.js'
import { metricsCollector } from '../infrastructure/metrics/metrics-collector.js'
import { HealthService } from '../infrastructure/health/health.service.js'

const authService = new AuthService()

import { UsersController } from '../modules/users/users.controller.js'
import { StaffController } from '../modules/staff/staff.controller.js'
import { PermissionsController } from '../modules/permissions/permissions.controller.js'
import { ModerationController } from '../modules/moderation/moderation.controller.js'
import { CasesController } from '../modules/cases/cases.controller.js'
import { TicketsController } from '../modules/tickets/tickets.controller.js'
import { InvestigationsController } from '../modules/investigations/investigations.controller.js'
import { SlaController } from '../modules/sla/sla.controller.js'
import { AuditController } from '../modules/audit/audit.controller.js'
import { NotificationsController } from '../modules/notifications/notifications.controller.js'
import { DepartmentsController } from '../modules/departments/departments.controller.js'
import { PremiumController } from '../modules/premium/premium.controller.js'
import { EconomyController } from '../modules/economy/economy.controller.js'
import { KpiController } from '../modules/kpi/kpi.controller.js'
import { ApprovalsController } from '../modules/approvals/approvals.controller.js'
import { SecurityController } from '../modules/security/security.controller.js'
import { MonitoringController } from '../modules/monitoring/monitoring.controller.js'
import { IncidentsController } from '../modules/incidents/incidents.controller.js'
import { AiController } from '../modules/ai/ai.controller.js'
import { AnalyticsController } from '../modules/analytics/analytics.controller.js'
import { SyncController } from '../modules/sync/sync.controller.js'
import { DeepLinkController } from '../modules/deeplinks/deeplinks.controller.js'
import { DashboardController } from '../modules/dashboard/dashboard.controller.js'
import { GovernanceController } from '../modules/governance/governance.controller.js'

type RouteHandler = (req: IncomingMessage, res: ServerResponse, params: Record<string, string>, body: unknown) => void | Promise<void>

interface Route {
  method: string
  pattern: RegExp
  paramNames: string[]
  handler: RouteHandler
  requireAuth: boolean
}

function withPermission(resource: string, action: string, handler: RouteHandler): RouteHandler {
  return async (req, res, params, body) => {
    const guard = requirePermission(resource, action)
    const allowed = await guard(req, res)
    if (!allowed) return
    return handler(req, res, params, body)
  }
}

function compilePattern(path: string): { regex: RegExp; names: string[] } {
  const names: string[] = []
  const regexStr = path.replace(/:(\w+)/g, (_, name) => {
    names.push(name)
    return '([^/]+)'
  })
  return { regex: new RegExp(`^${regexStr}$`), names }
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      if (chunks.length === 0) return resolve(null)
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString()))
      } catch {
        resolve(null)
      }
    })
  })
}

export function createServer(): Server {
  const routes: Route[] = []

  function get(path: string, handler: RouteHandler, requireAuth = true) {
    const { regex, names } = compilePattern(path)
    routes.push({ method: 'GET', pattern: regex, paramNames: names, handler, requireAuth })
  }
  function post(path: string, handler: RouteHandler, requireAuth = true) {
    const { regex, names } = compilePattern(path)
    routes.push({ method: 'POST', pattern: regex, paramNames: names, handler, requireAuth })
  }
  function put(path: string, handler: RouteHandler, requireAuth = true) {
    const { regex, names } = compilePattern(path)
    routes.push({ method: 'PUT', pattern: regex, paramNames: names, handler, requireAuth })
  }
  function del(path: string, handler: RouteHandler, requireAuth = true) {
    const { regex, names } = compilePattern(path)
    routes.push({ method: 'DELETE', pattern: regex, paramNames: names, handler, requireAuth })
  }

  const healthService = new HealthService()

  get('/health', async (_req, res) => {
    const health = await healthService.check()
    res.statusCode = health.status === 'unhealthy' ? 503 : 200
    res.end(JSON.stringify(health))
  }, false)

  get('/health/live', async (_req, res) => {
    const alive = await healthService.checkLiveness()
    res.statusCode = alive ? 200 : 503
    res.end(JSON.stringify({ status: alive ? 'alive' : 'dead' }))
  }, false)

  get('/health/ready', async (_req, res) => {
    const ready = await healthService.checkReadiness()
    res.statusCode = ready ? 200 : 503
    res.end(JSON.stringify({ status: ready ? 'ready' : 'not ready' }))
  }, false)

  // Auth - generate token pair
  post('/api/auth/login', async (req, res, p, body) => {
    try {
      const { staffId } = body as any
      const fingerprint = authService.computeFingerprint(
        req.socket.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown',
      )
      const tokens = authService.generateTokenPair(
        { sub: staffId, staffId, role: 'STAFF' },
        fingerprint,
      )
      await authService.storeRefreshToken(
        jwt.decode(tokens.refreshToken) as any,
        staffId,
      )
      res.statusCode = 200
      res.end(JSON.stringify({ success: true, data: tokens }))
    } catch (err) {
      res.statusCode = 401
      res.end(JSON.stringify({ error: 'Authentication failed', code: 'AUTH_FAILED' }))
    }
  }, false),

  // Auth - refresh token
  post('/api/auth/refresh', async (req, res, p, body) => {
    try {
      const { refreshToken } = body as any
      const decoded = authService.verifyToken(refreshToken)
      if (decoded.type !== 'refresh') {
        res.statusCode = 401
        res.end(JSON.stringify({ error: 'Invalid token type', code: 'TOKEN_TYPE_ERROR' }))
        return
      }
      const valid = await authService.validateRefreshToken(decoded.jti!, decoded.sub)
      if (!valid) {
        res.statusCode = 401
        res.end(JSON.stringify({ error: 'Refresh token revoked', code: 'TOKEN_REVOKED' }))
        return
      }
      await authService.revokeRefreshToken(decoded.jti!)
      const fingerprint = authService.computeFingerprint(
        req.socket.remoteAddress || 'unknown',
        req.headers['user-agent'] || 'unknown',
      )
      const tokens = authService.generateTokenPair(
        { sub: decoded.sub, staffId: decoded.staffId, role: decoded.role },
        fingerprint,
      )
      const newDecoded = jwt.decode(tokens.refreshToken) as any
      await authService.storeRefreshToken(newDecoded.jti, decoded.sub)
      res.statusCode = 200
      res.end(JSON.stringify({ success: true, data: tokens }))
    } catch (err) {
      res.statusCode = 401
      res.end(JSON.stringify({ error: 'Invalid refresh token', code: 'INVALID_REFRESH' }))
    }
  }, false),

  // Auth - logout (invalidate session)
  post('/api/auth/logout', async (req, res) => {
    const jti = (req as any).tokenJti
    if (jti) {
      await authService.blacklistToken(jti, 900)
    }
    res.statusCode = 200
    res.end(JSON.stringify({ success: true }))
  }),

  // Auth - revoke all sessions
  post('/api/auth/revoke-all', async (req, res) => {
    const staffId = (req as any).staffId
    if (staffId) {
      await authService.revokeAllUserSessions(staffId)
    }
    res.statusCode = 200
    res.end(JSON.stringify({ success: true }))
  }),

  // Users
  get('/api/users', async (req, res) => handleController(req, res, UsersController.list, { ids: (req as any).query?.ids }))
  get('/api/users/search', async (req, res) => handleController(req, res, UsersController.search, { query: (req as any).query?.q }))
  get('/api/users/:id', async (_req, res, p) => handleController(_req, res, UsersController.getById, { id: p.id }))
  get('/api/users/telegram/:telegramId', async (_req, res, p) => handleController(_req, res, UsersController.getByTelegramId, { telegramId: BigInt(p.telegramId) }))
  post('/api/users', withPermission('USERS', 'CREATE', async (req, res, _p, body) => handleController(req, res, UsersController.upsert, body as any)))
  put('/api/users/:id/status', withPermission('USERS', 'UPDATE', async (req, res, p, body) => handleController(req, res, UsersController.updateStatus, { id: p.id, status: (body as any)?.status })))
  put('/api/users/:id/intelligence', withPermission('USERS', 'UPDATE', async (req, res, p, body) => handleController(req, res, UsersController.updateIntelligence, { id: p.id, ...(body as any) })))

  // Staff
  get('/api/staff', async (req, res) => handleController(req, res, StaffController.list, { isActive: (req as any).query?.isActive }))
  get('/api/staff/:id', async (_req, res, p) => handleController(_req, res, StaffController.getById, { id: p.id }))
  get('/api/staff/user/:userId', async (_req, res, p) => handleController(_req, res, StaffController.getByUserId, { userId: p.userId }))
  post('/api/staff', withPermission('STAFF', 'CREATE', async (req, res, _p, body) => handleController(req, res, StaffController.create, body as any)))
  put('/api/staff/:id', withPermission('STAFF', 'UPDATE', async (req, res, p, body) => handleController(req, res, StaffController.update, { id: p.id, ...(body as any) })))
  post('/api/staff/:id/role', withPermission('STAFF', 'UPDATE', async (req, res, p, body) => handleController(req, res, StaffController.assignRole, { id: p.id, role: (body as any)?.role })))
  post('/api/staff/:id/activate', withPermission('STAFF', 'UPDATE', async (_req, res, p) => handleController(_req, res, StaffController.activate, { id: p.id })))
  post('/api/staff/:id/deactivate', withPermission('STAFF', 'UPDATE', async (_req, res, p) => handleController(_req, res, StaffController.deactivate, { id: p.id })))

  // Permissions
  get('/api/permissions/staff/:staffId', async (_req, res, p) => handleController(_req, res, PermissionsController.getByStaff, { staffId: p.staffId }))
  get('/api/permissions/check', async (req, res) => {
    const q = (req as any).query || {}
    return handleController(req, res, PermissionsController.check, { staffId: q.staffId, resource: q.resource, action: q.action })
  })
  post('/api/permissions/grant', withPermission('PERMISSIONS', 'GRANT', async (req, res, _p, body) => handleController(req, res, PermissionsController.grant, body as any)))
  post('/api/permissions/revoke', withPermission('PERMISSIONS', 'REVOKE', async (req, res, _p, body) => handleController(req, res, PermissionsController.revoke, body as any)))
  get('/api/permissions', async (req, res) => handleController(req, res, PermissionsController.list, (req as any).query || {}))
  post('/api/permissions/assign-role', withPermission('STAFF', 'UPDATE', async (req, res, _p, body) => handleController(req, res, PermissionsController.assignRoleToStaff, body as any)))
  post('/api/permissions/remove-role', withPermission('STAFF', 'UPDATE', async (req, res, _p, body) => handleController(req, res, PermissionsController.removeRoleFromStaff, body as any)))

  // Moderation
  get('/api/moderation/:id', async (_req, res, p) => handleController(_req, res, ModerationController.getById, { id: p.id }))
  get('/api/moderation/target/:targetId', async (_req, res, p) => handleController(_req, res, ModerationController.listByTarget, { targetId: p.targetId }))
  get('/api/moderation/moderator/:moderatorId', async (_req, res, p) => handleController(_req, res, ModerationController.listByModerator, { moderatorId: p.moderatorId }))
  get('/api/moderation/target/:targetId/summary', async (_req, res, p) => handleController(_req, res, ModerationController.getTargetSummary, { targetId: p.targetId }))
  post('/api/moderation', withPermission('MODERATION', 'CREATE', async (req, res, _p, body) => handleController(req, res, ModerationController.create, body as any)))

  // Cases
  get('/api/cases', async (req, res) => handleController(req, res, CasesController.list, { query: (req as any).query || {} }))
  get('/api/cases/:id', async (_req, res, p) => handleController(_req, res, CasesController.getById, { params: { id: p.id } }))
  post('/api/cases', withPermission('CASES', 'CREATE', async (req, res, _p, body) => handleController(req, res, CasesController.create, { body })))
  put('/api/cases/:id', withPermission('CASES', 'UPDATE', async (req, res, p, body) => handleController(req, res, CasesController.update, { params: { id: p.id }, body })))
  post('/api/cases/:id/assign', withPermission('CASES', 'UPDATE', async (req, res, p, body) => handleController(req, res, CasesController.assign, { body: { caseId: p.id, ...(body as any) } })))
  post('/api/cases/:id/transition', withPermission('CASES', 'UPDATE', async (req, res, p, body) => handleController(req, res, CasesController.transitionStatus, { body: { caseId: p.id, ...(body as any) } })))

  // Tickets
  get('/api/tickets', async (req, res) => handleController(req, res, TicketsController.list, { query: (req as any).query || {} }))
  get('/api/tickets/:id', async (_req, res, p) => handleController(_req, res, TicketsController.getById, { params: { id: p.id } }))
  post('/api/tickets', withPermission('TICKETS', 'CREATE', async (req, res, _p, body) => handleController(req, res, TicketsController.create, { body })))
  put('/api/tickets/:id', withPermission('TICKETS', 'UPDATE', async (req, res, p, body) => handleController(req, res, TicketsController.update, { params: { id: p.id }, body })))
  post('/api/tickets/:id/assign', withPermission('TICKETS', 'UPDATE', async (req, res, p, body) => handleController(req, res, TicketsController.assign, { body: { ticketId: p.id, ...(body as any) } })))
  post('/api/tickets/:id/transition', withPermission('TICKETS', 'UPDATE', async (req, res, p, body) => handleController(req, res, TicketsController.transitionStatus, { body: { ticketId: p.id, ...(body as any) } })))
  post('/api/tickets/:id/reply', withPermission('TICKETS', 'UPDATE', async (req, res, p, body) => handleController(req, res, TicketsController.addReply, { body: { ...(body as any), ticketId: p.id } })))

  // Investigations
  get('/api/investigations', async (req, res) => handleController(req, res, InvestigationsController.list, { query: (req as any).query || {} }))
  get('/api/investigations/:id', async (_req, res, p) => handleController(_req, res, InvestigationsController.getById, { params: { id: p.id } }))
  post('/api/investigations', withPermission('INVESTIGATIONS', 'CREATE', async (req, res, _p, body) => handleController(req, res, InvestigationsController.create, { body })))
  put('/api/investigations/:id', withPermission('INVESTIGATIONS', 'UPDATE', async (req, res, p, body) => handleController(req, res, InvestigationsController.update, { params: { id: p.id }, body })))
  post('/api/investigations/:id/transition', withPermission('INVESTIGATIONS', 'UPDATE', async (req, res, p, body) => handleController(req, res, InvestigationsController.transitionStatus, { body: { investigationId: p.id, ...(body as any) } })))
  post('/api/investigations/:id/assign', withPermission('INVESTIGATIONS', 'UPDATE', async (req, res, p, body) => handleController(req, res, InvestigationsController.assign, { body: { investigationId: p.id, ...(body as any) } })))
  post('/api/investigations/:id/evidence', withPermission('INVESTIGATIONS', 'UPDATE', async (req, res, p, body) => handleController(req, res, InvestigationsController.addEvidence, { body: { ...(body as any), investigationId: p.id } })))
  del('/api/investigations/:investigationId/evidence/:evidenceId', withPermission('INVESTIGATIONS', 'DELETE', async (req, res, p) => handleController(req, res, InvestigationsController.removeEvidence, { params: { investigationId: p.investigationId, evidenceId: p.evidenceId } })))
  get('/api/investigations/:investigationId/evidence', async (_req, res, p) => handleController(_req, res, InvestigationsController.getEvidence, { params: { investigationId: p.investigationId } }))

  // SLA
  get('/api/sla', async (req, res) => handleController(req, res, SlaController.listActiveSlas, { query: (req as any).query || {} }))
  get('/api/sla/:id', async (_req, res, p) => handleController(_req, res, SlaController.getSla, { params: { id: p.id } }))
  post('/api/sla', withPermission('SLA', 'CREATE', async (req, res, _p, body) => handleController(req, res, SlaController.startSla, { body })))
  post('/api/sla/check-breaches', withPermission('SLA', 'UPDATE', async (_req, res) => handleController(_req, res, SlaController.checkBreaches, {})))
  post('/api/sla/:id/resolve', withPermission('SLA', 'UPDATE', async (_req, res, p) => handleController(_req, res, SlaController.resolveSla, { params: { id: p.id } })))
  get('/api/sla/target/:targetType/:targetId', async (_req, res, p) => handleController(_req, res, SlaController.getSlasByTarget, { params: { targetType: p.targetType, targetId: p.targetId } }))
  get('/api/sla/target/:targetType/:targetId/compliance', async (_req, res, p) => handleController(_req, res, SlaController.getCompliance, { params: { targetType: p.targetType, targetId: p.targetId } }))

  // Audit
  get('/api/audit', async (req, res) => handleController(req, res, AuditController.query, (req as any).query || {}))
  get('/api/audit/:id', async (_req, res, p) => handleController(_req, res, AuditController.getById, { id: p.id }))
  get('/api/audit/staff/:staffId', async (_req, res, p) => handleController(_req, res, AuditController.findByStaff, { staffId: p.staffId }))
  get('/api/audit/actor/:actorId', async (_req, res, p) => handleController(_req, res, AuditController.findByActor, { actorId: p.actorId }))
  get('/api/audit/target/:targetId', async (_req, res, p) => handleController(_req, res, AuditController.findByTarget, { targetId: p.targetId }))
  get('/api/audit/resource/:resource/:resourceId', async (_req, res, p) => handleController(_req, res, AuditController.findByResource, { resource: p.resource, resourceId: p.resourceId }))

  // Audit - Enhanced
  get('/api/audit/compliance-report', async (req, res) => handleController(req, res, AuditController.generateComplianceReport, { query: (req as any).query || {} }))
  post('/api/audit/export', withPermission('AUDIT', 'EXPORT', async (req, res, _p, body) => handleController(req, res, AuditController.exportLogs, body as any)))
  get('/api/audit/export/:id', async (_req, res, p) => handleController(_req, res, AuditController.getExportStatus, { id: p.id }))

  // Notifications
  get('/api/notifications/user/:userId', async (req, res, p) => handleController(req, res, NotificationsController.listByUser, { params: { userId: p.userId }, query: (req as any).query || {} }))
  get('/api/notifications/:id', async (_req, res, p) => handleController(_req, res, NotificationsController.getById, { params: { id: p.id } }))
  post('/api/notifications', withPermission('NOTIFICATIONS', 'CREATE', async (req, res, _p, body) => handleController(req, res, NotificationsController.create, { body })))
  post('/api/notifications/:id/read', withPermission('NOTIFICATIONS', 'UPDATE', async (_req, res, p) => handleController(_req, res, NotificationsController.markAsRead, { params: { id: p.id } })))
  post('/api/notifications/user/:userId/read-all', withPermission('NOTIFICATIONS', 'UPDATE', async (_req, res, p) => handleController(_req, res, NotificationsController.markAllAsRead, { params: { userId: p.userId } })))
  get('/api/notifications/user/:userId/unread-count', async (_req, res, p) => handleController(_req, res, NotificationsController.getUnreadCount, { params: { userId: p.userId } }))
  del('/api/notifications/:id', withPermission('NOTIFICATIONS', 'DELETE', async (req, res, p) => handleController(req, res, NotificationsController.delete, { params: { id: p.id } })))

  // Departments
  get('/api/departments', async (req, res) => handleController(req, res, DepartmentsController.list, { query: (req as any).query || {} }))
  get('/api/departments/:id', async (_req, res, p) => handleController(_req, res, DepartmentsController.getById, { params: { id: p.id } }))
  get('/api/departments/:id/staff', async (_req, res, p) => handleController(_req, res, DepartmentsController.getStaff, { params: { id: p.id } }))
  post('/api/departments', withPermission('DEPARTMENTS', 'CREATE', async (req, res, _p, body) => handleController(req, res, DepartmentsController.create, { body })))
  put('/api/departments/:id', withPermission('DEPARTMENTS', 'UPDATE', async (req, res, p, body) => handleController(req, res, DepartmentsController.update, { params: { id: p.id }, body })))
  post('/api/departments/staff', withPermission('DEPARTMENTS', 'UPDATE', async (req, res, _p, body) => handleController(req, res, DepartmentsController.addStaff, { body })))
  del('/api/departments/:departmentId/staff/:staffId', withPermission('DEPARTMENTS', 'DELETE', async (req, res, p) => handleController(req, res, DepartmentsController.removeStaff, { params: { departmentId: p.departmentId, staffId: p.staffId } })))

  // Premium
  get('/api/premium/plans', async (req, res) => handleController(req, res, PremiumController.listPlans, { query: (req as any).query || {} }))
  get('/api/premium/plans/:id', async (_req, res, p) => handleController(_req, res, PremiumController.getPlan, { params: { id: p.id } }))
  post('/api/premium/plans', withPermission('PREMIUM', 'CREATE', async (req, res, _p, body) => handleController(req, res, PremiumController.createPlan, { body })))
  put('/api/premium/plans/:id', withPermission('PREMIUM', 'UPDATE', async (req, res, p, body) => handleController(req, res, PremiumController.updatePlan, { params: { id: p.id }, body })))
  get('/api/premium/subscriptions', async (req, res) => handleController(req, res, PremiumController.listSubscriptions, { query: (req as any).query || {} }))
  get('/api/premium/subscriptions/:id', async (_req, res, p) => handleController(_req, res, PremiumController.getSubscription, { params: { id: p.id } }))
  post('/api/premium/subscriptions', withPermission('PREMIUM', 'CREATE', async (req, res, _p, body) => handleController(req, res, PremiumController.createSubscription, { body })))
  post('/api/premium/subscriptions/:id/cancel', withPermission('PREMIUM', 'UPDATE', async (_req, res, p) => handleController(_req, res, PremiumController.cancelSubscription, { params: { id: p.id } })))
  get('/api/premium/check/:userId/:feature', async (_req, res, p) => handleController(_req, res, PremiumController.checkFeature, { params: { userId: p.userId, feature: p.feature } }))
  post('/api/premium/expire', withPermission('PREMIUM', 'UPDATE', async (_req, res) => handleController(_req, res, PremiumController.expireSubscriptions, {})))

  // Economy
  post('/api/economy/accounts/:userId', withPermission('ECONOMY', 'CREATE', async (_req, res, p) => handleController(_req, res, EconomyController.ensureAccount, { params: { userId: p.userId } })))
  get('/api/economy/accounts/:userId', async (_req, res, p) => handleController(_req, res, EconomyController.getAccount, { params: { userId: p.userId } }))
  get('/api/economy/accounts/id/:id', async (_req, res, p) => handleController(_req, res, EconomyController.getAccountById, { params: { id: p.id } }))
  get('/api/economy/accounts/:userId/balance', async (_req, res, p) => handleController(_req, res, EconomyController.getBalance, { params: { userId: p.userId } }))
  get('/api/economy/accounts/:accountId/transactions', async (req, res, p) => handleController(req, res, EconomyController.listTransactions, { params: { accountId: p.accountId }, query: (req as any).query || {} }))
  post('/api/economy/transactions', withPermission('ECONOMY', 'CREATE', async (req, res, _p, body) => handleController(req, res, EconomyController.createTransaction, { body })))
  post('/api/economy/transfer', withPermission('ECONOMY', 'CREATE', async (req, res, _p, body) => handleController(req, res, EconomyController.transfer, { body })))
  post('/api/economy/accounts/:id/freeze', withPermission('ECONOMY', 'UPDATE', async (_req, res, p) => handleController(_req, res, EconomyController.freezeAccount, { params: { id: p.id } })))
  post('/api/economy/accounts/:id/unfreeze', withPermission('ECONOMY', 'UPDATE', async (_req, res, p) => handleController(_req, res, EconomyController.unfreezeAccount, { params: { id: p.id } })))

  // KPI
  get('/api/kpi/definitions', async (req, res) => handleController(req, res, KpiController.listDefinitions, { query: (req as any).query || {} }))
  get('/api/kpi/definitions/:id', async (_req, res, p) => handleController(_req, res, KpiController.getDefinition, { params: { id: p.id } }))
  post('/api/kpi/definitions', withPermission('KPI', 'CREATE', async (req, res, _p, body) => handleController(req, res, KpiController.createDefinition, { body })))
  put('/api/kpi/definitions/:id', withPermission('KPI', 'UPDATE', async (req, res, p, body) => handleController(req, res, KpiController.updateDefinition, { params: { id: p.id }, body })))
  get('/api/kpi/records', async (req, res) => handleController(req, res, KpiController.listRecords, { query: (req as any).query || {} }))
  get('/api/kpi/records/:id', async (_req, res, p) => handleController(_req, res, KpiController.getRecord, { params: { id: p.id } }))
  post('/api/kpi/records', withPermission('KPI', 'CREATE', async (req, res, _p, body) => handleController(req, res, KpiController.createRecord, { body })))
  get('/api/kpi/targets', async (req, res) => handleController(req, res, KpiController.listTargets, { query: (req as any).query || {} }))
  post('/api/kpi/targets', withPermission('KPI', 'CREATE', async (req, res, _p, body) => handleController(req, res, KpiController.createTarget, { body })))
  get('/api/kpi/staff/:staffId/summary', async (_req, res, p) => handleController(_req, res, KpiController.getStaffSummary, { params: { staffId: p.staffId } }))

  // Approvals
  get('/api/approvals', async (req, res) => handleController(req, res, ApprovalsController.list, { query: (req as any).query || {} }))
  get('/api/approvals/:id', async (_req, res, p) => handleController(_req, res, ApprovalsController.getById, { params: { id: p.id } }))
  get('/api/approvals/reference/:referenceId', async (_req, res, p) => handleController(_req, res, ApprovalsController.getByReference, { params: { referenceId: p.referenceId } }))
  get('/api/approvals/pending/:userId', async (_req, res, p) => handleController(_req, res, ApprovalsController.getPendingForApprover, { params: { userId: p.userId } }))
  post('/api/approvals', withPermission('APPROVALS', 'CREATE', async (req, res, _p, body) => handleController(req, res, ApprovalsController.createRequest, { body })))
  post('/api/approvals/:id/cancel', withPermission('APPROVALS', 'UPDATE', async (req, res, p, body) => handleController(req, res, ApprovalsController.cancelRequest, { params: { id: p.id }, body })))
  post('/api/approvals/steps/approve', withPermission('APPROVALS', 'APPROVE', async (req, res, _p, body) => handleController(req, res, ApprovalsController.approveStep, { body })))
  post('/api/approvals/steps/reject', withPermission('APPROVALS', 'REJECT', async (req, res, _p, body) => handleController(req, res, ApprovalsController.rejectStep, { body })))
  post('/api/approvals/steps/request-info', withPermission('APPROVALS', 'UPDATE', async (req, res, _p, body) => handleController(req, res, ApprovalsController.requestInfo, { body })))

  // Security
  post('/api/security/events', withPermission('SECURITY', 'CREATE', async (req, res, _p, body) => handleController(req, res, SecurityController.record, { body })))
  get('/api/security/events', async (req, res) => handleController(req, res, SecurityController.query, { query: (req as any).query || {} }))
  get('/api/security/events/:id', async (_req, res, p) => handleController(_req, res, SecurityController.getById, { params: { id: p.id } }))
  post('/api/security/devices', withPermission('SECURITY', 'CREATE', async (req, res, _p, body) => handleController(req, res, SecurityController.registerDevice, { body })))
  post('/api/security/devices/:id/deactivate', withPermission('SECURITY', 'UPDATE', async (_req, res, p) => handleController(_req, res, SecurityController.deactivateDevice, { params: { id: p.id } })))
  get('/api/security/devices/user/:userId', async (_req, res, p) => handleController(_req, res, SecurityController.listSessions, { params: { userId: p.userId } }))
  post('/api/security/login-history', withPermission('SECURITY', 'CREATE', async (req, res, _p, body) => handleController(req, res, SecurityController.recordLogin, { body })))
  get('/api/security/login-history', async (req, res) => handleController(req, res, SecurityController.loginHistory, { query: (req as any).query || {} }))
  get('/api/security/login-history/recent-failed', async (_req, res) => handleController(_req, res, SecurityController.recentFailed, {}))

  // Monitoring
  post('/api/monitoring/services', withPermission('MONITORING', 'CREATE', async (req, res, _p, body) => handleController(req, res, MonitoringController.upsertService, { body })))
  get('/api/monitoring/services', async (req, res) => handleController(req, res, MonitoringController.listServices, { query: (req as any).query || {} }))
  get('/api/monitoring/services/:id', async (_req, res, p) => handleController(_req, res, MonitoringController.getService, { params: { id: p.id } }))
  put('/api/monitoring/services/:id/status', withPermission('MONITORING', 'UPDATE', async (req, res, p, body) => handleController(req, res, MonitoringController.updateStatus, { params: { id: p.id }, body })))
  get('/api/monitoring/services/status/:status', async (_req, res, p) => handleController(_req, res, MonitoringController.byStatus, { params: { status: p.status } }))
  post('/api/monitoring/alerts', withPermission('MONITORING', 'CREATE', async (req, res, _p, body) => handleController(req, res, MonitoringController.triggerAlert, { body })))
  get('/api/monitoring/alerts', async (req, res) => handleController(req, res, MonitoringController.listAlerts, { query: (req as any).query || {} }))
  get('/api/monitoring/alerts/:id', async (_req, res, p) => handleController(_req, res, MonitoringController.getAlert, { params: { id: p.id } }))
  post('/api/monitoring/alerts/:id/acknowledge', withPermission('MONITORING', 'UPDATE', async (req, res, p, body) => handleController(req, res, MonitoringController.acknowledgeAlert, { params: { id: p.id }, body })))

  // Incidents
  post('/api/incidents', withPermission('INCIDENTS', 'CREATE', async (req, res, _p, body) => handleController(req, res, IncidentsController.create, { body })))
  get('/api/incidents', async (req, res) => handleController(req, res, IncidentsController.list, { query: (req as any).query || {} }))
  get('/api/incidents/:id', async (_req, res, p) => handleController(_req, res, IncidentsController.getById, { params: { id: p.id } }))
  put('/api/incidents/:id', withPermission('INCIDENTS', 'UPDATE', async (req, res, p, body) => handleController(req, res, IncidentsController.update, { params: { id: p.id }, body })))
  post('/api/incidents/:id/resolve', withPermission('INCIDENTS', 'UPDATE', async (_req, res, p) => handleController(_req, res, IncidentsController.resolve, { params: { id: p.id } })))
  post('/api/incidents/:id/timeline', withPermission('INCIDENTS', 'UPDATE', async (req, res, p, body) => handleController(req, res, IncidentsController.addTimeline, { params: { id: p.id }, body })))
  get('/api/incidents/:id/timeline', async (_req, res, p) => handleController(_req, res, IncidentsController.getTimeline, { params: { id: p.id } }))
  post('/api/incidents/:id/reports', withPermission('INCIDENTS', 'UPDATE', async (req, res, p, body) => handleController(req, res, IncidentsController.createReport, { params: { id: p.id }, body })))
  get('/api/incidents/:id/reports', async (_req, res, p) => handleController(_req, res, IncidentsController.getReports, { params: { id: p.id } }))
  get('/api/incidents/reports/:reportId', async (_req, res, p) => handleController(_req, res, IncidentsController.getReport, { params: { reportId: p.reportId } }))
  post('/api/incidents/:id/rca', withPermission('INCIDENTS', 'UPDATE', async (req, res, p, body) => handleController(req, res, IncidentsController.createRca, { params: { id: p.id }, body })))
  get('/api/incidents/:id/rca', async (_req, res, p) => handleController(_req, res, IncidentsController.getRca, { params: { id: p.id } }))
  post('/api/incidents/rca/:rcaId/approve', withPermission('INCIDENTS', 'UPDATE', async (req, res, p, body) => handleController(req, res, IncidentsController.approveRca, { params: { rcaId: p.rcaId }, body })))

  // AI Operations
  post('/api/ai/summaries', withPermission('AI', 'CREATE', async (req, res, _p, body) => handleController(req, res, AiController.createSummary, { body })))
  get('/api/ai/summaries', async (req, res) => handleController(req, res, AiController.querySummaries, { query: (req as any).query || {} }))
  get('/api/ai/summaries/:id', async (_req, res, p) => handleController(_req, res, AiController.getSummary, { params: { id: p.id } }))
  get('/api/ai/summaries/target/:targetType/:targetId', async (_req, res, p) => handleController(_req, res, AiController.byTarget, { params: { targetType: p.targetType, targetId: p.targetId } }))
  post('/api/ai/recommendations', withPermission('AI', 'CREATE', async (req, res, _p, body) => handleController(req, res, AiController.createRecommendation, { body })))
  get('/api/ai/recommendations', async (req, res) => handleController(req, res, AiController.list, { query: (req as any).query || {} }))
  get('/api/ai/recommendations/:id', async (_req, res, p) => handleController(_req, res, AiController.getRecommendation, { params: { id: p.id } }))
  post('/api/ai/recommendations/:id/apply', withPermission('AI', 'UPDATE', async (req, res, p, body) => handleController(req, res, AiController.apply, { params: { id: p.id }, body })))
  post('/api/ai/recommendations/:id/dismiss', withPermission('AI', 'UPDATE', async (_req, res, p) => handleController(_req, res, AiController.dismiss, { params: { id: p.id } })))

  // Analytics
  post('/api/analytics/metrics', withPermission('ANALYTICS', 'CREATE', async (req, res, _p, body) => handleController(req, res, AnalyticsController.recordMetric, { body })))
  get('/api/analytics/metrics', async (req, res) => handleController(req, res, AnalyticsController.queryMetrics, { query: (req as any).query || {} }))
  get('/api/analytics/metrics/aggregation/:metric', async (req, res, p) => handleController(req, res, AnalyticsController.aggregation, { params: { metric: p.metric }, query: (req as any).query || {} }))
  post('/api/analytics/dashboards', withPermission('ANALYTICS', 'CREATE', async (req, res, _p, body) => handleController(req, res, AnalyticsController.createDashboard, { body })))
  get('/api/analytics/dashboards', async (req, res) => handleController(req, res, AnalyticsController.listDashboards, { query: (req as any).query || {} }))
  get('/api/analytics/dashboards/:id', async (_req, res, p) => handleController(_req, res, AnalyticsController.getDashboard, { params: { id: p.id } }))
  put('/api/analytics/dashboards/:id', withPermission('ANALYTICS', 'UPDATE', async (req, res, p, body) => handleController(req, res, AnalyticsController.updateDashboard, { params: { id: p.id }, body })))
  del('/api/analytics/dashboards/:id', withPermission('ANALYTICS', 'DELETE', async (_req, res, p) => handleController(_req, res, AnalyticsController.deleteDashboard, { params: { id: p.id } })))
  post('/api/analytics/dashboards/:id/set-default', withPermission('ANALYTICS', 'UPDATE', async (req, res, p, body) => handleController(req, res, AnalyticsController.setDefault, { params: { id: p.id }, body })))

  // Sync
  post('/api/sync/events', withPermission('SYNC', 'CREATE', async (req, res, _p, body) => handleController(req, res, SyncController.createEvent, { body })))
  get('/api/sync/events', async (req, res) => handleController(req, res, SyncController.list, { query: (req as any).query || {} }))
  get('/api/sync/events/:id', async (_req, res, p) => handleController(_req, res, SyncController.getEvent, { params: { id: p.id } }))
  put('/api/sync/events/:id', withPermission('SYNC', 'UPDATE', async (req, res, p, body) => handleController(req, res, SyncController.update, { params: { id: p.id }, body })))
  post('/api/sync/events/:id/processed', withPermission('SYNC', 'UPDATE', async (_req, res, p) => handleController(_req, res, SyncController.markProcessed, { params: { id: p.id } })))
  post('/api/sync/events/:id/failed', withPermission('SYNC', 'UPDATE', async (req, res, p, body) => handleController(req, res, SyncController.markFailed, { params: { id: p.id }, body })))
  get('/api/sync/events/pending', async (_req, res) => handleController(_req, res, SyncController.pendingEvents, {}))
  get('/api/sync/events/failed', async (req, res) => handleController(req, res, SyncController.failedEvents, { query: (req as any).query || {} }))

  // Deep Links
  post('/api/deeplinks', withPermission('DEEPLINKS', 'CREATE', async (req, res, _p, body) => handleController(req, res, DeepLinkController.createLink, { body })))
  get('/api/deeplinks', async (req, res) => handleController(req, res, DeepLinkController.listLinks, { query: (req as any).query || {} }))
  get('/api/deeplinks/:id', async (_req, res, p) => handleController(_req, res, DeepLinkController.getLink, { params: { id: p.id } }))
  get('/api/deeplinks/code/:code', async (_req, res, p) => handleController(_req, res, DeepLinkController.getByCode, { params: { code: p.code } }))
  post('/api/deeplinks/resolve/:code', withPermission('DEEPLINKS', 'READ', async (_req, res, p) => handleController(_req, res, DeepLinkController.resolve, { params: { code: p.code } })))
  post('/api/deeplinks/:id/deactivate', withPermission('DEEPLINKS', 'UPDATE', async (_req, res, p) => handleController(_req, res, DeepLinkController.deactivate, { params: { id: p.id } })))

  // Dashboard
  get('/api/dashboard/staff-overview', async (_req, res) => handleController(_req, res, DashboardController.staffOverview, {}))
  get('/api/dashboard/moderation-stats', async (req, res) => handleController(req, res, DashboardController.moderationStats, { query: (req as any).query || {} }))
  get('/api/dashboard/ticket-stats', async (req, res) => handleController(req, res, DashboardController.ticketStats, { query: (req as any).query || {} }))
  get('/api/dashboard/case-stats', async (req, res) => handleController(req, res, DashboardController.caseStats, { query: (req as any).query || {} }))
  get('/api/dashboard/kpi-summary', async (_req, res) => handleController(_req, res, DashboardController.kpiSummary, {}))
  get('/api/dashboard/security-summary', async (_req, res) => handleController(_req, res, DashboardController.securitySummary, {}))
  get('/api/dashboard/system-health', async (_req, res) => handleController(_req, res, DashboardController.systemHealth, {}))
  get('/api/dashboard/snapshot', async (req, res) => handleController(req, res, DashboardController.snapshot, { query: (req as any).query || {} }))

  // Governance
  post('/api/governance/check-access', withPermission('GOVERNANCE', 'READ', async (req, res, _p, body) => handleController(req, res, GovernanceController.checkAccess, body as any)))
  post('/api/governance/temporary-permissions', withPermission('GOVERNANCE', 'CREATE', async (req, res, _p, body) => handleController(req, res, GovernanceController.grantTemporaryPermission, body as any)))
  del('/api/governance/temporary-permissions/:id', withPermission('GOVERNANCE', 'DELETE', async (_req, res, p) => handleController(_req, res, GovernanceController.revokeTemporaryPermission, { id: p.id })))
  post('/api/governance/overrides', withPermission('GOVERNANCE', 'CREATE', async (req, res, _p, body) => handleController(req, res, GovernanceController.grantOverride, body as any)))
  del('/api/governance/overrides', withPermission('GOVERNANCE', 'DELETE', async (req, res, _p, body) => handleController(req, res, GovernanceController.revokeOverride, body as any)))
  post('/api/governance/special-access', withPermission('GOVERNANCE', 'CREATE', async (req, res, _p, body) => handleController(req, res, GovernanceController.grantSpecialAccess, body as any)))
  del('/api/governance/special-access/:id', withPermission('GOVERNANCE', 'DELETE', async (_req, res, p) => handleController(_req, res, GovernanceController.revokeSpecialAccess, { id: p.id })))
  get('/api/governance/overrides', async (req, res) => handleController(req, res, GovernanceController.listOverrides, { query: (req as any).query || {} }))
  get('/api/governance/temporary-permissions', async (req, res) => handleController(req, res, GovernanceController.listTemporaryPermissions, { query: (req as any).query || {} }))
  post('/api/governance/sensitive-actions', withPermission('GOVERNANCE', 'CREATE', async (req, res, _p, body) => handleController(req, res, GovernanceController.configureSensitiveAction, body as any)))
  get('/api/governance/sensitive-actions', async (_req, res) => handleController(_req, res, GovernanceController.listSensitiveActions, {}))
  post('/api/governance/validate-sensitive-action', withPermission('GOVERNANCE', 'READ', async (req, res, _p, body) => handleController(req, res, GovernanceController.validateSensitiveAction, body as any)))
  post('/api/governance/audit-exports', withPermission('GOVERNANCE', 'CREATE', async (req, res, _p, body) => handleController(req, res, GovernanceController.createAuditExport, body as any)))
  get('/api/governance/audit-exports/:id', async (_req, res, p) => handleController(_req, res, GovernanceController.getAuditExport, { id: p.id }))
  post('/api/governance/process-expired', withPermission('GOVERNANCE', 'UPDATE', async (_req, res) => handleController(_req, res, GovernanceController.processExpired, {})))

  async function handleController(req: IncomingMessage, res: ServerResponse, controller: Function, args: any) {
    const start = performance.now()
    const url = req.url || '/'
    try {
      const result = await controller(args)
      if (result && typeof result === 'object' && 'status' in result) {
        res.statusCode = result.status as number
        res.end(JSON.stringify(result.body ?? {}))
      }
    } catch (err) {
      errorHandler(err as Error, req, res)
    }
    const duration = performance.now() - start
    metricsCollector.recordHttpRequest({
      method: req.method || 'GET',
      path: url,
      statusCode: res.statusCode,
      duration,
    })
  }

  const server = createHttpServer(async (req, res) => {
    const start = Date.now()
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
    const method = req.method?.toUpperCase() || 'GET'

    res.setHeader('Content-Type', 'application/json')

    auditMiddleware(req, res)
    correlationIdMiddleware(req, res)

    const query: Record<string, string> = {}
    url.searchParams.forEach((v, k) => { query[k] = v })
    ;(req as any).query = query

    for (const route of routes) {
      if (route.method !== method) continue
      const match = url.pathname.match(route.pattern)
      if (!match) continue

      const params: Record<string, string> = {}
      route.paramNames.forEach((name, i) => { params[name] = decodeURIComponent(match[i + 1]) })

      if (route.requireAuth && !(await authGuard(req, res, params))) return

      const body = method === 'POST' || method === 'PUT' || method === 'PATCH' ? await readBody(req) : null

      try {
        await route.handler(req, res, params, body)
      } catch (err) {
        errorHandler(err as Error, req, res)
      }

      const duration = Date.now() - start
      logger.info({ method, path: url.pathname, status: res.statusCode, duration })
      return
    }

    res.statusCode = 404
    res.end(JSON.stringify({ error: 'Not Found', code: 'NOT_FOUND' }))
    logger.info({ method, path: url.pathname, status: 404, duration: Date.now() - start })
  })

  return server
}

export async function startServer(): Promise<Server> {
  const server = createServer()
  return new Promise((resolve) => {
    server.listen(env.PORT, env.HOST, () => {
      logger.info(`API server listening on ${env.HOST}:${env.PORT}`)
      resolve(server)
    })
  })
}
