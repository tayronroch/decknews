<p align="right">
  <a href="./password-hashing.md">🇧🇷 Português</a> | <a href="../../en/architecture/password-hashing.md">🇺🇸 English</a>
</p>

# Armazenamento e Hashing Seguro de Senhas (Argon2id + Pepper)

O Decknews adota uma arquitetura de segurança multicamadas para armazenamento e verificação de senhas, combinando **Argon2id** (o algoritmo vencedor do Password Hashing Competition e recomendado pela OWASP) com um segredo simétrico da aplicação (**Pepper**) via **HMAC-SHA-256**.

---

## Fluxo Criptográfico Unidirecional

O pipeline de hashing e verificação garante que senhas em texto puro nunca sejam diretamente submetidas ao algoritmo de hash ou expostas na infraestrutura:

```text
Senha em texto puro
         │
         ▼
HMAC-SHA-256 (chave = pepper secreto da aplicação)
         │
         ▼
Argon2id + salt aleatório (gerado automaticamente)
         │
         ▼
passwordHash ($argon2id$v=19$m=65536,t=3,p=1$...)
         │
         ▼
PostgreSQL (users.passwordHash)
```

### Detalhamento das Etapas:

1. **Pre-hashing com HMAC-SHA-256 (Pepper)**:
   - A senha fornecida pelo usuário é autenticada com o segredo simétrico global da aplicação (`PASSWORD_PEPPER`) via HMAC-SHA-256.
   - O resultado é um digest determinístico de 64 caracteres hexadecimais (32 bytes).
   - **Vantagem de Defesa em Profundidade**: Garante tamanho de entrada uniforme para o Argon2id e impede ataques offline mesmo se o banco de dados for integralmente vazado, pois o pepper não reside no banco.
2. **Derivação de Chave com Argon2id (Salt)**:
   - O digest HMAC gerado na etapa 1 é submetido ao Argon2id.
   - Um salt criptograficamente seguro (16 bytes gerados via CSPRNG) é criado automaticamente pelo `@node-rs/argon2`.
   - O resultado final é uma string codificada padrão modular contendo algoritmo, versão, parâmetros de custo, salt e o hash derivado (ex.: `$argon2id$v=19$m=65536,t=3,p=1$...`).
3. **Persistência Segura**:
   - Apenas a string codificada final é persistida na coluna `passwordHash` da tabela `users` no PostgreSQL.

---

## Parâmetros Padrão OWASP (Recomendação Decknews)

O algoritmo **Argon2id** (versão 19 / `0x13`) é uma variante híbrida que combina o Argon2i (resistente a ataques side-channel baseados em timing) e o Argon2d (resistente a ataques de GPU/ASIC com restrições massivas de memória).

O Decknews adota as recomendações oficiais da [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) ajustadas para concorrência de servidores web:

| Parâmetro                           | Constante / Valor           | Descrição e Racional Técnico                                                                                            |
| :---------------------------------- | :-------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **Algoritmo**                       | `Argon2id` (`algorithm: 2`) | Modo híbrido de ponta com resistência simultânea a cache-timing e cracking massivo via GPU/ASIC.                        |
| **Custo de Memória (`memoryCost`)** | `65536` KiB (64 MiB)        | Força o atacante a alocar 64 MiB de RAM dedicada para cada tentativa paralela de decodificação.                         |
| **Custo de Tempo (`timeCost`)**     | `3` iterações               | Número de passagens completas sobre o bloco de memória alocado, elevando o custo de computação.                         |
| **Paralelismo (`parallelism`)**     | `1` thread                  | Utiliza 1 thread por operação para não saturar o thread pool nativo do Node.js/libuv e preservar a concorrência da API. |

---

## Diferença Fundamental entre Salt e Pepper

| Característica        | Salt                                                                       | Pepper                                                                 |
| :-------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------- |
| **Escopo**            | Único por senha / usuário                                                  | Global por ambiente / aplicação                                        |
| **Geração**           | Aleatória via CSPRNG no momento do hash                                    | Chave simétrica configurada previamente                                |
| **Armazenamento**     | Público: embutido na string do hash no banco de dados                      | Privado: variável de ambiente (`PASSWORD_PEPPER`), fora do banco       |
| **Objetivo**          | Evita ataques por Rainbow Tables e que senhas idênticas gerem o mesmo hash | Defesa em profundidade contra dumps e vazamentos de banco de dados     |
| **Impacto se Vazado** | Nenhum (o salt foi desenhado para ser público)                             | Crítico: atacantes poderiam realizar ataques offline ao hash do Argon2 |

---

## Suporte a Rotação de Pepper sem Downtime (Zero Downtime)

Trocar a chave secreta de uma aplicação em produção tradicionalmente exigiria invalidar senhas de todos os usuários ou forçar resets em massa. O Decknews suporta **Zero Downtime Pepper Rotation** nativamente através do método `verifyWithRehash`.

### Configuração de Ambiente

No `src/lib/env/server.ts`, a aplicação valida estritamente a chave atual e aceita chaves anteriores:

```bash
# Pepper atual em uso para novas senhas e rehashes
PASSWORD_PEPPER="sua-chave-secreta-com-pelo-menos-16-caracteres"

# Pepper anterior suportado durante a janela de migração
PASSWORD_PEPPER_PREVIOUS="sua-chave-secreta-anterior-em-descontinuacao"
```

### Fluxo de Verificação Inteligente (`verifyWithRehash`)

Ao realizar login, o serviço consome `passwordHasher.verifyWithRehash(password, passwordHash)`:

```ts
export interface PasswordVerifyResult {
  valid: boolean
  needsRehash: boolean
}
```

1. **Tentativa Primária**: A senha é verificada com o pepper ativo (`PASSWORD_PEPPER`). Se coincidir, retorna `{ valid: true, needsRehash: false }`.
2. **Tentativa Secundária (Fallback)**: Se a tentativa primária falhar e houver `PASSWORD_PEPPER_PREVIOUS` configurado, a verificação testa a senha com o pepper anterior.
3. Se coincidir com o pepper anterior, retorna `{ valid: true, needsRehash: true }`.
4. **Rehash Transparente**: O serviço de autenticação (`LoginService`) detecta a flag `needsRehash: true`, gera um novo hash da senha fornecida usando o pepper ativo e persiste o novo hash no PostgreSQL durante o fluxo de login — sem atrito para o usuário final.

---

## Resultados Reais de Benchmark

Para calibrar o consumo de CPU e RAM no hardware de desenvolvimento, o projeto disponibiliza o script `infra/scripts/benchmark-argon2.mjs`.

### Ambiente de Teste:

- **Processador**: Apple M4 (macOS darwin arm64)
- **Runtime**: Node.js v24.20.0
- **Amostragem**: 5 iterações medidas por perfil com 1 rodada prévia de aquecimento (warmup)

### Tabela Comparativa de Perfis:

| Perfil                                  | Memória            | Iterações (`t`) | Threads (`p`) | Média Hash    | Média Verify  | Tempo Total   |
| :-------------------------------------- | :----------------- | :-------------- | :------------ | :------------ | :------------ | :------------ |
| **RFC 9106 Minimum**                    | 19456 (19 MiB)     | 2               | 1             | ~8.61 ms      | ~7.63 ms      | ~16.24 ms     |
| **OWASP Recommended (Padrão Decknews)** | **65536 (64 MiB)** | **3**           | **1**         | **~49.54 ms** | **~49.55 ms** | **~99.10 ms** |
| **High Security**                       | 131072 (128 MiB)   | 4               | 1             | ~144.49 ms    | ~147.47 ms    | ~291.96 ms    |

### Análise:

O perfil **OWASP Recommended** oferece a proteção ideal: ~49.5 ms por operação de verificação/hashing. Esse custo é alto o suficiente para inviabilizar ataques massivos por força bruta (demandando 64 MiB por tentativa paralela), mantendo o tempo de resposta da API de login confortavelmente abaixo de 100 ms.

---

## Regras Estritas de Segurança e Política Zero Leak

1. **Abstração Centralizada e Singleton**:
   - Todo acesso a hashing e validação deve ser feito via o singleton `passwordHasher` exportado de `@/infra/security/password`.
   - É **estritamente proibido** importar `@node-rs/argon2` ou `node:crypto` diretamente em rotas, serviços ou repositórios (`features/*`).
2. **Política Zero Leak**:
   - Senhas em texto puro, segredos de pepper e strings de hash **nunca** devem ser logados ou incluídos em mensagens de erro.
   - A classe de erro `InvalidPepperError` emite mensagens descritivas genéricas (`"PASSWORD_PEPPER must be a non-empty string with at least 16 characters"`) sem jamais expor o conteúdo do pepper rejeitado.
   - Se um hash fornecido para `verify()` for malformado ou corrompido, a exceção interna é capturada com segurança e a operação retorna `false`, prevenindo travamentos ou vazamentos de stack traces.
3. **Conformidade com Scanner de Credenciais (GitGuardian)**:
   - O arquivo `.env.example` nunca contém chaves pré-preenchidas para `PASSWORD_PEPPER`.
   - A validação de boot falha imediatamente caso a variável de ambiente não esteja configurada ou possua menos de 16 caracteres.
