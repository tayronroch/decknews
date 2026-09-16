import { createHmac } from 'node:crypto'

import { PrismaClient } from '@prisma/client'
import * as argon2 from '@node-rs/argon2'
import { Snowflake } from '@sapphire/snowflake'

const ADMINISTRATOR_ROLE = 'Administrador'
const DEFAULT_USER_ROLE = 'Usuário'
const DECKNEWS_EPOCH = new Date('2026-01-01T00:00:00.000Z')
const ARGON2ID_ALGORITHM = 2

function requireEnvironment(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

function validateInput() {
  const name = requireEnvironment('BOOTSTRAP_ADMIN_NAME').trim()
  const email = requireEnvironment('BOOTSTRAP_ADMIN_EMAIL').trim().toLowerCase()
  const password = requireEnvironment('BOOTSTRAP_ADMIN_PASSWORD')
  const pepper = requireEnvironment('PASSWORD_PEPPER')

  if (name.length < 2 || name.length > 100)
    throw new Error('Invalid admin name')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Invalid admin email')
  if (password.length < 12 || password.length > 256)
    throw new Error('Invalid admin password')
  if (pepper.trim().length < 16) throw new Error('Invalid password pepper')

  return { name, email, password, pepper }
}

async function hashPassword(password, pepper) {
  const prepared = createHmac('sha256', pepper).update(password).digest('hex')
  return argon2.hash(prepared, {
    algorithm: ARGON2ID_ALGORITHM,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  })
}

async function main() {
  const { name, email, password, pepper } = validateInput()
  const prisma = new PrismaClient()
  const idGenerator = new Snowflake(DECKNEWS_EPOCH)

  try {
    const administrator = await prisma.role.findUnique({
      where: { name: ADMINISTRATOR_ROLE },
      select: { id: true },
    })
    const defaultRole = await prisma.role.findUnique({
      where: { name: DEFAULT_USER_ROLE },
      select: { id: true },
    })
    if (!administrator || !defaultRole)
      throw new Error('Required system roles are missing')

    let created = false
    await prisma.$transaction(async (tx) => {
      let user = await tx.user.findUnique({
        where: { email },
        select: { id: true },
      })

      if (!user) {
        const passwordHash = await hashPassword(password, pepper)
        user = await tx.user.create({
          data: {
            id: idGenerator.generate(),
            name,
            email,
            passwordHash,
            roles: { create: { roleId: defaultRole.id } },
          },
          select: { id: true },
        })
        created = true
      }

      await tx.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: administrator.id,
          },
        },
        update: {},
        create: { userId: user.id, roleId: administrator.id },
      })
    })

    console.info(
      created ? 'Administrador criado.' : 'Administrador configurado.'
    )
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(() => {
  console.error('Não foi possível configurar o administrador.')
  process.exitCode = 1
})
