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
| E2 | Catálogo de ejercicios (data + filtros + pantalla) | ⬜ pendiente | | `prompts/02-e2-catalogo.md` |
| E3 | Rutinas (data + biblioteca + crear/editar + cache) | ⬜ pendiente | | `prompts/03-e3-rutinas.md` |
| E4 | Entrenar (hook + pantalla guiada + descanso + registro) | ⬜ pendiente | | `prompts/04-e4-entrenar.md` |
| E5 | Programas + sesiones + historial + visibilidad | ⬜ pendiente | | `prompts/05-e5-programas-sesiones.md` |
| E6 | Salud (CSV Samsung Health + progreso) | ⬜ pendiente | | `prompts/06-e6-salud.md` |

Estados: ⬜ pendiente · 🟦 en curso · ✅ hecho · 🔁 revisado/aprobado.

---

## 2. Bitácora (entradas cronológicas)

### [2026-06-03] E1 — Base y autenticación

- **Archivos creados/modificados:**
  - `package.json` — build: `tsc -b && vite build`; scripts test/test:run/test:ui; deps react-router-dom, lucide-react, vitest, jsdom
  - `tsconfig.json` — convertido a raíz composite (references a tsconfig.app.json + tsconfig.node.json)
  - `tsconfig.app.json` — nuevo; composite, outDir `.tsc-out/app`, incluye `src/`
  - `tsconfig.node.json` — nuevo; composite, incluye `vite.config.ts`
  - `vite.config.ts` — ahora usa `defineConfig` de `vitest/config`; agrega `test.environment: jsdom`, `test.exclude: [".tsc-out/**"]`
  - `.gitignore` — agrega `.tsc-out/`
  - `src/vite-env.d.ts` — triple-slash reference vite/client
  - `src/styles/tokens.css` — design tokens (colores, radio, tipografía)
  - `src/index.css` — reemplazado; importa tokens.css; estilos auth, botones, loading, AppShell, bottom-nav
  - `src/firebase.ts` — `initializeApp` + `initializeFirestore` con caché persistente multi-pestaña + `getAuth`
  - `src/lib/result.ts` — tipo `Result<T>`, helpers `ok`/`err`/`firebaseErrorMessage`
  - `src/lib/canonical.ts` — `normalizeText` (minúsculas + sin acentos)
  - `src/auth/resolveMemberId.ts` — `findMemberByEmail` (pura, testeable) + `resolveMemberId` (lee /config/familia)
  - `src/auth/upsertUserDoc.ts` — crea/actualiza /users/{uid}; `fechaCreacion` solo en primer login
  - `src/auth/AuthContext.ts` — interfaz `AuthState` + contexto React
  - `src/auth/AuthProvider.tsx` — suscribe a `onAuthStateChanged`; resuelve memberId; llama `upsertUserDoc`
  - `src/auth/useAuth.ts` — hook para consumir `AuthContext`
  - `src/auth/LoginScreen.tsx` — botón "Entrar con Google" (`signInWithPopup`)
  - `src/auth/UnauthorizedScreen.tsx` — mensaje + botón `signOut`
  - `src/layout/AppShell.tsx` — `<Outlet>` + nav inferior con 6 ítems (lucide-react)
  - `src/routes/Home.tsx` — placeholder (E5)
  - `src/routes/Biblioteca.tsx` — placeholder (E3)
  - `src/routes/Catalogo.tsx` — placeholder (E2)
  - `src/routes/Entrenar.tsx` — placeholder (E4)
  - `src/routes/Historial.tsx` — placeholder (E5)
  - `src/routes/Perfil.tsx` — muestra nombre/memberId + botón signOut
  - `src/App.tsx` — router (`createBrowserRouter`) + gate auth (loading → login → unauthorized → app)
  - `src/main.tsx` — `<AuthProvider>` envuelve `<App>`
  - `src/auth/resolveMemberId.test.ts` — 4 tests de `findMemberByEmail` (match, multi-mail, case-insensitive, whitelist)

- **Decisiones tomadas:**
  - `createBrowserRouter` definido fuera del componente App (no se recrea en cada render).
  - `upsertUserDoc` es fire-and-forget desde AuthProvider: no bloquea la UI si falla.
  - Para `tsc -b` usamos `outDir: ".tsc-out/"` (gitignoreado) porque `composite: true` es incompatible con `noEmit: true`.
  - Vitest excluye `.tsc-out/**` para que no ejecute los `.test.js` compilados.
  - `findMemberByEmail` se exporta separada para testear la lógica pura sin mockear Firestore.

- **Desviaciones del plan:** ninguna.

- **Tests agregados:**
  - `src/auth/resolveMemberId.test.ts` — cubre: email dentro/fuera de whitelist, múltiples mails por miembro, case-insensitivity.

- **Pendientes / TODO:**
  - Sembrar `/config/familia` con los 4 miembros reales (E1 seed, manual).
  - Estilizar Login y UnauthorizedScreen (Claude Design).
  - PWA (`vite-plugin-pwa`) — queda para después de E2.

- **Cómo probarlo:**
  1. Crear `.env.local` a partir de `.env.example` con las credenciales del proyecto `shapeup-41e74`.
  2. Sembrar `/config/familia` en Firestore con los emails reales.
  3. `npm run dev` → se muestra LoginScreen.
  4. Login con Google con mail autorizado → AppShell con navegación de 6 ítems.
  5. Login con mail NO autorizado → UnauthorizedScreen.
  6. `npm run test:run` → 4 tests verdes.
  7. `npm run build` → `tsc -b && vite build` sin errores.

---

## 3. Mapa del código (se actualiza a medida que crece)

Una línea por archivo relevante. ✅ = existe y andando.

```
src/
  vite-env.d.ts               ✅ triple-slash vite/client
  styles/
    tokens.css                ✅ design tokens (colores, radio, tipografía)
  index.css                   ✅ estilos globales (auth, nav, shell)
  firebase.ts                 ✅ initializeApp + Firestore multi-tab cache + Auth
  types/models.ts             ✅ modelo de dominio (tipos + enums + mapeos FEDB)
  lib/
    result.ts                 ✅ Result<T> + ok/err + firebaseErrorMessage
    canonical.ts              ✅ normalizeText (búsqueda + duplicados)
    entrenarState.ts          ✅ reducer del modo guiado (series + descansos)
    metricas.ts               ✅ duración, volumen, balance, tonelaje, progresión
    filtros.ts                ⬜ (E2)
    elegibilidad.ts           ⬜ (E5)
    recomendaciones.ts        ⬜ (futuro)
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
  routes/
    Home.tsx                  ✅ placeholder (E5)
    Biblioteca.tsx            ✅ placeholder (E3)
    Catalogo.tsx              ✅ placeholder (E2)
    Entrenar.tsx              ✅ placeholder (E4)
    Historial.tsx             ✅ placeholder (E5)
    Perfil.tsx                ✅ nombre + memberId + signOut
  App.tsx                     ✅ router + gate auth
  main.tsx                    ✅ AuthProvider + App
  data/
    ejercicios.ts             ⬜ (E2)
    rutinas.ts                ⬜ (E3)
    programas.ts              ⬜ (E5)
    sesiones.ts               ⬜ (E5)
    historial.ts              ⬜ (E5)
    visibilidad.ts            ⬜ (E5)
    salud.ts                  ⬜ (E6)
    _helpers.ts               ⬜ (E2)
  hooks/useEntrenarState.ts   ⬜ (E4)
  components/                 ⬜ (E2+)
scripts/
  importar-fedb.ts            ✅ importador del catálogo FEDB → modelo (cat. en castellano)
  data/traducciones-fedb.es.json  ✅ traducciones (70 ejercicios, acumulativo)
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
  Alternativas: mock de firebase/firestore en tests.
  Resultado: lógica pura en findMemberByEmail (exportada); resolveMemberId solo llama a Firestore y delega.
```

---

## 5. Convenciones de documentación (para Code)
- Actualizá este archivo al cerrar cada etapa (Bitácora + Estado + Mapa del código).
- Comentá con JSDoc las funciones públicas de `data/` y `lib/`.
- Si un módulo es no trivial, dejá un comentario de cabecera explicando su rol.
- Las decisiones importantes van al §4 (ADR), no enterradas en el código.
- Nada de "ya lo hice" sin entrada acá: la bitácora es la fuente de verdad del avance.
