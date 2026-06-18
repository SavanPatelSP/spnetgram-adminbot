export type DepartmentTypeName = 'MODERATION' | 'SUPPORT' | 'INVESTIGATIONS' | 'ENGINEERING' | 'ADMINISTRATION'

export interface CreateDepartmentDto {
  name: string
  description?: string
  type: DepartmentTypeName
  leadId?: string
}

export interface UpdateDepartmentDto {
  name?: string
  description?: string
  type?: DepartmentTypeName
  leadId?: string
  isActive?: boolean
}

export interface AddStaffDto {
  departmentId: string
  staffId: string
  role?: string
}

export interface DepartmentQueryParams {
  type?: DepartmentTypeName
  isActive?: boolean
  page?: number
  limit?: number
}
