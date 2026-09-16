export type PermissionRecord = {
  id: bigint
  key: string
  description: string | null
  module: string | null
}

export type RoleRecord = {
  id: bigint
  name: string
  description: string | null
  isSystem: boolean
  permissions: PermissionRecord[]
}
