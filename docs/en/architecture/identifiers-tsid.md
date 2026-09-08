<p align="right">
  <a href="../../pt-br/architecture/identifiers-tsid.md">🇧🇷 Português</a> | <a href="./identifiers-tsid.md">🇺🇸 English</a>
</p>

# Global Identifier Strategy (64-bit TSID / Snowflake)

Decknews adopts a centralized 64-bit identifier strategy generated at the application level (TSID / Twitter Snowflake style), rather than database UUIDs or auto-incrementing integers.

---

## Identifier Representation Cycle

```text
PostgreSQL BIGINT
       ↓
Prisma BigInt
       ↓
TypeScript bigint
       ↓
API / JSON decimal string (e.g.: "89930947499134976")
```

---

## Motivation and Design Decisions

### 1. Why NOT use UUID as default PK?

- **B-Tree Index Performance**: Random UUID v4 causes continuous page fragmentation across PostgreSQL B-Tree indexes, increasing disk I/O and memory cache churn.
- **Storage Footprint**: UUID consumes 16 bytes (128 bits) on disk and in every indexed foreign key. `BIGINT` consumes half (8 bytes), keeping indexes and joins significantly faster and more compact.
- **Natural Ordering**: Snowflake/TSID identifiers contain the timestamp in their most significant bits, ensuring new inserts append to the end of the B-Tree leaf pages (avoiding page splits).

### 2. Why NOT use `number` in API/JSON?

- In JavaScript and the JSON/IEEE 754 specification, double-precision floating point numbers are only guaranteed safe integer precision up to `Number.MAX_SAFE_INTEGER` ($2^{53} - 1 \approx 9 \times 10^{15}$).
- 64-bit IDs exceed this limit ($2^{63} - 1 \approx 9 \times 10^{18}$). Treating these IDs as `number` in web clients or JSON parsers causes silent truncation of the trailing digits. Therefore, external serialization is **always as a decimal string**.

### 3. Why NOT rely on PostgreSQL sequence / AUTO_INCREMENT?

- Generating IDs in the application layer decouples entity identity from database persistence round-trips, allowing entity IDs to be known prior to insertion.
- Avoids centralized sequence contention bottlenecks across multiple future writers.

### 4. Multi-Instance and Node Configuration (`TsidIdGenerator`, `src/infra/id/`)

- **Configuration**: `workerId` and `processId` (5 bits each, 0 to 31) are supplied via constructor options; defaulting to `0` for both when running as a single-node instance.
- **Validation**: Out-of-range `workerId`/`processId` (`[0, 31]`) or future epochs throw `InvalidIdGeneratorConfigError` synchronously during construction — preventing instances from initializing in an invalid state.
- **Clock Rollback**: If `Date.now()` moves backwards relative to the last timestamp used (e.g., NTP time sync adjustments), `next()` throws `ClockRollbackError` rather than risking ID collision or re-issuance; caller code determines resolution (retry, alert, etc.).
- **Instance Collision Mitigation**: Every `(workerId, processId)` combination must be unique per simultaneously running process; 5+5 bits accommodates up to 1,024 concurrent nodes. Assigning these values per replica/environment is an operational concern (e.g., environment variable per container) — currently the application runs with defaults `(0, 0)`.

### 5. Cursor-based Pagination

- Due to the intrinsic chronological ordering of IDs, future cursor pagination queries (`WHERE id < :cursor ORDER BY id DESC LIMIT :limit`) can run directly over the primary key without the performance penalties of large `OFFSET` values.

### 6. Security and Business Rules

- **IDs are NOT authorization tokens**: Knowing an ID does not confer access to a resource. Authorization rules (ownership, roles) must always be validated explicitly in the Service layer.
- **`createdAt` remains mandatory**: Although the ID encodes creation time, `createdAt DateTime` is kept in models for domain clarity, auditing, and database query readability.
