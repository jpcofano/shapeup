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

**El dato ya existe; esto es superficie, no derivación.** `SerieRegistro` guarda
`inicioMs`/`finMs` por serie (los sella el reducer de la sesión) y el enriquecimiento ya
escribe `fcPico`, `fcFinSerie` y `recuperacionBpm` desde la curva de FC (ADR #025, con tope
de 90 s en la última serie). Lo que falta es agregarlo por ronda y mostrarlo — ver §13.2.

**`recuperacionBpm` no está roto: está esperando la curva.** Se deriva de la curva de FC
por serie (`lib/matchBiometrico.ts:168-182`, verificado en §16.2), no de la tabla
`exercise.recovery_heart_rate` de Samsung, que no tiene filas para el workout custom
(§15.6). Por eso este bloque depende de que la sesión tenga curva: **con la vía A nunca la
va a tener para sesiones de fuerza; con la vía D la tiene completa** (§15.8, ADR #036).
Mientras la vía D no se construya, la curva la trae el ZIP.

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
- **La primera semana parcial no cuenta.** Si el ciclo arranca un jueves, esa semana sale
  incompleta por definición: el contador de semanas de carga empieza el lunes siguiente.
- Al juntar **cuatro semanas de carga**, se **propone** descarga. Nunca se aplica sola.
- La descarga recorta **un 40% de las series**, redondeando hacia abajo, nunca por debajo
  de una serie por ejercicio. **La carga se mantiene.**

Cumpliendo a medias tardás el doble en llegar a la descarga, que es exactamente la
intención.

**La propuesta mira la cobertura antes de hablar** (bloque 11). Si venís cumpliendo el 75%
pero cambiando la mitad de los días, el mensaje no es "te toca descargar" sino que quizá
el problema no es la fatiga sino el plan. Mismo cálculo, distinto mensaje.

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
  reanudar. **P81 arregla las dos ramas** de `getProgramaActivo` (§13.1): el camino
  principal, que lee `config/programaActivo` sin filtrar por estado y hoy muestra el
  programa pausado como si estuviera activo, y el fallback, que filtra por `"Activo"` y
  hace desaparecer el pausado.
- **Los días `opcional: true` no cuentan como incumplidos**, ni para el atraso ni para el
  contador de semanas de carga.
- **`DiaPrograma.tipo: "vr"` es una rama muerta**: ningún seed la usa. Decidir si se elimina
  del modelo o se documenta como no usada.

---

## Bloque 11 — Cambiar el día

El caso: hoy tocaba tren inferior y hacés VR, o tren superior, o lo que sea. El sistema
lo registra en vez de pelearse con vos.

### 11.1 Cómo funciona
Desde Home o desde Entrenar, donde dice cuál es la siguiente sesión, un **cambiar**.
Elegís otra rutina del plan, una VR, o una sesión libre. Entrenás normal.

**El plan avanza igual.** La rutina que tocaba no queda trabada adelante: se hace en la
próxima vuelta de la cola. Si la evitás sistemáticamente, eso aparece en los datos en vez
de bloquearte la app.

### 11.2 Qué queda registrado
La rutina prevista, la realizada y un motivo opcional. **Los tres**: sin lo previsto,
el análisis no puede ver el patrón. Con dos meses de datos esto permite decir "cambiaste
tren inferior en seis de diez veces que te tocó", que es información sobre el plan, no
sobre la disciplina de quien entrena.

Lo único nuevo es `rutinaPrevista` (más `motivoCambio`). **La realizada ya existe y es
`Historial.idRutina`.** Cuando el cambio es a una sesión libre no hay id, y lo realizado se
lee de `tipo: "libre"`.

### 11.3 Adherencia y cobertura
Dos métricas separadas, por la misma razón que racha del plan y días activos:
- **Adherencia** — entrenaste. Cambiar tren inferior por VR la deja intacta.
- **Cobertura del plan** — hiciste lo que el plan pedía. Baja cuando cambiás.

La semana cuenta como cumplida para el contador de carga (bloque 10.3) hayas hecho lo que
hayas hecho. Cualquiera de las dos métricas sola miente; juntas cuentan la historia.

### 11.4 Aviso por esquive repetido
A la **tercera vez** que cambiás la misma rutina, el sistema lo dice. No como reproche:
como señal de que esa rutina probablemente no va más en tu plan.

El contador de sustituciones del bloque 7 es **otra señal**, no la misma: avisa a la
**sexta** sustitución de un ejercicio. Dos señales, dos umbrales —**tercera** para cambiar el
día, **sexta** para sustituir un ejercicio— y no se unifican.

### 11.5 Descartado explícitamente
Se evaluaron y se rechazaron dos diseños más ambiciosos:
- **Deuda a nivel ejercicio** (el ejercicio salteado pasa al día siguiente). El día
  siguiente casi nunca es el día correcto: arrastrar un empuje al día de piernas rompe el
  split que justifica el programa. Y lo salteado por dolor es precisamente lo que no debe
  reaparecer mañana.
- **Cajón de pendientes con caducidad.** Consecuencia del anterior; sin deuda a nivel
  ejercicio no tiene razón de existir.

Dentro de la sesión sigue habiendo dos herramientas para el mismo problema: **sustituir**
(bloque 3) cambia un ejercicio por otro el mismo día, y **saltar** (bloque 1) lo descarta
registrando el motivo.

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
| `Historial.rutinaPrevista?` + `motivoCambio?` | 11 |
| Cobertura del plan como métrica derivada, separada de adherencia | 11 |

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
- **Serie H** — elimina el paso manual del ZIP. La vía Drive (Health Sync → Google Drive,
  ADR #031) es automática pero no trae la curva de FC de las sesiones de fuerza (§15). La vía
  D (Samsung Health Data SDK) está verificada y trae la curva completa (§15.8, ADR #036),
  pero exige app nativa y la decisión de pagar ese costo está pendiente (P88′). El adaptador
  (P89, H3) espera a P75 —el bloque 5 define el tipo normalizado y qué se hace con lo que
  llega— y a P88′ (§11).
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
| P81 | Arreglos de planificación: pausa (las dos ramas de `getProgramaActivo`), días opcionales, `diaSemana` informativo | — |
| P82 | Cola + atraso en semanas de ciclo + fin de ciclo | P81 |
| P83 | Contador de semanas de carga + propuesta de descarga | P82 |
| P84 | VR: chip de dificultad y marca de confiabilidad de FC | P72 |
| P85 | VR: progresión por FC con la escalera de palancas | P84 |
| P86 | VR: métricas propias en la vista por ejercicio — superficie sobre `recuperacionBpm` ya calculado, no derivación desde la curva. `recuperacionBpm` sale de la curva (`matchBiometrico.ts:168`), no de `exercise.recovery_heart_rate`: **no está roto, espera la curva** — la vía A nunca la trae en sesiones de fuerza, la vía D sí (9.4) | P78, P84 |
| P87 | Bloque 11 — cambiar el día, registro previsto/realizado, cobertura, aviso al tercer esquive | P82 |
| H2 | Verificación manual de la vía D (Samsung Health Data SDK) con DataViewer — sin código, **no es un prompt**. ✅ **Ejecutada el 15/09/2026: positivo** (§15.8) | — |
| P88′ | PoC de la vía D: proyecto Android aparte, sin plugin (`docs/prompts/88prima-poc-data-sdk.md`). H2 ya confirmó que el camino existe: P88′ **mide cuánto cuesta y si es estable sin intervención** (ADR #036) | H2 ✅ |
| P89 | H3 — adaptador Health Sync → tipos de entrada existentes | P75, P88′ |
| P90 | H4 — lectura de Drive, sync al abrir, idempotencia de doble vía | P89 |

**P89 depende de P75 y de P88′.**
- **P75** (P66e): define el tipo normalizado del ADR #033; un adaptador escrito antes tendría
  que inventar su propia normalización.
- **P88′** (P66f): si la vía D se adopta, el adaptador cambia de fuente y de forma, y esperar
  es barato comparado con reescribirlo. Si P88′ termina descartando la vía D por costo, P89 se
  desbloquea con la vía A como fuente única, sin cambios respecto de lo planificado.

H2 quedó reservado para la verificación manual, ya ejecutada. P90 pasó de "H3" a "H4" para no
chocar con P89 (§16.11).

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

---

## 14. Discrepancias detectadas (P66c, 2026-09-14)

Verificación del bloque 11 y de la serie H revisada contra el código y los docs. **Nada
de esta sección modifica las decisiones.** §12 y §13 quedan intactas.

### 14.1 La señal que "adelantaría la descarga" hoy no tiene datos

10.3 dice que `recomendaciones.ts` "ya vigila FC de reposo elevada". El código la vigila
(regla 3, `lib/recomendaciones.ts:92,140`), pero la señal `fc-reposo` **sale siempre
`sin-datos`** (`lib/resumenSalud.ts:129`): el ZIP no trae reposo real
(`docs/SAMSUNG-HEALTH-MAPEO.md:102`, verificado en P56). La regla existe y nunca dispara.
Esto no cambia la decisión, pero refuerza la pregunta 4 de H1′: si Health Sync trae FC de
reposo, la entrada futura de 10.3 pasa de hipotética a posible.

### 14.2 §10 y §11 ya no dicen lo mismo sobre la serie H

El diferido de §10 sigue diciendo "Serie H (Health Connect) — entra cuando el bloque 5
esté estable, porque el bloque 5 define qué se hace con lo que llega". §11 ahora pone
**P88 sin dependencias** y P89 → P88, P90 → P89, sin atarlos a P75. Para el spike (P88,
sin código) no hay conflicto: se puede correr cuando sea. Para **P89/P90 sí**: el riesgo
central de la serie H es la idempotencia contra el id que define el bloque 5, así que
escribir el adaptador antes de P75 implicaría adivinar esa clave. El nombre "Health
Connect" del diferido también quedó viejo (ADR #031). No se corrigió en el lugar porque
P66c no lo pide; queda para decidir si P89 depende también de P75.

### 14.3 "Mismo criterio" que el bloque 7, distinto umbral

11.4 avisa a la **tercera** vez que cambiás una rutina y dice que es el mismo criterio que
el contador de sustituciones del bloque 7, que habla de "sustituirlo **seis** veces
seguidas". La idea es la misma (señal de que eso no va más en el plan); los números no.
P78 y P87 van a necesitar decidir si comparten umbral.

### 14.4 `rutinaRealizada` ya existe con otro nombre

`Historial.idRutina` (`models.ts`, "ausente en sesiones libres") es la rutina realizada;
por eso §9 sólo agrega `rutinaPrevista?` + `motivoCambio?`, y está bien. Lo que P87 tiene
que resolver: cuando el cambio es a una **sesión libre** no hay `idRutina`, así que "lo
realizado" se lee de `tipo: "libre"`, no de un id.

### 14.5 `CLAUDE.md` sigue diciendo "plan Spark" en otros lugares

La serie H nueva dice **Blaze habilitado**, pero `CLAUDE.md` mantiene "plan Spark" en
"Qué es" (línea 9) y cita "costo Spark" como motivo en la regla de métricas diarias
(ADR #016), en ADR #020, en ADR #023 y en el roadmap viejo (backup CSV). Los motivos de
esos ADRs siguen siendo razonables —el nivel gratuito de Blaze tiene los mismos límites—,
pero la línea de "Qué es" contradice a la serie H en el mismo archivo. Igual con
`docs/ESTADO-DEL-PROYECTO.md:59-61`, que describe el cascarón nativo como el único camino a
sync automático. P66c sólo autoriza reemplazar la sección de la serie H, así que no se
tocaron.

### 14.6 Verificado y correcto (para constancia)

`docs/prompts/61-h0-plan-serie-h.md` propone ADR #026–#029 (sync on-device sin backend,
Capacitor con web remota, APK directo, sync al abrir) y pedía marcar la serie H "en
curso — fase H1": nada de eso se aplicó (`CLAUDE.md` seguía en "no arrancada"). La curva
de FC sale de `live_data.json` dentro del ZIP, indexada por `datauuid`
(`import/samsungZip.ts:93-94,176`). `docs/auditorias/` está gitignoreada (`.gitignore:26`),
así que el reporte de H1′ tiene dónde ir. `Historial` no tiene todavía `rutinaPrevista`,
`motivoCambio` ni nada de cobertura.

---

## 15. Serie H — reporte de auditoría (14/09/2026)

El 14/09/2026 se auditó la misma sesión de entrenamiento por las dos vías disponibles:

- **Vía Drive** — Health Sync (pago) exporta Health Connect a Google Drive, automático y
  diario.
- **Vía ZIP** — exportación manual de datos personales desde la app de Samsung Health.

La sesión de referencia es un workout custom llamado "ShapeUp". **Los números de esta
sección son medidos, no estimados**, y quedan registrados porque re-derivarlos cuesta otra
auditoría completa. Las decisiones que salen de acá son los ADR #032 a #035.

### 15.1 Sesión de referencia

| | |
|---|---|
| `datauuid` (ZIP) | `1ed92d6b-3280-4e02-a05c-7123cda97205` |
| Inicio | `2026-09-14T20:34:52.506Z` — epoch ms `1789418092506` |
| Fin | `2026-09-14T21:44:22.441Z` |
| Offset local | `UTC-0300` |
| `custom_id` | `mq1mz4gd_gq` → `custom_exercise.custom_name` = **"ShapeUp"** |

### 15.2 La misma sesión, campo a campo

| Campo | ZIP | Drive | Observación |
|---|---|---|---|
| Inicio | `2026-09-14 20:34:52.506` UTC | `2026-09-14T20:34:52.506Z` (TCX) | **idéntico al milisegundo** |
| Fin | `21:44:22.441` | `21:44:22.441` | idéntico |
| Tipo | `exercise_type = 0` | `TRAINING` | token distinto por vía |
| Duración activa | `4 152 962` ms | — | solo ZIP |
| Duración transcurrida | `4 169 935` ms (fin − inicio) | `4169` s, transcurrido = activo | Drive colapsa ambas |
| Calorías | `604.0` | `604.0` | idéntico |
| FC media | `118,12` | `115` | Drive deriva |
| FC máxima | **`174`** | **`144`** | 30 bpm de error |
| FC mínima | `83` | ausente | solo ZIP |
| Muestras de FC | `heart_rate_sample_count = 12 839` | `2` | — |
| Nombre | "ShapeUp" vía `custom_id` | `null` | solo ZIP |

La curva está en `<datauuid>.com.samsung.health.exercise.live_data.json` dentro del ZIP:
**4133 puntos, 4112 con `heart_rate`**, mediana de intervalo `1,0 s`, intervalo máximo
`17,481 s`. Recalculada desde esos puntos: media `118,21`, máximo `174`, mínimo `83`.

El intervalo máximo de `17,5 s` coincide con la diferencia entre duración activa y
transcurrida (`16,97 s`). Es una pausa real, y sirve como test de integridad para cualquier
adaptador futuro.

### 15.3 Las estadísticas de la vía Drive son derivadas, no medidas

Verificado contra las tres caminatas del mismo día, donde la vía Drive **sí** trae curva:

| Caminata (inicio UTC) | Muestras en TCX | Media real | Media en CSV | Máx real | Máx en CSV |
|---|---|---|---|---|---|
| `14:16:30.336` | 490 | 107,46 | 107 | 121 | 121 |
| `15:48:51.925` | 628 | 95,92 | 95 | 108 | 108 |
| `17:13:15.864` | 659 | 104,01 | 104 | 119 | 119 |

Health Sync trunca la media de las muestras que tiene y toma el máximo de esas mismas
muestras. El `.fit` que entrega lo genera él mismo: el de la primera caminata declara
`avg_heart_rate: 107` con 491 records, y el del entrenamiento declara `avg_heart_rate: 115`
con **2** records — exactamente `(144 + 86) / 2`.

**Conclusión:** para una sesión sin curva publicada, la FC media y máxima de la vía Drive no
son el resumen de Samsung. Son un promedio de dos puntos disfrazado de resumen, y **no se
pueden persistir** (ADR #034).

### 15.4 La hipótesis de retraso de publicación queda descartada

Se reexportó Drive a las 20:06 local, 82 minutos después del fin de la sesión. El archivo de
frecuencia cardíaca del 14/09 llega hasta `19:30:31`, y la ventana `17:34–18:44` sigue
teniendo **dos muestras** (`17:53:00 → 144` y `18:41:00 → 86`).

Distribución de muestras por hora en ese archivo:

| Hora local | 00–07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15–19 |
|---|---|---|---|---|---|---|---|---|---|
| Muestras | 60 c/u | 37 | 2 | 5 | 493 | 521 | 115 | 663 | 2 c/u |

Las horas densas son las caminatas (1 Hz). Durante el entrenamiento, lo que se publica a
Health Connect es el muestreo pasivo, no el de ejercicio.

### 15.5 El ZIP trae sesiones que la vía Drive no

El 14/09 el ZIP tiene **seis** filas de ejercicio y la vía Drive **cuatro**. Las dos extra:

| Inicio UTC | Tipo | `live_data_internal` | FC |
|---|---|---|---|
| `2026-09-14 14:57:05.000` | 1001 | vacío | ausente |
| `2026-09-14 15:50:04.000` | 1001 | vacío | ausente |

Las dos comparten tres marcas: milisegundos en `.000`, `live_data_internal` vacío y ningún
campo de FC. Las sesiones con curva real siempre tienen `live_data_internal` poblado y
milisegundos distintos de cero.

La de `15:50:04 – 16:02:00` **se solapa casi por completo** con la caminata real de
`15:48:51.925 – 16:02:23.857`. La de `14:57:05` no se solapa con nada.

Importa porque el bloque 5 dice que toda actividad de Samsung entra al historial: con esa
regla, estas dos entran por ZIP, no tienen contraparte por Drive, y una de ellas duplica una
caminata ya contada. Lo resuelve el ADR #035.

### 15.6 La recuperación post-ejercicio de Samsung no existe para sesiones custom

La tabla `com.samsung.shealth.exercise.recovery_heart_rate` del ZIP tiene 48 filas,
**ninguna del 14/09**; la más reciente es del 28/07. Samsung genera recuperación
post-ejercicio solo para ciertos tipos de actividad, y el workout custom no es uno de ellos.

Consecuencia para 9.4 y P86: si el cálculo de `recuperacionBpm` lee esa tabla, para las
sesiones de ShapeUp nunca va a tener dato y el bloque queda vacío en producción. Si lo
deriva de la curva del `live_data.json`, funciona. **Verificar de cuál de las dos fuentes
sale antes de dar P86 por cerrado** (estado al commit de P66e: §16.2).

### 15.7 Trampas ya detectadas, para no re-derivarlas

- **Granularidad canónica de la vía Drive: el archivo diario.** Los archivos semanales
  (`37-2026`), de 30 días y de rango repiten el mismo dato para períodos ya cerrados. La
  semana `37-2026` va de lunes 07 a domingo 13, lo que confirma la convención
  lunes-a-domingo del bloque 10.
- **Pasos duplicados dentro del archivo diario:** la primera fila de las `00:00:00` es el
  acumulado del día y las siguientes son incrementos. Sumar todo duplica.
- **El archivo de sueño mezcla dos noches.** Consolidar por continuidad temporal, nunca por
  nombre de archivo.
- **`Energía quemada` diaria:** las calorías activas vienen siempre en `0.0`. Las kcal útiles
  vienen por actividad. Las de reposo sí traen valor.
- **Composición corporal por Drive:** llegan peso, porcentaje de grasa y metabolismo basal;
  todas las masas en `0.0`. El ZIP las trae pobladas.
- **Ningún archivo de la vía Drive tiene identificador por registro.**

### 15.8 Verificación de la vía D (15/09/2026)

Se instaló el DataViewer del Samsung Health Data SDK 1.1.0 con el modo desarrollador de
lectura activado, y se inspeccionó la misma sesión de referencia. Es **H2**; su decisión es
el ADR #036.

**La vía D no devuelve un dato parecido al del ZIP. Devuelve el mismo dato, con el mismo
identificador.**

| Campo | ZIP | Vía D (SDK) | Vía Drive |
|---|---|---|---|
| `uid` / `datauuid` | `1ed92d6b-3280-4e02-a05c-7123cda97205` | **idéntico** | ausente |
| Inicio | `2026-09-14T20:34:52.506Z` | **idéntico** | idéntico |
| Fin | `2026-09-14T21:44:22.441Z` | **idéntico** | idéntico |
| Puntos de curva | 4133 | **4133** | 2 |
| FC máxima | 174 | **174,0** | 144 (derivada) |
| Calorías | 604,0 | **604,0** | 604,0 |
| Duración | 4152 s (activa) | **4152 s (activa)** | 4169 s (transcurrida) |
| Nombre | "ShapeUp", vía tabla `custom_exercise` | **`customTitle: "ShapeUp"`, directo** | `null` |
| `zoneOffset` | `UTC-0300` | `-03:00` | solo en el TCX, como `Z` |

Detalles adicionales medidos:

- **La pausa aparece sola.** Entre las dos últimas entradas del `log` hay un salto de 17,48 s
  (`21:44:22.414Z` ← `21:44:04.933Z`), el mismo hueco medido en el `live_data.json` del ZIP y
  la misma diferencia entre duración activa y transcurrida. Sirve como test de integridad del
  adaptador.
- **Cada entrada del `log`** tiene `timestamp`, `cadence`, `count`, `heartRate`, `power` y
  `speed`. En la sesión de fuerza solo `heartRate` viene poblado; el resto es `null`.
- **Las seis sesiones del 14/09 están listadas**, incluidas las dos autodetectadas de
  `14:57:05Z` y `15:50:04Z` que la vía Drive no entrega. El ADR #035 sigue aplicando.
- **La vía D entrega más muestras que la vía Drive incluso donde Drive funciona.** La caminata
  de control de `17:13:15.864Z` trae `log` con 677 entradas contra 659 muestras en el TCX de
  Drive. La FC máxima coincide en 119.
- **El tipo se llama `OTHER`**, no `0`. `countType` viene `UNDEFINED`, y `count`, `distance` y
  `maxSpeed` vienen en `0.0`: son exactamente los ceros que la regla 1 del ADR #034 tiene que
  convertir en campo ausente.
- El nivel superior expone además `appId` (`com.sec.android.app.shealth`), `deviceId` y
  `zoneOffset`, que ninguna de las otras dos vías entrega juntos.

#### M1 del puente: lectura verificada

M1 del puente —la app Android que lee Samsung Health con el Data SDK— se verificó contra la
sesión de referencia y coincide exacto:

| | Valor |
|---|---|
| Entradas en `log` | 4133 |
| Con `heartRate` | 4112 |
| Media | 118,213 |
| Máximo | 174 |
| Mínimo | 83 |
| Salto máximo | 17.481 ms |

**Por la vía D, el resumen de FC es confiable.** La media que entrega el SDK es la de Samsung
(118,120415, idéntica al ZIP), computada sobre las 12.839 muestras crudas. El `log` viene
agregado a 1 Hz, y recalcular sobre él da 118,213. Por la vía D el resumen es confiable y se
usa el reportado.

Fricción operativa medida:

- Los permisos sobreviven al reinicio de la app.
- El modo desarrollador de Samsung Health sigue activo sin reintervención.
- 118 KB por sesión con curva, así que en M3 la lectura incremental es una optimización, no un
  requisito.

### 15.9 Composición corporal: tres escritores, dos métodos, un solo dato repetido

El tipo de dato **Body Composition** del SDK entrega las masas **pobladas**, no en `0.0` como
la vía Drive. Con esto **el ZIP deja de ser necesario como vía de ingesta**: no queda ningún
campo que solo él entregue.

Eso resuelve el cero que se arrastraba desde P56, y con mecanismo. Health Sync escribe la
medición de la balanza hacia dos destinos: a Samsung Health entra completa, y a Health Connect
entra con las masas perdidas, porque **Health Connect no tiene tipo para masa muscular
esquelética**. Por eso el ZIP las trae y la vía Drive las da en `0.0`. El dato no falta en el
origen: se cae en la salida.

#### Tres aplicaciones escriben composición corporal

| `appId` | `deviceId` | Fuente de la medición | Qué aporta |
|---|---|---|---|
| `com.sec.android.app.shealth` | `9XdbeBZKBf` | reloj, bioimpedancia de muñeca | composición completa; **no pesa** |
| `nl.appyhapps.healthsync` | `DQLXfARDMe` | balanza Xiaomi, vía Garmin | composición y peso |
| `com.garmin.android.apps.connectmobile` | — | balanza Xiaomi | **solo peso** |

Son **dos métodos de medición distintos** —muñeca y pie— y **dos puentes para uno de ellos**.
La distinción importa porque se tratan al revés: **los métodos nunca se mezclan, los puentes
nunca se duplican.**

#### Los dos métodos no son intercambiables

Perfil de campos medido, reloj contra balanza:

| Campo | Reloj | Balanza (vía Health Sync) |
|---|---|---|
| `muscle_mass` | `null` | poblado |
| `skeletal_muscle` | poblado | `null` |
| `skeletal_muscle_mass` | **33,553402** | **29,7** |
| `fat_free` / `fat_free_mass` | poblados | `null` |
| `basal_metabolic_rate` | poblado | `null` |
| `total_body_water` | 45,92318 | 41,435204 |
| `weight` | 89,3 (heredado) | 89,3 (medido) |

El único campo que las dos llenan, `skeletal_muscle_mass`, difiere en casi cuatro kilos.
Ninguna de las dos está mal: son métodos distintos. **Una serie que mezcle fuentes muestra ese
salto como cambio de composición cuando es cambio de aparato.**

Además los campos son casi complementarios, y eso vuelve activamente peligroso cualquier merge
del tipo "tomo el campo que no sea nulo": produciría un registro con `muscle_mass` de la
balanza y `skeletal_muscle_mass` del reloj, medidos por métodos distintos, presentado como una
sola medición. **Ese registro no existe en la realidad.**

**Decisión: serie por fuente de medición, sin merge entre fuentes.** No es una preferencia de
presentación: mezclarlas fabrica un dato.

#### El peso del reloj es heredado, no medido

El registro del reloj del 15/09 trae `weight: 89.3`, el mismo valor que el registro de la
balanza del 05/09, diez días antes. El reloj no tiene celda de carga: **toma el peso del perfil
y lo escribe con el timestamp de la medición de hoy**.

Es el peor caso para la regla 2 del ADR #034: no es un cero ni un campo ausente, es un valor
plausible con cara de medición. **El adaptador descarta `weight` en todo registro cuya fuente
sea el reloj.** Esa exclusión se declara junto a la tabla de fuentes (ADR #033), no se infiere.

#### Trampa de nombres

Conviven campos de porcentaje y de masa con nombres casi iguales, y **no vienen los dos**:
`skeletal_muscle` contra `skeletal_muscle_mass`, `fat_free` contra `fat_free_mass`. Cuál de
los dos viene poblado depende de la fuente, como muestra la tabla de arriba. Mapear por nombre
exacto y no asumir que el par está completo.

#### Otros campos del SDK

- **`bmi`, no `body_mass_index`.** El SDK entrega el índice de masa corporal con ese nombre. Es
  el mismo concepto que el `imc` que ya existe (`models.ts:502`, calculado en
  `samsungHealth.ts:291`). Si se usa el valor reportado o se recalcula como hoy se decide en
  P75.
- **`custom_id` no viaja por el SDK; `customTitle` sí.** El match por `custom_id` queda
  exclusivo del ZIP. Por la vía D alcanza con el nombre.

#### Consecuencias

1. **La clave canónica del ADR #033 necesita un nivel más**: `appId` y tabla de fuentes (ver
   la enmienda del #033).
2. **La vía D no elimina la dependencia de Health Sync.** Para el ejercicio sí. Para la
   composición corporal de la balanza, Health Sync es el único puente que la entrega completa:
   Garmin Connect trae solo el peso. Sin Health Sync, del lado de Samsung queda el reloj y un
   peso suelto.
3. **`deviceId` no identifica el reloj.** `DQLXfARDMe` aparece en la sesión de ShapeUp, en las
   autodetectadas y en los registros de Health Sync: es el teléfono. El reloj es `9XdbeBZKBf`.
   Para distinguir procedencia, **`appId` es la señal fuerte y `deviceId` la débil**; para
   `com.sec.android.app.shealth`, que escribe tanto ejercicio como composición, hacen falta los
   dos.

---

## 16. Discrepancias detectadas (P66e, 2026-09-15)

Verificación de P66e contra el código y los docs al commit `4616d86`. **Nada de esta sección
modifica las decisiones**: los ADR #032 a #035 quedan registrados como se tomaron. §12, §13
y §14 quedan intactas.

### 16.1 Numeración de secciones

P66e asumía que §14 era la última sección, y lo era: el reporte quedó como §15, con las
referencias internas tal cual. El prompt pedía reportar las discrepancias "en §14, como
siempre", pero §14 es la de P66c y cada prompt tuvo su propia sección (§12 P66, §13 P66b,
§14 P66c). Por eso esta va como §16.

### 16.2 `recuperacionBpm` hoy sale de la curva, no de la tabla de Samsung

Verificado: `recuperacionBpm` se calcula en `lib/matchBiometrico.ts:168-182` a partir de la
curva de FC por serie, y lo escribe `lib/enriquecerImport.ts`. La única mención de
`recovery_heart_rate` en `src/` es para **excluir** ese archivo de las métricas genéricas
(`import/samsungHealth.ts:453-462`, fix de P56). P86 no queda vacío por esa causa. Sí
depende de que la sesión tenga curva, y hoy la curva sólo llega por ZIP (ADR #032). La
advertencia de 9.4 y de la fila de P86 se dejó igual, como pide el prompt: hay que volver a
verificarlo cuando P86 se cierre.

### 16.3 El motivo del ADR #035 no coincide con el plan

El ADR #035 justifica descartar la autodetectada solapada porque "una caminata contada dos
veces infla el tonelaje del día y el bloque 10 lo usa para proponer descarga". Dos cosas no
cierran con el texto de los bloques:

- el bloque 5 dice que **una entrada externa no tiene bloques ni tonelaje**, así que una
  caminata duplicada no suma tonelaje;
- 10.3 dispara la descarga por **% de sesiones no opcionales completadas**, no por tonelaje.

Lo que sí infla una caminata duplicada son **días activos**, minutos y kcal del día. La
decisión puede seguir en pie por esa razón, pero el motivo escrito no es el que la sostiene,
y el ADR ya pide revisión. Además, la marca "sin detalle" que el ADR dice que "ya usa" la
carga manual del bloque 6 **todavía no existe en el código**: es `Historial.completitud`,
planificado en §9 (P77). En el ADR quedó como "la misma marca que usa la carga manual".

### 16.4 El tipo normalizado `fuerza` también cubre VR

El ADR #033 normaliza `exercise_type = 0` / `TRAINING` a `fuerza`. Pero el reloj usa **un
solo workout custom para fuerza y VR** (ADR #028), así que una sesión VR llega con el mismo
tipo 0. Para la clave no hay problema: sólo necesita ser igual en las dos vías, y lo es. El
riesgo es que P75 lea `fuerza` como semántica y clasifique por eso. La regla del ADR #028
sigue mandando: **qué ejercicio fue lo dice la app, no el tipo de Samsung**. Hoy
`resolverActividad` resuelve el tipo 0 a "ShapeUp", no a "fuerza".

### 16.5 El nombre "H2" choca con la fila de P89

La tabla de §11 ya tenía **P89 = "H2 — adaptador Health Sync"** y **P90 = "H3"**, desde P66c.
P66e agrega **H2 = verificación manual con DataViewer**. Quedaron dos "H2" distintos en la
misma tabla. No se renombró nada porque P66e no lo pide. Hay que decidir si P89 y P90 pasan a
"H3" y "H4", o si la verificación manual toma otro nombre.

En la misma tabla:

- P66e describe P88′ como "PoC del plugin", pero su propio prompt
  (`88prima-poc-data-sdk.md`) dice explícitamente "no construyas un plugin Capacitor": es un
  proyecto Android aparte. La fila usa la descripción del prompt P88′.
- P89 dependía de P88 (el spike H1′), y esa fila se reemplazó. Quedó dependiendo sólo de
  P75. Lo que respondió H1′ es este §15, que cubre las preguntas 1 y 2 pero no la 3, la 4 ni
  la sesión de VR. El owner tiene que decidir si H1′ se da por cerrado y si P89 debe esperar
  también el resultado de P88′, porque si la vía D funciona, el ADR #032 se supersede.

### 16.6 Detalles menores en el texto de P66e

- El ADR #032 decía "se identifican **cuatro** vías", con una tabla de **cinco**. Se
  registró como cinco, coherente con la Tarea 4.1.
- La regla 1 del ADR #034 dice que el cero se omite "como ya hace `stripUndef`".
  `stripUndef` sólo saca claves `undefined` (`import/samsungHealth.ts:194-199`); **no toca
  ceros**. La conversión de `0.0` a ausente es código nuevo del adaptador; `stripUndef` sólo
  cubre el paso de omitir.
- FC media de la sesión de referencia: `118,12` es el resumen que guarda Samsung y `118,21`
  la recalculada desde la curva (§15.2). No es un error; son dos medidas. El criterio de
  P88′ (±1 bpm sobre `118,21`) cubre las dos.

### 16.7 "Spark" que quedó sin tocar

P66e autoriza corregir la línea "Qué es" de `CLAUDE.md`, las notas al pie de los ADR #016,
#020 y #023, y `ESTADO-DEL-PROYECTO.md`. Quedan tres menciones fuera de ese alcance:

- la regla de trabajo "(ADR #016, costo Spark)" en `CLAUDE.md`;
- "Backup/export CSV (plan Spark…)" en el roadmap viejo de `CLAUDE.md`;
- el resumen "#016 … por costo Spark" en `ESTADO-DEL-PROYECTO.md`.

Con la aclaración nueva de "Qué es" ninguna es falsa, pero están.

### 16.8 Verificado y correcto (para constancia)

- `"1001": "Caminata"` en `import/samsungHealth.ts:235` (fix de P55), coherente con la tabla
  del ADR #033.
- `recuperacionBpm` derivado de la curva (§16.2).
- El aviso "SUPERADO por P66c — no re-aplicar" sigue arriba de todo en
  `docs/prompts/61-h0-plan-serie-h.md:3-8`.
- `Historial.idRutina` es la rutina realizada (§14.4), corregido en 11.2.
- `tsc -b` limpio y **553 tests verdes** sin emulador (44 salteados; la suite de reglas falla
  sin emulador, como antes). Mismo resultado antes y después del prompt.

### Adenda P66f (2026-09-15)

P66f incorporó el resultado de H2 (§15.8, §15.9, ADR #036) y resolvió los puntos de arriba.
Los textos de 16.1 a 16.8 quedan como registro de P66e; el estado vigente es este:

| Punto | Resolución en P66f |
|---|---|
| 16.2 | P86 no está roto, espera la curva. 9.4 y la fila de P86 reescritas en ese sentido |
| 16.3 | Motivo del #035 reemplazado: días activos, minutos y kcal. Decisión sin cambios |
| 16.4 | El tipo normalizado del workout custom pasa a `otro` (#033 enmendado) |
| 16.5 | P89 → **H3**, depende de P75 y P88′. H1′ cerrado para la vía Drive. "PoC del plugin" → "PoC" en `66e-reporte-serie-h.md` |
| 16.6 | "Cinco vías" se deja. Regla 1 del #034 corregida: la conversión de ceros es del adaptador |
| 16.7 | Las tres menciones de "Spark" corregidas a Blaze con los mismos topes |

Discrepancias nuevas de P66f, verificadas contra el código y los docs:

### 16.9 `appId` en la clave: ZIP y Drive no lo entregan hoy — **a resolver antes de P75/P89**

El #033 nació para que dos vías produzcan **la misma clave** para el mismo hecho. Con `appId`
dentro de la clave, cada vía tiene que producir también el mismo `appId`:

- **Vía D**: lo trae (§15.8).
- **Vía Drive**: ningún archivo tiene identificador por registro (§15.7), y la auditoría no
  registró que traiga la app de origen.
- **Vía ZIP**: el código no lee ninguna columna de app ni de dispositivo. `parsearPeso` y el
  parser de ejercicio usan `datauuid`, `start_time`, `time_offset` y valores; no hay
  `pkg_name` ni `deviceuuid` en `src/`. Si el export los trae es algo que no está verificado
  en este repo.

Mientras no se defina de dónde sale `appId` en esas vías, la clave del #033 no se puede
calcular igual en las tres. El "Nivel 1" del #033 queda bien para la vía D sola.

Relacionado: la sesión de ShapeUp llega con `appId = com.sec.android.app.shealth` y
`deviceId = DQLXfARDMe`, el teléfono (§15.9, consecuencia 3). La tabla de fuentes declara
`com.sec.android.app.shealth` sólo con `deviceId 9XdbeBZKBf`, el reloj. Leída literalmente,
"`appId` fuera de la tabla → para y reporta" frena **toda sesión de ejercicio** de la vía D.
La tabla parece pensada para composición corporal; falta decidir si también aplica a ejercicio
o si hay que agregar la fila.

### 16.10 H1′: preguntas 3 y 4, texto literal

Transcriptas **sin reescribir ni responder** de `CLAUDE.md`, sección "H1′ — Spike sin código",
tal como están al momento de P66f:

> 3. **¿Cada cuánto escribe?**
> 4. **¿Trae FC de reposo y HRV?** `docs/SAMSUNG-HEALTH-MAPEO.md` registra que `fc-reposo`
>    **no tiene fuente en el export del ZIP** (verificado en P56): `tracker.heart_rate` es
>    un agregado esporádico, no reposo real. Health Connect sí tiene un tipo dedicado. Si
>    esta vía lo trae, la serie H no solo saca un paso manual: **destraba un dato hoy
>    imposible**, y con él la señal que puede adelantar la descarga del bloque 10.3.

La sesión de VR sale del enunciado del spike: "un día que incluya **una sesión de fuerza, una
de VR y una noche de sueño**". Las tres cosas quedan pendientes de reformularse contra la
vía D.

### 16.11 "H3" también estaba tomado

Desde P66c, **P90 era "H3 — lectura de Drive"**. Renombrar P89 a H3 generaba un segundo
choque, así que **P90 pasó a H4**, que es la opción que ya planteaba 16.5. Si el owner
prefiere otra, es cambiar una celda.

Aparte, el backlog de `docs/MAPEO-IMPLEMENTACION.md` ("Backlog / roadmap", letra H) tiene
**H1–H3** con otro significado: wizard inicial, test de calibración y editor de FCmáx. Son
nombres de otro espacio, pero se leen igual que las etapas de la serie H.

### 16.12 El importador del ZIP ya mezcla fuentes de composición corporal

`parsearPeso` (`import/samsungHealth.ts:272-309`) guarda cada fila de `body_weight` **sin
mirar app ni dispositivo**: es idempotente por `datauuid` y no filtra por fuente. Los tres
escritores de §15.9 escriben en Samsung Health, así que lo esperable es que el ZIP los
contenga a todos (no se verificó con un ZIP). Si es así, **el código en producción hoy hace lo
contrario de la decisión de §15.9**:

- los registros del reloj y de la balanza entran en **la misma serie** de mediciones: el
  cambio de aparato aparece como cambio de composición;
- el `weight` heredado del reloj se guarda como `pesoKg` medido, con la fecha del reloj;
- `masaMuscularKg` sale de `muscle_mass`, que en el reloj es `null` y en la balanza viene
  poblado, y `skeletal_muscle_mass` no se lee.

No se tocó nada: P66f no toca runtime, y la decisión de §15.9 está escrita para el adaptador
futuro. Falta decidir si el importador del ZIP se corrige antes de P75 o dentro de P75, y si
hay que depurar las mediciones ya guardadas.

### 16.13 Inconsistencias menores del texto de P66f

- **`deviceId` como discriminador de las autodetectadas (#035).** §15.9 dice que `DQLXfARDMe`
  (el teléfono) aparece tanto en la sesión de ShapeUp como en las autodetectadas, así que
  `deviceId` por sí solo no las separa; el `log` vacío sí. Quedó registrado tal como vino.
- **"El ZIP deja de ser necesario como vía de ingesta" (§15.9, #036).** Es cierto sobre el
  dato. En el código, la única vía implementada de la curva y de la composición sigue siendo
  el ZIP, y la vía D no está decidida. `CLAUDE.md` y `ESTADO-DEL-PROYECTO.md` lo dicen así.
- **"El cero que se arrastraba desde P56".** P56 registró la falta de `fc-reposo`
  (`SAMSUNG-HEALTH-MAPEO.md:102`). Las masas en `0.0` por Drive se detectaron en la auditoría
  del 14/09 (§15.7). §15.9 se transcribió como vino.
- **El #033 anuncia "dos cambios" y trae tres.** Los tres se aplicaron.

### 16.14 Verificado y correcto (para constancia)

- `recuperacionBpm` se deriva de la curva (`lib/matchBiometrico.ts:168-182`), sin cambios desde
  16.2.
- El #032 conserva el cuerpo intacto; sólo se agregó la línea de estado "SUPERSEDED por #036".
- El prompt P88′ (`docs/prompts/88prima-poc-data-sdk.md`) no se modificó.
- `tsc -b` limpio y **553 pasados / 44 salteados** sin emulador, igual que antes del prompt.
