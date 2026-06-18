export type PremiumTierName = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
export type SubscriptionStatusName = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'TRIALING'

export interface CreatePlanDto {
  name: string
  tier: PremiumTierName
  description?: string
  price: number
  interval?: string
  features?: string[]
  maxStaff?: number
  maxCases?: number
}

export interface UpdatePlanDto {
  name?: string
  description?: string
  price?: number
  interval?: string
  features?: string[]
  maxStaff?: number
  maxCases?: number
  isActive?: boolean
}

export interface CreateSubscriptionDto {
  userId: string
  planId: string
  trialEndsAt?: string
}

export interface PremiumFeatureCheck {
  feature: string
  granted: boolean
  limit?: number
  usage?: number
}
