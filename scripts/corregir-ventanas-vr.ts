// ════════════════════════════════════════════════════════════════════════════
//  scripts/corregir-ventanas-vr.ts — las ventanas viejas de VR (P84).
//
//  Las sesiones anteriores a P80 tienen `inicioMs`/`finMs` derivados de las
//  rondas marcadas, y miden entre 10 y 24 minutos menos que `duracionRealMin`.
//  Con la ventana corta se leen como incompletas y la progresión de VR no
//  avanza. Manda el tiempo de la app (ADR #042): `finMs = inicioMs +
//  duracionRealMin`. La lógica vive en `src/lib/ventanasViejas.ts` (con tests).
//
//  Criterio: `(finMs − inicioMs) < duracionRealMin − 2 min`. Vale para
//  cualquier sesión de la app, no solo VR, pero las que no son de VR se listan
//  aparte: que aparezca una de fuerza sería otro problema.
//
//  Guardas: sin `inicioMs` o sin `duracionRealMin` no se toca; la ventana nueva
//  no pasa el `inicioMs` de la sesión siguiente del mismo miembro (se recorta y
//  se marca); `update()`, nunca `set()`. A la biometría le pone
//  `versionEnriquecimiento: 0` para que la próxima sincronización la rehaga
//  (ADR #038) y deja el resto como está.
//
//  Uso (desde la RAÍZ del repo):
//    npm run corregir:ventanas                 # simulación (default)
//    npm run corregir:ventanas -- --aplicar    # escribe
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  planificarCorrecciones, camposDeActualizacion, TOLERANCIA_VENTANA_MS,
  type CorreccionVentana, type SesionConVentana,
} from "../src/lib/ventanasViejas";
import { esRutinaVR } from "../src/lib/progresionVR";
import type { Rutina } from "../src/types/models";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function linea(c: CorreccionVentana): string {
  const recorte = c.recortada ? "   ✂ recortada por la sesión siguiente" : "";
  const bio = c.invalidaBiometria ? "   · biometría → v0" : "";
  return `  ${c.fecha}  ${c.nombreRutina.padEnd(28)} ${String(c.viejaMin).padStart(5)} → ${String(c.nuevaMin).padStart(5)} min  (+${c.ganaMin})${recorte}${bio}   [${c.idHist}]`;
}

// P87: corre con `scripts/lib/corrida.ts` (es el script de referencia del patrón).
correr("corregir-ventanas", async (c) => {
  console.log(`  Tolerancia: ${TOLERANCIA_VENTANA_MS / 60_000} min\n`);

  const [histSnap, rutSnap] = await Promise.all([
    db.collection("historial").get(),
    db.collection("rutinas").get(),
  ]);
  const idsVR = new Set(
    rutSnap.docs.filter((d) => esRutinaVR(d.data() as Rutina)).map((d) => d.id),
  );
  const sesiones = histSnap.docs.map((d) => ({ ...(d.data() as SesionConVentana), idHist: d.id }));
  console.log(`  /historial: ${sesiones.length} documentos · rutinas de VR: ${[...idsVR].join(", ") || "(ninguna)"}\n`);

  const { correcciones, omitidas } = planificarCorrecciones(sesiones, idsVR);
  const vr = correcciones.filter((k) => k.categoria !== "otra");
  const otras = correcciones.filter((k) => k.categoria === "otra");

  console.log(`  VR / juegos a corregir: ${vr.length}`);
  vr.forEach((k) => console.log(linea(k)));
  console.log(`\n  ⚠ NO son de VR y cumplen el criterio: ${otras.length}`);
  otras.forEach((k) => console.log(linea(k)));

  const porMotivo = new Map<string, number>();
  for (const o of omitidas) porMotivo.set(o.motivo, (porMotivo.get(o.motivo) ?? 0) + 1);
  console.log(`\n  no se tocan: ${omitidas.length}` +
    (omitidas.length ? `  (${[...porMotivo].map(([m, n]) => `${m}: ${n}`).join(", ")})` : ""));
  omitidas.filter((o) => o.motivo === "recorte-no-gana")
    .forEach((o) => console.log(`    ${o.fecha}  ${o.nombreRutina}  — el recorte no le deja nada que ganar [${o.idHist}]`));


  if (correcciones.length === 0) return;

  // Respaldo de lo que se pisa, para poder volver atrás a mano. Va ANTES de
  // tocar Firestore: sin respaldo no se escribe nada (lo garantiza corrida.ts).
  const respaldo = correcciones.map((corr) => {
    const s = sesiones.find((x) => x.idHist === corr.idHist)!;
    return {
      idHist: corr.idHist, finMsViejo: s.finMs,
      versionEnriquecimientoVieja: s.biometria?.versionEnriquecimiento ?? null,
      finMsNuevo: corr.nuevoFinMs,
    };
  });
  if (!c.abrirRespaldo(respaldo)) return;

  for (const corr of correcciones) {
    await c.escribir(`${corr.idHist}  ${corr.fecha}  ${corr.nombreRutina}`,
      () => db.collection("historial").doc(corr.idHist).update(camposDeActualizacion(corr)));
  }
});
