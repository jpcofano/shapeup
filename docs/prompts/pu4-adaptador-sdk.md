# PU4 — El adaptador: lo que sube el puente entra a ShapeUp

Repo: jpcofano/shapeup. Cierra la serie del puente. Diseño en `docs/ROADMAP-producto.md`
§15.8 (hitos PU1–PU4) y Bloque 5.

**Estado:** el puente Android sube a `/ingesta-sdk/{uid}/registros` cada 6 horas desde PU3.
Hoy hay unos 113 registros, 18 de composición corporal, con fechas hasta el 16/09. **Nadie
los lee.** Mientras tanto los datos entran exportando un ZIP a mano.

**Objetivo:** que ShapeUp lea esa colección y la convierta en historial, cardio y
mediciones, sin duplicar nada de lo que ya entró por el ZIP.

**La decisión de arquitectura que gobierna todo este prompt:** el adaptador **traduce al
formato que ya producen los parsers del ZIP** (`EjercicioItem`, `MedicionInput`) y de ahí en
adelante reusa el pipeline completo de P75 y P75b: `clasificarImport`,
`construirEntradaExterna`, `importarMedicionesIdempotente`, `guardarEntradasExternas`. **No
se escribe un segundo camino de ingesta.** Si hubiera dos, el día que se corrija una regla
se corregiría en uno solo.

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Leer el crudo y reportar (solo lectura, y es la base de todo)

Escribí un script temporal, o usá el que prefieras, y **reportá antes de implementar**:

1. Cuántos documentos hay en `/ingesta-sdk/{uid}/registros`, y cuántos por `dataType`.
2. **Cuántos están partidos** (`parte` y `totalPartes`) y cuántos enteros.
3. **La forma exacta del JSON de `crudo`**, para cada `dataType`. Pegame un registro de
   ejercicio **sin curva** y uno de composición corporal, con los nombres de campo tal cual
   vienen. Del que tiene curva, la estructura y los primeros tres puntos, no los 4133.
4. **El mapeo contra lo que espera el ZIP**, en una tabla: para cada campo que usa
   `EjercicioItem` y `MedicionInput` (uuid, inicio, fin, duración, tipo de actividad, FC
   media, máxima, mínima, calorías, distancia, peso, grasa, masa muscular, agua, altura),
   de dónde sale en el crudo del SDK. **Marcá los que no existan.**
5. `customTitle` y `custom_id`: el SDK trae el primero y no el segundo. Decí cómo se ve
   `customTitle` en las sesiones de ShapeUp.
6. Qué `appId` aparece en los registros de composición corporal y cuántos hay de cada uno.

**Si el mapeo del punto 4 deja afuera algo que el clasificador necesita para decidir, pará y
reportá.** Ahí decidimos juntos antes de seguir.

---

## Parte 1 — Leer la colección

`src/data/ingestaSdk.ts`:

- `leerRegistrosSdk(uid)`: trae todos los documentos de `/ingesta-sdk/{uid}/registros`.
  Son pocos, porque el puente lee una ventana de 14 días.
- **Rearmado de partidos:** los documentos cuyo id termina en `__pN` se agrupan por su id
  base, se ordenan por `parte` y se concatenan los `crudo` antes de parsear. Si falta una
  parte, ese registro se omite y se informa: **nunca se parsea un JSON incompleto**.
- Cada `crudo` se parsea con `JSON.parse` dentro de un `try`. Si falla, se cuenta como
  registro ilegible y se sigue con los demás.
- `leerEstadoPuente(uid)`: lee `/ingesta-sdk/{uid}/estado/puente`, para mostrar cuándo fue
  la última corrida.

---

## Parte 2 — El adaptador, puro

`src/lib/adaptadorSdk.ts`, sin Firebase, con tests. Es el corazón del prompt.

| Función | Qué hace |
|---|---|
| `adaptarEjercicio(crudo)` | Devuelve un `EjercicioItem` como el que produce el parser del ZIP, con `_uuid`, `_startMs`, `_endMs`, `_fcMin` y lo que corresponda |
| `adaptarComposicion(crudo)` | Devuelve un `MedicionInput & { _uuid: string }` |
| `adaptarRegistros(registros)` | Reparte por `dataType` y devuelve `{ ejercicios, mediciones, ignorados }` |

**Reglas que el adaptador respeta:**

- **Los ids salen del uuid de Samsung**, igual que en el ZIP: `MED-{uuid}`, `CAR-{uuid}`,
  `EXT-{uuid}`. Es lo que hace que una sesión que ya entró por el ZIP se pise en vez de
  duplicarse. **Verificá con un caso real** que el uuid del SDK es el mismo `datauuid` del
  CSV.
- **`customTitle` cumple el papel de `custom_id`**: una sesión con `customTitle` igual al
  nombre de una rutina de ShapeUp es candidata a enriquecer. El `custom_id` no viaja por el
  SDK, y para distinguir un workout de otro el nombre alcanza.
- **La media de FC del SDK es confiable** y se usa tal cual: Samsung la computa sobre las
  muestras crudas. No la recalcules sobre el `log`, que viene agregado a 1 Hz. Es lo
  contrario que por la vía Drive, y está en el ADR corregido por P66g.
- **La curva completa no se persiste.** Se usa para calcular la densidad de muestras y las
  estadísticas, y después se descarta. Son 118 KB por sesión y no hay ninguna pantalla que
  los muestre.
- **Densidad y autodetectadas:** calculá muestras por segundo y aplicá el umbral de 0,1/s
  del ADR #034. Por debajo, `esAutodetectada` da verdadero, igual que en el ZIP cuando falta
  la FC. Reusá la función de P75b y pasale lo que necesite: **un solo criterio para las dos
  vías**.

**Composición corporal, con lo que descubrió PU1:**

- **Los métodos no se mezclan.** El reloj, con bioimpedancia de muñeca, y la balanza llenan
  campos casi complementarios, y el único que comparten difiere en casi cuatro kilos. Un
  merge del tipo "tomo el campo que no sea nulo" fabricaría un registro que no existe.
- **Dos puentes transportan la misma medición.** Si en el mismo instante hay un registro de
  Health Sync y uno de Garmin, entra **uno solo, por orden de preferencia declarado**:
  primero `nl.appyhapps.healthsync`, después `com.garmin.android.apps.connectmobile`. **No
  por lista negra**: si Health Sync deja de escribir, el de Garmin entra solo y el peso se
  sigue guardando. Hoy tus mediciones vienen por Garmin, así que esta regla está activa.
- **El peso del reloj se descarta:** lo hereda del perfil sin medirlo, y es un valor
  plausible con fecha fresca, que es peor que un cero. Se reconoce porque el `appId` es
  `com.sec.android.app.shealth`.
- `appId` es la señal fuerte; `deviceId` es débil y no identifica al reloj.

---

## Parte 3 — Sincronizar

`src/data/sincronizarPuente.ts`:

```
sincronizarDesdePuente(uid, miembro, historialShapeUp, config, { soloVistaPrevia })
```

1. Lee los registros y los adapta.
2. Clasifica los ejercicios con `clasificarImport`, el mismo de P75.
3. Con `soloVistaPrevia`, devuelve el resumen sin escribir.
4. Si no, escribe: cardio, entradas externas y mediciones, todo con las funciones que ya
   existen.
5. Devuelve: registros leídos, ilegibles, partidos rearmados, cuántos enriquecen, cuántos
   entran como externa, cuántos quedan solo en salud, y mediciones escritas y descartadas
   con el motivo.

**No hace falta marcar los registros como procesados.** Son pocos, todo es idempotente por
uuid y el puente reescribe la misma ventana. Agregar una marca obligaría a escribir en la
colección del puente, y las reglas la tienen cerrada a cinco campos.

---

## Parte 4 — UI

En la pantalla de Salud, junto al import del ZIP:

- Una tarjeta **"Puente Samsung"** con la última corrida del puente (`estado/puente`) y sus
  contadores. Si es de hace más de 12 horas, un aviso:
  *"El puente no corre desde {fecha}. Revisá las restricciones de batería en el teléfono."*
- Botón **"Sincronizar ahora"**, que muestra la vista previa con los mismos tres grupos que
  el ZIP y un botón de confirmar.
- **Sin sincronización automática todavía.** Primero hay que ver que los números den bien.
  Automatizarlo es un renglón después.

---

## Tests

- **`adaptarEjercicio`** y **`adaptarComposicion`**, con dos registros crudos reales
  guardados como fixture (anonimizados si hace falta): salen los campos esperados.
- **Rearmado de partidos:** tres partes en desorden se concatenan bien; si falta una, se
  omite el registro y se informa.
- **`crudo` ilegible** no rompe la corrida.
- **Densidad:** una sesión con curva pasa el umbral; una autodetectada no.
- **Mismo id que el ZIP:** adaptar el mismo hecho por las dos vías da el mismo `idHist` y el
  mismo id de medición. **Es el test que evita duplicar todo tu historial.**
- **Composición:** con Health Sync y Garmin en el mismo instante entra solo Health Sync; si
  Health Sync no está, entra Garmin; el registro del reloj no aporta peso; no se mezclan
  campos de reloj y balanza.
- **Aislamiento de P74, una vez más:** las externas que entran por el puente no mueven la
  racha, la adherencia, el tonelaje ni la progresión.

Corré la suite completa, `tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Sincronización automática.
- Enlazar y convertir entradas externas (P76).
- Cambios en el puente.
- Borrar lo ya procesado de `/ingesta-sdk`.

Guardá este prompt como `docs/prompts/pu4-adaptador-sdk.md`.

---

## Al terminar, reportá

1. **El Paso 0 completo**, con la tabla de mapeo del punto 4.
2. El diff por archivo, resumido.
3. El resultado de tests, `tsc` y `test:rules`.
4. **Una vista previa real, sin confirmar**, con los números de la Parte 3.
5. **La comprobación cruzada:** tomá una sesión que ya haya entrado por el ZIP y que también
   esté en `/ingesta-sdk`, y mostrá que los dos caminos producen el mismo id.
6. Cualquier punto donde hayas parado o te hayas apartado del prompt.
