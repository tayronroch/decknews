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
│   │   ├── database/                # Conexão com banco de dados (Prisma client singleton, repositórios base)
│   │   ├── errors/                  # Classes de erros customizados (AppError, NotFoundError, etc.)
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

## 🛠️ Como Executar o Projeto

### Pré-requisitos

- **Node.js** `>= 20.x`
- **pnpm** `>= 9.x`

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

| Script                       | Descrição                                              |
| :--------------------------- | :----------------------------------------------------- |
| `pnpm dev`                   | Inicia o servidor Next.js em modo de desenvolvimento   |
| `pnpm build`                 | Gera o build otimizado para produção                   |
| `pnpm start`                 | Inicia o servidor de produção                          |
| `pnpm lint`                  | Executa a verificação do ESLint via Next.js            |
| `pnpm lint:check`            | Executa verificação completa de ESLint e Prettier      |
| `pnpm lint:fix`              | Corrige problemas automáticos de ESLint e Prettier     |
| `pnpm check`                 | Alias para `pnpm lint:check`                           |
| `pnpm fix`                   | Alias para `pnpm lint:fix`                             |
| `pnpm lint:secretlint:check` | Verifica possíveis vazamentos de credenciais no código |

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
