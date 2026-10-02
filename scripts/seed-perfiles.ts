// ════════════════════════════════════════════════════════════════════════════
//  scripts/seed-perfiles.ts — Escribe /config/perfiles (PerfilesConfig de models.ts).
//
//  Por cada miembro: color, equipo POR LUGAR (P72), objetivos, lugar habitual, FC
//  máxima con su origen y zonas de FC.
//
//  FC máxima (P97, ADR #045): un valor declarado, con su origen. La de juanpablo
//  es 169, la que muestra Samsung. Las demás son 220 − edad, con origen
//  `edad-provisoria`: quedan pendientes de confirmar en la primera revisión.
//  Las zonas salen de `zonasDesdeFcMax` (lib/zonas), la única función de FC
//  máxima a zonas, con la convención de Samsung.
//
//  Siembra `equipoPorLugar`, no el `equipoDisponible` plano y obsoleto: así un
//  reseed no deshace la migración a equipo por lugar (P72; el script que la
//  aplicó, migrar-equipo-por-lugar.ts, se borró en P87 — ver docs/SEEDS.md).
//
//  Uso: npm run seed:perfiles [-- --aplicar [--force]]
//  Simula por defecto (P87, migrado en P97); --aplicar escribe si
//  /config/perfiles no existe; con --force lo pisa, con respaldo antes.
// ════════════════════════════════════════════════════════════════════════════

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { zonasDesdeFcMax } from "../src/lib/zonas";
import type { OrigenFcMax } from "../src/types/models";
import { correr } from "./lib/corrida";

const __dir = dirname(fileURLToPath(import.meta.url));
const force  = process.argv.includes("--force");
const serviceAccount = JSON.parse(readFileSync(resolve(__dir, "service-account.json"), "utf8"));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

type MiembroPerfil = {
  edad: number; color: string; lugar: string; objetivos: string[]; equipo: string[];
  /** FC máxima declarada. Sin esto, 220 − edad con origen `edad-provisoria`. */
  fcMax?: { valor: number; origen: OrigenFcMax };
};

// Colores: placeholders distintos por miembro (Claude Design los puede afinar).
const MIEMBROS: Record<string, MiembroPerfil> = {
  juanpablo: {
    edad: 51, color: "#60a5fa", lugar: "Casa", objetivos: ["Recomposición"],
    equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Kettlebell", "Banco", "Peso corporal", "VR"],
    fcMax: { valor: 169, origen: "samsung" },
  },
  maria: {
    edad: 50, color: "#f472b6", lugar: "Casa", objetivos: ["Recomposición", "Pérdida de grasa"],
    equipo: ["Mancuernas", "Banda elástica", "Banco", "Peso corporal", "VR"],
  },
  sofia: {
    edad: 17, color: "#a78bfa", lugar: "Casa", objetivos: ["General / salud", "Movilidad"],
    equipo: ["Mancuernas", "Banda elástica", "Peso corporal", "VR"],
  },
  federico: {
    edad: 16, color: "#34d399", lugar: "Casa", objetivos: ["General / salud"],
    equipo: ["Mancuernas", "Banda elástica", "Barra de dominadas", "Banco", "Peso corporal", "VR"],
  },
};

function perfilDoc(m: MiembroPerfil, ahoraMs: number) {
  const fcMax = m.fcMax ?? { valor: 220 - m.edad, origen: "edad-provisoria" as const };
  return {
    color: m.color,
    // El equipo de cada uno está en su lugar habitual; los otros lugares quedan
    // sin declarar (la app cae a peso corporal hasta que el miembro los complete).
    equipoPorLugar: { [m.lugar]: m.equipo },
    objetivos: m.objetivos,
    lugarHabitual: m.lugar,
    fcMaxTeorica: fcMax.valor,
    fcMaxOrigen: fcMax.origen,
    fcMaxDesdeMs: ahoraMs,
    zonasFC: zonasDesdeFcMax(fcMax.valor),
  };
}

correr("seed-perfiles", async (c) => {
  const ref = db.collection("config").doc("perfiles");
  const snap = await ref.get();
  if (snap.exists && !force) {
    c.omitir("config/perfiles", "ya existe; usá --force para pisarlo");
    return;
  }

  const ahoraMs = Date.now();
  const perfiles: Record<string, unknown> = {};
  for (const [id, m] of Object.entries(MIEMBROS)) {
    const doc = perfilDoc(m, ahoraMs);
    perfiles[id] = doc;
    const z = doc.zonasFC;
    console.log(`  ${id}: FC máx ${doc.fcMaxTeorica} (${doc.fcMaxOrigen}) · `
      + `Z1 ${z.Z1.min}-${z.Z1.max} · Z2 ${z.Z2.min}-${z.Z2.max} · Z3 ${z.Z3.min}-${z.Z3.max} · `
      + `Z4 ${z.Z4.min}-${z.Z4.max} · Z5 ${z.Z5.min}-${z.Z5.max}`);
  }

  if (snap.exists) {
    if (!c.abrirRespaldo({ "config/perfiles": snap.data() })) return;
  } else {
    c.sinRespaldo("config/perfiles no existe: no hay nada que pisar");
  }
  await c.escribir("config/perfiles",
    () => ref.set({ ...perfiles, ultimaActualizacion: FieldValue.serverTimestamp() }, { merge: false }));
});
