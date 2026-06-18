export interface CreateDeepLinkDto {
  targetModule: string
  targetId: string
  source?: string
  expiresAt?: string
  maxClicks?: number
  metadata?: Record<string, unknown>
  createdBy?: string
}

export interface DeepLinkQueryParams {
  targetModule?: string
  targetId?: string
  page?: number
  limit?: number
}

export interface GenerateDeepLinkDto {
  targetModule: string
  targetId: string
  source?: string
  expiresInMinutes?: number
  maxClicks?: number
}
