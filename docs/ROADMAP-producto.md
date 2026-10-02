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
- **Información y orden en la sesión** (P68b). Saber qué hay y poder cambiar el orden:
  - el objetivo dice **"Serie N de M"** (o "Serie extra" con el bloque completo);
  - **"A continuación: {ejercicio}"** debajo del objetivo, y en el descanso previo a la
    última serie;
  - **vista del día**: todos los ejercicios con su estado (hecho, en curso, parcial,
    salteado, pendiente). Se abre sola al entrar a una rutina sin series, se abre también
    tocando el contador "Ejercicio X de N", y permite ir a cualquier ejercicio. Es donde
    después va a vivir **"recortar la rutina"** del bloque 8;
  - los ejercicios salteados se pueden **retomar** desde la vista del día, desde el chip
    "Saltaste X · Volver" o desde la pantalla de fin, que ahora aparece cuando todo está
    hecho o salteado ("Sesión terminada" si algo quedó salteado);
  - el **"atrás" del sistema** (navegador o Android) pasa por la hoja de salida.
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

Firestore tiene caché persistente activada, así que una escritura simple (`setDoc`,
`writeBatch`) sin conexión se guarda local y se encola sola, pero su promesa no resuelve
hasta que el servidor confirma. **Las transacciones no se encolan: sin conexión fallan.**
Por eso el guardado de la sesión (`finalizarSesion`) pasó de `runTransaction` a
`writeBatch` en P69. Sin el timeout, en el subsuelo de un gimnasio el botón quedaría en
"Guardando…" indefinidamente: no falla, no avanza, y por eso tampoco muestra el error que
el código sí maneja (`if (!result.ok) setSaveError(...)`, que además conserva el estado
local).

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

- **Análisis por LLM → construido para la sesión en P93 (30/09/2026).** Diseño en
  [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md), regla en el **ADR #044** (lo medido y lo
  interpretado no se mezclan). Se guarda en `historial.analisis`, no en `/recomendaciones`:
  **el ADR #023 no se toca**, porque las recomendaciones de Home siguen derivándose al vuelo. El
  análisis global de varias semanas es P94. Texto original del diferido, para la historia:
  El usuario exporta un snapshot de salud e historial, lo pega en un
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

Lo que viene. **Lo ejecutado está en `docs/MAPEO-IMPLEMENTACION.md` §1.** La tabla del plan de P66
(P67–P90, con su numeración vieja) se movió a `docs/reportes/roadmap-11-plan-P66.md`.

| Prompt | Contenido | Depende de |
|---|---|---|
| P100 | Orden de la documentación ✅ | — |
| P97 | ✅ (02/10) Zonas como las cuenta Samsung: la convención de redondeo, la FC máxima declarada con su origen y las zonas guardadas en cada sesión. Las marcas usan zonas, y no se mide sobre datos que se están por corregir. Ver [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md), «Marcas y análisis en dos capas» | P92c, P93 |
| P98 | Rutinas de VR y progresión: rutinas por tiempo, dos modos y una regla que calcula el sistema. La progresión se muestra en la rutina, no como marca de la sesión. Ver [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md) | P93 |
| P99 | Marcas de la app y análisis de sesión en dos capas, en cuatro partes: diagnóstico, marcas de la app, esquema 3 y prompt 4, pantalla. Ver [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md) | P97, P98 |
| P94 | Análisis general sobre un rango de semanas, con focos propuestos para los análisis de sesión. Ver [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md) | P99 |

## Backlog (traspaso del 30/09, §7)

- **Diagnóstico de la sesión libre del 07/07** (ambigua, dos candidatas) y de la **sesión de fuerza del 29/06** (dura 17 min pero sus series abarcan 38,6 y el reloj midió 39; anterior a P84c, sin inicio ni fin guardados). Ambas de lectura, en un mismo prompt.
- **Guardar la prescripción al cerrar las sesiones de fuerza.** Chico, no urgente.
- **P94** — análisis global sobre un rango de semanas. Code avisó que no es trivial: falta el agregado, una colección nueva con sus reglas y otra identidad (miembro y rango).
- **P95** — sincronización incremental y duplicados (18 MB por sincronización, 12 registros duplicados, `updateTime` disponible).
- Del inventario del SDK, aprobado como idea: la **cadencia** como testigo de la FC de muñeca en VR y boxeo, `logWithHeartRate` para la cobertura, `skeletal_muscle_mass`.
  (02/10: la cadencia es también lo que distinguiría un pico real de uno falso en la estimación de la FC máxima; hoy la regla del pico de `fcDudosa` la limita a +10 por revisión. ADR #045.)
- Umbrales aeróbico y anaeróbico de Samsung: no salen por el SDK. Si algún día interesan, van como dato que Juan copia a mano, igual que la FC máxima.
- Backlog viejo: P76 (convertir 9 `shapeup-sin-sesion`), enlazar externas, PRs y logros, panel familiar, PWA completa, registro de eventos de sesión para diagnosticar casos como el 25/09.
- Cerrar el historial de git al terminar el proyecto (mails de menores, ADR #015): pasar a privado o purgar.
- Revisar docs/reportes/pendientes-anteriores-a-P100.md y decidir qué pasa al backlog (correlaciones en Salud, backup CSV, aplicar corregir-mecanica, backlog de junio).


---

Las §12 a §16 (discrepancias de P66 y el reporte de auditoría de la serie H) se movieron a
`docs/reportes/roadmap-informes-P66.md`, con la misma numeración.
