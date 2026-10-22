// P103 — la tarjeta de revisión de la FC máxima muestra, en las sesiones que no
// se usaron, el pico crudo (el que dispara la regla) y el suavizado.
import { describe, it, expect, vi, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { BiometriaSesion, Historial, PerfilMiembro } from "../../types/models";
import { ymdLocal } from "../../lib/semana";

vi.mock("../../data/perfiles", () => ({ actualizarPerfil: vi.fn() }));

import { RevisionFcMax } from "./RevisionFcMax";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

const hace = (dias: number) => ymdLocal(new Date(Date.now() - dias * 86_400_000));
const sesion = (id: string, dias: number, b: Partial<BiometriaSesion>, nombre: string) => ({
  idHist: id, fechaRealizada: hace(dias), nombreRutina: nombre,
  biometria: { coberturaFina: 0.95, ...b } as BiometriaSesion,
}) as Historial;

describe("RevisionFcMax (P103)", () => {
  it("en las excluidas muestra el pico crudo y el suavizado", () => {
    const historial = [
      sesion("a", 2, { fcDudosa: true, fcMax: 184, fcPicoSuavizado: 176, fcMaxUsada: 169 }, "VR — Combat largo"),
      sesion("b", 5, { fcPicoSuavizado: 168, fcMax: 170 }, "VR — Creed"),
      sesion("c", 9, { fcPicoSuavizado: 165, fcMax: 166 }, "VR — Creed"),
    ];
    const div = document.createElement("div");
    root = createRoot(div);
    act(() => root!.render(createElement(RevisionFcMax, {
      miembro: "juanpablo", perfil: { fcMaxTeorica: 169 } as PerfilMiembro, historial, onGuardado: vi.fn(),
    })));
    expect(div.textContent).toContain("Sesiones que no se usaron");
    expect(div.textContent).toMatch(/VR — Combat largo · pico 184 crudo, 176 suavizado · pico > vigente \+ 10/);
  });
});
