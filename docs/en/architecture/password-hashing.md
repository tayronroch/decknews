<p align="right">
  <a href="../../pt-br/architecture/password-hashing.md">🇧🇷 Português</a> | <a href="./password-hashing.md">🇺🇸 English</a>
</p>

# Secure Password Storage and Hashing (Argon2id + Pepper)

Decknews adopts a multi-layered defense-in-depth security architecture for password storage and verification, pairing **Argon2id** (the Password Hashing Competition winner and OWASP-recommended algorithm) with an application-level symmetric secret (**Pepper**) via **HMAC-SHA-256**.

---

## Cryptographic Pipeline

The hashing and verification pipeline guarantees that plaintext passwords are never directly processed by the final hash algorithm or exposed across infrastructure boundaries:

```text
Plaintext Password
         │
         ▼
HMAC-SHA-256 (key = application secret pepper)
         │
         ▼
Argon2id + random salt (automatically generated)
         │
         ▼
passwordHash ($argon2id$v=19$m=65536,t=3,p=1$...)
         │
         ▼
PostgreSQL (users.passwordHash)
```

### Step-by-Step Breakdown:

1. **Pre-hashing with HMAC-SHA-256 (Pepper)**:
   - The user's plaintext password is authenticated against the application's global symmetric secret (`PASSWORD_PEPPER`) using HMAC-SHA-256.
   - The result is a deterministic 64-character hexadecimal digest (32 bytes).
   - **Defense-in-Depth Advantage**: Enforces a uniform input size for Argon2id and neutralizes offline dictionary attacks even if the database is completely compromised, because the pepper is never stored in the database.
2. **Key Derivation with Argon2id (Salt)**:
   - The HMAC digest produced in Step 1 is passed to Argon2id.
   - A cryptographically secure random salt (16 bytes generated via CSPRNG) is automatically created by `@node-rs/argon2`.
   - The resulting output is a modular standard encoded string containing the algorithm, version, cost parameters, salt, and derived hash (e.g., `$argon2id$v=19$m=65536,t=3,p=1$...`).
3. **Secure Persistence**:
   - Only the final encoded hash string is persisted in the `passwordHash` column of the `users` table in PostgreSQL.

---

## OWASP Recommended Parameters (Decknews Standard)

The **Argon2id** algorithm (version 19 / `0x13`) is a hybrid variant combining Argon2i (resistant to side-channel cache-timing attacks) and Argon2d (resistant to GPU/ASIC-assisted memory-tradeoff attacks).

Decknews adheres to the official guidelines from the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), tuned for web server concurrency:

| Parameter                       | Constant / Value            | Description & Technical Rationale                                                                        |
| :------------------------------ | :-------------------------- | :------------------------------------------------------------------------------------------------------- |
| **Algorithm**                   | `Argon2id` (`algorithm: 2`) | Modern hybrid mode providing simultaneous resistance against cache-timing and massive GPU/ASIC cracking. |
| **Memory Cost (`memoryCost`)**  | `65536` KiB (64 MiB)        | Forces attackers to allocate 64 MiB of dedicated RAM per parallel cracking attempt.                      |
| **Time Cost (`timeCost`)**      | `3` iterations              | Number of complete passes over the allocated memory block, increasing computational cost.                |
| **Parallelism (`parallelism`)** | `1` thread                  | Uses 1 thread per operation to avoid exhausting Node.js/libuv thread pools and preserve API concurrency. |

---

## Fundamental Differences Between Salt and Pepper

| Characteristic       | Salt                                                                                   | Pepper                                                                         |
| :------------------- | :------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------- |
| **Scope**            | Unique per password / user                                                             | Global per environment / application                                           |
| **Generation**       | Randomly generated via CSPRNG at hash time                                             | Symmetric secret configured in advance                                         |
| **Storage**          | Public: embedded within the hash string in the database                                | Private: environment variable (`PASSWORD_PEPPER`), outside the database        |
| **Primary Purpose**  | Prevents Rainbow Table attacks and ensures identical passwords produce distinct hashes | Defense-in-depth against database breaches and SQL dumps                       |
| **Impact if Leaked** | None (salt is intentionally public)                                                    | Critical: attackers could conduct offline cracking attempts on the Argon2 hash |

---

## Zero-Downtime Pepper Rotation Support

Rotating application secrets in production environments historically required invalidating all user sessions or forcing bulk password resets. Decknews provides native support for **Zero-Downtime Pepper Rotation** via the `verifyWithRehash` method.

### Environment Configuration

In `src/lib/env/server.ts`, the application strictly validates the primary pepper and optionally accepts prior peppers:

```bash
# Primary active pepper used for new hashes and rehashes
PASSWORD_PEPPER="your-secret-pepper-with-at-least-16-characters"

# Optional previous pepper accepted during the migration window
PASSWORD_PEPPER_PREVIOUS="your-previous-secret-pepper-being-phased-out"
```

### Intelligent Verification Flow (`verifyWithRehash`)

During user login, the authentication service invokes `passwordHasher.verifyWithRehash(password, passwordHash)`:

```ts
export interface PasswordVerifyResult {
  valid: boolean
  needsRehash: boolean
}
```

1. **Primary Attempt**: The password is first verified using the active pepper (`PASSWORD_PEPPER`). If it matches, the method returns `{ valid: true, needsRehash: false }`.
2. **Secondary Fallback Attempt**: If the primary check fails and `PASSWORD_PEPPER_PREVIOUS` is configured, verification is retried using the previous pepper.
3. If it matches the previous pepper, it returns `{ valid: true, needsRehash: true }`.
4. **Transparent Rehash**: The authentication service (`LoginService`) inspects the `needsRehash: true` flag, re-hashes the user-provided password using the active pepper, and persists the updated hash into PostgreSQL during the login operation — completely seamless to the end user.

---

## Real-World Benchmark Results

To evaluate CPU and RAM overhead on development hardware, the project includes an automated benchmark script at `infra/scripts/benchmark-argon2.mjs`.

### Benchmark Environment:

- **Processor**: Apple M4 (macOS darwin arm64)
- **Runtime**: Node.js v24.20.0
- **Sampling**: 5 measured iterations per profile with 1 warmup run

### Profile Comparison:

| Profile                                  | Memory             | Iterations (`t`) | Threads (`p`) | Hash Avg      | Verify Avg    | Total Avg     |
| :--------------------------------------- | :----------------- | :--------------- | :------------ | :------------ | :------------ | :------------ |
| **RFC 9106 Minimum**                     | 19456 (19 MiB)     | 2                | 1             | ~8.61 ms      | ~7.63 ms      | ~16.24 ms     |
| **OWASP Recommended (Decknews Default)** | **65536 (64 MiB)** | **3**            | **1**         | **~49.54 ms** | **~49.55 ms** | **~99.10 ms** |
| **High Security**                        | 131072 (128 MiB)   | 4                | 1             | ~144.49 ms    | ~147.47 ms    | ~291.96 ms    |

### Analysis:

The **OWASP Recommended** profile delivers optimal protection: ~49.5 ms per hash and verification operation. This computational effort is sufficiently expensive to deter large-scale hardware brute-force attacks (requiring 64 MiB per parallel attempt) while keeping interactive login API response times well below 100 ms.

---

## Strict Security Rules and Zero Leak Policy

1. **Centralized Abstraction & Singleton**:
   - All password hashing and verification must use the singleton instance `passwordHasher` exported from `@/infra/security/password`.
   - Directly importing `@node-rs/argon2` or `node:crypto` inside feature code (`features/*`) or services is **strictly prohibited**.
2. **Zero Leak Policy**:
   - Plaintext passwords, secret peppers, and raw hashes must **never** be logged or included in error payloads.
   - The `InvalidPepperError` class provides safe, generic diagnostic messages (`"PASSWORD_PEPPER must be a non-empty string with at least 16 characters"`) without exposing the rejected input.
   - Malformed or corrupt hash inputs passed to `verify()` are safely handled and return `false`, preventing unhandled exceptions or stack trace leaks.
3. **Credential Scanner Compliance (GitGuardian)**:
   - The `.env.example` file never contains default or placeholder pepper values.
   - Startup validation fails immediately if `PASSWORD_PEPPER` is missing or shorter than 16 characters.
