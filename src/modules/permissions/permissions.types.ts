export interface GrantPermissionDto {
  roleId: string
  resource: string
  action: string
}

export interface RevokePermissionDto {
  roleId: string
  resource: string
  action: string
}

export interface PermissionFilter {
  roleId?: string
  resource?: string
  action?: string
}

export interface AssignRoleDto {
  staffId: string
  roleName: string
  assignedBy?: string
}
