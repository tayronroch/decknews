/**
 * @jest-environment node
 */
import { prisma } from '@/infra/database'
import { UniqueConstraintError } from '@/shared/errors/persistence'

import { createUser } from './user.repository'

describe('UserRepository (Integration)', () => {
  const testEmail = `integration-collision-${Date.now()}@example.com`
  const firstId = 918273645102938475n
  const secondId = 918273645102938476n

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testEmail },
    })
    await prisma.$disconnect()
  })

  it('translates real PostgreSQL unique constraint violation on email to UniqueConstraintError', async () => {
    // 1. Cria o primeiro usuário
    await createUser({
      id: firstId,
      name: 'First User',
      email: testEmail,
      passwordHash: 'hash-1',
    })

    // 2. Tenta criar o segundo com o mesmo e-mail (provoca P2002 real no banco)
    let thrownError: unknown = null
    try {
      await createUser({
        id: secondId,
        name: 'Second User',
        email: testEmail,
        passwordHash: 'hash-2',
      })
    } catch (error) {
      thrownError = error
    }

    // 3. Valida que foi traduzido para UniqueConstraintError com campo email
    expect(thrownError).toBeInstanceOf(UniqueConstraintError)
    const constraintError = thrownError as UniqueConstraintError
    expect(constraintError.fields).toContain('email')
  })
})
