# Brief para Claude Code — construir la app ShapeUp

Este documento le dice a Claude Code qué construir y sobre qué base. Abrí Claude Code en la
carpeta del repo (`shapeup`) y usalo como contexto (o pegá el prompt del final).

## Contexto
App de entrenamiento (Firebase + React + Vite + TypeScript), calcada en su forma de trabajo
de "Comida Familiar" pero construida de cero. El **esquema** y la **inteligencia** ya están
hechos y type-checkeados; **Claude Code construye la UI, las rutas y la capa de datos**;
Claude Design pule después.

## Qué YA está en el repo (no rehacer)
- `src/types/models.ts` — modelo de dominio completo (tipos + enums + mapeos FEDB). Fuente de verdad.
- `src/lib/entrenarState.ts` — reducer puro del modo guiado "Entrenar" (series + descansos).
- `src/lib/metricas.ts` — duración, volumen, balance, tonelaje, progresión.
- `firestore.rules` + `firestore.indexes.json` — desplegados en `shapeup-41e74`.
- `firebase.json`, `.firebaserc`, `.gitignore` — configurados.
- Scaffold mínimo Vite + React + TS (placeholder) que ya buildea y deploya.
- `scripts/importar-fedb.ts` + `scripts/data/traducciones-fedb.es.json` — importador del
  catálogo (873 ejercicios de Free Exercise DB con categorías en castellano + traducciones por lote).
- Documentos guía: `ARQUITECTURA-shapeup-v2.md` (qué construir) y
  `FORMA-DE-TRABAJO-comida-familiar.md` (cómo construirlo).

## Qué construir (seguí `ARQUITECTURA-shapeup-v2.md`, por etapas)
- **E1 — Base:** auth con Google + whitelist (`resolveMemberId` contra `/config/familia`),
  `AppShell` + navegación, `src/firebase.ts` con `initializeFirestore` + caché.
- **E2 — Catálogo:** `data/ejercicios.ts` (patrón de `FORMA-DE-TRABAJO` §2) + pantalla de
  catálogo con filtros; alta de ejercicios solo para el owner.
- **E3 — Rutinas:** `data/rutinas.ts` + Biblioteca + crear/editar rutina (prescripción por
  modalidad) + `calcularCacheRutina` al guardar + detalle con balance.
- **E4 — Entrenar (núcleo):** `hooks/useEntrenarState` envolviendo `lib/entrenarState.ts` +
  pantalla guiada (qué hacer en cada momento, cronómetro de descanso, alternativas) + modo scroll.
- **E5 — Programas + Sesiones + Historial:** `data/programas.ts`, `data/sesiones.ts`
  (máquina de estados), Home con "hoy toca…", cierre con RPE → `Historial` (tonelaje) + visibilidad.
- **E6 — Salud (módulo aparte):** `data/salud.ts` + importación por CSV (Samsung Health) +
  pantalla de progreso. El motor de recomendaciones queda para después (diseñado en §8 del arquitectura).

## Reglas de construcción (de `FORMA-DE-TRABAJO`)
- Dependencias: `lib (puro)` ← `data (Firestore)` ← `hooks` ← `components/routes`.
- Capa de datos: caché en memoria + `Result<T>` + `serverTimestamp()` + IDs `EJ/RUT/PRG-XXXX`
  + `nombreCanonico` + `runTransaction` para el cierre de sesión.
- Contrato de actualización (arquitectura §6): cada acción actualiza contadores/timestamps/cachés/progreso.
- Tests desde el día 1: `entrenarState`, `metricas` y reglas (con emulador).
- Un componente por cosa, sin sufijos `V2`. Nada de conceptos del dominio de comida.
- `build` real: volver a `tsc -b && vite build` (el scaffold tiene solo `vite build`).

## Seeds (cuando haya UI)
1. `config/familia` (4 miembros + mails reales + owner `juanpablo`), `config/diccionarios`,
   `config/metodologia`, `config/perfiles`, `config/visibilidad`.
2. Catálogo: `npx tsx scripts/importar-fedb.ts` → genera el catálogo (categorías en castellano;
   nombres/instrucciones traducidos para los que ya están en el diccionario, el resto `pendiente`).
3. Rutinas (Fuerza A/B/C + VR) y el Programa de 5 días — los armamos en el chat de arquitectura.

## Prompt para pegarle a Claude Code
> "Este repo tiene el esquema (`src/types/models.ts`), la lógica pura
> (`src/lib/entrenarState.ts`, `src/lib/metricas.ts`), las reglas de Firestore y un scaffold
> mínimo de Vite+React+TS. Construí la app siguiendo `ARQUITECTURA-shapeup-v2.md` y respetando
> las convenciones de `FORMA-DE-TRABAJO-comida-familiar.md`. Empezá por la Etapa E1 (auth con
> Google + whitelist, AppShell, firebase.ts) y frená para que revise antes de seguir con E2.
> No reescribas los archivos que ya existen en `src/types` y `src/lib`; usalos."
