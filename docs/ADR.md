# ShapeUp — ADRs (registro completo)

Movidos en P100 (01/10/2026), tal cual, desde `docs/MAPEO-IMPLEMENTACION.md` §5 y `CLAUDE.md`,
ordenados por número. El índice, una línea por ADR, está en `CLAUDE.md`. Los #037 a #042 tienen
dos redacciones: primero la de `CLAUDE.md` y debajo la de `MAPEO` §5.

## ADR #001

```
#001 tsc -b con outDir en .tsc-out/ — composite incompatible con noEmit
```

## ADR #002

```
#002 findMemberByEmail exportada separada — testeable sin mockear Firestore
```

## ADR #003

```
#003 E2 UI omitida a pedido — data layer implementado en E3
```

## ADR #004

```
#004 prescripcionLabel en lib/ — reutilizable desde E3 y E4
```

## ADR #005

```
#005 EntrenarSesion fuera del AppShell — pantalla fullscreen sin bottom-nav
```

## ADR #006

```
#006 "Catálogo" reemplazado por "Salud" en bottom-nav — E2 UI pendiente
```

## ADR #007

```
#007 [2026-06-04] poseidoPorOwner en seed-vr.ts
  Contexto: el script siembra 10 juegos VR; el owner no tiene todos instalados.
  Decisión: campo extra `poseidoPorOwner: boolean` en el doc de Firestore.
  Por qué no está en el modelo: Ejercicio es catálogo neutral (cualquier miembro);
  "poseído" es propiedad del owner, no del ejercicio. Se guarda como metadata
  informativa para que la UI filtre o muestre etiqueta "disponible".
  Los scripts usan tsx (no pasan por tsc -b), por eso no rompe el type-check.
```

## ADR #008

```
#008 [2026-06-04] IDs reservados EJ-9001+ para VR
  Contexto: importar-fedb.ts asigna IDs secuenciales desde EJ-0001.
  Decisión: saltar al rango 9001+ para VR garantiza que nunca colisionan,
  corra seed-vr.ts antes o después de seed-ejercicios.ts.
```

## ADR #009

```
#009 [2026-06-04] función pura separada del módulo con I/O de Firebase
  Contexto: findMemberByEmail vivía en resolveMemberId.ts que importa firebase.ts.
  Vitest ejecuta los imports al cargar el test; firebase.ts llama getAuth(app) que
  tira auth/invalid-api-key sin VITE_FIREBASE_API_KEY (CI, checkout limpio).
  Resultado: 0 tests colectados, suite falla aunque la función es pura y no toca Firebase.
  Decisión: extraer funciones puras a archivos sin imports de Firebase.
  Regla general: lib/ y funciones auxiliares de auth NO importan firebase.ts ni
  ningún módulo que lo haga transitivamente.
```

## ADR #010

```
#010 [2026-06-04] Rangos de IDs reservados para seeds
  EJ-0001…EJ-7999: importador FEDB (seed-ejercicios.ts)
  EJ-8001…EJ-8999: ejercicios del plan con técnica curada (seed-plan.ts)
  EJ-9001…EJ-9999: juegos de VR (seed-vr.ts)
  RUT-0001+: seed-plan.ts (Fuerza A/B/C + VR); la app crea los siguientes secuencialmente
  PRG-0001+: seed-plan.ts; la app crea los siguientes secuencialmente
```

## ADR #011

```
#011 [2026-06-04] duracionEstimadaMin y totalSeries en seeds son estimaciones
  Contexto: calcularCacheRutina (lib/metricas.ts) necesita el catálogo de ejercicios
  para calcular equipoNecesario, y hace los cálculos precisos de duración y series.
  Los seeds ponen valores estimados (calculados a mano) para que la UI muestre algo
  desde el primer día sin necesidad de editar cada rutina.
  Resultado: en la primera edición de cada rutina desde la app, calcularCacheRutina
  recalcula y reemplaza con los valores exactos.
```

## ADR #012

```
#012 [2026-06-04] Fuerza C (circuito) se recorre lineal en el motor actual
  Contexto: RUT-0003 está pensada como circuito round-robin (1 serie de cada ejercicio,
  repetir N rondas). El reducer entrenarState.ts recorre bloque por bloque: completa
  todas las series de uno antes de pasar al siguiente.
  Resultado: la app la guía linealmente; el usuario puede usar el modo scroll para
  hacer el circuito a mano. Mejora futura: soporte de grupoSet en el reducer para
  que el modo guiado recorra round-robin los bloques con el mismo grupoSet.
```

## ADR #013

```
#013 [2026-06-04] Acceso al Catálogo via tabs en /biblioteca
  Contexto: el catálogo salió del nav inferior en ADR #006 para meter Salud (6 ítems).
  Sin un punto de entrada no hay forma de llegar a los ejercicios desde la UI.
  Decisión: pestañas "Rutinas | Ejercicios" en la cabecera de /biblioteca; el tab
  activo se persiste en el query param `?tab=ejercicios`. El nav inferior no cambia.
  Por qué no una ruta nueva en el nav: mantener 6 ítems fijos es la restricción del diseño.
  Por qué no /catalogo standalone: las rutinas y los ejercicios se navegan juntos (al
  crear una rutina se elige un ejercicio del catálogo); agruparlos en /biblioteca es coherente.
  /catalogo sigue funcionando como ruta directa; Biblioteca la embebe via el tab.
```

## ADR #014

```
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
```

## ADR #015

```
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
```

## ADR #016

```
#016 [2026-06-05] Métricas genéricas en granularidad diaria (no datos crudos)
  Contexto: Samsung Health exporta métricas de alta frecuencia (FC continua,
  acelerómetro, etc.) con miles de muestras por día. Volcarlo crudo reventaría
  las cuotas del plan Spark de Firestore y no aporta: el motor de
  recomendaciones usa tendencias (cómo evolucionó HRV/estrés por día/semana).
  Decisión: el importador agrega a UN valor por día antes de escribir en Firestore
  (mínimo para fc-reposo, máximo para fc-max-dia, promedio para estrés, etc.).
  Las muestras crudas se descartan en memoria; nunca llegan a la base.
  idMetrica = `${miembro}-${tipo}-${fecha}` → un doc por día, idempotente:
  re-importar el mismo archivo no duplica datos.
  Nota al pie (P66e, 2026-09-15): el proyecto pasó de Spark a Blaze. El nivel
  gratuito de Blaze tiene los mismos topes, así que el motivo de costo sigue en pie.
```

## ADR #017

```
#017 [2026-06-09] Programa activo por miembro vía doc config/programaActivo
  Contexto: getProgramaActivo() devuelve el primer programa con estado:"Activo" (global).
  En app familiar con varios miembros, si JP y María tienen programas activos, la función
  devuelve el primero de la lista → colisión.
  Decisión: doc config/programaActivo (mapa miembro→programaId), análogo a config/visibilidad.
  getProgramaActivo(miembroId) lo lee; fallback a estado:"Activo" si no hay entrada para el miembro.
  setProgramaActivo(miembroId, programaId) nuevo.
  Razón: evita migrar los docs de /programas; un solo doc, fácil de leer/escribir; mismo
  patrón que visibilidad. Permite que cada miembro tenga su programa sin colisión.
```

## ADR #018

```
#018 [2026-06-09] Sesión del día por día de semana, con fallback secuencial
  Contexto: proximaSesion() usa orden secuencial del programa. La familia entrena en días
  fijos (quieren ver "hoy toca / hoy descansás"), pero no hay que castigar a quien se saltea.
  Decisión: nueva sesionDeHoy(programa, hoyDiaSemana, historialSemana) resuelve la rutina
  del día actual por diaSemana; devuelve estado "descanso" si hoy es descanso, "ya entrenaste"
  si ya hay sesión hoy. proximaSesion() se mantiene como fallback para días salteados / "qué sigue".
  Razón: separa "qué toca hoy" de "qué sigue sin hacer"; cada función tiene responsabilidad clara.
  No se rompe retrocompat: proximaSesion sigue funcionando igual.
```

## ADR #019

- **ADR #019** — `Historial.inicioMs/finMs` a nivel sesión, sellados en `finalizarSesion`
  desde las series. Motivo: el match por ventana no debe depender de recalcular.

**Redacción anterior (MAPEO §5)**

```
#019…#025 — ADRs de la serie S (salud): documentados en CLAUDE.md, sección
  "ADRs de la serie S". #025 es la spec autoritativa del match biométrico
  (docs/prompts/57-s-match-robusto.md, P57).
```

## ADR #020

- **ADR #020** ✅ — Import selectivo por defecto: solo cardio que matchea historial o
  actividades conocidas; "importar todo" es opt-in. Motivo: pedido explícito del owner
  ("no se trata de importar todo") + costo Spark. Implementado en P47.
  _Nota al pie (P66e): el proyecto pasó a Blaze; su nivel gratuito tiene los mismos topes,
  así que el motivo de costo sigue en pie._

## ADR #021

- **ADR #021** — El enriquecimiento biométrico es **post-hoc e idempotente**: re-importar
  el mismo ZIP no duplica ni pisa biometría con datos peores (si el Historial ya tiene
  `granularidad: "serie"`, no se degrada a "sesion").

## ADR #022

- **ADR #022** ✅ — Recomendaciones client-side, puras y explicables: cada recomendación
  muestra su porqué ("FC reposo +6 bpm vs tus últimas 4 semanas"). Nada de caja negra.

## ADR #023

- **ADR #023** ✅ — Sin colección nueva para recomendaciones (costo Spark, son derivables).
  Cálculo al vuelo en el cliente. Descarte del día en `localStorage` (`rec-descartada-{miembro}-{fecha}`).
  Si a futuro hace falta trackear `aplicada`, se revisa el ADR.
  _Nota al pie (P66e): el proyecto pasó a Blaze; su nivel gratuito tiene los mismos topes,
  así que el motivo de costo sigue en pie._

## ADR #024

- **ADR #024** ✅ — VR como intervalos: las sesiones VR se modelan con
  `PrescripcionCardio` formato `"Intervalos"` (`rondas` = series, `trabajoSeg`/
  `descansoSeg` por serie, `juegoSugerido` para el chip) en vez de extender el
  modelo. Las imágenes de juegos son SVG originales locales (`public/vr/`) por
  copyright — nada de carátulas ni screenshots de marketing. Implementado en P51b.

## ADR #025

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
  01/10: descartada — ver ESTADO §5 (no es lo que usa Samsung)
  **Cerrado en P97 (01/10/2026): el "220 − edad" queda descartado.** Motivo:
  Samsung calcula su FC máxima con un modelo propio (edad, altura, peso y
  mediciones del reloj) que no sigue los picos —ya hubo sesiones con 170 y sigue
  en 169—, y el SDK no expone ni ese valor ni las zonas: solo la fecha de
  nacimiento, y sin fecha de cambio. La FC máxima pasa a ser un valor declarado,
  con su origen, y las zonas salen de ella con la convención de Samsung (ADR #045).
  El respaldo de `derivarZona` sin `zonasFC` ya no usa las bandas sin redondear:
  usa la misma función que todo lo demás, `zonasDesdeFcMax`.

## ADR #026

```
#026 [2026-09-14] Toda actividad de Samsung Health entra al historial
  Contexto: el ADR #020 estableció el filtro de relevancia de importSelectivo.ts,
  que descarta en silencio toda actividad sin match. Con uso real del reloj esa
  política pierde entrenamientos legítimos: lo descartado no deja rastro.
  Decisión: no descartar, clasificar. Tres destinos, siempre exactamente uno:
    (a) matchea una sesión ShapeUp → enriquece ese Historial, no crea entrada;
    (b) no matchea y dura ≥ umbral → Historial nuevo con tipo: "externa";
    (c) no matchea y no llega al umbral → listada como descartada VISIBLE,
        con el motivo (no se borra: bajar el umbral después la recupera).
  Historial.tipo suma "externa". Umbral 15 min configurable en /config/import
  junto con la lista de actividades (hoy ACTIVIDADES_SIEMPRE_RELEVANTES y
  DURACION_MIN_ACTIVIDAD_MIN=10 son constantes hardcodeadas).
  Idempotencia por datauuid: el id de la entrada externa se deriva del
  identificador de Samsung, misma estrategia que idMetrica (ADR #016).
  Racha del plan (sólo sesiones ShapeUp) y días activos (todo) como dos
  métricas separadas.
  Consecuencia: todo cálculo derivado del historial (racha, adherencia,
  vecesEntrenada, tonelaje, progresión) debe filtrar por tipo de forma
  explícita, con tests que lo garanticen ESCRITOS ANTES de la ingesta (P74
  antes que P75). El ADR #020 queda ACOTADO, NO REVERTIDO: su lógica de
  relevancia pasa a decidir visibilidad, no persistencia.
  Plan: docs/ROADMAP-producto.md, bloque 5. Prompt de origen: P66.
```

## ADR #027

```
#027 [2026-09-14] La sustitución de ejercicios se calcula, no se declara
  Contexto: BloqueEjercicio.alternativas, Ejercicio.progresiones y
  Ejercicio.regresiones están en el modelo pero vacíos en los 873 ejercicios
  del catálogo (verificado: 0 fichas los tienen), y ningún script los puebla.
  Decisión: los candidatos se derivan en tiempo real de patron,
  grupoMuscularPrimario, mecanica, equipo y nivel, más el historial del
  miembro, en un módulo puro (lib/sustitucion.ts, ADR #009) con los pesos en
  constantes nombradas al principio del archivo. Los campos declarativos
  quedan sin uso hasta que algo los pueble.
  Consecuencia: la calidad de la sustitución depende de la calidad del
  catálogo — de ahí que la auditoría de traducciones (404/873 marcadas
  "pendiente" en el seed) sea precondición y no un extra. Se registra la
  posición del candidato elegido en el ranking (BloqueRegistro.rankingSustituto)
  para poder evaluar el algoritmo con datos reales: si siempre se elige el
  tercero, el orden está mal.
  Plan: docs/ROADMAP-producto.md, bloque 3. Prompt de origen: P66.

  Nota de numeración: P66 pidió estos dos ADRs como #025 y #026 ("el último
  conocido es #024"). #025 ya estaba tomado por la spec del match biométrico
  (P57), citada desde CLAUDE.md y desde esta misma bitácora, así que se
  registraron corridos a #026/#027 en vez de pisar una referencia viva. Ver
  docs/reportes/roadmap-informes-P66.md §12.1. P66b confirmó el corrimiento: sus ADRs son
  #028 y #029.
```

## ADR #028

```
#028 [2026-09-14] La app es la única fuente de qué ejercicio fue
  Contexto: el reloj usa UN solo workout custom ("Shape up") para todo, así que
  el export no distingue fuerza de VR: mismo custom_id, misma actividad. Se
  evaluaron dos formas de que Samsung aportara el ejercicio — un diccionario
  juego→ejercicio en el import, y un segundo workout nombrado "ShapeUp VR" en
  el reloj.
  Decisión: ambas se rechazan. La app dice QUÉ ejercicio fue; Samsung dice
  CUÁNTO costó (intensidad, duración, FC); el match por hora los une. Nunca se
  infiere el ejercicio desde Samsung. El precedente es el bug del mapeo 1001
  (P55): inferir desde el export ya salió caro una vez.
  Consecuencia: una sesión jugada sin abrir la app antes queda como entrada
  externa ambigua (ADR #026) y se resuelve a mano con el "enlazar" del bloque 5.
  Se acepta ese costo antes que adivinar. El pool de match por custom_id tolera
  30 min de Δinicio (ADR #025), así que abrir la rutina antes de jugar alcanza.
  Plan: docs/ROADMAP-producto.md, bloque 9. Prompt de origen: P66b.
```

## ADR #029

```
#029 [2026-09-14] El programa es una cola y el atraso se mide en semanas de ciclo
  Contexto: proximaSesion cuenta las sesiones de la semana por orden e ignora
  diaSemana (lib/proximaSesion.ts); el conteo se reinicia cada lunes y no queda
  registro de lo incumplido. Programa.duracionSemanas está declarado y nadie lo
  lee.
  Decisión: el programa es una cola sin fechas — hacés la siguiente sesión
  cuando podés, diaSemana queda como etiqueta informativa. El atraso se expresa
  como semanas de ciclo completadas contra transcurridas ("vas por la semana 3 y
  transcurrieron 5"), con tope y oferta de reiniciar el ciclo — NUNCA como
  sesiones pendientes acumuladas, que crecen sin techo hasta ser impagables.
  La descarga se dispara por carga real, no por calendario: una semana cuenta
  como semana de carga con ≥75% de las sesiones no opcionales completadas; a las
  cuatro semanas de carga se PROPONE descarga (nunca se aplica sola), que
  recorta 40% de las series redondeando hacia abajo, mínimo una serie por
  ejercicio, manteniendo la carga.
  Consecuencia: duracionSemanas pasa a usarse, y el estado de ciclo (inicio,
  semanas de carga, última descarga, descarga activa) vive en el PERFIL DEL
  MIEMBRO, no en el programa, porque los programas son plantillas compartidas.
  Los días con opcional: true no cuentan como incumplidos en ninguna de las dos
  cuentas.
  Plan: docs/ROADMAP-producto.md, bloque 10. Prompt de origen: P66b.
```

## ADR #030

```
#030 [2026-09-14] Cambiar el día no genera deuda
  Contexto: con la cola del ADR #029, cambiar la rutina de un día (tocaba tren
  inferior y se hizo VR, otra rutina o una sesión libre) podía resolverse de
  tres maneras: trabando la rutina prevista adelante, arrastrando ejercicios
  sueltos al día siguiente, o manteniendo un cajón de pendientes con caducidad.
  Decisión: el plan avanza. La rutina prevista se hace en la próxima vuelta de
  la cola. Se registran rutinaPrevista, rutinaRealizada (hoy Historial.idRutina,
  o tipo "libre") y un motivo opcional, y se miden por separado ADHERENCIA
  (entrenaste) y COBERTURA DEL PLAN (hiciste lo que el plan pedía). Sin deuda a
  nivel ejercicio ni pendientes: arrastrar un empuje al día de piernas rompe el
  split, y lo salteado por dolor es justo lo que no debe reaparecer mañana.
  Dentro de la sesión siguen sustituir (bloque 3) y saltar (bloque 1).
  Consecuencia: el patrón de esquive queda en los datos y alimenta el análisis,
  en vez de trabar la app. A la tercera repetición sobre la misma rutina, el
  sistema lo señala como información sobre el plan, no como reproche. La
  propuesta de descarga (ADR #029) mira la cobertura antes de hablar: mucho
  cambio con 75% cumplido sugiere revisar el plan, no descargar.
  Plan: docs/ROADMAP-producto.md, bloque 11. Prompt de origen: P66c.
```

## ADR #031

```
#031 [2026-09-14] La serie H arranca por puente de archivos, no por cascarón nativo
  Contexto: P61 (docs/prompts/61-h0-plan-serie-h.md, nunca aplicado) propuso
  Capacitor + Health Connect asumiendo Spark y sin backend. Hoy hay Health Sync
  pago exportando a Google Drive en segundo plano (CSV de salud; actividades en
  FIT/TCX/GPX/CSV) y Blaze habilitado con alertas de presupuesto.
  Decisión: el camino primario es leer desde la PWA los archivos que Health
  Sync deja en Drive, al abrir la app, procesando lo nuevo y marcando lo
  procesado. Plan B: Intervals.icu vía proxy en una function (CORS). Plan C: el
  cascarón de P61, que queda como antecedente y no como plan vigente. Ningún
  diseño de adaptador se compromete antes del reporte del spike H1′ (curva de
  FC por sesión, identificador estable, frecuencia de escritura, FC de reposo
  y HRV). Riesgos a confirmar: revocación de refresh tokens a los 7 días con la
  app OAuth en Testing, y drive.readonly como alcance restringido.
  Consecuencia: la premisa "sin backend, proyecto en Spark" de P61 queda
  revisada. La clave determinista compartida entre ZIP y Drive se define con
  los archivos del spike a la vista: ambas vías deben producir exactamente el
  mismo id (ADR #026). El import por ZIP no se elimina. Los números de ADR que
  P61 proponía (#026–#029) nunca se registraron y hoy están ocupados por P66 y
  P66b — P61 no debe re-aplicarse tal cual.
  Plan: CLAUDE.md, sección "Serie H". Prompt de origen: P66c.
```

## ADR #032

```
#032 [2026-09-15] Taxonomía de vías de ingesta de Samsung Health
  ESTADO: SUPERSEDED por #036 (2026-09-15, P66f) — H2 dio positivo y la vía D
  está verificada. El cuerpo se conserva sin cambios: el razonamiento que
  descarta B y C sigue valiendo.
  Contexto: el 14/09/2026 se auditó la misma sesión de fuerza por la vía ZIP y
  por la vía Drive (docs/reportes/roadmap-informes-P66.md §15). Health Connect publica 2
  muestras de FC de una sesión para la que el propio ZIP declara
  heart_rate_sample_count = 12839, y un reexport 82 min después sigue igual
  (§15.4): no es retraso de publicación.
  Decisión: se identifican cinco vías y se clasifican por DÓNDE LEEN, no por el
  transporte:
    A  Health Sync → Google Drive          lee Health Connect     en uso, automática, TOPEADA
    B  Intervals.icu                        lee Health Connect     descartada, mismo techo
                                            (vía Health Sync)
    C  Cascarón Capacitor + plugin de       lee Health Connect     descartada, mismo techo
       Health Connect
    D  App Android + Samsung Health         lee la app de          ABIERTA, SIN VERIFICAR
       Data SDK                             Samsung Health
    E  App Wear OS + Samsung Health         lee el sensor          descartada por costo
       Sensor SDK                           del reloj
  B y C quedan descartadas por el origen: si Health Connect no tiene las
  muestras, ningún consumidor de Health Connect las va a tener. Evidencia:
  §15.4 más el heart_rate_sample_count del ZIP.
  La vía D NO está descartada y NO está verificada: lee directo de la app de
  Samsung Health, no de Health Connect, y su modelo expone ExerciseSession.log
  (lista de ExerciseLog con los puntos medidos durante la sesión). Su
  viabilidad se decide en H2 (verificación manual con DataViewer) y, si H2 da
  positivo, en P88′ (docs/prompts/88prima-poc-data-sdk.md).
  Mientras D no esté resuelta, el ZIP es la vía de la curva. Se registra como
  estado actual, no permanente: si D funciona, este ADR se supersede.
  Lo que hoy se pierde por la vía A en sesiones de fuerza: la curva completa,
  la FC media y máxima reales, la FC mínima, el nombre del workout, la
  distinción activo/transcurrido, recuperacionBpm por serie, fcPico,
  fcFinSerie y la recuperación entre rondas del bloque 9.4.
  Consecuencia: revisa el ADR #031, que ponía Intervals.icu como plan B y el
  cascarón de Health Connect como plan C; los dos quedan descartados. OJO: la C
  descartada es Capacitor leyendo Health Connect; la D es leer el Data SDK
  (con o sin Capacitor encima). No confundirlas.
  Plan: docs/reportes/roadmap-informes-P66.md §15. Prompt de origen: P66e.
```

## ADR #033

```
#033 [2026-09-15] Clave canónica de actividad
  Contexto: el bloque 5 (ADR #026) derivaba el id de la entrada externa del
  datauuid, que no viaja por la vía Drive (§15.7: ningún archivo de Drive tiene
  identificador por registro).
  Decisión: la clave es INICIO EN EPOCH UTC CON MILISEGUNDOS + TIPO
  NORMALIZADO + appId. Verificado: ZIP, Drive y vía D entregan 1789418092506
  para la misma sesión (start_time del ZIP, TCX de Drive, SDK). Sin
  tolerancia, sin ventana, comparación exacta. El datauuid baja de clave
  primaria a metadato (por la vía D viaja como uid, idéntico al del ZIP;
  §15.8).
  El tipo no se usa crudo. Cada vía tiene su vocabulario y se normaliza antes
  de componer la clave:
    ZIP                    Drive       Vía D      Normalizado
    exercise_type = 0      TRAINING    OTHER      otro
    exercise_type = 1001   WALKING     WALKING    caminata
  "otro" significa SIN CLASIFICAR POR SAMSUNG, no fuerza. Samsung no dice
  "esto fue fuerza": dice "esto no es ninguno de los deportes que reconozco".
  Fuerza y VR usan el mismo workout custom y llegan con el mismo tipo por las
  tres vías, así que ninguna vía de Samsung puede decir cuál de las dos fue.
  Lo decide ShapeUp, por el match con la sesión propia (ADR #028). P75 NO
  PUEDE tratar "otro" como fuerza.
  Opción anotada, no tarea: la vía D trae customTitle ("ShapeUp"). Si en el
  futuro se crea un segundo workout custom con otro nombre para VR, ese campo
  separa los dos casos en el origen.
  La tabla es por observación y está abierta. Ante un tipo no mapeado el
  adaptador PARA Y REPORTA: no adivina ni cae a un default. La tabla vive junto
  al adaptador, no dispersa.
  appId y tabla de fuentes. §15.9 muestra dos registros de composición
  corporal con el mismo startTime y distinto appId (la misma medición de la
  balanza entrando por dos puentes, Garmin Connect y Health Sync) y dos
  aparatos que miden lo mismo con métodos distintos. Inicio + tipo los
  colapsaría a todos en uno, con un resultado que depende del orden de
  llegada. La regla NO es una jerarquía de aplicaciones: privilegiar
  com.sec.android.app.shealth descartaría la medición de la balanza, que es
  real y Samsung nunca tomó. Dos niveles:
    Nivel 1 — la clave. appId forma parte de la clave canónica. Nada se pisa
    al guardar; la deduplicación opera solo dentro de un mismo appId.
    Nivel 2 — tabla de fuentes, declarada y versionada. Cada appId se declara
    como ORIGEN o PUENTE, con la fuente de medición que representa, un orden
    de preferencia entre los puentes de una misma fuente y los campos que esa
    fuente escribe pero no mide:
      appId                                   fuente   rol     pref.  excluye
      com.sec.android.app.shealth
        + deviceId 9XdbeBZKBf                 reloj    origen  —      weight
      nl.appyhapps.healthsync                 balanza  puente  1      —
      com.garmin.android.apps.connectmobile   balanza  puente  2      —
    - Mismo inicio y MISMA fuente de medición: es la misma medición. Entra el
      puente de preferencia más alta disponible y el resto se descarta.
    - Mismo inicio y DISTINTA fuente: son dos mediciones distintas y conviven,
      en series separadas.
    - appId que no está en la tabla: el adaptador PARA Y REPORTA. No adivina
      si es origen o puente.
    La preferencia es un orden, no una lista negra: si Health Sync deja de
    escribir, el registro de Garmin entra solo y el peso se sigue guardando.
    Una lista negra de com.garmin.android.apps.connectmobile lo habría
    descartado en silencio.
    Exclusión por campo: hoy hay una sola, weight en la fuente reloj, porque
    el reloj hereda el peso del perfil (§15.9). Se declara, no se infiere.
  La duración NO forma parte de la clave ni sirve para comparar entre vías: el
  CSV y el TCX de Drive dicen 4169 s y el FIT dice 4170.
  Consecuencia: el "idempotencia por datauuid" del ADR #026 queda reemplazado
  por esta clave; el riesgo central de la serie H (dos ids para el mismo hecho)
  se resuelve acá. P75 define el tipo normalizado, por eso P89 depende de P75.
  Plan: docs/reportes/roadmap-informes-P66.md §15.2, §15.8 y §15.9. Prompt de origen: P66e.
  Enmienda (P66f, 2026-09-15): la tabla de tipos pasa a tres columnas con el
  vocabulario de la vía D; el tipo normalizado del workout custom pasa de
  "fuerza" a "otro" (Samsung no distingue fuerza de VR); appId entra en la
  clave, con tabla de fuentes (rol, preferencia, exclusión por campo), y
  customTitle queda anotado como discriminador futuro. Motivo: resultado de
  H2 (§15.8) y composición corporal con tres escritores (§15.9). Ver §16.9
  sobre cómo producir appId desde las vías que no lo entregan.
```

## ADR #034

```
#034 [2026-09-15] Precedencia por procedencia del dato
  Contexto: la vía Drive entrega ceros que significan "no hay dato" (masas de
  composición corporal, calorías activas diarias; §15.7) y estadísticas de FC
  derivadas de dos puntos disfrazadas de resumen (§15.3).
  Decisión: dos reglas, en este orden:
    1. Ningún cero se escribe. Un 0.0 que significa "no hay dato" se convierte
       en campo ausente. Esa conversión es responsabilidad del ADAPTADOR, que
       la hace antes de pasar el objeto a stripUndef. stripUndef sólo saca
       claves undefined (import/samsungHealth.ts:194-199) y NO convierte
       ceros: es el último paso, no la regla. Sin esta regla, sincronizar Drive
       después de subir el ZIP pisa la composición corporal buena con ceros.
       Ejemplo medido: por la vía D, la sesión de fuerza trae count = 0,
       distance = 0.0 y maxSpeed = 0.0 (§15.8). Es el caso exacto que la regla
       tiene que atrapar.
    2. Ningún dato derivado pisa un dato medido. Antes de persistir
       estadísticas de FC, el adaptador calcula la densidad de muestras de la
       sesión (muestras / segundos) y, si cae debajo del umbral, marca los
       campos de FC como ausentes en vez de escribirlos.
  Umbral: 0,1 muestras por segundo. Las sesiones con curva dan ~0,7/s y la
  sesión de fuerza por Drive da 0,0005/s. Se eligió densidad y no una regla
  por tipo de actividad para que siga funcionando sin cambios si Samsung
  empieza a publicar la curva.
  Consecuencia: con estas dos reglas el orden de llegada de las vías deja de
  importar.
  Plan: docs/reportes/roadmap-informes-P66.md §15.3, §15.7 y §15.8. Prompt de origen: P66e.
  Enmienda (P66f, 2026-09-15): la regla 1 describía la conversión de ceros
  como si stripUndef ya la hiciera; no la hace. Se corrigió: la conversión es
  del adaptador y stripUndef es el último paso. Se agregó como ejemplo medido
  los ceros de la vía D (count, distance, maxSpeed).
```

## ADR #035

```
#035 [2026-09-15] Sesiones autodetectadas sin curva
  Contexto: el bloque 5 (ADR #026) dice que toda actividad de Samsung entra al
  historial. El ZIP del 14/09 tiene seis filas de ejercicio y Drive cuatro; las
  dos extra son tipo 1001 con milisegundos en .000, live_data_internal vacío y
  ningún campo de FC, y una se solapa casi por completo con una caminata real
  (§15.5).
  Decisión: una sesión es AUTODETECTADA SIN CURVA cuando su densidad de
  muestras de FC está por debajo del umbral del ADR #034 (0,1/s). Vale igual
  para ZIP y para la vía D. El #035 no define criterio propio.
    - Si se solapa en el tiempo con otra sesión que sí tiene curva, se
      descarta: es la misma actividad contada dos veces por dos fuentes.
    - Si no se solapa con ninguna, se ingiere marcada como autodetectada, con
      la misma marca "sin detalle" que usa la carga manual del bloque 6.
  Nunca se fusionan dos filas en una: se descarta o se ingiere marcada.
  Revisión pendiente: la decisión se tomó en la sesión de diseño y conviene
  revisarla. La alternativa era ingerir siempre y resolver el solapamiento en
  la vista; se eligió descartar. Motivo: una caminata contada dos veces no
  afecta el tonelaje —las entradas externas no lo tienen— ni la propuesta de
  descarga del 10.3, que se calcula por porcentaje de sesiones completadas.
  Lo que infla son los días activos, los minutos y las kcal, que son las tres
  señales que alimentan la vista de historial y el análisis.
  Evidencia de PU1 del puente (vía D, 14/09):
    - autoDetected viene true en las cinco caminatas, incluidas las tres
      reales del reloj. Marca "arrancada automáticamente", no "fantasma".
    - Las dos autodetectadas del teléfono no tienen el log vacío: tienen 12 y
      13 entradas.
    - deviceId DQLXfARDMe es el teléfono. También escribe la sesión de
      ShapeUp y los registros de Health Sync, así que no separa nada. El
      reloj es 9XdbeBZKBf.
    - Lo que separa limpio es la densidad:
        Sesión (UTC)          Dispositivo   logSize   Densidad
        14:16:30              reloj           505     0,77/s
        14:57:05              teléfono         12     0,018/s
        15:48:51              reloj           645     0,83/s
        15:50:04              teléfono         13     0,018/s
        17:13:15              reloj           677     0,83/s
        20:34:52 (ShapeUp)    teléfono       4133     1,00/s
  Plan: docs/reportes/roadmap-informes-P66.md §15.5 y §15.8; docs/ROADMAP-producto.md, bloque 5. Prompt de origen: P66e.
  Enmienda (P66f, 2026-09-15): se reemplazó el motivo, que atribuía el daño al
  tonelaje y a la descarga (ver docs/reportes/roadmap-informes-P66.md §16.3), y se agregó
  el discriminador de la vía D. La decisión no cambia.
  Enmienda (P66g, 2026-09-16): el criterio pasa a ser la densidad del ADR
  #034; se abandonan live_data_internal vacío, deviceId y log vacío como
  discriminadores, porque PU1 mostró que no separan. Se reemplazó el párrafo
  del discriminador de la vía D por la evidencia de PU1. Solapamiento, no
  fusión y revisión pendiente, sin cambios.
```

## ADR #036

```
#036 [2026-09-15] La vía D está verificada y pasa a ser el camino objetivo
  Supersede: #032 (su cuerpo se conserva; el descarte de B y C sigue valiendo).
  Contexto: H2 (15/09/2026). DataViewer del Samsung Health Data SDK 1.1.0 con
  el modo desarrollador de lectura. La sesión de referencia devuelve el mismo
  uid que el datauuid del ZIP, mismo inicio y fin, 4133 puntos de curva, FC
  máxima 174,0, 604,0 kcal, duración activa 4152 s y customTitle "ShapeUp"
  (docs/reportes/roadmap-informes-P66.md §15.8).
  Decisión: el Samsung Health Data SDK entrega la curva completa de sesiones
  de ejercicio custom, con el mismo identificador y los mismos valores que la
  exportación manual. La vía D deja de ser una hipótesis abierta y pasa a ser
  el camino objetivo para todo lo que hoy es exclusivo del ZIP en materia de
  ejercicio.
  Lo que la vía D reemplaza del ZIP: curva de FC, FC media y máxima reales,
  nombre del workout, sesiones autodetectadas, distinción entre duración
  activa y transcurrida, recuperacionBpm derivable, fcPico, fcFinSerie y la
  recuperación entre rondas del bloque 9.4.
  Lo que no cambia:
    - B y C siguen descartadas, por el motivo del #032: leen Health Connect.
    - La vía A (Drive) NO se retira. Es la única automática hoy, cubre cardio,
      pasos, sueño y FC pasiva a cadencia diaria, y no requiere app nativa. La
      D la complementa en el hueco que A no cubre; no la sustituye.
    - El ZIP deja de ser necesario para el ejercicio Y para la composición
      corporal (§15.9). Queda como respaldo y artefacto de archivo, no como
      vía de ingesta.
    - Health Sync sigue siendo necesario aunque se adopte la D: no por el
      ejercicio, sino porque es el puente que mete la medición de la balanza
      en Samsung Health. Adoptar la D reduce la dependencia de la vía A a
      cardio, pasos, sueño y FC pasiva; no la elimina.
  Costo, registrado sin resolver: el SDK es una librería Android. Exige app
  nativa (Capacitor + plugin en Kotlin), entorno de compilación Android e
  instalación por fuera de la Play Store en cada teléfono. Ese costo no estaba
  en el plan, y la decisión de pagarlo se toma en la conversación de diseño.
  ESTE ADR REGISTRA QUE EL CAMINO EXISTE Y FUNCIONA, NO QUE SE HAYA DECIDIDO
  TOMARLO.
  Consecuencia: P88′ pasa de "averiguar si existe" a "medir cuánto cuesta y si
  es estable sin intervención". Su prompt (docs/prompts/88prima-poc-data-sdk.md)
  no se modifica: H2 ya cumplió el criterio de éxito, y la fricción operativa
  ya está en su entregable. P89 (H3) queda bloqueado por P75 y P88′. Hasta que
  la D se construya, la única vía implementada de la curva sigue siendo el
  import del ZIP (docs/reportes/roadmap-informes-P66.md §16.13).
  Plan: docs/reportes/roadmap-informes-P66.md §15.8 y §15.9. Prompt de origen: P66f.
```

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

**Redacción anterior (MAPEO §5)**

```
#037 [2026-09-21] La racha se deriva, nunca se acumula (P77a)
  Contexto: la adherencia necesitaba serie semanal, racha activa, récord y tasa
  de 8 semanas. La alternativa era un contador en Firestore.
  Decisión: todo se RECALCULA del historial cada vez que se muestra. No se
  guarda ningún contador, y no hay que agregarlo.
  Motivo: un contador se desincroniza con la primera corrección de datos, y en
  este proyecto ya hubo tres — el mapeo del código 1001 (S-fix/P55), los
  fragmentos de sueño sin consolidar (lib/sueno.ts) y el corrimiento de 3 h del
  start_time del ZIP (P76a, 2562 documentos). Cualquiera habría dejado un
  contador mintiendo para siempre, sin forma de notarlo.
  Se cuentan DÍAS, no sesiones. La meta sale del plan (días no-descanso) y
  PerfilMiembro.metaSemanalDias la pisa. La semana en curso no rompe la racha.
  Nunca se muestra "0 semanas de racha": si se cortó, se muestra el récord.
  La caché de P77b (lib/cacheDiasActivos.ts) no es una excepción: guarda
  LECTURAS de semanas cerradas, no un contador. Si se borra, el resultado es
  idéntico, solo que más lento. Texto completo en CLAUDE.md.
```

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

**Redacción anterior (MAPEO §5)**

```
#038 [2026-09-21] El enriquecimiento se versiona (P79, enmienda el #021)
  Contexto: para no pisar un dato fino con uno grueso, calcularEnriquecimiento
  omitía TODA sesión con granularidad "serie". Consecuencia no vista hasta P79:
  una sesión ya enriquecida NUNCA recibía un algoritmo nuevo. Las de antes de
  P78 no iban a tener cobertura, tramos ni recorte por más que se reimportara.
  Decisión: BiometriaSesion.versionEnriquecimiento + la constante
  VERSION_ENRIQUECIMIENTO en lib/matchBiometrico.ts. Ausente se lee como 1;
  P78 es la 2, P79 la 3, P80 la 4. Se omite SOLO si granularidad === "serie" Y
  la versión está al día. Nunca se pisa fino con grueso: si está desactualizada
  pero la corrida no trae curva, se deja y se cuenta en `preservadas`.
  CADA CAMBIO AL ALGORITMO SUBE LA CONSTANTE. Si no, no llega a lo ya escrito.
```

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

**Redacción anterior (MAPEO §5)**

```
#039 [2026-09-21] La progresión de VR se deriva del historial; la rutina nunca se muta (P79)
  Contexto: aceptar "recortar descanso" o "sumar ronda" tenía que cambiar algo.
  Decisión: /rutinas NO se toca — es compartida por la familia, y cambiarla por
  la progresión de un miembro se la cambia a todos. Tampoco hay override por
  miembro, que sería el contador acumulado que el #037 prohíbe.
  BloqueRegistro.prescripcionUsada guarda los parámetros CON LOS QUE SE JUGÓ.
  La próxima sesión arranca con los de la última de ese miembro con esa rutina
  y ese juego, más el ajuste si se aceptó. La clave es (miembro, idRutina,
  idEjercicio del bloque VR): si se sustituyó el juego (P73), es otro juego con
  su propia historia. La sesión corre sobre una rutina efectiva, que es copia.
  Dos principios que van con esto:
    - El sistema decide solo con lo que MIDE. dificultadPercibida se registra
      al cerrar y no entra en ninguna regla; hay un test que lo fija. Sin nada
      medido, sugerirProgresionVR devuelve palanca: null —que NO es
      "mantener"— y la UI ofrece las opciones en vez de inventar.
    - La FC de sesión no sirve: promedia los descansos y queda por debajo. Se
      usa la FC DE TRABAJO, el promedio de las rondas ponderado por duración y
      solo de las que midieron bien (fcDudosa marca las que tienen artefactos).
```

**Enmendado por el ADR #046 (P98, 02/10/2026)** en dos puntos. La rutina sigue sin mutarse: las subidas de escalón van en `perfiles.{miembro}.subidasVR[]` y el escalón actual se deriva. Y la FC media de toda la ventana sí vale como evidencia cuando se compara contra el mismo escalón y el mismo modo, donde la estructura de descansos es la misma; la objeción de este ADR era contra una zona objetivo absoluta.

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

**Redacción anterior (MAPEO §5)**

```
#040 [2026-09-21] En VR la completitud se mide por TIEMPO, no por rondas (P80)
  Contexto: las cuatro rutinas de VR daban siempre "mantener" porque ninguna
  sesión completaba sus rondas. La causa no era la regla: con el casco puesto
  no se ve el teléfono. Se juega de corrido 30 minutos y no se marca nada. Las
  sesiones estaban completas; el registro no.
  Decisión: completa = llegar al 90 % del objetivo de tiempo
  (FRACCION_TIEMPO_COMPLETO). Las rondas afinan la medición pero NO deciden la
  completitud. El objetivo sale de la rutina (tiempoObjetivoMin): Continuo lo
  declara, Intervalos lo dice en rondas × trabajoSeg.
  El tiempo real es la ventana de la app MENOS las pausas. Sin ventana cae a la
  suma de las rondas válidas, y ahí las pausas NO se restan: sumar duraciones ya
  deja los huecos afuera (restarlas dos veces daba 3 min donde había 32).
  El `modo` se DERIVA, no se elige: "rondas" con al menos dos descansos
  medibles, "tiempo" si no. La forma que se ofrece primero sale de la última
  sesión de esa rutina.
  De corrido la escalera es subir-dificultad → sumar-tiempo → cambiar-juego: no
  hay descanso que recortar ni recuperación entre rondas que medir, así que la
  regla 3 solo decide en modo rondas.
  La sesión por tiempo registra UNA sola ronda, la que abarca toda la sesión.
  No es inventada: es lo que pasó, y es lo que sella la ventana (#019).
  Hallazgo abierto: la ventana derivada de las series venía midiendo entre 10 y
  24 minutos menos que duracionRealMin en las cinco sesiones con ventana, porque
  empieza en la primera ronda marcada y termina en la última. Una (14/09) tenía
  9 minutos de ventana contra 33 cronometrados: su primera serie no tiene
  inicioMs. Prompt de origen: docs/prompts/80-vr-por-tiempo.md.
```

**Enmendado por el ADR #046 (P98, 02/10/2026)**: en las rutinas de VR por escalones **el modo se elige** al empezar y queda guardado en la sesión; no se deriva. Para las rutinas viejas, la app ya lo ofrecía y lo guardaba en `prescripcionUsada.modo` desde P80.

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

**Redacción anterior (MAPEO §5)**

```
#041 [2026-09-21] Lo que cuenta como entrenamiento es una lista POSITIVA (P81)
  Contexto: esShapeUp era `tipo !== "externa"`. Con esa forma, cualquier tipo
  nuevo empezaba a contar como entrenamiento por omisión: los juegos de VR que
  se registran pero no son ejercicio se habrían metido solos en la racha, la
  meta, la adherencia, el tonelaje y la progresión.
  Decisión: esShapeUp pasa a `tipo === "rutina" || tipo === "libre"`. Lo que
  cuenta se declara.
  Enriquecerse y contar son DOS PREGUNTAS DISTINTAS, y el código lo dice con dos
  nombres: seEnriquece(h) (rutina, libre o juego) gobierna el enriquecimiento y
  la clasificación del import; esShapeUp(h) gobierna toda métrica de plan o
  progresión. Un juego no cuenta, pero su FC es lo único que puede decir si ese
  juego mueve a alguien.
  El test de aislamiento va ANTES que el tipo nuevo, y se verifica que falle con
  la definición vieja: con la negativa fallaban 7 de 12.
  Un juego no entra en racha, meta, adherencia, tasa, tonelaje, progresión, PR,
  días de movimiento, chips ni totales de Progreso. Sí entra en el historial
  (con chip "Juego"), en el enriquecimiento y en el análisis.
  La lista vive en /config/diccionarios.juegosSinEjercicio, la edita solo el
  owner por las reglas ya existentes, y sacar un juego NO borra sus sesiones:
  por eso la sesión guarda nombreJuego y no un id.
  Las kcal de los juegos no se muestran: en actividades de brazos el reloj las
  infla (roadmap §9.5), y un número que sabemos que está mal es peor que ninguno.
  Consecuencia que no estaba a la vista: la consulta de /historial filtraba
  tipo in ["rutina","libre"], así que un juego no habría llegado nunca a la app.
  Ahora trae los tres tipos y la función se llama getHistorialEnLaApp.
  Prompt de origen: docs/prompts/81-juegos-sin-ejercicio.md.
```

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

**Invariante (P84c): la app define cuánto duró la sesión, y la ventana tiene que coincidir con
eso.** `|(finMs − inicioMs) − duracionRealMin × 60000| <= 60_000`. `inicioMs` es el arranque de
la sesión en la app y `finMs` el cierre —nunca la primera ni la última serie—, y las dos salen del
mismo par con `cierreDeSesion` (`lib/metricas.ts`) en todos los caminos de guardado. Sin ventana
explícita, `finalizarSesion` **ancla en el fin y resta la duración** (`resolverVentana`), nunca al
revés. Tests en `data/historial.ventana.test.ts`, uno por tipo.

**Redacción anterior (MAPEO §5)**

```
#042 [2026-09-22] La app define cuanto dura la sesion; el reloj aporta los datos (P83)
  Regla del owner, y es la de P78 llevada hasta el final: "en la app el inicio y
  el fin en general son mas amplios, y esta bien. En Health a veces sin querer
  lo paro, o queda corriendo. El que marca de cuanto tiempo es la sesion es la
  app, y Health aporta los datos."
  Contexto: elegirTramosAdicionales exigia que un tramo cayera al 80 % adentro
  de la ventana (SOLAPE_TRAMO_MIN) para sumarse a la agregacion.
  Decision: se ELIMINA el umbral. Alcanza con que el tramo toque la ventana.
  Por que el umbral no protegia nada: su motivo era que un workout de tres horas
  sin cortar no entrara y arrastrara la FC de todo el rato que el reloj siguio
  grabando. Eso ya lo resuelve construirBiometriaDeTramos aguas abajo: recorta
  cada tramo a la ventana con interseccion antes de usarlo, toma solo las
  muestras de adentro, prorratea las kcal por el tiempo que solapa y marca
  kcalEstimada. El umbral no agregaba una garantia; tiraba tramos buenos.
  Caso real que lo destapo (20/09/2026): un entrenamiento, dos marcas "ShapeUp"
  en el reloj (19:48-20:11 y 20:12-20:25). La primera siguio grabando despues de
  que la app corto, caia al 11 % y se perdia entera, con los 2,6 minutos de
  curva que si estaban adentro de la ventana. La sesion pasa de tramos:1 a 2.
  Se conserva sin tocar: el ranking por Delta-inicio del #025 elige el principal
  (esto solo cambia que lo acompania); solo entran tramos marcados ShapeUp, del
  pool que ya paso el techo de 30 min; sobre ventana sintetica no se agrega
  nada; el recorte por olvido de corte (OLVIDO_CORTE_MS) sigue igual.
  Arreglo que vino con esto: duracionMedidaMin sumaba las intersecciones de cada
  tramo, asi que dos tramos que se pisan contaban dos veces el mismo minuto e
  inflaban duracion y cobertura. Ahora se calcula sobre la UNION (unionMs).
  VERSION_ENRIQUECIMIENTO sube a 5 (ADR #038).
  Prompt de origen: P83 (conversacion, sin archivo de prompt).
```

## ADR #043 — La tolerancia del 12 %: qué muestras entran, no cuánto duró (P92, 2026-09-27)

P78 recortaba la ventana de Samsung a la de la app siempre, y en el caso normal —apretar
"empezar" en el reloj unos segundos antes y "terminar" unos segundos después— recortaba por nada
y marcaba las kcal como estimadas. `TOLERANCIA_DURACION = 0.12` en `lib/matchBiometrico.ts`:

- **Se adopta la ventana del reloj entera** (sin recortar ni prorratear, kcal enteras, sin
  `kcalEstimada`) si `|durSamsung − durApp| / durApp <= 12 %` (el denominador es la app;
  `durSamsung` es la **unión** de los tramos), **y** ningún tramo termina más de
  `OLVIDO_CORTE_MS` después del fin de la app, **y** —guarda simétrica agregada en P92—
  ninguno **arranca** más de `OLVIDO_CORTE_MS` antes del inicio, **y** la ventana no es sintética.
- `biometria.ventanaAdoptada` (`'app'` · `'samsung'`) y `desfaseDuracionPct` (con signo) dicen
  por qué. `biometria.samsung` guarda lo que dice Health tal cual, al lado de lo nuestro.
- **La duración de la sesión sigue siendo la de la app.** `duracionRealMin`, adherencia y racha
  no se tocan: la tolerancia decide qué muestras entran en la biometría. El ADR #042 sigue entero.
- Con esto vienen los **minutos por zona** (`lib/minutosPorZona.ts`), de la sesión y de cada
  ejercicio, con la **regla única de zonas** (`lib/zonas.ts`: la zona es la más alta cuyo piso se
  alcanzó) que también usa `derivarZona`. Invariante: zonas + `minutosBajoZonas` +
  `minutosSinDato` = ventana. `VERSION_ENRIQUECIMIENTO` = 6.
- **P92c — la sesión testigo** (`lib/sesionTestigo.test.ts`, fixture real del 27/09 en
  `lib/__fixtures__/sesionTestigo20260927.ts`): el primer test contra una medición externa.
  Con los rangos de Samsung, las cinco zonas caen a menos de 1 min de su pantalla. El aviso de
  recorte nombra el extremo (`recorteAntesMin` / `recorteDespuesMin`, `avisoDeRecorte`) y no
  sale por menos de `UMBRAL_AVISO_RECORTE_MIN` (1 min). `VERSION_ENRIQUECIMIENTO` = 7.

## ADR #044 — Lo medido y lo interpretado no se mezclan (P93, 2026-09-30)

Es la misma familia que el aislamiento por tipo (P74) y que «el sistema decide solo con lo que
mide» (P79). El **análisis asistido** (`docs/ANALISIS-ASISTIDO.md`) funciona así:
- la app arma un paquete con los datos de una sesión (`lib/paqueteAnalisis.ts`);
- la persona lo pega en un chat;
- el JSON que vuelve se valida (`lib/validarAnalisis.ts`) y se guarda en `historial.analisis`.

Sin claves, sin servidor, sin costo: la persona es el transporte, a propósito.

- **El análisis vive en su propio campo**, se muestra etiquetado como *interpretación* con su
  fecha y su modelo, y **nunca alimenta la racha, la adherencia, el tonelaje, la progresión ni la
  meta**. Si un análisis dice que una sesión fue floja, eso no mueve un número medido.
- **Se prueba, no se promete.** `aislamiento.test.ts` calcula todas las métricas con el historial
  sin análisis y con un análisis cargado en cada sesión, y exige resultados idénticos. Si alguien
  lee `analisis` desde un cálculo, falla ahí.
- **El JSON es dato externo.** Reglas del validador:
  - `idHist` tiene que coincidir con la sesión («Este análisis es de otra sesión»);
  - todo hallazgo trae `evidencia`, o no se guarda;
  - los campos que no están en el esquema se descartan;
  - hay topes de largo y de cantidad;
  - nada se ejecuta: React escapa los textos al mostrarlos.
- **El paquete no se guarda**: se guarda con qué se armó (`armado`: versión de prompt, de esquema,
  ventana y `versionEnriquecimiento`). Es reconstruible, y si la biometría cambió la versión lo
  delata.
- **El prompt vive en el repo** (`docs/analisis/prompt-sesion-v{N}.md`) y es la fuente. Si cambia,
  se crea el archivo nuevo y sube `VERSION_PROMPT_SESION` (`lib/analisis.ts`). Vigente: **v3**
  (esquema 2). El v3 pide un análisis corto que empieza por lo que salió bien. El validador hace
  cumplir sus topes:
  - resumen de 2 o 3 oraciones;
  - hasta 4 hallazgos, 2 sugerencias y 2 preguntas;
  - las limitaciones una sola vez, en `banderas`;
  - `datosFaltantes` aparte y sin reproche;
  - nunca pedir RPE ni sensación (P79).
- **El paquete declara lo que no es de primera mano** (enmienda de P93):
  - `ventanaOrigen` vale `sesion` o `series`. El respaldo de las series va contra P84c. Si la
    duración y el tramo de las series difieren más de 12 %, va `discrepanciaDuracion` con los dos
    números, y el prompt pide no concluir de duración ni de densidad.
  - `prescripcionOrigen` vale `sesion` (hoy solo VR, `prescripcionUsada`) o `rutina-actual`, que
    es solo una referencia.
- **Nada de consejo médico**: una señal de salud va como bandera `consultar-profesional`, nunca
  como diagnóstico.
- La curva no se persiste (ADR #016): para el paquete se vuelve a leer del crudo del puente
  (`leerCurvaDeSesion`, un documento por tramo) y se descarta.
- El análisis global es P94: `semanasAnalisisGlobal` (8 por defecto) ya vive en `/config/import`.

## ADR #045 — Las zonas como las cuenta Samsung; la FC máxima es un valor declarado (P97, 2026-10-01)

92c encontró el piso de Z5 en 152 y no en 153: el seed redondeaba `169 × 0,9 = 152,1` y usaba ese
número como techo de Z4 y como piso de Z5. Las zonas guardadas se pisaban, y el editor no dejaba
guardar ningún perfil. Con los rangos de Samsung, el método ya coincidía a menos de un minuto: fallaba
el redondeo.

- **La convención de Samsung**, deducida de sus números con 169:
  - techo de Z1 a Z4 = `floor(pct × fcMax)`, con 60 / 70 / 80 / 90 %;
  - piso de la zona siguiente = techo anterior + 1;
  - piso de Z1 = `floor(50 % × fcMax)`; techo de Z5 = `fcMax`.

  Con 169: **84-101 · 102-118 · 119-135 · 136-152 · 153-169**.
- **Una sola función**, `zonasDesdeFcMax` (`lib/zonas.ts`). La usan el seed, el botón de
  Configuración, la revisión y el respaldo de `pisosDe`. No hay otra copia del cálculo.
- **Con enteros**: `Math.floor(pct × fcMax / 100)`. En punto flotante `0.7 × 170` da
  `118.99999999999999` y el `floor` lo baja a 118. Hay un test con 170.
- **El editor exige zonas contiguas**: sin pisarse, sin hueco, y sin que falte una entre dos que están.
  Si las zonas no son las de `zonasDesdeFcMax(fcMax)`, avisa sin bloquear: «Las zonas no corresponden
  a esta FC máxima». El botón «Calcular desde la FC máxima» sigue siendo explícito.
- **La FC máxima vigente es un valor declarado, con su origen** (`fcMaxOrigen`): `samsung`,
  `estimacion-shapeup`, `medida` o `edad-provisoria`. Este último es el 220 − edad del seed, y
  queda pendiente de confirmar en la primera revisión. `fcMaxDesdeMs` dice desde cuándo rige. Las
  zonas cambian **solo** cuando cambia el valor.
- **Samsung no se lee desde el puente**: el SDK no expone su FC máxima ni sus zonas. Se anota a mano
  en la revisión.
- **ShapeUp estima, pero no aplica solo** (`lib/fcMaxima.ts`):
  - mira el segundo pico más alto de la curva suavizada en las últimas 12 semanas, solo de sesiones
    con `coberturaFina >= 80 %` y sin `fcDudosa`;
  - la curva es una media móvil hacia atrás de 5 s, con al menos 4 muestras (`lib/curvaSuavizada.ts`);
    su pico se guarda al enriquecer, en `biometria.fcPicoSuavizado`;
  - la estimación **solo sube**: nunca da menos que una estimación ya registrada.
  - **sube como mucho 10 latidos por revisión.** `fcDudosa` incluye la regla del pico de P79
    (pico crudo > FC máxima vigente + 10), así que un pico real más alto queda afuera igual que uno
    falso. Se decidió dejarlo así (02/10). Lo que distinguiría un pico real de uno falso es la
    **cadencia como testigo** (backlog). La tarjeta de revisión muestra aparte las sesiones
    excluidas, con fecha, nombre, pico suavizado y motivo: «pico > vigente + 10», saltos o cobertura.
- **Revisión trimestral**: a los 3 meses del último cambio o de la última revisión, o antes si la
  estimación supera el vigente (y no es una que ya se vio). La revisión muestra tres columnas: la
  estimación con su evidencia, el vigente y el valor de Samsung. La persona elige: estimación,
  Samsung o dejar como está. Cada revisión queda en `revisionesFcMax`: qué se vio, qué se eligió y
  cuándo. Home avisa; nunca cambia nada.
- **La historia no se reescribe**: cada sesión guarda `zonasUsadas` y `fcMaxUsada`. Si se vuelve a
  enriquecer, se usan esas y no las del perfil de hoy (`perfilDeLaSesion`). **La única excepción es
  esta corrección**: el 152 era un error de redondeo, no un cambio de FC máxima. Por eso
  `VERSION_ENRIQUECIMIENTO` sube a 8, y las sesiones anteriores, que no tienen `zonasUsadas`, se
  rehacen con las zonas corregidas.
- **La sesión testigo del 27/09**, con las zonas corregidas, da las cinco zonas a menos de medio
  minuto de Samsung (Z5: 3,6 contra 4,08 min; con el 152 daba 5,2).
- **El orden importa**: `npm run corregir:zonas -- --aplicar` va **antes** de deployar la versión 8.
  Si la sincronización rehace las sesiones con las zonas viejas, quedan guardadas con esas.

## ADR #046 — Las rutinas de VR por escalones (P98, 2026-10-02)

Las cuatro rutinas de VR estaban escritas como rondas cortas con descanso, y Juan no juega así: el
análisis de P93 le marcaba como fallas cosas de la rutina («duró el doble», «una sola serie»). Y no
había ninguna regla que dijera cuándo avanzar.

- **Las rutinas se definen por tiempo.** Un bloque son, por ejemplo, 20 minutos de trabajo. Se cubre
  encadenando los entrenamientos del juego que hagan falta. Ningún bloque baja de 12 minutos.
- **Cada rutina tiene dos escaleras, una por modo**: por bloques (con descanso) o de corrido.
  - El campo `Rutina.vr` (`RutinaVR`) guarda las escaleras, las zonas objetivo, la regla, las
    alternativas de juego y, en Combat corto, a qué rutina sigue.
  - `bloques[0].prescripcion` queda con el E1 del modo por defecto, en formato `Continuo`, para que
    la Biblioteca, los programas y la duración estimada sigan andando. **No es `Intervalos` a
    propósito**: así la rutina no entra en la progresión de P79.
- **El modo se elige al empezar** y queda guardado en la sesión (`Historial.vr`), junto con el
  escalón, el juego, el escalón prescripto tal cual era y lo que se confirma al cerrar. Enmienda el
  ADR #040.
- **No se marca nada durante la sesión.** Al cerrar, la persona confirma si completó lo prescripto y
  en qué dificultad jugó (puede ser `mixto`).
- **La rutina nunca se muta** (ADR #039). Una subida aceptada se registra en
  `perfiles.{miembro}.subidasVR[]`: cuándo, de qué escalón a cuál, en qué modo y con qué datos. Es
  el registro de una decisión, no un contador (ADR #037). **El escalón actual se deriva**: es el de
  la última subida de esa rutina y ese modo, o E1.
- **La regla** (`lib/escalonesVR.evaluarReglaVR`) se evalúa por rutina, **por modo y por juego**,
  y nunca los mezcla:
  - **subir** con al menos 3 sesiones en el escalón, en al menos 2 semanas distintas, todas
    completadas, y la FC media de la última por lo menos **5 latidos** por debajo del promedio de
    las dos primeras del escalón;
  - **mantener** si la FC subió 5 o más, si no se completó en dos sesiones seguidas, si alguna no
    contó como completada o si la FC no bajó lo suficiente;
  - **sin datos suficientes** si faltan sesiones o semanas;
  - **bajar dificultad**, solo en Ritmo suave, que no tiene escalera: si la FC media pasa el techo
    de Z3 en dos sesiones seguidas.
- **La evidencia es la FC media de toda la ventana**, descansos incluidos. Vale porque se compara
  contra el mismo escalón y el mismo modo, donde la estructura de descansos es la misma. El ADR
  #039 lo prohibía contra una zona objetivo absoluta; queda enmendado para esta comparación.
- **«Completó» exige las dos cosas**: que la persona lo confirme **y** que la ventana dure al menos
  el 90 % del tiempo prescripto (bloques más descansos). **Es una excepción al principio de P79** («el
  sistema decide solo con lo que mide»): la confirmación es declarada, pero **puede frenar una
  subida, nunca causarla**. `dificultadPercibida` sigue sin entrar en ninguna regla, y su test
  sigue valiendo.
- **Fuera del cálculo**: `fcDudosa`, cobertura del reloj bajo `COBERTURA_MINIMA`, ventana de las
  series con `discrepanciaDuracion`, y sesiones sin FC media.
- **⚠ El umbral de 5 latidos es provisorio**: un punto de partida, no un dato medido. Vive en
  `/config/progresion` con los otros tres números (3 sesiones, 2 semanas, 90 %), editable en
  Perfil → Configuración (P86). Revisarlo después de un mes con datos reales.
- **Nada de esto entra en la racha, la adherencia ni el tonelaje** (`aislamiento.test.ts`), y **no
  viaja al análisis** (enmienda del 01/10 a P98). La pantalla de la rutina muestra solo los datos
  medidos que usó la regla.
- **Las rutinas viejas** (RUT-0004, 0005, 0007 y 0008) se archivan (`Rutina.archivada`): salen de
  la Biblioteca y de la lista para entrenar, y los programas las siguen resolviendo. Conservan la
  progresión de P79 (`lib/progresionVR`), que no aparece en las nuevas.
- **Dificultades**: Bodycombat tiene las suyas; los demás juegos, por ahora, relativas («Por
  defecto», «+1», «+2»), en `Ejercicio.dificultadesVR`. La sesión guarda el id, así que se pueden
  renombrar después sin tocar el historial.
