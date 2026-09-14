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
- **Salir ordenado.** La X abre una hoja con tres salidas: *Guardar y salir*
  (sesión parcial) · *Salir sin guardar* · *Seguir entrenando*. Hoy la X no descarta lo
  hecho —sólo navega, el estado vive en localStorage y se recupera al volver—, pero deja la
  `SesionProgramada` en `En curso` indefinidamente, y "Reiniciar sesión" (en el header, al
  lado del toggle de modo) borra todo sin confirmar. La hoja es la decisión correcta por
  **ordenar la salida y cerrar la sesión programada**, no por rescatar trabajo perdido.
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
  UI. Las reglas ya permiten escribir `/config/perfiles`, pero hoy todo se cambia corriendo
  `seed-perfiles.ts`.
  **El equipo se guarda por lugar** (casa / gimnasio / aire libre / VR) y al empezar la
  sesión elegís dónde estás. `PerfilMiembro` hoy tiene `equipoDisponible: Equipo[]` plano
  más `lugarHabitual`, así que esto es **migrar la forma del documento ya sembrado**, no
  agregar un campo: P72 necesita script de migración.
  El **filtro por equipo hay que escribirlo**: `lib/elegibilidad.ts` filtra por
  visibilidad, no por equipo, y sigue siendo código muerto que ningún import alcanza —
  reutilizarlo o eliminarlo es una pregunta aparte.
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

- **Umbral: se mantiene en 10 minutos**, el valor que `DURACION_MIN_ACTIVIDAD_MIN` tiene
  desde P55 (elegido después del bug del mapeo 1001). Lo que cambia es que pasa a ser
  **configurable en `/config/import`** junto con la lista de actividades — hoy
  `ACTIVIDADES_SIEMPRE_RELEVANTES` y `DURACION_MIN_ACTIVIDAD_MIN` son constantes
  hardcodeadas, y ése era el objetivo real. Subirlo sin evidencia cambiaría comportamiento
  vigente a cambio de nada: como acá nada se borra, un umbral bajo sólo produce más
  entradas externas visibles, ajustables en un toque si molestan. Lo que no pasa el umbral
  tampoco se borra: bajarlo después recupera lo que quedó afuera.
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

## Bloque 9 — VR

### Principio de fuentes
**La app dice qué ejercicio fue. Samsung dice cuánto costó. El match por hora los une.**

Ninguna fuente opina sobre lo de la otra. Esto descarta explícitamente dos ideas que se
evaluaron y se rechazaron: un diccionario juego→ejercicio en el import, y un segundo
workout en el reloj llamado "ShapeUp VR". Ambas intentaban que Samsung dedujera el
ejercicio, que es justo lo que no tiene por qué saber. El precedente es el mapeo 1001:
inferir desde Samsung ya salió caro una vez.

Contexto de uso: **un único workout custom en el reloj, llamado "Shape up", para todo**.
En el export, fuerza y VR son indistinguibles entre sí — mismo `custom_id`, misma
actividad. El pool de match por `custom_id` es el más fuerte del sistema (tolerancia de
30 min contra los 10 del fallback por ventana), así que abrir la rutina en la app antes de
jugar alcanza para que la sesión quede correctamente identificada.

**Consecuencia aceptada:** una sesión VR jugada sin abrir la app entra como entrada externa
ambigua y se resuelve a mano con el "enlazar" del bloque 5. No hay forma honesta de
evitarlo.

### 9.1 Dificultad
Chip al cerrar la sesión VR, tres niveles: **suave · normal · intenso**. Un toque, igual
que el RIR del bloque 2. Es la palanca que necesita la progresión para existir.

### 9.2 Progresión decidida por FC
El sistema elige. Compara la FC media de la sesión contra la zona objetivo que las rutinas
VR ya declaran (Z3 para las rítmicas, Z4 para las de quema y boxeo).

**Escalera de palancas, ordenada por lo que cuesta en tiempo:**
1. **Dificultad del juego** — no alarga la sesión.
2. **Recortar descanso** — tampoco.
3. **Sumar ronda** — sí, por eso va última.

- FC media **por debajo** de la zona objetivo y rondas completas → el juego no exige:
  subir dificultad.
- FC media **en zona** y rondas completas → recortar descanso; con el descanso en su piso,
  sumar ronda.
- FC media **muy por encima**, o mala recuperación entre rondas → mantener o bajar.

Piso de descanso y techo de rondas configurables.
**Precondición:** zonas de FC en el perfil (bloque 3).

### 9.3 Confiabilidad del dato de FC
La FC de muñeca durante boxeo y juegos de ritmo es la peor medición del sistema: el sensor
es óptico, agarrar el control contrae el antebrazo y los golpes sacuden el reloj. Picos
falsos y caídas que no ocurrieron.

**Decisión:** la progresión **sugiere igual**, avisando que el dato es dudoso. Si el aviso
aparece seguido, la conclusión no es que la regla falle: es que la muñeca no sirve para
medir esa actividad.

### 9.4 Métricas propias en la vista por ejercicio
Para modalidad VR, 1RM y tonelaje no significan nada. En su lugar:
- minutos en zona 3 y 4,
- FC media por ronda,
- **recuperación entre rondas** — cuánto baja la FC en el descanso, el mejor indicador de
  fitness cardiovascular disponible sin laboratorio,
- rondas completadas.

El `SerieTimer` ya marca el fin de cada ronda y el import ya trabaja con la curva completa
de FC: el cruce de ambos es lo que habilita la recuperación. (Parte del camino ya está
hecho: `SerieRegistro` guarda `inicioMs`/`finMs` por serie y el enriquecimiento ya escribe
`fcPico`, `fcFinSerie` y `recuperacionBpm` — ver §13.2.)

### 9.5 Qué aporta el VR, para que el plan no lo sobrevalore
Aporta **adherencia**: cuarenta minutos en zona 3-4 sin vivirlos como entrenar. Es
intermitente, dominante de tren superior, sin impacto articular.
**No aporta sobrecarga progresiva**: no hay forma de subir carga de manera controlada, sólo
densidad, y eso tiene techo. Complementa la fuerza, no la reemplaza.
Las calorías que reporta el reloj en actividades de brazos vienen infladas: los algoritmos
están calibrados sobre movimiento de muñeca.

---

## Bloque 10 — Planificación del programa

### 10.1 El programa es una cola, no un calendario
Hacés la siguiente sesión cuando podés. No hay días perdidos: hay avance más lento.
`diaSemana` queda como etiqueta informativa y deja de fingir que planifica.

### 10.2 El atraso se mide en semanas de ciclo
En una cola pura la deuda no existe, y un contador de sesiones pendientes crece sin techo
hasta volverse impagable e inútil. En su lugar: **semanas de ciclo completadas contra
semanas transcurridas** — "vas por la semana 3 del plan y transcurrieron 5".

`Programa.duracionSemanas` pasa a usarse. Superado un atraso máximo, el sistema ofrece
**reiniciar el ciclo** en vez de seguir acumulando.

El estado del ciclo **es del miembro, no del programa**: los programas son plantillas
compartidas, así que inicio de ciclo, semanas de carga y última descarga viven en el perfil
del miembro.

### 10.3 Descarga automática, disparada por carga real
La descarga sirve para bajar fatiga acumulada. Si no cumpliste, no acumulaste fatiga: el
disparador no puede ser el calendario.

- Una semana cuenta como **semana de carga** si completaste **al menos el 75%** de sus
  sesiones no opcionales.
- Al juntar **cuatro semanas de carga**, se **propone** descarga. Nunca se aplica sola.
- La descarga recorta **un 40% de las series**, redondeando hacia abajo, nunca por debajo
  de una serie por ejercicio. **La carga se mantiene.**

Cumpliendo a medias tardás el doble en llegar a la descarga, que es exactamente la
intención.

**Entrada futura:** `recomendaciones.ts` ya vigila FC de reposo elevada y sueño bajo. Esas
señales podrían **adelantar** la descarga. Es el puente natural entre la solapa Salud y el
plan; queda propuesto, sin decidir.

### 10.4 Fin de ciclo
Al completar las semanas del ciclo, el sistema **sugiere cómo seguir** — repetir, subir
volumen, cambiar de programa — y vos decidís.

### 10.5 Arreglos que van en este bloque
- **Pausar no puede dejarte sin Home.** `getProgramaActivo` sólo reconoce `"Activo"`, así
  que un programa `Pausado` cae en el estado vacío que sugiere crear uno en Biblioteca —
  donde no se pueden crear programas. La Home tiene que entender la pausa y ofrecer
  reanudar. (Precisión del código: eso vale por el camino de fallback; con entrada en
  `config/programaActivo` el programa pausado sí vuelve, pero la Home lo muestra como si
  estuviera activo y tampoco ofrece reanudar. Ver §13.1.)
- **Los días `opcional: true` no cuentan como incumplidos**, ni para el atraso ni para el
  contador de semanas de carga.
- **`DiaPrograma.tipo: "vr"` es una rama muerta**: ningún seed la usa. Decidir si se elimina
  del modelo o se documenta como no usada.

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
| `PerfilMiembro`: equipo disponible **por lugar** — migración de la forma del doc sembrado (de `equipoDisponible: Equipo[]` plano), no un campo nuevo | 3 |
| `/config/import`: umbral y lista de actividades | 5 |
| Entrada externa: actividad, duración, kcal, FC media/máx, zona, distancia, `datauuid` | 5 |
| `Historial.dificultadVR?: "suave" \| "normal" \| "intenso"` | 9 |
| `Historial.fcConfiable?: boolean` | 9 |
| Piso de descanso y techo de rondas para rutinas VR | 9 |
| Estado de ciclo en el perfil del miembro: programa, inicio de ciclo, semanas de carga, última descarga, descarga activa | 10 |
| `Programa.pausadoDesde?` | 10 |

## 10. Diferidos (no descartados)

- **Análisis por LLM.** El usuario exporta un snapshot de salud e historial, lo pega en un
  chat de IA, y el análisis vuelve como JSON que la app ingiere y muestra. El tipo
  `Recomendacion` y la regla de `/recomendaciones` existen, pero **ningún código los usa**:
  Home renderiza lo que `lib/recomendaciones.ts` calcula al vuelo, por decisión explícita
  del **ADR #023** (sin colección, cálculo derivable). Persistir recomendaciones lo
  contradice, así que este bloque **requiere revisar el ADR #023 de frente** — no hay
  infraestructura existente en la que apoyarse. **La solapa Salud por ahora sólo visualiza
  datos de la app.**
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
| P72 | Perfil editable + equipo por lugar **+ script de migración del doc sembrado** | — |
| P73 | Bloque 3 — `lib/sustitucion.ts` y UI **+ filtro por equipo escrito desde cero** | P71, P72 |
| P74 | Tests de aislamiento por `tipo` de historial | — |
| P75 | Bloque 5 — ingesta total y entradas externas | P74 |
| P76 | Bloque 5 — enlazar, convertir, inventario del import | P75 |
| P77 | Bloque 6 — carga manual y edición | P75 |
| P78 | Bloque 7 — vista por ejercicio | P70, P77 |
| P79 | Bloque 8 — recortar la rutina del día | P73 |
| P80 | Bloque 8 — armar desde cero | P79 |
| P81 | Arreglos de planificación: pausa, días opcionales, `diaSemana` informativo | — |
| P82 | Cola + atraso en semanas de ciclo + fin de ciclo | P81 |
| P83 | Contador de semanas de carga + propuesta de descarga | P82 |
| P84 | VR: chip de dificultad y marca de confiabilidad de FC | P72 |
| P85 | VR: progresión por FC con la escalera de palancas | P84 |
| P86 | VR: métricas propias en la vista por ejercicio | P78, P84 |

---

## 12. Discrepancias detectadas (P66, 2026-09-14)

Verificación del texto de arriba contra el código al commit `f11c673`. **Nada de esta
sección modifica las decisiones**: el plan queda como se acordó. Son puntos a resolver
antes de que el prompt correspondiente los toque.

### 12.1 Numeración de ADRs: #025 ya está tomado — **bloqueante**

P66 pide registrar los dos ADRs nuevos como #025 y #026, "el último conocido es #024". No
lo es: **#025 existe desde P57** (spec autoritativa del match biométrico, `docs/prompts/57-s-match-robusto.md`),
citado en `CLAUDE.md` y en `docs/MAPEO-IMPLEMENTACION.md` (bitácora P57, §§ de `derivarZona`
y del ranking por Δinicio). Registrar otro #025 pisaría una referencia viva.

Se registraron como **#026 (Samsung completo) y #027 (sustitución calculada)**, con nota de
numeración en el registro. Si el owner prefiere otra resolución (renumerar el de P57,
usar #025b), es un cambio de una línea en tres archivos — pero la decisión es suya, no se
tomó acá.

### 12.2 `lib/elegibilidad.ts` no filtra por equipo, filtra por visibilidad

El bloque 3 dice que guardar el equipo por lugar "enciende `lib/elegibilidad.ts`, hoy código
muerto". Es código muerto (ningún import lo alcanza, verificado), pero lo que hace es
`rutinasElegibles` / `programasElegibles` **según `VisibilidadMiembro`** — nada de equipo.
El filtro por equipo del lugar hay que escribirlo; existe `Rutina.equipoNecesario` (cache de
`lib/metricas.ts`) como insumo. Que el módulo siga muerto es un tema aparte, y es de la
familia de lo multiusuario (§10).

### 12.3 La X no descarta lo hecho; "Reiniciar sesión" sí

En `src/routes/EntrenarSesion.tsx:266` la X sólo hace `navigate("/entrenar")`. El estado vive
en localStorage (`entrenarState.ts:376-397`) y se recupera al volver a entrar. Lo que sí es
cierto y es el riesgo real:

- la `SesionProgramada` queda en `En curso` para siempre (nada la cierra);
- **`session.reiniciar`** está en el header, a un toque del toggle de modo
  (`EntrenarSesion.tsx:278`, ídem `EntrenarSesionLibre.tsx:416`), y borra sin confirmar;
- el estado en localStorage se pierde si el navegador desaloja los datos del sitio.

La hoja de salida de tres opciones sigue siendo la solución correcta; lo que cambia es el
diagnóstico de qué se pierde hoy y cuándo.

### 12.4 El umbral de actividad hoy existe y vale 10 minutos

`DURACION_MIN_ACTIVIDAD_MIN = 10` en `src/lib/importSelectivo.ts:48` (puesto en P55 tras el
bug del mapeo 1001). Subirlo a 15 no es sólo hacerlo configurable: **cambia el
comportamiento actual**, dejando afuera del destino "externa" las actividades de 10–14 min
que hoy sí se consideran relevantes. Con la política nueva no se pierden (quedan listadas
como descartadas visibles), pero conviene saberlo al migrar.

### 12.5 `PerfilMiembro` tiene equipo plano, no por lugar

Hoy: `equipoDisponible?: Equipo[]` + `lugarHabitual?: Lugar` (`src/types/models.ts:616-623`).
El cambio de §9 no es agregar un campo: es **migrar la forma del doc `/config/perfiles`**,
que ya está sembrado por `seed-perfiles.ts`. P72 necesita decidir si migra los perfiles
existentes o si el campo nuevo convive con el viejo. Las reglas ya permiten la escritura
(`firestore.rules:61`), eso sí.

### 12.6 `/recomendaciones` tiene tipo y regla, pero ningún código la usa

`Recomendacion` está en el modelo (`models.ts:584`) y la colección tiene regla
(`firestore.rules:58`), pero **no hay `data/recomendaciones.ts`**: Home renderiza lo que
`lib/recomendaciones.ts` calcula al vuelo, que es exactamente lo que decidió el **ADR #023**
(sin colección, cálculo derivable, descarte en localStorage). El diferido de análisis por LLM
(§10) implica entonces escribir la capa de datos **y revisar el ADR #023**, no sólo "usar lo
que ya existe".

### 12.7 Verificado y correcto (para constancia)

Catálogo (`catalogo-ejercicios.json`, 873 fichas): `alternativas` / `progresiones` /
`regresiones` en **0**; `grupoMuscularPrimario`, `equipo`, `unilateral`, `nivel` y
`sinonimos` en **873**; `patron` en **828**; `mecanica` en **786**. Traducciones: **404
pendientes / 469 ok**, con **18** scripts `fix-traducciones-loteN` (más
`fix-traducciones-ratio.ts`). Tokens: **100** vars en `colors_and_type.css` contra **129** en
`src/styles/tokens.css`. Caché persistente de Firestore activa (`src/firebase.ts:23`).
`SerieRegistro.rir?: number` existe (`models.ts:417`) y nunca se escribe. RPE: 10 botones sin
leyenda (`EntrenarSesion.tsx:194`). Quick-log sólo con `modalidad === "Fuerza"`
(`EntrenarSesion.tsx:245,347`). `startRef = useRef(Date.now())` sellado al montar
(`EntrenarSesion.tsx:42`). `DescansoTimer` con `+30 s` y `Saltar` (`DescansoTimer.tsx:81,84`).
Tonelaje calculado recién en `finalizarSesion` (`data/historial.ts:72`). `seriesObjetivo` y
`estimarDuracionMin` existen en `lib/metricas.ts`. `data/perfiles.ts` sólo expone
`getPerfiles()`.

---

## 13. Discrepancias detectadas (P66b, 2026-09-14)

Verificación del texto de los bloques 9 y 10 contra el código. **Nada de esta sección
modifica las decisiones**, igual que §12. §12 queda intacta: registra lo de P66.

### 13.1 `getProgramaActivo` no filtra por estado en su camino principal

El bloque 10.5 dice que sólo reconoce `"Activo"`. Eso vale para el **fallback**
(`src/data/programas.ts:65`, `find((p) => p.estado === "Activo")`), pero el camino
principal lee `config/programaActivo` y devuelve el programa que el mapa apunta **sin mirar
el estado** (`programas.ts:50-61`), que es el camino que usa Home (`Home.tsx:273`, con
`memberId`). O sea, hay dos agujeros distintos, no uno:

- **con** entrada en `config/programaActivo`: el programa pausado vuelve y la Home lo
  muestra como si estuviera activo — la pausa es invisible y no hay dónde reanudar;
- **sin** entrada (retrocompat): el pausado desaparece y cae el estado vacío que manda a
  Biblioteca, donde no se pueden crear programas.

El arreglo de P81 es entonces doble: que la Home entienda la pausa (mostrarla y ofrecer
reanudar) **y** decidir qué devuelve `getProgramaActivo` cuando el doc apunta a un programa
pausado. La decisión de producto —"pausar no puede dejarte sin Home"— no cambia.

### 13.2 La recuperación entre rondas ya está medida; falta exponerla

El bloque 9.4 la plantea como cruce a construir. En el modelo ya existe por serie:
`SerieRegistro` guarda `inicioMs`/`finMs` (sellados por el reducer, no por el `SerieTimer`,
que es una cuenta regresiva con beep y no registra nada) más `fcPico`, `fcFinSerie` y
`recuperacionBpm`, que el enriquecimiento escribe desde la curva de FC (ADR #025, con tope
de 90 s en la última serie). P86 es sobre todo **superficie**: agregarlo por ronda y
mostrarlo, no derivarlo de cero.

### 13.3 Verificado y correcto (para constancia)

`ESTADOS_PROGRAMA` incluye `"Pausado"` (`models.ts:175`). `Programa.duracionSemanas` está
declarado (`models.ts:357`) y lo escribe `seed-planes-extra.ts`, pero **ningún código lo
lee**: "pasa a usarse" es exacto. `DiaPrograma.opcional: boolean` existe (`models.ts:345`).
`proximaSesion` recorre los días por `orden` contra el historial de la semana e ignora
`diaSemana` (`lib/proximaSesion.ts:21-46`). `DiaPrograma.tipo: "vr"` no lo usa ningún seed
(sí lo contempla `proximaSesion` como "día sin rutina" y lo ejercita su test). Las rutinas
VR declaran `zonaObjetivo` (`seed-plan.ts:298`, ADR #024), así que 9.2 tiene contra qué
comparar. `lib/recomendaciones.ts` ya vigila `fc-reposo` y sueño. No existen todavía
`Historial.dificultadVR`, `Historial.fcConfiable` ni `Programa.pausadoDesde`.
