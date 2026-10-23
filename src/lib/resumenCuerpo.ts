// ════════════════════════════════════════════════════════════════════════════
//  lib/resumenCuerpo.ts — lo que muestra Salud → Resumen (P109).
//
//  Referencia: docs/prompts/109-diseno/ResumenFinal.html. Dos piezas:
//   - el sueño de anoche: la última noche consolidada (`consolidarNoches`,
//     fuente única), «Tu promedio» con la ventana de `resumenSalud` (la línea
//     de base de los días 8 a 35; sin ella, el promedio de las últimas 7) y
//     las 7 noches para las barras;
//   - las tarjetas de «Tu cuerpo»: peso, grasa, presión y oxígeno en sangre,
//     cada una con su valor, 14 días de serie, el cambio contra la referencia
//     que ya existe y hace cuánto es el dato. La presión y el SpO2 siguen sin
//     semáforo (P56): el cambio va como número, sin juicio.
//
//  Sin cambios de datos. Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { MedicionCorporal, RegistroSueno } from "../types/models";
import { consolidarNoches, promedioNoches, type NocheSueno } from "./sueno";
import { textoHace, type SenalSalud } from "./resumenSalud";
import { horasYMinutos } from "./detalleSesion";

const INICIAL = ["D", "L", "M", "M", "J", "V", "S"];
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

/** «Jueves 22 de octubre», en hora local: la fecha de arriba del título de Salud. */
export function fechaEncabezado(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export interface SuenoResumen {
  /** La última noche con dato. */
  noche: NocheSueno;
  /** Si esa noche es la de hoy (la que terminó esta mañana). */
  esAnoche: boolean;
  /** «Tu promedio», en horas; null si no hay con qué. */
  promedio: number | null;
  /** Los 7 días de calendario que terminan en la última noche, del más viejo al último,
   *  con la inicial del día; una noche sin dato va con `horas: null` (barra vacía). */
  noches: { fecha: string; horas: number | null; inicial: string }[];
}

/** El sueño de anoche y las 7 noches. Sin sueño, null. */
export function suenoParaResumen(sueno: RegistroSueno[], hoy: string, senalSueno?: SenalSalud): SuenoResumen | null {
  const noches = consolidarNoches(sueno);
  if (noches.length === 0) return null;
  const noche = noches[0];
  const promedio = senalSueno?.baseline ?? promedioNoches(noches, 7) ?? null;
  const porFecha = new Map(noches.map((n) => [n.fecha, n.horasTotal]));
  const [y, m, d] = noche.fecha.split("-").map(Number);
  const ultimas = Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(y, m - 1, d - 6 + i);
    const fecha = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;
    return { fecha, horas: porFecha.get(fecha) ?? null, inicial: INICIAL[dia.getDay()] };
  });
  return { noche, esAnoche: noche.fecha === hoy, promedio, noches: ultimas };
}

/** «6 h 54» y «min» por separado, para el número grande y su unidad. */
export function partesSueno(horas: number): { valor: string; unidad: string } {
  return { valor: horasYMinutos(horas), unidad: "min" };
}

export interface TarjetaCuerpo {
  clave: "peso" | "grasa" | "presion" | "spo2" | "hrv" | "pasos";
  titulo: string;
  valor: string;
  unidad: string;
  /** La serie de los últimos 14 días, de la más vieja a la última. */
  serie: number[];
  /** El cambio contra la referencia, ya en texto («−0,6 kg»); null si no hay referencia. */
  cambio: string | null;
  /** Hace cuánto es el dato («hoy», «hace 3 días · se actualiza con el ZIP»). */
  cuando: string | null;
}

const num = (n: number, dec = 1) => n.toFixed(dec).replace(".", ",").replace(/,0$/, "");
const conSigno = (n: number, dec = 1) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${num(Math.abs(n), dec)}`;

/**
 * Las tarjetas de «Tu cuerpo», en este orden: peso, grasa corporal, presión,
 * oxígeno en sangre (y, si hay datos, HRV y pasos, que hoy no llegan). Las que
 * no tienen dato no van. La FC de reposo no va (P106).
 */
export function tarjetasCuerpo(senales: SenalSalud[], mediciones: MedicionCorporal[], hoy: string): TarjetaCuerpo[] {
  const por = (c: SenalSalud["clave"]) => senales.find((s) => s.clave === c && s.valorActual != null);
  const out: TarjetaCuerpo[] = [];

  const peso = por("peso");
  if (peso) {
    const fechaPeso = [...mediciones].filter((m) => m.pesoKg != null).sort((a, b) => b.fecha.localeCompare(a.fecha))[0]?.fecha;
    out.push({
      clave: "peso", titulo: "Peso", valor: num(peso.valorActual!), unidad: "kg",
      serie: peso.serie14d.map((p) => p.valor),
      cambio: peso.baseline != null ? `${conSigno(peso.valorActual! - peso.baseline)} kg` : null,
      cuando: fechaPeso ? textoHace(fechaPeso, hoy) : null,
    });
  }

  // La grasa, de las mediciones, con la misma fuente y la misma comparación que Composición:
  // la última medición con grasa contra la anterior.
  const conGrasa = mediciones.filter((m) => m.grasaPct != null).sort((a, b) => b.fecha.localeCompare(a.fecha));
  if (conGrasa.length > 0) {
    const [ult, prev] = conGrasa;
    const desde = new Date(Date.parse(`${hoy}T12:00:00Z`) - 14 * 86_400_000).toISOString().slice(0, 10);
    out.push({
      clave: "grasa", titulo: "Grasa corporal", valor: num(ult.grasaPct!), unidad: "%",
      serie: conGrasa.filter((m) => m.fecha >= desde && m.fecha <= hoy).reverse().map((m) => m.grasaPct!),
      cambio: prev ? `${conSigno(ult.grasaPct! - prev.grasaPct!)} puntos` : null,
      cuando: textoHace(ult.fecha, hoy),
    });
  }

  const presion = por("presion");
  if (presion) {
    out.push({
      clave: "presion", titulo: "Presión", valor: presion.valorTexto ?? String(presion.valorActual), unidad: "mmHg",
      serie: presion.serie14d.map((p) => p.valor),
      cambio: presion.baseline != null ? `sistólica ${conSigno(presion.valorActual! - presion.baseline, 0)}` : null,
      cuando: presion.textoAntiguedad ?? (presion.fechaUltima ? textoHace(presion.fechaUltima, hoy) : null),
    });
  }

  const spo2 = por("spo2");
  if (spo2) {
    out.push({
      clave: "spo2", titulo: "Oxígeno en sangre", valor: String(spo2.valorActual), unidad: "%",
      serie: spo2.serie14d.map((p) => p.valor),
      cambio: spo2.baseline != null ? `promedio ${num(spo2.baseline, 0)} %` : null,
      cuando: spo2.fechaUltima ? textoHace(spo2.fechaUltima, hoy) : null,
    });
  }

  const hrv = por("hrv");
  if (hrv) {
    out.push({
      clave: "hrv", titulo: "HRV", valor: num(hrv.valorActual!, 0), unidad: "ms",
      serie: hrv.serie14d.map((p) => p.valor),
      cambio: hrv.baseline != null ? `${conSigno(hrv.valorActual! - hrv.baseline, 0)} ms` : null,
      cuando: null,
    });
  }
  const pasos = por("pasos");
  if (pasos) {
    out.push({
      clave: "pasos", titulo: "Pasos", valor: Math.round(pasos.valorActual!).toLocaleString("es"), unidad: "",
      serie: pasos.serie14d.map((p) => p.valor),
      cambio: null, cuando: null,
    });
  }
  return out;
}
