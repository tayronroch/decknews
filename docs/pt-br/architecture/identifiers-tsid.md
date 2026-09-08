<p align="right">
  <a href="./identifiers-tsid.md">🇧🇷 Português</a> | <a href="../../en/architecture/identifiers-tsid.md">🇺🇸 English</a>
</p>

# Estratégia Global de Identificadores (TSID / Snowflake de 64 bits)

O Decknews adota uma estratégia centralizada de identificadores de 64 bits gerados pela aplicação (estilo TSID/Twitter Snowflake), em vez de UUIDs ou inteiros autoincrementais do banco.

---

## Ciclo de Representação do Identificador

```text
PostgreSQL BIGINT
       ↓
Prisma BigInt
       ↓
TypeScript bigint
       ↓
API / JSON string decimal (ex: "89930947499134976")
```

---

## Motivação e Decisões de Design

### 1. Por que NÃO utilizar UUID como PK padrão?

- **Performance de Índices B-Tree**: UUID v4 aleatórios causam fragmentação contínua de páginas nos índices B-Tree do PostgreSQL, levando a alto consumo de disco e cache de memória.
- **Tamanho de Armazenamento**: UUID consome 16 bytes (128 bits) em disco e em cada chave estrangeira indexada. O `BIGINT` consome metade (8 bytes), tornando índices e joins significativamente mais rápidos e compactos.
- **Ordenação Natural**: IDs baseados em Snowflake/TSID possuem o timestamp nos bits mais significativos, garantindo que novas inserções ocorram no final da árvore B-Tree (evitando page splits).

### 2. Por que NÃO utilizar `number` na API/JSON?

- No JavaScript e na especificação JSON/IEEE 754, números de ponto flutuante de precisão dupla têm precisão inteira garantida apenas até `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 \approx 9 \times 10^{15}$).
- IDs de 64 bits ultrapassam esse limite ($2^{63} - 1 \approx 9 \times 10^{18}$). Tratar esses IDs como `number` no cliente web ou em bibliotecas JSON resultaria em corrupção silenciosa dos dígitos finais. Portanto, o tráfego externo é **sempre como string decimal**.

### 3. Por que NÃO depender de sequence / AUTO_INCREMENT do PostgreSQL?

- Gerar o ID na camada de aplicação desacopla a criação da entidade do round-trip de persistência, permitindo conhecer o ID antes mesmo de inserir no banco.
- Evita gargalos de contenção de sequences centralizadas em múltiplos writers futuros.

### 4. Multi-instâncias e Configuração de Nós (`TsidIdGenerator`, `src/infra/id/`)

- **Configuração**: `workerId` e `processId` (5 bits cada, 0 a 31) são passados nas opções do construtor; o padrão é `0` para ambos quando a instância roda sem configuração explícita de nó.
- **Limites**: `workerId` e `processId` fora do intervalo `[0, 31]`, ou `epoch` no futuro, lançam `InvalidIdGeneratorConfigError` de forma explícita e síncrona na construção — a instância nunca é criada em estado inválido.
- **Clock rollback**: se `Date.now()` retroceder em relação ao último timestamp usado (ex.: ajuste de NTP), `next()` lança `ClockRollbackError` em vez de arriscar reuso/colisão de ID; o chamador decide como reagir (retry, alerta, etc.).
- **Risco de colisão entre instâncias**: cada combinação `(workerId, processId)` deve ser única por instância viva simultaneamente; com 5+5 bits há espaço para até 1024 nós concorrentes. A atribuição desses valores por instância/ambiente é responsabilidade operacional (ex.: variável de ambiente por réplica) e ainda não está automatizada — hoje a aplicação roda com uma única instância usando os padrões `(0, 0)`.

### 5. Uso em Paginação por Cursor

- Devido à ordenação temporal intrínseca dos IDs, futuras queries de paginação por cursor (`WHERE id < :cursor ORDER BY id DESC LIMIT :limit`) podem ser feitas diretamente pela chave primária sem custo de offset.

### 6. Segurança e Regras de Negócio

- **IDs NÃO são mecanismo de autorização**: Mesmo que sejam difíceis de adivinhar sequencialmente em microssegundos, o sistema nunca presume segurança por obscuridade. Toda regra de autorização (ownership, roles) é validada explicitamente na camada de Service.
- **`createdAt` continua obrigatório**: Embora o ID contenha o timestamp de geração codificado, a coluna `createdAt DateTime` permanece mandatória na modelagem para clareza em auditorias, filtros de banco e integridade de domínio.
