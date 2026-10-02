// P98 — la sesión de una rutina de VR por escalones: se sella el escalón al
// empezar, se cierra con un toque y el registro guarda el juego que se jugó.
import { describe, it, expect } from "vitest";
import {
  INITIAL_ENTRENAR_STATE, sellarEscalonVR, cerrarPorTiempo, vrEscalonCerrado, indiceBloqueVR,
  construirBloquesRegistro,
} from "./entrenarState";
import { RUTINAS_VR, RUT_RITMO_SUAVE, RUT_COMBAT_LARGO, EJ_POWERBEATS } from "./catalogoVR";
import type { Rutina } from "../types/models";

const RITMO = RUTINAS_VR.find((r) => r.idRutina === RUT_RITMO_SUAVE)! as Rutina;
const COMBAT = RUTINAS_VR.find((r) => r.idRutina === RUT_COMBAT_LARGO)! as Rutina;
const ESC = {
  modo: "corrido" as const, escalon: 1, idEjercicio: EJ_POWERBEATS, nombreEjercicio: "PowerBeatsVR (VR)",
  prescripto: RITMO.vr!.escaleras.corrido![0],
};

describe("VR por escalones en la sesión (P98)", () => {
  it("sellar el escalón arranca el reloj, y no se vuelve a sellar", () => {
    const s = sellarEscalonVR({ ...INITIAL_ENTRENAR_STATE, inicioMs: 100 }, ESC, 500);
    expect(s.vrEscalon).toEqual(ESC);
    expect(s.vrInicioMs).toBe(500);
    expect(sellarEscalonVR(s, { ...ESC, escalon: 2 }, 900)).toBe(s);
  });
  it("«Terminar» registra una sola serie, de Empezar a Terminar, y pasa al cierre", () => {
    const s = sellarEscalonVR({ ...INITIAL_ENTRENAR_STATE, inicioMs: 100 }, ESC, 500);
    expect(vrEscalonCerrado(s, RITMO)).toBe(false);
    const c = cerrarPorTiempo(s, RITMO, 30 * 60_000 + 500);
    expect(c.registro[indiceBloqueVR(RITMO)]).toEqual([{ serie: 1, completada: true, inicioMs: 500, finMs: 30 * 60_000 + 500 }]);
    expect(vrEscalonCerrado(c, RITMO)).toBe(true);
  });
  it("el bloque guarda el juego que se jugó, si se eligió la alternativa", () => {
    const s = cerrarPorTiempo(sellarEscalonVR(INITIAL_ENTRENAR_STATE, ESC, 0), RITMO, 60_000);
    const [b] = construirBloquesRegistro(s, RITMO);
    expect([b.idEjercicio, b.nombreEjercicio]).toEqual([EJ_POWERBEATS, "PowerBeatsVR (VR)"]);
    expect(b.prescripcionUsada).toBeUndefined();   // eso es de P79
  });
  it("con el juego de la rutina, el bloque queda como está", () => {
    const esc = { ...ESC, idEjercicio: COMBAT.vr!.idEjercicio, nombreEjercicio: "x", modo: "bloques" as const, prescripto: COMBAT.vr!.escaleras.bloques![0] };
    const s = cerrarPorTiempo(sellarEscalonVR(INITIAL_ENTRENAR_STATE, esc, 0), COMBAT, 60_000);
    expect(construirBloquesRegistro(s, COMBAT)[0].nombreEjercicio).toBe(COMBAT.bloques[0].nombreEjercicio);
  });
});
