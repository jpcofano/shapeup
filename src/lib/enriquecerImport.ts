// ════════════════════════════════════════════════════════════════════════════
//  lib/enriquecerImport.ts — núcleo puro del match biométrico post-import
//
//  ADR #009: toda la lógica aquí es pura y testeable sin Firebase — NUNCA
//  importar nada de src/data/ ni src/firebase.ts en este archivo (ni siquiera
//  transitivamente). scripts/rematch-salud.ts importa este módulo directo
//  bajo tsx (Node puro, sin Vite): si algo de acá arrastra `../firebase.ts`
//  (`import.meta.env`), el script crashea al cargar, antes de ejecutar una
//  sola línea propia. El orquestador que sí toca Firestore
//  (`enriquecerTrasImport`) vive en `data/enriquecimiento.ts` — separado a
//  propósito tras un hotfix (P55) tras romper justo esto.
//  Guarda automática: scripts/pureza.test.ts.
//
//  ADR #021: idempotente — no pisa biometría "serie" con "sesion".
//  ADR #019: usa inicioMs/finMs del Historial si existen; si no, los deriva.
//  Spec del ranking/niveles del match: docs/prompts/57-s-match-robusto.md (P57).
// ════════════════════════════════════════════════════════════════════════════

import type { Historial, BloqueRegistro, PerfilMiembro } from "../types/models";
import type { ZipExtraccion } from "../import/samsungZip";
import type { SesionApp } from "./matchBiometrico";
import type { LiveDataPoint } from "../import/samsungLiveData";
import { stripUndef } from "../import/samsungHealth";
import {
  elegirSesionSamsung, construirBiometriaSesion, construirBiometriaRango,
  enriquecerSerie, topeInicioSiguiente,
} from "./matchBiometrico";

// ── Tipos públicos ────────────────────────────────────────────────────────────

export interface ResultadoEnriquecimiento {
  matcheadas:  number;
  porCustomId: number;
  porVentana:  number;
  porDia:      number;   // ventana sintética + único ShapeUp ese día (S-fix-b)
  porRango:    number;   // muestras crudas de FC dentro de la ventana (S-match, P57)
  sinMatch:    number;   // total = sinCandidatasEseDia + sinSolape
  sinCandidatasEseDia: number; // ventana sintética, 0 ShapeUp ese día (ni "dia" ni "rango" alcanzaron)
  sinSolape:           number; // ventana real, ninguna candidata pasó los techos (ni "rango" alcanzó)
  ambiguas:    number;   // ventana sintética + 2+ ShapeUp ese día — no se adivina (S-fix-b)
  omitidas:    number;   // ya tenían granularidad "serie" (ADR #021)
  updates: {
    idHist:    string;
    biometria: import("../types/models").BiometriaSesion;
    bloques?:  BloqueRegistro[];
  }[];
}

// ── Helper: ventana desde un Historial ────────────────────────────────────────

/**
 * Deriva la ventana de tiempo {inicioMs, finMs, sintetica} de un Historial.
 * Prioridad:
 *   1. h.inicioMs / h.finMs sellados en finalizarSesion (ADR #019) — no sintética
 *   2. mín/máx de serie.inicioMs / serie.finMs en los bloques — no sintética
 *   3. fechaRealizada a mediodía local ± duracionRealMin (fallback) — **sintética**:
 *      no viene de timestamps reales, solo sirve como estimación gruesa. El
 *      match por solapamiento sobre esta ventana no es confiable (S-fix-b);
 *      por eso `sintetica: true` habilita el fallback "día único" en
 *      `elegirSesionSamsung`.
 */
export function ventanaDeHistorial(h: Historial): SesionApp | null {
  // 1. Ventana sellada
  if (h.inicioMs != null && h.finMs != null) {
    return { inicioMs: h.inicioMs, finMs: h.finMs, sintetica: false, fecha: h.fechaRealizada };
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
  if (inicio != null && fin != null) return { inicioMs: inicio, finMs: fin, sintetica: false, fecha: h.fechaRealizada };

  // 3. Fallback: fecha a mediodía local ± duracion
  const fechaMs = new Date(`${h.fechaRealizada}T12:00:00`).getTime();
  if (isNaN(fechaMs)) return null;
  const margenMs = ((h.duracionRealMin ?? 60) * 60_000);
  return {
    inicioMs: fechaMs - margenMs, finMs: fechaMs + margenMs,
    sintetica: true, fecha: h.fechaRealizada,
  };
}

// ── Helper: enriquecer bloques con una curva (live_data.json o muestras crudas) ──

/**
 * Enriquece cada serie con FC de una curva `{ ms, fc }[]`. No muta `h`.
 * `finDatosDisponiblesMs` acota el tope de la última serie de la sesión
 * (P57): sin próxima serie detectable, `inicioSiguienteMs` se calcula con
 * `topeInicioSiguiente` en vez de quedar `undefined` (antes eso dejaba la
 * última serie siempre sin `recuperacionBpm`, por efecto colateral).
 */
function enriquecerBloquesConCurva(
  h: Historial,
  curva: LiveDataPoint[],
  finVentanaAppMs: number,
  finDatosDisponiblesMs: number,
): BloqueRegistro[] {
  return h.bloques.map((bloque) => {
    const seriesEnriquecidas = bloque.series.map((serie, idx) => {
      // inicioSiguienteMs: primer serie del siguiente bloque, o la siguiente del mismo
      const siguienteEnMismoBloque = bloque.series[idx + 1];
      let inicioSiguienteMs: number | undefined;
      if (siguienteEnMismoBloque?.inicioMs != null) {
        inicioSiguienteMs = siguienteEnMismoBloque.inicioMs;
      } else {
        // buscar primera serie con inicioMs en el bloque siguiente
        const siguienteBloque = h.bloques.find((b) => b.orden === bloque.orden + 1);
        const inicioEnSiguienteBloque = siguienteBloque?.series.find((s) => s.inicioMs != null)?.inicioMs;
        // Última serie de la sesión: tope explícito, no queda sin recuperación por efecto colateral (P57).
        inicioSiguienteMs = inicioEnSiguienteBloque ?? topeInicioSiguiente(finVentanaAppMs, finDatosDisponiblesMs);
      }
      const enriquecido = enriquecerSerie(serie, curva, inicioSiguienteMs);
      // stripUndef (hotfix P57): fcPico/fcFinSerie/recuperacionBpm pueden salir
      // undefined (sin pico en la ventana, sin dato de descanso, etc.) — sin
      // esto, el spread pisa la serie con una clave `undefined` explícita y
      // Firestore rechaza la escritura ("Cannot use undefined as a Firestore value").
      return { ...serie, ...stripUndef(enriquecido) };
    });
    return { ...bloque, series: seriesEnriquecidas };
  });
}

// ── Núcleo puro ───────────────────────────────────────────────────────────────

/**
 * Calcula el enriquecimiento biométrico para un conjunto de Historiales.
 * No toca Firebase — devuelve los `updates` que hay que aplicar.
 */
export function calcularEnriquecimiento(
  historial: Historial[],
  extraccion: Pick<ZipExtraccion, "sesionesSamsung" | "liveData" | "shapeUpCustomId"> & {
    /** Muestras crudas de FC para el nivel "rango" (P57). Ausente en rematch-salud (sin ZIP, sin curvas persistidas). */
    muestrasFcCrudas?: LiveDataPoint[];
  },
  perfil?: PerfilMiembro,
): ResultadoEnriquecimiento {
  const resultado: ResultadoEnriquecimiento = {
    matcheadas: 0, porCustomId: 0, porVentana: 0, porDia: 0, porRango: 0,
    sinMatch: 0, sinCandidatasEseDia: 0, sinSolape: 0,
    ambiguas: 0, omitidas: 0, updates: [],
  };

  const muestrasFcCrudas = extraccion.muestrasFcCrudas ?? [];

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
    if (!ventana) { resultado.sinMatch++; resultado.sinSolape++; continue; }

    // Pool sin datauuid ya usados
    const candidatas = extraccion.sesionesSamsung.filter((s) => !datauuidsUsados.has(s.datauuid));
    const match = elegirSesionSamsung(ventana, candidatas, extraccion.shapeUpCustomId);

    if (match && match.matchPor === "ambiguo") { resultado.ambiguas++; continue; }

    if (!match) {
      // Nivel "rango" (P57): último recurso con muestras crudas de FC en la ventana.
      const biometriaRango = construirBiometriaRango(ventana, muestrasFcCrudas, perfil);
      if (biometriaRango) {
        resultado.matcheadas++;
        resultado.porRango++;
        const finDatosMs = muestrasFcCrudas.length > 0
          ? muestrasFcCrudas[muestrasFcCrudas.length - 1].ms
          : ventana.finMs;
        const bloquesEnriquecidos = enriquecerBloquesConCurva(h, muestrasFcCrudas, ventana.finMs, finDatosMs);
        const huboEnriquecimientoPorSerie = bloquesEnriquecidos.some(
          (b) => b.series.some((s) => s.fcPico !== undefined),
        );
        if (huboEnriquecimientoPorSerie) {
          biometriaRango.granularidad = "serie";
          resultado.updates.push({ idHist: h.idHist, biometria: biometriaRango, bloques: bloquesEnriquecidos });
        } else {
          resultado.updates.push({ idHist: h.idHist, biometria: biometriaRango });
        }
        continue;
      }

      resultado.sinMatch++;
      if (ventana.sintetica) resultado.sinCandidatasEseDia++;
      else resultado.sinSolape++;
      continue;
    }

    datauuidsUsados.add(match.sesion.datauuid);
    resultado.matcheadas++;
    if (match.matchPor === "custom-id") resultado.porCustomId++;
    else if (match.matchPor === "dia") resultado.porDia++;
    else resultado.porVentana++;

    // Enriquecimiento por serie si hay curva live_data
    const curva = extraccion.liveData[match.sesion.datauuid];
    const biometria = construirBiometriaSesion(match.sesion, match.matchPor, perfil, ventana, curva);

    if (curva && curva.length > 0) {
      biometria.granularidad = "serie";
      const bloquesEnriquecidos = enriquecerBloquesConCurva(h, curva, ventana.finMs, match.sesion.endMs);
      resultado.updates.push({ idHist: h.idHist, biometria, bloques: bloquesEnriquecidos });
    } else {
      resultado.updates.push({ idHist: h.idHist, biometria });
    }
  }

  return resultado;
}
