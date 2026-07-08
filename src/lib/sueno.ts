// ════════════════════════════════════════════════════════════════════════════
//  src/lib/sueno.ts — Consolidación de tramos de sueño en noches.
//
//  Samsung Health exporta una fila por sesión (noche partida, siestas);
//  esta capa agrupa todo en NocheSueno (una entrada por fecha de la mañana).
//  Fuente única de verdad para la tab Sueño, resumenSalud, HistorialDetalle.
// ════════════════════════════════════════════════════════════════════════════

import type { RegistroSueno } from "../types/models";

export interface NocheSueno {
  fecha: string;           // "YYYY-MM-DD" de la MAÑANA en que te levantaste
  horasTotal: number;      // noche + siestas: EL número que manda para señales
  horasNoche: number;      // suma de tramos nocturnos (no siesta)
  horasSiesta?: number;    // suma de tramos diurnos (siesta)
  horaAcostarse?: string;  // "HH:MM" inicio del primer tramo nocturno
  horaLevantarse?: string; // "HH:MM" fin del último tramo nocturno
  tramos: number;          // total de tramos de ese día (1 = noche corrida)
}

// ── Helpers de tiempo ─────────────────────────────────────────────────────────

/** Suma N días a una fecha "YYYY-MM-DD". */
function addDays(fecha: string, n: number): string {
  const d = new Date(fecha + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Convierte "HH:MM" a minutos desde medianoche. */
function horaAMin(hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Asigna un tramo de sueño a la fecha de la mañana correspondiente.
 * Regla principal (con inicioMs): tramo pertenece a la noche de D
 * si arranca entre las 15:00 de D−1 y las 14:59 de D.
 * Regla legacy (sin inicioMs): por horaAcostarse.
 */
function asignarNoche(registro: RegistroSueno): string {
  if (registro.inicioMs != null) {
    // Convertir epoch ms a hora local (usamos UTC+0 ya que el epoch fue corregido)
    const d = new Date(registro.inicioMs);
    const h = d.getUTCHours();
    const min = d.getUTCMinutes();
    const horaMin = h * 60 + min;
    const fechaInicioStr = d.toISOString().slice(0, 10); // YYYY-MM-DD del inicio
    // Arranca entre 00:00 y 14:59 → mañana de ese mismo día
    if (horaMin < 15 * 60) return fechaInicioStr;
    // Arranca entre 15:00 y 23:59 → mañana del día siguiente
    return addDays(fechaInicioStr, 1);
  }

  // Legacy: sin inicioMs, usamos horaAcostarse
  const ha = registro.horaAcostarse;
  if (ha) {
    const minutos = horaAMin(ha);
    if (minutos >= 15 * 60) {
      // Acostó ≥ 15:00 → la mañana es el día siguiente al fecha registrado
      return addDays(registro.fecha, 1);
    }
  }
  return registro.fecha;
}

/**
 * Determina si un tramo es siesta (para el desglose visual).
 * Siesta: arranca entre 10:00 y 19:59 Y dura menos de 3 h.
 */
function esSiesta(registro: RegistroSueno): boolean {
  const horas = registro.horas ?? 0;
  if (horas >= 3) return false;
  const hora = registro.horaAcostarse;
  if (!hora) return false;
  const minutos = horaAMin(hora);
  return minutos >= 10 * 60 && minutos < 20 * 60;
}

// ── Función principal ─────────────────────────────────────────────────────────

/**
 * Agrupa los tramos de sueño en noches completas.
 * Cada NocheSueno representa la madrugada hasta la mañana de `fecha`.
 * Ordena descendente por fecha (más reciente primero).
 */
export function consolidarNoches(registros: RegistroSueno[]): NocheSueno[] {
  const conHoras = registros.filter((r) => r.horas != null && r.horas > 0);

  // Agrupar tramos por fecha de mañana
  const porFecha = new Map<string, RegistroSueno[]>();
  for (const r of conHoras) {
    const fecha = asignarNoche(r);
    const arr = porFecha.get(fecha) ?? [];
    arr.push(r);
    porFecha.set(fecha, arr);
  }

  const noches: NocheSueno[] = [];
  for (const [fecha, tramos] of porFecha) {
    let horasNoche = 0;
    let horasSiesta = 0;
    let primerNocturno: RegistroSueno | undefined;
    let ultimoNocturno: RegistroSueno | undefined;

    for (const t of tramos) {
      if (esSiesta(t)) {
        horasSiesta += t.horas ?? 0;
      } else {
        horasNoche += t.horas ?? 0;
        if (!primerNocturno) primerNocturno = t;
        ultimoNocturno = t;
      }
    }

    const horasTotal = horasNoche + horasSiesta;
    if (horasTotal === 0) continue;

    noches.push({
      fecha,
      horasTotal: parseFloat(horasTotal.toFixed(2)),
      horasNoche: parseFloat(horasNoche.toFixed(2)),
      horasSiesta: horasSiesta > 0 ? parseFloat(horasSiesta.toFixed(2)) : undefined,
      horaAcostarse: primerNocturno?.horaAcostarse,
      horaLevantarse: ultimoNocturno?.horaLevantarse,
      tramos: tramos.length,
    });
  }

  return noches.sort((a, b) => b.fecha.localeCompare(a.fecha));
}

/**
 * Promedio de `horasTotal` de las últimas n fechas con dato.
 * Devuelve undefined si hay menos de 3 fechas (mejor sin promedio que uno falso).
 */
export function promedioNoches(noches: NocheSueno[], n: number): number | undefined {
  const chunk = noches.slice(0, n);
  if (chunk.length < 3) return undefined;
  const sum = chunk.reduce((s, n) => s + n.horasTotal, 0);
  return parseFloat((sum / chunk.length).toFixed(1));
}
