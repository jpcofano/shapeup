# Prompt 44 — F4 · "Empezar este ejercicio" (atajo a sesión de un solo ejercicio)

> **Diseño + flujo** (feature chica sobre motor existente). Origen: pedido del owner
> (2026-06-27). Hoy para entrenar un ejercicio suelto hay que ir a **Sesión libre**
> (`/entrenar/libre`), abrir el armador "Armá tu sesión", sumar el ejercicio y recién ahí
> "Empezar". El owner quiere un **atajo de un toque** desde la ficha del catálogo que entre
> directo al ciclo guiado con ese ejercicio pre-cargado a **3 series**. Castellano voseo,
> tokens siempre. **Reusá el motor que ya existe** (`EntrenarSesionLibre`, `useEntrenarState`,
> `BloqueGuiado`, quick-log) — NO escribas un flujo nuevo en paralelo.
>
> **Decisiones del owner (defaults, no re-discutir):**
> - Botón en la **ficha del catálogo** (dentro del detalle expandido de `EjercicioCard`).
> - **Entra directo** al ciclo con **3 series × 10 reps**; los pesos y reps se cargan adentro
>   (quick-log que ya existe). Sin paso de configuración previa.
> - **Se guarda en Historial** como sesión libre (mismo `finalizarSesion({ tipo: "libre" })`).
> - Al completar, la pantalla de fin **ofrece "Sumar otro ejercicio"** → cae en el flujo de
>   sesión libre normal (el usuario puede seguir agregando).
>
> **(1) Pre-seed de `EntrenarSesionLibre`.** Hoy arranca siempre en fase 1 (selector) con
> `ejercicios: []`. Agregá una forma de **arrancar ya en fase 2 con un ejercicio dado**:
> - Opción A (preferida): nueva ruta `/entrenar/ejercicio/:idEjercicio` que monta el mismo
>   componente con una prop/flag `ejercicioInicialId`. En `useEffect` de montaje: cargá el
>   ejercicio (`getEjercicios()` filtrando por id, o un `getEjercicio(id)` si existe), seteá
>   `ejercicios=[ej]`, `ejDefaults=[{series:3, reps:10}]` y `sesionIniciada=true` → entra
>   directo al ciclo guiado.
> - Si el ejercicio no carga (id inválido / offline): mostrá el selector vacío normal
>   (fallback, sin pantalla rota).
> - El botón "X" de salir vuelve a `/catalogo` (o a `-1`), no a `/entrenar`, cuando se entró
>   por este atajo.
>
> **(2) Botón en la ficha del catálogo.** En `EjercicioCard` (detalle expandido, en
> `src/routes/Catalogo.tsx`), agregá un **CTA primario "Empezar este ejercicio"** (con ícono
> `Zap`, consistente con el "Empezar" de la libre) que navegue a la ruta de (1) con el
> `ej.idEjercicio`. Ubicalo arriba de "Ejecución" / junto a la ficha técnica, visible sin
> tener que scrollear todo el detalle. Si el ejercicio es `traduccion === "pendiente"` igual
> se puede entrenar (no lo bloquees).
>
> **(3) Pantalla de fin — "Sumar otro ejercicio".** En la vista `terminada` de
> `EntrenarSesionLibre`, además de "Finalizar y guardar" y "Empezar de nuevo", agregá
> **"Sumar otro ejercicio"** que vuelva a fase 1 (selector) **conservando** lo ya hecho como
> primer bloque, para que la sesión continúe como libre normal. (Si reusar el estado es
> costoso, una alternativa aceptable: el botón abre el `ExercisePicker` directamente y al
> elegir suma el bloque y sigue. Documentá cuál elegiste.)
>
> **(4) Que el motor banque 1 solo bloque.** Verificá que `buildVirtualRutina`, los dots de
> progreso y `rutinaCompleta` se comporten bien con **un único bloque** (no debería haber
> "siguiente ejercicio"; al cerrar las 3 series → pantalla de fin). Si algún copy asume
> plural ("ejercicios"), ajustalo.
>
> **(5) Documentación en el repo (obligatorio).** Antes de cerrar:
> - Bitácora **F4** en `docs/MAPEO-IMPLEMENTACION.md` (qué se agregó, ruta nueva, decisión del
>   punto (3), test sumado).
> - **Pegá / mergeá el ADDENDUM completo de abajo** (auditoría jun-2026, decisiones del owner,
>   deuda abierta y cola de prompts) en `docs/MAPEO-IMPLEMENTACION.md`, en las secciones que
>   correspondan — para que toda la planificación quede versionada en el repo y no solo en el
>   proyecto de diseño. A medida que cierres cada etapa (D14/D15/D16/B2/F4), mové su fila a ✅
>   con su commit.
> - Dejá registrado el **recordatorio operativo**: tras correr el importador, resubir el
>   catálogo a Firestore con `seed-ejercicios.ts --force` (si no, la app muestra catálogo viejo).
>
> **Verificación:** desde el catálogo, "Empezar este ejercicio" en una sentadilla entra
> directo al ciclo guiado con 3 series; cargás reps+kg, completás las 3, cae en la pantalla
> de fin; "Finalizar y guardar" deja el registro en Historial como libre; "Sumar otro"
> continúa la sesión. Reduced-motion / offline no rompen. `tsc -b` limpio, tests verdes
> (sumá uno: pre-seed de 1 ejercicio entra en fase 2 con 3 series). Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora F4). Commit + push. **Pará y esperá mi revisión.**
>
> ---
> **Nota kit:** este atajo todavía no está en el UI kit (`ui_kits/shapeup`). Cuando se cierre
> en el repo, reflejarlo en el kit para mantener la fuente de verdad (botón "Empezar este
> ejercicio" en la ficha del catálogo del kit).


---

# ANEXO — MAPEO-ADDENDUM completo (pegar/mergear en `docs/MAPEO-IMPLEMENTACION.md`)

> Code: este es el ADDENDUM referido en el paso (5). Integralo en el mapeo del repo para que
> toda la planificación (auditoría, decisiones, deuda, cola) quede versionada. No lo dupliques
> si ya está; mergeá por sección.

# ADDENDUM al MAPEO — para pegar en `docs/MAPEO-IMPLEMENTACION.md`

> Generado por Claude Design (2026-06-09). Son entradas **planificadas** (camino a ejecutar),
> no "hechas". Pegar en las secciones correspondientes del mapeo del repo y, a medida que Code
> las cierre, mover a ✅ con su Bitácora. **La fuente de verdad sigue siendo el mapeo del repo.**

---

## A) Filas para la tabla de Estado (§1) — pista nueva "Flujo de programa" + kit + fix

| Etapa | Descripción | Estado | Fecha |
|---|---|---|---|
| **Kit (Design)** | | | |
| K-MEDIA | Sesión guiada: pestañas Foto/Demo/Músculo (MediaTabs) en el UI kit | ✅ kit | 2026-06-09 |
| K-HOME3 | Home con 3 layouts seleccionables (Aurora/Stadium/Clásico) en el kit | ✅ kit | 2026-06-08 |
| K-PROG | Mapa muscular, sparklines, records, sesión libre, instrucciones legibles en el kit | ✅ kit | 2026-06-09 |
| **Funcional + Diseño (a ejecutar)** | | | |
| F1 (PROG-MIEMBRO) | Programa activo **por miembro** (no global) | ⬜ | — |
| F2 (PROG-SEMANA) | Días del programa **por día de semana** (L–D) + descansos | ⬜ | — |
| F3 (PROG-FLUJO) | Flujo elegir/cambiar programa: lista → detalle con vista semanal → "Activar para mí" | ⬜ | — |
| D11 | Pulido visual del flujo de programa (vista semanal, selección, WeekStrip con descansos) | ⬜ | — |
| D12 | MediaTabs (Foto/Demo/Músculo) en BloqueGuiado del repo | ⬜ | — |
| D13 | Home: 3 layouts seleccionables + Historial/Salud enriquecidos (sparklines, records, zonas) en el repo | ⬜ | — |
| **Fix** | | | |
| FIX-SALUD | Importador de salud no importa bien — diagnóstico + arreglo (ver §C) | ⬜ | — |
| **Auditoría jun-2026 (ver §D)** | | | |
| D14 | Datos: validador + patrones + descansos + badge EN + re-pase muestra (A1–A4) | ⬜ | — |
| D14b | Lotes de traducción (prompt 40b, repetible — se intercala cuando el owner quiera) | ⬜ | — |
| B2 | Video de demostración real en MediaTabs + poblar `videoUrl` (Wikimedia CC) | ✅ | prompt 43 · commit 3478975 |
| F4 | "Empezar este ejercicio": atajo a sesión de un solo ejercicio (3 series) desde la ficha | ⬜ | prompt 44 |
| D15 | Micro-interacciones: stagger de cards, anillo animado, feedback de serie, tabs (C9) | ⬜ | — |
| D16 | Pulido visual: Home métrica única, Historial card consistente, Salud composición, scrim sesión, FAB (B5–B8, C10) | ⬜ | — |

---

## B) El flujo de programa semanal — análisis y camino (NUEVO)

### Estado hoy (lo que hay)
- `Programa.dias: DiaPrograma[]` — cada día con `orden`, `tipo` (`"descanso"` | activo) e `idRutina`.
  **La estructura semanal con descansos YA existe en el dato.**
- `proximaSesion(programa, historialSemana)` — secuencial por `orden`, salta descansos, da
  `{ indice, total }` ("Día N de M"). Pura. 10 tests.
- `getProgramaActivo()` — devuelve el **primer** programa con `estado: "Activo"` (GLOBAL).
- `visibilidad` — owner ve todo; otros ven programas/rutinas asignados en `/config/visibilidad`.

### Huecos (lo que falta y por qué no está claro)
1. **No hay UI para elegir/activar el programa de un miembro.** `getProgramaActivo()` agarra el
   primero Activo; nadie "elige el suyo".
2. 🔴 **"Activo" es global, no por miembro.** Si JP y María activan su programa, `getProgramaActivo()`
   devuelve el primero de la lista → colisión en app familiar.
3. **La estructura semanal no se muestra.** El dato (4 días + 3 descansos, qué toca cada día)
   existe pero la Home solo dice "Día N de M". No hay vista "tu semana: L Empuje · M descanso…".
4. **No hay flujo de cambio** de programa, ni qué pasa con la semana en curso.
5. **Descansos invisibles** en la WeekStrip (no distingue entrenado / planificado / descanso).

### Decisiones tomadas con el owner (2026-06-09)
- **F1:** el programa activo es **por miembro**. Se elige y se cambia desde la app.
- **F2:** los días del programa son **por día de semana** (Lunes=Empuje, Martes=descanso…),
  no secuenciales. Reemplaza el criterio secuencial de `proximaSesion` por "qué toca HOY según
  el día de la semana", manteniendo el fallback de "siguiente sin hacer" para días salteados.

### Camino a ejecutar (orden)
1. **F1 — Programa activo por miembro (funcional).**
   - Modelo: en vez de `estado: "Activo"` global, un mapa `config/programaActivo` por miembro
     `{ juanpablo: "PRG-0001", maria: "PRG-0012", … }` **o** campo `miembroActivo?` en el programa.
     *(Decisión de implementación de Code; preferencia: doc `config/programaActivo`, análogo a
     `config/visibilidad`, sin tocar los docs de `/programas`.)*
   - `getProgramaActivo(miembroId)` pasa a recibir el miembro y leer ese mapa.
   - `setProgramaActivo(miembroId, programaId)` nuevo.
   - **No** romper retrocompat: si no hay entrada para el miembro, fallback al `estado:"Activo"` actual.
2. **F2 — Días por día de semana (funcional).**
   - `DiaPrograma` ya tiene/recibe `diaSemana` (0–6 o "L".."D"). Asegurar que el seed lo puebla.
   - Nueva `sesionDeHoy(programa, hoyDiaSemana, historialSemana)` → la rutina del día actual,
     o estado "descanso" si hoy es descanso, o "ya entrenaste hoy".
   - `proximaSesion` se mantiene como fallback (días salteados / "qué sigue").
3. **F3 — Flujo elegir/cambiar (funcional + UI mínima).**
   - **Biblioteca → tab "Programas"**: lista (nombre, X días/sem, objetivo, nivel). Filtrada por
     visibilidad del miembro.
   - **Detalle de programa**: vista semanal (L–D con rutina o descanso), "X días/sem · Y descanso",
     `comoUsar`/`reglasProgresion`, botón **"Activar para mí"** → `setProgramaActivo`.
   - **Cambiar**: desde el detalle de otro programa, "Activar para mí" reemplaza el actual
     (confirmar si hay semana en curso; el historial no se borra).
4. **D11 — Pulido visual del flujo.**
   - Vista semanal como fila L–D con estado por día (rutina = chip de color/acento;
     descanso = ícono tenue 💤/"—"). WeekStrip de Home distingue **entrenado** (bíceps lleno) /
     **planificado** (bíceps outline) / **descanso** (ícono descanso).
   - Detalle de programa premium (cabecera, vista semanal, días expandibles, botón activar).
   - Mock primero en el kit, después prompt para Code.

### Restricciones
- No tocar `lib`/`types`/`auth` salvo lo que F1/F2 requieran explícitamente (y con tests).
- Nav de 6 ítems intacto (Programas entra por tab en Biblioteca, no suma ítem).
- Tokens siempre, voseo, re-skinea por tema.

#### ADR propuesto — Programa activo por miembro vía `config/programaActivo`
- **Decisión:** doc `config/programaActivo` (mapa miembro→programaId), análogo a `config/visibilidad`.
  `getProgramaActivo(miembroId)` lo lee; fallback a `estado:"Activo"` si no hay entrada.
- **Razón:** evita migrar los docs de `/programas`; un solo doc, fácil de leer/escribir; mismo
  patrón que visibilidad. Permite que cada miembro tenga su programa sin colisión.

#### ADR propuesto — Día por día de semana, con fallback secuencial
- **Decisión:** la sesión "de hoy" se resuelve por `diaSemana`; si el usuario saltó días,
  `proximaSesion` (secuencial) sigue dando "lo siguiente sin hacer".
- **Razón:** la familia entrena en días fijos (quieren ver "hoy toca / hoy descansás"), pero no
  hay que castigar a quien se saltea un día.

---

## C) FIX-SALUD — El importador de salud no importa bien (NUEVO)

> Reportado por el owner (2026-06-09): "el importador de salud no está importando bien".
> Necesita **diagnóstico antes de arreglar** — no asumir la causa.

### Contexto (lo que ya se tocó antes)
- **P25 (E6.4):** `ignoreUndefinedProperties: true` + `stripUndef` en parsers + `Promise.allSettled`
  por fila + mensaje "X importados · Y omitidos". O sea: ya hubo un fix de resiliencia.
- **E6.3:** importador zip-first (`samsungZip.ts`), extracción selectiva, niveles básico/completo/biométrico.
- **E6.2:** match biométrico por `custom_id` + `live_data.json`.

### Qué hay que hacer (diagnóstico dirigido)
1. **Reproducir con un export real** y registrar el síntoma exacto: ¿no importa nada? ¿importa
   parcial? ¿importa pero los datos quedan mal (fechas, unidades, zona, duplicados)? ¿falla la
   validación del ZIP? Anotar el mensaje y el `{ importados, omitidos }`.
2. **Sospechas a verificar (sin asumir):**
   - **Formato del CSV/JSON cambió** (Samsung Health actualiza headers/columnas) → los parsers
     (`parsearPeso`/`parsearEjercicio`/`parsearSueno`/`parsearMetricas`) no matchean columnas.
   - **Fechas/zonas horarias**: parseo de fecha → `idMetrica`/`idMedicion` mal → choque o descarte.
   - **Encoding/locale** (coma decimal `,` vs punto `.`) → `Number()` da `NaN` → fila omitida.
   - **Markers de validación del ZIP** demasiado estrictos → ZIP válido rechazado.
   - **Índice de `live_data` por datauuid** no encuentra match → biometría vacía (puede ser
     esperado, no un bug).
   - **Reglas Firestore** rechazando el write (permiso) → todo omitido con error genérico.
3. **Arreglar la causa raíz** (no parchar el síntoma) y **agregar un test con el fixture real**
   (un CSV/registro que reproduzca el fallo) para que no regrese.
4. **Mejorar el feedback** si el diagnóstico lo amerita: que el preview/resultado diga *por qué*
   se omitió una fila (columna faltante, fecha inválida, etc.), no solo el conteo.

### Entregable
- Bitácora `FIX-SALUD` con: síntoma reproducido, causa raíz, archivos tocados, test de regresión
  con fixture real, y verificación (import de prueba con conteo correcto).
- Si el formato de Samsung Health cambió, documentarlo en `docs/SAMSUNG-HEALTH-MAPEO.md`.

#### Nota
No reescribir el importador zip-first ni el match biométrico (E6.2/E6.3 andan); este es un
**fix dirigido** sobre el parseo/persistencia que está fallando hoy.

---

## D) Auditoría 2026-06-10 — decisiones y prompts (NUEVO)

> Auditoría rápida del UI kit + foundations + datos, contrastada con el repo. Informe completo:
> `explorations/AUDITORIA-kit-datos-jun2026.md` (en el proyecto de diseño). El owner decidió
> incorporar **los 10 hallazgos** al mapeo (2026-06-10).

### Hallazgos → prompts
| Hallazgo | Sev | Resumen | Prompt |
|---|---|---|---|
| A1 | 🔴 | Traducciones ES pierden ~80% del detalle (107/115 con <60% del EN; se pierden tips, respiración, advertencias) | 40 (D14) |
| A2 | 🔴 | 758/873 ejercicios sin traducir → catálogo bilingüe, fichas pendientes vacías | 40 (D14) |
| A3 | 🟠 | `patronAprox()` etiqueta mal patrones (chin-up = "tracción horizontal", default "Aislamiento") | 40 (D14) |
| A4 | 🟡 | `descansoSugeridoSeg` fijo 75 s para todo | 40 (D14) |
| C9 | 🟠 | Sin micro-interacciones: tabs/anillo/serie sin feedback | 41 (D15) |
| B5 | 🟠 | Home: "Día 3 de 4" vs anillo "2/4 sesiones" se contradicen | 42 (D16) |
| B6 | 🟡 | Historial: chip RPE inconsistente, jerarquía plana | 42 (D16) |
| B7 | 🟡 | Salud · Composición: media pantalla vacía, gráfico sin puntos | 42 (D16) |
| B8 | 🟡 | Sesión guiada: dock tapa instrucciones sin señal de scroll | 42 (D16) |
| C10 | 🟡 | FAB "+" sin acción (kit) — divergencia con repo | 42 (D16) |

### Decisiones del owner (2026-06-10)
- **A2 — política de catálogo:** se importa TODO (873). Pendientes con badge "EN" + filtro
  "Solo en español". Cobertura se amplía por lotes priorizando beginner+strength hogareño.
- **A1 — reglas de traducción fiel:** 1 paso EN = 1 paso ES; "Tip:" → `puntosClave`;
  "Caution:" → `erroresComunes`; mantener respiración. Validador de ratio ≥ 0.7 en el importador.
- **Anillo como métrica única** de semana en Home (B5); la línea del saludo es contexto.

### Deuda abierta tras B2 (prompt 43, hecho 2026-06-27)
- **Badge "EN" / filtro "Solo en español" no funcionan en producción**: `seed-ejercicios.ts`
  descarta el campo `traduccion` antes de escribir en Firestore (`const { traduccion: _t, ...data }`),
  pero el Catálogo lo lee como `ej.traduccion === "pendiente"`. Funciona en el kit, no en la app.
  Decisión del owner (2026-06-27): **dejarlo para después** — eventualmente se traducen todos
  los 873, momento en que el badge deja de tener sentido. Si se quiere antes: conservar
  `traduccion` en el seed (fix de 1 línea).
- **2 patrones sin clip libre**: Core anti-extensión (plank) y Core anti-rotación
  (russian twist / woodchop) → muestran "Video pronto". Buscar clip CC o grabar propio.
- **iOS Safari**: los `.webm` de Commons no reproducen en iPhone y no hay `.mp4` equivalente.
  El fallback de foto cubre iOS por ahora. Pendiente: servir `.mp4` (transcode propio o
  buscar fuente mp4) si la base de usuarios incluye iPhone.
- Resultado del import: **790/873** con `videoUrl`; 230 tests verdes (4 nuevos del mapeo).

### Orden en la cola
Después de la cola actual (36 → 37 → 35 → 38 → 39): **40 → 41 → 42 → 43 → 44**, con **40b**
(lote de traducciones, repetible) intercalado entre etapas cuando el owner quiera — un lote por vez.

> **⚠ Recordatorio operativo (post-B2):** tras correr el importador hay que **resubir el
> catálogo a Firestore** (`npx tsx scripts/seed-ejercicios.ts --force`), si no la app sigue
> mostrando el catálogo viejo (ej.: "Video pronto" pese a tener `videoUrl` en el código).
> La app lee `ejercicios` en vivo de Firestore (`getEjercicios`), no de un JSON bundleado.

### Avance en el UI kit (otra cuenta, 2026-06) — ya hecho en el kit, falta portar al repo
- **MediaTabs alineado al repo + 2 tabs**: el kit respeta el modelo real (`imagenes[]`,
  `videoUrl`, `grupoMuscularPrimario`, `gruposSecundarios`) y el owner decidió **2 tabs**:
  **Demo** (foto → click → video) + **Músculo**. El prompt 43 lleva esa unificación al repo
  (hoy el repo tiene 3 tabs Foto/Demo/Músculo).
- **BodyMap portado** fiel desde `src/components/BodyMap.tsx` (frente+espalda, primario verde,
  secundarios tenues) → nuevo `body-map.jsx`; clases `media-*`/`body-map-*` portadas al CSS.
- **Videos de demo poblados en el kit** con clips públicos de Wikimedia Commons
  (serie *exercise demonstration video*, FitnessScape, **CC BY 3.0**), mapeados por patrón.
  Spinner "Cargando demo…" + fallback "Video pronto". → esto es lo que el **prompt 43** lleva al repo.
- **Caveat técnico**: `.webm` no reproduce en iOS Safari; el preview sandbox throttlea video
  externo (no es problema de las URLs). Anotado en el prompt 43 (sumar `.mp4` para iOS).

### Divergencias kit ↔ repo todavía abiertas (no bloquean, anotar)
- Mapeo rutina→sesión **hardcodeado a RUT-0021 en el kit**; el repo ya lo resuelve por `:rutinaId`.
- 4 de 5 rutinas **sin bloques** en el kit (data mock incompleta).
- Catálogo: kit 6 ejercicios vs repo 800+. (No es target llevar el catálogo completo al kit;
  el kit es muestra. Lo real se cubre con D14/40b en el repo.)
- `videoUrl` propio (footage exacto por ejercicio) sigue **sin existir** en repo ni kit;
  43 puebla representativos CC mientras tanto.

### Lo que la auditoría marcó como sólido (no tocar)
Foundations/temas, flujo de programa (Home ↔ Entrenar ↔ Detalle), sesión guiada (MediaTabs,
steppers), estructura del importador (descarga automática, `--solo-traducidos`).

---

## E) Pendientes que siguen abiertos (recordatorio del mapeo)
- 🔴 **Privacidad — emails en historial de git** (decisión del owner: purgar con BFG/filter-repo
  o repo privado). Sigue pendiente.
- ⬜ `lib/recomendaciones.ts` — motor de recomendaciones (futuro).
- B2 (video real del ejercicio) / B4 (variantes) — futuros.
