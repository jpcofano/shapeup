# Tests al 07/06/2026 (ex §4 de MAPEO-IMPLEMENTACION.md)

Movido en P100 (01/10/2026), tal cual. Las cifras son de junio.

## 4. Tests (al 2026-06-07)

| Archivo | Tests |
|---|---|
| auth/findMemberByEmail.test.ts | 4 |
| lib/filtros.test.ts | 9 |
| lib/metricas.test.ts | 11 |
| lib/entrenarState.test.ts | 26 |
| (tests añadidos en E2.1 y E5.1, no itemizados) | 39 |
| **Total unidad** | **89** |
| `__tests__/firestore.rules.test.ts` (emulador) | 38 |
| import/samsungHealth.test.ts | 53 |
| import/samsungLiveData + lib/matchBiometrico (E6.2) | 16 |
| **Total unitarios** | **158** |
| **Total global (unit + reglas)** | **196** |

> Nota: reconciliar con Code en cada etapa. E6.3 (zip-first) y D8 (PWA) pueden haber sumado tests
> no itemizados acá; P25–P27 sumarán los suyos.

Tests de reglas: `src/__tests__/firestore.rules.test.ts` (38 tests; `npm run test:rules`).
