// Wire-format DTOs: domain ids are 64-bit and travel as decimal strings.
export type PermissionDto = {
  id: string
  key: string
  description: string | null
  module: string | null
}

export type RoleDto = {
  id: string
  name: string
  description: string | null
  isSystem: boolean
  permissions: PermissionDto[]
}

// PATCH /api/v1/admin/roles/:id does not return the permission list.
export type RoleSummaryDto = Omit<RoleDto, 'permissions'>

export type RolePanelCapabilities = {
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canManagePermissions: boolean
}
