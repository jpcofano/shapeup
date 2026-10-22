// ════════════════════════════════════════════════════════════════════════════
//  lib/marcasSesion.ts — las marcas de una sesión (P99, docs/ANALISIS-ASISTIDO.md §3).
//
//  Lo medido, en números: nunca una interpretación (ADR #044). Acá se calculan
//  las marcas que salen de lo guardado en la sesión o del historial (calidad,
//  record, carga, zonaAlta o volumen, semana); las que salen de la curva las
//  calcula el enriquecimiento y viven en `biometria.marcas`. `marcasDeSesion`
//  junta las dos tandas en el orden fijo de `IDS_MARCA`, sin repetir ids.
//
//  - **El récord es «a la fecha»**: se compara solo contra las sesiones
//    anteriores (fecha menor, o la misma fecha con `inicioMs` menor), así el
//    récord de una sesión no cambia cuando después aparece una mejor.
//  - La semana cuenta contra la meta del día en que se jugó la sesión
//    (`planSemana`, sellada ese día), no contra el plan de hoy: sin
//    `planSemana`, no hay marca.
//  - Todo es función pura (ADR #009): sin Firebase, testeable directo.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, IdMarca, MarcaSesion } from "../types/models";
import { IDS_MARCA } from "../types/models";
import { COBERTURA_MINIMA } from "./matchBiometrico";
import { tonelajeKg } from "./metricas";
import { esPR, mejorCarga } from "./resumenSesion";
import { esShapeUp } from "./tipoHistorial";

export interface ContextoMarcas {
  /** Historial del miembro (puede incluir la sesión misma y sesiones posteriores: se filtran acá). */
  historial: Historial[];
}

// ── Utilidades ───────────────────────────────────────────────────────────────

function redondear(n: number, decimales: number): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

/** ¿`otra` es estrictamente anterior a `h`? Misma fecha: decide `inicioMs`; sin él, no es anterior. */
function esAnterior(otra: Historial, h: Historial): boolean {
  if (otra.idHist === h.idHist) return false;
  if (otra.fechaRealizada !== h.fechaRealizada) return otra.fechaRealizada < h.fechaRealizada;
  return otra.inicioMs != null && h.inicioMs != null && otra.inicioMs < h.inicioMs;
}

function previasDe(h: Historial, historial: Historial[]): Historial[] {
  return historial.filter((o) => esShapeUp(o) && esAnterior(o, h));
}

/** Minutos de Z4 + Z5, o `undefined` sin `minutosPorZona`. */
function minutosZonaAlta(h: Historial): number | undefined {
  const z = h.biometria?.minutosPorZona;
  if (!z) return undefined;
  return (z.Z4 ?? 0) + (z.Z5 ?? 0);
}

function cargaDeZonas(h: Historial): number | undefined {
  const z = h.biometria?.minutosPorZona;
  if (!z) return undefined;
  let total = 0;
  for (let i = 1; i <= 5; i++) total += (z[`Z${i}` as keyof typeof z] ?? 0) * i;
  return total;
}

// ── Marcas que se calculan acá ───────────────────────────────────────────────

export function marcaCalidad(h: Historial): MarcaSesion | null {
  const b = h.biometria;
  if (!b) return null;
  const cobFloja = b.coberturaFina != null && b.coberturaFina < COBERTURA_MINIMA;
  const dudosa = b.fcDudosa === true;
  if (!cobFloja && !dudosa) return null;
  return {
    id: "calidad",
    nivel: 1,
    coberturaFina: b.coberturaFina != null ? redondear(b.coberturaFina, 2) : null,
    fcDudosa: dudosa,
  };
}

export function marcaCarga(h: Historial): MarcaSesion | null {
  const c = cargaDeZonas(h);
  if (c == null) return null;
  return { id: "carga", nivel: 1, valor: redondear(c, 1) };
}

export function marcaZonaAltaOVolumen(h: Historial): MarcaSesion | null {
  const kg = tonelajeKg(h);
  if (kg > 0) return { id: "volumen", nivel: 1, kg };
  const z = h.biometria?.minutosPorZona;
  if (!z) return null;
  const alta = minutosZonaAlta(h) ?? 0;
  const conDato = Object.values(z).reduce<number>((s, m) => s + (m ?? 0), 0) + (h.biometria?.minutosBajoZonas ?? 0);
  const pct = conDato > 0 ? Math.round((alta / conDato) * 100) : 0;
  return { id: "zonaAlta", nivel: 1, minutos: redondear(alta, 1), pct };
}

export function marcaRecord(h: Historial, historial: Historial[]): MarcaSesion | null {
  if (!esShapeUp(h)) return null;
  const previas = previasDe(h, historial);
  const bloques = h.bloques ?? [];

  // Fuerza: por ejercicio, con la misma regla que el récord de P70.
  if (bloques.some((b) => b.modalidad === "Fuerza")) {
    for (const b of bloques) {
      if (b.modalidad !== "Fuerza" || !esPR(b, previas)) continue;
      const valor = mejorCarga(b);
      if (valor == null) continue;
      const antes = previas
        .flatMap((p) => p.bloques ?? [])
        .filter((pb) => pb.modalidad === "Fuerza" && pb.idEjercicio === b.idEjercicio)
        .map((pb) => mejorCarga(pb))
        .filter((c): c is number => c != null);
      if (antes.length === 0) continue;
      return {
        id: "record", nivel: 1, metrica: "cargaKg",
        valor, anterior: Math.max(...antes), actividad: b.nombreEjercicio,
      };
    }
    return null;
  }

  // VR y cardio: por actividad (el primer bloque Cardio), tres métricas.
  const bloque = bloques.find((b) => b.modalidad === "Cardio");
  if (!bloque) return null;
  const mismas = previas.filter((p) => (p.bloques ?? []).find((b) => b.modalidad === "Cardio")?.idEjercicio === bloque.idEjercicio);
  if (mismas.length === 0) return null;

  const metricas: { metrica: "carga" | "zonaAltaMin" | "duracionMin"; de: (x: Historial) => number | undefined }[] = [
    { metrica: "carga", de: cargaDeZonas },
    { metrica: "zonaAltaMin", de: minutosZonaAlta },
    { metrica: "duracionMin", de: (x) => x.duracionRealMin ?? undefined },
  ];
  for (const { metrica, de } of metricas) {
    const hoy = de(h);
    if (hoy == null) continue;
    const antes = mismas.map(de).filter((v): v is number => v != null);
    if (antes.length === 0) continue;
    const mayor = Math.max(...antes);
    if (redondear(hoy, 2) > redondear(mayor, 2)) {
      return {
        id: "record", nivel: 1, metrica,
        valor: redondear(hoy, 1), anterior: redondear(mayor, 1), actividad: bloque.nombreEjercicio,
      };
    }
  }
  return null;
}

export function marcaSemana(h: Historial, historial: Historial[]): MarcaSesion | null {
  if (!h.planSemana || !esShapeUp(h)) return null;
  const sesiones = [h, ...historial.filter((o) => o.idHist !== h.idHist)]
    .filter((o) => esShapeUp(o) && o.semanaInicio === h.semanaInicio && o.fechaRealizada <= h.fechaRealizada);
  const fechas = new Set<string>();
  const fechasFuerza = new Set<string>();
  for (const s of sesiones) {
    fechas.add(s.fechaRealizada);
    const conFuerza = (s.bloques ?? []).some((b) => b.modalidad === "Fuerza" && b.series.some((x) => x.completada));
    if (conFuerza) fechasFuerza.add(s.fechaRealizada);
  }
  return {
    id: "semana", nivel: 1,
    dias: fechas.size, meta: h.planSemana.metaDias, diasFuerza: fechasFuerza.size,
  };
}

/**
 * Todas las marcas de la sesión, en el orden fijo de IDS_MARCA: las que se calculan
 * acá (calidad, record, carga, zonaAlta o volumen, semana) más las guardadas de la
 * curva (h.biometria?.marcas). Nunca dos con el mismo id.
 */
export function marcasDeSesion(h: Historial, ctx: ContextoMarcas): MarcaSesion[] {
  const calculadas = [
    marcaCalidad(h),
    marcaRecord(h, ctx.historial),
    marcaCarga(h),
    marcaZonaAltaOVolumen(h),
    marcaSemana(h, ctx.historial),
  ].filter((m): m is MarcaSesion => m != null);
  const ids = new Set<IdMarca>(calculadas.map((m) => m.id));
  const guardadas = (h.biometria?.marcas ?? []).filter((m) => {
    if (ids.has(m.id)) return false; // gana el calculado acá (o la primera guardada)
    ids.add(m.id);
    return true;
  });
  const orden = (m: MarcaSesion) => IDS_MARCA.indexOf(m.id);
  return [...calculadas, ...guardadas].sort((a, b) => orden(a) - orden(b));
}

/** Las marcas que van en la fila de badges (nivel 1) y las secundarias (nivel 2). */
export function separarPorNivel(marcas: MarcaSesion[]): { badges: MarcaSesion[]; secundarias: MarcaSesion[] } {
  return {
    badges: marcas.filter((m) => m.nivel === 1),
    secundarias: marcas.filter((m) => m.nivel === 2),
  };
}

// ── Texto ────────────────────────────────────────────────────────────────────

/** Número es-AR: coma decimal, punto de miles; hasta `maxDec` decimales sin ceros de relleno. */
function num(n: number, maxDec = 1): string {
  const f = redondear(n, maxDec).toFixed(maxDec);
  const s = f.includes(".") ? f.replace(/\.?0+$/, "") : f;
  const [ent, dec] = s.split(".");
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dec ? `${miles},${dec}` : miles;
}

/** Segundos → m:ss. */
function mmss(seg: number): string {
  const t = Math.max(0, Math.round(seg));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

const MENOS = "−";
const bajada = (n: number) => `${MENOS}${num(Math.abs(n), 0)}`;

/** El texto corto de una marca, en castellano, para la pantalla y el paquete. Solo lo medido. */
export function textoMarca(m: MarcaSesion): string {
  switch (m.id) {
    case "calidad": {
      const partes: string[] = [];
      if (m.coberturaFina != null && m.coberturaFina < COBERTURA_MINIMA) {
        partes.push(`Medición floja: el reloj cubrió el ${num(m.coberturaFina * 100, 0)} %`);
      }
      if (m.fcDudosa) partes.push("FC dudosa: posibles artefactos");
      return partes.join(" · ");
    }
    case "record": {
      if (m.metrica === "cargaKg") {
        return `Récord en ${m.actividad}: ${num(m.valor)} kg (antes ${num(m.anterior)} kg)`;
      }
      if (m.metrica === "carga") {
        return `Récord de carga en ${m.actividad}: ${num(m.valor)} (antes ${num(m.anterior)})`;
      }
      const que = m.metrica === "zonaAltaMin" ? "zona alta" : "duración";
      return `Récord de ${que} en ${m.actividad}: ${num(m.valor)} min (antes ${num(m.anterior)} min)`;
    }
    case "picoSobreVigente":
      return `Pico ${num(m.suavizado, 0)} sobre tu FC máx ${num(m.fcMaxVigente, 0)} (crudo ${num(m.crudo, 0)})`;
    case "carga":
      return `Carga ${num(m.valor)}`;
    case "zonaAlta":
      return `Zona alta ${num(m.minutos)} min · ${num(m.pct, 0)} %`;
    case "volumen":
      return `Volumen ${num(m.kg, 0)} kg`;
    case "semana":
      return `${m.dias} de ${m.meta} · ${m.diasFuerza === 0 ? "sin fuerza" : `${m.diasFuerza} con fuerza`}`;
    case "tramoSostenido":
      return `Tramo sostenido ${mmss(m.duracionSeg)}`;
    case "tramoBajo":
      return `Tramo bajo ${mmss(m.duracionSeg)}`;
    case "mitades": {
      const signo = m.diferencia >= 0 ? "+" : MENOS;
      return `Mitades ${num(m.primera)} → ${num(m.segunda)} (${signo}${num(Math.abs(m.diferencia))})`;
    }
    case "recuperacionSeries": {
      if (m.bajadas.length > 0) {
        const n = `${m.bajadas.length} ${m.bajadas.length === 1 ? "bajada" : "bajadas"}`;
        return m.mayor ? `${n} · mayor ${bajada(m.mayor.caida)} en ${m.mayor.enSeg} s` : n;
      }
      if (m.pausas.length > 0) {
        return `Recuperación entre series: ${m.pausas.map((p) => bajada(p.bpm)).join(", ")} bpm`;
      }
      return "Sin bajadas medibles";
    }
    case "picosZ5":
      return `Z5: ${m.entradas} ${m.entradas === 1 ? "vez" : "veces"} · la más larga ${mmss(m.masLargaSeg)}`;
    case "entradaEnCalor":
      return `Entrada en calor ${mmss(m.segundos)}`;
    case "pico":
      return `Pico ${num(m.suavizado, 0)} (crudo ${num(m.crudo, 0)})`;
  }
}
