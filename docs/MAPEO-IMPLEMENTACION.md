# ShapeUp — Mapeo de implementación (bitácora viva)

**Qué es:** el registro de lo que Claude Code va construyendo. A diferencia de
`ARQUITECTURA-shapeup-v2.md` (el diseño: *qué* construir) y `prompts/` (los *pedidos*), este
documento es el *historial de ejecución*: qué se hizo, qué se decidió y en qué estado está.

**Quién lo mantiene:** Claude Code. **Cuándo:** al cerrar cada etapa o tarea, antes de frenar
para revisión, Code agrega una entrada en la Bitácora, actualiza la tabla de Estado y el Mapa
del código. **Regla:** si algo se construyó y no quedó acá, no está hecho.

---

## 1. Estado por etapa

| Etapa | Descripción | Estado | Fecha | Prompt |
|---|---|---|---|---|
| E0 | Base ya provista (esquema, lógica, reglas, scaffold) | ✅ hecho | 2026-06 | — |
| E1 | Base + autenticación (Google + whitelist + AppShell) | ✅ hecho | 2026-06-03 | `prompts/01-e1-base.md` |
| E2 | Catálogo de ejercicios (data + filtros + pantalla) | 🟦 parcial | 2026-06-03 | `prompts/02-e2-catalogo.md` |
| E3 | Rutinas (data + biblioteca + crear/editar + cache) | ✅ hecho | 2026-06-03 | `prompts/03-e3-rutinas.md` |
| E4 | Entrenar (hook + pantalla guiada + descanso + registro) | ⬜ pendiente | | `prompts/04-e4-entrenar.md` |
| E5 | Programas + sesiones + historial + visibilidad | ⬜ pendiente | | `prompts/05-e5-programas-sesiones.md` |
| E6 | Salud (CSV Samsung Health + progreso) | ⬜ pendiente | | `prompts/06-e6-salud.md` |

Estados: ⬜ pendiente · 🟦 en curso · ✅ hecho · 🔁 revisado/aprobado.

---

## 2. Bitácora (entradas cronológicas)

### [2026-06-03] E3 — Rutinas (incluye fundamentos de E2)

- **Archivos creados/modificados:**
  - `src/lib/canonical.ts` — fix regex diacríticos a unicode escape `[̀-ͯ]`
  - `src/data/_helpers.ts` — `proximoId(colPath, prefix)` para IDs secuenciales
  - `src/data/ejercicios.ts` — CRUD + caché (Map) para /ejercicios; `getEjerciciosMap()` para calcularCacheRutina
  - `src/data/rutinas.ts` — CRUD + caché para /rutinas; `crearRutina`/`actualizarRutina` corren `calcularCacheRutina` automáticamente
  - `src/lib/filtros.ts` — `filtrarEjercicios` (por búsqueda, modalidad, región, equipo, nivel, patrón) — pura, testeable
  - `src/lib/filtros.test.ts` — 9 tests (sin filtros, por modalidad, nivel, equipo, grupo primario/secundario, región, búsqueda, sinónimo, AND)
  - `src/lib/metricas.test.ts` — 11 tests (duracionBloqueSeg ×5 modalidades, estimarDuracionMin, tonelajeKg, totalSeriesHechas, sugerirProgresionFuerza ×2)
  - `src/lib/parseRango.ts` — `parseRango("8-12")` → `RangoNumerico`; `formatRango` de vuelta a string
  - `src/lib/prescripcionLabel.ts` — resumen legible de una Prescripcion para listas/cards
  - `src/components/rutina/PrescripcionForm.tsx` — formulario inline por modalidad (Fuerza/Cardio/Movilidad/Isométrico)
  - `src/components/rutina/ExercisePicker.tsx` — bottom-sheet para buscar/seleccionar ejercicio del catálogo
  - `src/components/rutina/BloqueFormItem.tsx` — fila de bloque expandible (prescripción + reordenar + eliminar)
  - `src/routes/Biblioteca.tsx` — reemplaza placeholder; lista con filtros foco/nivel/lugar + FAB crear
  - `src/routes/RutinaDetalle.tsx` — detalle de rutina: stats, aviso de balance empuje/tracción, bloques con prescripción
  - `src/routes/RutinaForm.tsx` — crear/editar: datos básicos + picker de ejercicios + prescripción por bloque + calcularCacheRutina al guardar
  - `src/App.tsx` — agrega rutas `/biblioteca/nueva`, `/biblioteca/:id`, `/biblioteca/:id/editar`
  - `src/index.css` — +250 líneas de estilos (cards, filtros, bloques, formulario, modal, FAB, aviso)

- **Decisiones tomadas:**
  - E2 (pantalla Catálogo) se omitió por pedido; se implementaron sus fundamentos de datos (`ejercicios.ts`, `filtros.ts`) ya que E3 los requiere.
  - `calcularCacheRutina` se corre siempre en `crearRutina`/`actualizarRutina`, nunca a mano.
  - `ExercisePicker` carga el catálogo con `getEjercicios()` (caché en memoria → 0 lecturas Firestore en aperturas subsiguientes).
  - `prescripcionLabel` exportada en `lib/` (no en component) para ser reutilizable en E4.
  - Rutas `/biblioteca/nueva` definidas ANTES de `/biblioteca/:id` para que el router no las confunda.

- **Desviaciones del plan:**
  - Pantalla Catálogo (E2 UI) no implementada — solo la capa de datos. Queda pendiente.

- **Tests agregados:**
  - `src/lib/filtros.test.ts` — 9 tests
  - `src/lib/metricas.test.ts` — 11 tests
  - Total acumulado: 25 tests verdes (3 archivos)

- **Pendientes / TODO:**
  - Pantalla Catálogo con alta/edición de ejercicios (E2 UI).
  - PWA (`vite-plugin-pwa`).

- **Cómo probarlo:**
  1. `npm run dev` → login → ir a "Rutinas".
  2. Crear una rutina nueva con el FAB (+).
  3. Agregar ejercicios con el picker, ajustar prescripciones.
  4. Guardar → aparece en la lista y en el detalle.
  5. `npm run test:run` → 25 tests verdes.
  6. `npm run build` → sin errores.

---

### [2026-06-03] E1 — Base y autenticación

- **Archivos creados/modificados:**
  - `package.json` — build: `tsc -b && vite build`; scripts test/test:run/test:ui; deps react-router-dom, lucide-react, vitest, jsdom
  - `tsconfig.json` — convertido a raíz composite (references a tsconfig.app.json + tsconfig.node.json)
  - `tsconfig.app.json` — nuevo; composite, outDir `.tsc-out/app`, incluye `src/`
  - `tsconfig.node.json` — nuevo; composite, incluye `vite.config.ts`
  - `vite.config.ts` — usa `defineConfig` de `vitest/config`; agrega `test.environment: jsdom`, `test.exclude: [".tsc-out/**"]`
  - `.gitignore` — agrega `.tsc-out/`
  - `src/vite-env.d.ts` — triple-slash reference vite/client
  - `src/styles/tokens.css` — design tokens (colores, radio, tipografía)
  - `src/index.css` — reemplazado; importa tokens.css; estilos auth, botones, loading, AppShell, bottom-nav
  - `src/firebase.ts` — `initializeApp` + `initializeFirestore` con caché persistente multi-pestaña + `getAuth`
  - `src/lib/result.ts` — tipo `Result<T>`, helpers `ok`/`err`/`firebaseErrorMessage`
  - `src/lib/canonical.ts` — `normalizeText` (minúsculas + sin acentos)
  - `src/auth/resolveMemberId.ts` — `findMemberByEmail` (pura) + `resolveMemberId` (lee /config/familia)
  - `src/auth/upsertUserDoc.ts` — crea/actualiza /users/{uid}; `fechaCreacion` solo en primer login
  - `src/auth/AuthContext.ts` — interfaz `AuthState` + contexto React
  - `src/auth/AuthProvider.tsx` — suscribe a `onAuthStateChanged`; resuelve memberId; llama `upsertUserDoc`
  - `src/auth/useAuth.ts` — hook para consumir `AuthContext`
  - `src/auth/LoginScreen.tsx` — botón "Entrar con Google" (`signInWithPopup`)
  - `src/auth/UnauthorizedScreen.tsx` — mensaje + botón `signOut`
  - `src/layout/AppShell.tsx` — `<Outlet>` + nav inferior con 6 ítems (lucide-react)
  - `src/routes/Home.tsx` — placeholder (E5)
  - `src/routes/Biblioteca.tsx` — placeholder → reemplazado en E3
  - `src/routes/Catalogo.tsx` — placeholder (E2)
  - `src/routes/Entrenar.tsx` — placeholder (E4)
  - `src/routes/Historial.tsx` — placeholder (E5)
  - `src/routes/Perfil.tsx` — muestra nombre + memberId + signOut
  - `src/App.tsx` — router + gate auth
  - `src/main.tsx` — `<AuthProvider>` envuelve `<App>`
  - `src/auth/resolveMemberId.test.ts` — 4 tests de `findMemberByEmail`

- **Decisiones tomadas:**
  - `createBrowserRouter` definido fuera del componente App (no se recrea en cada render).
  - `upsertUserDoc` es fire-and-forget desde AuthProvider.
  - Para `tsc -b` usamos `outDir: ".tsc-out/"` (gitignoreado) porque `composite: true` es incompatible con `noEmit: true`.
  - Vitest excluye `.tsc-out/**` para que no ejecute los `.test.js` compilados.
  - `findMemberByEmail` se exporta separada para testear la lógica pura sin mockear Firestore.

- **Desviaciones del plan:** ninguna.

- **Tests agregados:** `src/auth/resolveMemberId.test.ts` — 4 tests.

- **Cómo probarlo:**
  1. Crear `.env.local` a partir de `.env.example` con las credenciales del proyecto `shapeup-41e74`.
  2. Sembrar `/config/familia` en Firestore con los emails reales.
  3. `npm run dev` → se muestra LoginScreen.
  4. Login con Google con mail autorizado → AppShell con navegación de 6 ítems.
  5. Login con mail NO autorizado → UnauthorizedScreen.

---

## 3. Mapa del código (se actualiza a medida que crece)

```
src/
  vite-env.d.ts               ✅ triple-slash vite/client
  styles/
    tokens.css                ✅ design tokens (colores, radio, tipografía)
  index.css                   ✅ estilos globales (auth, nav, shell, rutinas)
  firebase.ts                 ✅ initializeApp + Firestore multi-tab cache + Auth
  types/models.ts             ✅ modelo de dominio (tipos + enums + mapeos FEDB)
  lib/
    result.ts                 ✅ Result<T> + ok/err + firebaseErrorMessage
    canonical.ts              ✅ normalizeText
    entrenarState.ts          ✅ reducer del modo guiado (series + descansos)
    metricas.ts               ✅ duración, volumen, balance, tonelaje, progresión
    metricas.test.ts          ✅ 11 tests
    filtros.ts                ✅ filtrarEjercicios (por búsqueda/modalidad/región/equipo/nivel/patrón)
    filtros.test.ts           ✅ 9 tests
    parseRango.ts             ✅ parseRango("8-12") → RangoNumerico
    prescripcionLabel.ts      ✅ resumen legible de Prescripcion
    elegibilidad.ts           ⬜ (E5)
    recomendaciones.ts        ⬜ (futuro)
  data/
    _helpers.ts               ✅ proximoId
    ejercicios.ts             ✅ CRUD + caché /ejercicios (EJ-XXXX)
    rutinas.ts                ✅ CRUD + caché /rutinas (RUT-XXXX) + calcularCacheRutina
    programas.ts              ⬜ (E5)
    sesiones.ts               ⬜ (E5)
    historial.ts              ⬜ (E5)
    visibilidad.ts            ⬜ (E5)
    salud.ts                  ⬜ (E6)
  auth/
    AuthContext.ts            ✅ AuthState + contexto
    AuthProvider.tsx          ✅ onAuthStateChanged → resolveMemberId → upsertUserDoc
    useAuth.ts                ✅ hook
    LoginScreen.tsx           ✅ Google signInWithPopup
    UnauthorizedScreen.tsx    ✅ email no en whitelist
    resolveMemberId.ts        ✅ cruza email contra /config/familia
    resolveMemberId.test.ts   ✅ 4 tests
    upsertUserDoc.ts          ✅ crea/actualiza /users/{uid}
  layout/
    AppShell.tsx              ✅ Outlet + bottom nav (6 rutas)
  components/
    rutina/
      PrescripcionForm.tsx    ✅ formulario inline por modalidad
      ExercisePicker.tsx      ✅ bottom-sheet buscar/seleccionar ejercicio
      BloqueFormItem.tsx      ✅ fila de bloque expandible
    entrenar/                 ⬜ (E4)
    skeletons/                ⬜ (E2+)
  hooks/
    useEntrenarState.ts       ⬜ (E4)
  routes/
    Home.tsx                  ✅ placeholder (E5)
    Biblioteca.tsx            ✅ lista con filtros foco/nivel/lugar + FAB
    RutinaDetalle.tsx         ✅ stats + aviso balance + bloques
    RutinaForm.tsx            ✅ crear/editar + picker + prescripción + calcularCacheRutina
    Catalogo.tsx              ✅ placeholder (E2 UI pendiente)
    Entrenar.tsx              ✅ placeholder (E4)
    Historial.tsx             ✅ placeholder (E5)
    Perfil.tsx                ✅ nombre + memberId + signOut
  App.tsx                     ✅ router + gate auth + rutas rutinas
  main.tsx                    ✅ AuthProvider + App
scripts/
  importar-fedb.ts            ✅ importador FEDB → modelo
  data/traducciones-fedb.es.json ✅ traducciones (70 ejercicios)
firestore.rules               ✅ desplegadas
firestore.indexes.json        ✅ desplegados
```

---

## 4. Registro de decisiones (ADR liviano)

```
#001 [2026-06-03] tsc -b con outDir en .tsc-out/
  Contexto: composite: true es incompatible con noEmit: true en TypeScript 5.x.
  Alternativas: (a) tsc --noEmit && vite build; (b) outDir en node_modules/.tmp (rechazado por tsc).
  Resultado: outDir: ".tsc-out/" (gitignoreado). Vitest excluye .tsc-out/** para evitar duplicar tests.

#002 [2026-06-03] findMemberByEmail exportada separada
  Contexto: resolveMemberId hace I/O a Firestore; queremos tests unitarios sin mockear Firebase.
  Resultado: lógica pura en findMemberByEmail (exportada); resolveMemberId solo llama Firestore y delega.

#003 [2026-06-03] E2 UI omitida en E3
  Contexto: usuario pidió saltar a E3 directamente.
  Resultado: se implementaron data/ejercicios.ts y lib/filtros.ts como fundamentos necesarios para E3.
  La pantalla Catálogo (alta/edición de ejercicios) queda pendiente para cuando se pida E2.

#004 [2026-06-03] prescripcionLabel en lib/, no en components/
  Contexto: E4 (pantalla Entrenar) también necesita mostrar prescripciones.
  Resultado: helper puro en lib/ reutilizable desde cualquier capa.
```

---

## 5. Convenciones de documentación (para Code)
- Actualizá este archivo al cerrar cada etapa (Bitácora + Estado + Mapa del código).
- Comentá con JSDoc las funciones públicas de `data/` y `lib/`.
- Si un módulo es no trivial, dejá un comentario de cabecera explicando su rol.
- Las decisiones importantes van al §4 (ADR), no enterradas en el código.
- Nada de "ya lo hice" sin entrada acá: la bitácora es la fuente de verdad del avance.
