<p align="right">
  <a href="../../pt-br/architecture/error-handling.md">🇧🇷 Português</a> | <a href="./error-handling.md">🇺🇸 English</a>
</p>

# Centralized Error Handling

The application provides a centralized infrastructure for predictable error management, completely decoupling internal application errors from the HTTP transport layer.

---

## 1. Application Error Classes (`src/infra/errors/`)

- **`AppError`**: Abstract base class requiring `statusCode` and typed `code: ErrorCode` from `ERROR_CODES`, supporting the native `cause` option for tracking underlying root causes without leaking them to callers.
- **Semantic Subclasses**:
  - `ValidationError` (`400`, `VALIDATION_ERROR`)
  - `UnauthorizedError` (`401`, `UNAUTHORIZED`)
  - `ForbiddenError` (`403`, `FORBIDDEN`)
  - `NotFoundError` (`404`, `NOT_FOUND`)
  - `ConflictError` (`409`, `CONFLICT`)
  - `InternalServerError` (`500`, `INTERNAL_SERVER_ERROR`)

---

## 2. HTTP Adapter (`src/infra/http/handle-api-error.ts`)

Converts exceptions caught in Route Handler `try/catch` blocks into a consistent JSON response:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid data provided"
  }
}
```

### Zero Detail Leakage (Zero Leak)

Any unexpected exception (e.g., database network failure, unhandled runtime error) is logged on the server with its complete stack trace via `logger.error`, while the HTTP client receives only a standardized 500 response with a generic, safe message — preventing sensitive infrastructure details or credentials from ever leaking externally.
