# Prompt P66g — Correcciones de P66f con el resultado de M1 del puente

Decisiones cerradas. Si algo es inviable o ambiguo, pará y reportá en vez de reinterpretar.

Restricciones:

- Solo documentación: no toques `src/` ni `scripts/`.
- No toques `docs/prompts/`, que es registro histórico (salvo guardar este mismo archivo ahí si todavía no está).
- No commitees.

## Contexto

M1 del puente (app Android que lee Samsung Health por el Data SDK) quedó verificado contra la
sesión de referencia. Tres hallazgos corrigen lo que P66f dejó en `docs/`. P66f está aplicado
en el working tree pero sin commitear; estas correcciones van sobre ese mismo working tree.

---

## Paso 0 — Estado

Corré `git status` y `git diff --stat`. Reportá qué archivos están modificados y si el diff
incluye trabajo de P66d y P66e además de P66f.

---

## Corrección 1 — `appId` de Garmin

- Reemplazá `com.garmin.android.connectmobile` por `com.garmin.android.apps.connectmobile` en:
  - `MAPEO-IMPLEMENTACION.md:1805` (tabla de fuentes del ADR #033)
  - `MAPEO-IMPLEMENTACION.md:1814` (cierre del ADR #033)
  - `ROADMAP-producto.md:897` (tabla de §15.9)
- Realineá la tabla del ADR #033 si queda desalineada.
- Verificá con grep que el string viejo no aparezca en ningún lado fuera de `docs/prompts/`.

---

## Corrección 2 — El ADR #035 se apoya en el #034

- Reemplazá el criterio de la Decisión por este:

  > Una sesión es AUTODETECTADA SIN CURVA cuando su densidad de muestras de FC está por debajo
  > del umbral del ADR #034 (0,1/s). Vale igual para ZIP y para la vía D. El #035 no define
  > criterio propio.

- Mantené sin cambios:
  - los dos bullets de solapamiento,
  - la línea "Nunca se fusionan dos filas en una…",
  - el párrafo de revisión pendiente.
- Reemplazá el párrafo final ("Por la vía D el discriminador es mejor…") por la evidencia de M1:
  - `autoDetected` viene `true` en las cinco caminatas, incluidas las tres reales del reloj.
    Marca "arrancada automáticamente", no "fantasma".
  - Las dos autodetectadas del teléfono no tienen el log vacío: tienen 12 y 13 entradas.
  - `deviceId` `DQLXfARDMe` es el teléfono. También escribe la sesión de ShapeUp y los registros
    de Health Sync, así que no separa nada. El reloj es `9XdbeBZKBf`.
  - Lo que separa limpio es la densidad:

    | Sesión (UTC) | Dispositivo | `logSize` | Densidad |
    |---|---|---|---|
    | 14:16:30 | reloj | 505 | 0,77/s |
    | 14:57:05 | teléfono | 12 | 0,018/s |
    | 15:48:51 | reloj | 645 | 0,83/s |
    | 15:50:04 | teléfono | 13 | 0,018/s |
    | 17:13:15 | reloj | 677 | 0,83/s |
    | 20:34:52 (ShapeUp) | teléfono | 4133 | 1,00/s |

- Buscá en §15.8 cualquier otra afirmación de que `deviceId` o el log vacío discriminan
  autodetectadas, y corregila en el mismo sentido.

---

## Corrección 3 — La media del SDK es confiable

- Buscá en §15.8, §15.9 y los ADR #032 a #036 toda afirmación sobre la fiabilidad del resumen o
  de la media de FC.
- Por la vía D, donde se diga que hay que recalcular o que no es confiable, corregilo así:

  > La media que entrega el SDK es la de Samsung (118,120415, idéntica al ZIP), computada sobre
  > las 12.839 muestras crudas. El `log` viene agregado a 1 Hz y recalcular sobre él da 118,213.
  > Por la vía D el resumen es confiable y se usa el reportado.

- Lo dicho sobre la vía Drive no se toca.
- Si no hay ninguna afirmación, agregá el párrafo en §15.8.
- Si una afirmación no distingue entre vías, pará y mostrámela literal.

---

## Agregado 4 — Detalles de §15.9

Verificá cada punto; si falta, agregalo:

- El SDK entrega el campo como `bmi`, no `body_mass_index`. Es el mismo concepto que el `imc`
  existente (`models.ts:502`, `samsungHealth.ts:291`). Si se usa el reportado o se recalcula como
  hoy, se decide en P75.
- El reloj escribe `weight` sin medirlo: lo hereda del perfil (89,3 el 15/09, igual al de la
  balanza del 05/09). El adaptador lo descarta.
- `appId` es la señal fuerte y `deviceId` la débil.
- `custom_id` no viaja por el SDK y `customTitle` sí. El match por `custom_id` queda exclusivo del
  ZIP; por la vía D alcanza con el nombre.

---

## Agregado 5 — Resultado de M1 en §15.8

- Agregá la verificación, que coincide exacta con la sesión de referencia:

  | | Valor |
  |---|---|
  | Entradas en `log` | 4133 |
  | Con `heartRate` | 4112 |
  | Media | 118,213 |
  | Máximo | 174 |
  | Mínimo | 83 |
  | Salto máximo | 17.481 ms |

- Agregá la fricción operativa medida:
  - Los permisos sobreviven al reinicio de la app.
  - El modo desarrollador de Samsung Health sigue activo sin reintervención.
  - 118 KB por sesión con curva, así que en M3 la lectura incremental es una optimización, no un
    requisito.
- Si §15.8 lista los hitos del puente, marcá M1 como hecho.

---

## Al terminar

Mostrame:

1. El diff por archivo.
2. El resultado del grep de la corrección 1.
3. Cualquier punto donde hayas parado en vez de aplicar.
