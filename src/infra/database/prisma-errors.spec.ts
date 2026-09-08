import { Prisma } from '@prisma/client'

import { getUniqueConstraintFields } from './prisma-errors'

describe('getUniqueConstraintFields', () => {
  it('extracts array of fields from P2002 error with target array', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: ['email'] },
      }
    )

    expect(getUniqueConstraintFields(error)).toEqual(['email'])
  })

  it('extracts single field string from P2002 error with target string', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: { target: 'email' },
      }
    )

    expect(getUniqueConstraintFields(error)).toEqual(['email'])
  })

  it('returns empty array when meta.target is missing or empty on P2002', () => {
    const error = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      {
        code: 'P2002',
        clientVersion: '6.19.3',
      }
    )

    expect(getUniqueConstraintFields(error)).toEqual([])
  })

  it('returns null for known request errors with a different code', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.19.3',
    })

    expect(getUniqueConstraintFields(error)).toBeNull()
  })

  it('returns null for generic errors or non-Prisma objects', () => {
    expect(
      getUniqueConstraintFields(new Error('Generic database error'))
    ).toBeNull()
    expect(getUniqueConstraintFields(null)).toBeNull()
    expect(getUniqueConstraintFields('string error')).toBeNull()
  })
})
