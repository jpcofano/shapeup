import { describe, it, expect, afterEach } from "vitest";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { PuentePanel } from "./PuentePanel";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
afterEach(() => { act(() => root?.unmount()); root = null; });

function montar(props: Partial<Parameters<typeof PuentePanel>[0]>) {
  const div = document.createElement("div");
  root = createRoot(div);
  const ahora = new Date(2026, 8, 25, 16, 0).getTime();
  act(() => root!.render(createElement(PuentePanel, {
    estado: { ultimaCorridaMs: new Date(2026, 8, 25, 12, 40).getTime(), subidos: 4 },
    ahora, sincronizando: false, onSincronizar: () => {},
    ...props,
  })));
  return div;
}

describe("PuentePanel (P88)", () => {
  it("separa lo que subió el reloj de lo que importó la app, y muestra la importación manual", () => {
    const div = montar({ ultimaImportacion: { ms: new Date(2026, 8, 25, 14, 10).getTime(), tipo: "manual", actividades: 91 } });
    const t = div.textContent ?? "";
    expect(t).toContain("Del reloj");
    expect(t).toContain("El puente subió datos el 25/09 12:40");
    expect(t).toContain("A la app");
    expect(t).toContain("Última importación: 25/09 14:10 · a mano · 91 actividades guardadas");
  });

  it("sin importaciones en este dispositivo lo dice", () => {
    expect(montar({}).textContent).toContain("Todavía no se importó nada desde este dispositivo.");
  });

  it("avisa cuando la sesión todavía no llegó del reloj", () => {
    const aviso = "Tu sesión de hoy todavía no llegó del reloj — el puente sube cada 6 horas.";
    expect(montar({ sesionSinLlegar: aviso }).textContent).toContain(aviso);
    expect(montar({ sesionSinLlegar: null }).textContent).not.toContain("todavía no llegó");
  });
});

describe("PuentePanel (P89)", () => {
  const PEDIDO_MS = new Date(2026, 8, 25, 15, 50).getTime();

  it("muestra el último pedido y que el reloj respondió", () => {
    const div = montar({
      estado: { ultimaCorridaMs: PEDIDO_MS + 20_000 },
      pedido: { pedidoMs: PEDIDO_MS, origen: "boton" },
    });
    expect(div.textContent).toContain("Último pedido al reloj: 25/09 15:50 (desde el botón) · respondió");
    expect(div.textContent).not.toContain("ahorro de batería");
  });

  it("sin respuesta hace rato: nombra la causa probable", () => {
    const div = montar({
      pedido: { pedidoMs: new Date(2026, 8, 25, 15, 0).getTime(), origen: "fin-sesion" },
    });
    expect(div.textContent).toContain("sin respuesta");
    expect(div.textContent).toContain("El teléfono puede tener la app del puente detenida o con ahorro de batería.");
  });

  it("el botón dice en qué paso está", () => {
    expect(montar({ fase: "pidiendo" }).textContent).toContain("Pidiéndole los datos al reloj…");
    expect(montar({ fase: "importando" }).textContent).toContain("Importando…");
  });
});
