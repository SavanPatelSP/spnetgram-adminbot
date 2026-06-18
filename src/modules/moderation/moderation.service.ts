import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { UserStatus } from '@prisma/client'
import { CreateModerationDto, ModerationFilter, ModerationActionType } from './moderation.types.js'

const ACTION_STATUS_MAP: Partial<Record<ModerationActionType, UserStatus>> = {
  BAN: UserStatus.BANNED,
  UNBAN: UserStatus.ACTIVE,
  MUTE: UserStatus.LIMITED,
  UNMUTE: UserStatus.ACTIVE,
  SUSPEND: UserStatus.LIMITED,
  UNSUSPEND: UserStatus.ACTIVE,
  FREEZE: UserStatus.LIMITED,
  UNFREEZE: UserStatus.ACTIVE,
}

export class ModerationService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async create(data: CreateModerationDto) {
    const [moderator, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: data.moderatorId } }),
      this.prisma.user.findUnique({ where: { id: data.targetId } }),
    ])
    if (!moderator) throw new NotFoundError('Moderator', data.moderatorId)
    if (!target) throw new NotFoundError('Target user', data.targetId)
    if (data.moderatorId === data.targetId) {
      throw new ValidationError('Moderator cannot act on themselves')
    }

    const action = await this.prisma.moderationAction.create({
      data: {
        moderatorId: data.moderatorId,
        targetId: data.targetId,
        actionType: data.actionType,
        reason: data.reason,
        duration: data.duration,
        evidence: data.evidence as any,
      },
    })

    const newStatus = ACTION_STATUS_MAP[data.actionType]
    if (newStatus) {
      await this.prisma.user.update({
        where: { id: data.targetId },
        data: { status: newStatus },
      })
    }

    logger.info(
      { actionId: action.id, moderatorId: data.moderatorId, targetId: data.targetId, actionType: data.actionType },
      'Moderation action created',
    )
    await this.eventBus.emit('moderation:action:created', { action, newStatus })
    await this.eventBus.emit('moderation:action:executed', { actionId: action.id, moderatorId: data.moderatorId, targetId: data.targetId, actionType: data.actionType })
    return action
  }

  async findById(id: string) {
    const action = await this.prisma.moderationAction.findUnique({
      where: { id },
      include: { moderator: true, target: true },
    })
    if (!action) throw new NotFoundError('ModerationAction', id)
    return action
  }

  async list(filters?: ModerationFilter) {
    return this.prisma.moderationAction.findMany({
      where: {
        ...(filters?.actionType ? { actionType: filters.actionType } : {}),
        ...(filters?.moderatorId ? { moderatorId: filters.moderatorId } : {}),
        ...(filters?.targetId ? { targetId: filters.targetId } : {}),
        ...(filters?.fromDate || filters?.toDate
          ? {
              createdAt: {
                ...(filters.fromDate ? { gte: filters.fromDate } : {}),
                ...(filters.toDate ? { lte: filters.toDate } : {}),
              },
            }
          : {}),
      },
      include: { moderator: true, target: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listByTarget(targetId: string) {
    return this.prisma.moderationAction.findMany({
      where: { targetId },
      include: { moderator: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listByModerator(moderatorId: string) {
    return this.prisma.moderationAction.findMany({
      where: { moderatorId },
      include: { target: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getTargetSummary(targetId: string) {
    const actions = await this.prisma.moderationAction.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
    })

    const totalActions = actions.length
    const actionCounts = actions.reduce(
      (acc, a) => {
        acc[a.actionType] = (acc[a.actionType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return { targetId, totalActions, actionCounts, latestAction: actions[0] ?? null }
  }
}
