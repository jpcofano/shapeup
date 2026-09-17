// ════════════════════════════════════════════════════════════════════════════
//  lib/pendientes.ts — sesiones guardadas en el teléfono que todavía no
//  confirmó el servidor (P69). Persistencia en localStorage; sin Firebase
//  (ADR #009). El reenvío vive en data/historial.ts.
//
//  Cada cambio dispara el evento `sync:pendientes` en `window`, para que la
//  UI (chip de Home) se actualice cuando una confirmación llega tarde.
// ════════════════════════════════════════════════════════════════════════════

import type { Historial } from "../types/models";

/** Historial tal como se escribe, sin el `serverTimestamp()` (no es serializable). */
export type PayloadHistorial = Omit<Historial, "fechaRealizadaTimestamp">;

/** Merge de la `SesionProgramada` al registrar. */
export interface PayloadSesion {
  miembro:   string;
  estado:    "Registrada";
  rpeSesion: number | null;
}

export interface SesionPendiente {
  idHist:       string;
  idSesion:     string;
  nombreRutina: string;
  fecha:        string;
  creadoMs:     number;
  error?:       string;
  historial:    PayloadHistorial;
  /** `null` si la sesión no tiene documento en /sesiones (sesión libre). */
  sesion:       PayloadSesion | null;
}

export const CLAVE_PENDIENTES = "sync:pendientes";
export const EVENTO_PENDIENTES = "sync:pendientes";

function esPendiente(x: unknown): x is SesionPendiente {
  if (typeof x !== "object" || x === null) return false;
  const p = x as Record<string, unknown>;
  return typeof p.idHist === "string"
    && typeof p.idSesion === "string"
    && typeof p.creadoMs === "number"
    && typeof p.historial === "object" && p.historial !== null;
}

/** Lista guardada. JSON corrupto o forma inválida cuenta como lista vacía. */
export function listarPendientes(): SesionPendiente[] {
  try {
    const raw = localStorage.getItem(CLAVE_PENDIENTES);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(esPendiente) : [];
  } catch {
    return [];
  }
}

function guardar(lista: SesionPendiente[]): void {
  try {
    if (lista.length === 0) localStorage.removeItem(CLAVE_PENDIENTES);
    else localStorage.setItem(CLAVE_PENDIENTES, JSON.stringify(lista));
  } catch {
    /* ignore quota */
  }
  try {
    window.dispatchEvent(new Event(EVENTO_PENDIENTES));
  } catch {
    /* sin window (tests de node) */
  }
}

/** Agrega una pendiente. Si ya había una con el mismo `idHist`, la reemplaza. */
export function agregarPendiente(p: SesionPendiente): void {
  guardar([...listarPendientes().filter((x) => x.idHist !== p.idHist), p]);
}

export function quitarPendiente(idHist: string): void {
  const lista = listarPendientes();
  const resto = lista.filter((x) => x.idHist !== idHist);
  if (resto.length !== lista.length) guardar(resto);
}

export function marcarErrorPendiente(idHist: string, error: string): void {
  const lista = listarPendientes();
  if (!lista.some((x) => x.idHist === idHist)) return;
  guardar(lista.map((x) => (x.idHist === idHist ? { ...x, error } : x)));
}
