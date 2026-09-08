<p align="right">
  <a href="./README.md">🇧🇷 Português</a> | <a href="./README.en.md">🇺🇸 English</a>
</p>

# Decknews (MiniBlog)

Foundation of the **MiniBlog** application, developed with **Next.js**, **React**, and **TypeScript**, initially structured under a modular monolithic architecture focused on high cohesion, low coupling, and clear boundaries between shared infrastructure and domain-specific code.

---

## Technologies and Tools

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React](https://react.dev/)
- **ORM / Database**: [Prisma ORM](https://www.prisma.io/) (PostgreSQL)
- **Validation**: [Zod](https://zod.dev/)
- **Code Standards**: ESLint, Prettier, and EditorConfig
- **Git Hooks & Quality**: Husky, Commitlint (Conventional Commits), and Secretlint

---

## Directory Structure and Responsibilities

The application adopts a modular organization where domain code (`features`) is isolated from shared components (`components`), utility functions (`lib`), infrastructure adapters (`infra`), and routes (`app`).

```text
decknews/
├── config/                          # Shared configuration packages
│   ├── eslint-config/               # ESLint rules and plugins (@decknews/eslint-config)
│   ├── prettier/                    # Prettier formatting rules (@decknews/prettier)
│   └── typescript-config/           # Base TypeScript configurations (@decknews/tsconfig)
│
├── infra/                           # Local orchestration and service scripts
│   ├── scripts/                     # Automation scripts (wait-for-postgres, dev)
│   └── compose.yaml                 # PostgreSQL 17 configuration (Docker Compose)
│
├── prisma/                          # Database schema modeling and migrations
│   └── schema.prisma
│
├── src/
│   ├── app/                         # Pages and routes (Next.js App Router)
│   │   ├── (public)/                # Public blog routes (home, public posts)
│   │   ├── admin/                   # Administrative panel and routes
│   │   ├── api/                     # Internal API routes
│   │   │   └── v1/                  # Versioned API (v1)
│   │   │       └── health/          # Status and health check endpoint
│   │   ├── globals.css              # Global styles
│   │   └── layout.tsx               # Root Layout
│   │
│   ├── components/                  # Shared reusable components
│   │   ├── ui/                      # Atomic/generic UI components (Button, Input, Modal)
│   │   └── layout/                  # Structural layout components (Header, Footer, Sidebar)
│   │
│   ├── features/                    # Isolated business domains
│   │   ├── auth/                    # Authentication and session management
│   │   ├── comments/                # Comments domain
│   │   ├── posts/                   # Publications and articles domain
│   │   └── users/                   # Users and profiles domain
│   │
│   ├── infra/                       # External adapters, integrations, and infrastructure
│   │   ├── database/                # Centralized database client (Prisma singleton)
│   │   ├── errors/                  # Custom typed error hierarchy (AppError, etc.)
│   │   ├── http/                    # HTTP adapters and error formatters (handleApiError)
│   │   ├── logging/                 # Structured logging implementation
│   │   └── mail/                    # Email delivery adapters and stubs
│   │
│   ├── lib/                         # Pure utility helpers and shared utilities
│   │   ├── constants/               # Global application constants
│   │   ├── utils/                   # Pure utility functions (slugify, formatters, etc.)
│   │   └── validation/              # Shared schemas and validation helpers
│   │
│   └── types/                       # Global type definitions and interfaces
│
├── .editorconfig                    # Encoding, newline, and indentation standards
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignored files and directories
├── .husky/                          # Git hooks (pre-commit, commit-msg)
├── .npmrc                           # pnpm package manager settings
├── .prettierrc.cjs                  # Prettier config pointing to config/prettier
├── commitlint.config.cjs            # Commit message validation
├── eslint.config.mjs                # ESLint configuration
├── package.json                     # Scripts and project dependencies
├── pnpm-workspace.yaml              # Monorepo workspace configuration
├── tsconfig.json                    # TypeScript configuration with @/* alias
└── turbo.json                       # Turborepo pipeline configuration
```

---

## Domain Organization Pattern (`features/*`)

Each domain inside `src/features/<domain>` is self-contained and encapsulates its own logic:

- **`components/`**: React components exclusive to the domain (e.g., `PostCard`, `CommentList`).
- **`services/`**: Application use cases and business rules (e.g., `CreatePostService`, `PublishPostService`).
- **`repositories/`**: Domain-specific data access abstractions and implementations.
- **`schemas/`**: Zod input validation schemas, DTOs, and domain forms.
- **`types/`**: TypeScript types and contracts specific to the domain.

> **Isolation Rule**: Business-agnostic shared code belongs in `src/lib/` or `src/components/ui/`. Code belonging to a specific business context must reside in its corresponding folder inside `src/features/`.

---

## Architecture and Technical Decisions

Detailed architectural decisions and patterns are documented in [`docs/en/architecture/`](./docs/en/architecture/):

- [**Repository Pattern & Data Access**](./docs/en/architecture/repository-pattern.md): Unidirectional dependency flow (`Route` ➔ `Service` ➔ `Repository` ➔ `Prisma`), layer responsibilities, and boundary enforcement via ESLint (`no-restricted-imports`).
- [**Global Identifier Strategy (64-bit TSID / Snowflake)**](./docs/en/architecture/identifiers-tsid.md): 64-bit layout, design rationale (B-Tree efficiency, compact joins and indexes), string serialization in API responses, cursor pagination, and node configuration.
- [**Centralized Error Handling**](./docs/en/architecture/error-handling.md): Typed error hierarchy with `AppError`, HTTP response adapter (`handleApiError`), and Zero Detail Leakage in production.
- [**Data Validation Strategy (Zod)**](./docs/en/architecture/validation-zod.md): Edge validation with `parseJsonBody`, mass assignment protection (`.strict()`), inferred types (`z.infer`), and clean boundary separation between transport and business rules.

---

## 🛠️ Getting Started

### Prerequisites

- **Node.js** `>= 24.x LTS`
- **pnpm** `>= 10.x`

### 1. Clone and Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example file and adjust values as needed:

```bash
cp .env.example .env
```

### 3. Generate Prisma Client

```bash
pnpm prisma generate
```

### 4. Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### 5. Production Build

```bash
pnpm build
pnpm start
```

---

## Code Quality Scripts

| Script                        | Description                                                                 |
| :---------------------------- | :-------------------------------------------------------------------------- |
| `pnpm dev`                    | Starts database services, waits for connection, and launches Next.js in dev |
| `pnpm services:up`            | Starts supporting Docker containers (PostgreSQL 17)                         |
| `pnpm services:down`          | Stops and removes supporting containers and networks                        |
| `pnpm services:stop`          | Stops containers without removing persistent data                           |
| `pnpm services:wait:database` | Waits until PostgreSQL is ready to accept connections                       |
| `pnpm build`                  | Generates optimized production build                                        |
| `pnpm start`                  | Starts production server                                                    |
| `pnpm lint`                   | Runs static analysis with ESLint                                            |
| `pnpm format`                 | Formats project code with Prettier                                          |
| `pnpm typecheck`              | Executes TypeScript type checking (`tsc --noEmit`)                          |
| `pnpm lint:check`             | Complete check with ESLint and Prettier                                     |
| `pnpm lint:fix`               | Automatically fixes ESLint and Prettier issues                              |
| `pnpm check`                  | Alias for `pnpm lint:check && pnpm lint:secretlint:check && pnpm typecheck` |
| `pnpm fix`                    | Alias for `pnpm lint:fix`                                                   |
| `pnpm lint:secretlint:check`  | Scans codebase for credential leaks                                         |
| `pnpm test`                   | Runs automated test suite with Jest                                         |
| `pnpm test:watch`             | Runs Jest in interactive watch mode                                         |
| `pnpm test:cov`               | Runs tests with coverage report                                             |
| `pnpm update:check`           | Checks available dependency updates grouped by type                         |
| `pnpm update:patch`           | Applies patch updates                                                       |
| `pnpm update:minor`           | Applies minor and patch updates                                             |
| `pnpm update:major`           | Interactive major version update                                            |
| `pnpm update:interactive`     | Interactive dependency selection (`ncu -i`)                                 |
| `pnpm update-dev`             | Alias for `pnpm update:interactive`                                         |

---

## ✅ Acceptance Criteria Met

- [x] Base structure established
- [x] Directory responsibilities documented
- [x] Shared code separated from domain code
- [x] `features` directory created (`posts`, `users`, `auth`, `comments`)
- [x] `lib` directory created (`validation`, `utils`, `constants`)
- [x] `components` directory created (`ui`, `layout`)
- [x] Versioned API directory created (`src/app/api/v1/`)
- [x] Core infrastructure configured (`infra/database`, `errors`, `mail`, `logging`)
- [x] Project architecture documented
- [x] Next.js configured with App Router and TypeScript
- [x] Alias `@/*` pointing to `./src/*`
- [x] `.gitignore` configured
- [x] `dev` and `build` scripts operational
