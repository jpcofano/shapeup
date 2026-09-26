// ════════════════════════════════════════════════════════════════════════════
//  lib/sincronizacionAutomatica.ts — cuándo sincronizar el puente solo (P85).
//
//  El puente sube a /ingesta-sdk cada 6 h; lo que faltaba era el último metro:
//  que entre a ShapeUp sin apretar "Sincronizar ahora". Leer /ingesta-sdk es la
//  consulta más cara que tenemos (trae la subcolección entera), así que antes se
//  pregunta barato: `/estado/puente.ultimaCorridaMs`, un documento. Si el
//  puente no corrió desde la última corrida que ya importamos, no se lee nada
//  más.
//
//  Las marcas viven en `localStorage`, por uid. Son una caché, no una fuente: si
//  se pierden, lo peor que pasa es una sincronización de más, que es
//  idempotente. Nunca se escribe en /ingesta-sdk.
//
//  Puro: sin React ni Firebase (ADR #009). El almacenamiento se inyecta.
// ════════════════════════════════════════════════════════════════════════════

/** Mínimo entre dos sincronizaciones automáticas, aunque el puente corra de nuevo. */
import type { UltimaImportacion } from "./estadoPuente";

export const MIN_ENTRE_SYNC_MS = 6 * 60 * 60 * 1000;

/** Techo de la sincronización automática entera. Cada escritura ya tiene sus 8 s (P69). */
export const TIMEOUT_SYNC_AUTO_MS = 60_000;

export interface EntradaDecision {
  /** `/estado/puente.ultimaCorridaMs`. Ausente = el puente nunca corrió. */
  ultimaCorridaPuenteMs?: number | null;
  /** La corrida del puente que ya importamos. Ausente = primera vez en esta máquina. */
  ultimaImportadaMs?: number | null;
  /** Cuándo fue la última sincronización automática que terminó bien. */
  ultimaAutoMs?: number | null;
  ahora: number;
  online: boolean;
}

/**
 * ¿Hace falta leer `/estado/puente`? Las condiciones que no dependen del
 * puente se miran primero: si no hay señal o sincronizamos hace menos de 6 h,
 * ni siquiera se pregunta — cero lecturas.
 */
export function puedeConsultarPuente(e: Pick<EntradaDecision, "ultimaAutoMs" | "ahora" | "online">): boolean {
  if (!e.online) return false;
  if (e.ultimaAutoMs != null && e.ahora - e.ultimaAutoMs < MIN_ENTRE_SYNC_MS) return false;
  return true;
}

/** ¿Corresponde sincronizar? Todas las condiciones a la vez. */
export function debeSincronizar(e: EntradaDecision): boolean {
  if (!puedeConsultarPuente(e)) return false;
  if (e.ultimaCorridaPuenteMs == null) return false;           // el puente nunca corrió
  if (e.ultimaImportadaMs != null && e.ultimaCorridaPuenteMs <= e.ultimaImportadaMs) return false;
  return true;
}

// ── Marcas en localStorage ───────────────────────────────────────────────────

export interface MarcasSync {
  /** `ultimaCorridaMs` del puente que ya se importó (auto o a mano). */
  ultimaImportadaMs?: number;
  /** Última sincronización automática que terminó bien. */
  ultimaAutoMs?: number;
  /**
   * Los uuid de actividades que traía la última sincronización. Sirven para
   * decir cuántas son **nuevas**: el puente reescribe una ventana de 14 días,
   * y `escritos.cardio` cuenta todas las reescritas, no las que no estaban.
   * Se guarda solo el último lote: la ventana se corre y lo viejo no vuelve.
   */
  uuidsConocidos?: string[];
  /**
   * La última vez que la app importó lo del puente, a mano o sola (P88). Es lo
   * que la tarjeta del puente muestra como "a la app", separado de lo que subió
   * el reloj. Por dispositivo, como el resto de las marcas.
   */
  ultimaImportacion?: UltimaImportacion;
  /**
   * Cuándo terminó la última sesión guardada en este dispositivo (P89). Si el
   * puente corrió antes que eso, falta algo: la automática le pide una corrida
   * antes de importar. Local para no sumar lecturas.
   */
  ultimaSesionFinMs?: number;
}

export interface Almacen {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

export const claveMarcas = (uid: string) => `sync-puente-${uid}`;

/** Nunca tira: un `localStorage` bloqueado o un JSON roto se leen como "sin marcas". */
export function leerMarcas(almacen: Almacen | null | undefined, uid: string): MarcasSync {
  try {
    const crudo = almacen?.getItem(claveMarcas(uid));
    if (!crudo) return {};
    const m = JSON.parse(crudo) as MarcasSync;
    return m && typeof m === "object" ? m : {};
  } catch {
    return {};
  }
}

/** Mezcla con lo que había. Si no se puede escribir, se pierde la caché y nada más. */
export function guardarMarcas(almacen: Almacen | null | undefined, uid: string, cambios: MarcasSync): void {
  try {
    const previas = leerMarcas(almacen, uid);
    almacen?.setItem(claveMarcas(uid), JSON.stringify({ ...previas, ...cambios }));
  } catch {
    /* sin caché: la próxima carga sincroniza de más, que es idempotente */
  }
}

/**
 * Cuántas actividades del lote no estaban en el anterior. `null` si no hay lote
 * anterior en esta máquina: no se sabe, y decir "87 nuevas" sería mentir.
 */
export function contarNuevas(uuids: string[], conocidos: string[] | undefined): number | null {
  if (!conocidos) return null;
  const vistos = new Set(conocidos);
  return new Set(uuids.filter((u) => !vistos.has(u))).size;
}

// ── Lo que dice el chip ──────────────────────────────────────────────────────

export type EstadoSincronizacion =
  | { fase: "inactiva" }
  | { fase: "corriendo" }
  | { fase: "lista"; nuevas: number | null; conBiometria: number }
  | { fase: "fallo"; motivo: "cuota" | "timeout" | "error"; detalle?: string };

/**
 * El texto del chip de Home, o `null` si no hay nada que decir. Sin nada nuevo
 * el silencio es la respuesta correcta.
 */
export function textoChipSincronizacion(e: EstadoSincronizacion): string | null {
  switch (e.fase) {
    case "inactiva": return null;
    case "corriendo": return "Sincronizando salud…";
    case "fallo": return "No se pudo sincronizar — probá desde Salud";
    case "lista": {
      const partes: string[] = [];
      if (e.nuevas != null && e.nuevas > 0) {
        partes.push(`${e.nuevas} ${e.nuevas === 1 ? "actividad nueva" : "actividades nuevas"}`);
      }
      if (e.conBiometria > 0) {
        partes.push(`${e.conBiometria} ${e.conBiometria === 1 ? "sesión" : "sesiones"} con biometría`);
      }
      return partes.length > 0 ? `Salud al día · ${partes.join(" · ")}` : null;
    }
  }
}
