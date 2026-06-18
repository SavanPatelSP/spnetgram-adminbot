export type ModerationActionType = 'WARN' | 'MUTE' | 'UNMUTE' | 'BAN' | 'UNBAN' | 'SUSPEND' | 'UNSUSPEND' | 'FREEZE' | 'UNFREEZE' | 'SHADOWBAN'

export interface CreateModerationDto {
  moderatorId: string
  targetId: string
  actionType: ModerationActionType
  reason?: string
  duration?: number
  evidence?: Record<string, unknown>
}

export interface ModerationFilter {
  actionType?: ModerationActionType
  moderatorId?: string
  targetId?: string
  fromDate?: Date
  toDate?: Date
}

export interface ModerationActionResult {
  id: string
  moderatorId: string
  targetId: string
  actionType: ModerationActionType
  reason: string | null
  duration: number | null
  createdAt: Date
}
