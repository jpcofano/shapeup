# 89 — El botón pide, el reloj responde (lado ShapeUp)

Repo: jpcofano/shapeup. Va después de P88 (el crash y la tarjeta del puente).
**Su par es P90, en el repo del puente.** Este prompt no sirve solo.

## Qué problema resuelve

Hoy hay dos sincronizaciones distintas con el mismo nombre:

- **reloj → nube**, la hace la app del puente, cada 6 horas;
- **nube → ShapeUp**, la hace el botón "Sincronizar ahora".

El usuario termina de entrenar, aprieta el botón, y su sesión no se enriquece: el dato todavía
está en el teléfono porque el puente no corrió. Pasó de verdad el 25/09 y **parecía que la app
había fallado**.

Después de esto, el botón hace las dos cosas en orden: **le pide al puente, espera, e
importa.** Y al terminar una sesión el pedido sale solo, así el dato viaja mientras la persona
se baña.

Una página web no puede despertar una app Android, así que el mensajero es **una Cloud
Function que manda un push silencioso**. Es la primera función del proyecto.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — Dos documentos nuevos y las reglas

Todo cuelga de `/ingesta-sdk/{uid}/estado/`, donde ya vive `puente`.

**`estado/pedido`** — lo escribe ShapeUp:

| Campo | |
|---|---|
| `pedidoMs` | int, cuándo se pidió |
| `origen` | `'boton'` · `'fin-sesion'` · `'automatica'` |

**`estado/dispositivo`** — lo escribe el puente (P90):

| Campo | |
|---|---|
| `fcmToken` | string |
| `actualizadoMs` | int |
| `modelo`, `versionPuente` | string |
| `ultimoPushMs` | int, **lo escribe la función** |

En `firestore.rules`, la regla de `estado/{docId}` hoy exige `docId == 'puente'`. Abrila a los
tres documentos, **cada uno con su propia lista de campos permitidos**, con el mismo estilo
estricto que ya tiene.

**Ojo con un detalle que rompe callado:** `request.resource.data` es el documento **después**
del merge, así que `ultimoPushMs` —que escribe la función— tiene que estar en la lista
permitida de `dispositivo`. Si no, la próxima escritura del puente se rechaza sin que nadie
entienda por qué.

Y sumá `'pedido'` a los orígenes válidos de `puente`, para distinguir una corrida pedida de
una de rutina.

**Tests de reglas** (esta máquina tiene Java, así que corrémelos): el dueño escribe su pedido;
otro uid no; un campo de más se rechaza; `pedidoMs` que no es int se rechaza; un `docId`
inventado se rechaza.

---

## Parte 2 — La Cloud Function

Carpeta `functions/`, **gen 2**, región **`southamerica-east1`**, la misma que Firestore.

Dispara con `onDocumentWritten` sobre `ingesta-sdk/{uid}/estado/pedido`:

1. Si el documento se borró, no hace nada.
2. Lee `estado/dispositivo` del mismo uid. Sin token, termina y lo anota.
3. **Manda un push de datos, sin notificación visible**, con prioridad alta, al token.
4. Escribe `ultimoPushMs` en `dispositivo`.

**Guardas:**

- **Ignora pedidos viejos**: si `pedidoMs` tiene más de 5 minutos, no manda nada. Evita que un
  reintento de la función despierte el teléfono por un pedido que ya no importa.
- **Como mucho un push por minuto por uid**, mirando `ultimoPushMs`.
- **Token inválido** (`messaging/registration-token-not-registered`): borra `fcmToken` y lo
  anota. Un token muerto no se reintenta para siempre.
- La función **solo manda al token del uid del pedido**. No hay forma de que un cliente mande
  un push a otro dispositivo.

Que el `README` de `functions/` diga cómo se deploya y cómo se ven sus logs — va a ser la
primera vez para quien la toque.

---

## Parte 3 — El botón, en dos pasos

En `data/`, dos funciones nuevas:

- `pedirSincronizacion(uid, origen)` — escribe `estado/pedido`.
- `esperarCorridaDelPuente(uid, desdeMs, timeoutMs)` — escucha `estado/puente` con `onSnapshot`
  y resuelve cuando `ultimaCorridaMs > desdeMs`, o cuando vence. **Siempre corta el listener.**

`ESPERA_PUENTE_MS = 45000`.

El botón pasa a:

1. **"Pidiéndole los datos al reloj…"** — escribe el pedido y espera.
2. **"Importando…"** — la sincronización de siempre, haya contestado o no.
3. El resultado de siempre.

**Si el puente no contesta, se importa igual y se dice**: *"El reloj no contestó a tiempo; se
importó lo que ya estaba. Lo que falte entra en la próxima."* Nunca se queda esperando ni se
pierde el paso de importar.

---

## Parte 4 — Al terminar una sesión, el pedido sale solo

Es lo que más cambia el uso diario: cuando se guarda una sesión, se escribe el pedido con
`origen: 'fin-sesion'`, **sin esperar nada y sin mostrar nada**. Para cuando la persona vuelva
a abrir la app, el dato ya viajó.

- Es una escritura, no bloquea el guardado, y si falla **no rompe nada**: la sesión ya está
  guardada y ese es el dato que importa.
- La sincronización automática de P85 también pide primero si `ultimaCorridaMs` del puente es
  **anterior** al fin de la última sesión: es justo el caso en que sabemos que falta algo.

---

## Parte 5 — Que se entienda en la pantalla

En la tarjeta del Puente, sobre lo que ya arregló P88:

- cuándo fue el último **pedido** y si el reloj respondió;
- si el pedido quedó sin respuesta hace rato, una línea con la causa probable: *"El teléfono
  puede tener la app del puente detenida o con ahorro de batería"*. Es la causa real más común
  y no hay forma de detectarla desde acá.

---

## Tests

- `esperarCorridaDelPuente`: resuelve cuando `ultimaCorridaMs` avanza; devuelve "no contestó"
  al vencer; **corta el listener en los dos casos** (test explícito: un listener que queda vivo
  sigue leyendo y no se nota hasta la factura).
- El botón importa igual cuando el puente no contesta.
- Al guardar una sesión se escribe el pedido; si esa escritura falla, la sesión queda guardada
  igual.
- La función, con el emulador: pedido nuevo manda push; pedido de 6 minutos no; dos pedidos en
  el mismo minuto mandan uno; sin token no falla.
- Reglas: las de la Parte 1.

`npx tsc -b`, la suite, `npm run build` y `npm run test:rules`.

---

## Fuera de alcance

- Notificaciones visibles al usuario. El push es **de datos y silencioso**: despierta al
  puente y nada más.
- Que el puente escuche cambios de Samsung Health por su cuenta.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido, y la función aparte.
2. Tests, `tsc`, build y reglas.
3. **El costo esperado**: invocaciones por día en el uso real (una por sesión más las
   manuales), contra el nivel gratuito de Cloud Functions. Y si hace falta configurar una
   alerta de presupuesto, decilo.
4. Qué falta del lado del puente para que esto funcione de punta a punta (es P90).
5. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/89-pedir-al-reloj-shapeup.md`.
