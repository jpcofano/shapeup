# ShapeUp — Mapeo de implementación (bitácora viva)

**Quién lo mantiene:** Claude Code. Al cerrar cada etapa agrega Bitácora + Estado + Mapa del código.
**Regla:** si algo se construyó y no quedó acá, no está hecho.

**Convención de numeración (3 pistas paralelas).** El mapeo "1 prompt = 1 etapa" ya no aplica; conviven:
- **Prompts** (`docs/prompts/NN-…md`): secuencia numérica corrida (01–27), solo un ID. Cada uno mapea a una entrada de la Bitácora.
- **Etapas (E1–E6, con sub-etapas E6.1/.2/.3, E6.4…):** hitos funcionales del producto.
- **Diseño (D1–D8):** pista de Claude Design (pulido visual + PWA), independiente.
La fuente de verdad del estado es esta tabla + la Bitácora, no el número de prompt.

---

## 1. Estado por etapa

| Etapa | Descripción | Estado | Fecha |
|---|---|---|---|
| E0 | Base ya provista (esquema, lógica, reglas, scaffold) | ✅ | 2026-06 |
| E1 | Auth Google + whitelist + AppShell | ✅ | 2026-06-03 |
| E2 | Catálogo — data + filtros + pantalla UI | ✅ | 2026-06-04 |
| E3 | Rutinas — data + Biblioteca + crear/editar + cache | ✅ | 2026-06-03 |
| E4 | Entrenar — hook + sesión guiada + descanso | ✅ | 2026-06-04 |
| E5 | Programas + sesiones + historial + visibilidad | ✅ | 2026-06-04 |
| E6 | Salud — CSV Samsung Health + progreso | ✅ | 2026-06-04 |
| E6.1 | Métricas genéricas de salud (granularidad diaria) | ✅ | 2026-06-05 |
| E6.2 | Match biométrico (FC por serie + `inicioMs/finMs`) | ✅ | 2026-06-07 |
| E6.3 | Importador zip-first (extracción selectiva) | ✅ | 2026-06-07 |
| **D (Pulido visual)** | | | |
| D1 | Identidad + sistema de temas (tokens, 8 temas, ThemeProvider, Brand, Bicep) | ✅ | 2026-06-05 |
| D2 | Home (header marca, WeekStrip con bíceps, card Tu semana) | ✅ | 2026-06-06 |
| D3 | Entrenar / EntrenarSesion (BloqueGuiado, DescansoTimer, finalización) | ✅ | 2026-06-06 |
| D4 | Biblioteca + Catálogo (tabs, tarjetas, filtros, detalle) | ✅ | 2026-06-06 |
| D5 | Historial + Progreso (lista con bíceps, detalle, MiniChart) | ✅ | 2026-06-06 |
| D6 | Salud (tabs, zonas FC, preview import) | ✅ | 2026-06-06 |
| D7 | Perfil + auth (selector de tema, login, no-autorizado) | ✅ | 2026-06-06 |
| D8 | PWA instalable + botón "Instalar app" | ✅ | 2026-06-07 |
| **Aplicados (post-E6.3)** | | | |
| P25 (E6.4) | Fix importador: `ignoreUndefinedProperties` + `allSettled` resiliente por fila | ✅ | 2026-06-07 |
| P26 | Carga (`cargaKg`) + reps en todas las rutinas de casa (seed) | ✅ | 2026-06-07 |
| P27 | Imágenes: render en Catálogo/guiado + fotos FEDB + mapeo 34 propios | ✅ | 2026-06-07 |
| P28 (A1) | "Empezar" claro — próxima sesión + 3 puertas | ✅ | 2026-06-08 |
| P31 (D9) | Home Aurora+ — anillo SVG, glass card, bento tiles | ✅ | 2026-06-08 |
| P32 (A2) | Sesión libre — selector de ejercicios, reducer virtual, historial tipo libre | ✅ | 2026-06-08 |
| P33 (B1) | Explicaciones ricas — FichaTecnica (chips) en Catálogo + contexto compacto en BloqueGuiado | ✅ | 2026-06-08 |
| P34 (D10) | Pulido visual — selector libre premium, FichaTecnica 2×2, badge Libre en detalle, micro-animaciones | ✅ | 2026-06-08 |
| **Kit (Design completado — pendiente de repo)** | | | |
| K-MEDIA | Sesión guiada: pestañas Foto/Demo/Músculo (MediaTabs) en el UI kit | ✅ kit | 2026-06-09 |
| K-HOME3 | Home con 3 layouts seleccionables (Aurora/Stadium/Clásico) en el kit | ✅ kit | 2026-06-08 |
| K-PROG | Mapa muscular, sparklines, records, sesión libre, instrucciones legibles en el kit | ✅ kit | 2026-06-09 |
| **Funcional + Diseño (a ejecutar)** | | | |
| F1 (PROG-MIEMBRO) | Programa activo **por miembro** (no global) — `config/programaActivo` + `getProgramaActivo(miembroId)` | ✅ | 2026-06-09 |
| F2 (PROG-SEMANA) | Días del programa **por día de semana** (L–D) + descansos — `sesionDeHoy()` | ✅ | 2026-06-09 |
| F3 (PROG-FLUJO) | Flujo elegir/cambiar programa: lista → detalle con vista semanal → "Activar para mí" | ✅ | 2026-06-09 |
| D11 | Pulido visual del flujo de programa (VistaSemanal, Home descanso, Entrenar consistente) | ✅ | 2026-06-09 |
| D12 | MediaTabs (Foto/Demo/Músculo) en BloqueGuiado del repo | ✅ | 2026-06-10 |
| D13 | Home: 3 layouts seleccionables + Historial/Salud enriquecidos (sparklines, records, zonas) en el repo | ✅ | 2026-06-10 |
| **Fix** | | | |
| FIX-SALUD | Importador de salud: 3 bugs del formato Samsung Health 2025+ — corregido | ✅ | 2026-06-09 |
| **Auditoría jun-2026 (ver Bitácora)** | | | |
| D14 | Datos: validador + patrones + descansos + badge EN + re-pase muestra (A1–A4) | ✅ | 2026-06-10 |
| D14b | Lotes de traducción (prompt 40b, repetible — se intercala cuando el owner quiera) | ⬜ | — |
| D15 | Micro-interacciones: stagger cards, anillo animado, feedback de serie, tabs (hallazgo C9) | ✅ | 2026-06-10 |
| D16 | Pulido visual: Home métrica única, Historial card, Salud composición, scrim sesión, FAB (hallazgos B5–B8, C10) | ✅ | 2026-06-11 |
| P43 (B2) | Video demo real en MediaTabs — 2 tabs (Demo/Músculo) + `videoUrl` por patrón (FEDB) | ✅ | 2026-06-27 |
| P44 (F4) | "Empezar este ejercicio" — atajo de 1 toque a sesión de un solo ejercicio (3×10) desde el catálogo | ✅ | 2026-06-28 |

---

## 2. Bitácora

### [2026-06-28] P44 (F4) — "Empezar este ejercicio": atajo a sesión de un solo ejercicio

- **`src/App.tsx`** — nueva ruta fullscreen `/entrenar/ejercicio/:idEjercicio` (junto a `/entrenar/libre`), monta el mismo `EntrenarSesionLibre`.
- **`src/routes/EntrenarSesionLibre.tsx`** — reusa el motor existente (`useEntrenarState`, `buildBloqueLibre`/`buildVirtualRutina`, `BloqueGuiado`, quick-log), sin flujo nuevo en paralelo:
  - **Pre-seed:** `useParams().idEjercicio` → `useEffect` de montaje llama `getEjercicio(id)`; si carga, `ejercicios=[ej]`, `ejDefaults=[{series:3,reps:10}]` (mismo `defaultsParaEj`, ahora exportado para test) y `sesionIniciada=true` → entra directo a fase 2. Mientras resuelve, pantalla de carga (`.spinner`) en vez de flashear el selector vacío. Si falla (id inválido/offline) o no hay `idEjercicio`: selector normal de fase 1, sin pantalla rota.
  - **Salida (`salir()`):** si se entró por el atajo (`viaAtajo`), el botón "X" y el flujo de guardado sin `memberId` navegan con `navigate(-1)` (vuelve al catálogo); si no, `/entrenar` como antes.
  - **(3) "Sumar otro ejercicio"** — decisión tomada (alternativa B del prompt, la más simple): en la pantalla de fin se abre el `ExercisePicker` directamente; al elegir, `sumarYContinuar()` agrega el bloque al final de `ejercicios`/`ejDefaults` (mismo estado que ya usa fase 1) y mueve `bloqueActual` al nuevo índice (`session.irABloque`). Como `useEntrenarState` persiste el estado por `sessionKey` y no lo resetea al cambiar `rutina`, los bloques ya completados quedan intactos; `rutinaCompleta` vuelve a `false` con el bloque nuevo incompleto y la vista cae sola en "fase 2 — en curso" sobre ese bloque. No se tocó el reducer puro de `entrenarState.ts`.
- **`src/routes/Catalogo.tsx`** — `EjercicioCard`: botón primario "Empezar este ejercicio" (ícono `Zap`, mismo patrón visual que el "Empezar" de la libre) arriba de la imagen/ficha técnica en el detalle expandido, visible sin scrollear. Navega a `/entrenar/ejercicio/${ej.idEjercicio}`. Funciona igual con `traduccion:"pendiente"` (no bloqueado).
- **Motor con 1 solo bloque (punto 4):** verificado — `proximoBloqueIncompleto` no encuentra otro bloque tras completar el único existente, así que `bloqueActual` no se mueve y `rutinaCompleta` pasa a `true` directo (sin "siguiente ejercicio"). `BloqueGuiado` ya decía "Ejercicio 1 de 1" sin asumir plural; no hizo falta tocar copys.
- **`src/lib/entrenarState.test.ts`** (nuevo describe) — regresión: rutina virtual de 1 bloque pre-cargado a 3×10 queda incompleta tras la 1ra/2da serie y se completa recién en la 3ra, sin mover `bloqueActual` (no hay "siguiente"). 231 tests verdes, `tsc -b` limpio.
- **Verificado:** dev server (Vite) levanta sin errores y los módulos nuevos (`EntrenarSesionLibre.tsx`, `Catalogo.tsx`) transpilan limpio. **No se pudo probar el click-through real en navegador** (sin `chromium-cli` en este entorno + la app requiere login real de Google contra la whitelist, no automatizable sin credenciales) — pendiente de que el owner lo pruebe a mano siguiendo la Verificación del prompt 44.
- **Pendiente (nota del prompt, no bloquea):** portar este atajo al kit (`ui_kits/shapeup`) cuando se cierre en el repo.

### [2026-06-27] P43 (B2) — Video de demostración real en MediaTabs

- **`src/components/entrenar/MediaTabs.tsx`** — de 3 tabs (Foto/Demo/Músculo) a **2 tabs (Demo/Músculo)**, decisión del owner: la foto pasa a ser el póster de Demo. `type Tab = "demo" | "musculo"`. Estado inicial de Demo: foto (`ej.imagenes[0]`) a opacidad plena + botón play encima (sin foto → placeholder `<Dumbbell>` + play); sin `ej?.videoUrl` → foto atenuada + badge tenue "Video pronto" (sin botón play, sin spinner colgado). Al click con `videoUrl` disponible: `<video autoPlay muted loop playsInline controls>` cubriendo el frame; `onWaiting`/`onCanPlay` controlan un overlay "Cargando demo…" (`.spinner` reusado); `onError` vuelve a la foto y marca el video como roto (no reintenta). Reset a "Demo" por `useEffect` sobre `ej.idEjercicio`. Crédito chico bajo el frame cuando `ej.videoEsGenerico` es `true`: "Demo: Wikimedia Commons · CC BY 3.0".
- **`src/types/models.ts`** — nuevo campo opcional `videoEsGenerico?: boolean` en `Ejercicio` (distingue clip representativo de footage propio).
- **`scripts/data/videos-genericos.ts`** (nuevo) — tabla `PatronMovimiento → ClipGenerico` (archivo de Commons + crédito + URL de la página, para atribución) y helpers `videoGenericoPorPatron()` / `urlClip()` (arma la URL hotlinkeable vía `Special:FilePath`, estable aunque cambie el hash de carpeta de `upload.wikimedia.org`; verificado con `curl -L` que resuelve 200 `video/webm`). Cobertura: **10/12 patrones** — todos los clips son de la serie *"… - exercise demonstration video"* de **FitnessScape** (CC BY 3.0) salvo Zancada/unilateral (U.S. Army ACFT, dominio público), Locomoción/cardio (Taco Fleur/Cavemantraining, CC BY-SA 4.0) y Aislamiento (Colossus Fitness, CC BY 3.0).
  - **Sin clip** (deuda, caen al placeholder "Video pronto"): **Core anti-extensión** (plank) y **Core anti-rotación** (russian twist/woodchop) — no se encontró un video libre adecuado en Commons.
  - **Caveat iOS/webm:** todos los clips mapeados son `.webm`; Safari de iPhone no lo reproduce. No se encontró transcode `.mp4` libre equivalente — queda como deuda explícita; el fallback a foto + "Video pronto" cubre la degradación en iOS hasta que se resuelva.
- **`scripts/importar-fedb.ts`** — tras resolver `patronFinal` (override del diccionario o `resolverPatron`), busca el clip genérico por patrón y completa `videoUrl` (vía `urlClip`) + `videoEsGenerico:true` en el catálogo regenerado. Resultado: **790/873** ejercicios FEDB con `videoUrl` poblado (el resto: patrones sin cobertura o sin patrón resuelto).
- **`scripts/data/videos-genericos.test.ts`** (nuevo) — cubre el mapeo (clips esperados por patrón), los patrones sin cobertura (`undefined`, no rompe), la forma de la URL (`Special:FilePath`, sin espacios) y que todo patrón del modelo resuelva sin tirar.
- **`src/index.css`** — `.media-badge-muted` (badge tenue "Video pronto") y `.media-credito` (texto de atribución bajo el frame); reuso de `.media-seg`/`.media-frame`/`.media-play-overlay`/`.media-play-btn`/`.media-playing` ya existentes de D12.
- No se tocó la app de comidas familiar ni otras pantallas — solo `MediaTabs`, el tipo `Ejercicio`, el importador FEDB y los datos del catálogo (`catalogo-ejercicios.json` regenerado).

### [2026-06-11] D16 — Pulido visual: Home métrica única, Historial card, Salud composición, scrim sesión (B5–B8 + C10)

#### B5 — Home: anillo como métrica única (numSemana + subtítulo coherente)
- **`src/routes/Home.tsx`** — eliminada la contradicción "Día 3 de 4" vs. anillo "2/4 sesiones". Estado `numSemana` calculado desde el `semanaInicio` más temprano del historial del miembro. Subtítulo del anillo: `"Semana N · X de Y sesiones"` cuando hay programa activo, o `"X de Y sesiones esta semana"` si aún no hay historial suficiente para calcular el número. Label del botón Stadium cambiado de `"Día N de M"` → `"Próxima sesión"`.

#### B6 — Historial card: RPE fijo a la derecha, tonelaje seminegrita
- **`src/routes/Historial.tsx`** — `SesionesList` reestructurada en dos filas: fila 1 = título + chip RPE (`flexShrink:0`, siempre a la derecha), fila 2 = fecha · duración · series · kg (tonelaje en `fontWeight:600, color:var(--fg)`) + badge "Libre". Jerarquía visual clara; RPE deja de desplazarse con el texto.

#### B7 — Salud · Composición: gráfico 30 días + fechas relativas + última medición
- **`src/routes/Salud.tsx`** — `ComposicionTab` reescrita:
  - Función `hace()`: convierte una fecha `YYYY-MM-DD` a etiqueta relativa ("hoy", "ayer", "hace N días").
  - Gráfico de peso: filtra las últimas 30 días (`mediciones` → `med30`, `.reverse()` para orden cronológico), `<Sparkline height:52>` ancho completo con labels extremo izquierdo/derecho mostrando `fecha.slice(5) · valor kg`.
  - Tiles KPI (grasa, músculo, agua, IMC): fecha relativa en gris debajo del label.
  - Card "Última medición": detalla todos los campos disponibles (peso, grasa %, músculo %, agua %) con su valor exacto.

#### B8 — Sesión guiada: scrim de scroll al pie del contenido
- **`src/routes/EntrenarSesion.tsx`** — `contentRef` + estado `showScrim`; `useEffect` con listener `scroll` pasivo + `ResizeObserver` (re-evalúa al cambiar `state.descanso` / `state.bloqueActual`); condición: `scrollHeight > clientHeight + 4 && scrollHeight − scrollTop − clientHeight > 8`. El modo guiado envuelve `.workout-content` en `.workout-content-wrap` (posición relativa, flex:1, overflow hidden); `{showScrim && <div className="workout-scrim" />}` se superpone al fondo.
- **`src/index.css`** — `.workout-content-wrap` (position:relative, flex:1, min-height:0, overflow:hidden); `.workout-content-wrap > .workout-content` (flex:none, height:100%, padding-bottom:140px, sobreescribe `flex:1` base); `.workout-scrim` (position:absolute, bottom:0, height:32px, `linear-gradient(to top, var(--bg), transparent)`, pointer-events:none).

#### C10 — FAB audit: sin cambios necesarios
- Verificado en `src/App.tsx`: ambos FABs ya estaban conectados — `/catalogo/nueva` → `EjercicioForm`, `/biblioteca/nueva` → `RutinaForm`. La divergencia era solo en el kit de diseño (placeholder). No se requirió ocultarlos ni agregar lógica.

#### Tests y build
226 tests verdes, `tsc -b` limpio.

---

### [2026-06-10] D14 — Datos: patrones + descansos + traducciones + badge EN (A1–A4)

#### A3 — `resolverPatron()` (keyword-based)
- **`src/lib/patronMovimiento.ts`** (nuevo, puro) — `resolverPatron(name, category, mechanic, force): PatronMovimiento | undefined`. Orden de resolución: cardio/plyometrics → core (plank/rollout/crunch…) → rodilla (squat/lunge…) → cadera (deadlift/hip thrust…) → empuje vertical (overhead/military…) → tracción vertical (pull-up/chin-up/pulldown) → tracción horizontal (row/face pull) → empuje horizontal (bench/push-up/dip…) → acarreo → isolation mechanic → force fallback → undefined. Chin-up resuelve "Tracción vertical" correctamente (no "Tracción horizontal").
- **`src/lib/patronMovimiento.test.ts`** — 20 tests verdes. Cubre todos los patrones + edge cases (Bicep Curl isolation, Farmer Carry, Pallof Press).
- **`scripts/importar-fedb.ts`** — usa `resolverPatron` (A3) en lugar de `patronAprox`.

#### A4 — `calcularDescanso()` por mecánica/categoría
- En `scripts/importar-fedb.ts`: stretching=25 s, cardio/plyometrics=45 s, compound=105 s, isolation=70 s, fallback=75 s. El diccionario puede overridear con `descansoSugeridoSeg` explícito.

#### A1 — Validador de ratio en el importador
- `validarTraduccion(id, t, f, warnings)` — alerta si `lenES/lenEN < 0.7` o `pasosES < pasosEN`. Resultados: 873 ejercicios, 115 traducidos, 102 por debajo del umbral (vs 109 antes del re-pase).
- Reglas de traducción fiel: 1 paso EN = 1 paso ES; "Tip:" → `puntosClave`; "Caution:" → `erroresComunes`; voseo; respiración explícita.

#### A1 — Re-pase de las 15 entradas de peor ratio (0.14–0.19 → 0.61–0.70)
- **`scripts/fix-traducciones-ratio.ts`** (script auxiliar) — aplica parches a `scripts/data/traducciones-fedb.es.json`. Todas las 15 entradas ahora tienen pasos completos (ej. Concentration_Curls: 3→5 pasos, ratio 0.14→0.62; Air_Bike: 3→6 pasos, 0.18→pasa 0.7; Handstand_Push-Ups pasa 0.7).

#### A2 — Catálogo bilingüe con badge y filtro
- **`src/types/models.ts`** — campo `traduccion?: "ok" | "pendiente"` en `Ejercicio`.
- **`scripts/importar-fedb.ts`** — ya emitía el campo; ahora tipado correctamente.
- **`src/routes/Catalogo.tsx`** — badge `EN` (warning ámbar) en la cabecera de cards pendientes; nota "Instrucciones en inglés — traducción pendiente" en el detalle expandido; fila de filtro "Idioma" con chips "Todos" / "Solo en español".

#### Tests y build
226 tests verdes, `tsc -b` limpio.

#### Avance de lotes (D14b)
- **Lote 1 (2026-06-10):** 30 re-pases · 21 entradas ahora pasan umbral 0.7 · warnings: 102 → 81
- **Lote 2 (2026-06-12):** 30 re-pases (ratios 0.20–0.33) · 30/30 pasan umbral 0.7 · warnings: 81 → 51
- **Lote 3 (2026-06-12):** 30 re-pases (ratios 0.34–0.55) · 30/30 pasan umbral 0.7 · warnings: 51 → 21
- **Lote 4 (2026-06-12):** 21 re-pases (ratios 0.55–0.70) · 21/21 pasan umbral 0.7 · warnings: 21 → **0** ✅ todas las 115 traducciones superan el umbral
- **Lote 5 (2026-06-12):** 30 nuevas (beginner + equipo hogareño) · 0 warnings · traducidos 145/873
- **Lote 6 (2026-06-13):** 30 nuevas (beginner + equipo hogareño, tanda 2) · 0 warnings · traducidos 175/873
- **Lote 7 (2026-06-25):** 30 nuevas (beginner + equipo hogareño, tanda 3) · 0 warnings · traducidos 205/873
- **Lote 8 (2026-06-25):** 30 nuevas (beginner + equipo hogareño, tanda 4) · 0 warnings · traducidos 235/873
- **Lote 9 (2026-06-25):** 11 nuevas — completa el pool beginner + equipo hogareño (body only/dumbbell/bands/kettlebells) · 0 warnings · traducidos 246/873
- **Lote 10 (2026-06-28):** 30 nuevas — primera tanda **intermediate** + equipo hogareño (kettlebell complexes, variantes acostado/unilateral) · 1 fix de ratio · warnings 0 · traducidos 276/873

---

### [2026-06-10] D15 — Micro-interacciones (C9)

#### (0) Tokens de movimiento
- **`src/styles/tokens.css`** — 5 nuevos tokens en `:root`: `--dur-fast: 140ms`, `--dur-base: 220ms`, `--dur-slow: 420ms`, `--ease-out: cubic-bezier(.22,1,.36,1)`, `--ease-spring: cubic-bezier(.34,1.4,.64,1)`. Reemplazan duraciones hardcodeadas en `.ring-progress` y `.aurora-anim`.

#### (1) Card stagger + `.card-list`
- **`src/index.css`** — nueva clase `.card-list` (flex column gap:16) con `@keyframes fade-up` stagger: ítems 1–5 con delays 0/40/80/120/160 ms, ítem 6+ fijo en 200 ms. Guarda `prefers-reduced-motion`.
- **`src/routes/Catalogo.tsx`** — `className="card-list"` en el wrapper de ejercicios (mantiene gap:8 inline).
- **`src/routes/Biblioteca.tsx`** — `ProgramasList` y `RutinasList` envuelven su `.map()` en `<div className="card-list">`.
- **`src/routes/Historial.tsx`** — `SesionesList` retorna `<div className="card-list">` en lugar de `<>`.

#### (2) ProgressRing — anillo + count-up
- **`src/routes/Home.tsx`** — `ProgressRing`: estado `displayDone` + rAF con ease-out cúbico (dur 420 ms); transición del anillo usa `var(--dur-slow) var(--ease-out)`. Guarda `prefers-reduced-motion` (sin rAF → muestra el valor directo).

#### (3) Feedback de serie completada
- **`src/components/entrenar/ProgressDots.tsx`** — estado `justDone` + `useRef(prevHechas)`: cuando `hechas` sube, la dot recién completada recibe clase `just-done` durante 400 ms → animación `dot-pop` (scale 1.35→1.7→1, `ease-spring`, 350 ms).
- **`src/routes/EntrenarSesion.tsx`** — estado `seriePulsing`: `handleSerie()` activa la clase `btn-pulsing` en el botón durante 220 ms → animación `btn-pulse` (scale 1→0.96→1, 200 ms).

#### (4) TabBar con sliding indicator
- **`src/components/TabBar.tsx`** (nuevo) — componente genérico `TabBar<T>` con props `tabs/active/onChange/size/style`. Indicador absoluto (`.tab-bar-indicator`) se traslada con `translateX(idx × 100%)`, transición `var(--dur-base) var(--ease-out)`. Prop `size="sm"` para Salud (12 px, 4 tabs).
- **`src/routes/Biblioteca.tsx`**, **`Historial.tsx`**, **`Salud.tsx`** — reemplazadas las tres barras inline por `<TabBar>`.

#### (5) Pressed states
- **`src/index.css`** — `@media (prefers-reduced-motion: no-preference)`: `.btn-primary:active`, `.card:active`, `.rutina-card:active` → `transform: scale(0.985)` con transición 80 ms.

#### Tests y build
226 tests verdes, `tsc -b` limpio.

---

### [2026-06-10] Auditoría kit+datos — decisiones y cola D14/D15/D16

Auditoría rápida del UI kit + foundations + datos contrastada con el repo. 10 hallazgos incorporados al mapeo.

#### Hallazgos y prompts asignados

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
| C10 | 🟡 | FAB "+" sin acción (kit) → divergencia con repo | 42 (D16) |

#### Decisiones del owner (2026-06-10)
- **A2 — política de catálogo:** se importa TODO (873). Pendientes con badge "EN" + filtro "Solo en español". Cobertura se amplía por lotes priorizando beginner+strength hogareño.
- **A1 — reglas de traducción fiel:** 1 paso EN = 1 paso ES; "Tip:" → `puntosClave`; "Caution:" → `erroresComunes`; mantener respiración. Validador de ratio ≥ 0.7 en el importador.
- **B5 — anillo como métrica única:** el anillo SVG es la sola métrica de progreso semanal en Home; la línea del saludo es contexto, no métrica paralela.

#### Cola de prompts
Después de los cerrados (36→39): **40 (D14) → 41 (D15) → 42 (D16)**, con **40b** (lote de traducciones, repetible) intercalado entre etapas cuando el owner quiera — un lote por vez.

#### Lo que la auditoría marcó como sólido (no tocar)
Foundations/temas, flujo de programa (Home→Entrenar→Detalle), sesión guiada (MediaTabs, steppers), estructura del importador.

---

### [2026-06-10] D13 — Home 3 layouts + Historial Progreso + Salud enriquecido

#### (1) Sparkline + homeLayout
- **`src/components/Sparkline.tsx`** (nuevo) — SVG área (línea + degradado + punto final). Props: `data: number[]`, `color`, `height`. Usa `useId()` para el gradientId por instancia.
- **`src/lib/homeLayout.ts`** (nuevo) — `getHomeLayout/setHomeLayout` por miembro en `localStorage("su-home-by-member")`. Mismo patrón que `shapeup-themes`.

#### (2) Home — 3 layouts seleccionables
- **Aurora** (default): agrega `VistaSemanal` del programa activo al final (L-D con entreno/descanso/hoy), clickeable → `/programa/:id`.
- **Stadium**: hero marquesina — glow ambiental + nombre de sesión grande (28px/900) + "Empezar ahora"; tira horizontal scrolleable de stats (Racha / Volumen / Sesiones / Peso). Estado descanso con Luna.
- **Clásico**: tarjetas (estilo D2) — WeekStrip + barra progreso semanal + card "Hoy toca".
- **`src/routes/Perfil.tsx`** — nueva sección "Estilo de inicio" con 3 opciones radio-style (Aurora/Stadium/Clásico), persistida en localStorage por miembro. Layout se aplica en el próximo montado de Home.
- **`src/index.css`** — `.stadium-hero`, `.stadium-glow`, `.stadium-title`, `.stadium-stats`, `.stadium-stat*`.

#### (3) Historial — tabs Sesiones | Progreso
- **`src/routes/Historial.tsx`** — segmented tabs. **Progreso**: Sparkline de volumen semanal (en `--info`) + Δ vs sem. ant.; tiles totales (sesiones + horas); records personales (PR) con `<Trophy>` — max tonelaje por rutina, top 5.

#### (4) Salud — enriquecido
- **ComposicionTab**: hero peso grande + Sparkline de tendencia (últimas 16 mediciones); tiles grasa/músculo/IMC con `DeltaLine` (verde si mejora, rojo si empeora, `invert` para músculo).
- **CardioTab**: barra apilada de distribución de tiempo por zona FC (Z1→Z5, tokens `--zona-z*`) + leyenda con horas; degrada si no hay datos de zona.
- **SuenoTab**: hero última noche con Sparkline (en `--info`) junto al número grande.

---

### [2026-06-10] D12/B3 — MediaTabs + BodyMap (mapa muscular)

#### B3 — BodyMap
- **`src/components/BodyMap.tsx`** (nuevo) — dos siluetas SVG (frente + espalda, viewBox 0 0 80 172) con 14/19 regiones geométricas cada una. Props: `{ primario, secundarios? }`. Colores por token: primario = `--accent`, secundarios = `color-mix(in srgb, --accent 40%, transparent)`, inactivo = `--card-hover`/`--border`. Re-skinea con el tema. Mapa `GrupoMuscular → RegionId[]` cubre los 18 grupos del modelo (Pecho, Dorsales, Cuádriceps, Glúteos, etc.); Cardiovascular/Cuerpo completo mapeados explícitamente. Sin imagen ni ícono: solo SVG funcional.
- **`src/routes/Catalogo.tsx`** — sección "Músculos trabajados" con `<BodyMap>` agregada entre imagen y FichaTecnica (orden: imagen → mapa → `<hr>` → ficha técnica → ejecución → banners).

#### D12 — MediaTabs
- **`src/components/entrenar/MediaTabs.tsx`** (nuevo) — segmented control Foto / Demo / Músculo + frame `aspect-ratio: 16/11` (`.media-frame`). **Foto**: `ej.imagenes[0]` object-fit cover + fallback `<Dumbbell>`. **Demo**: foto atenuada (opacity 0.35) + botón play accent + badge "Demo" — placeholder B2 listo para enchufar video. **Músculo**: `<BodyMap>` centrado en el frame. Reset a "Foto" por `useEffect` sobre `ej.idEjercicio`.
- **`src/components/entrenar/BloqueGuiado.tsx`** — reemplaza la `<img>` estática por `<MediaTabs ej={ejercicio} />`.
- **`src/index.css`** — clases `.media-tabs`, `.media-seg`, `.media-seg-btn(.active)`, `.media-frame`, `.media-placeholder`, `.media-play-overlay`, `.media-play-btn`, `.media-badge`, `.media-playing`, `.media-musc`; `.body-map`, `.body-map-view`, `.body-map-label`.

#### Degradación
- Sin imagen: Foto → placeholder Dumbbell, Demo → solo play sobre fondo vacío.
- Grupo sin región SVG (ej. "Cuerpo completo" → todas activas, "Cardiovascular" → todas inactivas): no rompe.
- Sin ejercicio (`ej = undefined`): todas las pestañas muestran placeholder.

---

### [2026-06-09] F1/F2/F3/D11 — Flujo de programa semanal

#### F1 — Programa activo por miembro
- **`src/data/programas.ts`** — `getProgramaActivo(miembroId?)`: lee `config/programaActivo` (mapa `{ memberId: programaId }`); fallback al primer programa con `estado:"Activo"` si no hay entrada. Nuevo `setProgramaActivo(miembroId, programaId)`: `setDoc` con `merge: true`. Los callers (`Home.tsx`, `Entrenar.tsx`) ahora pasan `memberId`.
- **`firestore.rules`** — regla específica `config/programaActivo`: `isFamilyMember` read/write (antes del `config/{docId}` genérico que solo permite write al owner).

#### F2 — Sesión de hoy por día de semana
- **`src/lib/sesionDeHoy.ts`** (nuevo, puro) — `sesionDeHoy(programa, diaSemanaHoy, historialSemana)` → `"descanso" | "rutina" | "dia-libre" | "sin-programa"`. `jsDayToNum(jsDay)` convierte `getDay()` (0=dom) a `DiaSemanaNum` (0=lun). `proximaSesion` sigue como fallback para días salteados.
- **`src/lib/sesionDeHoy.test.ts`** — 10 tests verdes.

#### F3 — Flujo elegir/ver/cambiar programa
- **`src/routes/Biblioteca.tsx`** — tab "Programas" como primera pestaña (Programas · Rutinas · Ejercicios). `ProgramasList`: lista filtrada por visibilidad, cada card con `VistaSemanal` + badges + badge "Activo" + borde acento si es el activo. Clickeable → `/programa/:id`.
- **`src/routes/ProgramaDetalle.tsx`** (nuevo) — cabecera + badges; `VistaSemanal` con hoy resaltado; lista L→D con icono entrenamiento/descanso; `comoUsar`/`reglasProgresion`; botón "Activar para mí" → `setProgramaActivo` → navega a Home. Si ya es activo: botón deshabilitado "Activo para {nombre}".
- **`src/App.tsx`** — ruta `/programa/:id` → `ProgramaDetalle`.

#### D11 — Pulido visual
- **`src/components/VistaSemanal.tsx`** (nuevo) — fila L–M–X–J–V–S–D. Entrenado: `<Bicep>` lleno acento. Planificado: `<Bicep>` outline 45% opacidad. Descanso: `<Moon>` muted. Sin asignar: puntito. Hoy: borde acento.
- **`src/routes/Home.tsx`** — glass card usa `sesionDeHoy` primero: "Hoy toca" con rutina y botón Empezar; "Día de descanso" con icono luna + botón "Entrenar igual"; fallback a `proximaSesion` para programas sin `diaSemana`. Card clickeable → `/programa/:idActivo`.
- **`src/routes/Entrenar.tsx`** — puerta 1 sincronizada con Home: usa `sesionDeHoy`; estado descanso con card informativa; "Ya entrenaste hoy ✓" cuando `yaHecha`.

#### ADRs (ya en §5)
- ADR #017: `config/programaActivo` (F1).
- ADR #018: `sesionDeHoy` + fallback `proximaSesion` (F2).

#### Tests
96 tests verdes (10 nuevos: `sesionDeHoy` + `jsDayToNum`). `tsc -b` limpio.

---

### [2026-06-09] Flujo de programa semanal — análisis, decisiones y ADRs

#### Estado hoy (lo que hay)
- `Programa.dias: DiaPrograma[]` — cada día con `orden`, `tipo` (`"descanso"` | activo) e `idRutina`. La estructura semanal con descansos ya existe en el dato.
- `proximaSesion(programa, historialSemana)` — secuencial por `orden`, salta descansos, da `{ indice, total }` ("Día N de M"). Pura. 10 tests.
- `getProgramaActivo()` — devuelve el **primer** programa con `estado: "Activo"` (GLOBAL).
- `visibilidad` — owner ve todo; otros ven programas/rutinas asignados en `/config/visibilidad`.

#### Huecos identificados
1. **No hay UI para elegir/activar el programa de un miembro.** `getProgramaActivo()` agarra el primero Activo; nadie "elige el suyo".
2. 🔴 **"Activo" es global, no por miembro.** Si JP y María activan su programa, `getProgramaActivo()` devuelve el primero de la lista → colisión en app familiar.
3. **La estructura semanal no se muestra.** El dato (4 días + 3 descansos, qué toca cada día) existe pero la Home solo dice "Día N de M". No hay vista "tu semana: L Empuje · M descanso…".
4. **No hay flujo de cambio** de programa, ni qué pasa con la semana en curso.
5. **Descansos invisibles** en la WeekStrip (no distingue entrenado / planificado / descanso).

#### Decisiones tomadas (2026-06-09)
- **F1:** el programa activo es **por miembro**. Se elige y se cambia desde la app.
- **F2:** los días del programa son **por día de semana** (Lunes=Empuje, Martes=descanso…), no secuenciales. Nueva función `sesionDeHoy(programa, hoyDiaSemana, historialSemana)` para "qué toca HOY"; `proximaSesion` queda como fallback de "siguiente sin hacer" para días salteados.

#### Camino de ejecución (orden)
1. **F1** — `config/programaActivo` (mapa miembro→programaId, análogo a `config/visibilidad`). `getProgramaActivo(miembroId)` + `setProgramaActivo(miembroId, programaId)`. Fallback a `estado:"Activo"` si no hay entrada.
2. **F2** — `DiaPrograma` recibe `diaSemana` (0–6). Nueva `sesionDeHoy(programa, hoyDiaSemana, historialSemana)`. `proximaSesion` se mantiene como fallback.
3. **F3** — Biblioteca tab "Programas": lista → detalle con vista semanal (L–D, rutina o descanso) → botón "Activar para mí" → `setProgramaActivo`. Cambiar programa pide confirmación si hay semana en curso.
4. **D11** — WeekStrip distingue entrenado (bíceps lleno) / planificado (bíceps outline) / descanso (ícono tenue). Detalle de programa premium: cabecera, vista semanal, días expandibles.

#### Restricciones
- No tocar `lib`/`types`/`auth` salvo lo que F1/F2 requieran explícitamente (y con tests).
- Nav de 6 ítems intacto (Programas entra por tab en Biblioteca).
- Tokens siempre, voseo, re-skinea por tema.

> ADRs propuestos: ver §5 ADR #017 y #018.

---

### [2026-06-09] FIX-SALUD — Importador de salud: fechas mal + ejercicio/sueño vacíos

**Síntoma reproducido (2026-06-09):** ZIP importa solo datos de peso; fechas incorrectas ("1969-12-31"); ejercicio y sueño aparecen vacíos en el preview.

#### Causa raíz — Bug 1: `epochToDate` no manejaba datetime strings (CORREGIDO)

Samsung Health (2024+) exporta `start_time` como datetime string `"YYYY-MM-DD HH:MM:SS.mmm"` (hora local) en lugar de epoch en ms. El parser hacía `parseInt("2024-03-15 ...", 10)` = `2024` (solo el año), lo que daba `new Date(2024 + offset_ms)` ≈ `"1969-12-31"`. La condición `isNaN(ms)` no lo capturaba porque `2024` no es NaN.

- **`src/import/samsungHealth.ts`** — `epochToDate` y `epochToTime`: detectan si el string empieza con `\d{4}-\d{2}-\d{2}` y en ese caso retornan el slice directamente (ya es hora local, no necesita conversión). El path epoch ms sigue intacto como fallback.
- **`src/import/samsungHealth.test.ts`** — 11 tests nuevos: `parsearPeso`, `parsearEjercicio`, `parsearSueno` con `start_time` en formato datetime string. Verifican fecha correcta + campos opcionales.

#### Causa raíz — Bugs 2 y 3: ejercicio/sueño vacíos (CORREGIDOS)

Con el ZIP real (`samsunghealth_jpcofano_20260607183598.zip`) se identificaron dos bugs adicionales:

**Bug 2 — JSONs internos sobreescriben el CSV correcto en el índice.**  
El ZIP 2025+ contiene archivos JSON con "exercise" o "sleep" en el nombre (ej. `34-exercise_multi_sports_list_order.blob.value.json`, `sleep.watch_summary.blob.value.json`). El loop de indexado los procesaba y el último match sobreescribía la ruta del CSV real. El parser intentaba parsear como CSV un archivo JSON → 0 items.  
- Fix: `samsungZip.ts` solo indexa archivos `.csv` para los parsers de tipo principal.

**Bug 3 — Múltiples CSVs con el mismo tipo, el último (incorrecto) ganaba.**  
Samsung Health exporta ~90 CSVs. Varios contienen "exercise" (`exercise.recovery_heart_rate`, `exercise.custom_exercise`, etc.) y "sleep" (`sleep_stage`, `sleep_combined`, `sleep_data`, etc.). La función `detectarTipoCsv` con `f.includes("exercise")` tomaba el último en el orden de iteración del ZIP → archivo equivocado.  
- Fix: `detectarTipoCsv` usa regex exactos: `/^com\.samsung\.shealth\.exercise\.\d+\.csv$/`, `/^com\.samsung\.shealth\.sleep\.\d+\.csv$/`, `/^com\.samsung\.health\.(body_)?weight\.\d+\.csv$/`. Sub-tipos no matchean.

**Datos confirmados con el ZIP real**: 249 filas peso · 2478 filas ejercicio · 1998 filas sueño — todas con fechas correctas del parser.

#### Diagnóstico agregado al preview (permanente)

- **`src/import/samsungZip.ts`** — `ZipExtraccion` suma `csvsPorTipo` (qué CSV por tipo) y `otrosCSVs` (CSVs no reconocidos) para diagnóstico de futuros cambios de formato.
- **`src/routes/Salud.tsx`** — `ImportPreview` muestra "Archivos detectados en el ZIP" con ✓/✗ por tipo y lista de "Otros CSVs".

#### Tests
- **`src/import/samsungHealth.test.ts`** — 76 tests (era 53). Nuevos: 11 para formato datetime string (Bug 1), 9 para `detectarTipoCsv` con patrones exactos y sub-tipos rechazados (Bug 3).

---

### [2026-06-08] D10 — Pulido visual: sesión libre + ficha técnica

- **`src/routes/EntrenarSesionLibre.tsx`** — selector rediseñado:
  - Encabezado "Armá tu sesión" (selector) vs "Sesión libre" (workout en curso).
  - Empty state en voseo: "Sumá ejercicios del catálogo para empezar."
  - Tarjetas de ejercicio enriquecidas: badge-accent (músculo primario), badge-muted (modalidad + primer equipo).
  - Controls editables por ejercicio de tipo Fuerza: inputs inline de Series y Reps. Los valores alimentan `buildBloqueLibre` vía patch local de `PrescripcionFuerza` antes de `empezarSesion`.
  - Reordenamiento con botones ChevronUp/ChevronDown (swaps paralelos en `ejercicios[]` + `ejDefaults[]`).
  - Botón de agregar renombrado "Sumá ejercicio". Botón "Empezar" fijo abajo.
  - Micro-animación `.libre-item` (fade-up 200ms) al agregar ejercicios, gateada por `prefers-reduced-motion`.
- **`src/routes/Catalogo.tsx`** — `FichaTecnica` rediseñada:
  - Fila de músculos: primario en `badge-accent` + secundarios en `badge-muted` (flex wrap).
  - Grilla 2×2 con `.t-label` arriba de cada valor: Nivel · Mecánica · Patrón · Equipo. Fondo `--bg`, bordes redondeados.
  - Separadores `<hr className="ficha-sep">` entre ficha / ejecución / banners.
  - Detalle expandible recibe clase `.card-detail-expand` (fade-up 180ms, gateado por `prefers-reduced-motion`).
- **`src/routes/HistorialDetalle.tsx`** — badge `badge-muted` "Libre" inline junto al título (h.tipo === "libre"). Título ya era fw 800.
- **`src/index.css`** — nuevas clases: `.libre-defaults`, `.libre-defaults-label`, `.libre-defaults-input`; `.ficha-tecnica`, `.ficha-musculos`, `.ficha-sep`, `.ficha-meta-grid`, `.ficha-meta-cell`, `.ficha-meta-value`; `.btn-icon-sm:disabled` (opacity 0.25); `.libre-item` y `.card-detail-expand` con `animation: fade-up` gateados por `prefers-reduced-motion`.

### [2026-06-08] B1 — Explicaciones ricas de ejercicio

**MAPEO de campos FEDB surfaceados:**
| Campo modelo | Tipo | Traducción | Surfaceado |
|---|---|---|---|
| `grupoMuscularPrimario` | `GrupoMuscular` | Ya en castellano (via `FEDB_MUSCULO` en importador) | ✅ chip `badge-accent` en FichaTecnica |
| `gruposSecundarios` | `GrupoMuscular[]` | Ya en castellano (via `FEDB_MUSCULO`) | ✅ chips `badge-muted` en FichaTecnica |
| `nivel` | `Nivel` | Ya en castellano (via `FEDB_NIVEL`: beginner→Principiante…) | ✅ chip en FichaTecnica |
| `mecanica` | `Mecanica?` | Ya en castellano ("Compuesto"/"Aislamiento") | ✅ chip en FichaTecnica (solo si existe) |
| `patron` | `PatronMovimiento` | Propio del modelo (en castellano) | ✅ chip en FichaTecnica |
| `equipo` | `Equipo[]` | Ya en castellano (via `FEDB_EQUIPO`) | ✅ chips en FichaTecnica |
| `modalidad` | `Modalidad` | En castellano | En cabecera de la card (ya estaba) |
| `fuerzaFEDB` | `FuerzaFEDB?` | No surfaceada (metadato de interop) | — |

**Nota de traducción:** Los campos FEDB ya están traducidos al castellano durante la importación (`scripts/importar-fedb.ts` via `FEDB_MUSCULO`, `FEDB_NIVEL`, `FEDB_EQUIPO`). `scripts/data/traducciones-fedb.es.json` cubre los textos de técnica (instrucciones, puntos clave), no los chips. No se necesitó sistema de i18n nuevo.

- **`src/routes/Catalogo.tsx`** — nuevo componente interno `FichaTecnica({ ej })`: filas etiquetadas (Primario / Secundarios / Nivel / Mecánica / Patrón / Equipo) con chips `badge-accent`/`badge-muted`. Filas con campo vacío se omiten elegantemente. Reemplaza el texto plano de `gruposSecundarios` que había al pie del detalle. Orden del detalle: imagen → FichaTecnica → botón Editar → Ejecución → banners (Puntos clave / Errores / Seguridad).
- **`src/components/entrenar/BloqueGuiado.tsx`** — línea compacta muted bajo el nombre grande: `"Pecho · Mancuernas"` (músculo primario + primer ítem de equipo). Solo si `ejercicio` está disponible. Discreta, sin recargar la pantalla de entreno.

### [2026-06-08] A2 — Sesión libre (funcional)
- **`src/types/models.ts`** — `Historial.idRutina` pasa a opcional (`idRutina?: string`); nuevo campo `tipo?: "rutina" | "libre"` (retrocompatible: ausente = "rutina").
- **`src/lib/entrenarState.ts`** — dos nuevas funciones exportadas:
  - `buildBloqueLibre(ej, orden)`: crea un `BloqueEjercicio` con prescripción por defecto según modalidad (Fuerza → 3×10 con `descansoSugeridoSeg`; Cardio → continuo 20 min; Movilidad/Isométrico con rondas/series por defecto).
  - `buildVirtualRutina(bloques)`: crea una `Rutina` en memoria para que el reducer y `useEntrenarState` funcionen sin cambios.
- **`src/data/historial.ts`** — `FinalizarSesionOpts.rutinaId` pasa a opcional; agrega `tipo` y `nombreLibre`. En modo libre, omite la lectura de `/rutinas` y no intenta actualizar `vecesEntrenada` (ya no lo hacíamos por ADR #014). El doc en Firestore solo tiene `tipo: "libre"` y sin campo `idRutina`.
- **`src/routes/EntrenarSesionLibre.tsx`** (nuevo) — ruta fullscreen `/entrenar/libre` con dos fases:
  - Fase 1 (selector): lista de ejercicios seleccionados + botón "Agregar ejercicio" (reusa `ExercisePicker`) + "Empezar sesión".
  - Fase 2 (workout): misma UI que `EntrenarSesion` (BloqueGuiado/BloqueScroll, DescansoTimer, log rápido, RPE, finalización). Usa `useEntrenarState("libre:temp", virtualRutina)`.
- **`src/App.tsx`** — ruta `/entrenar/libre` agregada antes de `/entrenar/:rutinaId` (React Router necesita la específica primero).
- **`src/routes/Entrenar.tsx`** — Puerta 3 activada: clickeable → `/entrenar/libre`.
- **`src/routes/Historial.tsx`** — badge `badge-muted` "Libre" para entradas con `tipo === "libre"`.
- **`src/lib/entrenarState.test.ts`** — 5 tests nuevos: `buildBloqueLibre` (Fuerza y Movilidad), `buildVirtualRutina` (conserva bloques y reduce correctamente), `construirBloquesRegistro` con rutina virtual.

#### ADR — `Historial.idRutina` opcional + `tipo` sin retrocompatibilidad disruptiva
- **Decisión:** `idRutina` se vuelve opcional en el tipo TypeScript (ya era `string` requerido). Los documentos existentes no se tocan; en la lectura, `h.idRutina` puede ser `undefined` para sesiones libres. El campo `tipo` solo se escribe para sesiones libres para no inflar los documentos existentes.
- **Razón:** Firestore no valida esquemas; no hay migrations. Cambiar el tipo en TS a opcional sin tocar docs existentes es la forma más segura de extender el modelo.

---

### [2026-06-08] D9 — Home "Aurora+" (rediseño premium)
- **`src/styles/tokens.css`** — `--ring-from: var(--accent)` y `--ring-to: color-mix(in oklch, var(--accent), #ffffff 32%)`: gradiente del anillo que sigue al tema sin hardcodear 8 pares.
- **`src/index.css`** — nuevas clases: `.glass-card` (color-mix + backdrop-filter blur), `.bento-tile`, `.bento-row-2/3`, `.bento-value`, `.bento-delta`; transición `.ring-progress` (600ms ease-out, gateada por `prefers-reduced-motion`); `@keyframes fade-up` + `.aurora-anim-1/2/3/4` con stagger 40ms.
- **`src/routes/Home.tsx`** — rediseño Aurora+:
  - `ProgressRing` (SVG inline, ~150px): anillo con gradiente `url(#rg)`, glow `drop-shadow`, animación de llenado vía `strokeDashoffset` con `useEffect + setTimeout(60ms)`. Centro: "2/4 sesiones" o `<Check>` si completa.
  - Glow ambiental: `radial-gradient` con `--accent` baja opacidad + blur detrás del anillo.
  - Glass card con `proximaSesion` result: etiqueta "Día N de M", nombre, botón Empezar. Estado "Semana completa 🎉" con botón "Elegir otra rutina".
  - Bento row 3 tiles (Volumen / Peso / Racha) o 2 tiles (Volumen / Racha) si no hay medición de peso. Δ de peso en `--accent` si baja, `--danger` si sube.
  - Carga `getMediciones` para el tile de peso.
  - WeekStrip sin cambios, abajo.

#### ADR — Gradiente de anillo por tema con color-mix
- **Decisión:** `--ring-to: color-mix(in oklch, var(--accent), #ffffff 32%)` se calcula en cascada, sin 8 variables extra.
- **Razón:** mantener 8 pares de colores hardcodeados para cada tema sería frágil. `color-mix` es estándar desde 2023 y está disponible en todos los targets de la app.

---

### [2026-06-08] A1 — "Empezar" claro (próxima sesión + 3 puertas)
- **`src/lib/proximaSesion.ts`** (nuevo) — `proximaSesion(programa, historialSemana)` → `ProximaSesionResult | null`. Recorre días activos por `orden` (salteando descansos), asigna sesiones del historial a días de forma greedy contemplando rutinas repetidas. Devuelve `null` si semana completa. Pura, sin Firestore. 10 tests.
- **`src/data/rutinas.ts`** — `getRutinasDelMiembro(memberId)`: cruza `getRutinas()` con `getVisibilidad()`. Owner ve todas; no-owner solo las asignadas en `config/visibilidad`. Fail-open si visibilidad falla.
- **`src/routes/Home.tsx`** — hero "Próxima sesión · Día N de M" arriba (con botón Empezar primario). Si semana completa: estado positivo "🎉 Semana completa" + botón "Elegir otra rutina". WeekStrip + progreso debajo. Ya no calcula "hoy toca" por día de semana.
- **`src/routes/Entrenar.tsx`** — 3 puertas: (1) "Tu próxima sesión" destacada con botón Empezar; (2) "Elegir una rutina" lista filtrada con `getRutinasDelMiembro`; (3) "Sesión libre" placeholder deshabilitado ("próximamente A2").

#### ADR — Próxima sesión por secuencia, no por día de la semana
- **Decisión:** `proximaSesion` usa `orden` del programa, no `diaSemana`. El `diaSemana` solo se muestra como info ("planificado: lunes").
- **Razón:** quienes entrenan cuando pueden (no días fijos) necesitan saber cuál es la siguiente sesión, no si "hoy toca el lunes". El modelo ya soporta esto sin cambios.

---

### [2026-06-07] P27 — Imágenes de ejercicios
- **`src/routes/Catalogo.tsx`** — EjercicioCard muestra `ej.imagenes[0]` arriba del detalle expandido (`loading="lazy"`, `onError` oculta la imagen si falla, `objectFit: cover`, max 180px).
- **`src/components/entrenar/BloqueGuiado.tsx`** — foto del ejercicio actual debajo del nombre grande (`ejercicio?.imagenes[0]`, mismo tratamiento).
- **`scripts/seed-plan.ts`** — `EjDef.imagenes?: string[]` + helper `imgs(fedbId?)`. Mapeo EJ-8001..8018 → FEDB (sin foto para EJ-8005 Press banda, EJ-8017 Bird dog, EJ-8018 Pallof — sin equivalente).
- **`scripts/seed-planes-extra.ts`** — misma infraestructura; EJ-8019 → `One-Arm_Side_Laterals`, EJ-8021 → `Face_Pull`, resto sin foto (movilidad sin equivalente en FEDB).
- **`scripts/seed-rugby-juvenil.ts`** — infraestructura imagenes; EJ-8028/8029 sin foto (Nordic/Copenhagen no en FEDB).
- **`scripts/seed-futbol-juvenil.ts`** — EJ-8031 → `Freehand_Jump_Squat`, EJ-8032 → `Romanian_Deadlift`. EJ-8030 sin foto.
- **`scripts/seed-maria.ts`** — EJ-8033 → `Barbell_Hip_Thrust`, EJ-8034 → `Glute_Kickback`.
- Seeds sembrados `--force` en Firestore (todos los EJ-80xx actualizados con `imagenes`).

#### ADR — Imágenes FEDB dominio público vía URL raw de GitHub
- **Decisión:** las imágenes se sirven como URLs absolutas de `raw.githubusercontent.com` en runtime, sin espejo local.
- **Razón:** FEDB es Unlicense (dominio público); el volumen (~800 ejercicios × 2 fotos) es manejable sin CDN; espejar a Firebase Storage queda como opción futura si la latencia o disponibilidad se convierte en problema.

#### ADR — Mapeo propio→FEDB por nombre/patrón, sin foto si no hay match bueno
- **Decisión:** sin equivalente claro → `imagenes: []`; la UI degrada elegante (no muestra `<img>` roto).
- **Razón:** una foto incorrecta confunde más que ninguna foto.

---

### [2026-06-07] P26 — Carga + reps en rutinas de casa
- **`scripts/seed-plan.ts`** — helper `F` acepta `cargaKg?: number` en `extra` y lo propaga a `PrescripcionFuerza.cargaKg`. Cargas iniciales en RUT-0001 (goblet 12 kg, remo 10 kg, curl 8 kg), RUT-0002 (zancada 8 kg, RDL 14 kg), RUT-0003 (swings 10 kg, goblet 12 kg). Sin `cargaKg` para peso corporal, banda y cardio.
- **`scripts/seed-maria.ts`** — mismo cambio en el helper `F`. Cargas para María: hip thrust 8 kg, goblet 8 kg, RDL 8 kg (RUT-0021); puente 8 kg, zancada 6 kg, remo 6 kg (RUT-0022). Banda/PC sin `cargaKg`.
- **`src/lib/prescripcionLabel.ts`** — parámetro opcional `equipoHint?: string[]`: si no hay `cargaKg` y el equipo es "Peso corporal" → muestra "· peso corporal"; si es "Banda elástica" → "· banda". Sin `equipoHint` el comportamiento es idéntico al anterior.
- **`src/routes/RutinaDetalle.tsx`** — almacena el catálogo de ejercicios (`Map<string, Ejercicio>`) en estado y lo pasa a `prescripcionLabel(b.prescripcion, catalogo.get(b.idEjercicio)?.equipo)`.
- Seeds sembrados con `--force` en Firestore (RUT-0001..0003, RUT-0021..0022, ejercicios y programas asociados). Valores de arranque ajustables: la app registra el peso real de cada serie.

---

### [2026-06-07] Fix P25 — Importador: undefined + resiliencia por fila
- **`src/firebase.ts`** — `ignoreUndefinedProperties: true` en `initializeFirestore`. Firestore ya no rechaza documentos con campos opcionales en `undefined` ("Unsupported field value: undefined").
- **`src/import/samsungHealth.ts`** — `stripUndef<T>(obj)`: elimina claves con valor `undefined` antes de hacer `items.push()`. Aplicado en `parsearPeso`, `parsearEjercicio` y `parsearSueno`. Cinturón y tiradores junto con la opción de Firestore.
- **`src/data/salud.ts`** — todas las funciones `importar*` (incluidas las idempotentes + métricas) cambian `Promise.all` → `Promise.allSettled`. Nuevo tipo de retorno `ImportResult = { importados, omitidos }`. Una fila que falla ya no tumba el resto.
- **`src/routes/Salud.tsx`** — mensaje de import muestra "✅ X importados · Y omitidos" cuando hay filas parciales. Solo muestra error rojo si `importados === 0` y hay error real (fallo total).
- **`src/import/samsungHealth.test.ts`** — 6 nuevos tests: CSV con fila completa + fila sin grasa/músculo → ambas parsean, la incompleta no tiene claves `grasaPct`/`masaMuscularKg` (stripUndef verificado).

#### ADR — `ignoreUndefinedProperties` + import resiliente por fila
- **Decisión:** doble defensa: opción en el driver Firestore + `stripUndef` en los parsers.
- **Razón:** los campos opcionales de Samsung Health (grasa, agua, FC, distancia) no vienen en todos los registros. Un solo `undefined` en Firestore sin esta opción abortaba todo el import.

---

### [2026-06-07] D8 — PWA instalable + botón "Instalar app"
- **`assets/pwa/` → `public/icons/`** — 8 íconos PNG (favicon 16/32/48, apple-touch-icon 180, icon 192/512, icon-maskable 192/512). Ícono: squircle fondo oscuro + doble chevron cian con glow. Fijo, no cambia con el tema.
- **`public/manifest.json`** — nombre "ShapeUp", display standalone, background_color/theme_color `#0f1115`, 8 íconos (any + maskable).
- **`index.html`** — `<link rel="manifest">`, `<meta name="theme-color" content="#0f1115">`, favicons, `<link rel="apple-touch-icon">`, metas Apple PWA.
- **`vite-plugin-pwa@1.3.0`** (devDependency) — `VitePWA({ manifest: false, registerType: "autoUpdate", workbox: { globPatterns, navigateFallback, navigateFallbackDenylist } })`. Manifest estático desde `public/` (patrón heredado de Comida Familiar).
- **`src/hooks/useInstallPrompt.ts`** (nuevo) — `useInstallPrompt()` → `{ canInstall, isInstalled, isIOS, promptInstall }`. Escucha `beforeinstallprompt` (Chrome/Android/Desktop) y `appinstalled`. Detecta standalone via `matchMedia` + `navigator.standalone` (iOS).
- **`src/routes/Perfil.tsx`** — card "Instalar app" con `<Download>` en `--accent-dim` + botón "Instalar" (solo si `canInstall && !isInstalled`). Hint iOS ("Compartir → Agregar a inicio") con `<Share>` si `isIOS && !canInstall && !isInstalled`.

#### ADR — PWA con manifest estático en public/, patrón heredado de Comida
- **Decisión:** `manifest: false` en VitePWA → el manifest viene de `public/manifest.json`, no generado por el plugin.
- **Razón:** más predecible, fácil de editar directamente, mismo patrón que Comida Familiar.

#### ADR — Ícono de PWA fijo, no-temático
- **Decisión:** el ícono de la PWA es el squircle Ion (cian `#22d3ee`) fijo. No cambia con el tema del miembro.
- **Razón:** el ícono de la app es identidad de marca global, no preferencia personal. El `theme_color` del manifest es el fondo base, no el acento del miembro.

---

### [2026-06-07] E6.3 — Importador zip-first
- **`jszip@3.10.1`** — nueva dependencia (extracción selectiva de ZIPs en el cliente).
- **`src/import/samsungZip.ts`** (nuevo) — orquestador zip-first. `extraerDesdeZip(file, miembro, nivel, zonasFC, onProgress)` → `ZipExtraccion`. Niveles: "basico" (peso/cardio/sueño), "completo" (+ métricas), "biometrico" (+ custom_exercise para custom_id + live_data.json). Extracción selectiva: `JSZip.loadAsync` lee el índice; `.async("text")` solo para los archivos necesarios. Validación del ZIP (markers de Samsung). Parser de custom_exercise inline para extraer `shapeUpCustomId`. Índice de live_data por datauuid (evita buscar en todos los ~2300 archivos).
- **`src/routes/Salud.tsx`** — ZIP como camino principal: selector de nivel (Básico/Completo/Con biometría), botón Upload → ZIP, botón FileText → CSV suelto (fallback). Barra de progreso animada (0–100%) durante la extracción. `PreviewState` extendido con `zipData?: ZipExtraccion` + `zipTotal`. `confirmarImport` maneja `tipo === "zip"` importando todas las categorías en paralelo.
- **`docs/SAMSUNG-HEALTH-MAPEO.md`** — sección "Importación zip-first": estructura del ZIP, extracción selectiva, validación, niveles.

#### ADR — zip-first por restricción de PWA móvil
- **Decisión:** zip como único camino de import one-shot; `showDirectoryPicker` no se usa.
- **Razón:** no existe en Chrome/Firefox Android; abrir carpeta con 2300+ archivos cuelga el browser.

#### ADR — Extracción selectiva para no agotar memoria
- **Decisión:** solo se descomprimen los archivos necesarios según el nivel (`JSZip.async("text")` por entrada).
- **Razón:** el ZIP pesa ~150 MB; descomprimir todo en memoria causaría OOM en móviles de gama media.

---

### [2026-06-07] E6.2 — Match biométrico (FC por serie)
- **`src/types/models.ts`** — `SerieRegistro` suma `inicioMs?`, `finMs?` (timestamps habilitantes del match fino) y `fcPico?`, `fcFinSerie?`, `recuperacionBpm?` (enriquecimiento). Nueva interfaz `BiometriaSesion` (fuente, datauuid, fcMedia/Max/Min, zonaPrincipal, kcal, matchPor, granularidad). `Historial` suma `biometria?: BiometriaSesion`.
- **`src/lib/entrenarState.ts`** — `EntrenarState` suma `serieInicioMs: Record<number, number>`. `completarSerie` sella `finMs = now` y consume `serieInicioMs[idx]` → `inicioMs`. `saltarDescanso(state, now)` sella `serieInicioMs[bloqueIdx] = now` (inicio de la próxima serie). `deshacerSerie` limpia `serieInicioMs`.
- **`src/hooks/useEntrenarState.ts`** — `saltarDescanso()` captura `Date.now()` y lo pasa al reducer puro.
- **`src/import/samsungLiveData.ts`** (nuevo) — `parsearLiveData(json)` → `LiveDataPoint[]` ordenado. Filtra `heart_rate = 0` e inputs inválidos. 4 tests verdes.
- **`src/lib/matchBiometrico.ts`** (nuevo) — `elegirSesionSamsung`: match por `custom_id` con fallback por ventana (±5 min). `enriquecerSerie`: `fcPico/fcFinSerie/recuperacionBpm` de la curva live_data. `derivarZona`: FC media → ZonaFC usando `config/perfiles.zonasFC`. `construirBiometriaSesion`: nivel sesión, `granularidad: "sesion"`. 10 tests verdes.
- **`src/routes/HistorialDetalle.tsx`** — sección "FC Samsung Health" si `h.biometria` existe: FC media, FC máx, kcal como stats; chip de zona con tokens `--zona-z*`.
- **`docs/SAMSUNG-HEALTH-MAPEO.md`** — sección "Match biométrico": llave `custom_id`, formato `live_data.json`, regla de ventana + degradación.

#### ADR — Match por custom_id con curva live_data.json y degradación elegante
- **Decisión:** identificar sesiones ShapeUp por `custom_id` (resolviendo `custom_name="ShapeUp"`, no hardcodeado); curva fina solo desde el ZIP; CSVs sueltos dan nivel sesión.
- **Razón:** el `title` viene vacío; el `custom_id` es la única llave confiable y el ZIP es la única fuente de la curva de 1 sample/seg.
- **Degradación:** sin curva o sin `inicioMs/finMs` → solo `granularidad: "sesion"`; nunca error.

#### ADR — `inicioMs/finMs` por serie como cambio habilitante
- **Decisión:** sellar timestamps en el reducer puro al completar/saltar descanso; se persisten en `BloqueRegistro.series` dentro del `Historial`.
- **Razón:** sin este sello no es posible acotar la ventana de la curva a nivel serie.

---

### [2026-06-06] D6 — Salud (acotado)
- **`src/routes/Salud.tsx`** — `CardioTab`: zona eliminada del texto muted y convertida a chip coloreado con tokens `--zona-z*` / `--zona-z*-dim` (semánticos, no siguen el tema). Leyenda de 5 zonas (Z1 recuperación → Z5 máximo) arriba de la lista de sesiones. Mensaje de import exitoso usa `rgba(74,222,128,0.12)` / `#4ade80` (verde semántico fijo, no --accent). `ImportPreview` muestra tipo en castellano ("Peso", "Ejercicio", "Sueño", "Métricas").
- **`src/routes/Home.tsx`** — plural racha: `"sem de racha"` / `"sems de racha"`.

---

### [2026-06-06] D7 — Perfil + auth
- **`src/routes/Perfil.tsx`** — card de info con `MemberAvatar` 52px + nombre + email + badges de objetivos. Card "Tema" con 8 swatches (círculos de 40px): activo con doble anillo (`box-shadow`) + `<Check>`. Sección "Familia" muestra todos los miembros (opacidad 0.5 los que no son el usuario actual). `setTheme()` del `useTheme()` re-skinea la app al instante y persiste por miembro.
- **`src/auth/LoginScreen.tsx`** — `<ShapeUpMark size={52} />` en acento; wordmark "ShapeUp" 28px; subtítulo "Tu plan para ponerte en forma"; botón primario "Entrar con Google" con ícono `LogIn`; nota "Acceso solo para miembros de la familia".
- **`src/auth/UnauthorizedScreen.tsx`** — `<ShapeUpMark size={52} />` en acento; título "Acceso no autorizado"; copy en voseo; botón "Cerrar sesión" secundario.
- D6 (Salud) omitida por ahora — el código ya tenía una versión funcional.

---

### [2026-06-06] D5 — Historial + Progreso
- **`src/components/MiniChart.tsx`** (nuevo) — gráfico de barras SVG reutilizable: `data: MiniChartPoint[]`, `color` (default `var(--accent)`), `height`. Barras con rx=4, etiquetas en `--muted`. Usado en D6 (Salud) para tendencias de peso/tonelaje.
- **`src/routes/Historial.tsx`** — cada fila tiene badge de bíceps a la izquierda (cuadrado 38px, `--accent-dim`, `<Bicep size={20} />` en `--accent`); layout flex row con contenido a la derecha; tonelaje con `.toLocaleString("es")`.
- **`src/routes/HistorialDetalle.tsx`** — título con `fontWeight: 800`; sección de bloques renombrada a "Series registradas"; título del bloque en `.bloque-nombre` con `.bloque-num` en acento. Ya no importa `prescripcionLabel` (innecesario en el historial real).
- **`src/index.css`** — `.stat-value` agrega `font-variant-numeric: tabular-nums; letter-spacing: -0.01em`.

---

### [2026-06-06] D4 — Biblioteca + Catálogo
- **`src/index.css`** — agregada clase `.banner-red` (danger) para la sección Seguridad del Catálogo.
- **`src/routes/Biblioteca.tsx`** — título fijo "Biblioteca" (no cambia por tab); FAB "Nueva rutina" restringido al owner (`juanpablo`); tarjetas de rutina muestran nº de ejercicios (`bloques.length`).
- **`src/routes/Catalogo.tsx`** — secciones de detalle migradas a clases CSS `.banner`: `.banner-green` (Puntos clave), `.banner-amber` (Errores comunes), `.banner-red` (Seguridad). Prop `embedded` evita doble wrapper `.page` cuando se renderiza dentro de Biblioteca.
- **`src/routes/RutinaDetalle.tsx`** — botón "Empezar sesión" (primario, ícono `Zap`) al pie de la pantalla.

---

### [2026-06-06] D3 — Entrenar / EntrenarSesion
- **`src/routes/EntrenarSesion.tsx`** — pantalla de finalización: reemplazó `🎉` por `<Bicep size={52} />` en `var(--accent)` (motivo de marca). El resto de la sesión (BloqueGuiado, DescansoTimer, BloqueScroll, log rápido, selector RPE) ya estaba implementado con los estilos correctos desde E4.
- **`src/routes/Entrenar.tsx`** — picker: `Zap` relleno en acento como indicador de "toca para empezar"; badges de rutina conservados.
- Los componentes `BloqueGuiado`, `DescansoTimer`, `BloqueScroll`, `ProgressDots` ya cumplían el target del UI kit; no requirieron cambios en D3.

---

### [2026-06-06] D2 — Home
- **`src/components/WeekStrip.tsx`** — reemplazado punto de entrenamiento por `<Bicep size={13} />` en `var(--accent)`: opacidad 1 si es hoy, 0.45 en otros días de sesión, 0 si no hay sesión. Fondo de hoy cambiado de `rgba(74,222,128,0.12)` hardcodeado a `var(--accent-dim)`.
- **`src/routes/Home.tsx`** — header de marca: `<ShapeUpMark>` + `<ShapeUpWordmark>` a la izquierda; `MemberAvatar` cliqueable (→ `/perfil`) a la derecha. Saludo "Dale, {primerNombre}." (punto en `var(--accent)`, 800, tracking apretado). Card "Tu semana" con chip de racha (`Flame` relleno), sesiones X/Y con barra de progreso en acento, volumen semanal. Labels usan clase `.t-label`. Racha calculada en presentación (semanas consecutivas con al menos 1 sesión). Copia de estados en voseo.

---

### [2026-06-05] D1 — Identidad + sistema de temas
- **`src/styles/tokens.css`** — reemplazado por superset de `colors_and_type.css`: 8 temas tematizables (`[data-theme="…"]`), escala de zonas FC (`--zona-z1..z5` + `-dim`), estados de fitness (`--estado-activa/descanso/pausa/hecho`), `--on-accent`, `--shadow-fab` tematizable, escala de tipografía (`--fs-*`, `--fw-*`, `--lh-*`) y clases semánticas `.t-h1`, `.t-display`, `.t-num`, etc.
- **`src/contexts/ThemeProvider.tsx`** (nuevo) — proveedor de tema por miembro. Lee `memberId` de `useAuth()`, resuelve el tema (default juanpablo→ion, maria→pulse, sofia→grape, federico→volt), setea `data-theme` en `document.documentElement`, persiste mapa por miembro en `localStorage` (`shapeup-themes`). Expone `useTheme() → { theme, setTheme }`.
- **`src/components/Brand.tsx`** (nuevo) — `<ShapeUpMark size />` (doble chevron SVG en `currentColor` = acento) y `<ShapeUpWordmark size />` ("Shape" en `--fg`, "Up" en `--accent`).
- **`src/components/Bicep.tsx`** (nuevo) — `<Bicep size className style />` envuelve `BicepsFlexed` de Lucide con `fill="currentColor"` para usarlo como motivo de marca en WeekStrip (D2) e Historial (D5).
- **`src/main.tsx`** — `<ThemeProvider>` agregado dentro de `<AuthProvider>` (necesita acceso a `useAuth`).
- **`src/index.css`** — `.btn-primary`, `.btn-serie-hecha`, `.fab` usan `var(--on-accent)` en lugar de `#0a1208`; `.fab` usa `var(--shadow-fab)` en lugar de sombra verde hardcodeada.
- **`public/`** — SVGs de marca copiados (`shapeup-icon.svg`, `shapeup-mark.svg`, `shapeup-wordmark.svg`, `shapeup-wordmark-light.svg`) para uso en meta/manifest.

#### ADR — Tema por miembro en localStorage (capa de presentación)
- **Decisión:** el tema de cada miembro se persiste en `localStorage` (`shapeup-themes`, mapa por miembro), NO en Firestore.
- **Razón:** la preferencia de tema es puramente local y de presentación; sincronizarla entre dispositivos requeriría una colección Firestore y listeners adicionales sin beneficio claro en la v1.
- **Consecuencia:** si el usuario cambia de dispositivo, el tema vuelve al default del miembro. Queda anotado como posible mejora futura (ADR para sincronizar si se requiere).

#### ADR — Zonas FC y colores de miembro fuera del tema
- **Decisión:** `--zona-z1..z5`, `--zona-z*-dim` y `--member-*` son tokens **constantes** que no cambian con el tema.
- **Razón:** las zonas son semánticas (rampa térmica fría→caliente); mezclarlas con la identidad del tema rompería su significado. Los colores de miembro son identidad personal, no preferencia estética.

#### Pendiente — PWA
- `vite-plugin-pwa` no está instalado. Los SVGs de ícono ya están en `public/`. Cuando se decida instalar la PWA: generar íconos 192/512/maskable desde `shapeup-icon.svg`, agregar `theme-color: #0f1115` y `background_color: #0f1115` al manifest.

---

### [2026-06-04] E1.1 — Fix: tests de auth sin entorno Firebase
- Causa: `resolveMemberId.test.ts` importaba `findMemberByEmail` desde `resolveMemberId.ts`, que importa `db` desde `firebase.ts`, que ejecuta `getAuth(app)` al cargarse → crash en CI sin `.env.local`
- Arreglo: `src/auth/findMemberByEmail.ts` — función pura sin imports de Firebase
- `resolveMemberId.ts` ahora importa desde el nuevo archivo (y re-exporta para compatibilidad)
- Test movido a `src/auth/findMemberByEmail.test.ts` — importa solo el archivo puro
- `resolveMemberId.test.ts` eliminado
- Resultado: 51 tests verdes; `tsc -b` limpio; el test corre sin `.env.local`

---

### [2026-06-04] Privacidad — Mails reales fuera del repo
- `scripts/seed-config.ts` ya no tiene emails hardcodeados; lee de `scripts/data/familia.local.json`
- `scripts/data/familia.local.json` — gitignoreado; contiene los emails reales (no se commitea)
- `scripts/data/familia.example.json` — commiteado; placeholders `@example.com` para saber el formato
- `.gitignore` — agrega `scripts/data/familia.local.json`
- **⚠️ DECISIÓN PENDIENTE:** los emails ya estaban en el historial de git (commits anteriores de seed-config.ts). Sacarlos del repo HEAD no los borra de los commits pasados. Opciones: (a) purgar con `git filter-repo`/BFG Repo Cleaner (reescribe el historial, requiere force-push y avisar a colaboradores), (b) marcar el repo como privado en GitHub. **Confirmar con el owner antes de actuar.**

---

### [2026-06-04] E5.1 — Cierre de sesión correcto (multiusuario)
- **Bug 1 (crítico):** `finalizarSesion` actualizaba contadores en `/ejercicios` (owner-only) → abortaba toda la tx para no-owners
  - Solución: tx escribe SOLO documentos del miembro (`/historial` + transición `/sesiones`); contadores removidos (ver ADR #014)
- **Bug 2:** sesión nunca cambiaba de estado; `idSesion` era huérfano (fabricado con `Date.now()`)
  - Solución: `EntrenarSesion.tsx` llama `crearSesion` + `iniciarSesion` al montar; pasa el `idSesion` real a `finalizarSesion`; la tx marca la sesión como `Registrada`
- **Cleanup:** `seriesObjetivo` unificada — la función vivía duplicada en `entrenarState.ts` y como `seriesDeBloque` en `metricas.ts`; ahora existe una sola versión exportada desde `metricas.ts` (re-exportada desde `entrenarState.ts` para compat)
- Tests: 89 unitarios + 38 reglas (4 nuevos: no-owner puede cerrar su sesión)
- Total: **127 tests verdes**

---

### [2026-06-04] Calidad — Tests de reglas Firestore (emulador)
- `src/__tests__/firestore.rules.test.ts` — 34 tests cubriendo: no-miembro, owner, miembro, anónimo, login via get(/config/familia), email alternativo de María
  - Suites: ejercicios, rutinas, programas, config, users, historial+sesiones, resolución memberId
- `vitest.rules.config.ts` — config separada (`environment: node`); `testTimeout: 15000`
- `Firebase.json` — emulador Firestore en `127.0.0.1:8080`, UI en 4000
- `npm run test:rules` → `firebase emulators:exec --only firestore -- vitest run --config vitest.rules.config.ts`
- `npm run test:all` → unidad + reglas
- `@firebase/rules-unit-testing@5.0.1` agregado a devDependencies
- Resultado: 34 tests verdes ✅

---

### [2026-06-04] UI — MemberAvatar, WeekStrip y color de perfiles
- `src/components/MemberAvatar.tsx` — círculo de iniciales + `AvatarStack`; adaptado de Comidas-Familiares; colores desde `var(--member-*)` con override opcional desde `/config/perfiles`
- `src/components/WeekStrip.tsx` — tira de 7 días; hoy marcado en verde (var(--accent)); puntos en días con entrenamiento; adaptado de Comidas-Familiares
- `src/data/perfiles.ts` — `getPerfiles()` lee `/config/perfiles` (con caché)
- `src/routes/Home.tsx` — avatar en cabecera (color desde perfiles) + WeekStrip con días del programa activo marcados
- `src/routes/Perfil.tsx` — avatar grande (52px) + nombre + objetivos del perfil

---

### [2026-06-04] E2.1 — Catálogo de ejercicios (pantalla real)
- `src/routes/Catalogo.tsx` — lista con buscador + filtros (Área/Tipo/Equipo/Nivel) usando `lib/filtros.ts`; tarjeta expandible con instrucciones/puntosClave/erroresComunes/seguridad; FAB solo visible para el owner (`juanpablo`)
- `src/routes/EjercicioForm.tsx` — alta y edición de ejercicio (nuevo); todos los campos de `EjercicioInput`; solo navegable por el owner (el FAB/botón Editar lo renderiza Catálogo)
- `src/routes/Biblioteca.tsx` — pestañas "Rutinas | Ejercicios" en el header (via `?tab=ejercicios`); el catálogo se navega en el mismo AppShell sin tocar el nav inferior
- `src/App.tsx` — rutas `/catalogo/nueva` y `/catalogo/:id/editar` → `EjercicioForm`
- ExercisePicker (modal en RutinaForm) sigue funcionando independientemente
- ADR #013: acceso al catálogo via tabs en /biblioteca (ver §5 ADR)

---

### [2026-06-04] Seed 15 — Perfiles por miembro (equipo, objetivos, zonas FC)
- `scripts/seed-perfiles.ts` — idempotente (`--dry-run`/`--force`); escribe `/config/perfiles`
  - `zonasFC` calculadas: FCmáx ≈ 220 − edad; Z1–Z5 por % (50/60/70/80/90/100%)
  - juanpablo (51): FCmáx 169 · maria (50): FCmáx 170 · sofia (17): FCmáx 203 · federico (16): FCmáx 204
  - Colores placeholder por miembro; se pueden afinar sin tocar el seed
  - Forma `PerfilesConfig` / `PerfilMiembro` de `src/types/models.ts` (verificada)
- `src/styles/tokens.css` — tokens `--member-juanpablo/maria/sofia/federico` sincronizados con colores del seed
- `npm run seed:perfiles` agregado a `package.json`
- `tsc -b` limpio ✅; dry-run verificado

---

### [2026-06-04] Seed 14 — Visibilidad por miembro
- `scripts/seed-visibilidad.ts` — idempotente; flags `--dry-run` / `--force` (sin `--force` no pisa si ya existe)
  - Owner (`juanpablo`) no figura: ve todo por reglas de Firestore
  - `maria` → PRG-0012 + RUT-0021/22/0004/0008 (glúteos + VR)
  - `federico` → PRG-0010 + RUT-0017/18 (rugby juvenil)
  - `sofia` → PRG-0011 + RUT-0019/20 (fútbol juvenil)
  - Escribe `/config/visibilidad` (forma `VisibilidadConfig` de `src/types/models.ts`)
  - `data/visibilidad.ts` lee el doc: owner retorna `null` → ve todo; otros retornan `VisibilidadMiembro`
  - `npm run seed:visibilidad` agregado a package.json
  - `tsc -b` limpio ✅; dry-run verificado

---

### [2026-06-04] Seed 13 — María (glúteos y recomposición)
- `scripts/seed-maria.ts` — aditivo; depende de seed-plan.ts, seed-vr.ts y seed-futbol-juvenil.ts (reusa EJ-8030)
  - 2 ejercicios EJ-8033/34: empuje de cadera (hip thrust) + patada de glúteo (cuadrupedia)
  - 2 rutinas RUT-0021/22: Glúteos y piernas A + Glúteos y cuerpo completo B
  - PRG-0012 para María (50 años): 2 días fuerza (glúteo/piernas) + 2 días cardio VR (RUT-0004 + RUT-0008)
  - `comoUsar` incluye nota honesta: grasa abdominal no baja localizado, requiere déficit global + alimentación (nutricionista)
  - Visibilidad de PRG-0012 para maria: setear en config/visibilidad
  - Dependencia implícita EJ-8030 (seed-futbol-juvenil.ts) documentada en header del script
  - `npm run seed:maria`; dry-run verificado

---

### [2026-06-04] Seed 12 — Fútbol juvenil (Sofía, prevención y movilidad)
- `scripts/seed-futbol-juvenil.ts` — aditivo; depende de seed-plan.ts y seed-rugby-juvenil.ts
  - 3 ejercicios EJ-8030..32: caminata lateral con banda, salto con aterrizaje controlado, RDL a una pierna
  - 2 rutinas RUT-0019/20: Prevención A (rodilla/isquios/ingle) + Prevención B (core/glúteos/estabilidad)
  - PRG-0011 para Sofía (17, fútbol): foco en prevención de lesión de ligamento cruzado + isquios + ingle
  - `consejosSeguridad` en EJ-8031 (salto): pocas reps, parar si duele la rodilla
  - Visibilidad de PRG-0011 para sofia: setear en config/visibilidad (no en el seed)
  - `npm run seed:futbol-juvenil`; dry-run verificado

---

### [2026-06-04] Seed 11 — Rugby juvenil (Federico, prevención y movilidad)
- `scripts/seed-rugby-juvenil.ts` — aditivo; depende de seed-plan.ts
  - 2 ejercicios EJ-8028/29: curl nórdico asistido (isquios, excéntrico) + plancha copenhague (aductores)
  - 2 rutinas RUT-0017/18: Prevención A (cadena posterior) + Prevención B (tren superior + estabilidad)
  - PRG-0010 para Federico (16, rugby): cargas submáximas, RIR 2–3, sin fallo (crecimiento)
  - `consejosSeguridad` en EJ-8028 y EJ-8029 (campo opcional de Ejercicio, verificado en models.ts)
  - Visibilidad de PRG-0010 para federico: setear en config/visibilidad (no en el seed)
  - `npm run seed:rugby-juvenil`; dry-run verificado

---

### [2026-06-04] Seed 10 — Planes extra (hipertrofia, movilidad, express, deload)
- `scripts/seed-planes-extra.ts` — aditivo; sin tocar lo de seed-plan.ts:
  - 9 ejercicios EJ-8019..EJ-8027 (elevaciones laterales, búlgara, face pull, aperturas, gato-camello, world's greatest, círculos cadera, apertura torácica, estiramiento isquios)
  - 8 rutinas RUT-0009..RUT-0016: Hipertrofia tren superior/inferior A/B, Movilidad cuerpo completo, Recuperación VR Z2, Full-body express A/B
  - 4 programas PRG-0006..PRG-0009: Hipertrofia 4 días, Movilidad y recuperación, Express 2 días/30 min, Deload 1 semana
- PRG-0009 (deload) reduce volumen vía `comoUsar`/`reglasProgresion`; reusa RUT-0001/0002 sin duplicarlas
- Dependencias: seed-plan.ts (RUT-0001/0002) y seed-vr.ts (EJ-9003 Body Combat Z2)
- `npm run seed:planes-extra`; dry-run verificado

---

### [2026-06-04] Seed 09 — Plan real (ejercicios + rutinas + programas)
- `scripts/seed-plan.ts` — en orden: 18 ejercicios curados (EJ-8001..EJ-8018) + 8 rutinas (RUT-0001..RUT-0008: Fuerza A/B/C + 5 VR) + 5 programas (PRG-0001..PRG-0005: uno Activo + 4 Plantillas)
- Consistente con `Ejercicio`, `Rutina`, `BloqueEjercicio`, `Prescripcion`, `DiaPrograma` y `Programa` de `models.ts`
- Idempotente, mismo patrón que seed-vr/config/ejercicios
- `npm run seed:plan` agregado; dry-run verificado
- Dependencia: correr `seed-vr.ts` antes (rutinas VR referencian EJ-9001+)
- `firebase-admin` y `tsx` ya estaban en devDependencies ✅

---

### [2026-06-04] Seed 07 — Juegos VR (PSVR2)
- `scripts/seed-vr.ts` — 10 juegos PSVR2 como ejercicios de catálogo (modalidad Cardio, equipo VR, patrón "Locomoción / cardio"), IDs EJ-9001…EJ-9010
- Sigue el mismo patrón que seed-config/seed-ejercicios: `--dry-run`, `--force`, firebase-admin
- `npm run seed:vr` agregado a package.json
- Campo extra `poseidoPorOwner: boolean` (ver ADR #007 — no está en el modelo, sólo en Firestore)

---

### [2026-06-05] E6.1 — Métricas genéricas de Samsung Health (granularidad diaria)
- `src/types/models.ts` — `MetricaSalud`, `TipoMetrica` (13 tipos), `AgregacionMetrica`; `idMetrica = ${miembro}-${tipo}-${fecha}` idempotente
- `firestore.rules` — `/metricas-salud/{id}` (read/write: isFamilyMember)
- `firestore.indexes.json` — índice compuesto `(miembro ASC, tipo ASC, fecha DESC)` para tendencias; también `/sueno`
- `src/import/samsungHealth.ts` — `parsearMetricas(filename, text, miembro)`: 9 tipos (heart_rate, hrv, stress, steps, spo2, respiratory, skin_temp, blood_pressure, vitality); helpers `minArr/maxArr/avgArr/sumArr/lastArr/idMetrica`
- `src/data/salud.ts` — `getMetricasSalud`, `importarMetricas` (idempotente por idMetrica)
- `src/routes/Salud.tsx` — modo "Básico" vs "Completo (+ métricas genéricas)"; preview antes de importar
- Tests: 53 tests en samsungHealth.test.ts (22 nuevos)
- `docs/SAMSUNG-HEALTH-MAPEO.md` — nueva sección §4 métricas genéricas
- ADR #016: granularidad diaria

---

### [2026-06-04] E6 — Salud (módulo)
- `src/data/salud.ts` — CRUD /mediciones y /cardio; `importarMediciones`/`importarCardio` batch
- `src/lib/parsearCSV.ts` — `parsearPesoCSV` y `parsearEjercicioCSV` para exports Samsung Health
- `src/routes/Salud.tsx` — tabs Composición/Cardio; último registro + historial; import CSV; carga manual (modal)
- `src/layout/AppShell.tsx` — reemplaza "Catálogo" por "Salud" en bottom-nav (E2 UI pendiente)
- App.tsx: ruta `/salud`
- Decisiones: el motor de recomendaciones queda para una etapa futura (tipos ya definidos en models.ts).

---

### [2026-06-04] E5 — Programas, sesiones, historial y visibilidad
- `src/data/historial.ts` — `finalizarSesion` con `runTransaction` (Historial + Rutina.vecesEntrenada + Ejercicio.vecesUsado)
- `src/data/programas.ts` — CRUD + `getProgramaActivo`
- `src/data/sesiones.ts` — máquina de estados Programada→En curso→Registrada
- `src/data/visibilidad.ts` — owner ve todo; otros ven solo lo asignado
- `src/lib/elegibilidad.ts` — `rutinasElegibles`/`programasElegibles`
- `src/routes/Home.tsx` — programa activo + "hoy toca" por `diaSemana`; botón "Empezar sesión"
- `src/routes/Historial.tsx` — lista de sesiones del miembro (fecha, duración, series, tonelaje, RPE)
- `src/routes/HistorialDetalle.tsx` — stats + bloques registrados
- `EntrenarSesion.tsx` — "Finalizar" llama `finalizarSesion`, navega a `/historial`
- Pendiente: tests de reglas con emulador (requiere `firebase emulators:start`)

---

### [2026-06-04] E4 — Entrenar (sesión guiada)
- `src/hooks/useEntrenarState.ts` — carga/persiste localStorage, descarta descansos vencidos
- `src/components/entrenar/ProgressDots.tsx` — dots por serie (done / active)
- `src/components/entrenar/DescansoTimer.tsx` — tick 250ms, Web Audio beep, Notification API
- `src/components/entrenar/BloqueGuiado.tsx` — ejercicio + objetivo + instrucciones + banners
- `src/components/entrenar/BloqueScroll.tsx` — botones de serie para modo scroll
- `src/routes/Entrenar.tsx` — picker de rutina
- `src/routes/EntrenarSesion.tsx` — fullscreen; modo guiado + scroll; log reps/carga; descanso +30s/saltar; finalización con RPE
- `src/lib/entrenarState.test.ts` — 26 tests
- `/entrenar/:rutinaId` fuera del AppShell (sin bottom-nav)

---

### [2026-06-03] E3 — Rutinas (+ fundamentos E2)
- `src/data/_helpers.ts` — `proximoId`; `src/data/ejercicios.ts`; `src/data/rutinas.ts` con `calcularCacheRutina` al guardar
- `src/lib/filtros.ts` + `filtros.test.ts` (9 tests); `lib/metricas.test.ts` (11 tests)
- `src/lib/parseRango.ts`; `src/lib/prescripcionLabel.ts`
- `src/components/rutina/`: ExercisePicker, PrescripcionForm, BloqueFormItem
- `src/routes/Biblioteca.tsx`, `RutinaDetalle.tsx`, `RutinaForm.tsx`
- E2 pantalla Catálogo pendiente (data layer implementado)

---

### [2026-06-03] E1 — Base y autenticación
- Firebase init multi-tab, Auth Google, AuthProvider, resolveMemberId, upsertUserDoc
- AppShell + bottom-nav, rutas placeholder, tsconfig composite para `tsc -b`
- `src/auth/findMemberByEmail.test.ts` — 4 tests (movido en E1.1 para correr sin .env)

---

## 3. Mapa del código

```
src/
  firebase.ts                 ✅
  vite-env.d.ts               ✅
  styles/tokens.css           ✅  (+ tokens --member-* por miembro)
  types/models.ts             ✅
  lib/
    result.ts                 ✅
    canonical.ts              ✅
    filtros.ts                ✅  filtros.test.ts ✅
    parseRango.ts             ✅
    prescripcionLabel.ts      ✅
    parsearCSV.ts             ✅  (parsea Samsung Health CSV)
    metricas.ts               ✅  metricas.test.ts ✅
    entrenarState.ts          ✅  entrenarState.test.ts ✅
    elegibilidad.ts           ✅
    recomendaciones.ts        ⬜ (futuro)
  components/
    MemberAvatar.tsx          ✅  (círculo iniciales + AvatarStack; var(--member-*))
    WeekStrip.tsx             ✅  (tira 7 días; hoy en --accent; puntos en días con sesión)
  data/
    _helpers.ts               ✅
    ejercicios.ts             ✅  (EJ-XXXX)
    rutinas.ts                ✅  (RUT-XXXX)
    programas.ts              ✅  (PRG-XXXX)
    sesiones.ts               ✅
    historial.ts              ✅  (finalizarSesion con runTransaction)
    visibilidad.ts            ✅
    perfiles.ts               ✅  (getPerfiles, caché en memoria)
    salud.ts                  ✅  (MedicionCorporal + SesionCardio)
  auth/
    AuthContext.ts            ✅
    AuthProvider.tsx          ✅
    useAuth.ts                ✅
    LoginScreen.tsx           ✅
    UnauthorizedScreen.tsx    ✅
    findMemberByEmail.ts      ✅  función pura (sin Firebase)
    findMemberByEmail.test.ts ✅  4 tests (sin .env requerido)
    resolveMemberId.ts        ✅  (re-exporta findMemberByEmail + lógica Firestore)
    upsertUserDoc.ts          ✅
  hooks/
    useEntrenarState.ts       ✅
  layout/
    AppShell.tsx              ✅  (6 ítems: Inicio/Rutinas/Entrenar/Historial/Salud/Perfil)
  components/
    rutina/
      PrescripcionForm.tsx    ✅
      ExercisePicker.tsx      ✅
      BloqueFormItem.tsx      ✅
    entrenar/
      ProgressDots.tsx        ✅
      DescansoTimer.tsx       ✅
      BloqueGuiado.tsx        ✅
      BloqueScroll.tsx        ✅
  routes/
    Home.tsx                  ✅  (programa activo + hoy toca)
    Biblioteca.tsx            ✅
    RutinaDetalle.tsx         ✅
    RutinaForm.tsx            ✅
    Catalogo.tsx              ✅  (lista + filtros + detalle inline; FAB owner)
    EjercicioForm.tsx         ✅  (alta/edición; solo owner)
    Entrenar.tsx              ✅  (picker)
    EntrenarSesion.tsx        ✅  (fullscreen; guiada + scroll; finalizar → Historial)
    Historial.tsx             ✅
    HistorialDetalle.tsx      ✅
    Salud.tsx                 ✅  (composición + cardio + import CSV + manual)
    Perfil.tsx                ✅
  App.tsx                     ✅
  main.tsx                    ✅
scripts/
  importar-fedb.ts            ✅  (genera catalogo-ejercicios.json)
  seed-config.ts              ✅  (siembra /config/*)
  seed-ejercicios.ts          ✅  (sube 873 ejercicios a Firestore)
  seed-vr.ts                  ✅  (10 juegos PSVR2, EJ-9001…EJ-9010, poseidoPorOwner)
  seed-plan.ts                ✅  (18 ejercicios EJ-8001+, 8 rutinas RUT-0001+, 5 programas PRG-0001+)
  seed-planes-extra.ts        ✅  (9 ejercicios EJ-8019+, 8 rutinas RUT-0009+, 4 programas PRG-0006+)
  seed-rugby-juvenil.ts       ✅  (EJ-8028/29, RUT-0017/18, PRG-0010 Federico)
  seed-futbol-juvenil.ts      ✅  (EJ-8030..32, RUT-0019/20, PRG-0011 Sofía)
  seed-maria.ts               ✅  (EJ-8033/34, RUT-0021/22, PRG-0012 María)
  seed-visibilidad.ts         ✅  (config/visibilidad: maria/federico/sofia; owner ve todo)
  seed-perfiles.ts            ✅  (config/perfiles: color/equipo/objetivos/zonasFC por miembro)
firestore.rules               ✅  desplegadas
firestore.indexes.json        ✅  desplegados
```

---

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

---

## 5. ADR

```
#001 tsc -b con outDir en .tsc-out/ — composite incompatible con noEmit
#002 findMemberByEmail exportada separada — testeable sin mockear Firestore
#003 E2 UI omitida a pedido — data layer implementado en E3
#004 prescripcionLabel en lib/ — reutilizable desde E3 y E4
#005 EntrenarSesion fuera del AppShell — pantalla fullscreen sin bottom-nav
#006 "Catálogo" reemplazado por "Salud" en bottom-nav — E2 UI pendiente
#007 [2026-06-04] poseidoPorOwner en seed-vr.ts
  Contexto: el script siembra 10 juegos VR; el owner no tiene todos instalados.
  Decisión: campo extra `poseidoPorOwner: boolean` en el doc de Firestore.
  Por qué no está en el modelo: Ejercicio es catálogo neutral (cualquier miembro);
  "poseído" es propiedad del owner, no del ejercicio. Se guarda como metadata
  informativa para que la UI filtre o muestre etiqueta "disponible".
  Los scripts usan tsx (no pasan por tsc -b), por eso no rompe el type-check.
#010 [2026-06-04] Rangos de IDs reservados para seeds
  EJ-0001…EJ-7999: importador FEDB (seed-ejercicios.ts)
  EJ-8001…EJ-8999: ejercicios del plan con técnica curada (seed-plan.ts)
  EJ-9001…EJ-9999: juegos de VR (seed-vr.ts)
  RUT-0001+: seed-plan.ts (Fuerza A/B/C + VR); la app crea los siguientes secuencialmente
  PRG-0001+: seed-plan.ts; la app crea los siguientes secuencialmente

#011 [2026-06-04] duracionEstimadaMin y totalSeries en seeds son estimaciones
  Contexto: calcularCacheRutina (lib/metricas.ts) necesita el catálogo de ejercicios
  para calcular equipoNecesario, y hace los cálculos precisos de duración y series.
  Los seeds ponen valores estimados (calculados a mano) para que la UI muestre algo
  desde el primer día sin necesidad de editar cada rutina.
  Resultado: en la primera edición de cada rutina desde la app, calcularCacheRutina
  recalcula y reemplaza con los valores exactos.

#012 [2026-06-04] Fuerza C (circuito) se recorre lineal en el motor actual
  Contexto: RUT-0003 está pensada como circuito round-robin (1 serie de cada ejercicio,
  repetir N rondas). El reducer entrenarState.ts recorre bloque por bloque: completa
  todas las series de uno antes de pasar al siguiente.
  Resultado: la app la guía linealmente; el usuario puede usar el modo scroll para
  hacer el circuito a mano. Mejora futura: soporte de grupoSet en el reducer para
  que el modo guiado recorra round-robin los bloques con el mismo grupoSet.

#016 [2026-06-05] Métricas genéricas en granularidad diaria (no datos crudos)
  Contexto: Samsung Health exporta métricas de alta frecuencia (FC continua,
  acelerómetro, etc.) con miles de muestras por día. Volcarlo crudo reventaría
  las cuotas del plan Spark de Firestore y no aporta: el motor de
  recomendaciones usa tendencias (cómo evolucionó HRV/estrés por día/semana).
  Decisión: el importador agrega a UN valor por día antes de escribir en Firestore
  (mínimo para fc-reposo, máximo para fc-max-dia, promedio para estrés, etc.).
  Las muestras crudas se descartan en memoria; nunca llegan a la base.
  idMetrica = `${miembro}-${tipo}-${fecha}` → un doc por día, idempotente:
  re-importar el mismo archivo no duplica datos.

#015 [2026-06-04] Emails reales en historial de git — decisión pendiente
  Contexto: seed-config.ts tenía los emails reales hardcodeados. Se movieron
  a familia.local.json (gitignoreado) pero los commits pasados todavía tienen
  los emails en el historial público de GitHub.
  Opciones evaluadas:
    (a) git filter-repo / BFG: reescribe el historial, elimina los emails de
        todos los commits; requiere force-push y coordinar con colaboradores.
    (b) Hacer el repo privado en GitHub: más rápido; los datos siguen en el
        historial pero solo visible para colaboradores autorizados.
  Decisión: a confirmar por el owner (jpcofano). No se actuó aún para no
  romper el historial sin autorización explícita.

#014 [2026-06-04] Contadores de ejercicios/rutinas separados de la tx de cierre
  Contexto: /ejercicios es owner-only por las reglas de Firestore. Si incluimos
  `tx.update(ejercicios/EJ-XXXX)` en la transacción de `finalizarSesion`, cualquier
  sesión de un no-owner (maría, federico, sofía) aborta con PERMISSION_DENIED y
  el Historial nunca se guarda.
  Decisión: la transacción de cierre escribe SOLO documentos del miembro propio
  (/historial y la transición de /sesiones a "Registrada"). Los contadores
  (vecesEntrenada, vecesUsado) se eliminan del flujo online; son derivables del
  Historial por agregación (analytics). Si en el futuro se necesitan "en vivo",
  la opción correcta es una Cloud Function triggered por onDocumentCreated en
  /historial (que corre con privilegios de admin, sin restricciones de reglas).

#017 [2026-06-09] Programa activo por miembro vía doc config/programaActivo
  Contexto: getProgramaActivo() devuelve el primer programa con estado:"Activo" (global).
  En app familiar con varios miembros, si JP y María tienen programas activos, la función
  devuelve el primero de la lista → colisión.
  Decisión: doc config/programaActivo (mapa miembro→programaId), análogo a config/visibilidad.
  getProgramaActivo(miembroId) lo lee; fallback a estado:"Activo" si no hay entrada para el miembro.
  setProgramaActivo(miembroId, programaId) nuevo.
  Razón: evita migrar los docs de /programas; un solo doc, fácil de leer/escribir; mismo
  patrón que visibilidad. Permite que cada miembro tenga su programa sin colisión.

#018 [2026-06-09] Sesión del día por día de semana, con fallback secuencial
  Contexto: proximaSesion() usa orden secuencial del programa. La familia entrena en días
  fijos (quieren ver "hoy toca / hoy descansás"), pero no hay que castigar a quien se saltea.
  Decisión: nueva sesionDeHoy(programa, hoyDiaSemana, historialSemana) resuelve la rutina
  del día actual por diaSemana; devuelve estado "descanso" si hoy es descanso, "ya entrenaste"
  si ya hay sesión hoy. proximaSesion() se mantiene como fallback para días salteados / "qué sigue".
  Razón: separa "qué toca hoy" de "qué sigue sin hacer"; cada función tiene responsabilidad clara.
  No se rompe retrocompat: proximaSesion sigue funcionando igual.

#013 [2026-06-04] Acceso al Catálogo via tabs en /biblioteca
  Contexto: el catálogo salió del nav inferior en ADR #006 para meter Salud (6 ítems).
  Sin un punto de entrada no hay forma de llegar a los ejercicios desde la UI.
  Decisión: pestañas "Rutinas | Ejercicios" en la cabecera de /biblioteca; el tab
  activo se persiste en el query param `?tab=ejercicios`. El nav inferior no cambia.
  Por qué no una ruta nueva en el nav: mantener 6 ítems fijos es la restricción del diseño.
  Por qué no /catalogo standalone: las rutinas y los ejercicios se navegan juntos (al
  crear una rutina se elige un ejercicio del catálogo); agruparlos en /biblioteca es coherente.
  /catalogo sigue funcionando como ruta directa; Biblioteca la embebe via el tab.

#009 [2026-06-04] función pura separada del módulo con I/O de Firebase
  Contexto: findMemberByEmail vivía en resolveMemberId.ts que importa firebase.ts.
  Vitest ejecuta los imports al cargar el test; firebase.ts llama getAuth(app) que
  tira auth/invalid-api-key sin VITE_FIREBASE_API_KEY (CI, checkout limpio).
  Resultado: 0 tests colectados, suite falla aunque la función es pura y no toca Firebase.
  Decisión: extraer funciones puras a archivos sin imports de Firebase.
  Regla general: lib/ y funciones auxiliares de auth NO importan firebase.ts ni
  ningún módulo que lo haga transitivamente.

#008 [2026-06-04] IDs reservados EJ-9001+ para VR
  Contexto: importar-fedb.ts asigna IDs secuenciales desde EJ-0001.
  Decisión: saltar al rango 9001+ para VR garantiza que nunca colisionan,
  corra seed-vr.ts antes o después de seed-ejercicios.ts.
```

---

## Backlog / roadmap (ideas — NO implementadas)

> No es estado: nada de acá está hecho hasta que tenga su entrada en la Bitácora. Orden ≈ prioridad.

### A. Flujo de entrenar (del análisis de UX)
- **A1. "Próxima sesión" + Home hero "Empezar" + Entrenar como 3 puertas**, con rutinas filtradas por miembro. Lógica pura `lib/proximaSesion.ts` (programa × historial). Resuelve "cómo empiezo / dónde elijo".
- **A2. Modo libre / un ejercicio:** sesión ad-hoc desde el catálogo; Historial con `tipo:"libre"` (sin `idRutina`). Resuelve "cómo hago 1 ejercicio".
- **A3. Mi programa / Mi semana:** ver el plan (N días, qué toca cada uno), empezar cualquier día, cambiar de programa.
- **A4. Dentro del entreno:** cronómetro de trabajo (isométricos/cardio) + pausar + terminar/abandonar.
- **A5. Reemplazar un ejercicio** sobre la marcha.
- **A6. Notas y RPE** por sesión.

### B. Riqueza de ejercicios (prioridad del owner)
- **B1. Explicaciones más ricas:** surfacear músculos primarios/secundarios, nivel, mecánica, patrón y equipo en el detalle. *Datos FEDB ya importados → solo mostrarlos.*
- ~~**B2. Video por ejercicio.**~~ ✅ **Hecho** (P43, ver Bitácora) — clip representativo por patrón vía `videoUrl` (no embed de YouTube; clips libres de Commons hotlinkeados). Pendiente real: footage propio de los 34 ejercicios de casa y curado fino del top FEDB.
- **B3. Mini-mapa corporal** de músculos trabajados (resalta grupos con primary/secondary de FEDB).
- **B4. Variantes / progresión-regresión** (más fácil ↔ más difícil) por ejercicio.
- **B5. Equipo alternativo** ("sin mancuerna: banda / mochila cargada").

### C. Progreso y motivación
- **C1. Récords personales (PR)** por ejercicio + 1RM estimado.
- **C2. Gráfico de progresión** por ejercicio (carga / volumen / tonelaje en el tiempo).
- **C3. Resumen semanal** ("tu semana en números").
- **C4. Hitos/logros** con mesura (sin gamificación malsana).

### D. Inteligencia / salud (Samsung) — futuro
- **D1. Motor de recomendaciones:** ajustar el entreno según sueño/HRV/recuperación (señales confirmadas en P22). Idealmente Cloud Function.
- **D2. Auto-progresión sugerida** (subir peso/reps la próxima vez).
- **D3. Correlación entreno ↔ FC/recuperación** (habilitada por el match biométrico P23).

### E. Catálogo / calidad de vida
- **E1. Buscador + filtros** (músculo, equipo, "solo lo que puedo en casa con mi equipo").
- **E2. Favoritos.**
- **E3. Crear/editar/reordenar rutinas desde la app** (hoy solo por seed).
- **E4. Recordatorios / notificaciones** (PWA push: OK Android, limitado en iOS).
- **E5. Traducciones FEDB** al castellano (al final, contra el catálogo definitivo).

### F. Familia
- **F1. El owner asigna/edita programas** a los miembros desde la app (hoy por seed).
- **F2. Vista familiar suave** (sesiones de la semana por miembro, respetando visibilidad).

### G. Planificación / periodización
- **G1. Calendario de adherencia** (heatmap mensual tipo "contribuciones").
- **G2. Deload sugerido** automáticamente cada N semanas (ya hay plantilla de deload, PRG-0009).
- **G3. Fases / mesociclos** (volumen → intensidad) en el programa.
- **G4. Planificar la semana** (elegir/arrastrar qué rutina va cada día).

### H. Onboarding / arranque
- **H1. Wizard inicial:** objetivo + equipo disponible + días/semana → sugiere y asigna el programa. *Resuelve de raíz "cuál es mi programa".*
- **H2. Test de calibración** (cuántas flexiones/dominadas) → calibra cargas/regresiones iniciales.
- **H3. Editor de FCmáx / zonas FC** en el perfil.

### I. Seguridad y técnica
- **I1. Calentamiento y enfriamiento guiados** (la rutina ya tiene toggles calentar/enfriar).
- **I2. Banderas de dolor/molestia:** marcar "me duele X" → sugiere regresión o evitar el ejercicio.
- **I3. Reglas de recuperación:** aviso suave si se repite el mismo grupo muscular en días seguidos.
- **I4. Menores (16/17, en crecimiento):** foco en técnica, topes de carga conservadores y alerta si suben rápido.

### J. Ecosistema familiar
- **J1. Integración con Comida Familiar** (app hermana del mismo dueño): cruzar entreno del día con la comida — recordatorio de proteína post-entreno, calorías quemadas vs ingeridas. *Distintivo del ecosistema.*
- **J2. Check-in familiar:** quién entrenó hoy (respetando visibilidad).
- **J3. Reto familiar suave** (X sesiones entre todos esta semana).
- **J4. (Sensible) Adherencia de los hijos visible para el padre** — solo con consentimiento y de forma apropiada a la edad.

### K. Experiencia durante el entreno
- **K1. Modo manos libres:** voz que anuncia "siguiente serie / descanso" + cuenta regresiva hablada (Web Speech API).
- **K2. Pantalla siempre encendida** durante la sesión (Wake Lock API).
- **K3. Modo horizontal** para ver el video del ejercicio.
- **K4. Texto grande / alto contraste** (adultos 50+).

### L. Equipo / gimnasio en casa
- **L1. Inventario de equipo** (mancuernas/discos/banda) → solo sugiere ejercicios posibles y calcula cargas alcanzables.
- **L2. Calculadora de discos:** "para 14 kg en la mancuerna, poné estos discos" (según el kit DeporAr).
- **L3. Seguimiento de VR:** qué juego jugaste, FC/calorías por juego, "tu más quemador" (PSVR2).

### M. Datos / respaldo
- **M1. Exportar el historial** (CSV/JSON) — backup propio.
- **M2. Compartir** una sesión o un PR (imagen/resumen).

### Restricciones a respetar (transversales)
- **Plan Spark (gratis):** cuidar lecturas/escrituras; agregados diarios; nada de alta frecuencia.
- **Imágenes y videos por URL/embed externo** (FEDB dominio público, YouTube embed oficial), **no hosteados** (Storage mínimo).
- **Copyright:** solo embed oficial de YouTube; nunca descargar/hostear video.
- **PWA:** push limitado en iOS.
