# ShapeUp — Mapeo de implementación (bitácora viva)

**Quién lo mantiene:** Claude Code. Al cerrar cada etapa agrega Bitácora + Estado + Mapa del código.
**Regla:** si algo se construyó y no quedó acá, no está hecho.

---

## 1. Estado por etapa

| Etapa | Descripción | Estado | Fecha |
|---|---|---|---|
| E0 | Base ya provista (esquema, lógica, reglas, scaffold) | ✅ | 2026-06 |
| E1 | Auth Google + whitelist + AppShell | ✅ | 2026-06-03 |
| E2 | Catálogo — data + filtros ✅; pantalla UI | 🟦 parcial | 2026-06-03 |
| E3 | Rutinas — data + Biblioteca + crear/editar + cache | ✅ | 2026-06-03 |
| E4 | Entrenar — hook + sesión guiada + descanso | ✅ | 2026-06-04 |
| E5 | Programas + sesiones + historial + visibilidad | ✅ | 2026-06-04 |
| E6 | Salud — CSV Samsung Health + progreso | ✅ | 2026-06-04 |

---

## 2. Bitácora

### [2026-06-04] E1.1 — Fix: tests de auth sin entorno Firebase
- Causa: `resolveMemberId.test.ts` importaba `findMemberByEmail` desde `resolveMemberId.ts`, que importa `db` desde `firebase.ts`, que ejecuta `getAuth(app)` al cargarse → crash en CI sin `.env.local`
- Arreglo: `src/auth/findMemberByEmail.ts` — función pura sin imports de Firebase
- `resolveMemberId.ts` ahora importa desde el nuevo archivo (y re-exporta para compatibilidad)
- Test movido a `src/auth/findMemberByEmail.test.ts` — importa solo el archivo puro
- `resolveMemberId.test.ts` eliminado
- Resultado: 51 tests verdes; `tsc -b` limpio; el test corre sin `.env.local`

---

### [2026-06-04] Seed 07 — Juegos VR (PSVR2)
- `scripts/seed-vr.ts` — 10 juegos PSVR2 como ejercicios de catálogo (modalidad Cardio, equipo VR, patrón "Locomoción / cardio"), IDs EJ-9001…EJ-9010
- Sigue el mismo patrón que seed-config/seed-ejercicios: `--dry-run`, `--force`, firebase-admin
- `npm run seed:vr` agregado a package.json
- Campo extra `poseidoPorOwner: boolean` (ver ADR #007 — no está en el modelo, sólo en Firestore)

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
  styles/tokens.css           ✅
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
  data/
    _helpers.ts               ✅
    ejercicios.ts             ✅  (EJ-XXXX)
    rutinas.ts                ✅  (RUT-XXXX)
    programas.ts              ✅  (PRG-XXXX)
    sesiones.ts               ✅
    historial.ts              ✅  (finalizarSesion con runTransaction)
    visibilidad.ts            ✅
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
    Catalogo.tsx              ✅  (placeholder — E2 UI pendiente)
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
firestore.rules               ✅  desplegadas
firestore.indexes.json        ✅  desplegados
```

---

## 4. Tests (2026-06-04)

| Archivo | Tests |
|---|---|
| auth/findMemberByEmail.test.ts | 4 |
| lib/filtros.test.ts | 9 |
| lib/metricas.test.ts | 11 |
| lib/entrenarState.test.ts | 26 |
| **Total** | **50** |

Pendiente: tests de reglas Firestore con emulador (`@firebase/rules-unit-testing`).

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
