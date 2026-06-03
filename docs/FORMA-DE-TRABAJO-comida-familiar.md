# Forma de trabajo — base: Comida Familiar (para construir ShapeUp)

Este documento captura **cómo está hecha** la app de Comida Familiar (convenciones,
patrones, disciplina de testing) para que ShapeUp se construya **igual de bien pero de
cero**. No portamos el código directo: lo usamos como molde y evitamos arrastrar errores o
restos de iteraciones viejas. Todo lo que se describe acá existe y se puede consultar en el
repo de comida.

---

## 1. Arquitectura de carpetas (una responsabilidad por capa)

```
src/
  types/        models.ts  ← ÚNICA fuente de verdad del dominio (tipos + enums)
  data/         una módulo por colección (recetas, ingredientes, planes, …) + _helpers + tests
  lib/          lógica PURA (sin Firestore, sin React) + un .test.ts al lado de cada uno
  hooks/        hooks de estado reutilizables
  auth/         AuthProvider, useAuth, resolveMemberId, upsertUserDoc, Login/Unauthorized
  components/   presentacionales, agrupados por feature (cocinar/, receta/, historial/, skeletons/)
  routes/       una pantalla por archivo
  layout/       AppShell, navegación
  contexts/     contextos transversales (perfiles, etc.)
  styles/       tokens.css (design tokens) + estilos globales
  import/        importadores (pegado/parseo de datos externos)
scripts/        seeds y migraciones (tsx + firebase-admin), numerados por etapa
```

**Regla de oro:** la dependencia va en una sola dirección →
`lib (puro)` ← `data (Firestore)` ← `hooks` ← `components/routes`. `lib` nunca importa de
`data` ni de React. Esto es lo que hace la lógica testeable sin mocks pesados.

Para ShapeUp el espejo es directo: `data/{ejercicios,rutinas,programas,sesiones,historial,salud}.ts`,
`lib/{entrenarState,metricas,filtros,elegibilidad,recomendaciones}.ts`, `hooks/useEntrenarState.ts`,
`components/{entrenar,rutina,historial,skeletons}/`, `routes/{Home,Biblioteca,Catalogo,Entrenar,Sesiones,Historial,Perfil}.tsx`.

---

## 2. Capa de datos — el patrón que se repite en cada `data/*.ts`

Cada módulo de colección sigue el mismo molde (ver `data/recetas.ts`, `ingredientes.ts`,
`planes.ts`):

- **Caché en memoria**: se lee Firestore una vez y se guarda en un `Map`/array module-level;
  las lecturas siguientes salen de caché y se invalida al escribir. Menos lecturas, UI rápida.
- **Tipo `Result<T>`** (`lib/result.ts`): las funciones devuelven `{ ok: true, value }` o
  `{ ok: false, error }` en vez de lanzar excepciones. El error se arma con
  `firebaseErrorMessage()` de `data/_helpers.ts`. **Nada de `throw` cruzando capas.**
- **`serverTimestamp()`** para `fechaCreacion` / `ultimaModificacion` (nunca fecha del cliente).
- **IDs legibles y secuenciales**: `proximoIdReceta()` busca el máximo existente con regex
  `^REC-\d{4}$` y devuelve el siguiente (`REC-0001`). En ShapeUp: `EJ-`, `RUT-`, `PRG-`.
- **`nombreCanonico = normalizeText(nombre)`** (`lib/canonical.ts`): minúsculas sin acentos,
  para búsqueda y para **detectar duplicados** antes de crear.
- **Cierre atómico con `runTransaction`**: las operaciones que tocan varios documentos a la
  vez (ej. cerrar una evaluación + actualizar contadores) usan transacción + `increment()`.
  En ShapeUp es el "finalizar sesión" → escribe Historial + sube `vecesEntrenada`/`vecesUsado`.

---

## 3. Autenticación (whitelist familiar)

- `auth/resolveMemberId.ts`: resuelve el `memberId` cruzando el email logueado contra
  `/config/familia`. `useAuth()` expone usuario + member + estado.
- `AuthProvider.tsx` envuelve la app; `LoginScreen` (login con Google) y
  `UnauthorizedScreen` (si el mail no está en la whitelist).
- `upsertUserDoc.ts`: crea/actualiza `/users/{uid}` en cada login.
- La **seguridad real está en las reglas de Firestore** (la whitelist), no en el cliente.

---

## 4. Lógica pura en `lib/` + tests al lado

- Cada pieza de inteligencia es una función pura en `lib/` con su `*.test.ts` **al lado**
  (`filtros.ts` + `filtros.test.ts`, `elegibilidad.ts` + `.test.ts`, `macros.ts` + `.test.ts`,
  `canonical.ts` + `.test.ts`, `result.ts` + `.test.ts`, etc.).
- Esto permite testear reglas de negocio (elegibilidad, filtros, derivados nutricionales)
  sin tocar Firestore ni el navegador.
- ShapeUp ya trae `entrenarState.ts` y `metricas.ts` con esta forma; faltan sus tests y
  `filtros.ts`/`elegibilidad.ts`/`recomendaciones.ts`.

---

## 5. Hooks de estado + persistencia

- Flujos con estado (el modo "Cocinar") viven en un hook (`useCocinarState`) que envuelve un
  reducer y **persiste en `localStorage`**, descartando timers vencidos al montar.
- ShapeUp: `useEntrenarState(sessionKey)` envuelve el reducer puro `lib/entrenarState.ts` con
  la misma idea (cargar, persistir, descartar descansos vencidos), y opcionalmente espeja el
  progreso a Firestore para reanudar en otro dispositivo.

---

## 6. Cachés derivados (recalcular al escribir, nunca a mano)

- Los valores derivados (en comida: macros/tiempos de la receta) **se recalculan en el
  momento de guardar** y se cachean en el documento. Nunca se editan a mano.
- ShapeUp: `calcularCacheRutina()` (duración estimada, total de series, equipo necesario) se
  corre antes de persistir una rutina. Ver el "contrato de actualización" en
  `ARQUITECTURA-shapeup-v2.md` §6.

---

## 7. Disciplina de testing (esto es lo que más conviene copiar)

- **Vitest** para unidad (`npm run test`, `test:run`, `test:ui`).
- **Tests de reglas de Firestore** con `@firebase/rules-unit-testing` corriendo contra el
  **emulador** (`npm run test:rules` → `firebase emulators:exec --only firestore …`).
- `npm run test:all` = unidad + reglas. Es la red de seguridad que permite reescribir sin
  romper.
- Para ShapeUp conviene arrancar con tests de: `entrenarState` (transiciones del modo
  guiado), `metricas` (duración/tonelaje/progresión), y reglas (que un no-miembro no pueda
  leer/escribir, que solo el owner edite el catálogo).

---

## 8. Seeds y migraciones (scripts con `tsx` + `firebase-admin`)

- `scripts/` con `firebase-admin` y una *service account*; cada tarea es un script corrible
  por npm (`seed:firestore`, `bootstrap:config`, `reseed`, etc.), **numerado por etapa**
  cuando es una migración (`e9:*`).
- Convención útil: soporte de `--dry-run` y `--force`.
- Origen de datos de comida: planillas → Apps Script (`Migracion/*.gs`) → seed. En ShapeUp el
  origen del catálogo es **Free Exercise DB** (JSON) → transformador → seed.

---

## 9. Estilo, íconos y PWA

- **Design tokens** en `styles/tokens.css` (paleta, tipografía, modo oscuro) usados por todos
  los componentes — esto lo va a tomar Claude Design para ShapeUp.
- Íconos con **lucide-react**.
- **PWA** con `vite-plugin-pwa` (instalable, offline). `useInstallPrompt` para el "agregar a
  pantalla de inicio".
- Build: **`tsc -b && vite build`** (typecheck + bundle). *Ojo:* el scaffold inicial de
  ShapeUp dejé `vite build` solo para destrabar el deploy; al integrarlo en serio, volvé a
  `tsc -b && vite build` para no publicar con errores de tipo.

---

## 10. Stack y convenciones

- React + React Router + Firebase (Firestore + Auth Google) + Vite + TypeScript estricto.
- Nombres de dominio en español; IDs `XXX-0001`.
- Componentes presentacionales "tontos"; la lógica vive en `lib`/`data`/`hooks`.

---

## 11. Qué REPLICAR vs qué MEJORAR (para no arrastrar errores)

**Replicar tal cual (está bien resuelto):**
- El patrón `data/*` (caché + `Result` + IDs + `serverTimestamp` + transacciones).
- `Result<T>` y `firebaseErrorMessage` para errores.
- `lib` puro + tests al lado, y los tests de reglas con emulador.
- Auth por whitelist y la separación cliente/reglas.
- Cachés derivados recalculados al escribir.
- Tokens de diseño + PWA.

**Mejorar / no copiar (deuda visible en el repo de comida):**
- **Componentes versionados** (`RecetaCardV2`, `GondolaCardV2`): son restos de iteración.
  En ShapeUp, un solo componente por cosa, sin sufijos `V2`.
- **Scripts de migración one-off acumulados** (`e9:*`, `migrar:unidades`, varios `reseed`):
  útiles pero desordenan. Mantené `scripts/` con pocos seeds idempotentes y bien nombrados
  (`seed:shapeup`, `import:fedb`), y documentá cada uno.
- **`models.ts` único y muy grande**: sirve, pero vigilá que no se vuelva inmanejable; si
  crece, partir por dominio (catalogo / entrenamiento / salud) manteniendo una sola fuente de
  verdad por área.
- **Lógica con supuestos de comida**: al calcar un archivo, revisá que no queden conceptos del
  dominio viejo (proteínas, góndolas, compras, votos). En ShapeUp el "voto" es "registro real"
  y no hay compras.
- **Empezar con tests desde el día 1** (en comida llegaron de a poco): que `entrenarState`,
  `metricas` y las reglas tengan test antes de construir mucha UI encima.

---

## 12. Mapa rápido comida → ShapeUp (a nivel archivos)

| Comida | ShapeUp |
|---|---|
| `data/ingredientes.ts` | `data/ejercicios.ts` |
| `data/recetas.ts` | `data/rutinas.ts` |
| `data/menus.ts` | `data/programas.ts` |
| `data/planes.ts` | `data/sesiones.ts` |
| `data/historial.ts` | `data/historial.ts` |
| `data/visibilidad.ts` | `data/visibilidad.ts` (igual) |
| `data/compras.ts` | — (eliminado) |
| `lib/macros.ts` | `lib/metricas.ts` ✅ |
| `lib/elegibilidad.ts` | `lib/elegibilidad.ts` |
| `lib/filtros.ts` | `lib/filtros.ts` |
| `lib/sustitutos.ts` | (progresiones/regresiones, dentro de catálogo) |
| `lib/voto.ts` | (registro real, en `data/historial.ts`) |
| `hooks/useCocinarState` | `hooks/useEntrenarState` (envuelve `lib/entrenarState.ts` ✅) |
| `components/cocinar/*` | `components/entrenar/*` |
| `routes/Cocinar.tsx` | `routes/Entrenar.tsx` |
