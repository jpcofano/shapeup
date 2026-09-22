# 82 — La curva de FC entra por el puente

Repo: jpcofano/shapeup. Cierra el objetivo de la serie H. Parte de `d510704` (P79c–P81).

## Qué problema resuelve

La serie H existía para que **la biometría entrara sin exportar el ZIP a mano**. El puente
Android está construido desde PU4 y sube el crudo del Samsung Health Data SDK a
`/ingesta-sdk/{uid}/registros` cada 6 horas. Pero la parte más cara del dato —**la curva de
FC**— se tira:

- `lib/adaptadorSdk.ts` recibe `SesionSdk.log` (un punto por segundo, con `heartRate`) y lo
  **descarta a propósito**: solo cuenta `_muestrasCurva` para la densidad.
- `data/sincronizarPuente.ts` escribe `/cardio` y `/mediciones`, y **nunca llama a
  `enriquecerTrasImport`**, que solo corre en el camino del ZIP (`Salud.tsx`).

Resultado: la FC por serie, `recuperacionBpm` y `granularidad: "serie"` siguen dependiendo de
que alguien exporte el ZIP. El puente trae todo lo necesario y no se usa.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## La decisión que gobierna todo el prompt

**No se escribe un segundo enriquecimiento.** El adaptador arma **lo mismo que ya produce el
ZIP** —una `ZipExtraccion` con `sesionesSamsung`, `liveData` y `shapeUpCustomId`— y de ahí en
adelante corre `calcularEnriquecimiento` sin tocarlo. Es la misma decisión de PU4 para la
ingesta, por el mismo motivo: si hubiera dos caminos, el día que se corrija una regla del
match se corregiría en uno solo.

Si al implementarlo aparece la tentación de "esto por el SDK es distinto", **pará y reportá**
en vez de bifurcar.

---

## Parte 1 — El adaptador deja de tirar la curva

En `lib/adaptadorSdk.ts`, que es puro:

- `adaptarRegistros` devuelve, además de lo que ya devuelve, **`liveData: Record<string,
  LiveDataPoint[]>`** y **`sesionesSamsung: SesionSamsung[]`**, con las mismas formas que
  `import/samsungZip.ts` y `lib/matchBiometrico.ts`. Nada de tipos nuevos.
- La clave de `liveData` es el **`uid` del SDK**, que es el mismo `datauuid` del ZIP para el
  mismo hecho (verificado en el Paso 0 de PU4 y en H2). Eso es lo que hace que las dos vías
  no se dupliquen.
- Cada punto sale de `SesionSdk.log`: `{ ms: entrada.timestamp.epochMs, fc: entrada.heartRate }`,
  **descartando las entradas con `heartRate` nulo** — en la sesión de referencia son 21 de
  4133. Ordenadas por `ms`.
- `SesionSamsung.customId`: el SDK **no transporta `custom_id`**. `customTitle` cumple ese
  papel, igual que en la clasificación de PU4. Una sesión con `customTitle` no nulo lleva
  `customId: customTitle`.
- `fcMedia` sale de `meanHeartRate` **tal cual**. No la recalcules sobre el `log`: Samsung la
  computa sobre las muestras crudas (12.839 en la sesión de referencia) y el `log` viene
  agregado a 1 Hz. Es lo contrario que por la vía Drive, y ya está decidido.
- `fecha` en formato `YYYY-MM-DD` **local**, que es lo que usa el fallback "día único".

**La curva sigue sin persistirse** (ADR #016 y PU4): vive en memoria durante la
sincronización y se descarta. Lo único que se escribe es la biometría derivada.

Nada de esto cambia lo que `adaptarRegistros` ya devolvía: `ejercicios`, `mediciones`,
`ignorados`, `medicionesDescartadas` quedan igual, y sus tests también.

---

## Parte 2 — La sincronización enriquece

En `data/sincronizarPuente.ts`, **después** de escribir cardio y mediciones y solo si no es
vista previa:

1. Armá una `ZipExtraccion` con `sesionesSamsung`, `liveData` y `shapeUpCustomId` del
   adaptador, y el resto vacío (`mediciones: []`, `cardio: []`, `sueno: []`, `metricas: []`,
   `muestrasFcCrudas: []`, `errors: []`, `csvsLeidos: []`, `csvsPorTipo: {}`, `otrosCSVs: []`).
   `shapeUpCustomId` es `TITULO_SHAPEUP`, la constante que ya existe.
2. Llamá a `enriquecerTrasImport(miembro, extraccion)`, la misma función del ZIP.
3. `ResumenSincronizacion` suma el `ResultadoEnriquecimiento` en un campo `enriquecimiento`,
   y la UI lo muestra con la misma frase que el import del ZIP.

**`muestrasFcCrudas` va vacío**: el nivel "rango" del match (S-match, P57) sale de
`tracker.heart_rate`, que el puente hoy no trae. No lo inventes; si hace falta, es otro
prompt.

**Un fallo del enriquecimiento no cancela la sincronización**, igual que en el ZIP: lo que ya
se escribió queda escrito y el error se reporta aparte.

**La vista previa no enriquece.** Enriquecer escribe, y la vista previa no escribe nada.

---

## Parte 3 — Idempotencia entre las dos vías

Esto ya está resuelto y solo hay que **no romperlo**; verificalo con un test:

- El ADR #038 versiona el enriquecimiento. Una sesión ya fina y al día se omite; una en
  versión vieja se recalcula; **nunca se pisa fino con grueso**.
- Como el `uid` del SDK es el `datauuid` del ZIP, una sesión enriquecida por el ZIP y después
  sincronizada por el puente **no se enriquece dos veces distinto**: es el mismo pool de
  `datauuid` y el mismo cálculo.

---

## Tests

Con fixtures. **Nada de leer Firestore.**

- **Adaptador:** un crudo con `log` de N puntos produce `liveData[uid]` con N menos los de
  `heartRate` nulo, ordenados; una sesión con `customTitle: "ShapeUp"` produce
  `customId: "ShapeUp"`; una sin `customTitle` no lo lleva; `fcMedia` es `meanHeartRate` y no
  el promedio del `log` (ponelos distintos a propósito).
- **Sincronización:** con una sesión de la app que matchea, `enriquecimiento.matcheadas` da 1;
  en vista previa da 0 y no se escribe nada.
- **Idempotencia:** una sesión ya enriquecida a la versión actual se omite; una en versión
  vieja con curva se recalcula.
- **La curva no se persiste:** ningún documento escrito contiene los puntos.
- Todo lo de P74 a P81 sigue verde, **el aislamiento incluido**.

`npx tsc -b`, la suite y `npm run build`.

**No hace falta tocar `firestore.rules`:** no hay colección nueva y `/historial` ya lo escribe
el propio miembro. Si igual creés que hay que tocarlas, **pará y reportá**: en esta máquina no
se pueden correr los tests de reglas.

---

## Fuera de alcance

- Sincronización automática (sigue siendo un botón).
- El nivel "rango" del match por el puente.
- Enlazar y convertir entradas externas (bloque 5, P76).
- Cambios en el puente Android.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff por archivo, resumido.
2. Tests, `tsc` y build.
3. **Una corrida real de la sincronización, sin confirmar**, diciendo cuántas sesiones
   enriquecería y cuáles.
4. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/82-curva-por-el-puente.md`.
