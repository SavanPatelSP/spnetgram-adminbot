import { NotificationsService } from '@modules/notifications/notifications.service.js'
import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { NotificationType, NotificationCategory } from '@modules/notifications/notifications.types.js'
import { logger } from '@infrastructure/logger/logger.js'

const EXECUTIVE_ROLES = new Set(['OWNER', 'SUPER_ADMINISTRATOR', 'CEO', 'CTO', 'COO', 'ADMIN'])

interface DispatchInfo {
  type: NotificationType
  category: NotificationCategory
  title: string
  body: string
  targetUserId: string | null
}

export class BotNotificationDispatcher {
  private notificationsService = new NotificationsService()
  private prisma = PrismaService.getInstance().client

  async dispatch(eventType: string, payload: Record<string, unknown>): Promise<void> {
    const info = this.buildDispatchInfo(eventType, payload)
    if (!info) {
      logger.warn({ eventType }, 'No notification mapping for admin→bot event')
      return
    }

    if (!info.targetUserId) {
      await this.dispatchBroadcast(eventType, payload, info)
      return
    }

    await this.deliverWithRetry(info.targetUserId, info, eventType, payload)
    logger.info({ eventType, userId: info.targetUserId }, 'Admin→bot notification dispatched')
  }

  private async dispatchBroadcast(eventType: string, payload: Record<string, unknown>, info: DispatchInfo): Promise<void> {
    const severity = String(payload.severity ?? 'INFO').toUpperCase()

    if (eventType.startsWith('security:')) {
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        await this.notifyExecutives(info)
      } else {
        await this.notifyRole('ADMIN', info)
      }
      if (payload.departmentId) {
        await this.notifyDepartment(String(payload.departmentId), info)
      }
    } else {
      logger.warn({ eventType }, 'No target user and no broadcast rule for event, skipping')
    }
  }

  async notifyRole(roleName: string, info: DispatchInfo): Promise<number> {
    const staff = await this.prisma.staffMember.findMany({
      where: {
        isActive: true,
        roleAssignments: {
          some: {
            revokedAt: null,
            role: { name: roleName as any },
          },
        },
      },
      include: { user: { select: { id: true } } },
    })

    let sent = 0
    for (const member of staff) {
      await this.deliverWithRetry(member.user.id, info, 'broadcast:role', {}).catch(() => {})
      sent++
    }
    logger.info({ roleName, count: sent }, 'Broadcast sent to role')
    return sent
  }

  async notifyDepartment(departmentId: string, info: DispatchInfo): Promise<number> {
    const members = await this.prisma.departmentStaff.findMany({
      where: { departmentId },
      include: { staff: { include: { user: { select: { id: true } } } } },
    })

    let sent = 0
    for (const member of members) {
      if (member.staff.isActive) {
        await this.deliverWithRetry(member.staff.user.id, info, 'broadcast:department', {}).catch(() => {})
        sent++
      }
    }
    logger.info({ departmentId, count: sent }, 'Broadcast sent to department')
    return sent
  }

  async notifyExecutives(info: DispatchInfo): Promise<number> {
    const staff = await this.prisma.staffMember.findMany({
      where: {
        isActive: true,
        roleAssignments: {
          some: {
            revokedAt: null,
            role: { name: { in: [...EXECUTIVE_ROLES] as any } },
          },
        },
      },
      include: { user: { select: { id: true } } },
    })

    let sent = 0
    for (const member of staff) {
      await this.deliverWithRetry(member.user.id, info, 'broadcast:executive', {}).catch(() => {})
      sent++
    }
    logger.info({ count: sent }, 'Broadcast sent to executives')
    return sent
  }

  private async deliverWithRetry(userId: string, info: DispatchInfo, eventType: string, payload: Record<string, unknown>): Promise<void> {
    const maxAttempts = 3
    const delays = [1_000, 2_000, 4_000]
    const data = { ...payload, eventType } as Record<string, unknown>

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await this.notificationsService.create(
          userId, info.type, info.title, info.body, data, 'TELEGRAM', info.category,
        )
        return
      } catch (err) {
        logger.warn({ userId, eventType, attempt, err }, 'Telegram delivery attempt failed')
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, delays[attempt - 1]))
        } else {
          logger.error({ userId, eventType }, 'Telegram delivery failed after max retries')
          throw err
        }
      }
    }
  }

  buildDispatchInfo(eventType: string, payload: Record<string, unknown>): DispatchInfo | null {
    const builders: Record<string, () => DispatchInfo> = {
      'ticket:assigned': () => ({
        type: 'TICKET_ASSIGNED',
        category: 'TICKET',
        title: 'Ticket Assigned',
        body: `Ticket #${payload.ticketId} has been assigned to you by ${payload.assignedBy}`,
        targetUserId: String(payload.assignedTo ?? ''),
      }),
      'ticket:escalated': () => ({
        type: 'TICKET_ESCALATED',
        category: 'TICKET',
        title: 'Ticket Escalated',
        body: `Ticket #${payload.ticketId} has been escalated to you by ${payload.escalatedBy}`,
        targetUserId: String(payload.escalatedTo ?? ''),
      }),
      'premium:approved': () => ({
        type: 'PREMIUM_APPROVAL',
        category: 'PREMIUM',
        title: 'Premium Approved',
        body: `Premium subscription #${payload.subscriptionId} has been approved by ${payload.approvedBy}`,
        targetUserId: String(payload.userId ?? ''),
      }),
      'premium:rejected': () => ({
        type: 'PREMIUM_APPROVAL',
        category: 'PREMIUM',
        title: 'Premium Rejected',
        body: `Premium subscription #${payload.subscriptionId} was rejected by ${payload.rejectedBy}${payload.reason ? `: ${payload.reason}` : ''}`,
        targetUserId: String(payload.userId ?? ''),
      }),
      'security:alert': () => ({
        type: 'SECURITY_ALERT',
        category: 'SECURITY',
        title: `Security Alert: ${payload.severity}`,
        body: String(payload.message ?? `Security alert #${payload.alertId} triggered`),
        targetUserId: String(payload.userId ?? payload.staffId ?? ''),
      }),
      'security:incident:detected': () => ({
        type: 'SECURITY_ALERT',
        category: 'SECURITY',
        title: `Security Incident: ${payload.severity}`,
        body: String(payload.message ?? `Security incident #${payload.incidentId} detected`),
        targetUserId: String(payload.userId ?? payload.staffId ?? ''),
      }),
      'security:case:created': () => ({
        type: 'SECURITY_ALERT',
        category: 'SECURITY',
        title: 'Security Case Created',
        body: `Security case #${payload.caseId} has been opened for event #${payload.eventId}`,
        targetUserId: String(payload.userId ?? payload.staffId ?? ''),
      }),
      'approval:request:created': () => ({
        type: 'APPROVAL_REQUEST',
        category: 'SYSTEM',
        title: 'Approval Request',
        body: `Approval request for ${payload.resourceType} #${payload.resourceId ?? ''} requires your action`,
        targetUserId: String(payload.approverId ?? ''),
      }),
      'staff:promoted': () => ({
        type: 'STAFF_PROMOTION',
        category: 'STAFF',
        title: 'You Have Been Promoted',
        body: `Congratulations! You have been promoted to ${payload.newRole}${payload.previousRole ? ` (was ${payload.previousRole})` : ''}`,
        targetUserId: String(payload.userId ?? ''),
      }),
      'staff:suspended': () => ({
        type: 'STAFF_SUSPENSION',
        category: 'STAFF',
        title: 'Account Suspended',
        body: `Your staff account has been suspended${payload.reason ? `: ${payload.reason}` : ''}`,
        targetUserId: String(payload.userId ?? ''),
      }),
      'department:transferred': () => ({
        type: 'STAFF_DEPARTMENT_TRANSFER',
        category: 'STAFF',
        title: 'Department Transfer',
        body: `You have been transferred from ${payload.fromDepartment} to ${payload.toDepartment}`,
        targetUserId: String(payload.userId ?? ''),
      }),
    }

    const builder = builders[eventType]
    return builder ? builder() : null
  }
}
