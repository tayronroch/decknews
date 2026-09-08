# Estratégia de Validação de Dados (Zod)

O Decknews adota o **Zod** como mecanismo padrão e mandatório para validação de contratos e dados externos.

---

## 1. Separação de Responsabilidades: Zod vs Services

| Mecanismo   | Responsabilidade                                  | Exemplos                                                                                                                                                                                                               |
| :---------- | :------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zod**     | **Validação Estrutural** (contrato de transporte) | • Tipos e formatos (string, email, número inteiro)<br>• Tamanhos mínimos/máximos (`min(3)`, `max(100)`)<br>• Rejeição de propriedades inesperadas com `.strict()`<br>• Coerção de strings em query params (`z.coerce`) |
| **Service** | **Validação de Negócio** (regras de domínio)      | • Se slug ou e-mail já existe no banco<br>• Se o usuário tem permissão para a ação<br>• Se a transição de estado é válida (DRAFT ➔ PUBLISHED)<br>• Se o autor é dono do recurso                                        |

---

## 2. Regras de Arquitetura de Validação

- **Validação na Borda (Edge Validation)**: Todo dado externo entra inicialmente como `unknown` e é validado no Route Handler ou Server Action. O Service **sempre** recebe dados já validados e fortemente tipados.
- **JSON Malformado vira HTTP 400**: O helper `parseJsonBody(request)` intercepta erros de sintaxe de JSON (`SyntaxError`) e os converte em `ValidationError` (`400 VALIDATION_ERROR`), impedindo que payloads malformados gerem erros 500.
- **Schemas Estritos (`.strict()`)**: Payloads externos de criação/edição devem rejeitar campos desconhecidos com `.strict()` para proteção contra _mass assignment_ (ex.: injeção indevida de `isAdmin: true` ou `role`).
- **Tipagem Derivada (`z.infer`)**: Todo schema exporta seu tipo inferido via `z.infer<typeof schema>`. Evite criar interfaces TypeScript manuais duplicadas para representar contratos de schemas Zod.
- **Organização dos Schemas**:
  - Schemas compartilhados e primitivos em `src/lib/validation/` (ex.: `paginationSchema` com coerção e limite `max(100)`).
  - Schemas de domínio em `src/features/<dominio>/schemas/` (ex.: `create-post.schema.ts`). Schemas compartilhados só devem ser criados quando houver real reutilização.
