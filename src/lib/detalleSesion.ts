// ════════════════════════════════════════════════════════════════════════════
//  lib/detalleSesion.ts — los textos del detalle de una sesión (P109).
//
//  Lo que la pantalla escribe y no es un dato: el sobretítulo («VR ·
//  PowerBeatsVR»), el nombre sin lo que ya dice el sobretítulo, la línea de la
//  fecha («Sáb 27/09 · 16:09 · 49 min»), la zona dominante de un ejercicio y
//  las horas de sueño en «6 h 30». Sin cambios de datos: todo sale de lo que la
//  sesión ya guarda.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { BloqueRegistro, Historial, ZonaFC } from "../types/models";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

/** El bloque de VR de la sesión, si lo hay: el del escalón, el que guardó con qué se jugó, o el «(VR)». */
function bloqueVR(h: Historial): BloqueRegistro | undefined {
  return h.bloques?.find((b) =>
    (h.vr && b.idEjercicio === h.vr.idEjercicio) || b.prescripcionUsada != null || /\(VR\)\s*$/.test(b.nombreEjercicio));
}

/** El nombre de un ejercicio sin el «(VR)» del final, que el sobretítulo ya dice. */
export const sinVR = (n: string) => n.replace(/\s*\(VR\)\s*$/, "");

/**
 * El sobretítulo y el nombre grande. El sobretítulo dice el tipo y, si se
 * sabe, el juego; el nombre deja afuera lo que el sobretítulo ya dice (el
 * «VR — » del principio y el juego entre paréntesis del final).
 */
export function tituloSesion(h: Historial): { sobre: string; nombre: string } {
  const nombre0 = h.nombreRutina ?? "Sesión";
  if (h.tipo === "juego") return { sobre: "Juego", nombre: h.nombreJuego ?? nombre0 };
  if (h.tipo === "libre") return { sobre: "Sesión libre", nombre: nombre0 };
  const vr = bloqueVR(h);
  if (vr) {
    const juego = sinVR(vr.nombreEjercicio);
    let nombre = nombre0.replace(/^VR\s*[—–-]\s*/, "");
    const paren = nombre.match(/\s*\(([^)]*)\)\s*$/);
    if (paren && paren[1].trim().toLowerCase() === juego.toLowerCase()) nombre = nombre.slice(0, paren.index);
    return { sobre: `VR · ${juego}`, nombre: nombre.trim() || nombre0 };
  }
  const modalidad = h.bloques?.[0]?.modalidad;
  return { sobre: modalidad ?? "Sesión", nombre: nombre0 };
}

/** «Sáb 27/09 · 16:09 · 49 min»: el día y la hora en hora local; sin hora ni duración, lo que haya. */
export function lineaFecha(h: Historial): string {
  const [y, m, d] = h.fechaRealizada.split("-").map(Number);
  const dia = DIAS[new Date(y, m - 1, d).getDay()];
  const partes = [`${dia} ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`];
  if (h.inicioMs != null) {
    const t = new Date(h.inicioMs);
    partes.push(`${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
  }
  if (h.duracionRealMin != null) partes.push(`${h.duracionRealMin} min`);
  return partes.join(" · ");
}

/** La zona donde más tiempo pasó un ejercicio (`minutosPorZona`); null si no hay. Con empate, la más alta. */
export function zonaDominante(b: Pick<BloqueRegistro, "minutosPorZona">): ZonaFC | null {
  let mejor: ZonaFC | null = null;
  for (const z of ["Z1", "Z2", "Z3", "Z4", "Z5"] as ZonaFC[]) {
    const min = b.minutosPorZona?.[z] ?? 0;
    if (min > 0 && (mejor == null || min >= (b.minutosPorZona?.[mejor] ?? 0))) mejor = z;
  }
  return mejor;
}

/** «6 h 30» (horas y minutos). */
export function horasYMinutos(horas: number): string {
  const total = Math.round(horas * 60);
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, "0")}`;
}

/** Los minutos de un ejercicio, de su primera serie a la última; null sin horas selladas. */
export function minutosDelBloque(b: BloqueRegistro): number | null {
  const ini = b.series.map((s) => s.inicioMs).filter((x): x is number => x != null);
  const fin = b.series.map((s) => s.finMs).filter((x): x is number => x != null);
  if (ini.length === 0 || fin.length === 0) return null;
  return Math.max(0, Math.round((Math.max(...fin) - Math.min(...ini)) / 60_000));
}
