# Cloud Functions de ShapeUp

La primera función del proyecto (P89). Si es la primera vez que tocás esto, leé todo:
son cinco minutos.

## Qué hay

| Función | Dispara con | Qué hace |
|---|---|---|
| `pedirCorridaAlPuente` | escritura en `/ingesta-sdk/{uid}/estado/pedido` | Le manda al puente Android de ese uid un **push de datos silencioso** (sin notificación visible), y el puente hace una corrida en el momento (P90). |

- Gen 2, región **`southamerica-east1`** (la misma de Firestore).
- **Guardas:**
  - ignora pedidos de más de 5 minutos;
  - manda como mucho un push por minuto por uid, reservando el turno en una transacción
    antes de enviar;
  - si el token está muerto, lo borra y no lo reintenta;
  - solo manda al token del uid del pedido.
- `maxInstances: 2`: un tope bajo a propósito, como alarma contra un loop.

**Archivos:**
- `src/pedido.ts`: la lógica, pura y con tests.
- `src/deps.ts`: el cableado con Firestore y FCM, probado contra el emulador.
- `src/index.ts`: la función.

## Una vez por máquina

```bash
cd functions
npm install
npx firebase login        # si la CLI todavía no tiene sesión
```

`functions/` tiene su propio `node_modules`. Sin ese `npm install`, `npx tsc -b` en la raíz
falla, porque chequea también este código.

## Probar

Desde la raíz del repo:

```bash
npx vitest run functions/src/pedido.test.ts   # lógica pura, sin emulador
npm run test:functions                        # contra el emulador de Firestore (necesita Java)
```

FCM no se emula: los tests del emulador usan un `enviar` falso. El push de verdad se prueba
de punta a punta con el puente (P90).

## Deployar

Desde la raíz:

```bash
npx firebase deploy --only functions
```

`firebase.json` compila antes de subir (`predeploy`).
- **La primera vez**, Firebase puede pedir que se habiliten APIs: Cloud Functions, Cloud
  Build, Artifact Registry, Eventarc y Cloud Run. Aceptá.
- **El proyecto tiene que estar en plan Blaze.** Ya lo está.
- **Las reglas van aparte:** `npx firebase deploy --only firestore:rules`. P89 las cambió:
  abren `estado/pedido` y `estado/dispositivo`. **Deployá las reglas antes o junto con la
  función**: sin ellas, ShapeUp no puede escribir el pedido.

## Ver los logs

```bash
npm --prefix functions run logs
# o, en la consola: Firebase → Functions → pedirCorridaAlPuente → Registros
```

Cada invocación deja una línea:

| Línea | Qué significa |
|---|---|
| `push enviado` | Salió el push |
| `pedido ignorado: sin-token` | El puente todavía no registró su token (P90). Es un `warn` |
| `pedido ignorado: muy-seguido` / `pedido-viejo` | Las guardas hicieron su trabajo |
| `token muerto: se borró fcmToken` | El puente lo reescribe la próxima vez que abre o corre |
| `no se pudo enviar el push` | Error de FCM. Es un `error` con el mensaje |

## Costo

Una invocación por sesión guardada, más las del botón, más alguna de la sincronización
automática: del orden de **decenas por mes**. El nivel gratuito de Cloud Functions es de
2 millones de invocaciones por mes, y FCM no cobra. El costo esperado es cero.
