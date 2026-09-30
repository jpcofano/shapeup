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


// ════════════════════════════════════════════════════════════════════════════
//  P84b — el otro extremo de la ventana
//
//  P84 dejó `inicioMs` quieto y alargó el fin. En la VR anterior a P80
//  `inicioMs` salía de la primera ronda marcada y llegaba tarde, así que P84 no
//  corrigió la ventana: la corrió entera hacia adelante 10 a 24 min. El extremo
//  confiable era el fin viejo. Acá se revierte: `finMs` = el del respaldo de P84,
//  `inicioMs = finMs − duracionRealMin`. **`duracionRealMin` no se toca** (ADR #042).
//
//  El testigo independiente es el arranque del reloj: si el inicio calculado no
//  cae a 5 min del `startMs` de Samsung, esa sesión no se escribe.
// ════════════════════════════════════════════════════════════════════════════

/** Cuánto puede diferir el inicio calculado del arranque del reloj para confirmar. */
export const TOLERANCIA_RELOJ_MS = 5 * 60_000;

/** Una línea del respaldo que dejó P84 (`docs/auditorias/respaldo-ventanas-*.json`). */
export interface LineaRespaldoP84 {
  idHist: string;
  finMsViejo: number;
  finMsNuevo: number;
  versionEnriquecimientoVieja?: number | null;
}

export interface Reversion {
  idHist: string;
  fecha: string;
  nombreRutina: string;
  /** La ventana que tiene hoy (la que dejó P84, o la que nació corta). */
  ventanaHoy: { inicioMs: number; finMs: number };
  nueva: { inicioMs: number; finMs: number };
  relojInicioMs: number;
  /** inicio calculado − arranque del reloj, en minutos (con signo). */
  difRelojMin: number;
  invalidaBiometria: boolean;
}

export type MotivoNoRevertir =
  | "no-existe" | "estado-distinto" | "sin-duracion" | "sin-tramo" | "reloj-no-confirma" | "pisa-anterior";

export interface NoRevertida {
  idHist: string;
  motivo: MotivoNoRevertir;
  detalle: string;
}

/**
 * Qué revertir. `relojInicio` da, por sesión, el `startMs` de sus tramos de
 * Samsung (vacío o ausente = no hay con qué comparar). `todas` es el historial
 * completo, para la guarda de la sesión anterior del mismo miembro.
 *
 * Cada guarda corta **esa** sesión, no la corrida. No muta la entrada.
 */
export function planificarReversion(
  respaldo: LineaRespaldoP84[],
  todas: SesionConVentana[],
  relojInicio: ReadonlyMap<string, number[]>,
): { reversiones: Reversion[]; noRevertidas: NoRevertida[] } {
  const porId = new Map(todas.map((s) => [s.idHist, s]));
  const candidatas: Reversion[] = [];
  const noRevertidas: NoRevertida[] = [];

  for (const r of respaldo) {
    const s = porId.get(r.idHist);
    if (!s) { noRevertidas.push({ idHist: r.idHist, motivo: "no-existe", detalle: "no está en /historial" }); continue; }
    const base = { idHist: r.idHist };
    if (typeof s.duracionRealMin !== "number" || s.duracionRealMin <= 0) {
      noRevertidas.push({ ...base, motivo: "sin-duracion", detalle: "sin duracionRealMin" });
      continue;
    }
    const durMs = s.duracionRealMin * 60_000;

    // Guarda 1: el estado de hoy es exactamente el que dejó P84.
    const inicioP84 = r.finMsNuevo - durMs;
    if (s.finMs !== r.finMsNuevo || s.inicioMs !== inicioP84) {
      noRevertidas.push({ ...base, motivo: "estado-distinto",
        detalle: `hoy ${s.inicioMs}→${s.finMs}, P84 dejó ${inicioP84}→${r.finMsNuevo}` });
      continue;
    }

    // Guardas 3 y 2: hay tramo del reloj, y el reloj confirma el inicio calculado.
    const c = confirmarConReloj(s, { inicioMs: r.finMsViejo - durMs, finMs: r.finMsViejo }, relojInicio);
    if ("motivo" in c) noRevertidas.push(c); else candidatas.push(c);
  }

  return sinPisarAnterior(candidatas, todas, noRevertidas);
}

const hmUtc = (ms: number) => new Date(ms).toISOString().slice(11, 16) + " UTC";

/**
 * Guardas 3 y 2 de P84b, compartidas con P84c: sin tramo del reloj no hay
 * testigo, y si el inicio calculado no cae a ±5 min del arranque del reloj,
 * esa sesión no se escribe.
 */
function confirmarConReloj(
  s: SesionConVentana,
  nueva: { inicioMs: number; finMs: number },
  relojInicio: ReadonlyMap<string, number[]>,
): Reversion | NoRevertida {
  const arranques = relojInicio.get(s.idHist) ?? [];
  if (arranques.length === 0) {
    return { idHist: s.idHist, motivo: "sin-tramo", detalle: "sin tramo de Samsung con qué comparar" };
  }
  const relojInicioMs = Math.min(...arranques);
  const dif = nueva.inicioMs - relojInicioMs;
  if (Math.abs(dif) > TOLERANCIA_RELOJ_MS) {
    return { idHist: s.idHist, motivo: "reloj-no-confirma",
      detalle: `inicio calculado ${hmUtc(nueva.inicioMs)}, reloj ${hmUtc(relojInicioMs)} (${(dif / 60_000).toFixed(1)} min)` };
  }
  return {
    idHist: s.idHist, fecha: s.fechaRealizada, nombreRutina: s.nombreRutina,
    ventanaHoy: { inicioMs: s.inicioMs!, finMs: s.finMs! }, nueva, relojInicioMs,
    difRelojMin: Math.round((dif / 60_000) * 10) / 10,
    invalidaBiometria: !!s.biometria,
  };
}

/**
 * Guarda 4: la ventana nueva no pisa la sesión anterior del mismo miembro. Si
 * la anterior también se corrige, cuenta su fin NUEVO.
 */
function sinPisarAnterior(
  candidatas: Reversion[],
  todas: SesionConVentana[],
  noRevertidas: NoRevertida[],
): { reversiones: Reversion[]; noRevertidas: NoRevertida[] } {
  const porId = new Map(todas.map((s) => [s.idHist, s]));
  const finNuevo = new Map(candidatas.map((c) => [c.idHist, c.nueva.finMs]));
  const reversiones: Reversion[] = [];
  for (const c of candidatas) {
    const s = porId.get(c.idHist)!;
    const pisada = todas.find((o) => {
      if (o.idHist === c.idHist || o.miembro !== s.miembro || o.inicioMs == null) return false;
      if (o.inicioMs >= s.inicioMs!) return false;                   // solo las anteriores
      const finOtra = finNuevo.get(o.idHist) ?? o.finMs;
      return finOtra != null && finOtra > c.nueva.inicioMs;
    });
    if (pisada) {
      noRevertidas.push({ idHist: c.idHist, motivo: "pisa-anterior",
        detalle: `el inicio nuevo cae antes del fin de ${pisada.idHist}` });
      continue;
    }
    reversiones.push(c);
  }
  reversiones.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { reversiones, noRevertidas };
}

// ════════════════════════════════════════════════════════════════════════════
//  P84c — las que nacieron cortas después de P84
//
//  Hasta P84c la ventana de rutina y de sesión libre salía de las series
//  (`ventanaDeBloques`) y la duración del arranque de la sesión: dos relojes
//  distintos. Las sesiones guardadas después de P84 que violan la invariante
//  se corrigen con la misma regla que P84b —se ancla en el fin, se resta la
//  duración— y las mismas guardas, salvo la 1: acá no hay respaldo de P84 con
//  qué comparar, así que la guarda 1 es **"la ventana mide menos que
//  `duracionRealMin`"** (más allá de la tolerancia de la invariante).
// ════════════════════════════════════════════════════════════════════════════

/** El `Date.now()` con que se armó el id (`H-YYYYMMDD-<ms>`), o `null`. */
export function msDelIdHist(idHist: string): number | null {
  const m = /^H-\d{8}-(\d{12,})$/.exec(idHist);
  return m ? Number(m[1]) : null;
}

/**
 * Qué re-anclar: sesiones de la app guardadas después de `desdeMs` (por el ms
 * de su id), que no estén en `excluir` (las de la reversión de P84b) y cuya
 * ventana mida menos que `duracionRealMin` más allá de `toleranciaMs`.
 * Nueva ventana: `finMs` quieto, `inicioMs = finMs − duracionRealMin`.
 */
export function planificarReanclaje(
  todas: SesionConVentana[],
  relojInicio: ReadonlyMap<string, number[]>,
  desdeMs: number,
  excluir: ReadonlySet<string>,
  toleranciaMs: number,
): { reversiones: Reversion[]; noRevertidas: NoRevertida[] } {
  const candidatas: Reversion[] = [];
  const noRevertidas: NoRevertida[] = [];
  for (const s of todas.filter(seEnriquece)) {
    const creada = msDelIdHist(s.idHist);
    if (creada == null || creada <= desdeMs || excluir.has(s.idHist)) continue;
    if (typeof s.inicioMs !== "number" || typeof s.finMs !== "number") continue;
    if (typeof s.duracionRealMin !== "number" || s.duracionRealMin <= 0) continue;
    const durMs = s.duracionRealMin * 60_000;
    // Guarda 1 (P84c): la ventana mide menos que el cronómetro de la app.
    if (s.finMs - s.inicioMs >= durMs - toleranciaMs) continue;
    const c = confirmarConReloj(s, { inicioMs: s.finMs - durMs, finMs: s.finMs }, relojInicio);
    if ("motivo" in c) noRevertidas.push(c); else candidatas.push(c);
  }
  return sinPisarAnterior(candidatas, todas, noRevertidas);
}

/** Los campos del `update()`. `duracionRealMin` no está, a propósito (ADR #042). */
export function camposDeReversion(r: Reversion): Record<string, number> {
  return r.invalidaBiometria
    ? { inicioMs: r.nueva.inicioMs, finMs: r.nueva.finMs, "biometria.versionEnriquecimiento": 0 }
    : { inicioMs: r.nueva.inicioMs, finMs: r.nueva.finMs };
}

/** Una sesión cuyo inicio no coincide con el arranque del reloj (censo de P84b). */
export interface DesfaseArranque {
  idHist: string;
  fecha: string;
  nombreRutina: string;
  categoria: CategoriaVentana;
  inicioMs: number;
  relojInicioMs: number;
  difMin: number;
}

/**
 * Censo (solo lectura): de las sesiones de la app con tramo de reloj, las que
 * arrancan más de 5 min lejos del reloj. `excluir` = las que ya cubre la
 * reversión.
 */
export function censoArranques(
  todas: SesionConVentana[],
  relojInicio: ReadonlyMap<string, number[]>,
  idsRutinaVR: ReadonlySet<string>,
  excluir: ReadonlySet<string>,
): DesfaseArranque[] {
  const out: DesfaseArranque[] = [];
  for (const s of todas.filter(seEnriquece)) {
    if (excluir.has(s.idHist) || typeof s.inicioMs !== "number") continue;
    const arranques = relojInicio.get(s.idHist) ?? [];
    if (arranques.length === 0) continue;
    const reloj = Math.min(...arranques);
    const dif = s.inicioMs - reloj;
    if (Math.abs(dif) <= TOLERANCIA_RELOJ_MS) continue;
    out.push({
      idHist: s.idHist, fecha: s.fechaRealizada, nombreRutina: s.nombreRutina,
      categoria: esJuego(s) ? "juego" : s.idRutina && idsRutinaVR.has(s.idRutina) ? "vr" : "otra",
      inicioMs: s.inicioMs, relojInicioMs: reloj, difMin: Math.round((dif / 60_000) * 10) / 10,
    });
  }
  return out.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
