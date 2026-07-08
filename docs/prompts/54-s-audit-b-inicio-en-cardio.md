# Prompt 54 — S-audit-b · Persistir inicio/fin en `/cardio` (delta corto)

> **Código + tests, alcance mínimo.** Origen: hallazgo de la auditoría (P53) —
> `/cardio` no guarda la hora de inicio porque `_startMs`/`_endMs` se strippean
> antes de escribir. Sin eso: la tab Cardio no puede mostrar a qué hora fue la
> sesión, la auditoría no puede diagnosticar candidatas del día, y un re-match
> futuro obliga a re-parsear el ZIP. Costo Firestore: dos números por doc —
> despreciable (ADR #016 sigue intacto: esto no es dato crudo, es metadato de la
> sesión).

## Cambios

1. `SesionCardio` (models): sumá `inicioMs?: number` y `finMs?: number`.
2. En el import (donde hoy se strippean los campos `_`): copiá `_startMs → inicioMs`
   y `_endMs → finMs` antes del strip. El strip de `_customId`/`_motivo`/`_fcMin`
   sigue igual (`_fcMin` ya viaja en la biometría cuando corresponde; no lo
   dupliques en cardio salvo que ya exista un campo para eso).
3. `CardioTab`: en cada fila, la hora de inicio local («19:32») junto a la duración,
   si `inicioMs` existe. Las filas legacy sin el campo no muestran nada.
4. `auditoria-salud.ts`: la sección A ahora sí muestra la hora de inicio de las
   candidatas del mismo día (quitá la nota de limitación); sumá a la sección B
   cuántos docs tienen `inicioMs`.
5. Idempotencia: verificá que el upsert por `_uuid` **sí pise/agregue** `inicioMs`
   en docs existentes al re-importar — si no lo hace, los 1975 legacy quedarían sin
   hora para siempre (el owner igual va a limpiar y re-importar, pero que quede
   correcto para los demás miembros a futuro).

## Tests
- El consumidor persiste `inicioMs`/`finMs` y sigue strippeando los campos `_`.
- Fila sin `_startMs` → doc sin `inicioMs` (no `undefined` escrito).
- Re-import del mismo `_uuid` con `inicioMs` nuevo → el doc lo incorpora.

## Verificación
- `tsc -b` limpio · vitest verde · mapeo actualizado.
- Commit sugerido: `feat(salud): persistir inicio/fin de sesión en /cardio (S-audit-b)`.
