// ════════════════════════════════════════════════════════════════════════════
//  functions/src/index.ts — la primera Cloud Function de ShapeUp (P89).
//
//  pedirCorridaAlPuente: cuando ShapeUp escribe /ingesta-sdk/{uid}/estado/pedido,
//  le manda al puente de ESE uid un push de datos silencioso, y el puente hace
//  una corrida en el momento (P90). La lógica está en pedido.ts (pura, con
//  tests) y el cableado en deps.ts (probado contra el emulador).
//
//  Gen 2, southamerica-east1 (la región de Firestore). Solo manda al token del
//  uid del pedido: un cliente no tiene forma de dirigir un push a otro teléfono.
// ════════════════════════════════════════════════════════════════════════════
import { setGlobalOptions } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { procesarPedido, type Pedido } from "./pedido.js";
import { crearDeps } from "./deps.js";

initializeApp();

// maxInstances bajo: es una familia de cuatro, y un tope chico es la mejor
// alarma contra un loop que dispare invocaciones sin control.
setGlobalOptions({ region: "southamerica-east1", maxInstances: 2 });

const deps = crearDeps(
  getFirestore(),
  async (token, datos) => {
    await getMessaging().send({
      token,
      data: datos,                        // solo datos: nada visible en el teléfono
      android: { priority: "high", ttl: 5 * 60_000 },
    });
  },
  (nivel, mensaje, datos) => logger[nivel](mensaje, datos),
);

export const pedirCorridaAlPuente = onDocumentWritten(
  "ingesta-sdk/{uid}/estado/pedido",
  async (event) => {
    const pedido = (event.data?.after.exists ? event.data.after.data() : null) as Pedido | null;
    await procesarPedido(event.params.uid, pedido, deps);
  },
);
