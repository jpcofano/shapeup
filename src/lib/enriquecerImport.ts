// ════════════════════════════════════════════════════════════════════════════
//  lib/enriquecerImport.ts — núcleo puro del match biométrico post-import
//
//  ADR #009: toda la lógica aquí es pura y testeable sin Firebase.
//  ADR #021: idempotente — no pisa biometría "serie" con "sesion".
//  ADR #019: usa inicioMs/finMs del Historial si existen; si no, los deriva.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, BloqueRegistro, PerfilMiembro, MiembroId } from "../types/models";
import type { ZipExtraccion } from "../import/samsungZip";
import type { SesionApp } from "./matchBiometrico";
import {
  elegirSesionSamsung, construirBiometriaSesion, enriquecerSerie,
} from "./matchBiometrico";
import { getHistorialMiembro, enriquecerHistorial } from "../data/historial";
import { getPerfiles } from "../data/perfiles";
import { ok, err } from "./result";
import type { Result } from "./result";

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface ResultadoEnriquecimiento {
  matcheadas:  number;
  porCustomId: number;
  porVentana:  number;
  sinMatch:    number;
  omitidas:    number;   // ya tenían granularidad "serie" (ADR #021)
  updates: {
    idHist:    string;
    biometria: import("../types/models").BiometriaSesion;
    bloques?:  BloqueRegistro[];
  }[];
}

// ── Helper: ventana desde un Historial ────────────────────────────────────────

/**
 * Deriva la ventana de tiempo {inicioMs, finMs} de un Historial.
 * Prioridad:
 *   1. h.inicioMs / h.finMs sellados en finalizarSesion (ADR #019)
 *   2. mín/máx de serie.inicioMs / serie.finMs en los bloques
 *   3. fechaRealizada a mediodía local ± duracionRealMin (fallback)
 */
export function ventanaDeHistorial(h: Historial): SesionApp | null {
  // 1. Ventana sellada
  if (h.inicioMs != null && h.finMs != null) {
    return { inicioMs: h.inicioMs, finMs: h.finMs };
  }

  // 2. Derivar desde las series
  let inicio: number | undefined;
  let fin: number | undefined;
  for (const bloque of h.bloques) {
    for (const serie of bloque.series) {
      if (serie.inicioMs != null) inicio = inicio == null ? serie.inicioMs : Math.min(inicio, serie.inicioMs);
      if (serie.finMs    != null) fin    = fin    == null ? serie.finMs    : Math.max(fin,    serie.finMs);
    }
  }
  if (inicio != null && fin != null) return { inicioMs: inicio, finMs: fin };

  // 3. Fallback: fecha a mediodía local ± duracion
  const fechaMs = new Date(`${h.fechaRealizada}T12:00:00`).getTime();
  if (isNaN(fechaMs)) return null;
  const margenMs = ((h.duracionRealMin ?? 60) * 60_000);
  return { inicioMs: fechaMs - margenMs, finMs: fechaMs + margenMs };
}

// ── Núcleo puro ───────────────────────────────────────────────────────────────

/**
 * Calcula el enriquecimiento biométrico para un conjunto de Historiales.
 * No toca Firebase — devuelve los `updates` que hay que aplicar.
 */
export function calcularEnriquecimiento(
  historial: Historial[],
  extraccion: Pick<ZipExtraccion, "sesionesSamsung" | "liveData" | "shapeUpCustomId">,
  perfil?: PerfilMiembro,
): ResultadoEnriquecimiento {
  const resultado: ResultadoEnriquecimiento = {
    matcheadas: 0, porCustomId: 0, porVentana: 0, sinMatch: 0, omitidas: 0, updates: [],
  };

  // Pool de datauuid disponibles (evitar doble asignación — ADR #021)
  const datauuidsUsados = new Set<string>();

  // Ordenar cronológicamente para procesar en orden y asignar 1:1
  const ordenado = [...historial].sort((a, b) => a.fechaRealizada.localeCompare(b.fechaRealizada));

  for (const h of ordenado) {
    // ADR #021: si ya tiene granularidad "serie", omitir
    if (h.biometria?.granularidad === "serie") {
      resultado.omitidas++;
      continue;
    }

    const ventana = ventanaDeHistorial(h);
    if (!ventana) { resultado.sinMatch++; continue; }

    // Pool sin datauuid ya usados
    const candidatas = extraccion.sesionesSamsung.filter((s) => !datauuidsUsados.has(s.datauuid));
    const match = elegirSesionSamsung(ventana, candidatas, extraccion.shapeUpCustomId);

    if (!match) { resultado.sinMatch++; continue; }

    datauuidsUsados.add(match.sesion.datauuid);
    resultado.matcheadas++;
    if (match.matchPor === "custom-id") resultado.porCustomId++;
    else resultado.porVentana++;

    const biometria = construirBiometriaSesion(match.sesion, match.matchPor, perfil);

    // Enriquecimiento por serie si hay curva live_data
    const curva = extraccion.liveData[match.sesion.datauuid];
    if (curva && curva.length > 0) {
      biometria.granularidad = "serie";
      const bloquesEnriquecidos: BloqueRegistro[] = h.bloques.map((bloque) => {
        const seriesEnriquecidas = bloque.series.map((serie, idx) => {
          // inicioSiguienteMs: primer serie del siguiente bloque, o la siguiente del mismo
          const siguienteEnMismoBloque = bloque.series[idx + 1];
          let inicioSiguienteMs: number | undefined;
          if (siguienteEnMismoBloque?.inicioMs != null) {
            inicioSiguienteMs = siguienteEnMismoBloque.inicioMs;
          } else {
            // buscar primera serie con inicioMs en el bloque siguiente
            const siguienteBloque = h.bloques.find((b) => b.orden === bloque.orden + 1);
            inicioSiguienteMs = siguienteBloque?.series.find((s) => s.inicioMs != null)?.inicioMs;
          }
          const enriquecido = enriquecerSerie(serie, curva, inicioSiguienteMs);
          return { ...serie, ...enriquecido };
        });
        return { ...bloque, series: seriesEnriquecidas };
      });
      resultado.updates.push({ idHist: h.idHist, biometria, bloques: bloquesEnriquecidos });
    } else {
      resultado.updates.push({ idHist: h.idHist, biometria });
    }
  }

  return resultado;
}

// ── Orquestador (lee Firestore + aplica updates) ──────────────────────────────

/**
 * Lee el historial del miembro, calcula el enriquecimiento y aplica los updates.
 * Los errores parciales (una escritura fallida) no cancelan el resto.
 */
export async function enriquecerTrasImport(
  miembro: MiembroId,
  extraccion: ZipExtraccion,
): Promise<Result<ResultadoEnriquecimiento>> {
  const [histRes, perfRes] = await Promise.all([
    getHistorialMiembro(miembro),
    getPerfiles(),
  ]);

  if (!histRes.ok) return err(histRes.error);

  const perfil = perfRes.ok ? perfRes.value[miembro] : undefined;
  const resultado = calcularEnriquecimiento(histRes.value, extraccion, perfil);

  if (resultado.updates.length === 0) return ok(resultado);

  const escrituras = await Promise.allSettled(
    resultado.updates.map(({ idHist, biometria, bloques }) =>
      enriquecerHistorial(idHist, biometria, bloques),
    ),
  );

  // Contar errores: restar de matcheadas
  const errores = escrituras.filter((r) => r.status === "rejected").length;
  resultado.matcheadas -= errores;

  return ok(resultado);
}
