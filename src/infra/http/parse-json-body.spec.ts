/**
 * @jest-environment node
 */
import { ERROR_CODES, ValidationError } from '@/infra/errors'

import { handleApiError } from './handle-api-error'
import { parseJsonBody } from './parse-json-body'

describe('parseJsonBody', () => {
  it('successfully parses valid JSON request payload', async () => {
    const request = new Request('http://localhost:3000/api/v1/test', {
      method: 'POST',
      body: JSON.stringify({ title: 'Título Válido' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const body = await parseJsonBody(request)
    expect(body).toEqual({ title: 'Título Válido' })
  })

  it('converts malformed JSON SyntaxError into ValidationError with 400 instead of 500', async () => {
    const malformedRequest = new Request('http://localhost:3000/api/v1/test', {
      method: 'POST',
      body: '{ malformed json: true, ',
      headers: { 'Content-Type': 'application/json' },
    })

    let caughtError: unknown
    try {
      await parseJsonBody(malformedRequest)
    } catch (error) {
      caughtError = error
    }

    expect(caughtError).toBeInstanceOf(ValidationError)
    const validationError = caughtError as ValidationError

    expect(validationError.statusCode).toBe(400)
    expect(validationError.code).toBe(ERROR_CODES.VALIDATION)
    expect(validationError.message).toBe('Dados inválidos')
    expect(validationError.cause).toBeDefined()

    // Ensure it converts to HTTP 400 via handleApiError
    const response = handleApiError(caughtError)
    const jsonBody = await response.json()

    expect(response.status).toBe(400)
    expect(jsonBody).toEqual({
      error: {
        code: ERROR_CODES.VALIDATION,
        message: 'Dados inválidos',
      },
    })
  })
})
