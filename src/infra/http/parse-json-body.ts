import { ValidationError } from '@/infra/errors'

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch (error) {
    throw new ValidationError('Dados inválidos', { cause: error })
  }
}
