export type StaffRoleName = 'SUPPORT_AGENT' | 'SENIOR_SUPPORT' | 'SUPPORT_MANAGER' | 'ADMIN' | 'EXECUTIVE' | 'SECURITY_ANALYST' | 'SECURITY_LEAD' | 'MONITORING_OPERATOR' | 'INCIDENT_RESPONDER' | 'INCIDENT_COMMANDER' | 'COMPLIANCE_OFFICER' | 'ANALYTICS_VIEWER' | 'AUDIT_MANAGER'

export interface CreateStaffDto {
  userId: string
  role?: StaffRoleName
}

export interface UpdateStaffDto {
  isActive?: boolean
}

export interface StaffAssignmentResult {
  staffId: string
  userId: string
  roles: StaffRoleName[]
  isActive: boolean
}
