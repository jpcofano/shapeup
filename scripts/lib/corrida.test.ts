import { describe, it, expect, vi } from "vitest";
import { crearCorrida, type OpcionesCorrida } from "./corrida";

function armar(argv: string[], extra: Partial<OpcionesCorrida> = {}) {
  const lineas: string[] = [];
  const archivos = new Map<string, string>();
  const c = crearCorrida({
    nombre: "prueba",
    argv,
    log: (l) => lineas.push(l),
    escribirArchivo: (ruta, contenido) => { archivos.set(ruta, contenido); },
    dirRespaldos: "/tmp/respaldos",
    ahora: () => new Date("2026-09-25T12:00:00Z"),
    ...extra,
  });
  return { c, lineas, archivos, salida: () => lineas.join("\n") };
}

describe("simulación", () => {
  it("no escribe, no hace respaldo y nunca dice 'escritas'", async () => {
    const { c, archivos, salida } = armar([]);
    const fn = vi.fn(() => Promise.resolve());
    expect(c.aplicar).toBe(false);
    expect(c.abrirRespaldo({ a: 1 })).toBe(true);
    await c.escribir("A", fn);
    await c.escribir("B", fn, 3);
    c.omitir("C", "ya estaba");
    const codigo = c.resumen();

    expect(fn).not.toHaveBeenCalled();
    expect(archivos.size).toBe(0);
    expect(codigo).toBe(0);
    expect(salida()).toContain("se escribirían: 4 · omitidas: 1");
    expect(salida()).not.toMatch(/escritas/i);
    expect(salida()).not.toMatch(/✓/);
  });
});

describe("aplicar", () => {
  it("escribe el respaldo antes de la primera escritura, y lo nombra en la línea final", async () => {
    const orden: string[] = [];
    const { c, archivos, salida } = armar(["--aplicar"], {
      escribirArchivo: (ruta, contenido) => { orden.push("respaldo"); archivos.set(ruta, contenido); },
    });
    expect(c.abrirRespaldo([{ id: "A", viejo: 1 }])).toBe(true);
    await c.escribir("A", async () => { orden.push("A"); });
    expect(c.resumen()).toBe(0);
    expect(orden).toEqual(["respaldo", "A"]);
    const [ruta] = [...archivos.keys()];
    expect(ruta).toMatch(/respaldo-prueba-2026-09-25T12-00-00-000Z\.json$/);
    expect(salida()).toContain(`escritas: 1 · fallidas: 0 · omitidas: 0 · respaldo en ${ruta}`);
  });

  it("si falla una escritura la cuenta, sigue con las demás y sale con código 1", async () => {
    const { c, salida } = armar(["--aplicar"]);
    c.sinRespaldo("prueba");
    const b = vi.fn(() => Promise.resolve());
    await c.escribir("A", () => Promise.reject(new Error("PERMISSION_DENIED")));
    await c.escribir("B", b, 2);
    expect(b).toHaveBeenCalled();
    expect(c.resumen()).toBe(1);
    expect(salida()).toContain("✗ A: PERMISSION_DENIED");
    expect(salida()).toContain("escritas: 2 · fallidas: 1 · omitidas: 0 · sin respaldo (prueba)");
  });

  it("si no se puede escribir el respaldo, no se toca Firestore", async () => {
    const { c, salida } = armar(["--aplicar"], {
      escribirArchivo: () => { throw new Error("EACCES"); },
    });
    const fn = vi.fn(() => Promise.resolve());
    expect(c.abrirRespaldo({})).toBe(false);
    await c.escribir("A", fn);
    expect(fn).not.toHaveBeenCalled();
    expect(c.resumen()).toBe(1);
    expect(salida()).toContain("No se toca Firestore");
    expect(salida()).toContain("escritas: 0 · fallidas: 1");
  });

  it("escribir sin respaldo ni sinRespaldo() es un error del script: no escribe", async () => {
    const { c, salida } = armar(["--aplicar"]);
    const fn = vi.fn(() => Promise.resolve());
    await c.escribir("A", fn);
    expect(fn).not.toHaveBeenCalled();
    expect(c.resumen()).toBe(1);
    expect(salida()).toContain("sin abrir el respaldo");
  });
});
