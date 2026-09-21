// ════════════════════════════════════════════════════════════════════════════
//  adherencia.test.ts — series de adherencia semanal (P77a).
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  metaSemanal, seriesDeAdherencia, rachaActual, rachaRecord, tasaCumplimiento,
  type SemanaAdherencia,
} from "./adherencia";
import type { DiaActivo } from "./racha";
import type { Programa, PerfilMiembro } from "../types/models";

// ── Helpers ────────────────────────────────────────────────────────────────

function programa(tipos: Array<"rutina" | "vr" | "descanso">): Programa {
  return {
    idPrograma: "PRG-TEST", nombre: "Test", nombreCanonico: "test", estado: "Activo",
    objetivo: "General / salud", nivel: "Principiante",
    diasPorSemana: tipos.filter((t) => t !== "descanso").length, descripcion: "",
    dias: tipos.map((tipo, i) => ({
      orden: i + 1, etiqueta: `Día ${i + 1}`, tipo, opcional: false,
      ...(tipo === "rutina" ? { idRutina: `RUT-000${i + 1}` } : {}),
    })),
    vecesUsado: 0,
  } as unknown as Programa;
}

/** Un día con sesión de la app. */
function plan(fecha: string, minutos = 45): DiaActivo {
  return { fecha, shapeUp: true, externaDeclarada: false, autodetectada: false, minutos };
}

/** Un día de movimiento, sin sesión de la app. */
function movimiento(fecha: string, minutos = 40): DiaActivo {
  return { fecha, shapeUp: false, externaDeclarada: true, autodetectada: false, minutos };
}

/** Lunes de cada semana de la fixture: semanas consecutivas de 2026. */
const L1 = "2026-08-03", L2 = "2026-08-10", L3 = "2026-08-17", L4 = "2026-08-24";
const L5 = "2026-08-31", L6 = "2026-09-07";

/** `n` días de plan dentro de la semana que arranca el lunes `lunes`. */
function semanaCon(lunes: string, n: number): DiaActivo[] {
  return Array.from({ length: n }, (_v, i) => {
    const d = new Date(lunes + "T00:00:00");
    d.setDate(d.getDate() + i);
    return plan(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  });
}

// ════════════════════════════════════════════════════════════════════════════
//  metaSemanal
// ════════════════════════════════════════════════════════════════════════════

describe("metaSemanal", () => {
  it("sale de los días no-descanso del plan", () => {
    expect(metaSemanal(programa(["rutina", "rutina", "descanso", "rutina", "descanso"]))).toBe(3);
  });

  it("los días de VR cuentan: son días de entrenamiento", () => {
    expect(metaSemanal(programa(["rutina", "vr", "descanso"]))).toBe(2);
  });

  it("el perfil la pisa", () => {
    const perfil: PerfilMiembro = { metaSemanalDias: 4 };
    expect(metaSemanal(programa(["rutina", "rutina", "rutina", "rutina", "rutina", "rutina"]), perfil)).toBe(4);
  });

  it("sin programa activo devuelve null, no cero", () => {
    expect(metaSemanal(null)).toBeNull();
    expect(metaSemanal(undefined)).toBeNull();
  });

  it("pero el override del perfil vale aunque no haya programa", () => {
    expect(metaSemanal(null, { metaSemanalDias: 3 })).toBe(3);
  });

  it("un programa de puros descansos no tiene meta", () => {
    expect(metaSemanal(programa(["descanso", "descanso"]))).toBeNull();
  });

  it("un override inválido no pisa nada", () => {
    expect(metaSemanal(programa(["rutina", "rutina"]), { metaSemanalDias: 0 })).toBe(2);
    expect(metaSemanal(programa(["rutina", "rutina"]), { metaSemanalDias: NaN })).toBe(2);
  });
});

/** Rango que cubre toda la fixture: el movimiento se conoce en todas. */
const TODO_CARGADO = { desde: "2026-01-01", hasta: "2026-12-31" };

// ════════════════════════════════════════════════════════════════════════════
//  seriesDeAdherencia
// ════════════════════════════════════════════════════════════════════════════

describe("seriesDeAdherencia", () => {
  const HOY = "2026-09-09";   // miércoles de la semana de L6

  it("dos sesiones el mismo día cuentan UN día", () => {
    // `DiaActivo` ya viene agrupado por fecha: es justamente lo que garantiza
    // que dos sesiones del mismo día no cuenten dos veces.
    const serie = seriesDeAdherencia([plan("2026-08-03"), plan("2026-08-04")], 4, "2026-08-05");
    expect(serie).toHaveLength(1);
    expect(serie[0].diasPlan).toBe(2);
  });

  it("una semana vacía en el medio aparece con diasPlan 0", () => {
    const dias = [...semanaCon(L1, 2), ...semanaCon(L3, 3)];
    const serie = seriesDeAdherencia(dias, 3, "2026-08-19");
    expect(serie.map((s) => s.semanaInicio)).toEqual([L1, L2, L3]);
    expect(serie.map((s) => s.diasPlan)).toEqual([2, 0, 3]);
  });

  it("no aparecen semanas anteriores a la primera sesión", () => {
    // Hay movimiento en L1, pero la primera sesión es de L3: la serie arranca ahí.
    const dias = [movimiento("2026-08-04"), ...semanaCon(L3, 2)];
    const serie = seriesDeAdherencia(dias, 3, "2026-08-19");
    expect(serie.map((s) => s.semanaInicio)).toEqual([L3]);
  });

  it("los días de movimiento no suman a diasPlan", () => {
    const dias = [...semanaCon(L1, 2), movimiento("2026-08-06"), movimiento("2026-08-07")];
    const serie = seriesDeAdherencia(dias, 4, "2026-08-08", TODO_CARGADO);
    expect(serie[0].diasPlan).toBe(2);
    expect(serie[0].diasMovimiento).toBe(2);
    expect(serie[0].cumplida).toBe(false);
  });

  it("un día con sesión Y movimiento cuenta como día de plan, no de movimiento", () => {
    const mixto: DiaActivo = {
      fecha: "2026-08-03", shapeUp: true, externaDeclarada: true, autodetectada: false, minutos: 80,
    };
    const serie = seriesDeAdherencia([mixto], 1, "2026-08-04", TODO_CARGADO);
    expect(serie[0].diasPlan).toBe(1);
    expect(serie[0].diasMovimiento).toBe(0);
  });

  it("llega hasta la semana de hoy aunque esté vacía", () => {
    const serie = seriesDeAdherencia(semanaCon(L1, 3), 3, HOY);
    expect(serie.map((s) => s.semanaInicio)).toEqual([L1, L2, L3, L4, L5, L6]);
    expect(serie[serie.length - 1].enCurso).toBe(true);
    expect(serie.filter((s) => s.enCurso)).toHaveLength(1);
  });

  it("sin ninguna sesión la serie va vacía: no hay plan que medir", () => {
    expect(seriesDeAdherencia([movimiento("2026-08-04")], 3, HOY)).toEqual([]);
  });

  it("cumplida es diasPlan >= meta", () => {
    const serie = seriesDeAdherencia(semanaCon(L1, 4), 4, "2026-08-08");
    expect(serie[0].cumplida).toBe(true);
    expect(seriesDeAdherencia(semanaCon(L1, 5), 4, "2026-08-08")[0].cumplida).toBe(true);
    expect(seriesDeAdherencia(semanaCon(L1, 3), 4, "2026-08-08")[0].cumplida).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  rachaActual / rachaRecord
// ════════════════════════════════════════════════════════════════════════════

describe("rachaActual", () => {
  const HOY = "2026-09-09";   // miércoles de L6

  it("la semana en curso incompleta NO la rompe", () => {
    // Tres semanas cumplidas y un miércoles con 1 de 3: la racha sigue en 3.
    const dias = [...semanaCon(L3, 3), ...semanaCon(L4, 3), ...semanaCon(L5, 3), ...semanaCon(L6, 1)];
    const serie = seriesDeAdherencia(dias, 3, HOY);
    expect(serie[serie.length - 1].enCurso).toBe(true);
    expect(serie[serie.length - 1].cumplida).toBe(false);
    expect(rachaActual(serie)).toBe(3);
  });

  it("la semana en curso completa SÍ la suma", () => {
    const dias = [...semanaCon(L4, 3), ...semanaCon(L5, 3), ...semanaCon(L6, 3)];
    expect(rachaActual(seriesDeAdherencia(dias, 3, HOY))).toBe(3);
  });

  it("una semana cerrada incumplida la corta", () => {
    const dias = [...semanaCon(L3, 3), ...semanaCon(L4, 1), ...semanaCon(L5, 3), ...semanaCon(L6, 3)];
    expect(rachaActual(seriesDeAdherencia(dias, 3, HOY))).toBe(2);   // L5 y L6
  });

  it("sin ninguna semana cumplida es 0", () => {
    const dias = [...semanaCon(L5, 1), ...semanaCon(L6, 1)];
    expect(rachaActual(seriesDeAdherencia(dias, 3, HOY))).toBe(0);
  });

  it("serie vacía es 0", () => {
    expect(rachaActual([])).toBe(0);
  });
});

describe("rachaRecord", () => {
  const HOY = "2026-09-09";

  it("con la racha actual siendo el récord", () => {
    const dias = [...semanaCon(L4, 3), ...semanaCon(L5, 3), ...semanaCon(L6, 3)];
    const serie = seriesDeAdherencia(dias, 3, HOY);
    expect(rachaActual(serie)).toBe(3);
    expect(rachaRecord(serie)).toBe(3);
  });

  it("con el récord en el pasado", () => {
    // L1..L3 cumplidas (récord 3), L4 rota, L5 cumplida, L6 en curso incompleta.
    const dias = [
      ...semanaCon(L1, 3), ...semanaCon(L2, 3), ...semanaCon(L3, 3),
      ...semanaCon(L4, 1), ...semanaCon(L5, 3), ...semanaCon(L6, 1),
    ];
    const serie = seriesDeAdherencia(dias, 3, HOY);
    expect(rachaActual(serie)).toBe(1);
    expect(rachaRecord(serie)).toBe(3);
  });

  it("la semana en curso incompleta no corta el récord que venía", () => {
    const dias = [...semanaCon(L4, 3), ...semanaCon(L5, 3), ...semanaCon(L6, 1)];
    expect(rachaRecord(seriesDeAdherencia(dias, 3, HOY))).toBe(2);
  });

  it("serie vacía es 0", () => {
    expect(rachaRecord([])).toBe(0);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  tasaCumplimiento
// ════════════════════════════════════════════════════════════════════════════

describe("tasaCumplimiento", () => {
  /** Serie sintética: `cumplidas` dice qué semanas se cumplieron. */
  function serie(cumplidas: boolean[], conSemanaEnCurso = true): SemanaAdherencia[] {
    return cumplidas.map((c, i) => ({
      semanaInicio: `S-${i}`,
      diasPlan: c ? 3 : 1,
      diasMovimiento: 0,
      meta: 3,
      cumplida: c,
      enCurso: conSemanaEnCurso && i === cumplidas.length - 1,
    }));
  }

  it("null con 3 semanas cerradas: es ruido con apariencia de métrica", () => {
    expect(tasaCumplimiento(serie([true, true, true, false]))).toBeNull();
  });

  it("con 4 cerradas ya devuelve un número", () => {
    const r = tasaCumplimiento(serie([true, true, false, true, false]));
    expect(r).toEqual({ cumplidas: 3, total: 4 });
  });

  it("6 de 8 con 10 semanas de historia", () => {
    // Diez cerradas + la de hoy. Las dos más viejas quedan afuera de la ventana.
    const cerradas = [false, false, true, true, true, true, false, true, true, false];
    const r = tasaCumplimiento([...serie(cerradas, false), ...serie([false])]);
    expect(r).toEqual({ cumplidas: 6, total: 8 });
  });

  it("ignora la semana en curso, cumplida o no", () => {
    const conEnCursoCumplida = serie([true, true, true, true, true]);
    conEnCursoCumplida[4].cumplida = true;
    expect(tasaCumplimiento(conEnCursoCumplida)).toEqual({ cumplidas: 4, total: 4 });
  });

  it("la ventana es configurable", () => {
    const cerradas = serie([true, true, true, false, true, false], false);
    expect(tasaCumplimiento(cerradas, 4)).toEqual({ cumplidas: 2, total: 4 });
  });

  it("serie vacía es null", () => {
    expect(tasaCumplimiento([])).toBeNull();
  });
});


// ════════════════════════════════════════════════════════════════════════════
//  diasMovimiento: null — "no sé" no es cero (P77b)
// ════════════════════════════════════════════════════════════════════════════

describe("seriesDeAdherencia · rango de movimiento", () => {
  const HOY = "2026-09-09";   // miércoles de L6

  it("sin rango, ninguna semana tiene dato de movimiento", () => {
    const dias = [...semanaCon(L5, 2), movimiento("2026-09-02")];
    const serie = seriesDeAdherencia(dias, 3, HOY);
    expect(serie.every((s) => s.diasMovimiento === null)).toBe(true);
  });

  it("dentro del rango se cuenta; afuera queda en null", () => {
    // Movimiento real en L5 y en L6, pero solo L6 está cargada.
    const dias = [...semanaCon(L5, 2), movimiento("2026-09-02"), ...semanaCon(L6, 1), movimiento("2026-09-08")];
    const serie = seriesDeAdherencia(dias, 3, HOY, { desde: L6, hasta: "2026-09-13" });
    const l5 = serie.find((s) => s.semanaInicio === L5)!;
    const l6 = serie.find((s) => s.semanaInicio === L6)!;
    expect(l5.diasMovimiento).toBeNull();
    expect(l6.diasMovimiento).toBe(1);
  });

  it("una semana cargada sin movimiento es 0, no null: eso sí se midió", () => {
    const serie = seriesDeAdherencia(semanaCon(L6, 1), 3, HOY, { desde: L6, hasta: "2026-09-13" });
    expect(serie.find((s) => s.semanaInicio === L6)!.diasMovimiento).toBe(0);
  });

  it("una semana a medias cubierta queda en null, no a medias", () => {
    // El rango arranca el miércoles de L6: la semana no entra entera.
    const dias = [...semanaCon(L6, 1), movimiento("2026-09-10")];
    const serie = seriesDeAdherencia(dias, 3, HOY, { desde: "2026-09-09", hasta: "2026-09-13" });
    expect(serie.find((s) => s.semanaInicio === L6)!.diasMovimiento).toBeNull();
  });

  it("la racha, el récord y la tasa dan IGUAL con y sin movimiento cargado", () => {
    // Es la propiedad que le permite a Home armar la serie entera sin leer
    // /cardio: nada de lo que decide depende del movimiento.
    const dias = [
      ...semanaCon(L1, 3), ...semanaCon(L2, 3), ...semanaCon(L3, 1),
      ...semanaCon(L4, 3), ...semanaCon(L5, 3), ...semanaCon(L6, 3),
      movimiento("2026-08-08"), movimiento("2026-08-22"), movimiento("2026-09-05"),
    ];
    const sin = seriesDeAdherencia(dias, 3, HOY);
    const con = seriesDeAdherencia(dias, 3, HOY, TODO_CARGADO);

    expect(con.map((s) => s.diasPlan)).toEqual(sin.map((s) => s.diasPlan));
    expect(con.map((s) => s.cumplida)).toEqual(sin.map((s) => s.cumplida));
    expect(rachaActual(con)).toBe(rachaActual(sin));
    expect(rachaRecord(con)).toBe(rachaRecord(sin));
    expect(tasaCumplimiento(con)).toEqual(tasaCumplimiento(sin));

    // Y lo único que cambia es el movimiento.
    expect(sin.every((s) => s.diasMovimiento === null)).toBe(true);
    expect(con.some((s) => (s.diasMovimiento ?? 0) > 0)).toBe(true);
  });
});
