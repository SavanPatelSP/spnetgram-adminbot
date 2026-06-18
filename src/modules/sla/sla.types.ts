export type SlaStatus = 'ACTIVE' | 'BREACHED' | 'RESOLVED'

export type SlaTargetType = 'case' | 'ticket'

export interface Sla {
  id: string
  caseId: string | null
  ticketId: string | null
  policyName: string
  targetHours: number
  startedAt: Date
  deadlineAt: Date
  breachedAt: Date | null
  resolvedAt: Date | null
  status: string
  createdAt: Date
}

export interface CreateSlaDto {
  caseId?: string
  ticketId?: string
  policyName: string
  targetHours: number
  deadlineAt: Date
}

export interface SlaBreachCheckResult {
  slaId: string
  targetId: string
  targetType: string
  breached: boolean
}

export interface SlaQueryParams {
  status?: SlaStatus
  targetType?: SlaTargetType
  targetId?: string
  page?: number
  limit?: number
}
