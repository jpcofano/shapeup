import { describe, it, expect } from "vitest";
import {
  debeSincronizar, puedeConsultarPuente, leerMarcas, guardarMarcas, contarNuevas,
  textoChipSincronizacion, claveMarcas, MIN_ENTRE_SYNC_MS, type Almacen,
} from "./sincronizacionAutomatica";

const H = 60 * 60 * 1000;
const AHORA = Date.UTC(2026, 8, 25, 15, 0);

describe("debeSincronizar", () => {
  it("el puente corrió después de la última importada y pasaron 6 h → sí", () => {
    expect(debeSincronizar({
      ultimaCorridaPuenteMs: AHORA - 1 * H, ultimaImportadaMs: AHORA - 10 * H,
      ultimaAutoMs: AHORA - 7 * H, ahora: AHORA, online: true,
    })).toBe(true);
  });

  it("el puente no corrió desde la última importada → no, aunque hayan pasado días", () => {
    const corrida = AHORA - 72 * H;
    expect(debeSincronizar({
      ultimaCorridaPuenteMs: corrida, ultimaImportadaMs: corrida,
      ultimaAutoMs: AHORA - 72 * H, ahora: AHORA, online: true,
    })).toBe(false);
  });

  it("corrió, pero hace 2 h que sincronizamos → no", () => {
    expect(debeSincronizar({
      ultimaCorridaPuenteMs: AHORA - 1 * H, ultimaImportadaMs: AHORA - 10 * H,
      ultimaAutoMs: AHORA - 2 * H, ahora: AHORA, online: true,
    })).toBe(false);
  });

  it("sin conexión → no", () => {
    expect(debeSincronizar({
      ultimaCorridaPuenteMs: AHORA - 1 * H, ultimaImportadaMs: AHORA - 10 * H,
      ultimaAutoMs: AHORA - 7 * H, ahora: AHORA, online: false,
    })).toBe(false);
  });

  it("sin marca local (primera vez en esta máquina) y el puente tiene corrida → sí", () => {
    expect(debeSincronizar({ ultimaCorridaPuenteMs: AHORA - 1 * H, ahora: AHORA, online: true })).toBe(true);
  });

  it("sin ultimaCorridaMs (el puente nunca corrió) → no", () => {
    expect(debeSincronizar({ ahora: AHORA, online: true })).toBe(false);
    expect(debeSincronizar({ ultimaCorridaPuenteMs: null, ahora: AHORA, online: true })).toBe(false);
  });

  it("justo en el límite de 6 h ya corresponde", () => {
    expect(debeSincronizar({
      ultimaCorridaPuenteMs: AHORA - 1, ultimaImportadaMs: AHORA - 10 * H,
      ultimaAutoMs: AHORA - MIN_ENTRE_SYNC_MS, ahora: AHORA, online: true,
    })).toBe(true);
  });
});

describe("puedeConsultarPuente", () => {
  it("con una sincronización reciente ni siquiera se pregunta", () => {
    expect(puedeConsultarPuente({ ultimaAutoMs: AHORA - 1 * H, ahora: AHORA, online: true })).toBe(false);
  });
  it("sin señal tampoco", () => {
    expect(puedeConsultarPuente({ ahora: AHORA, online: false })).toBe(false);
  });
  it("primera vez, con señal → se pregunta", () => {
    expect(puedeConsultarPuente({ ahora: AHORA, online: true })).toBe(true);
  });
});

function almacenMemoria(): Almacen & { datos: Map<string, string> } {
  const datos = new Map<string, string>();
  return { datos, getItem: (k) => datos.get(k) ?? null, setItem: (k, v) => { datos.set(k, v); } };
}

describe("marcas", () => {
  it("se guardan por uid y se mezclan", () => {
    const a = almacenMemoria();
    guardarMarcas(a, "u1", { ultimaImportadaMs: 10 });
    guardarMarcas(a, "u1", { ultimaAutoMs: 20 });
    guardarMarcas(a, "u2", { ultimaAutoMs: 99 });
    expect(leerMarcas(a, "u1")).toEqual({ ultimaImportadaMs: 10, ultimaAutoMs: 20 });
    expect(leerMarcas(a, "u2")).toEqual({ ultimaAutoMs: 99 });
  });

  it("un JSON roto o un almacén que tira se leen como sin marcas, sin tirar", () => {
    const a = almacenMemoria();
    a.datos.set(claveMarcas("u1"), "{roto");
    expect(leerMarcas(a, "u1")).toEqual({});
    const tira: Almacen = { getItem: () => { throw new Error("bloqueado"); }, setItem: () => { throw new Error("bloqueado"); } };
    expect(leerMarcas(tira, "u1")).toEqual({});
    expect(() => guardarMarcas(tira, "u1", { ultimaAutoMs: 1 })).not.toThrow();
    expect(leerMarcas(null, "u1")).toEqual({});
  });
});

describe("contarNuevas", () => {
  it("cuenta las que no estaban en el lote anterior", () => {
    expect(contarNuevas(["a", "b", "c", "d"], ["a", "b"])).toBe(2);
    expect(contarNuevas(["a", "b"], ["a", "b"])).toBe(0);
  });
  it("sin lote anterior no se sabe: null", () => {
    expect(contarNuevas(["a", "b"], undefined)).toBeNull();
  });
});

describe("textoChipSincronizacion", () => {
  it("corriendo", () => {
    expect(textoChipSincronizacion({ fase: "corriendo" })).toBe("Sincronizando salud…");
  });
  it("con actividades nuevas", () => {
    expect(textoChipSincronizacion({ fase: "lista", nuevas: 3, conBiometria: 0 }))
      .toBe("Salud al día · 3 actividades nuevas");
    expect(textoChipSincronizacion({ fase: "lista", nuevas: 1, conBiometria: 1 }))
      .toBe("Salud al día · 1 actividad nueva · 1 sesión con biometría");
  });
  it("sin nada nuevo, silencio", () => {
    expect(textoChipSincronizacion({ fase: "lista", nuevas: 0, conBiometria: 0 })).toBeNull();
    expect(textoChipSincronizacion({ fase: "lista", nuevas: null, conBiometria: 0 })).toBeNull();
    expect(textoChipSincronizacion({ fase: "inactiva" })).toBeNull();
  });
  it("fallo, en una línea sin dramatismo", () => {
    expect(textoChipSincronizacion({ fase: "fallo", motivo: "cuota" }))
      .toBe("No se pudo sincronizar — probá desde Salud");
  });
});
