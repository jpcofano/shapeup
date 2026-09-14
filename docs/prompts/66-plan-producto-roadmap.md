# P66 — Documentar el plan de producto acordado

**Tipo:** documentación. No toca `src/`, `scripts/` ni configuración.
**Entregables:** `docs/ROADMAP-producto.md` (nuevo) + ADR #025 y #026 en el registro de ADRs.

---

## Objetivo

Dejar registrado en el repo el plan de producto que sigue a P65, con las decisiones ya
tomadas, para que cada prompt posterior (P67+) lo referencie en vez de re-discutirlas.

**Todas las decisiones de este documento están cerradas.** Si al implementarlas
encontrás que alguna es inviable o contradice el código, **paralo y reportalo**; no la
reinterpretes ni la resuelvas por tu cuenta.

Contexto que cambia prioridades respecto de planes anteriores: **hoy la app la usa un
solo miembro**. Todo lo multiusuario queda diferido, no descartado.

Ejes, en orden: **flexibilidad de la sesión** → **historial que se arma solo** →
**análisis**. Analizar un historial incompleto es peor que no analizar.

---

## Tarea 1 — Crear `docs/ROADMAP-producto.md`

Escribir el archivo con el contenido de abajo. Si detectás que algo no se corresponde con
el estado actual del código, **no lo corrijas en silencio**: agregá una sección
"Discrepancias detectadas" al final con lo que encontraste.

---

````markdown
# ShapeUp — Roadmap de producto (post P65)

> Vigente desde P66. Contexto: **un solo usuario activo**. Lo multiusuario está
> diferido, no descartado — ver §10.
> Todas las decisiones de este documento fueron acordadas explícitamente.

## Criterio de orden

**Flexibilidad de la sesión → historial que se arma solo → análisis.**
El análisis es el destino, pero apoyarlo en datos incompletos produce conclusiones falsas
con apariencia de rigor. Primero que registrar sea fluido, después que el historial se
complete solo, después analizar.

---

## Bloque 1 — Registrar sin fricción

El problema no es que los botones sean chicos: es que para registrar hay que **tipear reps
y carga en un teclado numérico** con las manos ocupadas.

- **Botón "Serie hecha"** de ~55 px a ~76 px de alto, separado de "Deshacer" para que no
  queden a un dedo de distancia, con margen inferior para el borde de pantalla.
- **Steppers** `−` / `+` grandes a los lados del número, en reps y en carga. El número
  sigue siendo tocable para tipear un valor exacto cuando haga falta.
  - Paso de reps: ±1.
  - Paso de carga: **configurable por ejercicio** (`Ejercicio.pasoCargaKg`), con **default
    por equipo** como fallback — mancuernas 2.5 · barra 5 (un disco de 2.5 por lado) ·
    polea 5 · peso corporal con lastre 1.25.
  - El override se edita **con toque largo sobre el stepper, desde la sesión misma**.
    Donde se siente la fricción, no en un formulario aparte.
- **Sin auto-advance.** Decisión explícita: el descanso no avanza solo. Hoy al llegar a 0
  suena, vibra, hace flash y la card se queda con `+30 s` y `Saltar`. Cambios: el botón
  pasa a decir **"Seguir"** cuando el descanso terminó (hoy sigue diciendo "Saltar", que
  es incorrecto en ese estado), se agranda, y se suma **`−30 s`**.
- **Salir sin perder nada.** La X abre una hoja con tres salidas: *Guardar y salir*
  (sesión parcial) · *Salir sin guardar* · *Seguir entrenando*. Hoy la X descarta todo lo
  hecho y deja además la `SesionProgramada` en `En curso` para siempre.
- **`+ serie`** habilitado al alcanzar `seriesObjetivo()`, para AMRAP o una serie de más.
- **"Saltar ejercicio"** con motivo **opcional** en chips: *dolor · equipo ocupado · sin
  tiempo · otro*. El motivo alimenta la sustitución del bloque 3.
- **Dos arreglos que van acá:**
  - `startRef = useRef(Date.now())` se sella al montar; como el estado persiste en
    localStorage, reanudar reinicia el cronómetro y `duracionRealMin` queda corta. Sellar
    `inicioMs` en el estado persistido.
  - "Reiniciar sesión" borra todo sin confirmar y está en el header a un toque del toggle
    de modo.

## Bloque 2 — Resumen post-entreno

Hoy la pantalla de cierre muestra el ícono, el total de series y diez botones de RPE sin
leyenda. El tonelaje ya se calcula en `finalizarSesion`, pero recién al guardar: no se ve.

- **Cifras antes de guardar:** tonelaje, series efectivas, duración real.
- **Delta contra la última vez** del mismo ejercicio (`+2.5 kg`, `+1 rep`). El historial ya
  está en memoria en esa pantalla para la sugerencia de progresión.
  **Si hubo sustitución, el delta se abstiene** y lo dice, en vez de comparar contra un
  ejercicio que no se hizo.
- **PR = mejor carga levantada**, que es un hecho y es lo que se muestra. El **1RM estimado
  se guarda en silencio** para la curva de progreso y el análisis: se festeja un hecho, se
  analiza una estimación.
- **Chips fijos** de molestia y sensación, que llenan `comoMeSenti`, `queMejorar` y `notas`
  — hoy los tres están siempre vacíos.
- **RIR opcional en la última serie de cada ejercicio**, cuatro botones grandes
  (`0 · 1 · 2 · 3+`). Solo la última: es la que define si la próxima vez subís carga.
  Pedirlo en todas son cuatro toques por ejercicio a cambio de datos que no se usan.
  `SerieRegistro.rir` ya existe en el modelo y nunca se llena; `sugerirProgresion` hoy
  tiene que adivinarlo.
- **Leyenda en la escala de RPE.** Diez botones sin decir qué es 7 y qué es 9 devuelven un
  número al azar.

## Bloque 3 — Sustitución en vivo

**Los campos `alternativas`, `progresiones` y `regresiones` están vacíos**: 0 de 873
ejercicios los tienen, y `seed-plan.ts` no declara alternativas en los bloques. La
sustitución por lo tanto **se calcula**, no se lee.

Datos verificados disponibles en el catálogo: `patron` en 828/873 · `grupoMuscularPrimario`,
`equipo`, `unilateral` y `nivel` en 873/873 · `mecanica` en 786/873.
"Cuántas veces lo usaste" no está en el catálogo: se deriva del historial.

**`lib/sustitucion.ts`**, puro (ADR #009: sin Firebase adentro).

Filtros duros — descartan sin importar puntaje:
- Equipo que no tenés **en el lugar donde estás hoy**.
- Distinto patrón de movimiento.
- Nivel por encima del tuyo.
- Si el motivo fue *dolor*: todo lo que cargue la zona marcada.

Orden, de más a menos peso, **con los pesos en constantes nombradas al principio del
módulo** para poder ajustarlos sin reescribir la lógica:
1. **Mismo grupo muscular primario**, y cuántos secundarios comparte — fidelidad al estímulo.
2. **Que ya lo hayas hecho.** Pesa mucho: hay carga de referencia en el historial, así que
   arrancás sabiendo con cuánto. Aprender técnica nueva a mitad de sesión es lo peor.
3. **Perfil de carga parecido**: compuesto/aislado, bilateral/unilateral, libre/guiado.
4. **Frescura**: penaliza si lo hiciste en las últimas 48 h. Entre empatados, gana el menos
   usado.

Presentación: **un recomendado con su razón en una línea** ("mismo patrón, tenés mancuernas,
lo hiciste el 3/9 con 22,5 kg") **más buscador del catálogo**. Si ningún candidato lo
hiciste nunca, **igual ofrece el más parecido**.

Registro en el historial: `idEjercicioOriginal`, sustituto, motivo y **posición que ocupaba
en el ranking**. Ese último dato es el que después dice si el algoritmo acierta: si siempre
elegís el tercero, el orden está mal.

**Precondiciones:**
- **Perfil editable.** `data/perfiles.ts` sólo tiene `getPerfiles()`; falta el writer y la
  UI. `PerfilMiembro` ya modela lo necesario y las reglas ya permiten escribir
  `/config/perfiles`, pero hoy todo se cambia corriendo `seed-perfiles.ts`.
  **El equipo se guarda por lugar** (casa / gimnasio / aire libre / VR) y al empezar la
  sesión elegís dónde estás. Esto además enciende `lib/elegibilidad.ts`, hoy código muerto
  que ningún import alcanza.
- **Auditoría de traducciones.** 404 de 873 fichas siguen marcadas `traduccion: "pendiente"`
  en el seed; no se sabe si los 18 scripts de lote las corrigieron en Firestore. Si la
  sustitución ofrece nombres en inglés, no sirve — y el buscador tampoco: buscar "remo" no
  encuentra *Bent Over Row*. El campo `sinonimos` (presente en las 873) puede tapar parte
  del agujero.

## Bloque 4 — Sin señal

Firestore tiene caché persistente activada, así que una escritura sin conexión **se guarda
local y se encola sola**, pero la promesa de `setDoc` no resuelve hasta que el servidor
confirma. En el subsuelo de un gimnasio, el botón queda en "Guardando…" indefinidamente: no
falla, no avanza, y por eso tampoco muestra el error que el código sí maneja
(`if (!result.ok) setSaveError(...)`, que además conserva el estado local).

- **Timeout de 8 s** en el guardado. Vencido, mensaje del tipo "Guardado en el teléfono, se
  sincroniza cuando haya señal" y te deja salir.
- **Chip en Home** ("1 sesión sin subir") hasta que confirme. La sincronización silenciosa
  tiene un modo de falla feo: si el navegador desaloja los datos del sitio antes de
  sincronizar, la sesión desaparece sin que nadie se entere.
- **Indicador de sin conexión** en la pantalla de sesión.
- **Verificar** que abrir una rutina sin señal funcione desde caché.
- **Barrido de sesiones huérfanas** en `En curso` con más de 24 h.

## Bloque 5 — Historial automático (Samsung completo)

Hoy `importSelectivo.ts` (ADR #020) clasifica cada actividad en relevante o descartada, y
**lo descartado se pierde sin dejar rastro**. Se invierte el criterio: nada se descarta,
todo se clasifica.

**Tres destinos, siempre exactamente uno:**

| Caso | Destino |
|---|---|
| Matchea una sesión ShapeUp (`matchBiometrico`) | Enriquece ese `Historial` — **no** crea entrada nueva |
| No matchea y dura ≥ umbral | `Historial` nuevo con `tipo: "externa"` |
| No matchea y no llega al umbral | Listada como descartada **visible, con el motivo** |

- **Umbral: 15 minutos**, configurable en `/config/import` junto con la lista de
  actividades. Hoy `ACTIVIDADES_SIEMPRE_RELEVANTES` y `DURACION_MIN_ACTIVIDAD_MIN` son
  constantes hardcodeadas. Lo que no pasa el umbral no se borra: bajarlo después recupera
  lo que quedó afuera.
- **Idempotencia por `datauuid`**: el id de la entrada externa se deriva del identificador
  de Samsung, así reimportar el mismo ZIP —o uno que solapa— no duplica. Misma estrategia
  que `idMetrica`.
- **Una entrada externa** no tiene bloques ni tonelaje: tiene actividad, duración, calorías,
  FC media y máxima, zona principal y distancia.
- **Aislamiento de métricas — el riesgo real.** Racha, adherencia, `vecesEntrenada`,
  tonelaje y progresión se calculan hoy sobre todo el historial. Sin filtro explícito por
  `tipo`, una caminata de 40 minutos cuenta como sesión de fuerza. **Los tests de
  aislamiento van antes que la ingesta**: escritos junto con la implementación, se escriben
  para pasar.
- **Dos métricas separadas:** *racha del plan* (sólo sesiones ShapeUp) y *días activos*
  (todo). Que una caminata no infle la adherencia, pero que tampoco te quite el crédito por
  haberte movido.
- **Enlazar y convertir** desde una entrada externa: enlazarla con una sesión ShapeUp (para
  los matches que el algoritmo no vio) o convertirla en sesión libre con detalle. Es la
  versión barata del asistente de conciliación, y alcanza porque ya no hay huérfanos.
- **Inventario del import visible:** qué CSVs trajo el ZIP, cuántas filas entraron por tipo,
  cuántas se descartaron y por qué. El patrón de los bugs de este proyecto —el mapeo 1001,
  los fragmentos de sueño, el índice faltante— es siempre el mismo: fallas silenciosas
  detectadas recién al auditar.

Sueño, pasos y FC de reposo siguen entrando como métricas, sin cambios.

## Bloque 6 — Carga manual y corrección

Con el bloque 5 andando, lo manual queda para tres casos: entrenaste sin reloj, cargaste
algo mal, o querés ponerle detalle a una entrada externa.

- **Formulario mínimo con detalle opcional.** Uno completo es lo que el análisis necesita y
  lo que nadie llena a las once de la noche. La entrada queda marcada como **sin detalle**,
  para que el análisis no confunda "esa semana no levantaste" con "esa semana no cargaste".
  Un hueco declarado vale más que uno silencioso.
- **Edición** de carga, reps, RPE y fecha.
- **`editadoEn` se guarda pero no se muestra en ninguna pantalla.** Sin etiquetas molestas
  para el usuario; el análisis sí sabe que ese valor fue corregido y no es un salto real.

## Bloque 7 — Vista por ejercicio

Responde una sola pregunta: *¿con cuánto vengo?*

- Arriba: **última vez** (carga, reps, RIR) y **mejor carga**.
- Abajo: **curva de 1RM estimado**, que compara series de distinto rango entre sí.
- Contexto: **frecuencia de 30 días** y **cuántas veces lo sustituiste** — sustituirlo seis
  veces seguidas dice que ese ejercicio no va más en la rutina.
- Se abre **desde la ficha del catálogo y tocando el nombre en plena sesión**.

## Bloque 8 — Sesión flexible

Dos features que parecen una y no lo son. **Primero la de recortar**, que es la más simple y
la que más se usa con un programa activo.

- **Recortar la rutina del día**: "tocaba Torso A pero tengo la mitad del tiempo". No se
  eligen ejercicios: se prioriza cuáles de los que ya estaban se caen.
- **Armar desde cero**: **vos elegís el grupo**, el sistema completa según equipo del lugar,
  nivel y tiempo disponible, uno o dos compuestos primero y accesorios después, evitando lo
  trabajado en las últimas 48 h del mismo grupo.
- `metricas.ts` ya estima duración de rutina, así que el presupuesto de tiempo es calculable.
- **No se guarda como rutina.** Queda en el historial y nada más.

---

## 9. Cambios de modelo que implica el plan

| Campo | Bloque |
|---|---|
| `Ejercicio.pasoCargaKg?: number` | 1 |
| `Historial.completitud?: "completa" \| "parcial" \| "sin-detalle"` | 1, 6 |
| `Historial.tipo` suma `"externa"` | 5 |
| `Historial.editadoEn?: string` (nunca se muestra) | 6 |
| `BloqueRegistro.saltado?` + `motivoSalto?` | 1 |
| `BloqueRegistro.idEjercicioOriginal?` + `motivoSustitucion?` + `rankingSustituto?` | 3 |
| `SerieRegistro.rir` — ya existe, empezar a llenarlo | 2 |
| `PerfilMiembro`: equipo disponible **por lugar** | 3 |
| `/config/import`: umbral y lista de actividades | 5 |
| Entrada externa: actividad, duración, kcal, FC media/máx, zona, distancia, `datauuid` | 5 |

## 10. Diferidos (no descartados)

- **Análisis por LLM.** El usuario exporta un snapshot de salud e historial, lo pega en un
  chat de IA, y el análisis vuelve como JSON que la app ingiere y muestra. El destino ya
  existe: `Recomendacion` y `/recomendaciones`, ya renderizado en Home. **La solapa Salud
  por ahora sólo visualiza datos de la app.**
- **Registro real de movilidad, isométrico y VR.** Hoy el quick-log sólo aparece con
  `modalidad === "Fuerza"`. Diferido porque Samsung ya trae el cardio; queda pendiente que
  el reloj tampoco captura movilidad ni isométrico.
- **Proveedor biométrico genérico** (`HealthProviderEngine` para Apple Health, Garmin,
  Fitbit). Abstraer con un solo proveedor real produce indirección, no flexibilidad: el
  segundo caso es el que muestra dónde va la costura.
- **i18n del catálogo** — depende de qué devuelva la auditoría de traducciones.
- **Consolidación de tokens CSS** (`colors_and_type.css` en root, 100 vars, contra
  `src/styles/tokens.css`, 129). Riesgo de divergencia post-P65.
- **`ProgramaForm`** — crear y editar programas desde la app; hoy requiere `seed-plan.ts`.
  Diferido **sólo porque el dueño del repo puede correr scripts**. El día que entre otro
  miembro se vuelve bloqueante.
- **Serie H (Health Connect)** — elimina el paso manual del ZIP. Entra cuando el bloque 5
  esté estable, porque el bloque 5 define qué se hace con lo que llega.
- **Todo lo multiusuario**: tablero familiar, rachas compartidas, reacciones, UI de
  visibilidad por miembro.

**Descartado:** control por botones de volumen. Una PWA no puede interceptarlos, y
MediaSession sólo entrega handlers con audio reproduciéndose — implicaría mantener un audio
silencioso toda la sesión.

## 11. Orden de prompts

| Prompt | Contenido | Depende de |
|---|---|---|
| P67 | Bloque 1 — botones, steppers, descanso, los dos arreglos | — |
| P68 | Bloque 1 — hoja de salida, sesión parcial, `+ serie`, saltar con motivo | P67 |
| P69 | Bloque 4 — sin señal (chico y evita perder sesiones) | P68 |
| P70 | Bloque 2 — resumen post-entreno y RIR | P68 |
| P71 | Auditoría de traducciones (script, sin UI) | — |
| P72 | Perfil editable + equipo por lugar | — |
| P73 | Bloque 3 — `lib/sustitucion.ts` y UI | P71, P72 |
| P74 | Tests de aislamiento por `tipo` de historial | — |
| P75 | Bloque 5 — ingesta total y entradas externas | P74 |
| P76 | Bloque 5 — enlazar, convertir, inventario del import | P75 |
| P77 | Bloque 6 — carga manual y edición | P75 |
| P78 | Bloque 7 — vista por ejercicio | P70, P77 |
| P79 | Bloque 8 — recortar la rutina del día | P73 |
| P80 | Bloque 8 — armar desde cero | P79 |
````

---

## Tarea 2 — Registrar dos ADRs

Seguir el formato y la numeración del registro existente (el último conocido es #024).

**ADR #025 — Toda actividad de Samsung Health entra al historial**

- *Contexto:* el ADR #020 estableció el filtro de relevancia, que descarta en silencio toda
  actividad sin match. Con uso real del reloj, esa política pierde entrenamientos legítimos.
- *Decisión:* no descartar, clasificar en tres destinos (enriquecer / externa / descartada
  visible). `Historial.tipo` suma `"externa"`. Umbral de 15 min configurable en
  `/config/import`. Idempotencia por `datauuid`. Racha del plan y días activos como dos
  métricas separadas.
- *Consecuencia:* todo cálculo derivado del historial debe filtrar por `tipo` de forma
  explícita, con tests que lo garanticen **escritos antes de la ingesta**. El ADR #020 queda
  **acotado, no revertido**: su lógica de relevancia pasa a decidir visibilidad, no
  persistencia.

**ADR #026 — La sustitución de ejercicios se calcula, no se declara**

- *Contexto:* `BloqueEjercicio.alternativas`, `Ejercicio.progresiones` y
  `Ejercicio.regresiones` están en el modelo pero vacíos en los 873 ejercicios del catálogo,
  y ningún script los puebla.
- *Decisión:* los candidatos se derivan en tiempo real de `patron`, `grupoMuscularPrimario`,
  `mecanica`, `equipo` y `nivel`, más el historial del miembro, en un módulo puro con pesos
  ajustables. Los campos declarativos quedan sin uso hasta que algo los pueble.
- *Consecuencia:* la calidad de la sustitución depende de la calidad del catálogo — de ahí
  que la auditoría de traducciones sea precondición y no un extra. Se registra la posición
  del candidato elegido en el ranking para poder evaluar el algoritmo con datos reales.

---

## Criterios de aceptación

- `docs/ROADMAP-producto.md` existe con la estructura de arriba.
- ADRs #025 y #026 registrados en el formato del repo. Si el vínculo entre #020 y #025 no se
  puede expresar con el formato actual, dejarlo anotado antes que forzarlo.
- No se modifica nada fuera de `docs/`.
- `tsc -b` y la suite siguen pasando.
- Commit: `docs(plan): roadmap de producto acordado + ADR #025/#026 (P66)`
