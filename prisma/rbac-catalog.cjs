// Single source of truth for the RBAC catalog (roles, permissions and the
// default role→permission mappings). Both the development seed (`seed.cjs`) and
// the production bootstrap (`infra/scripts/bootstrap-admin.mjs`) consume this so
// they can never drift out of sync. System role IDs and the permission ID base
// are pre-generated TSIDs kept stable for migration/seed idempotency.

const ADMINISTRATOR_ROLE = 'Administrador'
const DEFAULT_USER_ROLE = 'Usuário'

const roles = {
  administrator: {
    id: 1987654321098765001n,
    name: ADMINISTRATOR_ROLE,
    description: 'Cargo administrativo do sistema',
  },
  user: {
    id: 1987654321098765002n,
    name: DEFAULT_USER_ROLE,
    description: 'Cargo padrão de novos usuários',
  },
}

const PERMISSION_ID_BASE = 1987654321098765100n

const permissions = [
  ['post.read', 'Posts', 'Visualizar postagens'],
  ['post.create', 'Posts', 'Criar postagens'],
  ['post.update.own', 'Posts', 'Editar próprias postagens'],
  ['post.update.any', 'Posts', 'Editar qualquer postagem'],
  ['post.delete.own', 'Posts', 'Excluir próprias postagens'],
  ['post.delete.any', 'Posts', 'Excluir qualquer postagem'],
  ['comment.read', 'Comentários', 'Visualizar comentários'],
  ['comment.create', 'Comentários', 'Criar comentários'],
  ['comment.delete.own', 'Comentários', 'Excluir próprios comentários'],
  ['comment.delete.any', 'Comentários', 'Excluir qualquer comentário'],
  ['user.read', 'Usuários', 'Visualizar usuários'],
  ['user.manage', 'Usuários', 'Gerenciar usuários'],
  ['role.read', 'Cargos', 'Visualizar cargos'],
  ['role.create', 'Cargos', 'Criar cargos'],
  ['role.update', 'Cargos', 'Editar cargos'],
  ['role.delete', 'Cargos', 'Excluir cargos'],
  ['role.permissions.manage', 'Cargos', 'Gerenciar permissões de cargos'],
]

const DEFAULT_USER_PERMISSION_KEYS = ['post.read', 'comment.read']

// Idempotently provisions the system roles, the permission catalog and the
// default role→permission mappings. Accepts any Prisma client (or transaction).
async function syncRbacCatalog(prisma) {
  await prisma.role.upsert({
    where: { name: roles.administrator.name },
    update: { isSystem: true },
    create: { ...roles.administrator, isSystem: true },
  })
  await prisma.role.upsert({
    where: { name: roles.user.name },
    update: { isSystem: true },
    create: { ...roles.user, isSystem: true },
  })

  for (const [index, [key, module, description]] of permissions.entries()) {
    await prisma.permission.upsert({
      where: { key },
      update: { module, description },
      create: {
        id: PERMISSION_ID_BASE + BigInt(index),
        key,
        module,
        description,
      },
    })
  }

  const allPermissions = await prisma.permission.findMany({
    select: { id: true },
  })
  await prisma.rolePermission.deleteMany({
    where: { roleId: roles.administrator.id },
  })
  await prisma.rolePermission.createMany({
    data: allPermissions.map((permission) => ({
      roleId: roles.administrator.id,
      permissionId: permission.id,
    })),
  })

  const userPermissions = await prisma.permission.findMany({
    where: { key: { in: DEFAULT_USER_PERMISSION_KEYS } },
    select: { id: true },
  })
  await prisma.rolePermission.deleteMany({ where: { roleId: roles.user.id } })
  await prisma.rolePermission.createMany({
    data: userPermissions.map((permission) => ({
      roleId: roles.user.id,
      permissionId: permission.id,
    })),
  })
}

module.exports = {
  ADMINISTRATOR_ROLE,
  DEFAULT_USER_ROLE,
  roles,
  PERMISSION_ID_BASE,
  permissions,
  DEFAULT_USER_PERMISSION_KEYS,
  syncRbacCatalog,
}
