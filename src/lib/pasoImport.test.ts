// ════════════════════════════════════════════════════════════════════════════
//  pasoImport.test.ts — que el import no mienta (P76b).
//
//  El caso real detrás de estos tests: el import del ZIP dijo que iba a
//  escribir 2257 entradas externas, no escribió ninguna y no mostró ningún
//  error. Cada test de acá es una de las formas en que eso podía pasar.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { correrPaso, resumirPasos, type PasoImport } from "./pasoImport";
import { ok, err, MSG_CUOTA_AGOTADA } from "./result";

const OK = (importados: number, omitidos = 0) =>
  () => Promise.resolve(ok({ importados, omitidos }));

describe("correrPaso", () => {
  it("reporta lo escrito, no lo que se le mandó", async () => {
    const p = await correrPaso("actividades", OK(7), 10);
    expect(p.escritos).toBe(7);
    expect(p.error).toBeUndefined();
    expect(p.enCola).toBe(false);
  });

  it("con cero documentos no llama a nada ni inventa un éxito", async () => {
    let llamadas = 0;
    const p = await correrPaso("sueño", () => { llamadas++; return OK(99)(); }, 0);
    expect(p).toEqual({ nombre: "sueño", escritos: 0, enCola: false });
    expect(llamadas).toBe(0);
  });

  it("un rechazo por documento es un error, no un omitido silencioso", async () => {
    const p = await correrPaso("actividades", () => Promise.resolve(ok({
      importados: 0, omitidos: 3, fallidos: 3, primerError: MSG_CUOTA_AGOTADA,
    })), 3);
    expect(p.escritos).toBe(0);
    expect(p.error).toContain("3 de 3 no se guardaron");
    expect(p.error).toContain("cuota diaria");
  });

  it("un fallo del batch entero se propaga", async () => {
    const p = await correrPaso("mediciones", () => Promise.resolve(err("permission-denied")), 5);
    expect(p.escritos).toBe(0);
    expect(p.error).toBe("permission-denied");
  });

  it("una excepción inesperada no tumba el import", async () => {
    const p = await correrPaso("métricas", () => Promise.reject(new Error("boom")), 2);
    expect(p.error).toBe("boom");
    expect(p.escritos).toBe(0);
  });

  it("el timeout devuelve 'en cola' y no cuelga", async () => {
    // La promesa no resuelve nunca: es exactamente lo que hace una escritura
    // con caché persistente cuando el servidor no confirma.
    const nuncaResuelve = () => new Promise<never>(() => {});
    const p = await correrPaso("actividades", nuncaResuelve, 2257, 10);
    expect(p.enCola).toBe(true);
    expect(p.escritos).toBe(2257);
    expect(p.error).toBeUndefined();
  });
});

describe("resumirPasos", () => {
  const paso = (nombre: string, escritos: number, extra: Partial<PasoImport> = {}): PasoImport =>
    ({ nombre, escritos, enCola: false, ...extra });

  it("suma lo escrito de todos los pasos", () => {
    expect(resumirPasos([paso("a", 3), paso("b", 4)]).escritos).toBe(7);
  });

  it("si un paso falla después de que otro escribió, dice qué quedó guardado", () => {
    const r = resumirPasos([paso("actividades", 2562), paso("mediciones", 0, { error: "permission-denied" })]);
    expect(r.escritos).toBe(2562);
    expect(r.fallados).toHaveLength(1);
    expect(r.sufijo).toContain("Falló mediciones");
    expect(r.sufijo).toContain("permission-denied");
  });

  it("lo que quedó en cola se nombra aparte y no se cuenta como error", () => {
    const r = resumirPasos([paso("actividades", 100, { enCola: true })]);
    expect(r.fallados).toHaveLength(0);
    expect(r.sufijo).toContain("quedó en cola");
  });

  it("sin fallos ni cola, el sufijo va vacío", () => {
    expect(resumirPasos([paso("a", 1)]).sufijo).toBe("");
  });
});
