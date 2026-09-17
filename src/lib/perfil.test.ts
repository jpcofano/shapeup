import { describe, it, expect } from "vitest";
import type { PerfilMiembro } from "../types/models";
import { equipoDe, migrarEquipoPorLugar } from "./perfil";

// ── equipoDe ──────────────────────────────────────────────────────────────────
describe("equipoDe", () => {
  it("devuelve lo declarado para ese lugar", () => {
    const p: PerfilMiembro = {
      lugarHabitual: "Casa",
      equipoPorLugar: { Casa: ["Mancuernas"], Gimnasio: ["Polea", "Máquina"] },
    };
    expect(equipoDe(p, "Gimnasio")).toEqual(["Polea", "Máquina"]);
  });

  it("sin equipoPorLugar, usa el equipo plano en el lugar habitual", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", equipoDisponible: ["Mancuernas", "Banco"] };
    expect(equipoDe(p, "Casa")).toEqual(["Mancuernas", "Banco"]);
  });

  it("sin equipoPorLugar y fuera del lugar habitual, cae a peso corporal", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", equipoDisponible: ["Mancuernas", "Banco"] };
    expect(equipoDe(p, "Gimnasio")).toEqual(["Peso corporal"]);
  });

  it("sin perfil, cae a peso corporal", () => {
    expect(equipoDe(undefined, "Casa")).toEqual(["Peso corporal"]);
  });

  it("una lista vacía declarada es una decisión: devuelve vacío, no el fallback", () => {
    const p: PerfilMiembro = {
      lugarHabitual: "Casa",
      equipoDisponible: ["Mancuernas"],
      equipoPorLugar: { "Aire libre": [] },
    };
    expect(equipoDe(p, "Aire libre")).toEqual([]);
  });

  it("equipoPorLugar gana sobre el equipo plano en el lugar habitual", () => {
    const p: PerfilMiembro = {
      lugarHabitual: "Casa",
      equipoDisponible: ["Mancuernas"],
      equipoPorLugar: { Casa: ["Kettlebell"] },
    };
    expect(equipoDe(p, "Casa")).toEqual(["Kettlebell"]);
  });
});

// ── migrarEquipoPorLugar ──────────────────────────────────────────────────────
describe("migrarEquipoPorLugar", () => {
  it("mueve el equipo plano al lugar habitual y lo saca", () => {
    const p: PerfilMiembro = {
      color: "#60a5fa",
      lugarHabitual: "Gimnasio",
      equipoDisponible: ["Polea", "Máquina"],
      objetivos: ["Fuerza"],
    };
    const m = migrarEquipoPorLugar(p);
    expect(m.equipoPorLugar).toEqual({ Gimnasio: ["Polea", "Máquina"] });
    expect(m.equipoDisponible).toBeUndefined();
    expect(m.color).toBe("#60a5fa");
    expect(m.objetivos).toEqual(["Fuerza"]);
    expect(p.equipoDisponible).toEqual(["Polea", "Máquina"]); // no muta la entrada
  });

  it("un perfil ya migrado vuelve igual (idempotencia)", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", equipoPorLugar: { Casa: ["Mancuernas"] } };
    expect(migrarEquipoPorLugar(p)).toBe(p);
    expect(migrarEquipoPorLugar(migrarEquipoPorLugar(p))).toEqual(p);
  });

  it("correr la migración dos veces no cambia nada la segunda vez", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", equipoDisponible: ["Mancuernas"] };
    const una = migrarEquipoPorLugar(p);
    expect(migrarEquipoPorLugar(una)).toEqual(una);
  });

  it("sin lugarHabitual, el equipo va a Casa", () => {
    const p: PerfilMiembro = { equipoDisponible: ["Mancuernas", "VR"] };
    expect(migrarEquipoPorLugar(p).equipoPorLugar).toEqual({ Casa: ["Mancuernas", "VR"] });
  });

  it("sin ningún equipo, queda migrado con el mapa vacío", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", color: "#f472b6" };
    const m = migrarEquipoPorLugar(p);
    expect(m.equipoPorLugar).toEqual({});
    expect(m.color).toBe("#f472b6");
  });

  it("una lista plana vacía no inventa un lugar", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", equipoDisponible: [] };
    const m = migrarEquipoPorLugar(p);
    expect(m.equipoPorLugar).toEqual({});
    expect(m.equipoDisponible).toBeUndefined();
  });

  it("después de migrar, equipoDe devuelve lo mismo en el lugar habitual", () => {
    const p: PerfilMiembro = { lugarHabitual: "Casa", equipoDisponible: ["Mancuernas", "Banco"] };
    expect(equipoDe(migrarEquipoPorLugar(p), "Casa")).toEqual(equipoDe(p, "Casa"));
  });
});
