export type CaseStatus = 'OPEN' | 'INVESTIGATING' | 'PENDING_EVIDENCE' | 'RESOLVED' | 'DISMISSED' | 'APPEALED'

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Case {
  id: string
  referenceId: string
  title: string
  description: string
  status: CaseStatus
  priority: CasePriority
  reporterId: string
  assigneeId?: string
  module?: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
}

export interface CreateCaseDto {
  title: string
  description: string
  priority: CasePriority
  reporterId: string
  module?: string
}

export interface UpdateCaseDto {
  title?: string
  description?: string
  priority?: CasePriority
}

export interface CaseAssignmentDto {
  caseId: string
  assigneeId: string
  assignedBy: string
}

export interface CaseStatusTransitionDto {
  caseId: string
  status: CaseStatus
  changedBy: string
  reason?: string
}

export interface CaseQueryParams {
  status?: CaseStatus
  priority?: CasePriority
  assigneeId?: string
  reporterId?: string
  page?: number
  limit?: number
}

export const VALID_STATUS_TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  OPEN: ['INVESTIGATING', 'DISMISSED'],
  INVESTIGATING: ['PENDING_EVIDENCE', 'RESOLVED', 'DISMISSED'],
  PENDING_EVIDENCE: ['INVESTIGATING', 'DISMISSED'],
  RESOLVED: ['DISMISSED'],
  DISMISSED: [],
  APPEALED: ['INVESTIGATING'],
}
