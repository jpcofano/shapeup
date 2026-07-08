import { describe, it, expect } from "vitest";
import { consolidarNoches, promedioNoches, nochesEnVentana } from "./sueno";
import type { RegistroSueno } from "../types/models";

// ── Helpers ───────────────────────────────────────────────────────────────────

function reg(
  fecha: string,
  horas: number,
  horaAcostarse?: string,
  horaLevantarse?: string,
  inicioMs?: number,
  finMs?: number,
): RegistroSueno {
  return {
    idSueno: `SUE-${fecha}-${horas}`, miembro: "juanpablo",
    fecha, horas, horaAcostarse, horaLevantarse, inicioMs, finMs,
    fuente: "samsung-health-csv",
  };
}

// Construye epoch ms para una fecha+hora local (UTC-3)
function toMs(dateStr: string, hora: string): number {
  const [h, m] = hora.split(":").map(Number);
  const d = new Date(`${dateStr}T${hora.padStart(5, "0")}:00.000Z`);
  // ajuste: -3h (UTC-0300) → época local es UTC+3h
  return d.getTime() + 3 * 60 * 60 * 1000;
}

// ── consolidarNoches — básico ─────────────────────────────────────────────────

describe("consolidarNoches — básico", () => {
  it("una sola sesión nocturna → una NocheSueno", () => {
    // acostarse a las 23:30 del 03 → mañana = 04 (se levantó el 04)
    const noches = consolidarNoches([reg("2026-07-03", 7.5, "23:30", "07:00")]);
    expect(noches).toHaveLength(1);
    expect(noches[0].fecha).toBe("2026-07-04");
    expect(noches[0].horasTotal).toBe(7.5);
    expect(noches[0].horasNoche).toBe(7.5);
    expect(noches[0].horasSiesta).toBeUndefined();
    expect(noches[0].tramos).toBe(1);
  });

  it("tres tramos de la misma noche → una NocheSueno con total correcto", () => {
    const sueno = [
      reg("2026-07-02", 3.6, "00:10", "03:46"),
      reg("2026-07-02", 1.3, "04:05", "05:23"),
      reg("2026-07-02", 1.2, "05:40", "06:52"),
    ];
    const noches = consolidarNoches(sueno);
    expect(noches).toHaveLength(1);
    expect(noches[0].horasTotal).toBeCloseTo(6.1, 1);
    expect(noches[0].tramos).toBe(3);
  });

  it("tramo que arranca 23:40 del día D → noche D+1 (asignación por horaAcostarse)", () => {
    const sueno = [reg("2026-07-02", 7.0, "23:40", "06:40")];
    const noches = consolidarNoches(sueno);
    expect(noches).toHaveLength(1);
    expect(noches[0].fecha).toBe("2026-07-03"); // D+1
  });

  it("tramo que arranca 05:30 del día D → noche D (mañana de D)", () => {
    const sueno = [reg("2026-07-03", 3.8, "05:30", "09:18")];
    const noches = consolidarNoches(sueno);
    expect(noches).toHaveLength(1);
    expect(noches[0].fecha).toBe("2026-07-03");
  });

  it("siesta (12:02, 1.4h) desglosa pero suma a horasTotal", () => {
    const sueno = [
      reg("2026-07-03", 6.0, "00:00", "06:00"), // nocturno
      reg("2026-07-03", 1.4, "12:02", "13:26"), // siesta
    ];
    const noches = consolidarNoches(sueno);
    expect(noches).toHaveLength(1);
    expect(noches[0].horasTotal).toBeCloseTo(7.4, 1);
    expect(noches[0].horasNoche).toBeCloseTo(6.0, 1);
    expect(noches[0].horasSiesta).toBeCloseTo(1.4, 1);
  });

  it("siesta de ≥3h no es siesta sino nocturno", () => {
    const sueno = [reg("2026-07-03", 3.5, "13:00", "16:30")];
    const noches = consolidarNoches(sueno);
    expect(noches[0].horasNoche).toBeCloseTo(3.5, 1);
    expect(noches[0].horasSiesta).toBeUndefined();
  });

  it("orden descendente por fecha", () => {
    // horaAcostarse ≥ 15:00 → D+1 (fecha = mañana del día siguiente)
    const sueno = [
      reg("2026-07-01", 7.0, "23:00"),  // → 2026-07-02
      reg("2026-07-03", 6.5, "22:30"),  // → 2026-07-04
      reg("2026-07-02", 7.2, "23:15"),  // → 2026-07-03
    ];
    const noches = consolidarNoches(sueno);
    expect(noches.map((n) => n.fecha)).toEqual(["2026-07-04", "2026-07-03", "2026-07-02"]);
  });

  it("sin datos → array vacío", () => {
    expect(consolidarNoches([])).toHaveLength(0);
  });

  it("registros sin horas (horas=0 o undefined) son ignorados", () => {
    const sueno = [
      { idSueno: "x", miembro: "juanpablo" as const, fecha: "2026-07-03", horas: 0, fuente: "samsung-health-csv" as const },
      reg("2026-07-03", 7.0, "23:00"),
    ];
    const noches = consolidarNoches(sueno);
    expect(noches).toHaveLength(1);
  });
});

// ── consolidarNoches — legacy sin inicioMs ────────────────────────────────────

describe("consolidarNoches — legacy sin inicioMs", () => {
  it("horaAcostarse < 15:00 → fecha actual", () => {
    const s = reg("2026-07-03", 5.0, "06:00");
    const noches = consolidarNoches([s]);
    expect(noches[0].fecha).toBe("2026-07-03");
  });

  it("horaAcostarse ≥ 15:00 → fecha+1 (caso noche tardía)", () => {
    const s = reg("2026-07-02", 8.0, "22:00");
    const noches = consolidarNoches([s]);
    expect(noches[0].fecha).toBe("2026-07-03");
  });

  it("sin horaAcostarse → usa fecha del registro", () => {
    const s = reg("2026-07-03", 7.0);
    const noches = consolidarNoches([s]);
    expect(noches[0].fecha).toBe("2026-07-03");
  });
});

// ── consolidarNoches — con inicioMs ──────────────────────────────────────────

describe("consolidarNoches — con inicioMs (regla principal)", () => {
  it("inicio a las 00:10 hora Argentina (03:10 UTC) → noche de esa misma fecha", () => {
    const inicioMs = new Date("2026-07-03T03:10:00.000Z").getTime(); // 00:10 ART = 03:10 UTC
    const s: RegistroSueno = {
      idSueno: "x", miembro: "juanpablo", fecha: "2026-07-03",
      horas: 6.0, inicioMs, fuente: "samsung-health-csv",
    };
    const noches = consolidarNoches([s]);
    // 00:10 hora Argentina < 15:00 → fecha local del inicio, sin correr al día siguiente
    expect(noches[0].fecha).toBe("2026-07-03");
  });

  // S-fix (P55): regresión del bug "corrimiento de noche" — antes se leía la hora
  // en UTC directo sobre un epoch ya corregido a UTC real, corriendo el corte de
  // las 15:00 en +3h. Esta franja (12:00–14:59 hora Argentina) es la que quedaba
  // mal clasificada: caía del lado "≥15:00" y se corría un día de más.
  it("inicio a las 13:00 hora Argentina (16:00 UTC) → NO se corre al día siguiente", () => {
    const inicioMs = new Date("2026-07-03T16:00:00.000Z").getTime(); // 13:00 ART = 16:00 UTC
    const s: RegistroSueno = {
      idSueno: "x", miembro: "juanpablo", fecha: "2026-07-03",
      horas: 3.5, inicioMs, fuente: "samsung-health-csv",
    };
    const noches = consolidarNoches([s]);
    expect(noches[0].fecha).toBe("2026-07-03");
  });

  it("inicio a las 23:00 hora Argentina (02:00 UTC del día siguiente) → mañana del día siguiente", () => {
    const inicioMs = new Date("2026-07-04T02:00:00.000Z").getTime(); // 23:00 ART (jul 3) = 02:00 UTC (jul 4)
    const s: RegistroSueno = {
      idSueno: "x", miembro: "juanpablo", fecha: "2026-07-03",
      horas: 7.0, inicioMs, fuente: "samsung-health-csv",
    };
    const noches = consolidarNoches([s]);
    expect(noches[0].fecha).toBe("2026-07-04");
  });
});

// ── nochesEnVentana ───────────────────────────────────────────────────────────

describe("nochesEnVentana", () => {
  it("caso real de la auditoría: noches 2026-07-01..05, hoy 2026-07-08 → 5/30, no 0/30", () => {
    const noches = [
      { fecha: "2026-07-05", horasTotal: 7.2, horasNoche: 7.2, tramos: 1 },
      { fecha: "2026-07-04", horasTotal: 8.0, horasNoche: 8.0, tramos: 1 },
      { fecha: "2026-07-03", horasTotal: 6.5, horasNoche: 6.5, tramos: 1 },
      { fecha: "2026-07-02", horasTotal: 7.5, horasNoche: 7.5, tramos: 1 },
      { fecha: "2026-07-01", horasTotal: 7.0, horasNoche: 7.0, tramos: 1 },
    ];
    expect(nochesEnVentana(noches, "2026-07-08", 30)).toBe(5);
  });

  it("no cuenta noches fuera de la ventana", () => {
    const noches = [
      { fecha: "2026-05-01", horasTotal: 7, horasNoche: 7, tramos: 1 },
      { fecha: "2026-07-05", horasTotal: 7, horasNoche: 7, tramos: 1 },
    ];
    expect(nochesEnVentana(noches, "2026-07-08", 30)).toBe(1);
  });

  it("sin noches → 0", () => {
    expect(nochesEnVentana([], "2026-07-08", 30)).toBe(0);
  });
});

// ── promedioNoches ────────────────────────────────────────────────────────────

describe("promedioNoches", () => {
  it("usa horasTotal, no horasNoche", () => {
    const noches = [
      { fecha: "2026-07-03", horasTotal: 7.0, horasNoche: 6.0, horasSiesta: 1.0, tramos: 2 },
      { fecha: "2026-07-02", horasTotal: 6.5, horasNoche: 6.5, tramos: 1 },
      { fecha: "2026-07-01", horasTotal: 8.0, horasNoche: 8.0, tramos: 1 },
    ];
    const prom = promedioNoches(noches, 3);
    expect(prom).toBeCloseTo((7.0 + 6.5 + 8.0) / 3, 1);
  });

  it("con huecos (solo usa las primeras N con dato)", () => {
    const noches = [
      { fecha: "2026-07-03", horasTotal: 6.0, horasNoche: 6.0, tramos: 1 },
      { fecha: "2026-07-01", horasTotal: 7.0, horasNoche: 7.0, tramos: 1 },
      { fecha: "2026-06-30", horasTotal: 8.0, horasNoche: 8.0, tramos: 1 },
    ];
    const prom = promedioNoches(noches, 3);
    expect(prom).toBeCloseTo((6.0 + 7.0 + 8.0) / 3, 1);
  });

  it("< 3 noches → undefined", () => {
    const noches = [
      { fecha: "2026-07-03", horasTotal: 6.0, horasNoche: 6.0, tramos: 1 },
      { fecha: "2026-07-02", horasTotal: 7.0, horasNoche: 7.0, tramos: 1 },
    ];
    expect(promedioNoches(noches, 3)).toBeUndefined();
  });

  it("0 noches → undefined", () => {
    expect(promedioNoches([], 3)).toBeUndefined();
  });

  it("redondea a 1 decimal", () => {
    const noches = [
      { fecha: "2026-07-03", horasTotal: 7.1, horasNoche: 7.1, tramos: 1 },
      { fecha: "2026-07-02", horasTotal: 7.2, horasNoche: 7.2, tramos: 1 },
      { fecha: "2026-07-01", horasTotal: 7.0, horasNoche: 7.0, tramos: 1 },
    ];
    const prom = promedioNoches(noches, 3);
    expect(prom).toBe(7.1);
  });
});
