# P66f — H2 dio positivo: ADR #036, enmiendas a #033–#035 y cierre de §16

P66e quedó aplicado sin commit y **envejeció en dos horas**: H2, la verificación manual con
DataViewer, se corrió después de escribirlo y dio positivo. Este prompt incorpora ese
resultado y resuelve las cinco discrepancias que reportaste en §16.

Sigue siendo **solo documentación**. No toca runtime, no crea adaptadores, no escribe a
Firestore.

**Si algo acá es inviable o contradice lo que el código hace, pará y reportá. No
reinterpretes.**

---

## Tarea 1 — §15.8: resultado de H2

Agregar como última subsección de §15.

### 15.8 Verificación de la vía D (15/09/2026)

Se instaló el DataViewer del Samsung Health Data SDK 1.1.0 con el modo desarrollador de
lectura activado, y se inspeccionó la misma sesión de referencia.

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
  (`21:44:22.414Z` ← `21:44:04.933Z`), que es el mismo hueco medido en el `live_data.json` del
  ZIP y la misma diferencia entre duración activa y transcurrida. Sirve como test de
  integridad del adaptador.
- **Cada entrada del `log`** tiene `timestamp`, `cadence`, `count`, `heartRate`, `power` y
  `speed`. En la sesión de fuerza solo `heartRate` viene poblado; el resto es `null`.
- **Las seis sesiones del 14/09 están listadas**, incluidas las dos autodetectadas de
  `14:57:05Z` y `15:50:04Z` que la vía Drive no entrega. El ADR #035 sigue aplicando.
- **La vía D entrega más muestras que la vía Drive incluso donde Drive funciona.** La caminata
  de control de `17:13:15.864Z` trae `log` con 677 entradas contra 659 muestras en el TCX de
  Drive. La FC máxima coincide en 119.
- **El tipo se llama `OTHER`**, no `0`. `countType` viene `UNDEFINED`, y `count`, `distance` y
  `maxSpeed` vienen en `0.0` — son exactamente los ceros que la regla 1 del ADR #034 tiene que
  convertir en campo ausente.
- El nivel superior expone además `appId` (`com.sec.android.app.shealth`), `deviceId` y
  `zoneOffset`, que ninguna de las otras dos vías entrega juntos.

---

## Tarea 1b — §15.9: composición corporal y escritura de terceros

Agregar como subsección siguiente.

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
| `com.garmin.android.connectmobile` | — | balanza Xiaomi | **solo peso** |

Son **dos métodos de medición distintos** —muñeca y pie— y **dos puentes para uno de ellos**.
La distinción importa porque se tratan al revés: los métodos nunca se mezclan, los puentes
nunca se duplican.

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

Y los campos son casi complementarios, lo que hace activamente peligroso cualquier merge del
tipo "tomo el campo que no sea nulo": produciría un registro con `muscle_mass` de la balanza y
`skeletal_muscle_mass` del reloj, medidos por métodos distintos, presentado como una sola
medición. **Ese registro no existe en la realidad.**

**Decisión: serie por fuente de medición, sin merge entre fuentes.** No es una preferencia de
presentación; mezclarlas fabrica un dato.

#### El peso del reloj es heredado, no medido

El registro del reloj del 15/09 trae `weight: 89.3`, el mismo valor que el registro de la
balanza del 05/09, diez días antes. El reloj no tiene celda de carga: **toma el peso del perfil
y lo escribe con el timestamp de la medición de hoy**.

Es el caso peor para la regla 2 del ADR #034: no es un cero ni un campo ausente, es un valor
plausible con cara de medición. **El adaptador descarta `weight` en todo registro cuya fuente
sea el reloj.** Esa exclusión se declara junto a la tabla de fuentes, no se infiere.

#### Trampa de nombres

Conviven campos de porcentaje y de masa con nombres casi iguales, y **no vienen los dos**:
`skeletal_muscle` contra `skeletal_muscle_mass`, `fat_free` contra `fat_free_mass`. Cuál de los
dos viene poblado depende de la fuente, como muestra la tabla de arriba. Mapear por nombre
exacto y no asumir que el par está completo.

#### Consecuencias

1. **La clave canónica del ADR #033 necesita un nivel más.** Ver la enmienda más abajo.
2. **La vía D no elimina la dependencia de Health Sync.** Para el ejercicio sí. Para la
   composición corporal de la balanza, Health Sync es el único puente que la entrega completa:
   Garmin Connect trae solo el peso. Sin Health Sync, del lado de Samsung queda el reloj y un
   peso suelto.
3. **`deviceId` no identifica el reloj.** `DQLXfARDMe` aparece en la sesión de ShapeUp, en las
   autodetectadas y en los registros de Health Sync: es el teléfono. El reloj es `9XdbeBZKBf`.
   Para distinguir procedencia, **`appId` es la señal fuerte y `deviceId` la débil** — y para
   `com.sec.android.app.shealth`, que escribe tanto ejercicio como composición, hacen falta los
   dos.

---

## Tarea 2 — ADR #036, que supersede al #032

Registrar el #036 y marcar el #032 como **superseded by #036**, sin borrar su cuerpo: el
razonamiento que llevó a descartar B y C sigue siendo válido y vale conservarlo.

### ADR #036 — La vía D está verificada y pasa a ser el camino objetivo

**Decisión:** el Samsung Health Data SDK entrega la curva completa de sesiones de ejercicio
custom, con el mismo identificador y los mismos valores que la exportación manual. La vía D
deja de ser una hipótesis abierta y pasa a ser el camino objetivo para todo lo que hoy es
exclusivo del ZIP en materia de ejercicio.

**Lo que la vía D reemplaza del ZIP:** curva de FC, FC media y máxima reales, nombre del
workout, sesiones autodetectadas, distinción entre duración activa y transcurrida,
`recuperacionBpm` derivable, `fcPico`, `fcFinSerie` y la recuperación entre rondas del bloque
9.4.

**Lo que no cambia:**

- Las vías B y C siguen descartadas, por el motivo del #032: leen Health Connect.
- La vía A (Drive) **no se retira**. Es la única automática hoy, cubre cardio, pasos, sueño y
  FC pasiva a cadencia diaria, y no requiere app nativa. La vía D la complementa en el hueco
  que A no cubre; no la sustituye.
- El ZIP deja de ser necesario para el ejercicio **y también para la composición corporal**
  (ver §15.9). Queda como respaldo y como artefacto de archivo, no como vía de ingesta.
- **Health Sync sigue siendo necesario**, aunque se adopte la vía D. No por el ejercicio, sino
  porque es el puente que mete la medición de la balanza en Samsung Health. Adoptar la vía D
  reduce la dependencia de la vía A a cardio, pasos, sueño y FC pasiva; no la elimina.

**Costo, que este ADR registra sin resolver:** el SDK es una librería Android. Exige app
nativa — Capacitor más un plugin en Kotlin —, entorno de compilación Android, e instalación
por fuera de la Play Store en cada teléfono. Ese costo no estaba en el plan y la decisión de
pagarlo o no se toma en la conversación de diseño, no acá. **El ADR registra que el camino
existe y funciona, no que se haya decidido tomarlo.**

**Consecuencia inmediata:** P88′ pasa de "averiguar si existe" a "medir cuánto cuesta y si es
estable sin intervención". Actualizar su descripción en la tabla de §11 en ese sentido. El
prompt de P88′ en `docs/prompts/` **no se modifica**; su criterio de éxito ya quedó cumplido
por H2 y lo que queda por probar es la fricción operativa, que ya está en su sección de
entregable.

---

## Tarea 3 — Enmiendas a los ADR #033, #034 y #035

No se renumeran ni se reemplazan. Se corrigen en el cuerpo, con una línea de enmienda al pie
que diga qué cambió y por qué.

### #033 — tabla de tipos y el nombre del tipo normalizado

Dos cambios.

**El vocabulario de la vía D es un tercero** y la tabla pasa a tener tres columnas:

| ZIP | Drive | Vía D | Normalizado |
|---|---|---|---|
| `exercise_type = 0` | `TRAINING` | `OTHER` | `otro` |
| `exercise_type = 1001` | `WALKING` | `WALKING` | `caminata` |

**El tipo normalizado del workout custom es `otro`, no `fuerza`.** Tu discrepancia 4 tiene
razón y va más lejos de lo que planteaste: Samsung no está diciendo "esto fue fuerza", está
diciendo "esto no es ninguno de los deportes que reconozco". Fuerza y VR usan el mismo workout
custom y por lo tanto llegan con el mismo tipo por las tres vías. **Ninguna vía de Samsung
puede decir cuál de las dos fue.**

Quien lo decide es ShapeUp, por el match con la sesión propia. Registrar explícitamente:
`otro` significa "sin clasificar por Samsung" y P75 **no puede** tratarlo como fuerza.

Registrar también que `customTitle` es un discriminador disponible por la vía D — viene
`"ShapeUp"` — y que **si en el futuro se crea un segundo workout custom con otro nombre para
VR, ese campo separa los dos casos en el origen.** No es una tarea de este prompt, es una
opción que conviene dejar anotada porque sale gratis.

**Tercer cambio: `appId` entra en la clave, y encima va una tabla de fuentes.** §15.9 muestra
dos registros de composición corporal con el mismo `startTime` y distinto `appId`: son la misma
medición de la balanza entrando por dos puentes, Garmin Connect y Health Sync. Y muestra
también dos aparatos que miden lo mismo con métodos distintos. La clave de inicio más tipo los
colapsa a todos en uno y el resultado depende del orden de llegada.

La regla **no** es una jerarquía de aplicaciones. Privilegiar a `com.sec.android.app.shealth`
descartaría el registro de la balanza, que es una medición real que Samsung nunca tomó.

Dos niveles:

**Nivel 1 — la clave.** `appId` forma parte de la clave canónica: inicio en epoch UTC + tipo
normalizado + `appId`. Nada se pisa al guardar. La deduplicación opera solo dentro de un mismo
`appId`.

**Nivel 2 — la tabla de fuentes, declarada y versionada.** Cada `appId` se declara como
**origen** o como **puente**, con la fuente de medición que representa y un orden de
preferencia entre los puentes de una misma fuente:

| `appId` | Fuente de medición | Rol | Preferencia |
|---|---|---|---|
| `com.sec.android.app.shealth` + `deviceId 9XdbeBZKBf` | reloj | origen | — |
| `nl.appyhapps.healthsync` | balanza | puente | 1 |
| `com.garmin.android.connectmobile` | balanza | puente | 2 |

Con eso:

- Dos registros que comparten inicio **y fuente de medición** son la misma medición: entra el
  puente de preferencia más alta disponible, el resto se descarta.
- Dos registros que comparten inicio y **difieren en fuente** son dos mediciones distintas y
  conviven, en series separadas.
- Un `appId` que no esté en la tabla: el adaptador **para y reporta**. No adivina si es origen
  o puente.

La preferencia se expresa como orden, no como lista negra. Si Health Sync deja de escribir, el
registro de Garmin entra solo y el peso se sigue guardando; una lista negra de
`com.garmin.android.connectmobile` lo habría descartado en silencio.

**Exclusión por campo.** La tabla lleva además, por fuente, los campos que esa fuente escribe
pero no mide. Hoy hay uno: `weight` en la fuente reloj, por §15.9. Se declara, no se infiere.

### #034 — `stripUndef` no hace lo que el ADR dice

Tu discrepancia menor sobre `stripUndef` es en realidad la más importante de las cinco, porque
el ADR describe una regla como ya implementada cuando no lo está.

`stripUndef` saca claves `undefined`. **No convierte ceros en `undefined`.** Corregir el texto
de la regla 1: la conversión de `0.0` a campo ausente es responsabilidad del **adaptador**,
que debe hacerla antes de pasar el objeto a `stripUndef`. `stripUndef` es el último paso, no
la regla.

Agregar como ejemplo medido los ceros de la vía D en la sesión de fuerza: `count = 0`,
`distance = 0.0`, `maxSpeed = 0.0`. Son el caso exacto que la regla tiene que atrapar.

### #035 — el motivo estaba mal

Tenés razón y la decisión no cambia, pero el argumento sí. Reemplazar el motivo:

> Una caminata contada dos veces no afecta el tonelaje —las entradas externas no lo tienen— ni
> la propuesta de descarga del 10.3, que se calcula por porcentaje de sesiones completadas. Lo
> que infla son los días activos, los minutos y las kcal, que son las tres señales que
> alimentan la vista de historial y el análisis.

Agregar además que por la vía D el discriminador es mejor que el del ZIP: el `deviceId` y el
`log` vacío separan las autodetectadas sin depender de `live_data_internal`.

---

## Tarea 4 — Resolver el resto de §16

**Los dos "H2".** Renombrar la etiqueta de P89 de "H2 — adaptador" a **"H3 — adaptador"**. H2
queda reservado para la verificación manual, que ya se ejecutó. Revisar que no queden
referencias cruzadas rotas.

**Dependencias de P89.** Queda bloqueado por P75 **y por P88′**. Motivo a registrar: si la vía
D se adopta, el adaptador cambia de fuente y de forma, y esperar es barato comparado con
reescribirlo. Si P88′ termina descartando la vía D por costo, P89 se desbloquea con la vía A
como fuente única y sin cambios respecto de lo planificado.

**Cierre de H1′.** Se da por cerrado **en lo que respecta a la vía Drive**: las preguntas sobre
el transporte y el retraso de publicación están respondidas en §15.4 y §15.8. Las preguntas 3
y 4 y la sesión de VR **no se dan por cerradas y no se descartan**: quedan pendientes de
reformularse contra la vía D, porque preguntarlas sobre Drive ya no tiene sentido.

Para poder reformularlas, **transcribí en el reporte el texto literal de las preguntas 3 y 4
del spike H1′ tal como están escritas hoy.** No las reescribas vos ni intentes responderlas.

**Menciones de "Spark".** Quedan autorizadas: corregir las tres que reportaste fuera del
alcance de P66e, con el mismo criterio ya aplicado — plan Blaze, aclarando que los topes de
costo son los mismos.

**"cuatro vías" en el #032.** Ya lo registraste como cinco, está bien. Dejalo.

**P66e llama "plugin" a P88′.** Corregir a "PoC". El prompt de P88′ prohíbe explícitamente
construir el plugin y la referencia cruzada lo contradecía.

---

## Tarea 5 — `recuperacionBpm` y P86

Tu hallazgo sobre `matchBiometrico.ts:168` cambia el estado de P86 y conviene dejarlo escrito:
`recuperacionBpm` se deriva de la curva, no de la tabla `recovery_heart_rate` de Samsung, así
que **P86 no está roto, está esperando la curva.** Con la vía A nunca la va a tener para
sesiones de fuerza; con la vía D la tiene completa.

Actualizar la nota de 9.4 y la fila de P86 en ese sentido, reemplazando la advertencia que
había puesto P66e, que asumía el escenario contrario.

---

## Tarea 6 — `CLAUDE.md` y `ESTADO-DEL-PROYECTO.md`

- Actualizar el estado de la vía D: de "abierta, sin verificar" a "verificada, pendiente de
  decisión de costo".
- Agregar la nota de que H2 se ejecutó el 15/09 y su resultado está en §15.8.
- Mantener la distinción explícita entre la vía C y la vía D. Es la que evitó que esto se
  diera por cerrado.

---

## Criterios de aceptación

- [ ] §15.8 con todos los números de la Tarea 1.
- [ ] §15.9 con la tabla de tres escritores, el contraste reloj/balanza, el peso heredado del
      reloj, la trampa de nombres y la decisión de serie por fuente.
- [ ] ADR #036 registrado; #032 marcado como superseded, cuerpo intacto.
- [ ] #033 enmendado con la tabla de tipos de tres columnas, el tipo `otro`, `appId` en la
      clave y la tabla de fuentes con roles, preferencia y exclusiones por campo. #034 y #035
      enmendados con su línea de enmienda al pie.
- [ ] P89 renombrado a H3 y con dependencia de P75 y P88′.
- [ ] Preguntas 3 y 4 de H1′ transcritas literalmente en el reporte.
- [ ] Las tres menciones de "Spark" corregidas.
- [ ] La referencia "plugin" a P88′ corregida a "PoC".
- [ ] 9.4 y la fila de P86 actualizadas con el hallazgo de `matchBiometrico.ts`.
- [ ] `tsc -b` limpio y 553 pasados / 44 salteados, sin cambios. La suite de reglas queda
      fuera por falta de emulador. Este prompt no toca runtime: si algún test se mueve, **pará
      y reportá en vez de arreglarlo.**
- [ ] Discrepancias nuevas en §16, como siempre.
