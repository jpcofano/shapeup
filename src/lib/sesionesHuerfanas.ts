// ════════════════════════════════════════════════════════════════════════════
//  lib/sesionesHuerfanas.ts — ids de sesión y criterio del barrido (P69).
//  Sin Firebase (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

/** Una SesionProgramada abierta hace más de esto, y no abierta en este teléfono, es huérfana. */
export const UMBRAL_HUERFANA_MS = 24 * 60 * 60 * 1000;

const PREFIJO_ESTADO = "entrenar:";

/**
 * Id de SesionProgramada: `SES-<AAAAMMDDhhmmss>-<sufijo>`. El sufijo aleatorio
 * evita el choque de dos sesiones creadas en el mismo segundo.
 */
export function generarIdSesion(
  ahora: Date = new Date(),
  aleatorio: () => number = Math.random,
): string {
  const ts = ahora.toISOString().replace(/[-:T.]/g, "").slice(0, 14);
  const sufijo = Math.floor(aleatorio() * 36 ** 6).toString(36).padStart(6, "0");
  return `SES-${ts}-${sufijo}`;
}

type StorageLectura = Pick<Storage, "length" | "key" | "getItem">;

/**
 * `idSesion` de todos los estados de sesión guardados en este teléfono
 * (claves `entrenar:*`). Ignora otras claves, JSON inválido y estados sin id.
 */
export function idsSesionLocales(storage: StorageLectura): Set<string> {
  const ids = new Set<string>();
  for (let i = 0; i < storage.length; i++) {
    const clave = storage.key(i);
    if (!clave || !clave.startsWith(PREFIJO_ESTADO)) continue;
    try {
      const valor: unknown = JSON.parse(storage.getItem(clave) ?? "");
      if (typeof valor !== "object" || valor === null) continue;
      const id = (valor as Record<string, unknown>).idSesion;
      if (typeof id === "string" && id.length > 0) ids.add(id);
    } catch {
      /* JSON inválido: se ignora */
    }
  }
  return ids;
}

/**
 * ¿Se borra? Solo si se programó hace más de 24 h y no está abierta en este
 * teléfono. Sin fecha conocida, no se borra.
 */
export function esSesionHuerfana(
  sesion: { idSesion: string; fechaProgramacionMs: number | null },
  idsLocales: ReadonlySet<string>,
  ahoraMs: number,
): boolean {
  if (sesion.fechaProgramacionMs == null) return false;
  if (idsLocales.has(sesion.idSesion)) return false;
  return ahoraMs - sesion.fechaProgramacionMs > UMBRAL_HUERFANA_MS;
}
