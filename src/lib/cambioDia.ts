// ════════════════════════════════════════════════════════════════════════════
//  lib/cambioDia.ts — cambiar lo que toca hoy (P102, ADR #030, bloque 11).
//
//  Desde la tarjeta «Hoy toca» se elige otra cosa en lugar de la rutina del
//  día. La sesión guarda la que tocaba (`Historial.rutinaPrevista`) y, si se
//  dijo, por qué (`motivoCambio`). La prevista cubre su día en la semana y no
//  queda trabada: **el plan avanza, sin deuda** (ADR #030).
//
//  Fuera de acá (siguen en el backlog): el aviso a la tercera vez que se
//  esquiva la misma rutina (11.4) y la cobertura del plan (11.3).
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { MotivoCambio, Programa, Rutina } from "../types/models";
import type { CambioDelDia } from "./entrenarState";

/** Los motivos, en el orden en que se ofrecen. Son opcionales. */
export const MOTIVOS_CAMBIO: ReadonlyArray<readonly [MotivoCambio, string]> = [
  ["poco-tiempo", "Poco tiempo"],
  ["cansado",     "Cansado"],
  ["dolor",       "Me duele algo"],
  ["otra-cosa",   "Ganas de otra cosa"],
];

export function motivoCambioLabel(m: MotivoCambio | null | undefined): string | null {
  return MOTIVOS_CAMBIO.find(([id]) => id === m)?.[1] ?? null;
}

/** «En lugar de Creed · Poco tiempo», o `null` si la sesión no fue un cambio. */
export function lineaCambio(
  h: { rutinaPrevista?: string; motivoCambio?: MotivoCambio },
  nombrePrevista: string | null,
): string | null {
  if (!h.rutinaPrevista) return null;
  const motivo = motivoCambioLabel(h.motivoCambio);
  return `En lugar de ${nombrePrevista ?? h.rutinaPrevista}${motivo ? ` · ${motivo}` : ""}`;
}

export type GrupoCambio = "a-medida" | "programa" | "vr" | "libre" | "todas";

export interface OpcionCambio {
  grupo: GrupoCambio;
  /** Ausente en «sesión libre» y «ver todas». */
  idRutina?: string;
  nombre: string;
}

type RutinaCambio = Pick<Rutina, "idRutina" | "nombre" | "vr" | "foco" | "archivada">;

/** El nombre del día del plan sin el prefijo «Lunes — ». */
const sinDia = (etiqueta: string) => etiqueta.replace(/^[^—–]*[—–]\s*/, "");

/**
 * Lo que ofrece la hoja «Cambiar», en este orden: la VR a medida; las otras
 * rutinas del programa activo; las otras rutinas de VR (Combat corto incluida);
 * la sesión libre; y «Ver todas». Nunca la prevista, nunca una repetida, nunca
 * una archivada fuera del programa. El juego que no cuenta no es una rutina:
 * no aparece.
 */
export function opcionesCambio(
  prevista: string,
  programa: Pick<Programa, "dias"> | null,
  rutinas: RutinaCambio[],
): OpcionCambio[] {
  const vistas = new Set<string>([prevista]);
  const out: OpcionCambio[] = [];
  const porId = new Map(rutinas.map((r) => [r.idRutina, r]));
  const agregar = (grupo: GrupoCambio, idRutina: string, nombre: string) => {
    if (vistas.has(idRutina)) return;
    vistas.add(idRutina);
    out.push({ grupo, idRutina, nombre });
  };

  for (const r of rutinas) if (r.vr?.aMedida && !r.archivada) agregar("a-medida", r.idRutina, r.nombre);

  const dias = [...(programa?.dias ?? [])].sort((a, b) => a.orden - b.orden);
  for (const d of dias) {
    if (d.tipo === "descanso" || !d.idRutina) continue;
    agregar("programa", d.idRutina, porId.get(d.idRutina)?.nombre ?? sinDia(d.etiqueta));
  }

  for (const r of rutinas) {
    if (r.archivada) continue;
    if (r.vr || r.foco === "VR") agregar("vr", r.idRutina, r.nombre);
  }

  out.push({ grupo: "libre", nombre: "Sesión libre" });
  out.push({ grupo: "todas", nombre: "Ver todas" });
  return out;
}

/** Lo que viaja de la hoja a la sesión elegida (por el `state` de la navegación). */
export interface EstadoNavegacionCambio {
  cambio: CambioDelDia;
}

/** Lee el cambio del `state` de la navegación, o `null` si no vino o no tiene forma. */
export function cambioDeNavegacion(state: unknown): CambioDelDia | null {
  const c = (state as { cambio?: unknown } | null | undefined)?.cambio as Partial<CambioDelDia> | undefined;
  return normalizarCambio(c?.rutinaPrevista, c?.motivo);
}

function normalizarCambio(prevista: unknown, motivo: unknown): CambioDelDia | null {
  if (typeof prevista !== "string" || prevista === "") return null;
  const m = MOTIVOS_CAMBIO.some(([id]) => id === motivo) ? (motivo as MotivoCambio) : null;
  return { rutinaPrevista: prevista, motivo: m };
}

// ── Por la URL: «Ver todas» (Biblioteca → RutinaDetalle → la sesión) ─────────
//
// Por ese camino hay pantallas en el medio, y el `state` de la navegación no
// sobrevive a ir y volver. La URL sí: `?enLugarDe=RUT-0027&motivo=poco-tiempo`.

export const PARAM_EN_LUGAR_DE = "enLugarDe";
export const PARAM_MOTIVO = "motivo";

/** Los parámetros de la URL para un cambio; `{}` sin cambio. */
export function paramsCambio(c: CambioDelDia | null): Record<string, string> {
  if (!c) return {};
  return { [PARAM_EN_LUGAR_DE]: c.rutinaPrevista, ...(c.motivo ? { [PARAM_MOTIVO]: c.motivo } : {}) };
}

/** `?enLugarDe=…&motivo=…`, o `""` sin cambio: para pegar a una ruta. */
export function busquedaCambio(c: CambioDelDia | null): string {
  const p = new URLSearchParams(paramsCambio(c)).toString();
  return p ? `?${p}` : "";
}

/** Lee el cambio de la URL, o `null`. Un motivo desconocido se descarta. */
export function cambioDeBusqueda(search: string | URLSearchParams): CambioDelDia | null {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  return normalizarCambio(p.get(PARAM_EN_LUGAR_DE), p.get(PARAM_MOTIVO));
}

/** El cambio que llegó a una pantalla: por el `state` (la hoja) o por la URL («Ver todas»). */
export function cambioDeUbicacion(loc: { state?: unknown; search?: string }): CambioDelDia | null {
  return cambioDeNavegacion(loc.state) ?? cambioDeBusqueda(loc.search ?? "");
}
