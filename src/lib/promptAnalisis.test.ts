// P93 (enmienda): el prompt vigente existe en el repo y dice cómo tratar los dos casos nuevos.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { VERSION_PROMPT_SESION } from "./analisis";

const ruta = (v: number) => `docs/analisis/prompt-sesion-v${v}.md`;

describe("el prompt de análisis de sesión", () => {
  it("la versión vigente tiene su archivo, y las anteriores se conservan", () => {
    for (let v = 1; v <= VERSION_PROMPT_SESION; v++) expect(existsSync(ruta(v))).toBe(true);
  });

  it("el v4 está vigente (P99), y el v3 queda tal cual: los análisis viejos dicen con cuál se hicieron", () => {
    expect(VERSION_PROMPT_SESION).toBe(4);
    expect(readFileSync(ruta(4), "utf8")).toMatch(/prompt v4/);
    expect(readFileSync(ruta(3), "utf8")).toMatch(/prompt v3/);
  });

  it("v4 trae las reglas de P99", () => {
    const p = readFileSync(ruta(4), "utf8");
    expect(p).toMatch(/Cada sesión se analiza en\s+un chat nuevo/);
    expect(p).toMatch(/Qué analizás: solo lo realizado/);
    expect(p).toMatch(/No evalúes el cumplimiento/);
    expect(p).toMatch(/Si `fcDudosa` es falso, no especules con artefactos/);
    expect(p).toMatch(/Podés recomendar fuerza/);
    expect(p).toMatch(/No hables de progresión/);
    expect(p).toMatch(/No escribas números propios en `marcasAnalisis`/);
    expect(p).toMatch(/Las calorías no vienen/);
    // De dónde sale cada dato, también el sueño y la FC de reposo (P99).
    expect(p).toMatch(/sueño de la noche anterior/);
    expect(p).toMatch(/FC de reposo del día/);
    expect(p).toMatch(/import del archivo de Samsung Health/);
    expect(p).toMatch(/"version": 3/);
    expect(p).toMatch(/"veredicto"/);
    expect(p).toMatch(/"destacados"/);
    expect(p).toMatch(/"marcasAnalisis"/);
  });

  it("v3 trae las reglas nuevas", () => {
    const p = readFileSync(ruta(3), "utf8");
    expect(p).toMatch(/2 o 3 oraciones/);
    expect(p).toMatch(/como máximo 4, y al menos uno de lo que salió bien/);
    expect(p).toMatch(/cada limitación se nombra una sola vez/);
    expect(p).toMatch(/como máximo 2, sobre el entrenamiento/);
    expect(p).toMatch(/Nunca pidas RPE ni cómo se sintió/);
    expect(p).toMatch(/como máximo 2, y solo si la respuesta cambiaría la interpretación/);
    expect(p).toMatch(/datosFaltantes/);
    expect(p).toMatch(/sin tono de reproche/);
    expect(p).toMatch(/No marques como dudoso lo que el paquete explica/);
    expect(p).toMatch(/"version": 2/);
  });

  it("v3 conserva las reglas de v2", () => {
    const p = readFileSync(ruta(3), "utf8");
    expect(p).toMatch(/discrepanciaDuracion/);
    expect(p).toMatch(/No saques conclusiones de duración ni de densidad/);
    expect(p).toMatch(/los datos no cierran/);
    expect(p).toMatch(/rutina-actual/);
    expect(p).toMatch(/referencia, no la verdad/);
  });
});
