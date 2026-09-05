/**
 * @jest-environment node
 */
import {
  ConflictError,
  ERROR_CODES,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from '@/infra/errors'
import { logger } from '@/infra/logging'

import { handleApiError } from './handle-api-error'

describe('handleApiError', () => {
  beforeEach(() => {
    jest.spyOn(logger, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('converts ValidationError into 400 response with consistent format', async () => {
    const error = new ValidationError('Campo email é obrigatório')
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.VALIDATION,
        message: 'Campo email é obrigatório',
      },
    })
  })

  it('converts UnauthorizedError into 401 response', async () => {
    const error = new UnauthorizedError()
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'Não autorizado',
      },
    })
  })

  it('converts ForbiddenError into 403 response', async () => {
    const error = new ForbiddenError()
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(403)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.FORBIDDEN,
        message: 'Acesso negado',
      },
    })
  })

  it('converts NotFoundError into 404 response', async () => {
    const error = new NotFoundError('Usuário não encontrado')
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.NOT_FOUND,
        message: 'Usuário não encontrado',
      },
    })
  })

  it('converts ConflictError into 409 response', async () => {
    const error = new ConflictError('E-mail já está em uso')
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(409)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.CONFLICT,
        message: 'E-mail já está em uso',
      },
    })
  })

  it('converts InternalServerError into 500 response and logs it', async () => {
    const error = new InternalServerError()
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.INTERNAL_SERVER,
        message: 'Erro interno do servidor',
      },
    })
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('converts ServiceUnavailableError into 503 response and logs it', async () => {
    const error = new ServiceUnavailableError()
    const response = handleApiError(error)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        message: 'Serviço temporariamente indisponível',
      },
    })
    expect(logger.error).toHaveBeenCalledTimes(1)
  })

  it('masks unexpected errors with 500 without leaking stack trace, secrets or internal messages', async () => {
    const sensitiveError = new Error(
      'Connection failed: internal-db.prod.network:5432 with token s3cret_tok3n_xyz'
    )
    sensitiveError.stack =
      'Error: at Object.<anonymous> (/internal/server/secret-path.ts:42:1)'

    const response = handleApiError(sensitiveError)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.INTERNAL_SERVER,
        message: 'Erro interno do servidor',
      },
    })

    // Strict assertion: Ensure NO stack trace, secrets, or internal paths exist in the JSON response
    const jsonString = JSON.stringify(body)
    expect(jsonString).not.toContain('internal-db.prod.network')
    expect(jsonString).not.toContain('s3cret_tok3n_xyz')
    expect(jsonString).not.toContain('stack')
    expect(jsonString).not.toContain('/internal/server')

    // Ensure it was logged on the server with full details
    expect(logger.error).toHaveBeenCalledWith(sensitiveError.message, {
      error: sensitiveError,
    })
  })

  it('handles non-Error thrown objects gracefully', async () => {
    const response = handleApiError('String exception error')
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: {
        code: ERROR_CODES.INTERNAL_SERVER,
        message: 'Erro interno do servidor',
      },
    })
    expect(logger.error).toHaveBeenCalledWith('Unexpected server error', {
      error: 'String exception error',
    })
  })
})
