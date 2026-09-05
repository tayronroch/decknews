import { ERROR_CODES, type ErrorCode } from './error-codes'

export abstract class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = new.target.name
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos', options?: ErrorOptions) {
    super(message, 400, ERROR_CODES.VALIDATION, options)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado', options?: ErrorOptions) {
    super(message, 401, ERROR_CODES.UNAUTHORIZED, options)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado', options?: ErrorOptions) {
    super(message, 403, ERROR_CODES.FORBIDDEN, options)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado', options?: ErrorOptions) {
    super(message, 404, ERROR_CODES.NOT_FOUND, options)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito de recursos', options?: ErrorOptions) {
    super(message, 409, ERROR_CODES.CONFLICT, options)
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor', options?: ErrorOptions) {
    super(message, 500, ERROR_CODES.INTERNAL_SERVER, options)
  }
}
