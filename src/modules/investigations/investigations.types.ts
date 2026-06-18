export type InvestigationStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'ARCHIVED'

export type EvidenceType = 'message' | 'file' | 'screenshot' | 'log' | 'statement' | 'other'

export interface Investigation {
  id: string
  caseId?: string | null
  title: string
  description: string | null
  status: InvestigationStatus
  severity: string
  assigneeId?: string | null
  reporterId: string
  evidence?: Record<string, unknown> | null
  findings?: string | null
  resolution?: string | null
  tags: string[]
  completedAt?: Date | null
  archivedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateInvestigationDto {
  caseId?: string
  title: string
  description?: string
  reporterId: string
  assigneeId?: string
  severity?: string
}

export interface UpdateInvestigationDto {
  title?: string
  description?: string
  findings?: string
  resolution?: string
  severity?: string
  evidence?: Record<string, unknown>
}

export interface Evidence {
  id: string
  type: EvidenceType
  description: string
  fileUrl?: string
  metadata?: Record<string, unknown>
  submittedById: string
  createdAt: string
}

export interface AddEvidenceDto {
  investigationId: string
  type: EvidenceType
  description: string
  fileUrl?: string
  metadata?: Record<string, unknown>
  submittedById: string
}

export interface InvestigationStatusTransitionDto {
  investigationId: string
  status: InvestigationStatus
  changedBy: string
  reason?: string
}

export interface InvestigationQueryParams {
  status?: InvestigationStatus
  assigneeId?: string
  caseId?: string
  page?: number
  limit?: number
}

export const VALID_INVESTIGATION_TRANSITIONS: Record<InvestigationStatus, InvestigationStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['SUSPENDED', 'COMPLETED', 'ARCHIVED'],
  SUSPENDED: ['ACTIVE', 'COMPLETED', 'ARCHIVED'],
  COMPLETED: [],
  ARCHIVED: [],
}
