// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-rutinas-vr.ts — las rutinas de VR por escalones (P98, ADR #046).
//
//  - Agrega las dificultades del juego a EJ-9003 (Bodycombat, las suyas),
//    EJ-9004, EJ-9009 y EJ-9010 (relativas). Los ejercicios ya existen.
//  - Crea RUT-0026 Combat largo, RUT-0027 Creed, RUT-0028 Ritmo suave y
//    RUT-0029 Combat corto, con sus dos escaleras.
//  - Archiva RUT-0004, 0005, 0007 y 0008 (`archivada: true`; no se borran: hay
//    sesiones y programas que las referencian). La RUT-0014 no se toca.
//  - Crea PRG-0013 «VR — 5 días», lo deja activo para juanpablo y pausa el
//    PRG-0004. El PRG-0012 de María no se toca.
//
//  La lógica y los datos viven en `src/lib/catalogoVR.ts` (con tests).
//  Idempotente: lo que ya está no se vuelve a escribir, y una rutina o un
//  programa que ya existen no se pisan.
//
//  Uso (desde la RAÍZ del repo):
//    npm run seed:rutinas-vr                 # simulación (default)
//    npm run seed:rutinas-vr -- --aplicar    # escribe
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import {
  planificarSeedVR, RUTINAS_VR, PROGRAMA_VR, DIFICULTADES_POR_EJERCICIO,
  RUTINAS_A_ARCHIVAR, PROGRAMA_A_PAUSAR, PRG_VR_5_DIAS, type EstadoActualVR, type PasoSeedVR,
} from "../src/lib/catalogoVR";
import { minutosPrescriptos } from "../src/lib/escalonesVR";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function describir(p: PasoSeedVR): string {
  switch (p.tipo) {
    case "dificultades": return `${p.idEjercicio}  dificultades: ${p.dificultadesVR.map((d) => d.etiqueta).join(" · ")}`;
    case "crear-rutina": return `${p.idRutina}  crear`;
    case "archivar-rutina": return `${p.idRutina}  archivar`;
    case "crear-programa": return `${p.idPrograma}  crear`;
    case "pausar-programa": return `${p.idPrograma}  estado ${p.estadoAntes ?? "(sin estado)"} → Pausado`;
    case "activar-programa": return `config/programaActivo.${p.miembro}  ${p.antes ?? "(ninguno)"} → ${p.idPrograma}`;
  }
}

correr("seed-rutinas-vr", async (c) => {
  const idsEj = Object.keys(DIFICULTADES_POR_EJERCICIO);
  const idsRut = [...RUTINAS_VR.map((r) => r.idRutina), ...RUTINAS_A_ARCHIVAR];
  const idsPrg = [PRG_VR_5_DIAS, PROGRAMA_A_PAUSAR];
  const [ejs, ruts, prgs, activoSnap] = await Promise.all([
    Promise.all(idsEj.map((id) => db.collection("ejercicios").doc(id).get())),
    Promise.all(idsRut.map((id) => db.collection("rutinas").doc(id).get())),
    Promise.all(idsPrg.map((id) => db.collection("programas").doc(id).get())),
    db.collection("config").doc("programaActivo").get(),
  ]);
  const actual: EstadoActualVR = {
    ejercicios: Object.fromEntries(ejs.map((d) => [d.id, d.exists ? d.data() as EstadoActualVR["ejercicios"][string] : undefined])),
    rutinas: Object.fromEntries(ruts.map((d) => [d.id, d.exists ? d.data() as EstadoActualVR["rutinas"][string] : undefined])),
    programas: Object.fromEntries(prgs.map((d) => [d.id, d.exists ? d.data() as EstadoActualVR["programas"][string] : undefined])),
    programaActivo: (activoSnap.data() ?? {}) as Record<string, string>,
  };

  // Lo que se va a crear, para leerlo antes de aplicar.
  for (const r of RUTINAS_VR) {
    console.log(`  ${r.idRutina}  ${r.nombre}  (lugar ${r.lugar}, equipo ${r.equipoNecesario.join(", ")}, regla ${r.vr!.regla})`);
    for (const [modo, escalera] of Object.entries(r.vr!.escaleras)) {
      console.log(`      ${modo.padEnd(8)} ${escalera!.map((e, i) => `E${i + 1} ${e.bloques}×${e.minutosBloque}′ ${e.descansoSeg}s ${e.dificultad} (${Math.round(minutosPrescriptos(e))}′)`).join(" · ")}`);
    }
  }
  console.log(`  ${PROGRAMA_VR.idPrograma}  ${PROGRAMA_VR.nombre}: ${PROGRAMA_VR.dias.map((d) => d.etiqueta).join(" · ")}\n`);

  const plan = planificarSeedVR(actual);
  for (const y of plan.yaEstan) console.log(`  · ya está: ${y}`);
  for (const p of plan.problemas) console.log(`  ⚠ ${p}`);
  if (plan.problemas.length > 0 || plan.pasos.length === 0) {
    if (plan.problemas.length > 0) console.log("\n  Hay problemas: no se escribe nada.");
    return;
  }
  console.log("");

  // Respaldo de lo que se pisa: los ejercicios, las rutinas a archivar, el
  // programa a pausar y el programa activo. Las rutinas y el programa nuevos no
  // pisan nada.
  const respaldo = {
    ejercicios: Object.fromEntries(idsEj.map((id) => [id, { dificultadesVR: actual.ejercicios[id]?.dificultadesVR ?? null }])),
    rutinas: Object.fromEntries(RUTINAS_A_ARCHIVAR.map((id) => [id, { archivada: actual.rutinas[id]?.archivada ?? null }])),
    programas: { [PROGRAMA_A_PAUSAR]: { estado: actual.programas[PROGRAMA_A_PAUSAR]?.estado ?? null } },
    programaActivo: actual.programaActivo,
  };
  if (!c.abrirRespaldo(respaldo)) return;

  const ahora = FieldValue.serverTimestamp();
  for (const p of plan.pasos) {
    const etiqueta = describir(p);
    if (p.tipo === "dificultades") {
      await c.escribir(etiqueta, () => db.collection("ejercicios").doc(p.idEjercicio)
        .update({ dificultadesVR: p.dificultadesVR, ultimaModificacion: ahora }));
    } else if (p.tipo === "crear-rutina") {
      const r = RUTINAS_VR.find((x) => x.idRutina === p.idRutina)!;
      // `create`, no `set`: si apareció entre la lectura y la escritura, falla en vez de pisar.
      await c.escribir(etiqueta, () => db.collection("rutinas").doc(p.idRutina)
        .create({ ...r, fechaCreacion: ahora, ultimaModificacion: ahora }));
    } else if (p.tipo === "archivar-rutina") {
      await c.escribir(etiqueta, () => db.collection("rutinas").doc(p.idRutina)
        .update({ archivada: true, ultimaModificacion: ahora }));
    } else if (p.tipo === "crear-programa") {
      await c.escribir(etiqueta, () => db.collection("programas").doc(p.idPrograma)
        .create({ ...PROGRAMA_VR, fechaCreacion: ahora, ultimaModificacion: ahora }));
    } else if (p.tipo === "pausar-programa") {
      await c.escribir(etiqueta, () => db.collection("programas").doc(p.idPrograma)
        .update({ estado: "Pausado", ultimaModificacion: ahora }));
    } else if (p.tipo === "activar-programa") {
      await c.escribir(etiqueta, () => db.collection("config").doc("programaActivo")
        .update({ [p.miembro]: p.idPrograma }));
    }
  }
});
