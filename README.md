<p align="right">
  <a href="./README.md">🇧🇷 Português</a> | <a href="./README.en.md">🇺🇸 English</a>
</p>

# Decknews (MiniBlog)

Fundação da aplicação do **MiniBlog**, desenvolvida com **Next.js**, **React** e **TypeScript**, estruturada inicialmente sob uma arquitetura monolítica modular com foco em alta coesão, baixo acoplamento e separação clara entre código compartilhado e código de domínio.

---

## Tecnologias e Ferramentas

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Biblioteca de UI**: [React](https://react.dev/)
- **ORM / Banco de Dados**: [Prisma ORM](https://www.prisma.io/) (PostgreSQL)
- **Validação**: [Zod](https://zod.dev/)
- **Padronização de Código**: ESLint, Prettier e EditorConfig
- **Git Hooks & Qualidade**: Husky, Commitlint (Conventional Commits) e Secretlint

---

## Estrutura de Pastas e Responsabilidades

A aplicação adota uma organização modular onde o código de domínio (`features`) é isolado de componentes compartilhados (`components`), utilitários (`lib`), adaptadores de infraestrutura (`infra`) e rotas (`app`).

```text
decknews/
├── config/                          # Pacotes compartilhados de configuração
│   ├── eslint-config/               # Regras e plugins ESLint (@decknews/eslint-config)
│   ├── prettier/                    # Regras de formatação (@decknews/prettier)
│   └── typescript-config/           # Configurações base do TypeScript (@decknews/tsconfig)
│
├── infra/                           # Orquestração local e scripts de serviços
│   ├── scripts/                     # Scripts de automação (wait-for-postgres, dev)
│   ├── compose.yaml                 # Aplicação Next.js em container (produção)
│   └── database.compose.yaml        # PostgreSQL 17 para desenvolvimento local
│
├── prisma/                          # Modelagem do banco de dados e migrações
│   └── schema.prisma
│
├── src/
│   ├── app/                         # Rotas e páginas (Next.js App Router)
│   │   ├── (public)/                # Rotas públicas do blog (home, posts públicos)
│   │   ├── admin/                   # Painel e rotas administrativas
│   │   ├── api/                     # Rotas da API interna
│   │   │   └── v1/                  # API versionada (v1)
│   │   │       └── health/          # Endpoint de verificação de status
│   │   ├── globals.css              # Estilos globais
│   │   └── layout.tsx               # Root Layout da aplicação
│   │
│   ├── components/                  # Componentes reutilizáveis compartilhados
│   │   ├── ui/                      # Componentes visuais atômicos/genéricos (Button, Input, Modal)
│   │   └── layout/                  # Componentes estruturais (Header, Footer, Sidebar)
│   │
│   ├── features/                    # Domínios de negócio isolados
│   │   ├── auth/                    # Autenticação e controle de sessão
│   │   ├── comments/                # Domínio de comentários
│   │   ├── posts/                   # Domínio de publicações e artigos
│   │   └── users/                   # Domínio de usuários e perfis
│   │
│   ├── infra/                       # Adaptadores externos, integrações e infraestrutura
│   │   ├── database/                # Conexão e cliente centralizado do banco de dados (Prisma singleton)
│   │   ├── errors/                  # Hierarquia de erros customizados e tipados (AppError, etc.)
│   │   ├── http/                    # Adapters e formatadores HTTP (handleApiError)
│   │   ├── logging/                 # Implementação de logger estruturado
│   │   └── mail/                    # Serviços e adaptadores de envio de e-mail
│   │
│   ├── lib/                         # Utilitários puros e auxiliares compartilhados
│   │   ├── constants/               # Constantes globais do sistema
│   │   ├── utils/                   # Funções utilitárias puras (formatação, slugify, etc.)
│   │   └── validation/              # Schemas e helpers de validação compartilhados
│   │
│   └── types/                       # Definições de tipos e interfaces globais
│
├── .editorconfig                    # Padronização de encoding, quebra de linha e indentação
├── .env.example                     # Modelo de variáveis de ambiente
├── .gitignore                       # Arquivos e pastas ignorados pelo Git
├── .husky/                          # Git hooks (pre-commit, commit-msg)
├── .npmrc                           # Configurações do gerenciador pnpm
├── .prettierrc.cjs                  # Configuração do Prettier apontando para config/prettier
├── commitlint.config.cjs            # Validação de mensagens de commit
├── eslint.config.mjs                # Configuração do ESLint
├── package.json                     # Scripts e dependências do projeto
├── pnpm-workspace.yaml              # Definição de workspace do monorepo/pacotes
├── tsconfig.json                    # Configuração TypeScript com alias @/*
└── turbo.json                       # Configuração de pipelines do Turborepo
```

---

## Padrão de Organização dos Domínios (`features/*`)

Cada domínio dentro de `src/features/<dominio>` é autossuficiente e encapsula sua própria lógica:

- **`components/`**: Componentes React exclusivos do domínio (ex.: `PostCard`, `CommentList`).
- **`services/`**: Casos de uso e regras de negócio da aplicação (ex.: `CreatePostService`, `PublishPostService`).
- **`repositories/`**: Abstrações e implementações de acesso a dados específicos do domínio.
- **`schemas/`**: Schemas Zod de validação de entrada, DTOs e formulários do domínio.
- **`types/`**: Tipagens e contratos TypeScript específicos do domínio.

> **Regra de Isolamento**: Código compartilhado e agnóstico de regra de negócio deve permanecer em `src/lib/` ou `src/components/ui/`. Código que pertence a um contexto de negócio específico deve residir em sua respectiva pasta em `src/features/`.

---

## Arquitetura e Decisões Técnicas

As decisões e padrões arquiteturais do sistema estão documentados em detalhes na pasta [`docs/pt-br/architecture/`](./docs/pt-br/architecture/):

- [**Padrão Repository & Acesso a Dados**](./docs/pt-br/architecture/repository-pattern.md): Fluxo unidirecional de dependência (`Route` ➔ `Service` ➔ `Repository` ➔ `Prisma`), responsabilidades das camadas e garantia de fronteiras via ESLint (`no-restricted-imports`).
- [**Estratégia Global de Identificadores (TSID / Snowflake de 64 bits)**](./docs/pt-br/architecture/identifiers-tsid.md): Estrutura de 64 bits, motivações de design (B-Tree, joins, índices compactos), transporte como string na API, suporte a cursor pagination e configuração de nós.
- [**Armazenamento e Hashing Seguro de Senhas (Argon2id + Pepper)**](./docs/pt-br/architecture/password-hashing.md): Pipeline criptográfico HMAC-SHA-256 + Argon2id com parâmetros OWASP (64 MiB), defesa em profundidade com pepper secreto fora do banco, rotação zero-downtime (`verifyWithRehash`) e política Zero Leak.
- [**Tratamento Centralizado de Erros**](./docs/pt-br/architecture/error-handling.md): Hierarquia de erros com `AppError`, conversor HTTP (`handleApiError`) e proteção contra vazamento de detalhes internos (Zero Leak).
- [**Estratégia de Validação de Dados (Zod)**](./docs/pt-br/architecture/validation-zod.md): Validação na borda com `parseJsonBody`, proteção contra _mass assignment_ (`.strict()`), tipos derivados (`z.infer`) e separação clara entre validação estrutural e regras de negócio.

---

## 🛠️ Como Executar o Projeto

### Pré-requisitos

- **Node.js** `>= 24.x LTS`
- **pnpm** `>= 10.x`

### 1. Clonar e Instalar Dependências

```bash
pnpm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e ajuste os valores conforme necessário:

```bash
cp .env.example .env
```

### 3. Gerar o Cliente do Prisma

```bash
pnpm prisma generate
```

### 4. Executar em Modo de Desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

### 5. Build para Produção

```bash
pnpm build
pnpm start
```

---

## Scripts de Qualidade de Código

| Script                        | Descrição                                                   |
| :---------------------------- | :---------------------------------------------------------- |
| `pnpm dev`                    | Sobe o banco, aguarda conexões e inicia Next.js em dev      |
| `pnpm services:up`            | Inicia os containers Docker de suporte (PostgreSQL 17)      |
| `pnpm services:down`          | Para e remove os containers e redes de suporte              |
| `pnpm services:stop`          | Para a execução dos containers sem remover os dados         |
| `pnpm services:wait:database` | Aguarda o PostgreSQL estar pronto para aceitar conexões     |
| `pnpm app:up`                 | Gera e inicia o container da aplicação em modo produção     |
| `pnpm app:down`               | Para e remove o container da aplicação                      |
| `pnpm build`                  | Gera o build otimizado para produção                        |
| `pnpm start`                  | Inicia o servidor de produção                               |
| `pnpm lint`                   | Executa a verificação estática com ESLint                   |
| `pnpm format`                 | Formata o código do projeto com Prettier                    |
| `pnpm typecheck`              | Executa a verificação de tipos do TypeScript (tsc --noEmit) |
| `pnpm lint:check`             | Executa verificação completa de ESLint e Prettier           |
| `pnpm lint:fix`               | Corrige problemas automáticos de ESLint e Prettier          |
| `pnpm check`                  | Alias para `pnpm lint:check`                                |
| `pnpm fix`                    | Alias para `pnpm lint:fix`                                  |
| `pnpm lint:secretlint:check`  | Verifica possíveis vazamentos de credenciais no código      |
| `pnpm test`                   | Executa os testes automatizados com Jest                    |
| `pnpm test:watch`             | Executa o Jest em modo watch interativo                     |
| `pnpm test:cov`               | Executa os testes com relatório de cobertura de código      |
| `pnpm update:check`           | Visualiza atualizações disponíveis agrupadas por gravidade  |
| `pnpm update:patch`           | Aplica apenas atualizações de correção de bugs (patch)      |
| `pnpm update:minor`           | Aplica atualizações retrocompatíveis (minor e patch)        |
| `pnpm update:major`           | Atualização interativa focada em grandes versões (major)    |
| `pnpm update:interactive`     | Interface interativa para selecionar dependências (ncu -i)  |
| `pnpm update-dev`             | Alias para `pnpm update:interactive`                        |

### Execução em container

`pnpm app:up` usa `infra/compose.yaml` e inicia apenas a aplicação Next.js. A
conexão de banco é fornecida por `DATABASE_URL` no arquivo `.env`, portanto deve
apontar para uma instância PostgreSQL já acessível pelo container.

Em produção, a aplicação força `sslmode=require` na conexão PostgreSQL. A URL
deve usar um host acessível pelo container e, se o provedor exigir certificados
específicos, eles também devem ser disponibilizados ao container.

O banco de desenvolvimento é isolado em `infra/database.compose.yaml` e continua
sendo iniciado automaticamente por `pnpm dev`; não faz parte do Compose da
aplicação.

O Compose da aplicação verifica sua disponibilidade em `/api/v1/health`. Essa
sonda não depende do banco de dados; a disponibilidade da conexão PostgreSQL é
exposta separadamente em `/api/v1/status`.

### Migrações remotas (`/api/v1/admin/migrations`)

Como o container de produção não expõe shell por padrão em todo provedor, as
migrações do Prisma podem ser inspecionadas e aplicadas remotamente por essa
rota, protegida por um token dedicado (`MIGRATION_TOKEN`, configurado no
`.env` — ver `.env.example`):

```bash
# Inspeciona o status das migrações (dry-run, não altera o banco)
curl https://<host>/api/v1/admin/migrations \
  --header "Authorization: Bearer $MIGRATION_TOKEN"

# Aplica as migrações pendentes (equivalente a `prisma migrate deploy`)
curl --request POST https://<host>/api/v1/admin/migrations \
  --header "Authorization: Bearer $MIGRATION_TOKEN"
```

O `GET` retorna `status: "up_to_date" | "pending"`; o `POST` retorna
`status: "success"` quando todas as migrações são aplicadas. Erros (token
ausente/inválido, migração já em andamento, falha do Prisma) vêm no formato
`{ "error": string, "message": string, "details"?: string }` — ver o schema
`MigrationErrorResponse` na [documentação da API](./src/infra/docs/openapi-spec.ts).

### Criação do usuário administrador (`bootstrap-admin.mjs`)

O primeiro usuário com papel de administrador não é criado por nenhuma rota
HTTP — é um script de uso único (`infra/scripts/bootstrap-admin.mjs`) que deve
ser executado dentro do container da aplicação, com acesso direto ao banco.

Pré-requisito: as migrações já devem estar aplicadas (seção acima), pois é a
migração `..._replace_user_role_with_rbac` que cria os papéis `Administrador`
e `Usuário` usados pelo script.

```bash
# Acessando o shell do container em produção
docker exec -it <container> sh

# Dentro do container, defina as variáveis do admin e rode o script
export BOOTSTRAP_ADMIN_NAME="Seu Nome"
export BOOTSTRAP_ADMIN_EMAIL="seu-email@exemplo.com"
export BOOTSTRAP_ADMIN_PASSWORD="senha-com-12-a-256-caracteres"
node infra/scripts/bootstrap-admin.mjs
```

O script é idempotente: se o usuário já existir pelo e-mail, apenas garante o
papel de `Administrador` (não recria nem altera a senha). Ele imprime
`Administrador criado.` ou `Administrador configurado.` em caso de sucesso.
As variáveis `BOOTSTRAP_ADMIN_*` são de uso único — não é necessário mantê-las
no `.env` do container após a execução.

---

## ✅ Critérios de Aceite Atendidos

- [x] Estrutura base criada
- [x] Responsabilidades dos diretórios documentadas
- [x] Código compartilhado separado de código específico de domínio
- [x] Diretório `features` criado (`posts`, `users`, `auth`, `comments`)
- [x] Diretório `lib` criado (`validation`, `utils`, `constants`)
- [x] Diretório `components` criado (`ui`, `layout`)
- [x] Diretório para API versionada criado (`src/app/api/v1/`)
- [x] Infraestrutura base configurada (`infra/database`, `errors`, `mail`, `logging`)
- [x] Estrutura documentada no projeto
- [x] Next.js configurado com App Router e TypeScript
- [x] Alias `@/*` apontando para `./src/*`
- [x] `.gitignore` configurado
- [x] Scripts `dev` e `build` operacionais
