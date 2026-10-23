# 106 — Lo que dejó P105: la salud al día y dos arreglos de accesibilidad medidos

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**. Este archivo ya está en `docs/prompts/`: lo dejó el chat, sin commitear. Va en el primer commit `docs —`.

**Modo: «pará y reportá».** Si algo no coincide con lo que dice este prompt, no lo reinterpretes: pará y reportá.

**Punto de partida:** `origin/main` = `b737fc6` (cierre de P105), o un commit posterior si Juan ya commiteó algo. Confirmalo con `git log`.

## Contexto y decisiones de Juan (22/10, no se re-discuten)

Son las respuestas a las preguntas abiertas de P105 (`docs/auditorias/ultimochat.md` §8), más dos decisiones nuevas sobre la presión.

1. **La presión entra por el puente.** El SDK 1.1.0 tiene `BloodPressureType` (sistólica, diastólica, media, pulso), `SleepType` y `BloodOxygenType`. El puente hoy pide solo ejercicio, FC y composición corporal.
   - El puente se amplía en **P107**, en el otro repo.
   - El adaptador de la app se amplía en **P108**, con los registros reales que deje P107.
   - **Este prompt no toca `adaptadorSdk.ts`.**
2. **El valor del día de la presión es el promedio de la última tanda.** Reemplaza la regla de P105 («la lectura más tardía»). Juan se toma tres lecturas seguidas.
3. **Health Sync no es una vía.** Juan tiene en Drive los CSV que sube Health Sync. Se descartó como vía, pero queda un hallazgo para anotar: **el orden de las columnas cambia entre archivos.** En uno va `Fecha,Hora,Sistólica,Diastólica` y en otro `Fecha,Hora,Diastólica,Sistólica,Frecuencia cardiaca,Comentario`. Si algún día se lee, tiene que ser por encabezado.

## Agentes y modelos

| Qué | Modelo |
|---|---|
| Exploración y lectura | Liviano |
| Lógica pura con tests (`src/lib/`, `src/import/`) | Intermedio |
| Pantallas y CSS (`ResumenTab`, `ProgresoTab`, `index.css`, `tokens.css`), **en serie** | Principal |
| Documentación | Intermedio |
| Revisión final, por un agente que **no** escribió el código: diff contra este prompt y los ADRs, `tsc` y `vitest` | Principal |

Dos agentes nunca editan el mismo archivo a la vez.

---

## Parte 1 — La presión: el promedio de la tanda

**Regla nueva**, en `src/import/samsungHealth.ts` (`presionPorDia`):
- Las lecturas del día que tienen **los dos valores**, ordenadas por hora.
- Una **tanda** es un grupo de lecturas en el que cada una está a **15 minutos o menos** de la anterior.
- **El valor del día es el promedio de la última tanda,** redondeado a entero. La sistólica y la diastólica se promedian sobre las **mismas** lecturas.
- Una fila con un solo valor no entra (como en P105).
- Un día sin lecturas completas no guarda nada (como en P105).

**Tests (casos inventados):**
- tres lecturas en 4 minutos → el promedio de las tres;
- dos tandas, a la mañana y a la tarde → el promedio de la de la tarde;
- una lectura sola;
- 15 minutos justos (entra) y 16 (otra tanda);
- el redondeo;
- el desorden del archivo.

**Que no cambie lo que no tiene que cambiar:**
- `agregacion` sigue diciendo lo que corresponda; si hoy dice `"ultimo-del-dia"`, ¿hace falta un valor nuevo en la unión del modelo? Si cambiar la unión toca más de lo razonable, **pará y reportá**.
- Ningún campo nuevo en `MetricaSalud`.

**Docs:**
- `docs/SAMSUNG-HEALTH-MAPEO.md`: la regla nueva, que reemplaza a la de P105.
- Si un ADR fija «último del día», enmendalo **de a uno**, con la enmienda anotada.

**Lo que hace Juan después del deploy:** reimportar un ZIP. Los pares del día se recalculan con la regla nueva.

## Parte 2 — La presión vieja se ve como vieja (pregunta 1)

Hoy la tarjeta de Resumen dice «medida el DD/MM», sin el año, y desaparece a los 60 días sin aviso. Progreso no muestra la fecha.

- **Resumen:** «hace N días» (o «hoy» / «ayer»). Si pasaron más de 7 días, se agrega «· se actualiza con el ZIP». Cuando P108 sume el puente, ese texto cambia; dejalo en una sola constante.
- **No desaparece a los 60 días.** La presión queda visible con su antigüedad. Si hoy otras métricas informativas comparten esa regla de recencia, **solo la presión** cambia; anotá cuáles comparten la regla.
- **Progreso:** la fecha del último dato de presión, en el mismo formato.
- **Sin colores ni semáforo** (P56, ADR correspondiente). La antigüedad va en el texto secundario.
- Tests de los textos.

## Parte 3 — La FC de reposo que no es reposo (pregunta 2)

Los 1537 documentos `fc-reposo` son el agregado general mal rotulado (P56). El importador ya no los produce.

- **No se lee `fc-reposo` en ningún lado** mientras no exista una fuente real:
  - Progreso no la ofrece como tendencia;
  - Resumen no la muestra;
  - la **regla 3** de `recomendaciones.ts` no la usa (queda inactiva, con un comentario que diga por qué).
- **Los datos no se tocan.** Al backlog del roadmap: «Borrar los `fc-reposo` viejos con un script (en seco, respaldo, `--aplicar`), cuando Juan lo decida».
- **El SDK 1.1.0 no tiene un tipo de FC de reposo,** así que el puente tampoco lo resuelve. Anotalo en el backlog, junto al ítem «Sueño y FC de reposo por el puente», que pasa a ser «Sueño por el puente (P107/P108). FC de reposo: sin fuente».
- Tests: la regla 3 no se dispara con `fc-reposo` presentes; Progreso no la lista.

## Parte 4 — Sueño: los tramos superpuestos se unen (pregunta 3)

- En `consolidarNoches` (`src/lib/sueno.ts`), las horas de una noche son la duración de la **unión** de sus tramos. Esto reemplaza el arreglo de P105 (solo los idénticos), que queda cubierto como caso particular.
- Tramos que no se tocan se siguen sumando como hoy.
- Tests:
  - el caso del 16/08, con valores inventados: mismo inicio, distinto fin;
  - uno adentro de otro;
  - superposición parcial;
  - tres tramos encadenados;
  - tramos separados.
- Si algo más usa la suma de horas por su cuenta, sin pasar por `consolidarNoches`, listalo. Si hay que cambiarlo, **pará y reportá**.

## Parte 5 — Pesadas repetidas: una sola al mostrar (pregunta 4)

- Dos mediciones con **la misma fecha y hora, el mismo peso, la misma grasa y la misma fuente** cuentan como una, **al mostrar y al calcular**: Composición, el peso del Resumen y las tendencias.
- Es el mismo criterio que el puente ya aplica a la balanza («dos puentes transportan la misma medición y solo entra uno», `shapeup-bridge/docs/fuentes-y-reglas.md`).
- **Los datos no se tocan.**
- Si en los datos reales la hora no coincide exactamente pero sí el día y los valores, **no** las juntes: reportá cuántos casos hay.
- Una función pura con tests.

## Parte 6 — Dos fallas de accesibilidad medidas (pregunta 5)

Del diagnóstico de P105 (`docs/reportes/diagnostico-diseno-2026-10-22.md`, hallazgos 1 y 2). El resto de los hallazgos queda para la auditoría.

**6a. El texto del botón principal en Pulse e Indigo oscuro.**
- En `src/styles/tokens.css`, `--on-accent` de **Pulse oscuro** e **Indigo oscuro** pasa a un tono oscuro del mismo tema, como los otros oscuros (Ion `#04161a`, Volt `#08130b`, Blaze `#1c0a02`). El chat midió `#1f0610` sobre `#ff4d79` → 6,04:1 y `#0d0e2b` sobre `#8b90ff` → 6,76:1. Podés usar esos u otros que den lo mismo.
- Corré `scripts/contraste-tokens.ts`: **todos** los temas × modos tienen que pasar AA en el botón principal.
- Revisá que nada pinte texto sobre el acento sin `--on-accent`. Si algo lo hace, listalo y no lo arregles.
- `colors_and_type.css` de la raíz se actualiza igual (kit = app).

**6b. La ✕ de salir (`.btn-icon-sm`, 28 × 28).**
- El **área de toque** pasa a 44 × 44 y el ícono queda del tamaño de hoy. Por ejemplo, con un pseudo-elemento o con padding y margen negativo. Lo que importa es que no se mueva nada de lugar.
- Revisá los 29 usos. Si en alguno el área nueva tapa otro botón, **pará y reportá**.
- **Capturas antes y después**, con el mismo método de P105, en `/qa/sesion` y en una pantalla con la ✕. Van a `docs/auditorias/capturas/2026-10-22/p106/`.

## Parte 7 — Docs

- `docs/ESTADO-DEL-PROYECTO.md` §6, paso 6: el orden nuevo del paso 2b (pregunta 7 de P105). Es la única línea que se toca de ese archivo.
- `docs/ROADMAP-producto.md`:
  - P106 hecho;
  - P107 (el puente: presión, sueño y SpO2) y P108 (el adaptador), como lo próximo de datos;
  - el backlog de las partes 3 y 5.
- `docs/AUDITORIA-DISENO.md`: los hallazgos 1 y 2 del diagnóstico, resueltos por P106.
- `docs/MAPEO-IMPLEMENTACION.md`: la bitácora de P106.
- **Numeración:** el próximo libre es **P109**.

## Commits

Separados en `App —`, `Herramientas —` (si hay) y `docs —`. Antes de cada uno, mostrá la lista de archivos. Después, push y confirmar `origin/main` = `HEAD`.

## Antes de terminar

- `npx tsc -b` limpio y `npx vitest run` verde. La suite de reglas se saltea sin emulador.
- **Reporte en `docs/auditorias/ultimochat.md`:**
  - una tabla por parte: hecho o no, archivos, tests;
  - las decisiones que tomaste;
  - los choques con ADRs;
  - **lo que tiene que hacer Juan, en orden:**
    1. build;
    2. deploy;
    3. reimportar un ZIP;
    4. qué mirar en el teléfono;
  - preguntas abiertas.
