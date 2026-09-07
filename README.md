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
│   └── compose.yaml                 # Configuração do PostgreSQL 17 (Docker Compose)
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

## Camada de Acesso a Dados e Padrão Repository

O Decknews adota o **Repository Pattern** em uma estrutura _feature-first_ para desacoplar a camada de negócio (Services) da camada de persistência (Prisma ORM / PostgreSQL).

### Fluxo Unidirecional de Dependência

```text
Route Handler (API) / Server Action (UI)
        ↓
     Service   (src/features/<dominio>/services/)
        ↓
   Repository  (src/features/<dominio>/repositories/)
        ↓
 infra/database (src/infra/database/ - Prisma Client Singleton)
        ↓
     Prisma
        ↓
   PostgreSQL
```

### Responsabilidades de Cada Camada

| Camada             | Local                                  | Responsabilidades                                                                                                                                                                     | O que NÃO deve fazer                                                                                                                  |
| :----------------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Service**        | `src/features/<dominio>/services/`     | • Regras de negócio do domínio<br>• Orquestração de múltiplos repositories<br>• Validações de domínio e autorização<br>• Lançamento de erros de domínio (`AppError`, `NotFoundError`) | • **NÃO** acessa o Prisma ou banco de dados diretamente<br>• **NÃO** manipula objetos HTTP (`Request`/`Response`)                     |
| **Repository**     | `src/features/<dominio>/repositories/` | • Execução de queries (CRUD, agregações, transações com `prisma`)<br>• Mapeamento de dados de persistência<br>• Retorno de dados estruturados ou `null` quando não encontrado         | • **NÃO** contém regra de negócio<br>• **NÃO** lança erros de domínio de alto nível<br>• **NÃO** importa `@prisma/client` diretamente |
| **Infra Database** | `src/infra/database/`                  | • Inicialização e configuração do Prisma Client<br>• Gerenciamento do singleton no `globalThis` para hot reload                                                                       | • **NÃO** contém repositories de domínio                                                                                              |

### Garantia de Fronteiras via ESLint (`no-restricted-imports`)

Para garantir a solidez das fronteiras arquiteturais, o projeto configura travas estritas com nível de erro (`error`) no ESLint:

1. **`@prisma/client`** é permitido **exclusivamente** em `src/infra/database/**` (e arquivos de testes). Nem mesmo repositories importam `@prisma/client` diretamente.
2. **`@/infra/database`** é permitido **exclusivamente** na camada de persistência das features (`src/features/**/repositories/**`) e testes.
3. Se qualquer **Service**, **Route Handler** ou **Componente** tentar importar o banco de dados diretamente, o ESLint quebra o check imediatamente:
   ```text
   error: '@/infra/database' import is restricted from being used.
   Acesso direto ao banco/Prisma é restrito à camada de Repositories (src/features/**/repositories/**).
   Services e Route Handlers devem consumir Repositories.
   ```

---

## Estratégia Global de Identificadores (TSID / Snowflake de 64 bits)

O Decknews adota uma estratégia centralizada de identificadores de 64 bits gerados pela aplicação (estilo TSID/Twitter Snowflake), em vez de UUIDs ou inteiros autoincrementais do banco.

### Ciclo de Representação do Identificador

```text
PostgreSQL BIGINT
       ↓
Prisma BigInt
       ↓
TypeScript bigint
       ↓
API / JSON string decimal (ex: "89930947499134976")
```

### Motivação e Decisões de Design

1. **Por que NÃO utilizar UUID como PK padrão?**
   - **Performance de Índices B-Tree**: UUID v4 aleatórios causam fragmentação contínua de páginas nos índices B-Tree do PostgreSQL, levando a alto consumo de disco e cache de memória.
   - **Tamanho de Armazenamento**: UUID consome 16 bytes (128 bits) em disco e em cada chave estrangeira indexada. O `BIGINT` consome metade (8 bytes), tornando índices e joins significativamente mais rápidos e compactos.
   - **Ordenação Natural**: IDs baseados em Snowflake/TSID possuem o timestamp nos bits mais significativos, garantindo que novas inserções ocorram no final da árvore B-Tree (evitando page splits).

2. **Por que NÃO utilizar `number` na API/JSON?**
   - No JavaScript e na especificação JSON/IEEE 754, números de ponto flutuante de precisão dupla têm precisão inteira garantida apenas até `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 \approx 9 \times 10^{15}$).
   - IDs de 64 bits ultrapassam esse limite ($2^{63} - 1 \approx 9 \times 10^{18}$). Tratar esses IDs como `number` no cliente web ou em bibliotecas JSON resultaria em corrupção silenciosa dos dígitos finais. Portanto, o tráfego externo é **sempre como string decimal**.

3. **Por que NÃO depender de sequence / AUTO_INCREMENT do PostgreSQL?**
   - Gerar o ID na camada de aplicação desacopla a criação da entidade do round-trip de persistência, permitindo conhecer o ID antes mesmo de inserir no banco.
   - Evita gargalos de contenção de sequences centralizadas em múltiplos writers futuros.

4. **Multi-instâncias e Configuração de Nós** (`TsidIdGenerator`, `src/infra/id/`):
   - **Configuração**: `workerId` e `processId` (5 bits cada, 0 a 31) são passados nas opções do construtor; o padrão é `0` para ambos quando a instância roda sem configuração explícita de nó.
   - **Limites**: `workerId` e `processId` fora do intervalo `[0, 31]`, ou `epoch` no futuro, lançam `InvalidIdGeneratorConfigError` de forma explícita e síncrona na construção — a instância nunca é criada em estado inválido.
   - **Clock rollback**: se `Date.now()` retroceder em relação ao último timestamp usado (ex.: ajuste de NTP), `next()` lança `ClockRollbackError` em vez de arriscar reuso/colisão de ID; o chamador decide como reagir (retry, alerta, etc.).
   - **Risco de colisão entre instâncias**: cada combinação `(workerId, processId)` deve ser única por instância viva simultaneamente; com 5+5 bits há espaço para até 1024 nós concorrentes. A atribuição desses valores por instância/ambiente é responsabilidade operacional (ex.: variável de ambiente por réplica) e ainda não está automatizada — hoje a aplicação roda com uma única instância usando os padrões `(0, 0)`.

5. **Uso em Paginação por Cursor**:
   - Devido à ordenação temporal intrínseca dos IDs, futuras queries de paginação por cursor (`WHERE id < :cursor ORDER BY id DESC LIMIT :limit`) podem ser feitas diretamente pela chave primária sem custo de offset.

6. **Segurança e Regras de Negócio**:
   - **IDs NÃO são mecanismo de autorização**: Mesmo que sejam difíceis de adivinhar sequencialmente em microssegundos, o sistema nunca presume segurança por obscuridade. Toda regra de autorização (ownership, roles) é validada explicitamente na camada de Service.
   - **`createdAt` continua obrigatório**: Embora o ID contenha o timestamp de geração codificado, a coluna `createdAt DateTime` permanece mandatória na modelagem para clareza em auditorias, filtros de banco e integridade de domínio.

---

## Tratamento Centralizado de Erros (Error Handling)

A aplicação conta com uma infraestrutura centralizada para tratamento previsível de erros, desacoplando os erros da aplicação da camada de transporte HTTP:

### 1. Classes de Erro da Aplicação (`src/infra/errors/`)

- **`AppError`**: Classe abstrata que obriga a definição de `statusCode` e `code: ErrorCode` tipado via constantes (`ERROR_CODES`), além de suportar a opção nativa `cause` para rastrear a raiz do erro sem expô-la.
- **Subclasses semânticas**:
  - `ValidationError` (`400`, `VALIDATION_ERROR`)
  - `UnauthorizedError` (`401`, `UNAUTHORIZED`)
  - `ForbiddenError` (`403`, `FORBIDDEN`)
  - `NotFoundError` (`404`, `NOT_FOUND`)
  - `ConflictError` (`409`, `CONFLICT`)
  - `InternalServerError` (`500`, `INTERNAL_SERVER_ERROR`)

### 2. Adapter HTTP (`src/infra/http/handle-api-error.ts`)

Converte erros capturados em `try/catch` de Route Handlers em uma resposta HTTP consistente:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos"
  }
}
```

- **Proteção contra vazamento de detalhes (Zero Leak)**: Qualquer erro inesperado (ex.: falha de rede, erro não capturado ou exceções de infraestrutura) é logado no servidor com seu stack trace completo (`logger.error`), mas o cliente recebe apenas uma resposta HTTP 500 padronizada com mensagem segura, garantindo que dados sensíveis nunca vazem para o cliente.

---

## Estratégia de Validação de Dados (Zod)

O Decknews adota o **Zod** como mecanismo padrão e mandatório para validação de contratos e dados externos.

### 1. Separação de Responsabilidades: Zod vs Services

| Mecanismo   | Responsabilidade                                  | Exemplos                                                                                                                                                                                                               |
| :---------- | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zod**     | **Validação Estrutural** (contrato de transporte) | • Tipos e formatos (string, email, número inteiro)<br>• Tamanhos mínimos/máximos (`min(3)`, `max(100)`)<br>• Rejeição de propriedades inesperadas com `.strict()`<br>• Coerção de strings em query params (`z.coerce`) |
| **Service** | **Validação de Negócio** (regras de domínio)      | • Se slug ou e-mail já existe no banco<br>• Se o usuário tem permissão para a ação<br>• Se a transição de estado é válida (DRAFT ➔ PUBLISHED)<br>• Se o autor é dono do recurso                                        |

### 2. Regras de Arquitetura de Validação

- **Validação na Borda (Edge Validation)**: Todo dado externo entra inicialmente como `unknown` e é validado no Route Handler ou Server Action. O Service **sempre** recebe dados já validados e fortemente tipados.
- **JSON Malformado vira HTTP 400**: O helper `parseJsonBody(request)` intercepta erros de sintaxe de JSON (`SyntaxError`) e os converte em `ValidationError` (`400 VALIDATION_ERROR`), impedindo que payloads malformados gerem erros 500.
- **Schemas Estritos (`.strict()`)**: Payloads externos de criação/edição devem rejeitar campos desconhecidos com `.strict()` para proteção contra _mass assignment_ (ex.: injeção indevida de `isAdmin: true` ou `role`).
- **Tipagem Derivada (`z.infer`)**: Todo schema exporta seu tipo inferido via `z.infer<typeof schema>`. Evite criar interfaces TypeScript manuais duplicadas para representar contratos de schemas Zod.
- **Organização dos Schemas**:
  - Schemas compartilhados e primitivos em `src/lib/validation/` (ex.: `paginationSchema` com coerção e limite `max(100)`).
  - Schemas de domínio em `src/features/<dominio>/schemas/` (ex.: `create-post.schema.ts`). Schemas compartilhados só devem ser criados quando houver real reutilização.

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
