<p align="right">
  <a href="./error-handling.md">🇧🇷 Português</a> | <a href="../../en/architecture/error-handling.md">🇺🇸 English</a>
</p>

# Tratamento Centralizado de Erros (Error Handling)

A aplicação conta com uma infraestrutura centralizada para tratamento previsível de erros, desacoplando os erros da aplicação da camada de transporte HTTP.

---

## 1. Classes de Erro da Aplicação (`src/infra/errors/`)

- **`AppError`**: Classe abstrata que obriga a definição de `statusCode` e `code: ErrorCode` tipado via constantes (`ERROR_CODES`), além de suportar a opção nativa `cause` para rastrear a raiz do erro sem expô-la.
- **Subclasses semânticas**:
  - `ValidationError` (`400`, `VALIDATION_ERROR`)
  - `UnauthorizedError` (`401`, `UNAUTHORIZED`)
  - `ForbiddenError` (`403`, `FORBIDDEN`)
  - `NotFoundError` (`404`, `NOT_FOUND`)
  - `ConflictError` (`409`, `CONFLICT`)
  - `InternalServerError` (`500`, `INTERNAL_SERVER_ERROR`)

---

## 2. Adapter HTTP (`src/infra/http/handle-api-error.ts`)

Converte erros capturados em `try/catch` de Route Handlers em uma resposta HTTP consistente:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos"
  }
}
```

### Proteção contra vazamento de detalhes (Zero Leak)

Qualquer erro inesperado (ex.: falha de rede, erro não capturado ou exceções de infraestrutura) é logado no servidor com seu stack trace completo (`logger.error`), mas o cliente recebe apenas uma resposta HTTP 500 padronizada com mensagem segura, garantindo que dados sensíveis ou detalhes de implementação nunca vazem para o cliente.
