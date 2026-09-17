// ════════════════════════════════════════════════════════════════════════════
//  lib/sesionLibre.ts — configuración de la sesión libre en localStorage (P68).
//  El progreso vive en `entrenar:libre:temp` (entrenarState); acá se guarda qué
//  ejercicios la forman, para que una recarga no pierda la lista.
//  Sin Firebase (ADR #009).
// ════════════════════════════════════════════════════════════════════════════

export type EjDefaults = { series: number; reps: number };

export interface ConfigSesionLibre {
  idsEjercicio: string[];
  defaults:     EjDefaults[];
}

export const CLAVE_CONFIG_LIBRE = "entrenar:libre:temp:config";

function esDefaults(x: unknown): x is EjDefaults {
  if (typeof x !== "object" || x === null) return false;
  const d = x as Record<string, unknown>;
  return Number.isFinite(d.series) && Number.isFinite(d.reps);
}

/** Forma válida: al menos un id, ids no vacíos y un default por id. */
export function esConfigValida(x: unknown): x is ConfigSesionLibre {
  if (typeof x !== "object" || x === null) return false;
  const c = x as Record<string, unknown>;
  return Array.isArray(c.idsEjercicio)
    && c.idsEjercicio.length > 0
    && c.idsEjercicio.every((id) => typeof id === "string" && id.length > 0)
    && Array.isArray(c.defaults)
    && c.defaults.length === c.idsEjercicio.length
    && c.defaults.every(esDefaults);
}

/** Config guardada, o `null` si no hay, el JSON está corrupto o la forma no es válida. */
export function cargarConfigLibre(): ConfigSesionLibre | null {
  try {
    const raw = localStorage.getItem(CLAVE_CONFIG_LIBRE);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return esConfigValida(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function guardarConfigLibre(config: ConfigSesionLibre): void {
  try {
    localStorage.setItem(CLAVE_CONFIG_LIBRE, JSON.stringify(config));
  } catch {
    /* ignore quota */
  }
}

export function borrarConfigLibre(): void {
  try { localStorage.removeItem(CLAVE_CONFIG_LIBRE); } catch { /* ignore */ }
}

/** ¿Los ids guardados son exactamente estos, en el mismo orden? */
export function mismosEjercicios(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

export interface Restauracion<E> {
  ejercicios: E[];
  defaults:   EjDefaults[];
  /** Índices (de la config original) cuyo ejercicio ya no existe. */
  quitados:   number[];
}

/** Rearma la lista a partir de la config y los ejercicios encontrados en el catálogo. */
export function restaurarConfig<E>(
  config: ConfigSesionLibre,
  encontrados: ReadonlyMap<string, E>,
): Restauracion<E> {
  const ejercicios: E[] = [];
  const defaults: EjDefaults[] = [];
  const quitados: number[] = [];
  config.idsEjercicio.forEach((id, i) => {
    const ej = encontrados.get(id);
    if (ej === undefined) {
      quitados.push(i);
    } else {
      ejercicios.push(ej);
      defaults.push(config.defaults[i]);
    }
  });
  return { ejercicios, defaults, quitados };
}
