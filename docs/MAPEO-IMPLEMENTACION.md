# ShapeUp — Mapeo de implementación (bitácora viva)

**Quién lo mantiene:** Claude Code. Al cerrar cada etapa agrega Bitácora + Estado + Mapa del código.
**Regla:** si algo se construyó y no quedó acá, no está hecho.

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

## 4. Tests (2026-06-04)

| Archivo | Tests |
|---|---|
| auth/findMemberByEmail.test.ts | 4 |
| lib/filtros.test.ts | 9 |
| lib/metricas.test.ts | 11 |
| lib/entrenarState.test.ts | 26 |
| **Total unidad** | **50** |
| `__tests__/firestore.rules.test.ts` | 34 (emulador) |
| **Total global** | **127** |

Tests de reglas: `src/__tests__/firestore.rules.test.ts` (34 tests; `npm run test:rules`).

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
