import { describe, it, expect } from "vitest";
import { calcularWeekChips } from "./weekChips";

describe("calcularWeekChips", () => {
  const semanaInicio = "2026-07-06"; // lunes

  it("marca 'today' en la fecha de hoy, aunque haya sesión ese día", () => {
    const chips = calcularWeekChips(["2026-07-08"], semanaInicio, "2026-07-08");
    expect(chips[2]).toEqual({ letter: "X", fecha: "2026-07-08", estado: "today" });
  });

  it("marca 'done' las fechas con actividad, sin tocar las demás", () => {
    const chips = calcularWeekChips(
      ["2026-07-06", "2026-07-09"],
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
