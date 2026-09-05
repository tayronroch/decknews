import {
  AppError,
  ConflictError,
  ERROR_CODES,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './index'

describe('AppError hierarchy', () => {
  it('ValidationError should have status 400 and VALIDATION_ERROR code', () => {
    const error = new ValidationError()
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(400)
    expect(error.code).toBe(ERROR_CODES.VALIDATION)
    expect(error.message).toBe('Dados inválidos')
    expect(error.name).toBe('ValidationError')
  })

  it('UnauthorizedError should have status 401 and UNAUTHORIZED code', () => {
    const error = new UnauthorizedError()
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(401)
    expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED)
    expect(error.message).toBe('Não autorizado')
    expect(error.name).toBe('UnauthorizedError')
  })

  it('ForbiddenError should have status 403 and FORBIDDEN code', () => {
    const error = new ForbiddenError()
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(403)
    expect(error.code).toBe(ERROR_CODES.FORBIDDEN)
    expect(error.message).toBe('Acesso negado')
    expect(error.name).toBe('ForbiddenError')
  })

  it('NotFoundError should have status 404 and NOT_FOUND code', () => {
    const error = new NotFoundError()
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe(ERROR_CODES.NOT_FOUND)
    expect(error.message).toBe('Recurso não encontrado')
    expect(error.name).toBe('NotFoundError')
  })

  it('ConflictError should have status 409 and CONFLICT code', () => {
    const error = new ConflictError()
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(409)
    expect(error.code).toBe(ERROR_CODES.CONFLICT)
    expect(error.message).toBe('Conflito de recursos')
    expect(error.name).toBe('ConflictError')
  })

  it('InternalServerError should have status 500 and INTERNAL_SERVER_ERROR code', () => {
    const error = new InternalServerError()
    expect(error).toBeInstanceOf(AppError)
    expect(error.statusCode).toBe(500)
    expect(error.code).toBe(ERROR_CODES.INTERNAL_SERVER)
    expect(error.message).toBe('Erro interno do servidor')
    expect(error.name).toBe('InternalServerError')
  })

  it('allows custom messages for specific error instances', () => {
    const error = new NotFoundError('Post não encontrado')
    expect(error.message).toBe('Post não encontrado')
  })

  it('supports error chaining via cause option', () => {
    const rootCause = new Error('Database connection timeout')
    const error = new InternalServerError('Erro interno do servidor', {
      cause: rootCause,
    })

    expect(error.cause).toBe(rootCause)
  })
})
