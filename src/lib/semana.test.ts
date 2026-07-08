// Forzar timezone Argentina antes de importar helpers (Node respeta TZ en módulos ESM).
process.env.TZ = "America/Argentina/Buenos_Aires";

import { describe, it, expect } from "vitest";
import { ymdLocal, lunesDeSemana } from "./semana";

// 2026-06-29 = lunes (verificado)
// 2026-06-28 = domingo
// 2026-06-22 = lunes anterior

describe("ymdLocal", () => {
  it("usa la fecha LOCAL, no UTC", () => {
    // 02:30 UTC del martes 30 = lunes 29 a las 23:30 ART
    const d = new Date("2026-06-30T02:30:00Z");
    expect(ymdLocal(d)).toBe("2026-06-29");
  });

  it("formatea correctamente con ceros de relleno", () => {
    const d = new Date("2026-01-05T00:00:00");
    expect(ymdLocal(d)).toBe("2026-01-05");
  });
});

describe("lunesDeSemana", () => {
  it("un lunes devuelve sí mismo", () => {
    expect(lunesDeSemana("2026-06-29")).toBe("2026-06-29");
  });

  it("un domingo devuelve el lunes de ESA semana (no el siguiente)", () => {
    expect(lunesDeSemana("2026-06-28")).toBe("2026-06-22");
  });

  it("un jueves devuelve el lunes de la misma semana", () => {
    // 2026-07-02 = jueves; lunes = 2026-06-29
    expect(lunesDeSemana("2026-07-02")).toBe("2026-06-29");
  });

  it("instante nocturno ART (lunes 23:30) → lunes correcto, sin correrse a martes", () => {
    // 02:30 UTC = lunes 23:30 ART
    const d = new Date("2026-06-30T02:30:00Z");
    expect(lunesDeSemana(d)).toBe("2026-06-29");
  });

  it("domingo 23:30 ART → lunes de ESA semana (no el siguiente)", () => {
    // 2026-06-29T02:30:00Z = domingo 28 23:30 ART
    const d = new Date("2026-06-29T02:30:00Z");
    expect(lunesDeSemana(d)).toBe("2026-06-22");
  });

  it("regresión: sesión guardada el domingo de noche está en la semana correcta", () => {
    // Guardada: domingo 28 23:30 ART → semanaInicio "2026-06-22"
    // Leída el lunes 29 mañana → semanaRef "2026-06-29" — SON semanas distintas (correcto)
    const semanaSave = lunesDeSemana(new Date("2026-06-29T02:30:00Z")); // domingo noche
    const semanaRead = lunesDeSemana(new Date("2026-06-29T14:00:00Z")); // lunes mañana
    expect(semanaSave).toBe("2026-06-22");
    expect(semanaRead).toBe("2026-06-29");
    // El anillo del lunes empieza en 0 para la nueva semana — no "roba" el domingo
    expect(semanaSave).not.toBe(semanaRead);
  });
});
