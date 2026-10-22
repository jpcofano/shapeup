// P99 (respuesta de Juan del 21/10): una sesión vieja guardada después lleva el
// planSemana del día en que se jugó, no el del día en que se guarda.
import { describe, it, expect } from "vitest";
import {
  INITIAL_ENTRENAR_STATE, sellarPlanSemana, camposPlanSemana, estadoReiniciado, estadoNuevo,
} from "./entrenarState";

const VIERNES_0210 = new Date(2026, 9, 2, 20, 56).getTime();
const MIERCOLES_1510 = new Date(2026, 9, 15, 18, 0).getTime();
const PLAN_DE_ESE_DIA = { metaDias: 6, idPrograma: "PRG-0004" };
const PLAN_DE_HOY = { metaDias: 5, idPrograma: "PRG-0013" };

describe("sellarPlanSemana (P99)", () => {
  it("se sella el día en que arrancó la sesión", () => {
    const s = sellarPlanSemana({ ...INITIAL_ENTRENAR_STATE, inicioMs: VIERNES_0210 }, PLAN_DE_ESE_DIA, VIERNES_0210 + 60_000);
    expect(s.planSemana).toEqual(PLAN_DE_ESE_DIA);
  });

  it("una sesión de otro día no toma el plan de hoy", () => {
    const s = sellarPlanSemana({ ...INITIAL_ENTRENAR_STATE, inicioMs: VIERNES_0210 }, PLAN_DE_HOY, MIERCOLES_1510);
    expect(s.planSemana).toBeNull();
    expect(camposPlanSemana(s)).toEqual({});
  });

  it("una vez sellado no se pisa: la sesión vieja guarda el plan de ese día", () => {
    const deEseDia = sellarPlanSemana({ ...INITIAL_ENTRENAR_STATE, inicioMs: VIERNES_0210 }, PLAN_DE_ESE_DIA, VIERNES_0210);
    const despues = sellarPlanSemana(deEseDia, PLAN_DE_HOY, MIERCOLES_1510);
    expect(camposPlanSemana(despues)).toEqual({ planSemana: PLAN_DE_ESE_DIA });
  });

  it("sin inicio o sin plan, nada", () => {
    expect(sellarPlanSemana(INITIAL_ENTRENAR_STATE, PLAN_DE_HOY).planSemana).toBeNull();
    expect(sellarPlanSemana({ ...INITIAL_ENTRENAR_STATE, inicioMs: MIERCOLES_1510 }, null, MIERCOLES_1510).planSemana).toBeNull();
  });

  it("reiniciar y empezar de nuevo lo sacan: se vuelve a sellar con el día nuevo", () => {
    const s = { ...INITIAL_ENTRENAR_STATE, inicioMs: VIERNES_0210, planSemana: PLAN_DE_ESE_DIA };
    expect(estadoReiniciado(s).planSemana).toBeNull();
    expect(estadoNuevo(s, "SES-NUEVA", null).planSemana).toBeNull();
  });
});
