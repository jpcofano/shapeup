// ════════════════════════════════════════════════════════════════════════════
//  diasActivos.test.ts — cuánto se lee de Firestore para la serie (P77b).
//
//  Lo que se prueba acá es cuántas veces se consulta, no qué se devuelve: es
//  el punto que hizo falta corregir de P77a, donde Home pasó de ~25 a ~300
//  lecturas por visita.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {} }));

/** Documentos de /historial que devuelve la consulta de rango. */
let docsHistorial: Record<string, unknown>[] = [];
/** Páginas que va a devolver `getCardioRango`, en orden. */
let paginas: { sesiones: Record<string, unknown>[]; siguienteCursor: unknown }[] = [];
let llamadasCardio: { desde?: string; hasta?: string }[] = [];
let llamadasHistorial = 0;

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
  getDocFromServer: vi.fn(),
  getDocs: vi.fn(() => {
    llamadasHistorial++;
    return Promise.resolve({ docs: docsHistorial.map((d) => ({ data: () => d })) });
  }),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  limit: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => ({})),
  updateDoc: vi.fn(),
  writeBatch: vi.fn(),
}));

vi.mock("./salud", () => ({
  getCardioRango: vi.fn((_m: string, opciones: { desde?: string; hasta?: string }) => {
    llamadasCardio.push({ desde: opciones?.desde, hasta: opciones?.hasta });
    const pagina = paginas.shift() ?? { sesiones: [], siguienteCursor: null };
    return Promise.resolve({ ok: true, value: pagina });
  }),
}));

const { getDiasActivos, cargarDiasActivosConCache } = await import("./historial");
const { limpiarCacheDiasActivos } = await import("../lib/cacheDiasActivos");

/** Doble de `localStorage`. */
class StorageFalso {
  private datos = new Map<string, string>();
  get length() { return this.datos.size; }
  key(i: number) { return [...this.datos.keys()][i] ?? null; }
  getItem(k: string) { return this.datos.get(k) ?? null; }
  setItem(k: string, v: string) { this.datos.set(k, v); }
  removeItem(k: string) { this.datos.delete(k); }
}

beforeEach(() => {
  docsHistorial = [];
  paginas = [];
  llamadasCardio = [];
  llamadasHistorial = 0;
  vi.stubGlobal("localStorage", new StorageFalso());
  limpiarCacheDiasActivos();
});

// ── El tope de paginado ────────────────────────────────────────────────────

describe("getDiasActivos · truncado (P77b)", () => {
  it("con una sola página no está truncado", async () => {
    paginas = [{ sesiones: [], siguienteCursor: null }];
    const r = await getDiasActivos("juanpablo", "2026-09-07", "2026-09-13");
    expect(r.ok && r.value.truncado).toBe(false);
    expect(llamadasCardio).toHaveLength(1);
  });

  it("avisa cuando se alcanza el tope de páginas, en vez de truncar en silencio", async () => {
    // Todas las páginas vienen llenas y con cursor: nunca termina.
    paginas = Array.from({ length: 20 }, () => ({
      sesiones: [{ fecha: "2026-09-08", idCardio: "CAR-x", duracionMin: 30 }],
      siguienteCursor: {},
    }));
    const r = await getDiasActivos("juanpablo", "2026-06-01", "2026-09-13");
    expect(r.ok && r.value.truncado).toBe(true);
    expect(llamadasCardio).toHaveLength(10);   // el tope
  });
});

// ── La caché de semanas cerradas ───────────────────────────────────────────

describe("cargarDiasActivosConCache (P77b)", () => {
  const HOY = "2026-09-16";          // miércoles
  const SEMANA_HOY = "2026-09-14";
  const DESDE = "2026-08-31";        // tres semanas: 31/8, 7/9, 14/9

  /** Una página por cada llamada, siempre la última. */
  function paginaVacia() {
    paginas = Array.from({ length: 5 }, () => ({ sesiones: [], siguienteCursor: null }));
  }

  it("la primera vez lee desde la semana más vieja", async () => {
    paginaVacia();
    const r = await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    expect(r.ok).toBe(true);
    expect(llamadasCardio[0].desde).toBe(DESDE);
  });

  it("la segunda vez solo pide la semana en curso: las cerradas salen de la caché", async () => {
    paginaVacia();
    await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    llamadasCardio = [];
    llamadasHistorial = 0;
    paginaVacia();

    await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    expect(llamadasCardio).toHaveLength(1);
    expect(llamadasCardio[0].desde).toBe(SEMANA_HOY);   // no la de tres semanas atrás
    expect(llamadasHistorial).toBe(1);
  });

  it("la semana en curso se pide SIEMPRE, aunque las otras estén cacheadas", async () => {
    paginaVacia();
    await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    for (let i = 0; i < 3; i++) {
      llamadasCardio = [];
      paginaVacia();
      await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
      expect(llamadasCardio).toHaveLength(1);
      expect(llamadasCardio[0].desde).toBe(SEMANA_HOY);
    }
  });

  it("después de limpiar la caché vuelve a leer todo el rango", async () => {
    paginaVacia();
    await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    limpiarCacheDiasActivos();
    llamadasCardio = [];
    paginaVacia();

    await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    expect(llamadasCardio[0].desde).toBe(DESDE);
  });

  it("los días cacheados se devuelven junto con los recién leídos", async () => {
    docsHistorial = [];
    paginas = [{
      sesiones: [
        { fecha: "2026-09-01", idCardio: "CAR-a", duracionMin: 40, autodetectada: false },
        { fecha: "2026-09-15", idCardio: "CAR-b", duracionMin: 50, autodetectada: false },
      ],
      siguienteCursor: null,
    }];
    const primera = await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    expect(primera.ok && primera.value.dias.map((d) => d.fecha)).toEqual(["2026-09-01", "2026-09-15"]);

    // Segunda vuelta: la semana vieja sale de la caché, la de hoy se relee.
    paginas = [{
      sesiones: [{ fecha: "2026-09-15", idCardio: "CAR-b", duracionMin: 50, autodetectada: false }],
      siguienteCursor: null,
    }];
    const segunda = await cargarDiasActivosConCache("juanpablo", DESDE, HOY);
    expect(segunda.ok && segunda.value.dias.map((d) => d.fecha)).toEqual(["2026-09-01", "2026-09-15"]);
  });
});
