// P93 — el validador del JSON que vuelve del chat. Es dato externo.
import { describe, it, expect } from "vitest";
import { validarAnalisisSesion, extraerObjeto, contarOraciones, TOPES_ANALISIS } from "./validarAnalisis";
import { analisisParaGuardar, VERSION_ESQUEMA_ANALISIS } from "./analisis";

const ID = "H-20260927-1790539057188";

function base(extra: Record<string, unknown> = {}) {
  return {
    version: VERSION_ESQUEMA_ANALISIS, tipo: "sesion", idHist: ID, generadoEn: "2026-09-30", modelo: "modelo de prueba",
    resumen: "Sesión de VR sostenida en Z4.",
    hallazgos: [{ tema: "intensidad", detalle: "Casi toda la sesión en Z4.", evidencia: "Z4 27,7 de 49 min", confianza: "alta" }],
    sugerencias: [{ accion: "Mantener la duración", porque: "La recuperación fue buena", cuando: "proxima-sesion" }],
    banderas: [{ tipo: "dato-dudoso", detalle: "El pico de 170 supera la FC máxima teórica." }],
    preguntas: ["¿La sesión se cortó antes por algo?"],
    datosFaltantes: ["FC de reposo del día"],
    ...extra,
  };
}
const json = (o: unknown) => JSON.stringify(o);

describe("validarAnalisisSesion", () => {
  it("el caso feliz", () => {
    const r = validarAnalisisSesion(json(base()), ID);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.contenido.hallazgos[0]).toEqual(base().hallazgos[0]);
    expect(r.value.descartados).toEqual([]);
    expect(r.value.recuperadoDeTexto).toBe(false);
  });

  it("un análisis de otra sesión se rechaza, con el mensaje explícito", () => {
    const r = validarAnalisisSesion(json(base({ idHist: "H-20260920-1789946718638" })), ID);
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/^Este análisis es de otra sesión/) });
  });

  it("un hallazgo sin evidencia se rechaza, y dice cuál", () => {
    const sin = base({ hallazgos: [{ tema: "x", detalle: "y", confianza: "alta" }] });
    const r = validarAnalisisSesion(json(sin), ID);
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/^hallazgos\[0\]\.evidencia: falta/) });
    const vacia = base({ hallazgos: [{ tema: "x", detalle: "y", evidencia: "   " }] });
    expect(validarAnalisisSesion(json(vacia), ID).ok).toBe(false);
  });

  it("un campo de más se descarta y no se guarda", () => {
    const r = validarAnalisisSesion(json(base({
      tonelajeKg: 99999, racha: 50,
      hallazgos: [{ ...base().hallazgos[0], nuevaMeta: 7 }],
    })), ID);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.descartados).toEqual(["tonelajeKg", "racha", "hallazgos[0].nuevaMeta"]);
    const guardado = analisisParaGuardar(r.value, {}, 1);
    expect(guardado).not.toHaveProperty("tonelajeKg");
    expect(guardado).not.toHaveProperty("racha");
    expect(guardado.hallazgos[0]).not.toHaveProperty("nuevaMeta");
  });

  it("con texto alrededor del JSON, se recupera el objeto", () => {
    const pegado = `Acá va el análisis:\n\`\`\`json\n${json(base())}\n\`\`\`\nCualquier cosa, avisame.`;
    const r = validarAnalisisSesion(pegado, ID);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.recuperadoDeTexto).toBe(true);
  });

  it("una llave adentro de un string no corta el objeto", () => {
    const o = base({ resumen: "Una llave } suelta y otra {" });
    expect(extraerObjeto(`hola ${json(o)} chau`)).toBe(json(o));
  });

  it("un JSON roto da un error legible", () => {
    const r = validarAnalisisSesion(`{"version": 1, "tipo": "sesion", "idHist": "${ID}",`, ID);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/JSON/);
    expect(validarAnalisisSesion("", ID)).toEqual({ ok: false, error: "No pegaste nada." });
  });

  it("un campo larguísimo se rechaza, con el campo y el tope", () => {
    const r = validarAnalisisSesion(json(base({ resumen: "x".repeat(TOPES_ANALISIS.resumen + 1) })), ID);
    expect(r).toEqual({ ok: false, error: expect.stringMatching(new RegExp(`^resumen: es demasiado largo .*${TOPES_ANALISIS.resumen}`)) });
  });

  it("demasiados hallazgos se rechazan", () => {
    const muchos = Array.from({ length: TOPES_ANALISIS.hallazgos + 1 }, () => base().hallazgos[0]);
    expect(validarAnalisisSesion(json(base({ hallazgos: muchos })), ID).ok).toBe(false);
  });

  it("un <script> se guarda como texto, sin tocarlo", () => {
    const xss = "<script>alert('x')</script>";
    const r = validarAnalisisSesion(json(base({ resumen: xss })), ID);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.contenido.resumen).toBe(xss);
  });

  it("la confianza es la que dijo el análisis; una inventada se rechaza", () => {
    const r = validarAnalisisSesion(json(base({ hallazgos: [{ ...base().hallazgos[0], confianza: "total" }] })), ID);
    expect(r.ok).toBe(false);
  });

  it("una bandera de tipo desconocido se rechaza", () => {
    const r = validarAnalisisSesion(json(base({ banderas: [{ tipo: "diagnostico", detalle: "x" }] })), ID);
    expect(r).toEqual({ ok: false, error: expect.stringMatching(/^banderas\[0\]\.tipo/) });
  });

  it("versión o tipo equivocados se rechazan", () => {
    // El esquema 1 (prompt v1/v2) ya no se acepta: el paquete pide el vigente.
    expect(validarAnalisisSesion(json(base({ version: 1 })), ID).ok).toBe(false);
    expect(validarAnalisisSesion(json(base({ tipo: "global" })), ID).ok).toBe(false);
  });

  it("el eco de `armado` se toma si viene bien formado; si no, se arma al cargar", () => {
    const armado = { versionPrompt: 1, versionEsquema: 1, ventana: { inicioMs: 1, finMs: 2 }, versionEnriquecimiento: 7 };
    const conEco = validarAnalisisSesion(json(base({ armado })), ID);
    expect(conEco.ok && conEco.value.armadoEco).toEqual(armado);
    const g = conEco.ok ? analisisParaGuardar(conEco.value, {}, 5) : null;
    expect(g).toMatchObject({ armado, armadoOrigen: "eco", cargadoMs: 5 });

    const sinEco = validarAnalisisSesion(json(base({ armado: "copiá el objeto" })), ID);
    expect(sinEco.ok && sinEco.value.armadoEco).toBeNull();
    const sesion = { inicioMs: 10, finMs: 20 };
    const g2 = sinEco.ok ? analisisParaGuardar(sinEco.value, sesion, 5) : null;
    expect(g2).toMatchObject({ armadoOrigen: "carga", armado: { ventana: { inicioMs: 10, finMs: 20 }, versionEnriquecimiento: null } });
  });
});

// ── Topes del prompt v3 (enmienda de P93): el esquema los hace cumplir ───────

describe("topes del prompt v3", () => {
  const h = base().hallazgos[0];
  const sug = base().sugerencias[0];

  it("los topes son los del v3", () => {
    expect(TOPES_ANALISIS).toMatchObject({ hallazgos: 4, sugerencias: 2, preguntas: 2, resumenOraciones: 3 });
  });

  it("justo en el tope pasa", () => {
    const r = validarAnalisisSesion(json(base({
      resumen: "Hiciste 49 min de VR. La mayor parte en Z4. La FC bajó bien al final.",
      hallazgos: [h, h, h, h], sugerencias: [sug, sug], preguntas: ["a", "b"],
      datosFaltantes: Array.from({ length: TOPES_ANALISIS.datosFaltantes }, (_, i) => `dato ${i}`),
    })), ID);
    expect(r.ok).toBe(true);
  });

  it("5 hallazgos se rechazan", () => {
    expect(validarAnalisisSesion(json(base({ hallazgos: [h, h, h, h, h] })), ID))
      .toEqual({ ok: false, error: expect.stringMatching(/^hallazgos: tiene 5 elementos; el máximo es 4/) });
  });

  it("3 sugerencias se rechazan", () => {
    expect(validarAnalisisSesion(json(base({ sugerencias: [sug, sug, sug] })), ID))
      .toEqual({ ok: false, error: expect.stringMatching(/^sugerencias: tiene 3 elementos; el máximo es 2/) });
  });

  it("3 preguntas se rechazan", () => {
    expect(validarAnalisisSesion(json(base({ preguntas: ["a", "b", "c"] })), ID))
      .toEqual({ ok: false, error: expect.stringMatching(/^preguntas: tiene 3 elementos; el máximo es 2/) });
  });

  it("un resumen de 4 oraciones se rechaza", () => {
    const r = validarAnalisisSesion(json(base({ resumen: "Uno. Dos. Tres. Cuatro." })), ID);
    expect(r).toEqual({ ok: false, error: "resumen: tiene 4 oraciones; tiene que ser de 2 o 3" });
  });

  it("datos faltantes: de más, o uno largo, se rechazan; bien, se guardan", () => {
    const muchos = Array.from({ length: TOPES_ANALISIS.datosFaltantes + 1 }, () => "x");
    expect(validarAnalisisSesion(json(base({ datosFaltantes: muchos })), ID).ok).toBe(false);
    expect(validarAnalisisSesion(json(base({ datosFaltantes: ["x".repeat(TOPES_ANALISIS.datoFaltante + 1)] })), ID).ok).toBe(false);
    const r = validarAnalisisSesion(json(base()), ID);
    expect(r.ok && r.value.contenido.datosFaltantes).toEqual(["FC de reposo del día"]);
  });

  it("sin datosFaltantes queda una lista vacía", () => {
    const { datosFaltantes: _d, ...sin } = base();
    const r = validarAnalisisSesion(json(sin), ID);
    expect(r.ok && r.value.contenido.datosFaltantes).toEqual([]);
  });

  it("contarOraciones no corta en un decimal", () => {
    expect(contarOraciones("FC media 137.9 bpm, casi toda en Z4. Buena recuperación.")).toBe(2);
    expect(contarOraciones("Sin punto final")).toBe(1);
  });
});
