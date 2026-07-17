import type { Historial, MiembroId, Recomendacion, SenalSalud as SenalSaludModel } from "../types/models";
import type { SenalSalud as SenalSaludResumen, EstadoSenal } from "./resumenSalud";
import { CLAVES_SIN_SEMAFORO, senalPeor } from "./resumenSalud";
import { lunesDeSemana } from "./semana";

export const RUTINAS_RECOMENDADAS = {
  z2:      "RUT-0023",
  hiit:    "RUT-0024",
  descarga: "RUT-0025",
  deload:  "PRG-0009",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function semanaInicioDe(fecha: string, arrancaEn: "lunes" | "domingo"): string {
  if (arrancaEn === "lunes") return lunesDeSemana(fecha);
  const d = new Date(fecha + "T00:00:00");
  d.setDate(d.getDate() - d.getDay()); // retrocede al domingo (getDay() === 0)
  return ymd(d);
}

function semanaPrevia(sem: string): string {
  const d = new Date(sem + "T00:00:00");
  d.setDate(d.getDate() - 7);
  return ymd(d);
}

// ── semanasSinDescarga ─────────────────────────────────────────────────────────

/**
 * Semanas consecutivas (anteriores a `hoy`) con ≥ 2 sesiones de fuerza
 * sin ninguna semana liviana (≤ 1 sesión) en el medio.
 * El conteo es hacia atrás desde la semana previa a `hoy`.
 */
export function semanasSinDescarga(
  historial: Historial[],
  hoy: string,
  semanaArrancaEn: "lunes" | "domingo" = "lunes",
): number {
  const esFuerza = (h: Historial) => h.bloques.some((b) => b.modalidad === "Fuerza");

  const porSemana = new Map<string, Historial[]>();
  for (const h of historial) {
    // Usamos fechaRealizada para calcular la semana según la config (puro, no depende de semanaInicio almacenado)
    const sem = semanaInicioDe(h.fechaRealizada, semanaArrancaEn);
    const arr = porSemana.get(sem) ?? [];
    arr.push(h);
    porSemana.set(sem, arr);
  }

  let sem = semanaPrevia(semanaInicioDe(hoy, semanaArrancaEn));
  let count = 0;

  for (;;) {
    const sesiones = porSemana.get(sem) ?? [];
    const fuerzas  = sesiones.filter(esFuerza).length;
    if (fuerzas >= 2) {
      count++;
      sem = semanaPrevia(sem);
    } else {
      break;
    }
  }

  return count;
}

// ── calcularRecomendacion ──────────────────────────────────────────────────────

/**
 * Devuelve la recomendación de mayor severidad para el día `hoy`,
 * o `null` si no aplica ninguna o no hay datos suficientes.
 * Las reglas se evalúan en orden; gana la primera que aplica.
 */
export function calcularRecomendacion(
  senales: SenalSaludResumen[],
  historial: Historial[],
  hoy: string,
  miembro: MiembroId,
): Recomendacion | null {
  const conDatos = senales.filter((s) => s.estado !== "sin-datos");
  if (conDatos.length === 0) return null;

  const por = (c: SenalSaludResumen["clave"]) => senales.find((s) => s.clave === c);

  const sueno = por("sueno");
  const hrv   = por("hrv");
  const fcRep = por("fc-reposo");

  // ── Regla 1: Descanso (importante) — sueño o HRV en alerta ───────────────
  const suenoAlerta = sueno?.estado === "alerta";
  const hrvAlerta   = hrv?.estado   === "alerta";

  if (suenoAlerta || hrvAlerta) {
    const basadoEn: SenalSaludModel[] = [];
    const motivos: string[] = [];
    if (suenoAlerta) { basadoEn.push("sueño"); if (sueno!.motivo) motivos.push(sueno!.motivo); }
    if (hrvAlerta)   { basadoEn.push("hrv");   if (hrv!.motivo)   motivos.push(hrv!.motivo);   }
    const dato = motivos[0]
      ?? (suenoAlerta
        ? `Sueño promedio ${sueno!.valorActual?.toFixed(1) ?? "?"} h`
        : `HRV ${hrv!.valorActual ?? "?"} ms`);
    return {
      idRecom: `REC-${hoy}-descanso`, miembro, fecha: hoy,
      tipo: "Día de descanso", severidad: "importante",
      mensaje: `${dato} — hoy te conviene descansar o hacer la descarga activa`,
      basadoEn,
      accionSugerida: { idRutina: RUTINAS_RECOMENDADAS.descarga },
    };
  }

  // ── Regla 2: Bajar intensidad (sugerencia) — sueño o HRV en atención ─────
  const suenoAtencion = sueno?.estado === "atencion";
  const hrvAtencion   = hrv?.estado   === "atencion";

  if (suenoAtencion || hrvAtencion) {
    const basadoEn: SenalSaludModel[] = [];
    const motivos: string[] = [];
    if (suenoAtencion) { basadoEn.push("sueño"); if (sueno!.motivo) motivos.push(sueno!.motivo); }
    if (hrvAtencion)   { basadoEn.push("hrv");   if (hrv!.motivo)   motivos.push(hrv!.motivo);   }
    const dato = motivos[0] ?? "";
    return {
      idRecom: `REC-${hoy}-bajar`, miembro, fecha: hoy,
      tipo: "Bajar intensidad", severidad: "sugerencia",
      mensaje: dato
        ? `${dato} — si entrenás hoy, bajá la intensidad o hacé la descarga activa`
        : "Señales en atención — si entrenás hoy, bajá la intensidad o hacé la descarga activa",
      basadoEn,
      accionSugerida: {
        idRutina: RUTINAS_RECOMENDADAS.descarga,
        cambio: "Si preferís la sesión planificada, bajá la carga un 20% y evitá llegar al fallo",
      },
    };
  }

  // ── Regla 3: Cardio Z2 (sugerencia) — fc-reposo en atención o alerta ─────
  if (fcRep?.estado === "atencion" || fcRep?.estado === "alerta") {
    const dato = fcRep.motivo ?? `FC reposo ${fcRep.valorActual ?? "?"} bpm`;
    return {
      idRecom: `REC-${hoy}-z2`, miembro, fecha: hoy,
      tipo: "Sumar cardio Z2", severidad: "sugerencia",
      mensaje: `${dato} — sumar una sesión de cardio suave (Z2) puede ayudar a recuperar`,
      basadoEn: ["fc-reposo"],
      accionSugerida: { idRutina: RUTINAS_RECOMENDADAS.z2 },
    };
  }

  // ── Regla 4: Deload (sugerencia) — 4+ semanas sin descarga ───────────────
  const semanas = semanasSinDescarga(historial, hoy);
  if (semanas >= 4) {
    return {
      idRecom: `REC-${hoy}-deload`, miembro, fecha: hoy,
      tipo: "Deload", severidad: "sugerencia",
      mensaje: `${semanas} semanas corridas de entrenamiento intenso — esta semana te conviene hacer un deload`,
      basadoEn: ["rpe-sesiones"],
      accionSugerida: { idPrograma: RUTINAS_RECOMENDADAS.deload },
    };
  }

  // ── Regla 5: Felicitación (info) — todas ok + ≥ 2 sesiones en 7 días ────
  const todasOk = conDatos.every((s) => s.estado === "ok");
  if (todasOk) {
    const d = new Date(hoy + "T12:00:00");
    d.setDate(d.getDate() - 7);
    const desde = d.toISOString().slice(0, 10);
    const recientes = historial.filter((h) => h.fechaRealizada >= desde && h.fechaRealizada <= hoy);
    if (recientes.length >= 2) {
      return {
        idRecom: `REC-${hoy}-hiit`, miembro, fecha: hoy,
        tipo: "Felicitación", severidad: "info",
        mensaje: "Todas tus señales están en verde y venís entrenando — buena recuperación. Si querés, hoy es un buen día para intensidad",
        basadoEn: ["adherencia"],
        accionSugerida: { idRutina: RUTINAS_RECOMENDADAS.hiit },
      };
    }
  }

  return null;
}

// ── seleccionarEstadoDiario ──────────────────────────────────────────────────

const NOMBRE_CORTO_SENAL: Partial<Record<SenalSaludResumen["clave"], string>> = {
  "fc-reposo": "FC reposo", "hrv": "HRV", "pasos": "pasos", "sueno": "sueño",
};

export type EstadoDiario =
  | { tipo: "nada" }
  | { tipo: "tarjeta" }
  | { tipo: "linea"; texto: string; severidad: Exclude<EstadoSenal, "sin-datos"> };

/**
 * Decide qué mostrar en la línea de estado diario de Home (P64): visibilidad
 * del motor de recomendaciones incluso cuando no hay nada que decir. Nunca
 * compite con la tarjeta de recomendación — si hay tarjeta, gana ella.
 */
export function seleccionarEstadoDiario(
  senales: SenalSaludResumen[],
  hayTarjeta: boolean,
): EstadoDiario {
  // Solo señales accionables (con semáforo) y con valor calculable — igual
  // criterio que el badge de la tab Resumen (fuente única: CLAVES_SIN_SEMAFORO).
  const calculables = senales.filter(
    (s) => s.valorActual != null && !CLAVES_SIN_SEMAFORO.has(s.clave),
  );
  if (calculables.length === 0) return { tipo: "nada" };
  if (hayTarjeta) return { tipo: "tarjeta" };

  const peor = senalPeor(calculables);
  if (peor === "ok" || peor === "sin-datos") {
    return { tipo: "linea", texto: "Señales de salud en verde", severidad: "ok" };
  }

  const enPeorEstado = calculables.filter((s) => s.estado === peor);
  const nombres = enPeorEstado.map((s) => NOMBRE_CORTO_SENAL[s.clave] ?? s.clave).join(", ");
  const sustantivo = enPeorEstado.length > 1 ? "señales" : "señal";
  const palabra = peor === "alerta" ? "alerta" : "atención";
  return {
    tipo: "linea",
    texto: `${enPeorEstado.length} ${sustantivo} en ${palabra}: ${nombres}`,
    severidad: peor,
  };
}
