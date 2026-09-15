<p align="right">
  <a href="../../pt-br/architecture/validation-zod.md">🇧🇷 Português</a> | <a href="./validation-zod.md">🇺🇸 English</a>
</p>

# Data Validation Strategy (Zod)

Decknews adopts **Zod** as its standard, mandatory engine for external data and contract validation.

---

## 1. Separation of Responsibilities: Zod vs Services

| Mechanism   | Responsibility                                 | Examples                                                                                                                                                                                          |
| :---------- | :--------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Zod**     | **Structural Validation** (transport contract) | • Types and formats (string, email, integer)<br>• Min/max lengths (`min(3)`, `max(100)`)<br>• Rejecting undeclared properties with `.strict()`<br>• Coercing query string parameters (`z.coerce`) |
| **Service** | **Business Validation** (domain rules)         | • Checking if email or slug already exists in DB<br>• Verifying user action permissions<br>• Validating state machine transitions (DRAFT ➔ PUBLISHED)<br>• Confirming resource ownership          |

---

## 2. Validation Architecture Rules

- **Edge Validation**: All external input enters as `unknown` and is validated at the Route Handler or Server Action boundary. Services **always** receive strongly-typed, pre-validated data.
- **Malformed JSON yields HTTP 400**: The `parseJsonBody(request)` helper intercepts JSON syntax errors (`SyntaxError`) and converts them into `ValidationError` (`400 VALIDATION_ERROR`), preventing malformed payloads from causing 500 errors.
- **Strict Schemas (`.strict()`)**: Mutation payloads must reject unrecognized fields using `.strict()` to prevent mass-assignment attacks (e.g., unexpected injection of `isAdmin: true` or `role`).
- **Derived Types (`z.infer`)**: Schemas always export their inferred TypeScript types via `z.infer<typeof schema>`. Avoid creating redundant manual interface definitions.
- **Schema Organization**:
  - Shared primitive schemas in `src/lib/validation/` (e.g., `paginationSchema` with coercion and `max(100)`).
  - Domain-specific schemas in `src/features/<domain>/schemas/` (e.g., `create-post.schema.ts`).

---

## 3. User registration

`POST /api/v1/auth/register` validates its body with `registerSchema` before
calling the use case. The contract accepts only `name`, `email`, and `password`:

- `name` is trimmed and must contain 2 to 100 characters;
- `email` only receives trimming and lowercasing;
- `password` must contain 12 to 256 characters and is not transformed.

The schema is strict: fields such as `id`, `role`, `passwordHash`, and timestamps
are rejected with `400 VALIDATION_ERROR`. After validation, the route delegates
creation to the service; its `201 Created` response exposes only public user
data, with the identifier serialized as a string. Registration does not start a
session.
