// ════════════════════════════════════════════════════════════════════════════
//  lib/ventanasViejas.ts — núcleo puro de scripts/corregir-ventanas-vr.ts (P84).
//
//  Las sesiones de VR anteriores a P80 tienen la ventana (`inicioMs`/`finMs`)
//  derivada de las rondas marcadas: empieza en la primera y termina en la
//  última, y mide entre 10 y 24 minutos menos que `duracionRealMin`. Con la
//  ventana corta la sesión se lee como incompleta (ADR #040) y la progresión de
//  VR queda clavada en `mantener`.
//
//  **Manda el tiempo de la app** (ADR #042 aplicado hacia atrás):
//  `finMs = inicioMs + duracionRealMin`. `inicioMs` no se toca — es el arranque
//  sellado. Se elige el mejor de dos registros de la app, no se inventa uno.
//
//  La biometría calculada con la ventana vieja queda mal, pero acá no hay curva
//  para recalcularla: se le pone `versionEnriquecimiento: 0` para que la próxima
//  sincronización la rehaga (ADR #038), y el resto se deja como está — si la
//  sincronización no corre, un dato viejo es mejor que ninguno.
// ════════════════════════════════════════════════════════════════════════════
import type { Historial } from "../types/models";
import { seEnriquece, esJuego } from "./tipoHistorial";

/** Holgura antes de considerar corta una ventana. */
export const TOLERANCIA_VENTANA_MS = 2 * 60_000;

export type SesionConVentana = Pick<
  Historial,
  "idHist" | "miembro" | "fechaRealizada" | "nombreRutina" | "idRutina" | "tipo"
  | "inicioMs" | "finMs" | "duracionRealMin" | "biometria"
>;

/**
 * `"vr"` y `"juego"` son lo esperado. `"otra"` (fuerza, libre, lo que sea) no
 * debería aparecer: si aparece es otro problema, y el reporte lo dice aparte.
 */
export type CategoriaVentana = "vr" | "juego" | "otra";

export interface CorreccionVentana {
  idHist: string;
  miembro: string;
  fecha: string;
  nombreRutina: string;
  categoria: CategoriaVentana;
  viejaMin: number;
  nuevaMin: number;
  ganaMin: number;
  nuevoFinMs: number;
  /** La ventana nueva se habría comido el arranque de la sesión siguiente. */
  recortada: boolean;
  /** Tiene biometría: se le baja la versión para que se rehaga. */
  invalidaBiometria: boolean;
}

export interface SesionOmitida {
  idHist: string;
  fecha: string;
  nombreRutina: string;
  motivo: "sin-inicio" | "sin-fin" | "sin-duracion" | "recorte-no-gana";
}

export interface PlanCorreccion {
  correcciones: CorreccionVentana[];
  /** Las que cumplirían el criterio pero no se pueden corregir, con el motivo. */
  omitidas: SesionOmitida[];
}

const minutos = (ms: number) => Math.round((ms / 60_000) * 10) / 10;

/**
 * Qué sesiones corregir y a qué `finMs`. `idsRutinaVR` son las rutinas de VR
 * (las que `esRutinaVR` reconoce), para clasificar el reporte.
 *
 * No muta la entrada. Solo mira lo hecho en la app (`seEnriquece`): una
 * externa no tiene ventana de la app que corregir.
 */
export function planificarCorrecciones(
  sesiones: SesionConVentana[],
  idsRutinaVR: ReadonlySet<string>,
): PlanCorreccion {
  const correcciones: CorreccionVentana[] = [];
  const omitidas: SesionOmitida[] = [];

  const propias = sesiones.filter(seEnriquece);

  // Arranques por miembro, ordenados, para la guarda de la sesión siguiente.
  const arranques = new Map<string, number[]>();
  for (const s of propias) {
    if (typeof s.inicioMs !== "number") continue;
    const lista = arranques.get(s.miembro) ?? [];
    lista.push(s.inicioMs);
    arranques.set(s.miembro, lista);
  }
  for (const lista of arranques.values()) lista.sort((a, b) => a - b);

  for (const s of propias) {
    const base = { idHist: s.idHist, fecha: s.fechaRealizada, nombreRutina: s.nombreRutina };
    if (typeof s.inicioMs !== "number") { omitidas.push({ ...base, motivo: "sin-inicio" }); continue; }
    if (typeof s.duracionRealMin !== "number" || s.duracionRealMin <= 0) {
      omitidas.push({ ...base, motivo: "sin-duracion" });
      continue;
    }
    if (typeof s.finMs !== "number") { omitidas.push({ ...base, motivo: "sin-fin" }); continue; }

    const duracionMs = s.duracionRealMin * 60_000;
    const viejaMs = s.finMs - s.inicioMs;
    if (viejaMs >= duracionMs - TOLERANCIA_VENTANA_MS) continue; // está bien

    let nuevoFinMs = s.inicioMs + duracionMs;
    let recortada = false;
    const siguiente = arranques.get(s.miembro)?.find((t) => t > s.inicioMs!);
    if (siguiente !== undefined && nuevoFinMs > siguiente) {
      nuevoFinMs = siguiente;
      recortada = true;
    }
    if (nuevoFinMs <= s.finMs) {
      // El recorte la dejó igual o más corta: no hay nada que ganar.
      omitidas.push({ ...base, motivo: "recorte-no-gana" });
      continue;
    }

    const categoria: CategoriaVentana = esJuego(s)
      ? "juego"
      : s.idRutina && idsRutinaVR.has(s.idRutina) ? "vr" : "otra";

    correcciones.push({
      ...base,
      miembro: s.miembro,
      categoria,
      viejaMin: minutos(viejaMs),
      nuevaMin: minutos(nuevoFinMs - s.inicioMs),
      ganaMin: minutos(nuevoFinMs - s.finMs),
      nuevoFinMs,
      recortada,
      invalidaBiometria: !!s.biometria,
    });
  }

  correcciones.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { correcciones, omitidas };
}

/**
 * Los campos del `update()`. Con notación de punto para la biometría: solo se
 * toca la versión, el resto del objeto queda intacto.
 */
export function camposDeActualizacion(c: CorreccionVentana): Record<string, number> {
  return c.invalidaBiometria
    ? { finMs: c.nuevoFinMs, "biometria.versionEnriquecimiento": 0 }
    : { finMs: c.nuevoFinMs };
}

