# 91 — Que el pedido no mienta

Repo: jpcofano/shapeup. Va después de P89 y de que P90 quedara andando.

## Qué problema resuelve

P89 y P90 funcionan: 6,34 s de punta a punta, medido. Pero las pruebas de P90 destaparon tres
cosas que no se ven en una prueba feliz, y **las tres fallan en silencio**, que es la peor forma
de fallar.

1. **La tarjeta compara relojes distintos.** "¿Respondió el reloj?" se responde hoy con
   `ultimaCorridaMs >= pedidoMs`. El primero lo escribe el **teléfono**; el segundo, **la
   máquina donde está abierta la app**. En las pruebas de P90 esos dos relojes estaban corridos
   —por eso una medición se anotó como estimada—. Con la PC adelantada, una corrida real parece
   ninguna: la tarjeta dice "sin respuesta" para siempre y encima acusa al ahorro de batería.
   Con la PC atrasada, al revés: dice "respondió" mostrando una corrida **anterior** al pedido.
2. **Un segundo pedido dentro del mismo minuto se descarta y nadie lo sabe.** La función lo
   ignora como `muy-seguido` —bien, es su trabajo—, pero la app igual se queda 45 segundos
   esperando una respuesta que no va a llegar porque el push nunca salió. Pasa seguido: terminás
   una sesión (que pide sola, `fin-sesion`) y apretás el botón.
3. **La guarda de "pedido viejo" usa el reloj del cliente.** `decidir()` descarta el pedido si
   `ahora - pedidoMs > 5 min`, y `pedidoMs` lo escribió el navegador. Un reloj atrasado seis
   minutos y **ningún pedido se despacha nunca**, sin un error en ningún lado. Al revés, uno
   adelantado pasa siempre, aun para un pedido viejo de verdad.

El hilo de las tres es el mismo: **el reloj del cliente no es un dato**. Solo sirve para
mostrarlo; nunca para decidir.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — La función decide con la hora de escritura

En `functions/`:

- `decidir()` recibe **`escrituraMs`**, la hora en que Firestore escribió el documento, y la
  edad del pedido se calcula con eso: `ahora - escrituraMs > MAX_EDAD_PEDIDO_MS`. `pedidoMs`
  deja de decidir; sigue viajando en el payload porque el puente lo usa para el eco.
- En `index.ts` sale de `event.time`. Si por algún motivo no viniera, se usa `ahora()` —el
  pedido se acaba de escribir, así que tratarlo como nuevo es lo correcto; **nunca volver a
  `pedidoMs`** como respaldo.
- `pedidoMs` **inválido o ausente ya no descarta el pedido**: hoy `pedido-invalido` mata un
  pedido que está bien escrito y a tiempo. Si no es un número, el push sale igual y el payload
  lleva `pedidoMs: "0"`. Ojo: la regla de Firestore exige `pedidoMs is int`, así que esto es
  defensa en profundidad, no un caso esperado.
- **Anotá el desfase**: si `|pedidoMs - escrituraMs|` pasa de un minuto, un `logger.warn` con
  los dos números. Es el único lugar del sistema donde el desfase entre los relojes se puede
  ver, y ya nos costó una medición.

`MIN_ENTRE_PUSH_MS` se queda como está: compara `ultimoPushMs` contra `ahora()`, los dos del
reloj de la función. Ese ya estaba bien.

---

## Parte 2 — La tarjeta deriva la respuesta sin usar relojes

La única evidencia limpia de que el puente contestó es que **su propio contador se movió**.
`ultimaCorridaMs` lo escribe siempre el mismo reloj, así que comparar ese valor **contra sí
mismo** no tiene desfase posible.

- `estado/pedido` suma un campo: **`corridaPreviaMs`** (int, opcional) — el valor de
  `ultimaCorridaMs` que la app vio **justo antes** de pedir. Si el puente nunca corrió, `0`.
- `pedirSincronizacion` lo escribe. Agregalo a `pedidoValido` en `firestore.rules` y a los tests
  de reglas.
- `estadoDelPedido(...)` pasa a decidir así:
  - `ultimaCorridaMs > corridaPreviaMs` → **respondió**;
  - si no, y pasaron menos de `SIN_RESPUESTA_MS` **desde que esta app pidió** → esperando;
  - si no → sin respuesta.
- El "pasaron menos de" se mide con **el reloj de esta app contra su propio `pedidoMs`**: los
  dos son del mismo lado, así que se pueden restar. Lo que no se puede es cruzarlos con el
  teléfono, y eso es lo que se va.
- **Pedidos viejos sin `corridaPreviaMs`** (los que ya están escritos): no hay con qué derivar.
  Ahí la tarjeta dice *"no se sabe si respondió"* y **no muestra el aviso de batería**. Acusar
  al ahorro de batería sin evidencia es peor que no decir nada, y con el primer pedido nuevo se
  arregla solo.
- **Respondió tarde** es un estado propio y visible: contestó, pero después de que dejamos de
  esperar. `respondió · llegó después de la espera`. Medimos 81 s en P90: es un caso normal, no
  un error.

---

## Parte 3 — Que el reloj tardío no quede sin importar

Hoy, si el puente contesta a los 60 segundos, el dato queda en la nube y **nadie lo importa**
hasta el próximo botón o la próxima automática. Es justo la sesión que la persona estaba
mirando.

- Después de un `no-contesto`, la app **sigue escuchando** `estado/puente` hasta
  `ESPERA_TARDIA_MS = 3 * 60_000`, y corta al vencer, al llegar, o al desmontarse la pantalla.
  Un listener que queda vivo sigue leyendo y no se nota hasta la factura.
- Si llega, aparece una línea con acción: *"El reloj contestó tarde. Traer lo que llegó"*, y ese
  botón corre **solo el paso de importar** —no vuelve a pedir— y refresca la vista previa.
- Un solo listener por pantalla. Si la persona vuelve a apretar el botón, el viejo se corta
  antes de abrir el nuevo.

---

## Parte 4 — No pedir dos veces en el mismo minuto

La cuenta la lleva **`pedirSincronizacion`**, no cada llamador: así quedan cubiertos el botón,
el `fin-sesion` de P89 Parte 4 y la automática de P85 sin repetir lógica.

- Al escribir un pedido, guarda el momento en `localStorage` (`pedido-{uid}`). Es por
  dispositivo y por navegador, que es exactamente el alcance que sirve: el reloj que lo escribió
  es el mismo que lo compara.
- `MIN_ENTRE_PEDIDOS_MS = 60_000`, **el mismo valor que la función**, importado de un solo lugar
  para que no se desincronicen.
- Si el último pedido de este dispositivo fue hace menos de eso, `pedirSincronizacion`
  **no escribe** y devuelve `{ ok: true, yaPedido: true, haceMs }`. `pedirYTraer` agrega un
  `ComoContesto` nuevo: **`ya-pedido`** → **no espera** y va derecho a importar, con la línea
  *"Ya le pedimos al reloj hace N segundos; se importa lo que haya llegado."*
- Si el momento guardado está **en el futuro** respecto de nuestro reloj, la guarda se ignora y
  se pide: eso es un reloj movido, no un pedido reciente.
- Desde **otro dispositivo** dentro del mismo minuto la guarda no aplica y la función lo va a
  descartar igual. Es raro y cuesta 45 segundos de espera, no un dato perdido. **Documentalo, no
  lo arregles**: arreglarlo pide leer `ultimoPushMs`, que es el reloj de la función, y es el
  error que este prompt viene a sacar.

---

## Tests

- `decidir`: pedido con `escrituraMs` de ahora y `pedidoMs` **seis minutos atrasado** → manda
  (es el bug: hoy lo descarta). `pedidoMs` **diez minutos adelantado** → manda.
  `escrituraMs` de hace seis minutos → `pedido-viejo`, sea cual sea `pedidoMs`. `pedidoMs`
  ausente → manda, con `pedidoMs: "0"` en el payload.
- `estadoDelPedido`: el contador se movió → respondió, **aunque `ultimaCorridaMs` sea menor que
  `pedidoMs`** (el caso del reloj corrido, que es el test que importa). No se movió y hace poco
  → esperando. No se movió y hace rato → sin respuesta. Sin `corridaPreviaMs` → "no se sabe" y
  **sin** aviso de batería. Se movió después de vencida la espera → respondió tarde.
- `pedirSincronizacion`: dos llamadas seguidas escriben una sola vez, la segunda devuelve
  `yaPedido`; pasado el minuto vuelve a escribir; con la marca en el futuro, escribe.
- `pedirYTraer`: con `ya-pedido` **no llama a `esperar`** y sí llama a `traer`.
- La espera tardía: resuelve al llegar la corrida, **corta el listener en los tres caminos**
  (llegó, venció, se desmontó).
- Reglas: `corridaPreviaMs` int se acepta; string se rechaza; un campo de más se rechaza.

`npx tsc -b`, la suite, `npm run build`, `npm run test:rules`.

---

## Fuera de alcance

- Sincronizar relojes. No se puede y no hace falta: lo que hay que dejar de hacer es **decidir**
  con ellos.
- Tocar la corrida periódica del puente o el lado Android. Este prompt es todo ShapeUp.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido, y la función aparte.
2. Los tests nuevos, nombrados, en especial los dos del reloj corrido.
3. Si hay que volver a deployar reglas y función, y en qué orden.
4. Si encontraste otro lugar del código donde se resten dos relojes distintos. **Buscalo a
   propósito**: si hay uno más, quiero saberlo antes de que nos muerda.
5. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/91-que-el-pedido-no-mienta.md`.
