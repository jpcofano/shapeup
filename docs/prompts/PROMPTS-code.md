# ShapeUp — Prompts para Claude Code (secuencia numerada)

Un prompt por etapa. Pegale a Claude Code **uno a la vez**, en orden, y revisá antes de pasar
al siguiente (cada prompt termina con "pará y esperá mi revisión"). Contexto general en
`docs/BRIEF-para-code.md`, `docs/ARQUITECTURA-shapeup-v2.md` y `docs/FORMA-DE-TRABAJO-comida-familiar.md`.

Ubicación de estos docs en el repo:
```
docs/
  ARQUITECTURA-shapeup-v2.md
  FORMA-DE-TRABAJO-comida-familiar.md
  BRIEF-para-code.md
  MAPEO-IMPLEMENTACION.md          ← bitácora viva que Code mantiene
  prompts/
    01-e1-base.md … 06-e6-salud.md (o este archivo)
```

## Regla permanente (vale para TODOS los prompts)
> Documentá todo lo que hacés. Al cerrar cada etapa, **antes de frenar**, actualizá
> `docs/MAPEO-IMPLEMENTACION.md`: agregá una entrada en la Bitácora (archivos, decisiones,
> desviaciones, tests, cómo probarlo), actualizá la tabla de Estado y el Mapa del código, y
> registrá las decisiones de peso en el §4 (ADR). Si se construyó algo y no quedó en el mapeo,
> se considera no hecho. Comentá con JSDoc las funciones públicas de `data/` y `lib/`.

## Antes de empezar (manual, una vez)
Archivos ya provistos (no rehacer): `src/types/models.ts`, `src/lib/entrenarState.ts`,
`src/lib/metricas.ts`, `firestore.rules`, `firestore.indexes.json`, `firebase.json`,
`.firebaserc`, `.gitignore`, scaffold Vite, `scripts/importar-fedb.ts`,
`scripts/data/traducciones-fedb.es.json`. Descargá `fedb/exercises.json` antes de sembrar.

---

## Prompt 1 — E1 · Base y autenticación
> Repo ShapeUp (Firebase + Vite + React + TS), proyecto `shapeup-41e74`. Ya existen
> `src/types/models.ts`, `src/lib/entrenarState.ts`, `src/lib/metricas.ts`, `firestore.rules`
> e `firestore.indexes.json` (desplegadas), y un scaffold mínimo de Vite. Leé
> `docs/ARQUITECTURA-shapeup-v2.md` y `docs/FORMA-DE-TRABAJO-comida-familiar.md` antes de tocar
> nada. Implementá la Etapa E1: (1) dejá el `build` en `tsc -b && vite build`; (2) `src/firebase.ts`
> con `initializeApp` + `initializeFirestore` con caché persistente multi-pestaña; (3) auth con
> Google: `AuthProvider`, `useAuth`, `resolveMemberId` (cruza el email contra `/config/familia`)
> y `upsertUserDoc` en `/users/{uid}`; (4) `LoginScreen` y `UnauthorizedScreen`; (5) `AppShell`
> con navegación inferior y rutas vacías (Home, Biblioteca, Catálogo, Entrenar, Historial,
> Perfil) con react-router. No reescribas `src/types` ni `src/lib`; usalos. Respetá la dirección
> de dependencias de la forma de trabajo. Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md`
> (bitácora + estado + mapa del código). **Pará y esperá mi revisión.**

## Prompt 2 — E2 · Catálogo de ejercicios
> Etapa E2. Creá `src/lib/filtros.ts` (filtrar ejercicios por región/equipo/modalidad/patrón/
> nivel/búsqueda) con su `.test.ts`, y `src/data/ejercicios.ts` con el patrón de la forma de
> trabajo (caché en memoria, `Result<T>`, `serverTimestamp`, IDs `EJ-XXXX` con regex,
> `nombreCanonico`). Pantalla Catálogo: lista con filtros y buscador; alta/edición solo para el
> owner (las reglas ya lo exigen). El catálogo se siembra con `scripts/importar-fedb.ts`. Al
> terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md`. **Pará y esperá mi revisión.**

## Prompt 3 — E3 · Rutinas
> Etapa E3. `src/data/rutinas.ts` (mismo patrón; IDs `RUT-XXXX`). Pantalla Biblioteca de rutinas
> con filtros. Crear/editar rutina: elegir ejercicios del catálogo y prescribir por modalidad
> usando la unión `Prescripcion` de `models.ts`. Al guardar, corré `calcularCacheRutina` de
> `lib/metricas.ts` y persistí los derivados. Detalle de rutina con duración/series y el aviso de
> balance empuje/tracción. Tests de `metricas` si faltan. Al terminar, actualizá
> `docs/MAPEO-IMPLEMENTACION.md`. **Pará y esperá mi revisión.**

## Prompt 4 — E4 · Entrenar (núcleo)
> Etapa E4, la más importante. `src/hooks/useEntrenarState.ts` que envuelva
> `src/lib/entrenarState.ts` (cargar/persistir en localStorage, descartar descansos vencidos).
> Pantalla Entrenar guiada que muestre en cada momento: ejercicio y serie actual (dots de
> progreso), objetivo de la serie (`objetivoSerieLabel`), y del ejercicio sus `instrucciones`,
> `puntosClave` (banner verde), `erroresComunes` (banner ámbar) y las alternativas. Botón "Serie
> hecha" que registre reps/carga reales y dispare `completarSerie` (arranca el descanso si quedan
> series). Cronómetro de descanso con alarma (patrón de `StepTimer` de la app de comidas) +
> "Saltar" y "+30 s". Modo scroll además del guiado. Tests de `entrenarState`. Al terminar,
> actualizá `docs/MAPEO-IMPLEMENTACION.md`. **Pará y esperá mi revisión.**

## Prompt 5 — E5 · Programas, sesiones, historial y visibilidad
> Etapa E5. `src/data/programas.ts` (IDs `PRG-XXXX`) y `src/data/sesiones.ts` (máquina de estados
> Programada→En curso→Completada→Registrada). `src/data/visibilidad.ts` leyendo
> `/config/visibilidad` (el owner ve todo; los demás solo lo asignado). Home con la sesión de hoy
> ("hoy toca…") derivada del programa activo. Cierre con RPE → escribe `Historial` con `tonelajeKg`
> y `totalSeriesHechas` derivados, usando `runTransaction` (subir `vecesEntrenada`/`vecesUsado`,
> `ultimaVez`, marcar el día del programa). Lista y detalle de Historial. Tests de reglas con el
> emulador (no-miembro bloqueado; solo owner edita catálogo y visibilidad). Al terminar, actualizá
> `docs/MAPEO-IMPLEMENTACION.md`. **Pará y esperá mi revisión.**

## Prompt 6 — E6 · Salud (módulo)
> Etapa E6. `src/data/salud.ts` con `MedicionCorporal` y `SesionCardio`. Importación por CSV de
> Samsung Health: subir el archivo, parsearlo y mapear a los tipos; carga manual como respaldo.
> Pantalla de progreso (peso, grasa, tonelaje en el tiempo). El motor de recomendaciones queda
> para una etapa futura (diseñado en §8 del arquitectura). Al terminar, actualizá
> `docs/MAPEO-IMPLEMENTACION.md`. **Pará y esperá mi revisión.**

---

### Notas
- Un prompt por vez; revisá y recién ahí seguís. Si Code se desvía, corregí antes de avanzar.
- El avance real se sigue en `docs/MAPEO-IMPLEMENTACION.md` (lo mantiene Code).
- Rutinas reales (Fuerza A/B/C + VR) y el Programa de 5 días: los armamos en el chat de
  arquitectura y se siembran aparte.
