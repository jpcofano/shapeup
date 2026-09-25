# CLAUDE.md — ShapeUp

Memoria de proyecto para Claude Code. Leé esto antes de cualquier cambio.
Fuentes ampliadas: `docs/ESTADO-DEL-PROYECTO.md` (estado), `docs/MAPEO-IMPLEMENTACION.md`
(mapa técnico), `docs/SAMSUNG-HEALTH-MAPEO.md` (spec del export), `docs/SEEDS.md`.

## Qué es
App de entrenamiento familiar (4 miembros, owner juanpablo). React + TypeScript + Vite +
Firebase (Firestore, plan Blaze, `southamerica-east1`). PWA en camino. Idioma: castellano
argentino, voseo. Tokens de diseño siempre (`src/styles/tokens.css`).
**Los límites de costo siguen valiendo:** el nivel gratuito de Blaze tiene los mismos topes
que Spark, así que las decisiones tomadas "por costo Spark" siguen en pie.

## Reglas de trabajo (no re-discutir)
- Funciones puras separadas de Firebase (ADR #009): la lógica va en `src/lib/`, testeable
  sin emulador; `src/data/` solo orquesta Firestore.
- Las transacciones de cierre escriben SOLO documentos del propio miembro (ADR #014);
  contadores derivables no se actualizan en caliente.
- Métricas de salud con granularidad diaria, no crudas (ADR #016, costo: plan Blaze, con los
  mismos topes que Spark).
- IDs con rangos reservados (ADR #010). Result<T> en toda la capa de datos.
- Antes de dar por terminado un prompt: `npx tsc -b` limpio + `npx vitest run` verde
  (la suite `firestore.rules.test.ts` requiere emulador; sin emulador se permite skip).
- Al terminar cada tarea, escribí el reporte final completo —tal cual se lo darías a Juan,
  con las preguntas abiertas— en `docs/auditorias/ultimochat.md`, sobrescribiéndolo. Juan no
  copia el chat: Claude lo lee de ahí.

## Serie S — Integración de salud ✅ CERRADA (2026-07-04 → 2026-07-17)

Objetivo del owner: **no importar todo indiscriminadamente**; matchear los entrenamientos
hechos en la app con los datos de salud, enriquecer el historial y las rutinas analizando
esos datos, y simplificar la pantalla de Salud para mostrar solo lo relevante.

### S1 — Enriquecimiento post-import (la última milla del match) ✅ completo (P46+P47, 2026-07-04)
1. ✅ `data/historial.ts`: `enriquecerHistorial(idHist, biometria, bloques?)` — updateDoc simple.
2. ✅ `lib/enriquecerImport.ts`: núcleo puro. `ventanaDeHistorial`, `calcularEnriquecimiento`,
   `enriquecerTrasImport`. 16 tests. No muta entrada, no duplica datauuid.
3. ✅ `Salud.tsx` → `confirmarImport`: si hay `sesionesSamsung` o `muestrasFcCrudas` corre
   enriquecimiento y muestra resumen "X matcheadas (Y por custom-id, Z por ventana, ...)".
   Fallo no cancela import (ver P57 para los niveles "día"/"rango" agregados después).
4. ✅ `finalizarSesion`: guarda `inicioMs`/`finMs` desde `ventanaDeBloques` (ADR #019).
5. ✅ **Import selectivo (ADR #020) — P47**: `lib/importSelectivo.ts` puro. Reglas:
   "shapeup" → "historial" → "vr" → "actividad". Toggle opt-in en preview (ZIP + CSV).
   `ACTIVIDADES_SIEMPRE_RELEVANTES` exportada y editable. 19 tests.

**Flujo de prueba de S1 (P48):**
`npm run limpiar:salud -- --miembro=juanpablo --confirmar [--limpiar-biometria]`
→ importar ZIP real nivel biométrico → validar resumen de matcheo en la UI.
`scripts/limpiar-salud.ts`: depura solo salud; nunca toca historial/sesiones/rutinas.

> **Nota (P57):** la sección "1c — Robustez del match" de este prompt original
> nunca se implementó (el `docs/prompts/46-s1-*.md` guardado no la tiene — es una
> versión anterior). La spec vigente del match es `docs/prompts/57-s-match-robusto.md`
> — ver ADR #025 más abajo.

### S2 — Salud: mostrar lo relevante ✅ completo (P49+P51+P52, 2026-07-06)
1. ✅ `lib/resumenSalud.ts`: `calcularResumenSalud` + `senalPeor`. 36 tests.
   **Umbrales exportados aquí** — S3 los importa (fuente única de verdad).
   Señal de sueño usa `consolidarNoches` (fuente única; no promedio de tramos crudos).
2. ✅ Tab `"resumen"` como default en `/salud`: cards con sparkline 14d, flecha de
   tendencia, semáforo (tokens), motivo explicable, tap navega a tab de detalle.
3. ✅ `HistorialDetalle`: bloque "Contexto del día" (sueño noche anterior + FC en reposo).
   Sueño busca `NocheSueno.fecha === fechaRealizada` (mañana del día del entrenamiento).
4. ✅ `CardioTab`: vinculadas primero, redondeo, `ZonaChip` por fila, agrupado por mes,
   "Ver más" (+3 meses), contador vinculadas en título.
5. ✅ `SuenoTab`: una fila por noche consolidada, rango `HH:MM → HH:MM`, tramos, siesta.
6. ✅ Refactor: `ComposicionTab`, `CardioTab`, `SuenoTab`, `ProgresoTab`, `ImportPanel`
   en `src/components/salud/`. `Salud.tsx` → contenedor delgado con estado compartido.
7. ✅ Import único siempre biométrico: selector de nivel eliminado (P52).
8. ✅ `resolverActividad` (P51): tipo 0 → "ShapeUp"/"nombre custom"/"Personalizado";
   tipo desconocido → "Otro (N)". Re-import idempotente corrige registros existentes.
9. ✅ Versión en Perfil: `__APP_VERSION__` + `__BUILD_DATE__` via Vite define (P51).

**`lib/sueno.ts`** — fuente única de verdad para sueño consolidado:
`NocheSueno`, `consolidarNoches`, `promedioNoches`. `fecha` = mañana del despertar.
Siesta: inicia 10:00–19:59 Y < 3h. Legacy: `horaAcostarse` ≥ "15:00" → fecha+1.

### S3 — Motor de recomendaciones + rutinas nuevas ✅ completo (P50, 2026-07-04)
1. ✅ `lib/recomendaciones.ts` **puro**: `calcularRecomendacion(senales, historial, hoy, miembro)`.
   5 reglas en orden (primera que aplica gana): descanso → bajar intensidad → cardio Z2 →
   deload → felicitación. Helper exportado `semanasSinDescarga` con tests propios.
   `RUTINAS_RECOMENDADAS = { z2:"RUT-0023", hiit:"RUT-0024", descarga:"RUT-0025", deload:"PRG-0009" }`.
2. ✅ Tarjeta en Home: icono por severidad, mensaje con dato concreto, "Ver rutina", ✕ descartable.
   `localStorage` → `rec-descartada-{miembro}-{YYYY-MM-DD}`. Sin bloqueo.
   Datos de salud cacheados en `sessionStorage` (`su-{miembro}` = "0"|"1").
3. ✅ `scripts/seed-salud-rutinas.ts` → RUT-0023/0024/0025. Alias: `seed:salud-rutinas`.
4. ADR #023: sin colección nueva; cálculo al vuelo, descarte en localStorage.
   **Serie S completa.** S4 y roadmap = próxima conversación de arquitectura.

### S4 — (futuro, no arrancar sin OK del owner)
Ver "Roadmap" abajo.

**Serie S cerrada (2026-07-13):** después de "Serie S completa" (arriba) todavía
hicieron falta tres hotfixes reales sobre el match — S-fix-b (P56: regla "día
único", `fc-media-dia` en vez de `fc-reposo` falso, señales de presión/SpO2),
S-match (P57: ranking por Δinicio con techos 30/10 min, anti-"olvido de corte",
nivel "rango" con muestras crudas, spec autoritativa en `docs/prompts/57-*.md`,
ver ADR #025) y su hotfix de persistencia (claves `undefined` rechazadas por
Firestore). Con eso la primera biometría real quedó persistida y visible
(H-20260707, `matchPor: "dia"`). De acá en más, arranca la **serie I**.

## Serie I — Insights ✅ CERRADA (2026-07-13 → 2026-07-17)

Los insights leen de Firestore y son agnósticos de cómo llegó el dato — no se
mezclan con la serie H (Health Connect, sync automático), que va después y es
un problema aparte (de ingesta, no de análisis).

- ✅ **I1 — Tendencias largas de salud** (P58, 2026-07-13): `lib/tendencias.ts`
  (núcleo puro, bucketing diario/semanal/mensual según rango, mediana +
  banda min-máx, `deltaAnualPct`) + `components/TrendChart.tsx` (SVG propio,
  sin librerías nuevas) + sección "Tendencias de salud" en `ProgresoTab`
  (chips de métrica con ≥10 datos, selector 3M/1A/5A/Todo, presión con dos
  líneas y ref 120/80). Fix de yapa: `derivarZona` cae a bandas estándar de
  `fcMaxTeorica` cuando no hay `zonasFC` configuradas (ver ADR #025).
- ✅ **I2 — Costo cardíaco por rutina** (P59, 2026-07-14): `lib/costoCardiaco.ts`
  (núcleo puro) — `compararConPrevias` (FC media actual vs mediana de las
  previas de la misma rutina, `null` con < 2 previas o sesión libre) +
  `serieCostoRutina` (serie cronológica para `TrendChart`, excluye sesiones
  sin biometría). Frase en `HistorialDetalle` (verde solo si mejoró — nunca
  rojo si subió, puede ser esfuerzo deliberado); sección "Costo cardíaco" en
  `RutinaDetalle` solo con ≥ 3 sesiones con biometría del miembro (silencio
  si no hay dato suficiente). Comparación siempre contra uno mismo, nunca
  entre miembros ni entre rutinas distintas. Con los datos reales de hoy (1
  sesión enriquecida y libre) queda en silencio, como se espera.
- ✅ **I3 — Progresión de cargas** (P60, 2026-07-14): `lib/progresion.ts`
  (núcleo puro) — `sugerirProgresion(idEjercicio, historial, prescripcion,
  incrementoKg?)`, doble progresión clásica: reglas en orden, la primera que
  aplica gana — subir-peso (toda la última sesión al techo del rango o al
  objetivo fijo), bajar-peso (dos sesiones seguidas con ≥ mitad de series
  bajo el piso), subir-reps (completó todo sin llegar al techo — solo con
  rango real), repetir (default con historia). Silencio (`null`) sin
  sesiones previas del ejercicio, modalidad sin peso, ejercicio bodyweight
  sin `cargaKg`, u objetivo no numérico (AMRAP). `incrementoPara`: 1 kg bajo
  10 kg, 2 kg si no. `EntrenarSesion.tsx`: `SugerenciaChip` arriba del bloque
  guiado, "Usar" precarga el log rápido (nunca se autocompleta sola), ✕
  descarta en memoria (no persiste). `RutinaDetalle.tsx`: ícono discreto solo
  en bloques con sugerencia "subir-peso" (los demás tipos ensuciarían la
  lista), tap muestra el motivo. **Serie I completa** (P60, 2026-07-14).

**Cierre S/I (2026-07-17):** después de "completa" todavía hicieron falta dos
pases de validación del owner sobre datos reales — **P63** (fix: `getMetricasSalud`
sin filtro de tipo necesitaba índice compuesto en `metricas-salud` y el error
`failed-precondition` quedaba atrapado sin llegar a la UI, que mostraba "sin
datos" en silencio; se agregó el índice, se propagó el error como `Result`
visible con reintentar, y se pulieron redondeos/ejes/rangos cortos de los
charts) y **P64** (pulido de Resumen: jerarquía + sparkline de fondo +
densidad en grilla para las informativas + "medida el DD/MM"; conclusión de
tendencias parametrizada por rango en `serieTendencia` — antes siempre decía
"hace un año" sin importar el selector activo; línea de estado diario en Home
vía `seleccionarEstadoDiario` — visible solo cuando no hay tarjeta de
recomendación, para que el motor de salud no parezca inexistente con todo en
verde; estado honesto "Sin datos del reloj para esta sesión" en
`HistorialDetalle` en vez de silencio). Con esto quedan **cerradas las series
S e I**. Lo próximo es la **serie H** (ver sección propia, abajo) — arranca
con conversación de arquitectura, no directo a código.

## ADRs de la serie S
- **ADR #019** — `Historial.inicioMs/finMs` a nivel sesión, sellados en `finalizarSesion`
  desde las series. Motivo: el match por ventana no debe depender de recalcular.
- **ADR #020** ✅ — Import selectivo por defecto: solo cardio que matchea historial o
  actividades conocidas; "importar todo" es opt-in. Motivo: pedido explícito del owner
  ("no se trata de importar todo") + costo Spark. Implementado en P47.
  _Nota al pie (P66e): el proyecto pasó a Blaze; su nivel gratuito tiene los mismos topes,
  así que el motivo de costo sigue en pie._
- **ADR #021** — El enriquecimiento biométrico es **post-hoc e idempotente**: re-importar
  el mismo ZIP no duplica ni pisa biometría con datos peores (si el Historial ya tiene
  `granularidad: "serie"`, no se degrada a "sesion").
- **ADR #022** ✅ — Recomendaciones client-side, puras y explicables: cada recomendación
  muestra su porqué ("FC reposo +6 bpm vs tus últimas 4 semanas"). Nada de caja negra.
- **ADR #023** ✅ — Sin colección nueva para recomendaciones (costo Spark, son derivables).
  Cálculo al vuelo en el cliente. Descarte del día en `localStorage` (`rec-descartada-{miembro}-{fecha}`).
  Si a futuro hace falta trackear `aplicada`, se revisa el ADR.
  _Nota al pie (P66e): el proyecto pasó a Blaze; su nivel gratuito tiene los mismos topes,
  así que el motivo de costo sigue en pie._
- **ADR #024** ✅ — VR como intervalos: las sesiones VR se modelan con
  `PrescripcionCardio` formato `"Intervalos"` (`rondas` = series, `trabajoSeg`/
  `descansoSeg` por serie, `juegoSugerido` para el chip) en vez de extender el
  modelo. Las imágenes de juegos son SVG originales locales (`public/vr/`) por
  copyright — nada de carátulas ni screenshots de marketing. Implementado en P51b.
- **ADR #025** ✅ — Spec autoritativa del match biométrico: `docs/prompts/57-s-match-robusto.md`
  (S-match, P57). Reemplaza la "1c" del P46 original que nunca se implementó
  (`docs/prompts/46-s1-*.md` no la tiene — está desactualizado en ese punto).
  Ranking por **Δinicio** (no por solapamiento): pool custom-id gana el menor
  Δinicio con techo 30 min y sin mínimo de solape; pool ventana requiere
  Δinicio ≤ 10 min y solapa > 0, con guardia de ambigüedad si el top-2 difiere
  < 5 min. Anti-"olvido de corte": si Samsung siguió grabando > 15 min después
  del fin de la app, se recorta FC a la ventana real y se omite `kcal`
  (`finMsEfectivo` marca el corte). Nivel `"rango"` como último recurso: FC de
  muestras crudas de `tracker.heart_rate` dentro de la ventana (mín. 10
  muestras), solo disponible al importar (las muestras nunca se persisten,
  ADR #016). Última serie de la sesión: tope de 90 s para `recuperacionBpm`
  (ya no queda `undefined` por no encontrar "serie siguiente"). Lo agregado en
  S-fix-b (ventana `sintetica`, regla "día único", ambigüedad por fecha) se
  conserva sin cambios — P57 lo completa, no lo reemplaza.
  **P58:** `derivarZona` suma un segundo nivel de fallback — bandas estándar
  de %FCmáx sobre `fcMaxTeorica` cuando no hay `zonasFC` a medida. No hay campo
  de edad en `PerfilMiembro`, así que el fallback "220−edad" que se había pedido
  no es calculable todavía — queda pendiente si se agrega ese campo a futuro.
  ⚠ **Corregido en P79b (21/09/2026):** la nota decía que «el `config/perfiles`
  real está vacío», y ya no lo está — el perfil de `juanpablo` tiene
  `fcMaxTeorica: 169` y las cinco `zonasFC` a medida (Z1 85–101 … Z5 152–169),
  verificado leyendo el documento. El fallback sigue existiendo para los
  miembros que no las tengan.

## Serie H — Sync automático de salud (PU1–PU4 construidos, 2026-09-18)

Objetivo: que la biometría entre sin exportar el ZIP a mano.

### Estado real (verificado leyendo el código el 21/09/2026)

**La vía D está construida y corriendo**, no "pendiente de decisión". El puente Android
(repo aparte) lee Samsung Health con el Data SDK y sube crudo a
`/ingesta-sdk/{uid}/registros` cada 6 horas; ShapeUp lo lee y lo importa.

| Hito | Qué es | Estado |
|---|---|---|
| **PU1** | Leer por SDK y volcar a JSON | ✅ verificado contra la sesión de referencia |
| **PU2 / PU2a** | El JSON viaja solo a Firebase + reglas de `/ingesta-sdk` | ✅ |
| **PU3 / PU3a** | Lectura incremental, corrida en background, registros partidos y estado | ✅ |
| **PU4** | Adaptador TypeScript en este repo | ✅ (commit `f22b659`, 18/09) |

Lo que hay en el repo: `data/ingestaSdk.ts` (lee y rearma las partes),
`lib/adaptadorSdk.ts` (puro, traduce al formato de los parsers del ZIP),
`data/sincronizarPuente.ts` (orquesta, **reusa el pipeline del ZIP**),
`components/salud/PuentePanel.tsx` (estado del puente + vista previa),
`scripts/dry-run-puente.ts`. Reglas en `firestore.rules` líneas 88 y 114.

**✅ La curva de FC ya entra por el puente (P82, 22/09/2026).** Era el hueco que faltaba y
está cerrado: `adaptarRegistros` devuelve `liveData` y `sesionesSamsung` con la misma forma
que produce el ZIP, y `sincronizarDesdePuente` corre `enriquecerTrasImport` — **la misma
función del ZIP**, sin un segundo camino de match. La curva sigue **sin persistirse**
(ADR #016): vive en memoria durante la sincronización y se descarta.

Medido en seco sobre los datos reales el 22/09: 87 sesiones del SDK, **84 con curva (83.816
puntos)**, enriquecería **7 de las 8 sesiones del historial con `granularidad: "serie"`**.

**Lo que la vía D todavía NO hace:**

1. **No sincroniza sola.** Está declarado fuera de alcance en PU4: hoy es un botón en
   /salud, con vista previa y confirmación. **Es el pendiente #1 de la serie H.**
2. **No enlaza ni convierte entradas externas** (bloque 5 del roadmap, P76).
3. **No cubre el nivel `"rango"` del match**: sale de `tracker.heart_rate`, que el puente no
   trae. Con la curva fina andando, importa poco.

### Qué cambió respecto del plan de P61

### Qué cambió respecto del plan de P61
P61 asumía que la única vía era leer Health Connect desde un cascarón nativo, y que el
proyecto seguía en Spark sin backend. Dos cosas cambiaron:

- **Health Sync (versión paga) está instalado y exporta a Google Drive**: datos de salud
  como CSV y actividades como FIT/TCX/GPX/CSV, automáticamente en segundo plano. Eso
  abre un camino que no requiere APK: la PWA lee la carpeta.
- **Blaze habilitado**, con alertas de presupuesto. El uso a esta escala cae en el nivel
  gratuito, así que el costo esperado es cero, pero deja de ser cierto que no puede haber
  una function.

### Vías de ingesta (ADR #032, superseded por #036)
Se clasifican por **de dónde leen**, no por el transporte. Auditoría ZIP vs Drive del
14/09/2026 en `docs/ROADMAP-producto.md` §15; verificación de la vía D en §15.8 y §15.9.

| Vía | Qué es | Lee de | Estado |
|---|---|---|---|
| **A** | Health Sync → Google Drive | Health Connect | En uso, automática, **topeada** |
| **B** | Intervals.icu | Health Connect (vía Health Sync) | Descartada, mismo techo |
| **C** | Cascarón Capacitor + plugin de **Health Connect** | Health Connect | Descartada, mismo techo |
| **D** | App Android + **Samsung Health Data SDK** | La app de Samsung Health | **Verificada, pendiente de decisión de costo** |
| **E** | App Wear OS + Samsung Health Sensor SDK | El sensor del reloj | Descartada por costo |

**H2 se ejecutó el 15/09/2026 y dio positivo** (`docs/ROADMAP-producto.md` §15.8, ADR
#036). Con el DataViewer del Data SDK 1.1.0, la sesión de referencia devuelve el mismo `uid`
que el `datauuid` del ZIP, los mismos 4133 puntos de curva, FC máxima 174, 604 kcal, la
duración activa y `customTitle: "ShapeUp"`. La D es el camino objetivo para el ejercicio,
pero **no está decidido tomarla**: exige app nativa (Capacitor + plugin en Kotlin), entorno
Android e instalación por fuera de la Play Store en cada teléfono. P88′ mide ese costo y si
es estable sin intervención.

**La C y la D no son la misma cosa, y esa distinción es la que evitó dar la D por
cerrada.** La C (el plan de P61) es Capacitor leyendo **Health Connect**, descartada por el
origen: Health Connect publica **2** muestras de FC de la sesión de fuerza del 14/09, para
la que el ZIP declara `heart_rate_sample_count = 12839`. Si Health Connect no tiene las
muestras, ningún consumidor de Health Connect las va a tener. La D lee **de la app de
Samsung Health** con el Data SDK (`ExerciseSession.log`) y trae la curva completa.

**La vía A no se retira.** Es la única automática hoy (cardio, pasos, sueño, FC pasiva); la
D la complementa en el hueco que A no cubre. **Health Sync sigue siendo necesario** aunque
se adopte la D: es el puente que mete la medición de la balanza en Samsung Health (§15.9).
⚠ **Corregido dos veces.** El 21/09 decía "mientras la D no se construya": la D ya estaba
construida (PU1–PU4). El 22/09 decía que la curva entraba solo por el ZIP: **P82 lo cerró**.
Hoy la vía D trae la curva y dispara el enriquecimiento. El import por ZIP queda como
respaldo y para la historia previa, no como la única vía.

Riesgos de la vía A que siguen abiertos: con la app OAuth en **Testing**, Google revoca los
refresh tokens **a los 7 días**; y leer archivos de otra app requiere `drive.readonly`,
**alcance restringido** (verificar en la consola qué exige hoy).

Reglas que valen para cualquier vía: clave canónica = inicio en epoch ms UTC + tipo
normalizado + `appId`, con tabla de fuentes declarada (ADR #033, enmendado en P66f); el tipo
del workout custom es `otro`, nunca `fuerza`; ningún cero ni dato derivado pisa un dato
medido (ADR #034); sesiones autodetectadas sin curva (ADR #035); composición corporal en
series por fuente de medición, sin merge entre fuentes (§15.9).

### H1′ — Spike sin código (histórico: ya no bloquea nada)
Configurar el export de Health Sync a Drive y dejarlo correr **un día que incluya una
sesión de fuerza, una de VR y una noche de sueño**. Después auditar los archivos. Lo que
hay que responder:

> **Estado (P66f): cerrado en lo que respecta a la vía Drive.** El transporte y el retraso
> de publicación quedaron respondidos en `docs/ROADMAP-producto.md` §15.4 y §15.8: por
> Drive la sesión de fuerza no trae curva (2 muestras) y ningún archivo tiene identificador
> por registro. **Las preguntas 3 y 4 y la sesión de VR no se dan por cerradas ni se
> descartan**: quedan pendientes de reformularse contra la vía D (texto literal transcripto
> en §16.10).

1. **¿Viene la curva de FC por sesión?** Hoy sale de `live_data.json` dentro del ZIP,
   indexada por `datauuid`, ~1 muestra por segundo. De ahí sale todo el enriquecimiento
   biométrico, y `recuperacionBpm` por serie con él. Un FIT debería transportar algo
   equivalente; hay que confirmarlo.
2. **¿Hay identificador estable por registro?** El `datauuid` de Samsung probablemente no
   viaje por esta vía.
3. **¿Cada cuánto escribe?**
4. **¿Trae FC de reposo y HRV?** `docs/SAMSUNG-HEALTH-MAPEO.md` registra que `fc-reposo`
   **no tiene fuente en el export del ZIP** (verificado en P56): `tracker.heart_rate` es
   un agregado esporádico, no reposo real. Health Connect sí tiene un tipo dedicado. Si
   esta vía lo trae, la serie H no solo saca un paso manual: **destraba un dato hoy
   imposible**, y con él la señal que puede adelantar la descarga del bloque 10.3.

Salida: reporte de auditoría (gitignored, como los demás). Sin escribir nada a Firestore
en esta fase.

### Riesgo central: idempotencia por dos vías
El bloque 5 deriva el id de una entrada externa del `datauuid` de Samsung. Si el mismo
entrenamiento llega por ZIP y por Drive y el identificador no viaja, se generan dos
entradas distintas para el mismo hecho. **La clave determinista compartida hay que
definirla con los archivos del spike a la vista**, no antes — y ambas vías deben producir
exactamente el mismo id. El import por ZIP no se elimina: queda como respaldo y para la
historia previa.

> **Resuelto por el ADR #033 (P66e, enmendado en P66f):** la clave es el inicio en epoch ms
> UTC + el tipo normalizado + `appId`, con comparación exacta y una tabla de fuentes
> declarada (origen o puente, preferencia, exclusión por campo). Las tres vías entregan
> `1789418092506` para la misma sesión. El `datauuid` baja a metadato, aunque por la vía D
> viaja como `uid`. El tipo del workout custom es `otro`, nunca `fuerza`. Ver §16.9 del
> roadmap sobre cómo obtener `appId` en las vías que no lo entregan.

### Regla heredada de la serie S
Todo timestamp en epoch ms UTC; conversión a local solo al mostrar. Los bugs de zona
horaria fueron el enemigo número uno de la serie S.

## ADR #038 — El enriquecimiento se versiona (P79, enmienda el #021)

El ADR #021 decía que el enriquecimiento es post-hoc e idempotente, y para no pisar un dato
fino con uno grueso `calcularEnriquecimiento` **omitía toda sesión con
`granularidad: "serie"`**. La consecuencia, que no se vio hasta P79: **una sesión ya
enriquecida nunca recibía un algoritmo nuevo**. Las de antes de P78 nunca iban a tener
cobertura, tramos ni recorte por más que se reimportara el ZIP.

- `BiometriaSesion.versionEnriquecimiento` y la constante `VERSION_ENRIQUECIMIENTO` en
  `lib/matchBiometrico.ts`. Ausente se lee como **1**; P78 es la **2**; P79 la **3**.
- Se omite **solo** si `granularidad === "serie"` **y** la versión está al día.
- **Nunca se pisa fino con grueso**: si está desactualizada pero esta corrida no trae curva
  para ella, se deja como está y se cuenta en `preservadas`.
- **Cada cambio al algoritmo sube la constante.** Si no, el cambio no llega a lo ya escrito.
- El resumen del import dice cuántas se re-enriquecieron por versión.

## ADR #039 — La progresión de VR se deriva del historial; la rutina nunca se muta (P79)

Cuando se acepta "recortar descanso" o "sumar ronda", **`/rutinas` no se toca**: es
compartida por la familia, y cambiarla por la progresión de un miembro se la cambia a todos.
Tampoco hay un override por miembro, que sería el contador acumulado que el ADR #037
prohíbe.

- `BloqueRegistro.prescripcionUsada` guarda los parámetros **con los que se jugó** esa sesión.
- La próxima sesión arranca con los de la última de ese miembro con esa rutina y ese juego,
  más el ajuste si se aceptó. Sin historia, los de la rutina.
- La clave es `(miembro, idRutina, idEjercicio del bloque VR)`: si se sustituyó el juego
  (P73), es otro juego y tiene su propia historia.
- La sesión corre sobre una **rutina efectiva** (`aplicarPrescripcionVR`), que es una copia:
  el documento de `/rutinas` queda intacto.

**Y dos principios que van con esto:**

- **El sistema decide solo con lo que mide.** `dificultadPercibida` se registra al cerrar y
  **no entra en ninguna regla**; hay un test que lo fija. Cuando no hay nada medido con qué
  decidir, `sugerirProgresionVR` devuelve `palanca: null` —que **no es `mantener`**— y la UI
  ofrece las opciones en vez de inventar una sugerencia.
- **La FC de sesión no sirve para esto.** `biometria.fcMedia` promedia los descansos y queda
  sistemáticamente por debajo; una regla que la usara pediría subir la dificultad para
  siempre. Se usa la **FC de trabajo**: el promedio de las rondas ponderado por duración, y
  solo de las que midieron bien (`fcDudosa` marca las que tienen artefactos).

## ADR #037 — La racha se deriva, nunca se acumula (P77a)

Toda la adherencia (`lib/adherencia.ts`) se **recalcula del historial cada vez que se
muestra**: la serie semanal, la racha activa, el récord y la tasa de 8 semanas.
**No se guarda ningún contador en Firestore, y no hay que agregarlo.**

Motivo: un contador acumulado se desincroniza con la primera corrección de datos, y en este
proyecto ya hubo tres — el mapeo del código 1001 (caminatas de 1 min etiquetadas como HIIT,
S-fix/P55), los fragmentos de sueño sin consolidar (`lib/sueno.ts`), y el corrimiento de 3 h
del `start_time` del ZIP (P76a, 2562 documentos de cardio). Cualquiera de las tres habría
dejado un contador mintiendo para siempre, sin forma de notarlo. Derivar cuesta unos
milisegundos sobre datos que las pantallas ya traen.

Decisiones que acompañan:
- **Se cuentan días, no sesiones**: dos sesiones el mismo día son un día, porque el plan se
  expresa en días por semana.
- **La meta sale del plan** (días no-descanso), y `PerfilMiembro.metaSemanalDias` la pisa.
  Sin programa activo no hay meta: se muestra el estado vacío, nunca un cero.
- **La semana en curso no rompe la racha**: se saltea si todavía no llegó a la meta.
- **Nunca se muestra "0 semanas de racha"**: si se cortó, se muestra el récord.
- La serie usa **la meta de hoy para todas las semanas** (simplificación conocida:
  no guardamos historial de metas).
- Hora local con `ymdLocal`/`lunesDeSemana`, **sin librería de zona horaria**: la familia
  está en un solo huso. Si algún día hay un miembro en otro, se revisa.

`rachaDelPlan` de `lib/racha.ts` se eliminó en P77a: contaba semanas con al menos una
sesión, que no es cumplir el plan.

**La caché de P77b no es una excepción a esto.** `lib/cacheDiasActivos.ts` guarda en
`localStorage` los días de `/cardio` de las semanas ya cerradas, para no releerlas en cada
visita a Progreso. Lo que se guarda son **lecturas**, no un contador: la racha se sigue
derivando entera en cada cálculo, y si la caché se borra el resultado es idéntico, solo que
más lento. Un import la limpia, porque puede reescribir semanas viejas.

## ADR #040 — En VR la completitud se mide por TIEMPO, no por rondas (P80, 2026-09-21)

Las cuatro rutinas de VR daban siempre `mantener` porque ninguna sesión completaba sus
rondas. La causa no era la regla: **con el casco puesto no se ve el teléfono**. Juan juega de
corrido 30 minutos y no marca nada. Las sesiones estaban completas; el registro no.

- **`completa` = llegar al 90 % del objetivo de tiempo** (`FRACCION_TIEMPO_COMPLETO`). Las
  rondas afinan la medición pero **no deciden** la completitud.
- El objetivo sale de la rutina: `Continuo` lo declara, `Intervalos` lo dice en
  `rondas × trabajoSeg` (`tiempoObjetivoMin`). Body Combat 30, PowerBeats 25, Beat the
  Beats 24, Creed 20.
- **El tiempo real es la ventana de la app menos las pausas.** Sin ventana cae a la suma de
  las rondas válidas, y **ahí las pausas NO se restan**: sumar duraciones ya deja los huecos
  afuera. (Bug real: restarlas dos veces daba 3 minutos donde había 32.)
- **`modo` se deriva, no se elige**: `"rondas"` si hubo al menos dos descansos medibles,
  `"tiempo"` si no. La forma que la UI ofrece primero sale de la última sesión de esa rutina.
- **De corrido la escalera es `subir-dificultad` → `sumar-tiempo` → `cambiar-juego`.** No hay
  descanso que recortar ni recuperación entre rondas que medir, así que la regla 3 solo
  decide en modo rondas.
- La sesión por tiempo registra **una sola ronda**, la que abarca toda la sesión. No es una
  ronda inventada: es lo que pasó, y es lo que sella la ventana (ADR #019) para que el
  enriquecimiento tenga de dónde agarrarse.

**Hallazgo que motiva el ADR y sigue abierto:** la ventana derivada de las series venía
midiendo entre 10 y 24 minutos menos que `duracionRealMin` en las cinco sesiones con ventana,
porque empieza en la primera ronda marcada y termina en la última. Una sesión (14/09) tenía
9 minutos de ventana contra 33 cronometrados: su primera serie no tiene `inicioMs`.

## ADR #041 — Lo que cuenta como entrenamiento es una lista POSITIVA (P81, 2026-09-21)

`esShapeUp` era `tipo !== "externa"`. Con esa forma, **cualquier tipo nuevo empezaba a contar
como entrenamiento por omisión**: los juegos de VR que Juan registra pero que no son
ejercicio se habrían metido solos en la racha, la meta, la adherencia, el tonelaje y la
progresión. Ahora es `tipo === "rutina" || tipo === "libre"`: lo que cuenta se declara.

- **Enriquecerse y contar son dos preguntas distintas, y el código lo dice con dos nombres.**
  `seEnriquece(h)` (rutina, libre **o juego**) gobierna el enriquecimiento y la clasificación
  del import; `esShapeUp(h)` gobierna toda métrica de plan o progresión. Un juego no cuenta,
  pero su FC es lo único que puede decir si ese juego mueve a alguien.
- **El test de aislamiento va antes que el tipo nuevo**, y se verifica que falle con la
  definición vieja. Con la negativa fallaban 7 de 12.
- Un juego **no** entra en racha, meta, adherencia, tasa, tonelaje, progresión, PR, días de
  movimiento, chips de la semana ni totales de Progreso. **Sí** entra en el historial (con
  chip *Juego*), en el enriquecimiento y en el análisis.
- La lista vive en `/config/diccionarios.juegosSinEjercicio`, la edita **solo el owner** por
  las reglas ya existentes, y **sacar un juego de la lista no borra sus sesiones**. Por eso
  la sesión guarda `nombreJuego` y no un id.
- **Las kcal de los juegos no se muestran**: en actividades de brazos el reloj las infla
  (roadmap §9.5), y un número que sabemos que está mal es peor que ninguno.
- Consecuencia que no estaba a la vista: la consulta de `/historial` filtraba
  `tipo in ["rutina","libre"]`, así que un juego no habría llegado nunca a la app. Ahora trae
  los tres tipos y la función se llama **`getHistorialEnLaApp`**, no `getHistorialShapeUp`.

## ADR #042 — La app define cuánto dura la sesión; el reloj aporta los datos (P83, 2026-09-22)

Regla dicha por el owner, y es la de P78 llevada hasta el final:

> *En la app el inicio y el fin en general son más amplios, y está bien. En Health a veces sin
> querer lo paro, o queda corriendo. El que marca de cuánto tiempo es la sesión es la app, y
> Health aporta los datos.*

`elegirTramosAdicionales` exigía que un tramo cayera al **80 %** adentro de la ventana
(`SOLAPE_TRAMO_MIN`) para sumarse a la agregación. **Ese umbral se elimina**: ahora alcanza
con que el tramo **toque** la ventana.

**Por qué el umbral no protegía nada.** Su motivo era que un workout de tres horas sin cortar
no entrara y arrastrara la FC de todo el rato que el reloj siguió grabando. Pero eso ya lo
resuelve `construirBiometriaDeTramos`, aguas abajo: **recorta cada tramo a la ventana** con
`interseccion` antes de usarlo — toma solo las muestras de adentro, prorratea las kcal por el
tiempo que solapa y marca `kcalEstimada`. El umbral no agregaba una garantía; solo tiraba
tramos buenos enteros en vez de recortarlos.

**El caso real que lo destapó (20/09/2026).** Un entrenamiento, dos marcas "ShapeUp" en el
reloj: `19:48→20:11` y `20:12→20:25`. La primera siguió grabando después de que la app cortó,
así que caía al **11 %** de solape relativo y se perdía **entera** — con los 2,6 minutos de
curva que sí estaban adentro de la ventana. Con el cambio, la sesión pasa de `tramos: 1` a
`tramos: 2`.

**Lo que se conserva sin tocar:**

- El **ranking por Δinicio** del ADR #025 elige el principal. Esto solo cambia qué *acompaña*.
- Solo entran los tramos **marcados como ShapeUp** (`customId`), y solo del pool que ya pasó
  el techo de 30 minutos del #025.
- Sobre una **ventana sintética** no se agrega nada: no hay contenedor en el que confiar.
- El recorte por "olvido de corte" (`OLVIDO_CORTE_MS`) y `excedeVentana` siguen igual.

**Lo que hubo que arreglar con esto**: `duracionMedidaMin` sumaba las intersecciones de cada
tramo. Con dos tramos que se pisan, el mismo minuto contaba dos veces e inflaba la duración y
la cobertura. Ahora se calcula sobre la **unión** (`unionMs`). Con el umbral del 80 % el caso
era raro; sin él, dos marcas del reloj que se solapan son normal.

`VERSION_ENRIQUECIMIENTO` sube a **5** (ADR #038: todo cambio de algoritmo la sube, si no el
cambio no llega a lo ya escrito).

## Roadmap (ideas evaluadas, orden tentativo)
Corto plazo (después de S1–S3; progresión de cargas y costo cardíaco por rutina
ya se implementaron como I2/I3 — ver "Serie I" arriba):
- **PRs y logros**: récords personales por ejercicio (carga, reps, tonelaje) + hitos
  familiares livianos. Motivación para los 4 miembros.
- **Panel familiar de adherencia** (solo owner): sesiones hechas vs planificadas por
  miembro por semana; respeta visibilidad existente.

Mediano plazo:
- **Correlaciones simples en Salud**: sueño vs RPE, kcal vs tendencia de peso semanal.
- **Backup/export CSV** de historial y mediciones (resguardo de datos; plan Blaze, con los mismos topes que Spark).
- **PWA completa**: offline con cola de escrituras (entrenar sin señal en el gimnasio) +
  notificaciones de "hoy toca X".

Largo plazo (registrado, sin compromiso):
- Sync de salud verdaderamente automático — ver "Serie H" arriba.
- Al cerrar el proyecto: purga del historial de git (mails de menores) → repo privado
  (ADR #015).
