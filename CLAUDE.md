# CLAUDE.md — ShapeUp

Memoria de proyecto para Claude Code. Leé esto antes de cualquier cambio.
Fuentes ampliadas: `docs/ESTADO-DEL-PROYECTO.md` (estado), `docs/MAPEO-IMPLEMENTACION.md`
(mapa técnico), `docs/SAMSUNG-HEALTH-MAPEO.md` (spec del export), `docs/SEEDS.md`.

## Qué es
App de entrenamiento familiar (4 miembros, owner juanpablo). React + TypeScript + Vite +
Firebase (Firestore, plan Spark, `southamerica-east1`). PWA en camino. Idioma: castellano
argentino, voseo. Tokens de diseño siempre (`src/styles/tokens.css`).

## Reglas de trabajo (no re-discutir)
- Funciones puras separadas de Firebase (ADR #009): la lógica va en `src/lib/`, testeable
  sin emulador; `src/data/` solo orquesta Firestore.
- Las transacciones de cierre escriben SOLO documentos del propio miembro (ADR #014);
  contadores derivables no se actualizan en caliente.
- Métricas de salud con granularidad diaria, no crudas (ADR #016, costo Spark).
- IDs con rangos reservados (ADR #010). Result<T> en toda la capa de datos.
- Antes de dar por terminado un prompt: `npx tsc -b` limpio + `npx vitest run` verde
  (la suite `firestore.rules.test.ts` requiere emulador; sin emulador se permite skip).

## Serie S — Integración de salud (plan vigente)

Objetivo del owner: **no importar todo indiscriminadamente**; matchear los entrenamientos
hechos en la app con los datos de salud, enriquecer el historial y las rutinas analizando
esos datos, y simplificar la pantalla de Salud para mostrar solo lo relevante.

### S1 — Enriquecimiento post-import (la última milla del match) ✅ completo (P46+P47, 2026-07-04)
1. ✅ `data/historial.ts`: `enriquecerHistorial(idHist, biometria, bloques?)` — updateDoc simple.
2. ✅ `lib/enriquecerImport.ts`: núcleo puro. `ventanaDeHistorial`, `calcularEnriquecimiento`,
   `enriquecerTrasImport`. 16 tests. No muta entrada, no duplica datauuid.
3. ✅ `Salud.tsx` → `confirmarImport`: si `sesionesSamsung.length > 0` corre enriquecimiento
   y muestra resumen "X matcheadas (Y por custom-id, Z por ventana)". Fallo no cancela import.
4. ✅ `finalizarSesion`: guarda `inicioMs`/`finMs` desde `ventanaDeBloques` (ADR #019).
5. ✅ **Import selectivo (ADR #020) — P47**: `lib/importSelectivo.ts` puro. Reglas:
   "shapeup" → "historial" → "vr" → "actividad". Toggle opt-in en preview (ZIP + CSV).
   `ACTIVIDADES_SIEMPRE_RELEVANTES` exportada y editable. 19 tests.

**Flujo de prueba de S1 (P48):**
`npm run limpiar:salud -- --miembro=juanpablo --confirmar [--limpiar-biometria]`
→ importar ZIP real nivel biométrico → validar resumen de matcheo en la UI.
`scripts/limpiar-salud.ts`: depura solo salud; nunca toca historial/sesiones/rutinas.

### S2 — Salud: mostrar lo relevante ✅ completo (P49, 2026-07-04)
1. ✅ `lib/resumenSalud.ts`: `calcularResumenSalud` + `senalPeor`. 36 tests.
   **Umbrales exportados aquí** — S3 los importa (fuente única de verdad).
2. ✅ Tab `"resumen"` como default en `/salud`: cards con sparkline 14d, flecha de
   tendencia, semáforo (tokens), motivo explicable, tap navega a tab de detalle.
3. ✅ `HistorialDetalle`: bloque "Contexto del día" (sueño noche anterior + FC en reposo).
4. ✅ `CardioTab`: badge "vinculada a entrenamiento" + vinculadas ordenadas primero.
5. ✅ Refactor: `ComposicionTab`, `CardioTab`, `SuenoTab`, `ProgresoTab`, `ImportPanel`
   en `src/components/salud/`. `Salud.tsx` → contenedor delgado con estado compartido.

### S3 — Motor de recomendaciones + rutinas nuevas
1. `lib/recomendaciones.ts` **puro**: reglas de umbral "métrica de hoy vs mediana 28 días"
   que devuelven `TipoRecomendacion` (los tipos ya existen en `models.ts`) + rutina
   sugerida. Sin ML, umbrales configurables. Ejemplos de reglas iniciales:
   - sueño < 6h o HRV < baseline·0.85 dos noches seguidas → "Día de descanso" o
     "Bajar intensidad" → rutina Descarga activa;
   - FC reposo > baseline + 5 bpm sostenido → "Sumar cardio Z2" → rutina Z2 base;
   - 4+ semanas de carga sin deload → "Deload" → PRG-0009;
   - todo en verde → "Felicitación" / habilitar HIIT corto.
2. Tarjeta de recomendación en Home ("Dormiste 5 h — hoy te sugiero Descarga activa").
   Descartable; nunca bloquea entrenar lo planificado.
3. Seeds de 3 rutinas nuevas (`scripts/seed-salud-rutinas.ts`), rango RUT-0023..0025:
   - **RUT-0023 Cardio Z2 base** (30–40 min, guiada por `zonasFC` del perfil);
   - **RUT-0024 HIIT corto** (~20 min intervalos; para días de buena recuperación);
   - **RUT-0025 Descarga activa** (movilidad + caminata Z1, ~25 min).
4. Client-side por ahora; migrar a Cloud Function queda para cuando salga del plan Spark.

### S4 — (futuro, no arrancar sin OK del owner)
Ver "Roadmap" abajo.

## ADRs de la serie S
- **ADR #019** — `Historial.inicioMs/finMs` a nivel sesión, sellados en `finalizarSesion`
  desde las series. Motivo: el match por ventana no debe depender de recalcular.
- **ADR #020** ✅ — Import selectivo por defecto: solo cardio que matchea historial o
  actividades conocidas; "importar todo" es opt-in. Motivo: pedido explícito del owner
  ("no se trata de importar todo") + costo Spark. Implementado en P47.
- **ADR #021** — El enriquecimiento biométrico es **post-hoc e idempotente**: re-importar
  el mismo ZIP no duplica ni pisa biometría con datos peores (si el Historial ya tiene
  `granularidad: "serie"`, no se degrada a "sesion").
- **ADR #022** — Recomendaciones client-side, puras y explicables: cada recomendación
  muestra su porqué ("FC reposo +6 bpm vs tus últimas 4 semanas"). Nada de caja negra.

## Roadmap (ideas evaluadas, orden tentativo)
Corto plazo (después de S1–S3):
- **Progresión automática de cargas**: sugerir peso/reps de la próxima sesión por doble
  progresión, leyendo reps/RIR del historial del ejercicio.
- **Costo cardíaco por rutina**: misma rutina, tendencia de FC media/kcal a lo largo de
  las semanas → mejora aeróbica visible en `RutinaDetalle`.
- **PRs y logros**: récords personales por ejercicio (carga, reps, tonelaje) + hitos
  familiares livianos. Motivación para los 4 miembros.
- **Panel familiar de adherencia** (solo owner): sesiones hechas vs planificadas por
  miembro por semana; respeta visibilidad existente.

Mediano plazo:
- **Correlaciones simples en Salud**: sueño vs RPE, kcal vs tendencia de peso semanal.
- **Backup/export CSV** de historial y mediciones (plan Spark, resguardo de datos).
- **PWA completa**: offline con cola de escrituras (entrenar sin señal en el gimnasio) +
  notificaciones de "hoy toca X".

Largo plazo (registrado, sin compromiso):
- Sync de salud verdaderamente automático (Health Connect vía cascarón nativo
  Capacitor/TWA) — scope grande, decisión a futuro.
- Al cerrar el proyecto: purga del historial de git (mails de menores) → repo privado
  (ADR #015).
