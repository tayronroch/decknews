<p align="right">
  <a href="./repository-pattern.md">🇧🇷 Português</a> | <a href="../../en/architecture/repository-pattern.md">🇺🇸 English</a>
</p>

# Camada de Acesso a Dados e Padrão Repository

O Decknews adota o **Repository Pattern** em uma estrutura _feature-first_ para desacoplar a camada de negócio (Services) da camada de persistência (Prisma ORM / PostgreSQL).

---

## Fluxo Unidirecional de Dependência

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

---

## Responsabilidades de Cada Camada

| Camada             | Local                                  | Responsabilidades                                                                                                                                                                     | O que NÃO deve fazer                                                                                                                  |
| :----------------- | :------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------ |
| **Service**        | `src/features/<dominio>/services/`     | • Regras de negócio do domínio<br>• Orquestração de múltiplos repositories<br>• Validações de domínio e autorização<br>• Lançamento de erros de domínio (`AppError`, `NotFoundError`) | • **NÃO** acessa o Prisma ou banco de dados diretamente<br>• **NÃO** manipula objetos HTTP (`Request`/`Response`)                     |
| **Repository**     | `src/features/<dominio>/repositories/` | • Execução de queries (CRUD, agregações, transações com `prisma`)<br>• Mapeamento de dados de persistência<br>• Retorno de dados estruturados ou `null` quando não encontrado         | • **NÃO** contém regra de negócio<br>• **NÃO** lança erros de domínio de alto nível<br>• **NÃO** importa `@prisma/client` diretamente |
| **Infra Database** | `src/infra/database/`                  | • Inicialização e configuração do Prisma Client<br>• Gerenciamento do singleton no `globalThis` para hot reload                                                                       | • **NÃO** contém repositories de domínio                                                                                              |

---

## Garantia de Fronteiras via ESLint (`no-restricted-imports`)

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

## Diretrizes e Regras de Repositories

- **Services não acessam Prisma diretamente**: toda persistência é mediada exclusivamente por Repositories.
- **Repository não contém regras de negócio**: apenas persistência, consultas e mapeamento de dados.
- **Repository retorna tipos próprios da feature**: registros são mapeados para tipos da feature (ex.: `UserRecord`) — tipos do Prisma não devem vazar para os Services.
- **Repository recebe IDs já gerados** pela camada superior: `IdGenerator.next()` é chamado no Service, nunca dentro do Repository (ver [Estratégia Global de Identificadores](./identifiers-tsid.md)).
- **Ausência de registro é representada como `null`**, nunca como exceção: a conversão de ausência para `NotFoundError` pertence ao Service.
- Exemplo de referência: `src/features/users/repositories/user.repository.ts`.
