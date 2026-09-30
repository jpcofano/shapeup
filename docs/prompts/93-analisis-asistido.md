# 93 — Análisis asistido, el de una sesión

Repo: jpcofano/shapeup. Va después de P92, que es el que produce los minutos por zona que este
paquete lleva.

## Qué es esto

El diseño completo está en el documento que viene con este prompt: **guardalo como
`docs/ANALISIS-ASISTIDO.md` antes de escribir código**, y referencialo desde
`ESTADO-DEL-PROYECTO.md` y desde el roadmap. Leelo entero: acá abajo hay decisiones, no la
explicación.

En una línea: la app arma un paquete con los datos de una sesión, la persona lo pega en un chat,
y el JSON que vuelve se carga en la app y queda guardado al lado de esa sesión. Sin claves de
API, sin servidor, sin costo. **La persona es el transporte, y eso es a propósito.**

## Alcance de este prompt

**Solo la sesión**, y la maquinaria compartida armada para que el global sea un segundo `tipo` y
no una segunda implementación: el esquema, el validador, el guardado y la UI de cargar quedan
genéricos. El **análisis global** es P94.

Lo separo aunque lo hayamos pensado junto porque es demasiado para una corrida: exportador,
validador, pantalla, prompt versionado y agregado de ocho semanas, todo de una, sale mal. Si te
parece que el global es trivial encima de esto, **decilo en el reporte** y lo hacemos ahí mismo;
no lo agregues por tu cuenta.

## Las tres decisiones que quedaban abiertas, cerradas

1. **La curva va submuestreada a 30 segundos.** Es lo que permite ver la deriva y la forma de la
   recuperación, y son unos 100 valores en una sesión de 50 minutos.
2. **El rango por defecto del global es 8 semanas**, la misma ventana que ya usa la tasa de
   cumplimiento. Va a `config/import` con el resto de lo configurable (P86) aunque lo use P94.
3. **El paquete enviado no se guarda.** Se guarda **con qué se armó**: versión de prompt, versión
   de esquema, la ventana usada y el `versionEnriquecimiento` que tenía la sesión en ese momento.
   El paquete es derivado: con esos cuatro datos se vuelve a armar igual, y si el dato de base
   cambió, el `versionEnriquecimiento` lo delata. Guardar 60 KB por sesión para poder reconstruir
   algo que ya es reconstruible no vale el espacio.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — La regla, primero

**ADR #044 — lo medido y lo interpretado no se mezclan.** Va en `CLAUDE.md`, en la familia del
aislamiento por tipo (P74) y de "el sistema decide solo con lo que mide" (P79).

El análisis vive en su propio campo, se muestra etiquetado como interpretación y con su fecha, y
**nunca alimenta la racha, la adherencia, el tonelaje, la progresión ni la meta**. Si un análisis
dice que una sesión fue floja, eso no puede mover un número medido.

Y esto se prueba, no se promete: **sumale a `aislamiento.test.ts`** una afirmación con la forma
que ya tiene ese archivo — calcular todas las métricas con un historial **sin** análisis y con el
mismo historial **con** análisis cargado en cada sesión, y exigir resultados **idénticos**. Si
mañana alguien lee `analisis` desde un cálculo, el test falla acá y no en producción.

---

## Parte 2 — El paquete (puro)

`lib/paqueteAnalisis.ts`, puro (ADR #009): recibe la sesión, el perfil, el contexto y la curva; no
lee Firebase ni toca React.

Tres niveles, en este orden, porque así se lee: **sesión**, **por ejercicio**, **contexto**. El
detalle de cada campo está en el documento; lo que agrego acá es lo que el documento no podía
saber porque P92 todavía no existía:

- los minutos por zona **de la sesión y de cada ejercicio** salen de `minutosPorZona` (P92) y
  viajan tal cual, con `minutosSinDato` incluido: el hueco es un dato;
- si `biometria.ventanaAdoptada === 'samsung'`, el paquete lleva el `desfaseDuracionPct` y las dos
  cifras —la nuestra y la de `biometria.samsung`—, nombradas para que no se confundan;
- `fcDudosa`, `coberturaFina`, `coberturaTotal`, `motivoCobertura` y `kcalEstimada` **van
  siempre**. Un análisis que no sabe que el dato es flojo saca conclusiones sobre ruido, y eso es
  peor que no analizar.

**La curva**: `submuestrear(curva, 30_000)` — promedio de cada balde de 30 s, redondeado, con su
`ms` relativo al inicio de la sesión (en segundos, no epoch: ocupa un tercio y se lee mejor). Un
balde vacío se omite y **no se interpola**: un hueco en la curva se ve como hueco.

**Tope de 60 KB.** El exportador informa el tamaño antes de copiar. Si se pasa, recorta **primero
el contexto y después la curva** (al principio bajando a 60 s, y solo si sigue pasada, afuera), y
**dice qué recortó** en el propio paquete y en la pantalla.

---

## Parte 3 — El validador (puro)

`lib/validarAnalisis.ts`. Devuelve `Result<AnalisisSesion>` con el estilo de `lib/result`: un
error que se pueda mostrar, nunca una excepción.

- El esquema completo, con tipos. Nada de `as`.
- **`idHist` tiene que coincidir con la sesión donde se está cargando.** Es el error más fácil de
  cometer —pegar el análisis de otra sesión— y el más difícil de notar después. Mensaje explícito:
  *"Este análisis es de otra sesión."*
- Topes: largo por campo, máximo de hallazgos, de sugerencias, de banderas y de preguntas.
- **Todo hallazgo con su `evidencia`.** Un hallazgo sin evidencia **no se guarda**: es la pieza
  central del diseño, la que obliga a que cada afirmación se apoye en un número del paquete.
- El JSON es **dato externo**: se escapa al mostrarlo, nunca se ejecuta, **no puede escribir en
  ningún campo medido** y los campos que no estén en el esquema se descartan (no se guardan "por
  si acaso").
- `confianza` es del que analiza, no de la app: se muestra como lo que dijo, sin reinterpretar.
- Si el chat devolvió texto alrededor del JSON, el validador **intenta encontrar el objeto** y, si
  lo encuentra, sigue. Es el error más común y pelear con él no le sirve a nadie.

---

## Parte 4 — Guardado

- Campo `analisis` en el documento de `/historial` (las reglas de `/historial` no cierran campos:
  no hay nada que cambiar ahí, **verificalo**).
- Guarda, además del contenido: `versionPrompt`, `versionEsquema`, `versionEnriquecimiento` de la
  sesión en ese momento, `generadoEn`, `modelo` (lo que el chat diga de sí mismo) y
  `cargadoMs`.
- `update()`, nunca `set()`.
- **Un análisis por sesión.** Cargar otro pisa el anterior, avisando antes. No hay historial de
  análisis: si más adelante hace falta, se agrega; empezar con una colección para algo que se
  carga a mano es de más.

`VERSION_PROMPT_SESION = 1` y `VERSION_ESQUEMA_ANALISIS = 1`, en un solo lugar, exportadas.

---

## Parte 5 — El prompt, versionado en el repo

`docs/analisis/prompt-sesion-v1.md`. **El archivo es la fuente**: el exportador lo incluye en el
paquete, no lo reescribe. Si se cambia, se crea `-v2` y sube `VERSION_PROMPT_SESION`. Dentro de
tres meses tiene que poderse saber con qué se generó cada análisis.

Dice, en este orden (el detalle está en el documento, §"El prompt"):

1. Quién entrena: edad, nivel, objetivo, FC máxima y zonas.
2. De dónde sale cada dato y qué significa cada campo.
3. El reparto: **ShapeUp dice qué se hizo, Samsung dice cuánto costó.**
4. Qué se espera: hallazgos con evidencia, sugerencias accionables, banderas.
5. **Las advertencias del propio dato**: la FC de muñeca en boxeo y juegos de ritmo es poco
   confiable (§9.3 del roadmap), y las calorías en actividades de brazos vienen infladas (§9.5).
   Y qué significan `fcDudosa` y una cobertura baja.
6. Las reglas: no inventar; cada hallazgo cita un número del paquete; **si el dato no alcanza para
   una conclusión, decirlo en vez de estirarlo**; nada de consejo médico — si algo parece una
   señal de salud, va como bandera para consultar con un profesional, nunca como diagnóstico ni
   como indicación.
7. La salida: **solo el JSON**, sin texto alrededor.

---

## Parte 6 — La pantalla

En el detalle de la sesión, abajo, sin pantalla nueva:

- **"Preparar análisis"** → copia al portapapeles y muestra el tamaño. Si es grande, lo baja como
  archivo. Si hubo recorte, lo dice.
- **"Cargar análisis"** → pegar o subir archivo → **valida antes de guardar nada**. Si no valida,
  dice qué está mal, con el campo, y **no guarda**.
- **Cargado** → resumen, hallazgos con su evidencia al lado, sugerencias, banderas, preguntas.
  Todo bajo un encabezado que diga qué es: **interpretación**, con la fecha y el modelo. Que no se
  parezca a un número medido, porque no lo es.
- Un lugar para borrarlo. Si el análisis no se puede sacar, no se carga tranquilo.
- Sin curva y sin biometría, el botón de preparar **igual sirve**: la sesión sola ya tiene qué
  analizar (series, cargas, RIR, descansos). Lo que no puede es prometer lo fisiológico, y el
  paquete lo dice.

---

## Tests

- `paqueteAnalisis`: se arma con biometría completa, con biometría sin curva y **sin biometría**;
  el submuestreo a 30 s de una curva de 50 min da ~100 puntos y **no interpola** huecos; pasado el
  tope, recorta contexto primero y lo declara.
- `validarAnalisis`: el caso feliz; **`idHist` de otra sesión se rechaza** (el test que importa);
  un hallazgo sin evidencia se rechaza; un campo de más se descarta y no se guarda; JSON con texto
  alrededor se recupera; JSON roto da error legible; un campo larguísimo se rechaza; un `<script>`
  en un texto se guarda como texto y se muestra escapado.
- `aislamiento.test.ts`: con y sin análisis, **todas las métricas idénticas**.
- Guardado: `update` y no `set`; cargar un segundo análisis pisa el primero.

`npx tsc -b`, la suite, `npm run build`, `npm run test:rules`.

---

## Fuera de alcance

- **Llamar a un modelo desde la app.** Es a mano y a propósito: sin claves, sin costo, sin
  servidor. Si se te ocurre una forma elegante de automatizarlo, **es una conversación, no un
  commit**.
- El análisis global — es P94, y esta maquinaria tiene que dejarlo fácil.
- Análisis automático de cada sesión. Se pide cuando se quiere.
- Que el análisis modifique cualquier dato de entrenamiento. Nunca.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido.
2. **El tamaño real del paquete** de tres de mis sesiones: una de fuerza, una de VR y una corta.
   Si alguna se acerca a los 60 KB, qué la infla.
3. El paquete de una sesión, entero, pegado en el reporte. Lo quiero leer antes de usarlo.
4. Qué quedó genérico para P94 y qué habría que agregar para el global.
5. Tests, `tsc`, build y reglas, y el ADR #044 en `CLAUDE.md`.
6. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/93-analisis-asistido.md`.
