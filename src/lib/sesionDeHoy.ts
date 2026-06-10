import type { Programa, Historial } from "../types/models";

/** 0 = Lunes … 6 = Domingo (igual que JS: getDay() con conversión). */
export type DiaSemanaNum = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SesionDeHoyResult =
  | { tipo: "descanso" }
  | { tipo: "rutina"; idRutina: string; etiqueta: string; yaHecha: boolean }
  | { tipo: "sin-programa" }
  | { tipo: "dia-libre" };

const DIA_SEMANA_MAP: Record<string, DiaSemanaNum> = {
  lunes: 0, martes: 1, "miércoles": 2, jueves: 3,
  viernes: 4, sábado: 5, domingo: 6,
};

/**
 * Devuelve qué corresponde hacer HOY según el programa y el día de la semana.
 *
 * - "descanso": el día de hoy está marcado como descanso en el programa.
 * - "rutina": hay una sesión activa planificada para hoy.
 * - "dia-libre": el programa tiene días por semana pero hoy no tiene ninguno.
 * - "sin-programa": el programa no tiene días con `diaSemana` → no se puede resolver por día.
 *
 * Función pura, sin Firestore.
 */
export function sesionDeHoy(
  programa: Programa,
  diaSemanaHoy: DiaSemanaNum,
  historialSemana: Historial[],
): SesionDeHoyResult {
  const conDia = programa.dias.filter((d) => d.diaSemana != null);
  if (conDia.length === 0) return { tipo: "sin-programa" };

  const hoy = conDia.find((d) => DIA_SEMANA_MAP[d.diaSemana!] === diaSemanaHoy);
  if (!hoy) return { tipo: "dia-libre" };
  if (hoy.tipo === "descanso") return { tipo: "descanso" };

  const rid = hoy.idRutina ?? "";
  const yaHecha = rid
    ? historialSemana.some((h) => h.idRutina === rid)
    : false;

  return { tipo: "rutina", idRutina: rid, etiqueta: hoy.etiqueta, yaHecha };
}

/** Convierte `new Date().getDay()` (0=dom, 1=lun…) a `DiaSemanaNum` (0=lun…). */
export function jsDayToNum(jsDay: number): DiaSemanaNum {
  return ((jsDay + 6) % 7) as DiaSemanaNum;
}
