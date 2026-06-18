import { PrismaService } from '@infrastructure/database/prisma.service.js'
import { EventBus } from '@infrastructure/event-bus/event-bus.js'
import { NotFoundError, ValidationError } from '@shared/errors/index.js'
import { logger } from '@infrastructure/logger/logger.js'
import { CreateAiSummaryDto, AiSummaryQueryParams, CreateAiRecommendationDto, UpdateRecommendationStatusDto, RecommendationQueryParams } from './ai.types.js'
import { AiEvents } from './ai.events.js'

export class AiService {
  private prisma = PrismaService.getInstance().client
  private eventBus = EventBus.getInstance()

  async createSummary(dto: CreateAiSummaryDto) {
    if (!dto.targetType || !dto.targetId || !dto.summaryType || !dto.content) {
      throw new ValidationError('Missing required fields for AI summary')
    }

    const summary = await this.prisma.aiSummary.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        summaryType: dto.summaryType,
        content: dto.content,
        model: dto.model ?? 'gpt-4',
        confidence: dto.confidence,
        metadata: dto.metadata as any,
      },
    })

    logger.info({ summaryId: summary.id, targetType: dto.targetType }, 'AI summary generated')
    await AiEvents.summaryGenerated(summary.id, dto.targetType, dto.targetId, dto.summaryType)
    return summary
  }

  async getSummary(id: string) {
    const summary = await this.prisma.aiSummary.findUnique({ where: { id } })
    if (!summary) throw new NotFoundError('AiSummary', id)
    return summary
  }

  async querySummaries(params: AiSummaryQueryParams) {
    const { targetType, targetId, summaryType, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (targetType) where.targetType = targetType
    if (targetId) where.targetId = targetId
    if (summaryType) where.summaryType = summaryType

    const [items, total] = await Promise.all([
      this.prisma.aiSummary.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiSummary.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getSummariesByTarget(targetType: string, targetId: string) {
    return this.prisma.aiSummary.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async createRecommendation(dto: CreateAiRecommendationDto) {
    if (!dto.category || !dto.title) {
      throw new ValidationError('Missing required fields for recommendation')
    }

    const recommendation = await this.prisma.aiRecommendation.create({
      data: {
        targetType: dto.targetType,
        targetId: dto.targetId,
        category: dto.category,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        confidence: dto.confidence,
        reasoning: dto.reasoning,
        metadata: dto.metadata as any,
      },
    })

    logger.info({ recommendationId: recommendation.id, category: dto.category }, 'AI recommendation created')
    await AiEvents.recommendationCreated(recommendation.id, dto.category, dto.title, dto.priority ?? 'MEDIUM')
    return recommendation
  }

  async getRecommendation(id: string) {
    const recommendation = await this.prisma.aiRecommendation.findUnique({ where: { id } })
    if (!recommendation) throw new NotFoundError('AiRecommendation', id)
    return recommendation
  }

  async queryRecommendations(params: RecommendationQueryParams) {
    const { status, category, priority, page = 1, limit = 20 } = params
    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority

    const [items, total] = await Promise.all([
      this.prisma.aiRecommendation.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.aiRecommendation.count({ where }),
    ])
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async applyRecommendation(id: string, appliedById: string) {
    const recommendation = await this.getRecommendation(id)
    if (recommendation.status !== 'PENDING') {
      throw new ValidationError('Recommendation is not in PENDING status')
    }

    const updated = await this.prisma.aiRecommendation.update({
      where: { id },
      data: {
        status: 'APPLIED',
        appliedById,
        appliedAt: new Date(),
      },
    })

    logger.info({ recommendationId: id, appliedBy: appliedById }, 'AI recommendation applied')
    await AiEvents.recommendationApplied(id, appliedById)
    return updated
  }

  async dismissRecommendation(id: string) {
    const recommendation = await this.getRecommendation(id)
    if (recommendation.status !== 'PENDING') {
      throw new ValidationError('Recommendation is not in PENDING status')
    }

    const updated = await this.prisma.aiRecommendation.update({
      where: { id },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
      },
    })

    logger.info({ recommendationId: id }, 'AI recommendation dismissed')
    return updated
  }
}
