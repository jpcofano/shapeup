# P66e — Reporte de la serie H: auditoría ZIP vs Drive, ADR #032–#035 y correcciones

Este prompt **documenta**. No toca código de runtime, no crea adaptadores, no escribe a
Firestore. Todo lo que sigue son decisiones ya tomadas: aplicalas como están.

**Si algo acá es inviable o contradice lo que el código realmente hace, pará y reportá.
No reinterpretes.**

---

## Contexto

El 14/09/2026 se auditó la misma sesión de entrenamiento por las dos vías disponibles:

- **Vía Drive** — Health Sync (pago) exporta Health Connect a Google Drive, automático y diario.
- **Vía ZIP** — exportación manual de datos personales desde la app de Samsung Health.

La sesión de referencia es un workout custom llamado "ShapeUp" del 14/09. Los números de
abajo son medidos, no estimados, y hay que dejarlos registrados porque re-derivarlos cuesta
otra auditoría completa.

---

## Tarea 1 — Nueva sección en `docs/ROADMAP-producto.md`

Agregar al final una sección **"Serie H — reporte de auditoría (14/09/2026)"** con el
contenido que sigue. Respetá el tono del resto del documento; podés reformular la redacción
pero **ningún número se cambia**.

La sección va después de la última que exista hoy. Acá abajo se la numera §15 asumiendo que
§14 es la última; si no coincide, usá el número que corresponda y ajustá las referencias
internas. Si la numeración real difiere de lo que este prompt asume, decilo en el reporte.

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
transcurrida (`16,97 s`). Es una pausa real y sirve como test de integridad de cualquier
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
con **2** records — que es exactamente `(144 + 86) / 2`.

**Conclusión:** para una sesión sin curva publicada, la FC media y máxima de la vía Drive no
son el resumen de Samsung. Son un promedio de dos puntos disfrazado de resumen. No se pueden
persistir.

### 15.4 La hipótesis de retraso de publicación queda descartada

Se reexportó Drive a las 20:06 local, 82 minutos después del fin de la sesión. El archivo de
frecuencia cardíaca del 14/09 llega hasta `19:30:31` y la ventana `17:34–18:44` sigue teniendo
**dos muestras** (`17:53:00 → 144` y `18:41:00 → 86`).

Distribución de muestras por hora en ese archivo:

| Hora local | 00–07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15–19 |
|---|---|---|---|---|---|---|---|---|---|
| Muestras | 60 c/u | 37 | 2 | 5 | 493 | 521 | 115 | 663 | 2 c/u |

Las horas densas son las caminatas (1 Hz). Durante el entrenamiento el muestreo publicado a
Health Connect es el pasivo, no el de ejercicio.

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

Esto importa porque el bloque 5 dice que toda actividad de Samsung entra al historial: con esa
regla, estas dos entran por ZIP, no tienen contraparte por Drive, y una de ellas duplica una
caminata ya contada.

### 15.6 `recuperacionBpm` no existe para sesiones custom

La tabla `com.samsung.shealth.exercise.recovery_heart_rate` del ZIP tiene 48 filas, **ninguna
del 14/09**; la más reciente es del 28/07. Samsung genera recuperación post-ejercicio solo
para ciertos tipos de actividad, y el workout custom no es uno de ellos.

Consecuencia para 9.4 y P86: si el cálculo de `recuperacionBpm` lee esa tabla, para las
sesiones de ShapeUp nunca va a tener dato y el bloque queda vacío en producción. Si lo deriva
de la curva del `live_data.json`, funciona. **Verificar de cuál de las dos fuentes sale antes
de dar P86 por cerrado.**

### 15.7 Trampas ya detectadas, para no re-derivarlas

- **Granularidad canónica de la vía Drive: el archivo diario.** Los archivos semanales
  (`37-2026`), de 30 días y de rango repiten el mismo dato para períodos ya cerrados. La
  semana `37-2026` va de lunes 07 a domingo 13 — confirma la convención lunes-a-domingo del
  bloque 10.
- **Pasos duplicados dentro del archivo diario**: la primera fila de las `00:00:00` es el
  acumulado del día y las siguientes son incrementos. Sumar todo duplica.
- **El archivo de sueño mezcla dos noches.** Consolidar por continuidad temporal, nunca por
  nombre de archivo.
- **`Energía quemada` diaria**: las calorías activas vienen siempre en `0.0`. Las kcal útiles
  vienen por actividad. Las de reposo sí traen valor.
- **Composición corporal por Drive**: llegan peso, porcentaje de grasa y metabolismo basal;
  todas las masas en `0.0`. El ZIP las trae pobladas.
- **Ningún archivo de la vía Drive tiene identificador por registro.**

---

## Tarea 2 — Registrar ADR #032 a #035 en `docs/MAPEO-IMPLEMENTACION.md`

Numeración: el #025 vigente es la spec del match biométrico y no se toca. La serie actual va
#026 a #031 (P66 a P66c). Estos son los cuatro siguientes.

### ADR #032 — Taxonomía de vías de ingesta de Samsung Health

Se identifican cuatro vías y se clasifican por dónde leen:

| Vía | Qué es | Lee de | Estado |
|---|---|---|---|
| **A** | Health Sync → Google Drive | Health Connect | En uso, automática, **topeada** |
| **B** | Intervals.icu | Health Connect (vía Health Sync) | Descartada, mismo techo |
| **C** | Cascarón Capacitor + plugin de Health Connect | Health Connect | Descartada, mismo techo |
| **D** | App Android + **Samsung Health Data SDK** | La app de Samsung Health | **Abierta, sin verificar** |
| **E** | App Wear OS + Samsung Health Sensor SDK | El sensor del reloj | Descartada por costo |

**Decisión:** las vías B y C quedan descartadas. No por el transporte, sino por el origen: si
Health Connect no tiene las muestras, ningún consumidor de Health Connect las va a tener. La
evidencia es §15.4 más el hecho de que el propio ZIP declara `heart_rate_sample_count = 12839`
para una sesión de la que Health Connect publica dos muestras.

**La vía D no está descartada y no está verificada.** Lee directamente de la app de Samsung
Health, no de Health Connect, y su modelo de datos expone `ExerciseSession.log`, una lista de
`ExerciseLog` con los puntos medidos durante la sesión. Su viabilidad se decide en **H2**
(verificación manual con DataViewer) y, si H2 da positivo, en **P88′**.

**Mientras D no esté resuelta, el ZIP es la vía de la curva.** Esto se registra como estado
actual, no como permanente. Si D funciona, este ADR se supersede.

**Lo que hoy se pierde por la vía A en sesiones de fuerza:** la curva completa, la FC media y
máxima reales, la FC mínima, el nombre del workout, la distinción entre tiempo activo y
transcurrido, `recuperacionBpm` por serie, `fcPico`, `fcFinSerie` y la recuperación entre
rondas del bloque 9.4.

### ADR #033 — Clave canónica de actividad

La clave es **inicio en epoch UTC con milisegundos + tipo normalizado**.

Verificado: las dos vías entregan `1789418092506` para la misma sesión. **Sin tolerancia, sin
ventana, comparación exacta.** El TCX de la vía Drive y el `start_time` del ZIP coinciden.

El `datauuid` baja de clave primaria a metadato: no viaja por la vía Drive.

**El tipo no se usa crudo.** Cada vía lo entrega con su propio vocabulario y hay que
normalizar antes de componer la clave:

| Observado en ZIP | Observado en Drive | Normalizado |
|---|---|---|
| `exercise_type = 0` | `TRAINING` | `fuerza` |
| `exercise_type = 1001` | `WALKING` | `caminata` |

Esta tabla es **por observación y está abierta**. Cuando aparezca un tipo no mapeado, el
adaptador **para y reporta**; no adivina ni cae a un default. La tabla vive junto al
adaptador, no dispersa.

Nota: la duración **no** forma parte de la clave ni sirve para comparar entre vías. El CSV y
el TCX de la vía Drive dicen `4169` s y el FIT dice `4170`.

### ADR #034 — Precedencia por procedencia del dato

Dos reglas, en este orden:

1. **Ningún cero se escribe.** Un `0.0` que significa "no hay dato" se convierte en campo
   ausente y se omite al escribir, como ya hace `stripUndef`. Sin esta regla, sincronizar la
   vía Drive después de subir el ZIP pisa la composición corporal buena con ceros.

2. **Ningún dato derivado pisa un dato medido.** Antes de persistir estadísticas de FC, el
   adaptador calcula la densidad de muestras de la sesión (`muestras / segundos`) y si cae
   debajo del umbral marca los campos de FC como ausentes en vez de escribirlos.

**Umbral: `0,1` muestras por segundo.** Los valores medidos lo separan con holgura — las
sesiones con curva dan alrededor de `0,7`/s y la sesión de fuerza por la vía Drive da
`0,0005`/s. Se eligió el umbral por densidad y no una regla por tipo de actividad para que
siga funcionando sin cambios si Samsung empieza a publicar la curva.

Con estas dos reglas **el orden de llegada de las vías deja de importar**, que es la propiedad
que se quería.

### ADR #035 — Sesiones autodetectadas sin curva

Aplica al bloque 5, que dice que toda actividad de Samsung entra al historial.

Una fila de ejercicio del ZIP se considera **autodetectada sin curva** cuando tiene
`live_data_internal` vacío y ningún campo de FC (ver §15.5).

- Si **se solapa** en el tiempo con otra sesión que sí tiene curva, se descarta. Es la misma
  actividad contada dos veces por dos fuentes.
- Si **no se solapa** con ninguna, se ingiere marcada como autodetectada, con la misma marca
  "sin detalle" que ya usa la carga manual del bloque 6.

Nunca se fusionan dos filas en una. Se descarta o se ingiere marcada.

> **Esta decisión se tomó en la sesión de diseño y conviene revisarla.** La alternativa era
> ingerir siempre y resolver el solapamiento en la vista. Se eligió descartar porque una
> caminata contada dos veces infla el tonelaje del día y el bloque 10 lo usa para proponer
> descarga.

---

## Tarea 3 — Correcciones al roadmap

1. **§10** — donde dice "Health Connect, cuando el bloque 5 esté estable", reemplazar por la
   vía Drive. El texto quedó de la versión anterior del plan.
2. **§11, tabla de dependencias** — **P89 pasa a depender de P75.** Motivo a registrar: P75
   define el tipo normalizado del ADR #033, y un adaptador escrito antes tendría que inventar
   su propia normalización. P88 y H2 no dependen de nada y pueden ir en cualquier momento.
3. **11.4** — sacar la frase "el mismo criterio" respecto del bloque 7. Son dos señales
   distintas: el aviso por esquivar el día va al tercero, el del bloque 7 va al sexto. Dejar
   los dos números explícitos y no unificarlos.
4. **`rutinaRealizada`** — corregir el texto: el campo ya existe y es `Historial.idRutina`.
   Cuando el cambio es a una sesión libre no hay id y lo realizado se lee de `tipo: "libre"`.
5. **9.4 y fila de P86** — agregar la advertencia de §15.6 sobre el origen de
   `recuperacionBpm`.
6. **§11** — reemplazar la fila de P88 por dos entradas: **H2** (verificación manual, sin
   código, no es un prompt) y **P88′** (PoC, condicionada al resultado de H2).

## Tarea 4 — `CLAUDE.md` y `docs/ESTADO-DEL-PROYECTO.md`

1. **Sección de la serie H en `CLAUDE.md`** — reemplazar la taxonomía actual (A = Drive,
   B = Intervals.icu, C = Capacitor) por la de cinco vías del ADR #032. El punto que hay que
   dejar clarísimo: **la vía C que estaba escrita asume Capacitor leyendo Health Connect, que
   es una cosa distinta de la vía D, Capacitor leyendo el Data SDK.** Confundirlas hace
   parecer descartado algo que no se probó.
2. **Línea 9 de `CLAUDE.md` ("Qué es")** — dice plan Spark y la sección de la serie H dice
   Blaze. Corregir a Blaze **y agregar que los límites de costo siguen valiendo, porque el
   nivel gratuito de Blaze tiene los mismos topes**.
3. **ADR #016, #020 y #023** — no se editan. Registraron una decisión en su momento y su
   motivo sigue en pie. Agregar una sola nota al pie en cada uno aclarando el cambio de nombre
   del plan, sin tocar el cuerpo.
4. **`docs/ESTADO-DEL-PROYECTO.md`** — todavía presenta el cascarón nativo como el único
   camino. Actualizar a la taxonomía del ADR #032.
5. **Aviso sobre P61** — verificar que sigue arriba y visible. No se toca.

---

## Criterios de aceptación

- [ ] §15 existe en `docs/ROADMAP-producto.md` con las siete subsecciones y todos los números
      intactos.
- [ ] ADR #032, #033, #034 y #035 registrados en `docs/MAPEO-IMPLEMENTACION.md`.
- [ ] Las seis correcciones de la Tarea 3 aplicadas.
- [ ] `CLAUDE.md` con la taxonomía de cinco vías, la distinción C/D explícita, y Spark → Blaze
      con la aclaración de los topes.
- [ ] `ESTADO-DEL-PROYECTO.md` alineado.
- [ ] ADR #016, #020 y #023 con nota al pie, cuerpo sin tocar.
- [ ] `tsc -b` sin errores y los 553 tests que corren sin emulador siguen pasando. La suite de
      reglas necesita el emulador y queda fuera del criterio. Este prompt no toca runtime, así
      que **cualquier** cambio en el resultado de los tests es síntoma de que se tocó algo que
      no correspondía: si pasa, pará y reportá en vez de arreglarlo.
- [ ] Reportar cualquier discrepancia nueva en §14, como siempre.
