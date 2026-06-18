import { AiService } from './ai.service.js'
import { CreateAiSummaryDto, AiSummaryQueryParams, CreateAiRecommendationDto, UpdateRecommendationStatusDto, RecommendationQueryParams } from './ai.types.js'

const service = new AiService()

export const AiController = {
  async createSummary(req: { body: CreateAiSummaryDto }) {
    const data = await service.createSummary(req.body)
    return { status: 201, body: data }
  },

  async getSummary(req: { params: { id: string } }) {
    const data = await service.getSummary(req.params.id)
    return { status: 200, body: data }
  },

  async querySummaries(req: { query: Record<string, string | undefined> }) {
    const data = await service.querySummaries({
      targetType: req.query.targetType,
      targetId: req.query.targetId,
      summaryType: req.query.summaryType,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async byTarget(req: { params: { targetType: string; targetId: string } }) {
    const data = await service.getSummariesByTarget(req.params.targetType, req.params.targetId)
    return { status: 200, body: data }
  },

  async createRecommendation(req: { body: CreateAiRecommendationDto }) {
    const data = await service.createRecommendation(req.body)
    return { status: 201, body: data }
  },

  async getRecommendation(req: { params: { id: string } }) {
    const data = await service.getRecommendation(req.params.id)
    return { status: 200, body: data }
  },

  async list(req: { query: Record<string, string | undefined> }) {
    const data = await service.queryRecommendations({
      status: req.query.status,
      category: req.query.category,
      priority: req.query.priority,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
    })
    return { status: 200, body: data }
  },

  async apply(req: { params: { id: string }; body: { appliedById: string } }) {
    const data = await service.applyRecommendation(req.params.id, req.body.appliedById)
    return { status: 200, body: data }
  },

  async dismiss(req: { params: { id: string } }) {
    const data = await service.dismissRecommendation(req.params.id)
    return { status: 200, body: data }
  },
}
