import { describe, it, expect } from "vitest";
import { calcularRecomendacion, semanasSinDescarga, RUTINAS_RECOMENDADAS } from "./recomendaciones";
import type { SenalSalud as SenalSaludResumen } from "./resumenSalud";
import type { Historial, BloqueRegistro } from "../types/models";

// ── Helpers ────────────────────────────────────────────────────────────────────

const HOY = "2026-07-04";
const MIEMBRO = "juanpablo" as const;

function mkSenal(
  clave: SenalSaludResumen["clave"],
  estado: SenalSaludResumen["estado"],
  valorActual = 60,
  motivo?: string,
): SenalSaludResumen {
  return { clave, estado, valorActual, unidad: "bpm", serie14d: [], motivo };
}

function mkHist(fecha: string, modalidades: ("Fuerza" | "Cardio" | "Movilidad")[] = ["Fuerza"]): Historial {
  const bloques: BloqueRegistro[] = modalidades.map((m, i) => ({
    orden: i + 1, idEjercicio: `EJ-TEST-${i}`, nombreEjercicio: "Test", modalidad: m, series: [],
  }));
  return {
    idHist: `H-${fecha}-${Math.random()}`, fechaRealizada: fecha,
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    idSesion: `SES-${fecha}`, nombreRutina: "Test", miembro: MIEMBRO,
    semanaInicio: fecha, duracionRealMin: 45, rpe: null, tonelajeKg: null,
    totalSeriesHechas: null, bloques,
  };
}

/** Lunes de la semana N weeks before HOY. */
function lunes(semanasAtras: number): string {
  const d = new Date(HOY + "T00:00:00");
  d.setDate(d.getDate() - semanasAtras * 7);
  // retroceder al lunes de esa semana
  const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Sesión de fuerza en la semana N semanas atrás (martes de esa semana). */
function sesionFuerzaEn(semanasAtras: number, dia = 1): Historial {
  const lunesStr = lunes(semanasAtras);
  const d = new Date(lunesStr + "T00:00:00");
  d.setDate(d.getDate() + dia);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return mkHist(`${y}-${m}-${day}`, ["Fuerza"]);
}

// ── Tests: semanasSinDescarga ─────────────────────────────────────────────────

describe("semanasSinDescarga", () => {
  it("sin historial → 0", () => {
    expect(semanasSinDescarga([], HOY)).toBe(0);
  });

  it("4 semanas corridas con ≥ 2 sesiones de fuerza → 4", () => {
    const hist = [
      sesionFuerzaEn(1, 1), sesionFuerzaEn(1, 3), // semana 1 atrás: 2 sesiones
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 4), // semana 2 atrás: 2 sesiones
      sesionFuerzaEn(3, 2), sesionFuerzaEn(3, 5), // semana 3 atrás: 2 sesiones
      sesionFuerzaEn(4, 1), sesionFuerzaEn(4, 3), // semana 4 atrás: 2 sesiones
    ];
    expect(semanasSinDescarga(hist, HOY)).toBe(4);
  });

  it("semana liviana (1 sesión) en el medio → resetea el conteo", () => {
    const hist = [
      sesionFuerzaEn(1, 1), sesionFuerzaEn(1, 3), // semana 1: 2 sesiones → cuenta
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 4), // semana 2: 2 sesiones → cuenta
      sesionFuerzaEn(3, 2),                        // semana 3: 1 sesión → break
      sesionFuerzaEn(4, 1), sesionFuerzaEn(4, 3), // semana 4: 2 sesiones (nunca se llega)
    ];
    expect(semanasSinDescarga(hist, HOY)).toBe(2);
  });

  it("semana sin sesiones → 0 (rompe en la primera semana previa)", () => {
    const hist = [
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 3), // semana 2: 2 sesiones
    ];
    // Semana 1 previa no tiene sesiones → break inmediato
    expect(semanasSinDescarga(hist, HOY)).toBe(0);
  });

  it("sesiones de cardio no cuentan como fuerza", () => {
    const hist = [
      mkHist(lunes(1), ["Cardio"]),
      mkHist(lunes(1), ["Cardio"]),
    ];
    expect(semanasSinDescarga(hist, HOY)).toBe(0);
  });

  it("borde lunes: sesión el domingo de esta semana no entra en semana previa (lunes config)", () => {
    // HOY = 2026-07-04 (sábado); semana previa comienza el 2026-06-22
    // Una sesión el domingo 2026-06-28 (misma semana que HOY, no la previa)
    const hist = [mkHist("2026-06-28", ["Fuerza"]), mkHist("2026-06-28", ["Fuerza"])];
    // Semana actual comienza el 2026-06-29 (lunes); semana previa es 2026-06-22
    // Las sesiones del 28/06 caen en la semana 2026-06-22 → cuenta como semana previa
    const result = semanasSinDescarga(hist, HOY);
    // 2026-06-28 cae en la semana que empieza el 2026-06-22 (lunes) → semana "1 atrás"
    expect(result).toBe(1);
  });

  it("borde domingo: semanaArrancaEn=domingo agrupa correctamente", () => {
    // Con arrancaEn=domingo, un sábado pertenece a la misma semana que el domingo anterior
    const hist = [
      mkHist("2026-06-27", ["Fuerza"]), // sábado
      mkHist("2026-06-25", ["Fuerza"]), // jueves
    ];
    // Ambas sesiones en la semana que arranca el domingo 2026-06-21
    const result = semanasSinDescarga(hist, HOY, "domingo");
    expect(result).toBe(1);
  });

  it("exactamente 3 semanas llenas → 3 (umbral de deload no se dispara)", () => {
    const hist = [
      sesionFuerzaEn(1, 1), sesionFuerzaEn(1, 3),
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 4),
      sesionFuerzaEn(3, 2), sesionFuerzaEn(3, 5),
    ];
    expect(semanasSinDescarga(hist, HOY)).toBe(3);
  });
});

// ── Tests: calcularRecomendacion ──────────────────────────────────────────────

describe("calcularRecomendacion", () => {
  it("sin señales con datos → null", () => {
    const senales: SenalSaludResumen[] = [
      mkSenal("sueno", "sin-datos"),
      mkSenal("fc-reposo", "sin-datos"),
    ];
    expect(calcularRecomendacion(senales, [], HOY, MIEMBRO)).toBeNull();
  });

  it("array de señales vacío → null", () => {
    expect(calcularRecomendacion([], [], HOY, MIEMBRO)).toBeNull();
  });

  // ── Regla 1: Descanso ────────────────────────────────────────────────────
  it("regla 1: sueño alerta → Día de descanso (importante)", () => {
    const senales = [mkSenal("sueno", "alerta", 5.0, "Promedio 5.0 h/noche (últimas noches)")];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Día de descanso");
    expect(rec?.severidad).toBe("importante");
    expect(rec?.basadoEn).toContain("sueño");
    expect(rec?.mensaje).toContain("5.0 h");
    expect(rec?.accionSugerida?.idRutina).toBe(RUTINAS_RECOMENDADAS.descarga);
  });

  it("regla 1: hrv alerta → Día de descanso", () => {
    const senales = [mkSenal("hrv", "alerta", 40, "HRV 40 ms · −30% vs tus últimas 4 semanas")];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Día de descanso");
    expect(rec?.basadoEn).toContain("hrv");
  });

  it("regla 1: sueño alerta + hrv alerta → ambas en basadoEn", () => {
    const senales = [
      mkSenal("sueno", "alerta", 5.0, "Promedio 5.0 h/noche (últimas noches)"),
      mkSenal("hrv", "alerta", 40, "HRV 40 ms · −30%"),
    ];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Día de descanso");
    expect(rec?.basadoEn).toContain("sueño");
    expect(rec?.basadoEn).toContain("hrv");
  });

  // ── Regla 2: Bajar intensidad ────────────────────────────────────────────
  it("regla 2: sueño atención → Bajar intensidad (sugerencia)", () => {
    const senales = [mkSenal("sueno", "atencion", 6.2, "Promedio 6.2 h/noche (últimas noches)")];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Bajar intensidad");
    expect(rec?.severidad).toBe("sugerencia");
    expect(rec?.basadoEn).toContain("sueño");
    expect(rec?.mensaje).toContain("6.2 h");
  });

  it("regla 2: hrv atención → Bajar intensidad", () => {
    const senales = [mkSenal("hrv", "atencion", 50, "HRV 50 ms · −20%")];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Bajar intensidad");
    expect(rec?.basadoEn).toContain("hrv");
    expect(rec?.accionSugerida?.cambio).toBeTruthy();
  });

  // ── Prioridad: alerta > atención ────────────────────────────────────────
  it("prioridad: sueño alerta + fc-reposo atención → regla 1 (descanso), no regla 3", () => {
    const senales = [
      mkSenal("sueno", "alerta", 5.0, "Promedio 5.0 h/noche (últimas noches)"),
      mkSenal("fc-reposo", "atencion", 65, "FC reposo +6.0 bpm vs tus últimas 4 semanas"),
    ];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Día de descanso");
  });

  it("prioridad: sueño atención + fc-reposo alerta → regla 2 (bajar), no regla 3", () => {
    const senales = [
      mkSenal("sueno", "atencion", 6.2, "Promedio 6.2 h/noche (últimas noches)"),
      mkSenal("fc-reposo", "alerta", 67, "FC reposo +9.0 bpm vs tus últimas 4 semanas"),
    ];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Bajar intensidad");
  });

  // ── Regla 3: Cardio Z2 ───────────────────────────────────────────────────
  it("regla 3: fc-reposo atención → Sumar cardio Z2", () => {
    const senales = [mkSenal("fc-reposo", "atencion", 65, "FC reposo +6.0 bpm vs tus últimas 4 semanas")];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Sumar cardio Z2");
    expect(rec?.severidad).toBe("sugerencia");
    expect(rec?.basadoEn).toContain("fc-reposo");
    expect(rec?.mensaje).toContain("+6.0 bpm");
    expect(rec?.accionSugerida?.idRutina).toBe(RUTINAS_RECOMENDADAS.z2);
  });

  it("regla 3: fc-reposo alerta también dispara Z2 (si no hay sueño/hrv con alerta)", () => {
    const senales = [mkSenal("fc-reposo", "alerta", 67, "FC reposo +9.0 bpm vs tus últimas 4 semanas")];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Sumar cardio Z2");
  });

  it("regla 3 no dispara si fc-reposo está ok", () => {
    const senales = [mkSenal("fc-reposo", "ok", 58)];
    expect(calcularRecomendacion(senales, [], HOY, MIEMBRO)).toBeNull();
  });

  // ── Regla 4: Deload ──────────────────────────────────────────────────────
  it("regla 4: 4 semanas corridas de fuerza → Deload", () => {
    const hist = [
      sesionFuerzaEn(1, 1), sesionFuerzaEn(1, 3),
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 4),
      sesionFuerzaEn(3, 2), sesionFuerzaEn(3, 5),
      sesionFuerzaEn(4, 1), sesionFuerzaEn(4, 3),
    ];
    const senales = [mkSenal("fc-reposo", "ok", 58)];
    const rec = calcularRecomendacion(senales, hist, HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Deload");
    expect(rec?.severidad).toBe("sugerencia");
    expect(rec?.basadoEn).toContain("rpe-sesiones");
    expect(rec?.accionSugerida?.idPrograma).toBe(RUTINAS_RECOMENDADAS.deload);
    expect(rec?.mensaje).toContain("4 semanas");
  });

  it("regla 4: 3 semanas no dispara deload", () => {
    const hist = [
      sesionFuerzaEn(1, 1), sesionFuerzaEn(1, 3),
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 4),
      sesionFuerzaEn(3, 2), sesionFuerzaEn(3, 5),
    ];
    const senales = [mkSenal("fc-reposo", "ok", 58)];
    expect(calcularRecomendacion(senales, hist, HOY, MIEMBRO)).toBeNull();
  });

  // ── Regla 5: Felicitación ────────────────────────────────────────────────
  it("regla 5: todas ok + ≥ 2 sesiones en 7 días → Felicitación", () => {
    const hist = [mkHist("2026-07-01"), mkHist("2026-07-03")];
    const senales: SenalSaludResumen[] = [
      mkSenal("sueno", "ok", 7.2),
      mkSenal("fc-reposo", "ok", 58),
    ];
    const rec = calcularRecomendacion(senales, hist, HOY, MIEMBRO);
    expect(rec?.tipo).toBe("Felicitación");
    expect(rec?.severidad).toBe("info");
    expect(rec?.basadoEn).toContain("adherencia");
    expect(rec?.accionSugerida?.idRutina).toBe(RUTINAS_RECOMENDADAS.hiit);
  });

  it("regla 5: todas ok + 1 sesión en 7 días → null (no felicita sin adherencia suficiente)", () => {
    const hist = [mkHist("2026-07-01")];
    const senales: SenalSaludResumen[] = [
      mkSenal("sueno", "ok", 7.2),
      mkSenal("fc-reposo", "ok", 58),
    ];
    expect(calcularRecomendacion(senales, hist, HOY, MIEMBRO)).toBeNull();
  });

  it("regla 5: todas ok + 0 sesiones → null", () => {
    const senales: SenalSaludResumen[] = [mkSenal("sueno", "ok", 7.2)];
    expect(calcularRecomendacion(senales, [], HOY, MIEMBRO)).toBeNull();
  });

  // ── basadoEn refleja señales reales ─────────────────────────────────────
  it("basadoEn incluye solo las señales que dispararon la regla", () => {
    const senales = [
      mkSenal("sueno", "alerta", 5.0, "Promedio 5.0 h/noche (últimas noches)"),
      mkSenal("fc-reposo", "ok", 58),
    ];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.basadoEn).toContain("sueño");
    expect(rec?.basadoEn).not.toContain("fc-reposo");
  });

  // ── mensaje contiene dato concreto ──────────────────────────────────────
  it("mensaje de fc-reposo contiene el delta bpm", () => {
    const motivo = "FC reposo +7.5 bpm vs tus últimas 4 semanas";
    const senales = [mkSenal("fc-reposo", "atencion", 65, motivo)];
    const rec = calcularRecomendacion(senales, [], HOY, MIEMBRO);
    expect(rec?.mensaje).toContain("+7.5 bpm");
  });

  it("mensaje de deload contiene el número de semanas", () => {
    const hist = [
      sesionFuerzaEn(1, 1), sesionFuerzaEn(1, 3),
      sesionFuerzaEn(2, 1), sesionFuerzaEn(2, 4),
      sesionFuerzaEn(3, 2), sesionFuerzaEn(3, 5),
      sesionFuerzaEn(4, 1), sesionFuerzaEn(4, 3),
      sesionFuerzaEn(5, 1), sesionFuerzaEn(5, 3),
    ];
    const senales = [mkSenal("fc-reposo", "ok", 58)];
    const rec = calcularRecomendacion(senales, hist, HOY, MIEMBRO);
    expect(rec?.mensaje).toMatch(/5 semanas/);
  });
});
