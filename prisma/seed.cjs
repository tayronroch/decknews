const { createHmac } = require('node:crypto')
const argon2 = require('@node-rs/argon2')
const { Snowflake } = require('@sapphire/snowflake')
const { PrismaClient } = require('@prisma/client')

const { roles, syncRbacCatalog } = require('./rbac-catalog.cjs')

const prisma = new PrismaClient()

const DECKNEWS_EPOCH = new Date('2026-01-01T00:00:00.000Z')
const ARGON2ID_ALGORITHM = 2

async function main() {
  await syncRbacCatalog(prisma)
  await seedAdminUser()
}

async function seedAdminUser() {
  const pepper = process.env.PASSWORD_PEPPER
  if (!pepper) return

  const userCount = await prisma.user.count()
  let email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase()
  let password = process.env.BOOTSTRAP_ADMIN_PASSWORD
  let name = process.env.BOOTSTRAP_ADMIN_NAME?.trim()

  if (!email || !password) {
    if (process.env.NODE_ENV === 'production' || userCount > 0) {
      return
    }
    email = 'admin@decknews.local'
    password = 'admin123456'
    name = 'Administrador Dev'
  }

  const administrator = await prisma.role.findUnique({
    where: { name: roles.administrator.name },
    select: { id: true },
  })
  const defaultRole = await prisma.role.findUnique({
    where: { name: roles.user.name },
    select: { id: true },
  })

  if (!administrator || !defaultRole) return

  const prepared = createHmac('sha256', pepper).update(password).digest('hex')
  const passwordHash = await argon2.hash(prepared, {
    algorithm: ARGON2ID_ALGORITHM,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  })

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })

  const idGenerator = new Snowflake(DECKNEWS_EPOCH)

  let userId
  if (!existingUser) {
    const createdUser = await prisma.user.create({
      data: {
        id: idGenerator.generate(),
        name: name || 'Administrador',
        email,
        passwordHash,
        roles: {
          create: [{ roleId: defaultRole.id }, { roleId: administrator.id }],
        },
      },
      select: { id: true },
    })
    userId = createdUser.id
    console.info(`👤 Usuário administrador "${email}" criado via seed.`)
  } else {
    userId = existingUser.id
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        passwordHash,
      },
    })
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId,
          roleId: administrator.id,
        },
      },
      update: {},
      create: { userId, roleId: administrator.id },
    })
    console.info(`👤 Usuário administrador "${email}" configurado via seed.`)
  }
}

main().finally(() => prisma.$disconnect())
