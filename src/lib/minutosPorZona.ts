// ════════════════════════════════════════════════════════════════════════════
//  lib/minutosPorZona.ts — cuántos minutos en cada zona, de la curva (P92).
//
//  Health reparte los minutos por zona de toda la sesión, y el SDK ni siquiera
//  nos los da. Los calculamos de la curva, y por eso los podemos dar también
//  por ejercicio (lo que ninguna de las dos apps hace).
//
//  El método es explícito porque acá es donde se inventan minutos si uno se
//  descuida:
//    - las muestras se ordenan y se recortan a la ventana;
//    - cada PAR de muestras consecutivas aporta su intervalo a la zona del
//      PROMEDIO de las dos (por muestra suelta cuenta mal con muestreo irregular);
//    - la zona es la más alta cuyo piso se alcanzó (lib/zonas, la misma regla
//      que derivarZona). Por debajo del piso de Z1 → `minutosBajoZonas`:
//      "estuviste tranquilo", que NO es lo mismo que "no sabemos";
//    - un hueco de más de `MAX_HUECO_ZONA_MS` entre muestras no se atribuye a
//      nada: va a `minutosSinDato`, igual que lo que sobra de la ventana antes
//      de la primera muestra y después de la última;
//    - **invariante: zonas + bajo zonas + sin dato = la ventana.**
//
//  Los minutos se redondean al final, a décimas, repartiendo el redondeo para
//  que la suma siga cerrando. Sin pisos en el perfil (ni `zonasFC` ni
//  `fcMaxTeorica`) no se devuelve nada: sin zonas no hay zonas.
//
//  Puro (ADR #009).
// ════════════════════════════════════════════════════════════════════════════
import type { PerfilMiembro, ZonaFC } from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";
import { pisosDe, zonaPorPiso } from "./zonas";

/** Un hueco entre muestras mayor a esto no se atribuye a ninguna zona. */
export const MAX_HUECO_ZONA_MS = 60_000;

export interface MinutosPorZona {
  porZona: Partial<Record<ZonaFC, number>>;
  /** Con dato, pero por debajo del piso de Z1. */
  minutosBajoZonas: number;
  /** Sin dato: huecos de la curva y bordes de la ventana sin muestras. */
  minutosSinDato: number;
}

const ZONAS: ZonaFC[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

export function minutosPorZona(
  curva: LiveDataPoint[],
  ventana: { inicioMs: number; finMs: number },
  perfil?: Pick<PerfilMiembro, "zonasFC" | "fcMaxTeorica"> | null,
): MinutosPorZona | null {
  const pisos = pisosDe(perfil);
  if (!pisos) return null;
  const totalMs = Math.max(0, ventana.finMs - ventana.inicioMs);

  const pts = curva
    .filter((p) => p.ms >= ventana.inicioMs && p.ms <= ventana.finMs && Number.isFinite(p.fc))
    .sort((a, b) => a.ms - b.ms);

  const ms: Record<ZonaFC | "bajo" | "sinDato", number> = { Z1: 0, Z2: 0, Z3: 0, Z4: 0, Z5: 0, bajo: 0, sinDato: 0 };
  if (pts.length === 0) {
    ms.sinDato = totalMs;
  } else {
    ms.sinDato += pts[0].ms - ventana.inicioMs;
    ms.sinDato += ventana.finMs - pts[pts.length - 1].ms;
    for (let i = 1; i < pts.length; i++) {
      const dt = pts[i].ms - pts[i - 1].ms;
      if (dt <= 0) continue;
      if (dt > MAX_HUECO_ZONA_MS) { ms.sinDato += dt; continue; }
      const zona = zonaPorPiso((pts[i].fc + pts[i - 1].fc) / 2, pisos);
      ms[zona ?? "bajo"] += dt;
    }
  }

  // Redondeo al final, a décimas de minuto, repartido por el mayor resto para
  // que la suma dé exactamente la ventana redondeada.
  const claves = [...ZONAS, "bajo", "sinDato"] as const;
  const decimas = claves.map((k) => (ms[k] / 60_000) * 10);
  const base = decimas.map(Math.floor);
  const objetivo = Math.round((totalMs / 60_000) * 10);
  let faltan = objetivo - base.reduce((a, b) => a + b, 0);
  const porResto = decimas.map((d, i) => ({ i, resto: d - Math.floor(d) })).sort((a, b) => b.resto - a.resto);
  for (const { i } of porResto) {
    if (faltan <= 0) break;
    base[i]++;
    faltan--;
  }

  const porZona: Partial<Record<ZonaFC, number>> = {};
  ZONAS.forEach((z, i) => { if (base[i] > 0) porZona[z] = base[i] / 10; });
  return {
    porZona,
    minutosBajoZonas: base[5] / 10,
    minutosSinDato: base[6] / 10,
  };
}

/** Suma de todo lo que devuelve: tiene que dar la ventana (la invariante). */
export function totalMinutos(m: MinutosPorZona): number {
  const z = Object.values(m.porZona).reduce((a, b) => a + (b ?? 0), 0);
  return Math.round((z + m.minutosBajoZonas + m.minutosSinDato) * 10) / 10;
}

// ── La distribución de CardioTab (P92, Parte 5) ─────────────────────────────

/**
 * Minutos por zona de un conjunto de actividades, separando lo MEDIDO de lo
 * ESTIMADO. Antes se le asignaba a cada actividad entera su zona principal y
 * se dibujaba igual que si fuera medido: 50 minutos que pasaron por Z2, Z4 y Z3
 * aparecían como 50 de Z3.
 *
 * - Actividad vinculada a una sesión de la app con `minutosPorZona` → se usan
 *   esos minutos (salen de la curva). Si la sesión tiene varios tramos, se
 *   cuenta **una vez**, no por cada tramo.
 * - Si no → la aproximación de siempre (duración entera a la zona principal),
 *   contada aparte como estimada.
 */
export interface DistribucionZonas {
  medido: Partial<Record<ZonaFC, number>>;
  estimado: Partial<Record<ZonaFC, number>>;
  totalMedido: number;
  totalEstimado: number;
}

export function distribucionPorZona(
  cardio: { idCardio: string; zonaPrincipal?: ZonaFC; duracionMin?: number }[],
  historial: { biometria?: { datauuidSamsung?: string; tramosSamsung?: string[]; minutosPorZona?: Partial<Record<ZonaFC, number>> } }[],
): DistribucionZonas {
  // Cada tramo de Samsung apunta a la sesión que lo usó; el principal se cuenta.
  const porCardio = new Map<string, { idx: number; minutos: Partial<Record<ZonaFC, number>> }>();
  historial.forEach((h, idx) => {
    const m = h.biometria?.minutosPorZona;
    if (!m) return;
    const uuids = h.biometria?.tramosSamsung ?? (h.biometria?.datauuidSamsung ? [h.biometria.datauuidSamsung] : []);
    for (const u of uuids) porCardio.set(`CAR-${u}`, { idx, minutos: m });
  });

  const d: DistribucionZonas = { medido: {}, estimado: {}, totalMedido: 0, totalEstimado: 0 };
  const sesionesContadas = new Set<number>();
  for (const c of cardio) {
    const vinc = porCardio.get(c.idCardio);
    if (vinc) {
      if (sesionesContadas.has(vinc.idx)) continue;       // otro tramo de la misma sesión
      sesionesContadas.add(vinc.idx);
      for (const z of ZONAS) {
        const v = vinc.minutos[z];
        if (v) { d.medido[z] = (d.medido[z] ?? 0) + v; d.totalMedido += v; }
      }
      continue;
    }
    if (!c.zonaPrincipal || !c.duracionMin) continue;
    d.estimado[c.zonaPrincipal] = (d.estimado[c.zonaPrincipal] ?? 0) + c.duracionMin;
    d.totalEstimado += c.duracionMin;
  }
  return d;
}

/** "se tomó la ventana del reloj (2,8 % más larga)" — información, no advertencia (P92). */
export function textoVentanaAdoptada(desfasePct: number): string {
  const cifra = Math.abs(desfasePct).toLocaleString("es-AR", { maximumFractionDigits: 1 });
  return `se tomó la ventana del reloj (${cifra} % ${desfasePct > 0 ? "más larga" : "más corta"})`;
}
