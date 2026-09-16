const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const roles = {
  administrator: { id: 1987654321098765001n, name: 'Administrador' },
  user: { id: 1987654321098765002n, name: 'Usuário' },
}

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

  for (const [index, [key, module, description]] of permissions.entries()) {
    await prisma.permission.upsert({
      where: { key },
      update: { module, description },
      create: {
        id: 1987654321098765100n + BigInt(index),
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
