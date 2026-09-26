// ════════════════════════════════════════════════════════════════════════════
//  functions/src/deps.ts — el cableado de pedido.ts con Firestore y FCM (P89).
//
//  Aparte de index.ts para poder probarlo contra el emulador de Firestore con
//  una transacción de verdad (lo que garantiza "un push por minuto" con pedidos
//  simultáneos), pasándole un `enviar` falso: FCM no se emula.
// ════════════════════════════════════════════════════════════════════════════
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { decidir, type DepsPedido, type Dispositivo } from "./pedido.js";

export function crearDeps(
  db: Firestore,
  enviar: DepsPedido["enviar"],
  log: DepsPedido["log"],
  ahora: () => number = () => Date.now(),
): DepsPedido {
  const dispositivoRef = (uid: string) => db.doc(`ingesta-sdk/${uid}/estado/dispositivo`);
  return {
    reservarTurno: (uid, pedido, ms) => db.runTransaction(async (tx) => {
      const ref = dispositivoRef(uid);
      const snap = await tx.get(ref);
      const decision = decidir(pedido, snap.exists ? (snap.data() as Dispositivo) : null, ms);
      // Se reserva ANTES de enviar: el segundo pedido simultáneo ya ve el turno tomado.
      if (decision.accion === "mandar") tx.update(ref, { ultimoPushMs: ms });
      return decision;
    }),
    enviar,
    borrarToken: async (uid) => {
      await dispositivoRef(uid).update({ fcmToken: FieldValue.delete() });
    },
    ahora,
    log,
  };
}
