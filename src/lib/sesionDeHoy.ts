import type { Programa, Historial } from "../types/models";
import { soloShapeUp } from "./tipoHistorial";

/** 0 = Lunes … 6 = Domingo (igual que JS: getDay() con conversión). */
export type DiaSemanaNum = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type SesionDeHoyResult =
  | { tipo: "descanso" }
  | {
      tipo: "rutina"; idRutina: string; etiqueta: string; yaHecha: boolean;
      /**
       * Lo que se hizo hoy en lugar de la rutina del día (P102), para decirlo
       * en una línea. Ausente si se hizo la del día o no se hizo nada.
       */
      enSuLugar?: string;
    }
  | { tipo: "sin-programa" }
  | { tipo: "dia-libre" }
  /**
   * El día de hoy es de entrenamiento pero **no tiene rutina cargada** (P77a).
   * El modelo lo admite: un `DiaPrograma` con `tipo: "vr"` y `vrSugerido` puede
   * no traer `idRutina`. Antes esto devolvía `{ tipo: "rutina", idRutina: "" }`
   * y la app navegaba a `/entrenar/` — una rutina que no existe.
   */
  | { tipo: "dia-sin-rutina"; etiqueta: string };

const DIA_SEMANA_MAP: Record<string, DiaSemanaNum> = {
  lunes: 0, martes: 1, "miércoles": 2, jueves: 3,
  viernes: 4, sábado: 5, domingo: 6,
};

/**
 * Devuelve qué corresponde hacer HOY según el programa y el día de la semana.
 *
 * - "descanso": el día de hoy está marcado como descanso en el programa.
 * - "rutina": hay una sesión activa planificada para hoy.
 * - "dia-sin-rutina": hoy toca entrenar, pero el día no tiene `idRutina` (P77a).
 * - "dia-libre": el programa tiene días por semana pero hoy no tiene ninguno.
 * - "sin-programa": el programa no tiene días con `diaSemana` → no se puede resolver por día.
 *
 * `yaHecha` mira **el día, no la semana** (P102): hay una sesión de ShapeUp con
 * `fechaRealizada === hoyYmd` que hizo la rutina del día, o que se hizo en su
 * lugar (`rutinaPrevista`). Antes miraba toda la semana, y con la misma rutina
 * dos veces (Combat largo lunes y viernes) el viernes ya figuraba hecha.
 *
 * Función pura, sin Firestore.
 */
export function sesionDeHoy(
  programa: Programa,
  diaSemanaHoy: DiaSemanaNum,
  historialSemana: Historial[],
  /** La fecha local de hoy, `YYYY-MM-DD` (`ymdLocal()`): el mismo criterio que `fechaRealizada`. */
  hoyYmd: string,
): SesionDeHoyResult {
  const conDia = programa.dias.filter((d) => d.diaSemana != null);
  if (conDia.length === 0) return { tipo: "sin-programa" };

  const hoy = conDia.find((d) => DIA_SEMANA_MAP[d.diaSemana!] === diaSemanaHoy);
  if (!hoy) return { tipo: "dia-libre" };
  if (hoy.tipo === "descanso") return { tipo: "descanso" };

  // Día de entrenamiento sin rutina cargada: se dice, no se navega a la nada.
  if (!hoy.idRutina) return { tipo: "dia-sin-rutina", etiqueta: hoy.etiqueta };

  const rid = hoy.idRutina;
  // Solo ShapeUp: "ya la hiciste" es haber hecho la rutina del plan en la app (P74).
  const deHoy = soloShapeUp(historialSemana).filter((h) => h.fechaRealizada === hoyYmd);
  const laDelDia = deHoy.some((h) => h.idRutina === rid);
  const enLugar = deHoy.find((h) => h.rutinaPrevista === rid && h.idRutina !== rid);
  const yaHecha = laDelDia || enLugar != null;

  return {
    tipo: "rutina", idRutina: rid, etiqueta: hoy.etiqueta, yaHecha,
    ...(!laDelDia && enLugar ? { enSuLugar: enLugar.nombreRutina } : {}),
  };
}

/** Convierte `new Date().getDay()` (0=dom, 1=lun…) a `DiaSemanaNum` (0=lun…). */
export function jsDayToNum(jsDay: number): DiaSemanaNum {
  return ((jsDay + 6) % 7) as DiaSemanaNum;
}
