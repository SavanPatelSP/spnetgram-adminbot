export type ApprovalRequestStatusName = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REQUIRE_INFO'

export interface CreateApprovalRequestDto {
  title: string
  description?: string
  priority?: string
  requesterId: string
  resourceType: string
  resourceId?: string
  payload?: Record<string, unknown>
  reason?: string
  steps: ApprovalStepInput[]
}

export interface ApprovalStepInput {
  stepOrder: number
  approverId?: string
  roleRequired?: string
}

export interface ApproveStepDto {
  stepId: string
  approverId: string
  comment?: string
}

export interface RejectStepDto {
  stepId: string
  approverId: string
  comment?: string
}

export interface RequestInfoDto {
  stepId: string
  approverId: string
  comment: string
}

export interface ApprovalQueryParams {
  status?: ApprovalRequestStatusName
  requesterId?: string
  resourceType?: string
  page?: number
  limit?: number
}
