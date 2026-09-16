import type { OpenAPIV3_1 } from 'openapi-types'

const json = 'application/json'

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Decknews API',
    version: 'v1',
    description: 'API HTTP do Decknews.',
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth', description: 'Criação de contas.' },
    { name: 'Status', description: 'Disponibilidade da aplicação.' },
  ],
  paths: {
    '/api/v1/auth/register': {
      post: {
        tags: ['Auth'],
        operationId: 'registerUser',
        summary: 'Cria uma conta de usuário',
        requestBody: {
          required: true,
          content: {
            [json]: { schema: { $ref: '#/components/schemas/RegisterInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Conta criada.',
            content: {
              [json]: {
                schema: {
                  $ref: '#/components/schemas/RegisterSuccessResponse',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '409': { $ref: '#/components/responses/ConflictError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        operationId: 'authenticateUser',
        summary: 'Autentica um usuário por e-mail e senha',
        requestBody: {
          required: true,
          content: {
            [json]: { schema: { $ref: '#/components/schemas/LoginInput' } },
          },
        },
        responses: {
          '200': {
            description: 'Credenciais válidas.',
            content: {
              [json]: {
                schema: { $ref: '#/components/schemas/LoginSuccessResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/ValidationError' },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        operationId: 'getCurrentUser',
        summary: 'Obtém o usuário autenticado',
        security: [{ sessionCookie: [] }],
        responses: {
          '200': {
            description: 'Usuário autenticado.',
            content: {
              [json]: {
                schema: { $ref: '#/components/schemas/LoginSuccessResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/UnauthorizedError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        operationId: 'logout',
        summary: 'Encerra a sessão atual do usuário',
        security: [{ sessionCookie: [] }],
        responses: {
          '204': {
            description: 'Sessão encerrada com sucesso.',
          },
        },
      },
    },
    '/api/v1/status': {
      get: {
        tags: ['Status'],
        operationId: 'getStatus',
        summary: 'Obtém o status detalhado da aplicação',
        responses: {
          '200': {
            description: 'Aplicação e banco de dados disponíveis.',
            content: {
              [json]: {
                schema: { $ref: '#/components/schemas/StatusResponse' },
              },
            },
          },
          '503': { $ref: '#/components/responses/ServiceUnavailableError' },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/v1/health': {
      get: {
        tags: ['Status'],
        operationId: 'getHealth',
        summary: 'Obtém o status básico da aplicação',
        responses: {
          '200': {
            description: 'Aplicação disponível.',
            content: {
              [json]: {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          '500': { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'decknews_session',
      },
    },
    schemas: {
      RegisterInput: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            minLength: 12,
            maxLength: 256,
            format: 'password',
          },
        },
      },
      LoginInput: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: {
            type: 'string',
            minLength: 1,
            maxLength: 256,
            format: 'password',
          },
        },
      },
      User: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'email', 'role', 'createdAt'],
        properties: {
          id: { type: 'string', example: '987654321012345678' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterSuccessResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['user'],
        properties: {
          user: { $ref: '#/components/schemas/User' },
        },
      },
      LoginSuccessResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['user'],
        properties: {
          user: {
            type: 'object',
            additionalProperties: false,
            required: ['id', 'name', 'email', 'role'],
            properties: {
              id: { type: 'string', example: '987654321012345678' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              role: { type: 'string', enum: ['USER', 'ADMIN'] },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            additionalProperties: false,
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
      StatusResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'updatedAt', 'database'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
          updatedAt: { type: 'string', format: 'date-time' },
          database: {
            type: 'object',
            additionalProperties: false,
            required: ['status', 'connections', 'poolLimit'],
            properties: {
              status: { type: 'string', enum: ['healthy'] },
              connections: { type: 'integer', minimum: 0 },
              poolLimit: { type: 'integer', minimum: 1 },
            },
          },
        },
      },
      HealthResponse: {
        type: 'object',
        additionalProperties: false,
        required: ['status', 'version', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
          version: { type: 'string', enum: ['v1'] },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
    responses: {
      ValidationError: {
        description: 'Dados inválidos.',
        content: {
          [json]: { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      ConflictError: {
        description: 'Conflito de recursos.',
        content: {
          [json]: { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      UnauthorizedError: {
        description: 'Credenciais inválidas.',
        content: {
          [json]: { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      InternalServerError: {
        description: 'Erro interno do servidor.',
        content: {
          [json]: { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
      ServiceUnavailableError: {
        description: 'Serviço temporariamente indisponível.',
        content: {
          [json]: { schema: { $ref: '#/components/schemas/ErrorResponse' } },
        },
      },
    },
  },
} satisfies OpenAPIV3_1.Document
