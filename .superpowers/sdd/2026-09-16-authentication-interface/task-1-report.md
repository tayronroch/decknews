# Task 1 — Relatório de implementação

## Status

Concluída. Foi adicionada a fronteira isomórfica de cliente HTTP para autenticação, usando sessão mantida pelo cookie HttpOnly do servidor.

## Implementação

- `getSafeNext` aceita apenas destinos iniciados por `/` que não sejam protocol-relative (`//`); entradas inválidas retornam `/admin`.
- `authClient.login`, `register`, `getCurrentUser` e `logout` usam os endpoints `/api/v1/auth/*`.
- Login e registro enviam POST JSON explícito; logout envia POST e trata 204 sem tentar decodificar corpo.
- Todas as requisições usam `credentials: 'same-origin'`.
- Respostas HTTP não bem-sucedidas lançam `AuthClientError` com `statusCode` preservado.
- Não há logging, armazenamento no browser, cookies JavaScript, Server Actions ou proxy.

## Evidência TDD

- RED: `pnpm test --runInBand src/features/auth/client/auth-client.spec.ts` falhou porque `./auth-client` ainda não existia.
- GREEN: o mesmo comando passou com 4 testes, cobrindo destino seguro, payload de registro, propagação de status e endpoints de sessão.

## Verificações

- `pnpm test --runInBand src/features/auth/client/auth-client.spec.ts` — 1 suíte, 4 testes aprovados.
- `pnpm exec tsc --noEmit --pretty false` — aprovado.
- Prettier nos arquivos da tarefa — aprovado.
- `git diff --check` — aprovado.

## Arquivos

- Criado `src/features/auth/client/auth-client.ts`.
- Criado `src/features/auth/client/auth-client.spec.ts`.
- Criado `src/features/auth/client/index.ts`.
- Modificado `src/features/auth/index.ts` para exportar o cliente.

## Auto-revisão

O módulo contém somente tipos e APIs Web padrão (`fetch`, `RequestInit`), portanto pode ser importado por componentes de servidor sem executar lógica dependente de browser durante o import. O cookie de sessão não é lido nem escrito pelo cliente.

## Preocupações

O cliente atualmente propaga apenas o status HTTP em `AuthClientError`; detalhes estruturados do corpo de erro permanecem responsabilidade da camada de UI/API.
