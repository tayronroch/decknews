const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const roles = {
  administrator: { id: 1987654321098765001n, name: 'Administrador' },
  user: { id: 1987654321098765002n, name: 'Usuário' },
}

const permissions = [
  ['post.read', 'Posts'],
  ['post.create', 'Posts'],
  ['post.update.own', 'Posts'],
  ['post.update.any', 'Posts'],
  ['post.delete.own', 'Posts'],
  ['post.delete.any', 'Posts'],
  ['comment.read', 'Comentários'],
  ['comment.create', 'Comentários'],
  ['comment.delete.own', 'Comentários'],
  ['comment.delete.any', 'Comentários'],
  ['user.read', 'Usuários'],
  ['user.manage', 'Usuários'],
  ['role.read', 'Cargos'],
  ['role.create', 'Cargos'],
  ['role.update', 'Cargos'],
  ['role.delete', 'Cargos'],
  ['role.permissions.manage', 'Cargos'],
]

async function main() {
  await prisma.role.upsert({
    where: { name: roles.administrator.name },
    update: { isSystem: true },
    create: {
      ...roles.administrator,
      description: 'Cargo administrativo do sistema',
      isSystem: true,
    },
  })
  await prisma.role.upsert({
    where: { name: roles.user.name },
    update: { isSystem: true },
    create: {
      ...roles.user,
      description: 'Cargo padrão de novos usuários',
      isSystem: true,
    },
  })

  for (const [index, [key, module]] of permissions.entries()) {
    await prisma.permission.upsert({
      where: { key },
      update: { module },
      create: { id: 1987654321098765100n + BigInt(index), key, module },
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
    where: { key: { in: ['post.read', 'comment.read'] } },
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

main().finally(() => prisma.$disconnect())
