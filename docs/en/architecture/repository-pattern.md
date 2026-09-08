<p align="right">
  <a href="../../pt-br/architecture/repository-pattern.md">🇧🇷 Português</a> | <a href="./repository-pattern.md">🇺🇸 English</a>
</p>

# Data Access Layer and Repository Pattern

Decknews adopts the **Repository Pattern** in a _feature-first_ structure to decouple business logic (Services) from the persistence layer (Prisma ORM / PostgreSQL).

---

## Unidirectional Dependency Flow

```text
Route Handler (API) / Server Action (UI)
        ↓
     Service   (src/features/<domain>/services/)
        ↓
   Repository  (src/features/<domain>/repositories/)
        ↓
 infra/database (src/infra/database/ - Prisma Client Singleton)
        ↓
     Prisma
        ↓
    PostgreSQL
```

---

## Layer Responsibilities

| Layer              | Location                              | Responsibilities                                                                                                                                                                  | What it MUST NOT do                                                                                                                       |
| :----------------- | :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| **Service**        | `src/features/<domain>/services/`     | • Domain business rules<br>• Orchestration across multiple repositories<br>• Domain validation and authorization checks<br>• Throwing domain errors (`AppError`, `NotFoundError`) | • **MUST NOT** access Prisma or the database directly<br>• **MUST NOT** handle HTTP objects (`Request`/`Response`)                        |
| **Repository**     | `src/features/<domain>/repositories/` | • Query execution (CRUD, aggregations, transactions via `prisma`)<br>• Persistence data mapping<br>• Returning structured domain records or `null` when not found                 | • **MUST NOT** contain business logic<br>• **MUST NOT** throw high-level domain errors<br>• **MUST NOT** import `@prisma/client` directly |
| **Infra Database** | `src/infra/database/`                 | • Initialization and configuration of the Prisma Client<br>• Managing the singleton on `globalThis` for hot reload                                                                | • **MUST NOT** contain domain repositories                                                                                                |

---

## Boundary Enforcement via ESLint (`no-restricted-imports`)

To guarantee strict architectural boundaries, the project enforces lint rules with `error` severity:

1. **`@prisma/client`** is allowed **exclusively** in `src/infra/database/**` (and test files). Repositories do not import `@prisma/client` directly.
2. **`@/infra/database`** is allowed **exclusively** in the feature persistence layer (`src/features/**/repositories/**`) and test files.
3. If any **Service**, **Route Handler**, or **Component** attempts to import the database client directly, ESLint fails immediately:
   ```text
   error: '@/infra/database' import is restricted from being used.
   Direct database/Prisma access is restricted to the Repositories layer (src/features/**/repositories/**).
   Services and Route Handlers must consume Repositories.
   ```

---

## Repository Guidelines and Rules

- **Services never access Prisma directly**: all persistence operations are mediated exclusively through Repositories.
- **Repositories contain no business rules**: limited strictly to persistence, queries, and data mapping.
- **Repositories return feature-owned types**: persistence records are mapped to feature types (e.g., `UserRecord`) — Prisma types must never leak to Services.
- **Repositories receive pre-generated IDs**: `IdGenerator.next()` is called in the Service layer, never inside the Repository (see [Global Identifier Strategy](./identifiers-tsid.md)).
- **Absence of a record is represented as `null`**, never as an exception: translating absence into a `NotFoundError` belongs to the Service layer.
- Reference implementation: `src/features/users/repositories/user.repository.ts`.
