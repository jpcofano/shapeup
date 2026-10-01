# Historia de las series S, I y H

Movida en P100 (01/10/2026) desde `CLAUDE.md`, tal cual. Las reglas que seguían vigentes y los
ADRs quedaron en `CLAUDE.md` (y los ADRs completos en `docs/ADR.md`); donde estaban hay una línea
que lo dice.

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
_Regla vigente: queda en `CLAUDE.md`._
→ importar ZIP real nivel biométrico → validar resumen de matcheo en la UI.
`scripts/limpiar-salud.ts`: depura solo salud; nunca toca historial/sesiones/rutinas.

_Regla vigente: queda en `CLAUDE.md`._

### S2 — Salud: mostrar lo relevante ✅ completo (P49+P51+P52, 2026-07-06)
_Regla vigente: queda en `CLAUDE.md`._
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

_Regla vigente: queda en `CLAUDE.md`._

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

1. ~~No sincroniza sola.~~ **Resuelto en P85 (25/09/2026):** `useSincronizacionAutomatica`
   en `AppShell` sincroniza una vez por carga si `/estado/puente.ultimaCorridaMs` avanzó y
   pasaron 6 h (`lib/sincronizacionAutomatica.debeSincronizar`, marcas en `localStorage`
   por uid). Caso normal: **una** lectura. Chip en Home; el botón de /salud queda para la
   vista previa. **Sigue sin correr con la app cerrada** (eso es "PWA completa").
   **P89 (25/09/2026), lado ShapeUp:** el botón le **pide** una corrida al puente, espera
   hasta 45 s e importa igual si no contesta. Al guardar una sesión el pedido sale solo
   (`origen: 'fin-sesion'`). El mensajero es la **primera Cloud Function del proyecto**
   (`functions/`, gen 2, `southamerica-east1`), que manda un push de datos silencioso al
   token del puente (`estado/dispositivo`). **Falta P90** (el puente Android registra el
   token y responde al push): sin eso el pedido se escribe y la función anota `sin-token`.
   `functions/` tiene su propio `npm install`; sin él `tsc -b` falla. Nada de esto está
   deployado: función y reglas se suben a mano (ver `functions/README.md`).
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
_Regla vigente: queda en `CLAUDE.md`._

| Vía | Qué es | Lee de | Estado |
|---|---|---|---|
| **D** | App Android + **Samsung Health Data SDK** | La app de Samsung Health | **Verificada, pendiente de decisión de costo** |

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

_Regla vigente: queda en `CLAUDE.md`._
⚠ **Corregido dos veces.** El 21/09 decía "mientras la D no se construya": la D ya estaba
construida (PU1–PU4). El 22/09 decía que la curva entraba solo por el ZIP: **P82 lo cerró**.
Hoy la vía D trae la curva y dispara el enriquecimiento. El import por ZIP queda como
respaldo y para la historia previa, no como la única vía.

Riesgos de la vía A que siguen abiertos: con la app OAuth en **Testing**, Google revoca los
refresh tokens **a los 7 días**; y leer archivos de otra app requiere `drive.readonly`,
**alcance restringido** (verificar en la consola qué exige hoy).

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
