import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { logger } from '@infrastructure/logger/logger.js'
import { env } from '@infrastructure/config/env.js'
import { SyncService } from './sync.service.js'
import { InboundSyncService } from './inbound-sync.service.js'

const MAX_RETRIES = 3
const IDEMPOTENCY_WINDOW_MS = 5 * 60 * 1000
const PROCESS_INTERVAL_MS = 30_000

export class SyncProcessor {
  private eventBus = EventBus.getInstance()
  private prisma = PrismaService.getInstance().client
  private syncService = new SyncService()
  private intervalHandle: ReturnType<typeof setInterval> | null = null
  private processing = false
  private eventHandlers: Array<{ event: string; handler: (...args: any[]) => void }> = []

  private syncOriginEvents = new Set<string>()

  start(): void {
    logger.info('SyncProcessor started — registering event consumers')
    this.registerConsumers()
    this.intervalHandle = setInterval(() => this.processBatch(), PROCESS_INTERVAL_MS)
    setImmediate(() => this.processBatch())
  }

  stop(): void {
    logger.info('SyncProcessor stopping')
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle)
      this.intervalHandle = null
    }
    for (const { event, handler } of this.eventHandlers) {
      this.eventBus.off(event, handler)
    }
    this.eventHandlers = []
  }

  markAsSyncOrigin(eventName: string): void {
    this.syncOriginEvents.add(eventName)
  }

  private isSyncOrigin(eventName: string): boolean {
    return this.syncOriginEvents.has(eventName)
  }

  private registerConsumers(): void {
    const moduleEvents = [
      'user:created', 'user:status:changed',
      'staff:created', 'staff:updated', 'staff:role:changed', 'staff:deactivated',
      'staff:promoted', 'staff:demoted', 'staff:suspended',
      'permission:granted', 'permission:revoked',
      'role:assigned', 'role:revoked',
      'moderation:action:executed', 'moderation:action:created',
      'case:created', 'case:updated', 'case:assigned', 'case:status:changed', 'case:closed',
      'ticket:created', 'ticket:updated', 'ticket:assigned', 'ticket:replied', 'ticket:closed',
      'sla:created', 'sla:breached', 'sla:resolved',
      'audit:logged',
      'investigation:created', 'investigation:updated', 'investigation:completed',
      'notification:sent',
      'department:created', 'department:updated', 'department:staff:added',
      'department:staff:removed', 'department:transferred',
      'premium:granted', 'premium:extended', 'premium:removed', 'subscription:expired',
      'subscription:created', 'subscription:updated',
      'transaction:created',
      'economy:coins:credited', 'economy:coins:debited',
      'economy:diamonds:credited', 'economy:diamonds:debited',
      'account:frozen', 'account:unfrozen',
      'kpi:record:created', 'kpi:target:achieved',
      'approval:request:created', 'approval:step:completed', 'approval:request:resolved',
      'approval:approved', 'approval:rejected',
      'security:event:created', 'security:incident:detected', 'security:case:created',
      'security:lockdown:triggered', 'security:lockdown:lifted',
      'monitoring:service:status:changed', 'monitoring:alert:triggered', 'monitoring:alert:acknowledged',
      'incident:created', 'incident:updated', 'incident:resolved', 'incident:report:generated',
      'ai:summary:generated', 'ai:recommendation:created', 'ai:recommendation:applied',
      'analytics:metric:recorded', 'analytics:dashboard:created',
      'deeplink:created', 'deeplink:clicked',
      'dashboard:snapshot:generated',
      'governance:override:granted', 'governance:override:revoked',
      'governance:temporary:granted', 'governance:temporary:revoked',
      'governance:access:granted', 'governance:sensitive:configured',
      'governance:audit:export:created',
    ]

    for (const event of moduleEvents) {
      const handler = (payload: Record<string, unknown>) => this.onModuleEvent(event, payload)
      this.eventBus.on(event, handler)
      this.eventHandlers.push({ event, handler })
    }

    logger.info({ consumerCount: moduleEvents.length }, 'SyncProcessor consumers registered')
  }

  private isIdempotent(eventType: string, entityType: string, entityId: string): boolean {
    return true
  }

  private async checkIdempotency(eventType: string, entityType: string, entityId: string): Promise<boolean> {
    const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS)
    const existing = await this.prisma.syncEvent.findFirst({
      where: {
        eventType,
        entityType,
        entityId,
        status: 'PENDING',
        createdAt: { gte: since },
      },
    })
    return existing !== null
  }

  private async onModuleEvent(eventName: string, payload: Record<string, unknown>): Promise<void> {
    try {
      if (this.isSyncOrigin(eventName)) {
        logger.debug({ eventName }, 'Skipping sync-origin event to prevent circular chain')
        return
      }

      const entityType = this.guessEntityType(eventName)
      const entityId = this.guessEntityId(eventName, payload)
      if (!entityType || !entityId) return

      const isDuplicate = await this.checkIdempotency(eventName, entityType, entityId)
      if (isDuplicate) {
        logger.debug({ eventName, entityType, entityId }, 'Skipping duplicate sync event')
        return
      }

      await this.syncService.createEvent({
        eventType: eventName,
        entityType,
        entityId: String(entityId),
        action: this.guessAction(eventName),
        payload: payload as Record<string, unknown>,
        source: 'adminbot',
        target: 'spnetgram',
      })
    } catch (err) {
      logger.error({ err, eventName }, 'Failed to create sync event from module event')
    }
  }

  private guessEntityType(eventName: string): string | null {
    const prefix = eventName.split(':')[0]
    const map: Record<string, string> = {
      user: 'User', staff: 'Staff', permission: 'Permission',
      moderation: 'ModerationAction', case: 'Case', ticket: 'Ticket',
      sla: 'Sla', audit: 'AuditLog', investigation: 'Investigation',
      notification: 'Notification', department: 'Department',
      premium: 'PremiumSubscription', subscription: 'PremiumSubscription',
      economy: 'EconomyAccount', account: 'EconomyAccount',
      kpi: 'KpiRecord', approval: 'ApprovalRequest',
      security: 'SecurityEvent', monitoring: 'MonitoringAlert',
      incident: 'Incident', ai: 'AiOperation',
      analytics: 'AnalyticsMetric', deeplink: 'DeepLink',
      dashboard: 'Dashboard', governance: 'Governance',
      role: 'Role', transaction: 'Transaction',
    }
    return map[prefix] || null
  }

  private guessEntityId(eventName: string, payload: Record<string, unknown>): string | null {
    const idCandidates = ['userId', 'staffId', 'caseId', 'ticketId', 'investigationId',
      'accountId', 'reportId', 'eventId', 'alertId', 'incidentId', 'subscriptionId',
      'recordId', 'requestId', 'summaryId', 'recommendationId', 'dashboardId',
      'deeplinkId', 'transactionId', 'serviceId', 'slaId', 'auditId', 'notificationId',
      'departmentId', 'planId',
    ]
    for (const key of idCandidates) {
      if (payload[key] !== undefined && payload[key] !== null) {
        return String(payload[key])
      }
    }
    return null
  }

  private guessAction(eventName: string): string {
    const suffix = eventName.split(':').pop() || ''
    const actionMap: Record<string, string> = {
      created: 'CREATE', updated: 'UPDATE', changed: 'UPDATE',
      assigned: 'ASSIGN', replied: 'REPLY', closed: 'CLOSE',
      deactivated: 'DEACTIVATE', promoted: 'PROMOTE', demoted: 'DEMOTE',
      suspended: 'SUSPEND', granted: 'GRANT', revoked: 'REVOKE',
      extended: 'EXTEND', removed: 'REMOVE', expired: 'EXPIRE',
      credited: 'CREDIT', debited: 'DEBIT',
      frozen: 'FREEZE', unfrozen: 'UNFREEZE',
      achieved: 'ACHIEVE', completed: 'COMPLETE',
      approved: 'APPROVE', rejected: 'REJECT',
      detected: 'DETECT', triggered: 'TRIGGER', lifted: 'LIFT',
      acknowledged: 'ACKNOWLEDGE', transferred: 'TRANSFER',
      generated: 'GENERATE', clicked: 'CLICK',
      executed: 'EXECUTE', logged: 'LOG', sent: 'SEND',
    }
    return actionMap[suffix] || 'UPDATE'
  }

  private async processBatch(): Promise<void> {
    if (this.processing) return
    this.processing = true

    try {
      const pending = await this.syncService.getPendingEvents(50)
      if (pending.length === 0) return

      logger.debug({ count: pending.length }, 'Processing pending sync events')

      for (const event of pending) {
        try {
          await this.processEvent(event)
        } catch (err) {
          await this.handleFailure(event.id, (err as Error).message, event.retryCount)
        }
      }
    } catch (err) {
      logger.error({ err }, 'Sync batch processing error')
    } finally {
      this.processing = false
    }
  }

  private async processEvent(event: { id: string; eventType: string; entityType: string; entityId: string; retryCount: number; payload: any; source?: string; target?: string }): Promise<void> {
    if (event.source === 'spnetgram' && event.target === 'adminbot') {
      const inboundService = new InboundSyncService()
      await inboundService.processEvent(event)
      return
    }

    if (!env.SPNET_ADMIN_API_URL) {
      logger.warn({ syncEventId: event.id }, 'SPNET_ADMIN_API_URL not configured — marking as processed without delivery')
      await this.syncService.markProcessed(event.id)
      return
    }

    try {
      const response = await fetch(`${env.SPNET_ADMIN_API_URL}/api/sync/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.SPNET_ADMIN_API_KEY}`,
          'X-Sync-Origin': 'adminbot',
          'X-Idempotency-Key': event.id,
        },
        body: JSON.stringify({
          eventType: event.eventType,
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.eventType.split(':').pop() || 'UPDATE',
          payload: event.payload || {},
          source: 'adminbot',
          target: 'spnetgram',
          originEventId: event.id,
        }),
      })

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error')
        throw new Error(`SPNET-ADMIN returned ${response.status}: ${errorBody}`)
      }

      logger.info({ syncEventId: event.id, eventType: event.eventType }, 'Sync event delivered to SPNET-ADMIN')
      await this.syncService.markProcessed(event.id)
    } catch (err) {
      const errorMessage = (err as Error).message
      logger.error({ syncEventId: event.id, error: errorMessage }, 'Failed to deliver sync event to SPNET-ADMIN')
      throw err
    }
  }

  private async handleFailure(syncEventId: string, error: string, currentRetryCount: number): Promise<void> {
    const newRetryCount = currentRetryCount + 1

    if (newRetryCount >= MAX_RETRIES) {
      await this.moveToDlq(syncEventId, error, newRetryCount)
    } else {
      await this.syncService.updateEvent(syncEventId, {
        status: 'FAILED',
        error,
        retryCount: newRetryCount,
      })
      logger.warn({ syncEventId, retryCount: newRetryCount, error }, 'Sync event failed, will retry')
    }
  }

  private async moveToDlq(syncEventId: string, error: string, retryCount: number): Promise<void> {
    try {
      const event = await this.syncService.getEvent(syncEventId)
      await this.prisma.syncEvent.update({
        where: { id: syncEventId },
        data: {
          status: 'DLQ',
          error,
          retryCount,
        },
      })
      await this.eventBus.emit('sync:event:dlq', {
        syncEventId,
        eventType: event.eventType,
        entityType: event.entityType,
        entityId: event.entityId,
        error,
      })
      logger.error({ syncEventId, eventType: event.eventType, error }, 'Sync event moved to DLQ')
    } catch (err) {
      logger.error({ syncEventId, err }, 'Failed to move sync event to DLQ')
    }
  }

  async retryFromDlq(syncEventId: string): Promise<void> {
    const event = await this.syncService.getEvent(syncEventId)
    if (event.status !== 'DLQ') throw new Error(`Event ${syncEventId} is not in DLQ`)

    await this.prisma.syncEvent.update({
      where: { id: syncEventId },
      data: { status: 'PENDING', retryCount: 0, error: null },
    })
    logger.info({ syncEventId }, 'Sync event retried from DLQ')
  }

  async getDlqEvents(limit = 50): Promise<any[]> {
    return this.prisma.syncEvent.findMany({
      where: { status: 'DLQ' },
      take: limit,
      orderBy: { createdAt: 'desc' },
    })
  }

  async getDlqCount(): Promise<number> {
    return this.prisma.syncEvent.count({ where: { status: 'DLQ' } })
  }

  getStatus(): { consumers: number; processing: boolean; intervalMs: number } {
    return {
      consumers: this.eventHandlers.length,
      processing: this.processing,
      intervalMs: PROCESS_INTERVAL_MS,
    }
  }
}
