import { describe, it, expect } from "vitest";
import { filtrarEjercicios } from "./filtros";
import type { Ejercicio } from "../types/models";

const base: Omit<Ejercicio, "idEjercicio" | "nombre" | "nombreCanonico" | "modalidad" | "grupoMuscularPrimario" | "gruposSecundarios" | "equipo" | "nivel"> = {
  patron:       "Empuje horizontal",
  unilateral:   false,
  instrucciones: [],
  puntosClave:   [],
  erroresComunes: [],
  sinonimos:     [],
  descansoSugeridoSeg: 90,
  vecesUsado: 0,
  origen: "manual",
};

const ejercicios: Ejercicio[] = [
  {
    ...base,
    idEjercicio: "EJ-0001",
    nombre: "Press de banca",
    nombreCanonico: "press de banca",
    modalidad: "Fuerza",
    grupoMuscularPrimario: "Pecho",
    gruposSecundarios: ["Tríceps", "Hombros"],
    equipo: ["Barra", "Banco"],
    nivel: "Intermedio",
  },
  {
    ...base,
    idEjercicio: "EJ-0002",
    nombre: "Dominadas",
    nombreCanonico: "dominadas",
    modalidad: "Fuerza",
    patron: "Tracción vertical",
    grupoMuscularPrimario: "Dorsales",
    gruposSecundarios: ["Bíceps"],
    equipo: ["Barra de dominadas"],
    nivel: "Intermedio",
  },
  {
    ...base,
    idEjercicio: "EJ-0003",
    nombre: "Trote en cinta",
    nombreCanonico: "trote en cinta",
    modalidad: "Cardio",
    patron: "Locomoción / cardio",
    grupoMuscularPrimario: "Cardiovascular",
    gruposSecundarios: [],
    equipo: ["Máquina de cardio"],
    nivel: "Principiante",
  },
  {
    ...base,
    idEjercicio: "EJ-0004",
    nombre: "Curl de bíceps",
    nombreCanonico: "curl de biceps",
    modalidad: "Fuerza",
    patron: "Tracción vertical",
    grupoMuscularPrimario: "Bíceps",
    gruposSecundarios: ["Antebrazos"],
    equipo: ["Mancuernas"],
    nivel: "Principiante",
    sinonimos: ["curl alternado"],
  },
];

describe("filtrarEjercicios", () => {
  it("sin filtros devuelve todos", () => {
    expect(filtrarEjercicios(ejercicios, {})).toHaveLength(4);
  });

  it("filtra por modalidad", () => {
    const r = filtrarEjercicios(ejercicios, { modalidad: "Cardio" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0003");
  });

  it("filtra por nivel", () => {
    const r = filtrarEjercicios(ejercicios, { nivel: "Principiante" });
    expect(r).toHaveLength(2);
  });

  it("filtra por equipo", () => {
    const r = filtrarEjercicios(ejercicios, { equipo: "Barra" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0001");
  });

  it("filtra por grupo muscular primario", () => {
    const r = filtrarEjercicios(ejercicios, { grupoMuscular: "Pecho" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0001");
  });

  it("filtra por grupo muscular secundario", () => {
    const r = filtrarEjercicios(ejercicios, { grupoMuscular: "Tríceps" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0001");
  });

  it("filtra por región muscular", () => {
    const r = filtrarEjercicios(ejercicios, { region: "Tren superior - empuje" });
    expect(r.map((e) => e.idEjercicio)).toContain("EJ-0001");
    expect(r.map((e) => e.idEjercicio)).not.toContain("EJ-0003");
  });

  it("búsqueda por nombre (case-insensitive y sin tildes)", () => {
    const r = filtrarEjercicios(ejercicios, { busqueda: "Press" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0001");
  });

  it("búsqueda por sinónimo", () => {
    const r = filtrarEjercicios(ejercicios, { busqueda: "alternado" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0004");
  });

  it("combina criterios (AND)", () => {
    const r = filtrarEjercicios(ejercicios, { modalidad: "Fuerza", nivel: "Principiante" });
    expect(r).toHaveLength(1);
    expect(r[0].idEjercicio).toBe("EJ-0004");
  });
});
