import { UserStatus } from '@prisma/client'

export interface UpsertTelegramUserDto {
  telegramId: bigint
  telegramUsername?: string
  firstName?: string
  lastName?: string
  languageCode?: string
}

export interface UpdateUserStatusDto {
  status: UserStatus
  reason?: string
}

export interface UserIntelligenceDto {
  trustScore?: number
  riskScore?: number
  reputationScore?: number
  warningCount?: number
}

export interface UserLookupResult {
  id: string
  telegramId: bigint | null
  telegramUsername: string | null
  firstName: string | null
  lastName: string | null
  status: UserStatus
  isStaff: boolean
  createdAt: Date
}
