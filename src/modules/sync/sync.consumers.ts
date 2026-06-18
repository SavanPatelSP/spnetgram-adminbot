import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { logger } from '@infrastructure/logger/logger.js'
import { NotificationsService } from '@modules/notifications/notifications.service.js'
import { AuditService } from '@modules/audit/audit.service.js'

const eventBus = EventBus.getInstance()
const prisma = PrismaService.getInstance().client
const notificationsService = new NotificationsService()
const auditService = new AuditService()

export function registerSyncConsumers(syncProcessor?: { markAsSyncOrigin: (eventName: string) => void }): void {
  logger.info('Registering cross-platform notification consumers')

  eventBus.on('sync:event:processed', async (payload: { syncEventId: string; status: string }) => {
    try {
      const event = await prisma.syncEvent.findUnique({ where: { id: payload.syncEventId } })
      if (!event) return

      if (event.target === 'adminbot' && event.source === 'spnetgram') {
        if (syncProcessor) syncProcessor.markAsSyncOrigin('notification:sent')
        await notificationsService.create(
          event.entityId,
          'SYSTEM',
          `Sync completed: ${event.eventType}`,
          `${event.entityType} #${event.entityId} synced successfully`,
          { syncEventId: event.id, eventType: event.eventType },
          'IN_APP',
        )
      } else if (event.target === 'spnetgram' && event.source === 'adminbot') {
        if (syncProcessor) syncProcessor.markAsSyncOrigin('audit:logged')
        await createAuditLogForSync(event)
      }
    } catch (err) {
      logger.error({ err, syncEventId: payload.syncEventId }, 'Sync notification consumer error')
    }
  })

  eventBus.on('sync:event:failed', async (payload: { syncEventId: string; error: string }) => {
    try {
      const event = await prisma.syncEvent.findUnique({ where: { id: payload.syncEventId } })
      if (!event) return

      if (syncProcessor) syncProcessor.markAsSyncOrigin('notification:sent')
      await notificationsService.create(
        event.entityId,
        'SYSTEM',
        `Sync failed: ${event.eventType}`,
        `Failed to sync ${event.entityType} #${event.entityId}: ${payload.error}`,
        { syncEventId: event.id, error: payload.error },
        'IN_APP',
      )

      if (syncProcessor) syncProcessor.markAsSyncOrigin('audit:logged')
      await auditService.create({
        action: 'SYNC_FAILED',
        resource: event.entityType.toUpperCase(),
        resourceId: event.entityId,
        description: `Sync event ${event.eventType} failed: ${payload.error}`,
        metadata: { syncEventId: event.id, eventType: event.eventType },
      })
    } catch (err) {
      logger.error({ err, syncEventId: payload.syncEventId }, 'Sync failure notification error')
    }
  })

  eventBus.on('sync:event:dlq', async (payload: { syncEventId: string; eventType: string; entityType: string; entityId: string; error: string }) => {
    try {
      if (syncProcessor) syncProcessor.markAsSyncOrigin('audit:logged')
      await auditService.create({
        action: 'SYNC_DLQ',
        resource: payload.entityType.toUpperCase(),
        resourceId: payload.entityId,
        description: `Sync event moved to Dead Letter Queue: ${payload.error}`,
        metadata: { syncEventId: payload.syncEventId, eventType: payload.eventType },
      })
    } catch (err) {
      logger.error({ err, syncEventId: payload.syncEventId }, 'DLQ audit consumer error')
    }
  })

  eventBus.on('sync:event:created', async (payload: { syncEventId: string; eventType: string; entityType: string; entityId: string }) => {
    try {
      logger.debug({ ...payload }, 'Sync event created consumer')
    } catch (err) {
      logger.error({ err, syncEventId: payload.syncEventId }, 'Sync created consumer error')
    }
  })

  logger.info('Sync consumers registered')
}

async function createAuditLogForSync(event: { id: string; eventType: string; entityType: string; entityId: string; action: string }): Promise<void> {
  try {
    await auditService.create({
      action: `SYNC_${event.action}`,
      resource: event.entityType.toUpperCase(),
      resourceId: event.entityId,
      description: `Synced to SPNETGRAM: ${event.eventType}`,
      metadata: { syncEventId: event.id, eventType: event.eventType },
    })
  } catch (err) {
    logger.error({ err, syncEventId: event.id }, 'Failed to create audit log for sync event')
  }
}
