import { describe, it, expect } from "vitest";
import { calcularWeekChips } from "./weekChips";
import type { Historial } from "../types/models";

function hist(fechaRealizada: string): Historial {
  return { fechaRealizada } as Historial;
}

describe("calcularWeekChips", () => {
  const semanaInicio = "2026-07-06"; // lunes

  it("marca 'today' en la fecha de hoy, aunque haya sesión ese día", () => {
    const chips = calcularWeekChips([hist("2026-07-08")], semanaInicio, "2026-07-08");
    expect(chips[2]).toEqual({ letter: "X", fecha: "2026-07-08", estado: "today" });
  });

  it("marca 'done' los días con Historial.fechaRealizada, sin tocar los demás", () => {
    const chips = calcularWeekChips(
      [hist("2026-07-06"), hist("2026-07-09")],
      semanaInicio,
      "2026-07-10",
    );
    expect(chips.map((c) => c.estado)).toEqual([
      "done", "pending", "pending", "done", "today", "pending", "pending",
    ]);
  });

  it("genera las 7 fechas L→D a partir del lunes", () => {
    const chips = calcularWeekChips([], semanaInicio, "2026-01-01");
    expect(chips.map((c) => c.fecha)).toEqual([
      "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
      "2026-07-10", "2026-07-11", "2026-07-12",
    ]);
    expect(chips.map((c) => c.letter)).toEqual(["L", "M", "X", "J", "V", "S", "D"]);
  });
});
