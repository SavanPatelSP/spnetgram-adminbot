import { logger } from '@infrastructure/logger/logger.js'
import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { BotNotificationDispatcher } from './bot-notification-dispatcher.js'
import { SyncService } from './sync.service.js'
import { AuditService } from '@modules/audit/audit.service.js'

interface ValidationRule {
  requiredFields: string[]
  optionalFields?: string[]
}

const VALIDATION_RULES: Record<string, ValidationRule> = {
  'ticket:assigned': { requiredFields: ['ticketId', 'assignedTo', 'assignedBy'] },
  'ticket:escalated': { requiredFields: ['ticketId', 'escalatedTo', 'escalatedBy'] },
  'premium:approved': { requiredFields: ['subscriptionId', 'userId', 'approvedBy'] },
  'premium:rejected': { requiredFields: ['subscriptionId', 'userId', 'rejectedBy'], optionalFields: ['reason'] },
  'security:alert': { requiredFields: ['alertId', 'severity'], optionalFields: ['userId', 'staffId', 'message'] },
  'approval:request:created': { requiredFields: ['requestId', 'approverId', 'resourceType'] },
  'staff:promoted': { requiredFields: ['staffId', 'userId', 'newRole'], optionalFields: ['previousRole'] },
  'staff:suspended': { requiredFields: ['staffId', 'userId'], optionalFields: ['reason'] },
  'department:transferred': { requiredFields: ['departmentId', 'staffId', 'userId', 'fromDepartment', 'toDepartment'] },
  'security:incident:detected': { requiredFields: ['incidentId', 'severity'], optionalFields: ['userId', 'staffId', 'message'] },
  'security:case:created': { requiredFields: ['eventId', 'caseId', 'userId'], optionalFields: ['staffId'] },
}

const SUPPORTED_EVENTS = new Set(Object.keys(VALIDATION_RULES))

export class InboundSyncService {
  private dispatcher = new BotNotificationDispatcher()
  private syncService = new SyncService()
  private prisma = PrismaService.getInstance().client
  private auditService = new AuditService()

  async processEvent(event: { id: string; eventType: string; entityType: string; entityId: string; payload: Record<string, unknown> | null }): Promise<boolean> {
    const { id, eventType, payload } = event

    if (!SUPPORTED_EVENTS.has(eventType)) {
      logger.warn({ syncEventId: id, eventType }, 'Unsupported admin→bot event type, marking as processed')
      await this.syncService.markProcessed(id)
      return true
    }

    const validationError = this.validate(eventType, payload || {})
    if (validationError) {
      logger.error({ syncEventId: id, eventType, validationError }, 'Admin→bot event validation failed')
      await this.syncService.markFailed(id, validationError)
      return false
    }

    try {
      await this.dispatcher.dispatch(eventType, payload || {})
      await this.syncService.markProcessed(id)
      logger.info({ syncEventId: id, eventType }, 'Admin→bot event processed successfully')
      return true
    } catch (err) {
      logger.error({ syncEventId: id, eventType, err }, 'Failed to process admin→bot event')
      await this.syncService.markFailed(id, (err as Error).message)
      return false
    }
  }

  async replayFromDlq(limit = 50): Promise<{ replayed: number; failed: number }> {
    const events = await this.prisma.syncEvent.findMany({
      where: { source: 'spnetgram', target: 'adminbot', status: 'DLQ' },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    let replayed = 0
    let failed = 0

    for (const event of events) {
      try {
        await this.prisma.syncEvent.update({
          where: { id: event.id },
          data: { status: 'PENDING', retryCount: 0, error: null },
        })
        const success = await this.processEvent({ id: event.id, eventType: event.eventType, entityType: event.entityType, entityId: event.entityId, payload: event.payload as Record<string, unknown> | null })
        if (success) {
          replayed++
          await this.auditService.create({
            action: 'SYNC_REPLAY_DLQ',
            resource: event.entityType.toUpperCase(),
            resourceId: event.entityId,
            description: `Replayed admin→bot event ${event.eventType} from DLQ`,
            metadata: { syncEventId: event.id, eventType: event.eventType },
          })
        } else {
          failed++
        }
      } catch (err) {
        logger.error({ syncEventId: event.id, err }, 'Failed to replay event from DLQ')
        failed++
      }
    }

    logger.info({ replayed, failed }, 'Admin→bot replay from DLQ completed')
    return { replayed, failed }
  }

  async replayFromFailed(limit = 50): Promise<{ replayed: number; failed: number }> {
    const events = await this.prisma.syncEvent.findMany({
      where: { source: 'spnetgram', target: 'adminbot', status: 'FAILED', retryCount: { gte: 3 } },
      take: limit,
      orderBy: { createdAt: 'asc' },
    })

    let replayed = 0
    let failed = 0

    for (const event of events) {
      try {
        await this.prisma.syncEvent.update({
          where: { id: event.id },
          data: { status: 'PENDING', retryCount: 0, error: null },
        })
        const success = await this.processEvent({ id: event.id, eventType: event.eventType, entityType: event.entityType, entityId: event.entityId, payload: event.payload as Record<string, unknown> | null })
        if (success) {
          replayed++
          await this.auditService.create({
            action: 'SYNC_REPLAY_FAILED',
            resource: event.entityType.toUpperCase(),
            resourceId: event.entityId,
            description: `Replayed admin→bot event ${event.eventType} from FAILED queue`,
            metadata: { syncEventId: event.id, eventType: event.eventType },
          })
        } else {
          failed++
        }
      } catch (err) {
        logger.error({ syncEventId: event.id, err }, 'Failed to replay event from FAILED queue')
        failed++
      }
    }

    logger.info({ replayed, failed }, 'Admin→bot replay from FAILED queue completed')
    return { replayed, failed }
  }

  validate(eventType: string, payload: Record<string, unknown>): string | null {
    const rules = VALIDATION_RULES[eventType]
    if (!rules) return null

    for (const field of rules.requiredFields) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
        return `Missing required field: ${field}`
      }
    }
    return null
  }
}
