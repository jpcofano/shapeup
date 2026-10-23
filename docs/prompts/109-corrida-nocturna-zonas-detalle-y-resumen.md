# 109 — Corrida nocturna: P106, zonas como Samsung, el detalle de la sesión y el Resumen de Salud nuevos

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**.

Estos archivos ya están en el repo, sin commitear. Los dejó el chat y van en el commit del Bloque 0:
- este prompt;
- `docs/prompts/106-salud-al-dia-y-dos-arreglos-medidos.md`;
- `docs/prompts/109-diseno/`: `DetalleFinal.html`, `ResumenFinal.html` y `RampaZonas.html`.

**Punto de partida:** `origin/main` = `b737fc6` (cierre de P105). P106 todavía no corrió. Si `HEAD` no es `b737fc6`, o hay commits que no son de este prompt, anotalo y seguí solo si son ancestros limpios.

## Cómo se corre esta noche (lee esto primero)

Juan está durmiendo. **No preguntes nada: nadie va a contestar.** Valen las reglas de P103 y P105:

1. **Cada bloque se cierra por su cuenta:**
   - `npx tsc -b` limpio y `npx vitest run` verde (la suite de reglas se saltea sin emulador);
   - después, su commit y su push.

   Si un bloque no queda verde, revertí lo que tocaste en ese bloque, anotá por qué y **seguí con el siguiente**. Si un bloque depende de uno que se revirtió, salteálo también y anotalo.
2. **Si algo choca con un ADR, no lo reinterpretes:** saltealo, anotá el choque con archivo y línea, y seguí.
3. **Una decisión chica que no está fijada acá:** tomá la opción más conservadora (la que cambia menos datos, la reversible, la que se parece a lo que ya hace la app). Anotala en «Decisiones que tomé».
4. **Commits:**
   - separados en `App —`, `Herramientas —` y `docs —`, con la lista de archivos en el cuerpo;
   - push a `main` después de cada bloque verde;
   - sin `--force` ni `--no-verify`;
   - `git fetch` antes de cada push y confirmar que `origin/main` es ancestro de `HEAD`.
5. **Prohibido:**
   - escribir en Firestore (ningún `--aplicar`, ni `limpiar-salud` en simulación);
   - `firebase deploy`;
   - tocar `firestore.rules` o el repo del puente;
   - borrar documentación (se archiva);
   - instalar dependencias de cualquier tipo.
6. **Los datos de salud de Juan no van a git.** En tests y docs, valores inventados. La sesión testigo (`src/lib/__fixtures__/sesionTestigo20260927.ts`) ya es pública y se puede usar.
7. **Agentes y modelos:**

   | Qué | Modelo |
   |---|---|
   | Exploración y lectura | Liviano |
   | Lógica pura con tests (`src/lib/`, `src/import/`) | Intermedio |
   | Pantallas y CSS (`HistorialDetalle`, `CurvaSesion`, `ResumenTab`, `Salud`, `tokens.css`), **en serie** | Principal |
   | Documentación y kit | Intermedio |
   | Revisión de cada bloque antes del commit, por un agente que **no** escribió ese código: diff contra este prompt, contra las referencias de `109-diseno/` y contra los ADRs, y además `tsc` y `vitest` | Principal |

   Dos agentes nunca editan el mismo archivo a la vez.
8. **El reporte se va escribiendo:** al cerrar cada bloque, actualizá `docs/auditorias/ultimochat.md` con todo lo hecho hasta ahí.
9. **Juan no deploya hasta que el chat revise esta corrida.** Ponelo así en el reporte.

## Las referencias de diseño

Las decidió Juan el 22/10 con el chat, en la auditoría de diseño (P101, paso 4). Son HTML estático con datos de la sesión testigo y valores de ejemplo para Salud.
- **`docs/prompts/109-diseno/DetalleFinal.html`:** el detalle de la sesión.
- **`docs/prompts/109-diseno/ResumenFinal.html`:** Salud → Resumen.
- **`docs/prompts/109-diseno/RampaZonas.html`:** los colores de zona en oscuro y en claro.

Abrilas con Chrome en headless, con el mismo método de P105, y compará tus capturas contra ellas. **Las referencias muestran solo Ion en oscuro.** El resto de los temas y el modo claro salen de los tokens, como en toda la app. Lo que la referencia escribe a mano (hex, px) se implementa con tokens y clases: no copies los estilos inline.

**Decisiones cerradas (22/10, no se re-discuten):**
1. **Colores de zona como Samsung.** Es una rampa nueva, con un valor por modo:

   | Zona | Nombre | Oscuro | Claro |
   |---|---|---|---|
   | Z5 | Máximo | `#ef4444` | `#dc2626` |
   | Z4 | Anaeróbico | `#f97316` | `#c2410c` |
   | Z3 | Aeróbico | `#facc15` | `#a16207` |
   | Z2 | Control del peso | `#22c55e` | `#15803d` |
   | Z1 | Intensidad baja | `#3b82f6` | `#2563eb` |

   - Los `-dim` son el mismo color al 14 % en oscuro y al 12 % en claro.
   - Las zonas siguen sin cambiar con el tema. Hoy tampoco cambian con el modo; desde ahora, sí cambian con el modo.
2. **Nombres de Samsung donde entren:** en el detalle de la sesión, en el chip de la zona dominante y en Configuración, donde se muestran los rangos.
   - La forma larga es «Anaeróbico · Z4». Donde no entra, alcanza con «Z4».
   - Los nombres van en un solo lugar (`lib/zonas.ts`, por ejemplo `NOMBRE_ZONA`).
3. **La curva se pinta por zona:**
   - sin las bandas de fondo, con líneas guía en los pisos de zona y las ppm a la derecha;
   - un eje de tiempo con 4 o 5 marcas;
   - **las marcas de la app y del análisis salen de la curva** y pasan a ser chips que se tocan, debajo de ella («Pico 169 · 37:49», «Tramo sostenido 17:55»…). El pico queda además como un punto sobre la curva.
4. **«Tiempo en zonas», estilo Samsung,** reemplaza a las dos barras apiladas de hoy (la de «Series registradas» y la de «FC Samsung Health»). Lleva:
   - una barra resumen arriba;
   - debajo, una fila por zona de Z5 a Z1, con el punto de color, el nombre, «Zn», el rango en ppm, el tiempo `m:ss`, el % y una barra sobre un riel;
   - al pie, «Sin dato: m:ss» si hay hueco.
5. **El Resumen de Salud:**
   - la tarjeta del puente pasa a ser una línea («Datos al día · el reloj sincronizó hace N h», con el botón de sincronizar);
   - el sueño de anoche queda destacado, con el horario, tu promedio y las 7 noches;
   - debajo, las tarjetas de «Tu cuerpo».
   - Las pestañas se renombran: «Composición» → «Cuerpo» y «Progreso» → «Tendencias».
6. **Todo toque mide al menos 44 px.**

---

## Bloque 0 — Docs de entrada

- Commiteá los archivos que dejó el chat (este prompt, el 106 y `109-diseno/`).
- **`docs/AUDITORIA-DISENO.md`:** en §5, el paso 4 en curso con estas decisiones. Anotá que el lienzo de la auditoría y el artifact Design System viven en la cuenta de Claude de Juan: la fuente de verdad es esta carpeta de referencias y el repo.
- **`docs/ADR.md`:** una **enmienda al ADR #045** («Las zonas como las cuenta Samsung»): los colores y los nombres también son los de Samsung, con los valores de la tabla. Agregala abajo del texto, sin reescribirlo, y actualizá su línea en `CLAUDE.md` si cambia el título.
- **Numeración:** P106 corre en el Bloque 1 de esta corrida. P107 es el puente, y está pendiente en la otra sesión. P108 queda reservado para el adaptador de presión, sueño y SpO2. **Esta corrida es P109 y el próximo libre es P110.**

**Commit:** `docs — P109 Bloque 0: decisiones de diseño del 22/10 y referencias`.

## Bloque 1 — P106, con reglas de corrida nocturna

Ejecutá `docs/prompts/106-salud-al-dia-y-dos-arreglos-medidos.md`, Partes 1 a 7, **con las reglas de esta corrida y no con su «pará y reportá»:**
- **Cada vez que el 106 dice «pará y reportá»:** salteá esa parte, anotala y seguí.
- **Cada parte del 106 es un commit propio,** con su push, y se revierte sola si no da verde.
- **Parte 7 del 106:** la numeración queda como dice el Bloque 0 de este prompt.
- **Parte 6b (la ✕ a 44 px) se hace igual aunque el Bloque 3 cambie el header.** El área de toque de `.btn-icon-sm` sirve en toda la app.

## Bloque 2 — Zonas: colores y nombres (App)

- **`src/styles/tokens.css`:** la rampa nueva, `--zona-z1` a `--zona-z5` y sus `-dim`, con un valor por modo. Los valores de oscuro van en `:root` y en `[data-mode="dark"]`; los de claro, en `[data-mode="light"]`. Verificá con `scripts/contraste-tokens.ts` que las zonas en claro pasen 3:1 sobre `--card` y sobre `--bg`, y sumalas al reporte de contraste.
- **`lib/zonas.ts`:** `NOMBRE_ZONA`, con el nombre de Samsung de cada zona. Con test.
- **Revisá cada lugar que pinta zonas** (`BarraZonas`, `CurvaSesion`, `TrendChart`, chips, `RevisionFcMax`, Configuración, Cardio) y que nada use un hex de zona escrito a mano. Si alguno lo hace, pasalo al token.
- **Configuración, donde se muestran las zonas del miembro:** el nombre de Samsung al lado de cada rango.
- **El kit en la misma pasada:** `colors_and_type.css` y `preview/col-zonas.html` de la raíz (kit = app).

**Commit:** `App — P109 Bloque 2: colores y nombres de zona como Samsung`. El kit va en un commit `docs —` aparte.

## Bloque 3 — El detalle de la sesión nuevo (App)

Referencia: `109-diseno/DetalleFinal.html`. **La lógica no cambia** (ADR #044 y #047): lo medido y lo interpretado siguen separados. Solo cambia cómo se ve.

1. **`CurvaSesion`:**
   - la línea se pinta por zona, por tramos, con la zona de cada punto según `lib/zonas.ts`, sin bandas;
   - líneas guía punteadas en los pisos, con las ppm a la derecha;
   - el eje de tiempo con marcas redondas (cada 12 min en una sesión de 48; adaptalo a la duración);
   - el pico es un punto con borde;
   - por debajo de Z1, la línea va en `--muted`.

   **Las marcas pasan a ser una fila de chips** debajo de la curva:
   - los de la app, sólidos; los del análisis, con borde punteado y la etiqueta «análisis» (lo mismo que hoy, con otra forma);
   - al tocar un chip se resalta su tramo sobre la curva (una franja tenue) y aparece su texto, como hoy;
   - cada chip mide al menos 44 px de alto.

   Lo que hoy prueban `curvaSesion.test.ts` y `pantallaSesion.test.tsx` se mantiene: adaptá los tests a la forma nueva. No los borres.
2. **`HistorialDetalle` y `CabeceraMarcas`, en este orden:**
   1. Un header con botones redondos de 44 px: volver y más opciones (el menú que ya exista; si no hay, solo volver).
   2. El título: una línea chica en `accent` con el tipo y el juego o la rutina («VR · PowerBeatsVR»), el nombre grande (`t-display`) y «Sáb 27/09 · 16:09 · 49 min».
   3. **El bloque del análisis** (solo si hay análisis de esquema 3): fondo `accent-dim` suave, el veredicto, los destacados como lista, y las badges de nivel 1. Sin análisis, las badges van solas. Con esquema 2, como hoy.
   4. **La tarjeta «Frecuencia cardíaca»**, con la curva y los chips.
   5. **Cuatro tarjetas en grilla de 2:** Duración, Calorías, FC media y FC máxima, cada una con un ícono de Lucide en `accent`. Debajo, «El reloj midió N de los M minutos.». Si falta un dato, la tarjeta no va; si queda una sola en su fila, ocupa las dos columnas.
   6. **«Tiempo en zonas»** (decisión 4). Componente nuevo, por ejemplo `TiempoEnZonas`, con los minutos de la curva (`minutosPorZona`). Sin curva, pero con los segundos por zona de Samsung, se usan esos. Sin ninguno de los dos, no va.
   7. **«Lo que hiciste»** (hoy «Series registradas»): por ejercicio, el nombre, «N de M series» y el chip de la zona dominante con su nombre. Con más de un ejercicio, cada uno suma una barra fina sin texto. **Se sacan las dos barras apiladas con rótulos.**
   8. **Una lista de filas:** «Dormiste X la noche anterior» (el contexto del día de hoy) y **«Más datos de la curva», plegado**, con la línea de secundarias de hoy adentro.
   9. Los botones del análisis, como hoy.
3. **Sin cambios de datos:** ni campos ni lecturas nuevas. Si algo de la referencia necesita un dato que no está, dejalo afuera y anotalo.
4. **Tests:**
   - el orden nuevo;
   - con curva y sin curva;
   - sin análisis y con esquema 2;
   - `TiempoEnZonas` con los dos orígenes;
   - el chip de zona dominante;
   - una sesión de fuerza con 3 ejercicios.
5. **Capturas:** `/qa/sesion` en Ion y en Pulse, en claro y en oscuro, a 390 px, en `docs/auditorias/capturas/2026-10-23/detalle/`. Compará con la referencia y anotá las diferencias que dejaste a propósito.

**Commit:** `App — P109 Bloque 3: el detalle de la sesión nuevo`. Si queda grande, partilo en dos: primero `CurvaSesion`, después la pantalla.

## Bloque 4 — Salud → Resumen nuevo (App)

Referencia: `109-diseno/ResumenFinal.html`.

1. **El header de Salud:** la fecha de hoy («Jueves 22 de octubre») sobre el título; los botones de importar y de carga manual, redondos de 44 px.
2. **Las pestañas, como píldora segmentada:**
   - la activa en `accent` con `on-accent`;
   - los labels nuevos «Cuerpo» y «Tendencias»; las claves internas no cambian, solo el texto;
   - si las cinco no entran a 360 px sin cortar el texto, usá scroll horizontal dentro de la píldora (nunca de la página) y anotalo.
3. **El puente, en una línea:**
   - `PuentePanel` sigue existiendo para los estados que piden acción (error, nunca sincronizó, permisos): ahí se ve como hoy;
   - **con todo al día**, se ve la línea «Datos al día · el reloj sincronizó hace N h», con el botón de sincronizar redondo de 40 a 44 px.

   La lógica de los estados es la de hoy. Con test de los dos casos.
4. **«Sueño de anoche»:**
   - la duración grande en «6 h 54 min» y el horario «23:41 → 6:35»;
   - «Tu promedio», con la ventana que ya usa `resumenSalud`;
   - las 7 noches en barras, la última en `accent` y una línea punteada en el promedio, con las iniciales de los días.

   Usa `consolidarNoches` (fuente única). Sin sueño, la tarjeta no va.
5. **«Tu cuerpo», con tarjetas en grilla de 2:** peso, grasa corporal, presión y oxígeno en sangre (hoy «SpO2»).
   - Cada tarjeta lleva el ícono, el valor grande con la unidad, un sparkline de 14 días con el último punto en `accent`, el cambio contra la ventana de referencia que ya existe, y hace cuánto es el dato.
   - **La presión y la SpO2 siguen sin semáforo** (P56): el cambio va en `fg` y sin flechas de color.
   - **Presión:** el texto de antigüedad de P106 («hace N días · se actualiza con el ZIP»). No muestres «3 lecturas»: el dato no se guarda.
   - **La grasa sale de las mediciones,** con la misma fuente que Composición. Si no hay, la tarjeta no va.
   - **La FC de reposo no va** (P106, Parte 3).
   - **Si queda una tarjeta sola en su fila,** ocupa las dos columnas.
6. **«Ver todas las tendencias»:** un link de 44 px a la pestaña Tendencias.
7. **Tests:**
   - con todo, sin sueño y sin grasa;
   - el puente al día y el puente con error;
   - los labels nuevos de las pestañas;
   - la grilla con 3 tarjetas.

   `/qa/salud-resumen` se actualiza con el diseño nuevo y datos inventados.
8. **Capturas** en `docs/auditorias/capturas/2026-10-23/resumen/`, como en el Bloque 3.

**Commit:** `App — P109 Bloque 4: el Resumen de Salud nuevo`.

## Bloque 5 — El kit igual a la app (docs)

- **`preview/`:**
  - rehacé `cmp-curva-sesion` y `cmp-barra-zonas` desde los componentes nuevos, con el método de P105 (renderizar el componente real con datos inventados);
  - sumá `cmp-tiempo-en-zonas` y `cmp-resumen-salud`.
- **`ui_kits/shapeup/pantallas-nuevas.html`:** las secciones del detalle de la sesión y de Salud → Resumen, regeneradas.
- **`README.md` de la raíz:**
  - la sección de zonas, con los colores por modo y los nombres de Samsung;
  - las pestañas de Salud con los nombres nuevos.

**Commit:** `docs — P109 Bloque 5: el kit con las zonas, el detalle y el Resumen nuevos`.

## Bloque 6 — Cierre (docs)

- **`docs/MAPEO-IMPLEMENTACION.md`:** la bitácora de P106 y de P109.
- **`docs/ROADMAP-producto.md`:**
  - P106 y P109 hechos;
  - P107 y P108 como lo próximo de datos;
  - lo salteado, al backlog.
- **`docs/AUDITORIA-DISENO.md`:**
  - el paso 4 hecho para el detalle y el Resumen;
  - lo que sigue de la auditoría: los hallazgos 3 a 15 del diagnóstico de P105;
  - si las direcciones de Home se extienden a toda la app;
  - si el oscuro va teñido o neutro.
- **`docs/ANALISIS-ASISTIDO.md` §6:** la pantalla como quedó.

**Commit:** `docs — P109: cierre`.

---

## El reporte final (`docs/auditorias/ultimochat.md`)

1. **Una tabla de bloques** (incluidas las partes del 106): hecho, salteado o parcial; commit; push.
2. **Por bloque:** qué cambió para Juan, en dos o tres líneas; los archivos; los tests nuevos.
3. **Las capturas:** dónde están, y las diferencias con las referencias que dejaste a propósito.
4. **«Decisiones que tomé».**
5. **Choques con ADRs,** con archivo y línea.
6. **`tsc` y `vitest` al final,** con el conteo.
7. **Lo que tiene que hacer Juan, en orden:**
   1. **esperar a que el chat revise esta corrida;**
   2. después, build y deploy;
   3. reimportar un ZIP (por P106);
   4. qué mirar en el teléfono, en claro y en oscuro.
8. **Preguntas abiertas** para el chat.
