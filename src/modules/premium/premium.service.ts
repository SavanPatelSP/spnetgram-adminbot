import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ConflictError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreatePlanDto, UpdatePlanDto, CreateSubscriptionDto, PremiumTierName } from './premium.types.js'
import { PremiumEvents } from './premium.events.js'
import { SyncPublishers } from '@modules/sync/sync.publishers.js'
import { addHours } from '../../shared/utils/date.js'

export class PremiumService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async createPlan(dto: CreatePlanDto) {
    const existing = await this.prisma.premiumPlan.findUnique({ where: { name: dto.name } })
    if (existing) throw new ConflictError(`Plan '${dto.name}' already exists`)

    const plan = await this.prisma.premiumPlan.create({
      data: {
        name: dto.name,
        tier: dto.tier as any,
        description: dto.description,
        price: dto.price,
        interval: dto.interval ?? 'monthly',
        features: dto.features ?? [],
        maxStaff: dto.maxStaff ?? 1,
        maxCases: dto.maxCases ?? 10,
      },
    })

    logger.info({ planId: plan.id, name: dto.name, tier: dto.tier }, 'Premium plan created')
    return plan
  }

  async findPlanById(id: string) {
    const plan = await this.prisma.premiumPlan.findUnique({ where: { id } })
    if (!plan) throw new NotFoundError('PremiumPlan', id)
    return plan
  }

  async listPlans(activeOnly = true) {
    return this.prisma.premiumPlan.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: { price: 'asc' },
    })
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.findPlanById(id)
    const plan = await this.prisma.premiumPlan.update({
      where: { id },
      data: dto,
    })
    logger.info({ planId: id }, 'Premium plan updated')
    return plan
  }

  async createSubscription(dto: CreateSubscriptionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!user) throw new NotFoundError('User', dto.userId)

    const plan = await this.findPlanById(dto.planId)

    const existing = await this.prisma.userSubscription.findUnique({
      where: { userId_planId: { userId: dto.userId, planId: dto.planId } },
    })
    if (existing && existing.status === 'ACTIVE') {
      throw new ConflictError('User already has an active subscription to this plan')
    }

    const periodEnd = dto.trialEndsAt
      ? new Date(dto.trialEndsAt)
      : addHours(30 * 24)

    const subscription = await this.prisma.userSubscription.create({
      data: {
        userId: dto.userId,
        planId: dto.planId,
        status: dto.trialEndsAt ? 'TRIALING' : 'ACTIVE',
        currentPeriodEnd: periodEnd,
        trialEndsAt: dto.trialEndsAt ? new Date(dto.trialEndsAt) : null,
      },
      include: { plan: true, user: true },
    })

    logger.info({ subscriptionId: subscription.id, userId: dto.userId, planId: dto.planId }, 'Subscription created')
    await PremiumEvents.subscriptionCreated(subscription.id, dto.userId, dto.planId)
    SyncPublishers.publishPremiumGranted(subscription.id, dto.userId, dto.planId, 30)
    return subscription
  }

  async findSubscriptionById(id: string) {
    const sub = await this.prisma.userSubscription.findUnique({
      where: { id },
      include: { plan: true, user: true },
    })
    if (!sub) throw new NotFoundError('UserSubscription', id)
    return sub
  }

  async listSubscriptions(userId?: string) {
    const where: Record<string, unknown> = {}
    if (userId) where.userId = userId
    return this.prisma.userSubscription.findMany({
      where,
      include: { plan: true, user: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async cancelSubscription(id: string) {
    const sub = await this.findSubscriptionById(id)
    const updated = await this.prisma.userSubscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { plan: true, user: true },
    })
    logger.info({ subscriptionId: id }, 'Subscription cancelled')
    await PremiumEvents.subscriptionUpdated(id, 'CANCELLED')
    SyncPublishers.publishPremiumRemoved(id, sub.userId, sub.planId, 'CANCELLED')
    return updated
  }

  async checkFeature(userId: string, feature: string): Promise<boolean> {
    const sub = await this.prisma.userSubscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
      orderBy: { currentPeriodEnd: 'desc' },
    })
    if (!sub) return false
    const features = (sub.plan.features as string[]) ?? []
    return features.includes(feature)
  }

  async expireSubscriptions() {
    const now = new Date()
    const expiredList = await this.prisma.userSubscription.findMany({
      where: { status: 'ACTIVE', currentPeriodEnd: { lte: now } },
    })
    if (expiredList.length === 0) return { count: 0 }

    await this.prisma.userSubscription.updateMany({
      where: { id: { in: expiredList.map(s => s.id) } },
      data: { status: 'EXPIRED' },
    })

    for (const sub of expiredList) {
      await PremiumEvents.subscriptionExpired(sub.id, sub.userId)
    }

    logger.info({ count: expiredList.length }, 'Subscriptions expired')
    return { count: expiredList.length }
  }
}
