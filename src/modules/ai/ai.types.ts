export interface CreateAiSummaryDto {
  targetType: string
  targetId: string
  summaryType: string
  content: string
  model?: string
  confidence?: number
  metadata?: Record<string, unknown>
}

export interface AiSummaryQueryParams {
  targetType?: string
  targetId?: string
  summaryType?: string
  page?: number
  limit?: number
}

export interface CreateAiRecommendationDto {
  targetType?: string
  targetId?: string
  category: string
  title: string
  description?: string
  priority?: string
  confidence?: number
  reasoning?: string
  metadata?: Record<string, unknown>
}

export interface UpdateRecommendationStatusDto {
  status: string
  appliedById?: string
}

export interface RecommendationQueryParams {
  status?: string
  category?: string
  priority?: string
  page?: number
  limit?: number
}
