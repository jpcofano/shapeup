// ════════════════════════════════════════════════════════════════════════════
//  lib/adherencia.ts — series de adherencia semanal (P77a).
//
//  Antes de esto la adherencia vivía suelta adentro de Home: `sesHechas`
//  contra `sesObj`, y una racha que contaba SEMANAS CON AL MENOS UNA SESIÓN.
//  Eso mentía en los dos extremos — una semana con una sesión de cuatro
//  mantenía la racha viva, y dos sesiones el mismo día contaban dos.
//
//  Acá la unidad es **el día**, porque es la unidad del plan: el plan dice
//  "cuatro días por semana", no "cuatro sesiones".
//
//  ── ADR #037: la racha se DERIVA, nunca se acumula ────────────────────────
//  Todo lo de este módulo se recalcula del historial cada vez que se muestra.
//  **No se guarda ningún contador en Firestore**, y no hay que agregarlo.
//  Un contador acumulado se desincroniza con la primera corrección de datos, y
//  en este proyecto ya hubo tres: el mapeo del código 1001 (caminatas
//  etiquetadas como HIIT), los fragmentos de sueño sin consolidar, y el
//  corrimiento de 3 h del `start_time` del ZIP. Cualquiera de las tres habría
//  dejado un contador mintiendo para siempre, sin forma de notarlo.
//
//  ── Hora local, sin librería de zona horaria ──────────────────────────────
//  Todo pasa por `ymdLocal` y `lunesDeSemana` de `lib/semana.ts`. La app es de
//  una familia en un solo huso; meter `date-fns-tz` por esto es peso sin
//  beneficio. **Si algún día hay un miembro en otro huso, esto se revisa**: las
//  fronteras de semana se calcularían en el huso de cada miembro y no en el del
//  dispositivo que abre la app.
//
//  ── Simplificación conocida ───────────────────────────────────────────────
//  La serie usa **la meta de hoy para todas las semanas**. Si el mes pasado el
//  plan tenía 3 días y ahora tiene 4, las semanas viejas se miden contra 4.
//  Guardar el historial de metas es otro problema y hoy no tenemos ese dato.
//
//  Núcleo puro (ADR #009): sin Firebase, se testea solo.
// ════════════════════════════════════════════════════════════════════════════

import type { Programa, PerfilMiembro } from "../types/models";
import type { DiaActivo } from "./racha";
import { lunesDeSemana } from "./semana";

export interface SemanaAdherencia {
  semanaInicio: string;      // lunes, "YYYY-MM-DD"
  diasPlan: number;          // días DISTINTOS con sesión ShapeUp
  /**
   * Días DISTINTOS con actividad y sin sesión ShapeUp.
   *
   * **`null` = no se cargaron las actividades de esa semana** (P77b). No es
   * cero: es "no sé". Traer doce semanas de `/cardio` cuesta caro, así que
   * Home carga una sola y Progreso las doce — y un cero por omisión se lee
   * como un hecho, que es justo el bug que venimos persiguiendo.
   */
  diasMovimiento: number | null;
  meta: number;
  cumplida: boolean;         // diasPlan >= meta
  enCurso: boolean;          // es la semana de `hoy`
}

/**
 * Rango de fechas con datos de movimiento cargados, inclusive.
 *
 * Una semana cuenta como cargada solo si entra **entera**: si el rango arranca
 * un miércoles, esa semana queda en `null` y no a medias.
 */
export interface RangoMovimiento {
  desde: string;   // "YYYY-MM-DD"
  hasta: string;   // "YYYY-MM-DD"
}

/**
 * Cuántos días por semana apunta este miembro.
 *
 * El perfil puede pisar al plan (`metaSemanalDias`), para el caso "el plan
 * tiene 6 pero yo apunto a 4". Sin override manda el plan; **sin programa
 * activo no hay meta**, y eso es `null` y no cero: cero sería decir que la meta
 * es no entrenar.
 */
export function metaSemanal(
  programa: Programa | null | undefined,
  perfil?: PerfilMiembro | null,
): number | null {
  const override = perfil?.metaSemanalDias;
  if (typeof override === "number" && Number.isFinite(override) && override > 0) {
    return Math.round(override);
  }
  if (!programa) return null;
  const dias = programa.dias.filter((d) => d.tipo !== "descanso").length;
  return dias > 0 ? dias : null;
}

/** ¿Este día cuenta como movimiento? Hubo actividad, pero no entrenaste en la app. */
function esMovimiento(d: DiaActivo): boolean {
  return !d.shapeUp && (d.externaDeclarada || d.autodetectada);
}

/** El lunes que sigue `n` semanas después de `lunes`. */
function sumarDias(fecha: string, n: number): string {
  const d = new Date(fecha + "T00:00:00");
  d.setDate(d.getDate() + n);
  return lunesDeSemana(d);
}

/** El domingo de la semana que arranca en `lunes`, en hora local. */
function domingoDe(lunes: string): string {
  const d = new Date(lunes + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Una fila por semana, de la más vieja a la más nueva.
 *
 * **Incluye las semanas vacías.** Una semana sin nada es un dato: si se omite,
 * la serie miente por omisión y una racha rota parece continua.
 *
 * **Arranca en la semana del primer día con `shapeUp`**, no antes: las semanas
 * anteriores a que el miembro empezara a entrenar no son incumplimientos. Y
 * llega hasta la semana de `hoy`, aunque esté vacía.
 *
 * `rangoMovimiento` dice de qué fechas se cargaron actividades. Las semanas
 * que caen afuera llevan `diasMovimiento: null` — no se infiere cero (P77b).
 * Sin rango, ninguna semana tiene dato de movimiento.
 *
 * **Nada de esto toca `diasPlan` ni `cumplida`**, que salen solo de las
 * sesiones de la app: la racha, el récord y la tasa dan igual se hayan cargado
 * las actividades o no.
 */
export function seriesDeAdherencia(
  dias: DiaActivo[],
  meta: number,
  hoy: string,
  rangoMovimiento?: RangoMovimiento,
): SemanaAdherencia[] {
  const semanaHoy = lunesDeSemana(hoy);

  const conSesion = dias.filter((d) => d.shapeUp).map((d) => d.fecha).sort();
  if (conSesion.length === 0) return [];
  const primera = lunesDeSemana(conSesion[0]);

  // Agrupar por lunes, contando DÍAS distintos: `dias` ya trae uno por fecha,
  // así que dos sesiones del mismo día llegan acá como una sola.
  const plan = new Map<string, number>();
  const movimiento = new Map<string, number>();
  for (const d of dias) {
    const semana = lunesDeSemana(d.fecha);
    if (semana < primera || semana > semanaHoy) continue;
    if (d.shapeUp)          plan.set(semana, (plan.get(semana) ?? 0) + 1);
    else if (esMovimiento(d)) movimiento.set(semana, (movimiento.get(semana) ?? 0) + 1);
  }

  const cargada = (semana: string): boolean =>
    rangoMovimiento != null
    && semana >= rangoMovimiento.desde
    && domingoDe(semana) <= rangoMovimiento.hasta;

  const filas: SemanaAdherencia[] = [];
  for (let semana = primera; semana <= semanaHoy; semana = sumarDias(semana, 7)) {
    const diasPlan = plan.get(semana) ?? 0;
    filas.push({
      semanaInicio: semana,
      diasPlan,
      diasMovimiento: cargada(semana) ? (movimiento.get(semana) ?? 0) : null,
      meta,
      cumplida: diasPlan >= meta,
      enCurso: semana === semanaHoy,
    });
  }
  return filas;
}

/**
 * Semanas cumplidas consecutivas, contando hacia atrás.
 *
 * **La semana en curso no rompe la racha.** Un miércoles con 1 de 4 no es una
 * semana incumplida: es una semana sin terminar. Se saltea si todavía no llegó
 * a la meta, y se suma si ya llegó.
 */
export function rachaActual(semanas: SemanaAdherencia[]): number {
  let i = semanas.length - 1;
  if (i >= 0 && semanas[i].enCurso && !semanas[i].cumplida) i--;

  let racha = 0;
  for (; i >= 0 && semanas[i].cumplida; i--) racha++;
  return racha;
}

/** La racha más larga de toda la serie, la actual incluida. */
export function rachaRecord(semanas: SemanaAdherencia[]): number {
  let mejor = 0;
  let corriendo = 0;
  for (const s of semanas) {
    // La semana en curso sin cumplir no corta nada: todavía no terminó. Como
    // siempre es la última, alcanza con no contarla.
    if (s.cumplida) { corriendo++; mejor = Math.max(mejor, corriendo); }
    else if (!s.enCurso) corriendo = 0;
  }
  return mejor;
}

/**
 * Cuántas de las últimas `n` semanas **cerradas** se cumplieron.
 *
 * `null` con menos de 4 semanas cerradas: con tres semanas de historia la tasa
 * es ruido con apariencia de métrica ("33 %" sobre 3 semanas no dice nada).
 */
export function tasaCumplimiento(
  semanas: SemanaAdherencia[],
  n = 8,
): { cumplidas: number; total: number } | null {
  const cerradas = semanas.filter((s) => !s.enCurso);
  if (cerradas.length < 4) return null;
  const ventana = cerradas.slice(-n);
  return {
    cumplidas: ventana.filter((s) => s.cumplida).length,
    total: ventana.length,
  };
}

/** La semana de `hoy` dentro de la serie, si está. */
export function semanaEnCurso(semanas: SemanaAdherencia[]): SemanaAdherencia | null {
  return semanas.find((s) => s.enCurso) ?? null;
}
