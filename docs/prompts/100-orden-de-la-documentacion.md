# P100 — Orden de la documentación

**Repo:** app (`jpcofano/shapeup`). **Solo documentación:** no se toca código.

**Adjuntos:** `HANDOFF-2026-09-30.md` (el último traspaso del chat).

**Precondición:**
- P93 está commiteado (`600aa37`) y el plan de marcas ya está integrado (`d0decc9`).
- Los prompts 97 y 98 están commiteados.
- El árbol está limpio y `origin/main` = `HEAD`.

Si algo de esto no se cumple, pará y reportá. El commit en el que arranca P100 es el **commit base** de la Parte 3.

---

## Por qué

La misma información hoy vive en varios lugares que ya no coinciden:

- **Qué sigue y en qué orden** está en tres lugares: §11 del roadmap, «Pendientes» de `ESTADO-DEL-PROYECTO.md` (quedó al 25/09) y la sección «Roadmap» de `CLAUDE.md`.
- **La tabla de §11 del roadmap es el plan de P66, y su numeración quedó superada:** el P84 y el P89 de la tabla no son los que se ejecutaron. El índice de lo ejecutado vive en §1 de `MAPEO-IMPLEMENTACION.md`.
- **El roadmap** mezcla el plan con informes de auditoría (desde §12).
- **`CLAUDE.md`** mezcla las reglas y los ADRs con la historia de las series S, I y H.
- Hay **copias y restos**: la carpeta `uploads/` (versiones viejas de documentos de `docs/`), `MAPEO-ADDENDUM (1)` y `(2)` en `docs/prompts/`, `PROMPTS-design.md` en tres lugares, la carpeta `prompts-code/` separada de `docs/prompts/`, y archivos `(1)` y `(2)` entre los prompts.

El objetivo es que **cada tipo de información tenga un solo lugar**, que **no se pierda nada** en el reorden, y que **las reglas para documentar queden escritas** para lo que venga.

---

## Decisiones cerradas: no se re-discuten

### 1 · Un lugar por tipo de información

| Tipo | Lugar único |
|---|---|
| Reglas de trabajo y ADRs | `CLAUDE.md` |
| Reglas de documentación | `CLAUDE.md`, sección nueva «Documentación» (texto en §7 de este prompt) |
| Contexto estable del proyecto: infra, familia, puesta a punto de una máquina, fuentes de datos | `docs/PROYECTO.md` (**nuevo**) |
| Plan, orden de prompts y backlog | `docs/ROADMAP-producto.md` |
| Estado actual: es **el traspaso** del chat | `docs/ESTADO-DEL-PROYECTO.md` |
| Diseño de cada área | Un documento por área en `docs/` (`ANALISIS-ASISTIDO.md`, `SAMSUNG-HEALTH-MAPEO.md`, `SEEDS.md`…) |
| Bitácora de prompts e índice | `docs/MAPEO-IMPLEMENTACION.md` |
| Informes de auditoría y la historia de las series cerradas | `docs/reportes/` (**nueva**) |
| Prompts | `docs/prompts/`; `prompts-code/` se integra ahí |
| Diseño visual | El sistema de diseño de la raíz (`README.md`, `SKILL.md`, `ui_kits/`, `preview/`, `colors_and_type.css`) y `docs/home-redux/`. **No se mueve** |
| Copias viejas y restos | `docs/archivo/`, con un `README.md` que diga de dónde vino cada cosa |
| Trabajo de Code | `docs/auditorias/` (sigue ignorado) |

### 2 · Mover, no reescribir

El texto se mueve **tal cual**. Solo se puede escribir texto nuevo en estos casos:

- las líneas que remiten («Movido a `docs/…` §…»);
- los encabezados de los documentos y carpetas nuevos;
- la sección «Documentación» de `CLAUDE.md` (§7), copiada tal cual;
- `ESTADO-DEL-PROYECTO.md`, que se arma desde el traspaso (§5).

No se resume, no se corrige redacción y no se «actualiza» contenido viejo.

### 3 · No se pierde nada

- **Solo se borran las copias idénticas byte a byte**, y se reporta cada una con su hash.
- **Todo lo demás se archiva** en `docs/archivo/`, incluidas las versiones viejas y distintas.
- La Parte 3 lo verifica **de forma mecánica**.

### 4 · Nombres que no cambian

No se renombran ni se mueven:
- `CLAUDE.md`, el `README.md` y el `SKILL.md` de la raíz (son el sistema de diseño);
- `docs/ROADMAP-producto.md`, `docs/ESTADO-DEL-PROYECTO.md`, `docs/MAPEO-IMPLEMENTACION.md` y `docs/ANALISIS-ASISTIDO.md`;
- `docs/SAMSUNG-HEALTH-MAPEO.md` y `docs/SEEDS.md`;
- los archivos de `docs/prompts/`: las colisiones de numeración (por ejemplo `23-d1-…` y `23-e6-…`) se reportan, pero no se arreglan.

### 5 · Lo que lee el código no se toca

Antes de mover cualquier archivo, buscá en `src/`, `scripts/`, `functions/` y en la configuración (`vite.config.ts`, `package.json`, etc.) si algo lo lee o lo importa. Por ejemplo, el prompt de análisis en `docs/analisis/`. **Lo que se lee desde el código queda donde está.**

### 6 · Vos no decidís el contenido

- Si una sección no encaja claro en un tipo de la tabla, **pará y reportá**.
- Si dos documentos se contradicen, **no elijas vos**: listá la contradicción y se decide en el chat.

### 7 · Usá `git mv`

Para mover archivos enteros, usá `git mv`, así se conserva la historia.

### Fuera de alcance

El repo del puente. Las reglas de §7 se le aplican después, en otro prompt.

---

## Parte 1 — Inventario y propuesta

**En esta parte no cambies nada.** Reportá en `docs/auditorias/ultimochat.md`:

1. **Inventario.** Todos los `.md` versionados, salvo `node_modules/` y `docs/auditorias/`: ruta, cantidad de líneas, fecha del último commit y tipo según la tabla de §1.
2. **Duplicados.**
   - Idénticos, por hash: se borran.
   - Distintos con el mismo nombre o contenido parecido (por ejemplo `uploads/MAPEO-IMPLEMENTACION.md`, de 445 líneas contra 2270): cuál es el vigente, y si la versión vieja tiene algo que **no está** en la vigente.
3. **Documentos que mezclan tipos.** Para `CLAUDE.md`, `ROADMAP-producto.md` y `ESTADO-DEL-PROYECTO.md`, y para cualquier otro que lo necesite, una tabla **sección → destino**.
   - Los ADRs se quedan en `CLAUDE.md` aunque hoy estén dentro de la sección de una serie.
4. **El `ESTADO-DEL-PROYECTO.md` actual:** qué secciones pasan a `docs/PROYECTO.md`, cuáles a `docs/reportes/` y cuáles al archivo.
5. **Lo que lee el código** (§5): la lista, y la confirmación de que nada de eso se mueve.
6. **Contradicciones** entre documentos.
7. **Lo que no encaja** en la tabla.
8. **Colisiones de numeración** en `docs/prompts/`, solo como lista.
9. **Índice de prompts.** Qué prompts faltan en §1 de `MAPEO-IMPLEMENTACION.md` y desde cuál se cortó la bitácora en prosa. Para cada uno que falte: número, título, commit y fecha, sacados de `git log` y de `docs/prompts/`.

**Pará y reportá.**

---

## Parte 2 — Ejecutar

Después de que Juan apruebe la Parte 1, y con los destinos que él apruebe:

1. **Copias idénticas:** se borran.
2. **Restos:** `uploads/`, los `(1)` y `(2)` que no sean idénticos, y lo demás que la Parte 1 marque como resto, van a `docs/archivo/`, con su `README.md` de origen (ruta original, fecha y por qué se archivó).
3. **`prompts-code/`** se integra a `docs/prompts/`. Si un archivo choca con uno que ya existe y no es idéntico, la versión de `prompts-code/` va a `docs/archivo/`.
4. **Secciones movidas.** Cada sección va a su destino, tal cual. En el lugar viejo queda **una línea que remite**.
5. **`docs/PROYECTO.md`:** se arma con las secciones estables que apruebe la Parte 1, tal cual.
6. **El plan de marcas** ya está integrado en `ANALISIS-ASISTIDO.md` (`d0decc9`). No se toca; solo se verifica que no haya quedado una copia en otro lado.
7. **Índices: lo hecho en un lugar, lo que viene en otro.**
   - **Lo ejecutado** va en §1 de `MAPEO-IMPLEMENTACION.md`. Agregá las filas que falten (punto 9 de la Parte 1) con número, título, commit y fecha, nada más. La bitácora en prosa **no** se reconstruye: se anota desde qué prompt falta.
   - **El §11 del roadmap queda solo con lo que viene:** P100 (hecho), P97, P98, P99 y P94, con las dependencias que ya tiene. Arriba, una línea que remite a §1 de `MAPEO-IMPLEMENTACION.md` para lo ejecutado.
   - **La tabla vieja de §11** (el plan de P66) se mueve tal cual a `docs/reportes/`, con un encabezado que avise que su numeración no coincide con lo ejecutado.
   - **El backlog** del traspaso (§7 del adjunto) va al roadmap, tal cual.
   - **Las listas de pendientes** de `CLAUDE.md` y del ESTADO viejo se mueven al roadmap. Si se contradicen, se reporta (§6).
8. **`docs/ESTADO-DEL-PROYECTO.md`** pasa a ser el traspaso:
   - el contenido es el adjunto `HANDOFF-2026-09-30.md`, tal cual;
   - solo cambian las líneas de estado que cambiaron desde el 30/09, marcadas con fecha: P93 commiteado (`600aa37`), el plan integrado (`d0decc9`), los prompts 97 y 98 commiteados y P100 en curso;
   - al final, con fecha 01/10, van las dos observaciones del cierre de P93: **la versión del prompt entre P98 y P99** y **la progresión en el análisis de sesión**. Para cada una, lo que Juan te haya dicho que se decidió; si no te dijo nada, quedan como abiertas.
9. **`CLAUDE.md`:**
   - la historia de las series S, I y H va a `docs/reportes/`, y los ADRs quedan;
   - la sección «Roadmap» pasa al roadmap y queda una línea que remite;
   - se agrega la sección «Documentación» con el texto de §7, tal cual.

---

## Parte 3 — Verificar que no se perdió nada

1. **Chequeo línea por línea.** Escribí un script en `docs/auditorias/` (queda fuera del commit) que:
   - tome todos los `.md` del commit base, antes de P100;
   - por cada línea no vacía, sin los espacios de los extremos, busque si aparece en algún `.md` del árbol nuevo, contando `docs/archivo/`;
   - reporte cuántas faltan y cuáles son.

   Cada línea que falte tiene que tener una justificación: una copia idéntica borrada, un encabezado reemplazado por una línea que remite, etc. **Se espera cero faltantes sin justificar.** Si hay alguno, pará y reportá.
2. **Enlaces internos.** Listá las referencias a archivos `.md` o a secciones que quedaron rotas, y arreglá las que apuntan a algo que se movió.
3. **Que el código no se rompió.** `tsc` limpio, tests y `npm run build`.

---

## Parte 4 — Cierre

- Agregá la entrada de P100 en la bitácora de `MAPEO-IMPLEMENTACION.md`.
- Mostrame:
  - la lista de archivos: borrados (con hash), movidos, archivados, creados y editados;
  - el resultado del chequeo de la Parte 3.
- **No commitees hasta que te lo diga.**

---

## 7 · Texto para `CLAUDE.md`: sección «Documentación»

Copialo tal cual:

```markdown
## Documentación — dónde va cada cosa (P100)

Cada tipo de información tiene **un solo lugar**. Los demás documentos remiten; no repiten.

| Tipo | Lugar |
|---|---|
| Reglas de trabajo y ADRs | `CLAUDE.md` |
| Contexto estable: infra, familia, máquina, fuentes de datos | `docs/PROYECTO.md` |
| Plan, orden de prompts y backlog | `docs/ROADMAP-producto.md` |
| Estado actual (el traspaso del chat) | `docs/ESTADO-DEL-PROYECTO.md` |
| Diseño de cada área | `docs/<AREA>.md` (p. ej. `ANALISIS-ASISTIDO.md`) |
| Bitácora e índice de prompts | `docs/MAPEO-IMPLEMENTACION.md` |
| Informes de auditoría e historia de series cerradas | `docs/reportes/` |
| Prompts | `docs/prompts/` |
| Diseño visual | Sistema de diseño en la raíz (`README.md`, `SKILL.md`, `ui_kits/`, `preview/`) |
| Archivo: versiones viejas y restos | `docs/archivo/` |
| Trabajo de Code (ignorado por git) | `docs/auditorias/` |

**Cuándo se actualiza cada uno**

- **Al cerrar un prompt** (lo hace Code):
  - la entrada en la bitácora y en el índice de `MAPEO-IMPLEMENTACION.md`;
  - el prompt marcado como hecho en el orden del roadmap;
  - un ADR en `CLAUDE.md` si quedó una decisión que no se re-discute;
  - si cambió el diseño de un área, su documento.
- **Al cerrar una sesión de chat:** el traspaso nuevo **reemplaza** a `ESTADO-DEL-PROYECTO.md`.
- **Hallazgos de una auditoría que tienen que quedar:** van a `docs/reportes/`, nunca solo a `docs/auditorias/`.
- **Cambios de diseño visual:** van al sistema de diseño.

**Reglas**

- Antes de crear un documento, mirá esta tabla: si el tipo ya tiene lugar, va ahí.
- **Mover, no copiar.** Lo que cambia de lugar deja en el lugar viejo una línea que remite.
- **No se borra documentación:** se archiva en `docs/archivo/` con su origen. Solo se borran las copias idénticas.
- Los nombres de los documentos principales no cambian.
- Lo que el código lee (por ejemplo, los prompts de `docs/analisis/`) no se mueve sin cambiar el código en el mismo prompt.
- Si dos documentos se contradicen, no se elige: se reporta y se decide en el chat.
```

---

## Decisiones de la Parte 1 (01/10)

Traspaso. Es el correcto, y hacés bien en esperar: se copia a ESTADO recién en la Parte 2, después de mover las secciones del ESTADO actual.

1. ADRs. Todos van a un archivo nuevo, docs/ADR.md, ordenados por número y con el texto tal cual, sacados de MAPEO-IMPLEMENTACION.md §5 y de CLAUDE.md.

En CLAUDE.md queda solo un índice: una línea por ADR con su título tal cual y la remisión a docs/ADR.md.
Los #037 a #042 llevan las dos redacciones: primero la de CLAUDE.md, y debajo la de MAPEO como «Redacción anterior (MAPEO §5)».
Las diferencias entre las dos redacciones se listan en el reporte; no se elige ninguna.

2. Reglas dentro de la historia de las series. Como propusiste: esas líneas quedan en CLAUDE.md y el resto va a docs/reportes/. Las líneas de estado («pendiente de decisión», «falta P90», «nada está deployado») van con la historia, no con las reglas.

3. «Qué es». El contexto (stack, familia) va a docs/PROYECTO.md. Las reglas (voseo, tokens, costo) quedan en CLAUDE.md.

4. Lo que no encaja.

FORMA-DE-TRABAJO-comida-familiar.md queda donde está, y PROYECTO.md remite a él como referencia.
MAPEO-ADDENDUM.md: si describe implementación vigente, va tal cual como anexo al final de MAPEO-IMPLEMENTACION.md; si es historia de un prompt, va a docs/reportes/. Decime cuál aplicaste.
PROMPTS-design.md: la versión vieja de docs/prompts/ va al archivo, y la vigente pasa a docs/prompts/ con git mv.
functions/README.md y docs/prompts/seed-maria.ts quedan donde están.
MAPEO §3 y §4, como propusiste.
46-b2-1-video-youtube-curado: la (2) queda como vigente, sin renombrar; las otras dos van al archivo.

5. Pendientes.

El backlog vigente del roadmap es el del traspaso (§7), tal cual.
Las listas de CLAUDE.md, del ESTADO viejo y del backlog de MAPEO van tal cual a docs/reportes/pendientes-anteriores-a-P100.md, con un encabezado que diga que lo vigente está en el roadmap.
En el reporte, listá los ítems de esas tres listas que no estén en el traspaso y que no encuentres hechos, con la evidencia (commit o prompt). Eso lo decido en el chat.

Contradicciones.

Las de estado (qué está hecho, qué se deployó, cifras) se resuelven por el traspaso, y lo viejo va con la historia.
Si alguna de las 9 es sobre una regla o una decisión, no sobre estado, pará y listala.
Ruta del repo (1). El error es del traspaso. La app está en OneDrive a propósito, y el puente está en C:\dev\shapeup-bridge. En ESTADO §2, corregí la fila de la app con la ruta real y agregá «(corregido el 01/10: el traspaso del 30/09 decía C:\dev\shapeup)».
«220 − edad» (6). Vale el traspaso: quedó descartada el 30/09. La nota del ADR #025 se mueve tal cual a docs/ADR.md, y debajo agregás una línea con fecha: «01/10: descartada — ver ESTADO §5 (no es lo que usa Samsung)». Es la única excepción a no escribir texto nuevo en los ADRs.
Las otras líneas de estado que listaste (P93, el plan, 97 y 98, el paso 1 y P100) se marcan con fecha, como ya dice P100.

Índice. Agregá P84 a P93 a §1 de MAPEO como propusiste. P86 y P88 se marcan «sin archivo de prompt».

Sección «Documentación» de CLAUDE.md (§7 del prompt):

En la tabla, reemplazá la fila «Reglas de trabajo y ADRs» por dos: «Reglas de trabajo e índice de ADRs → CLAUDE.md» y «ADRs completos → docs/ADR.md».
En «Al cerrar un prompt», el ADR va en docs/ADR.md y su línea en el índice de CLAUDE.md.

Arrancá la Parte 2 y la Parte 3, y pará en la Parte 4 sin commitear.
