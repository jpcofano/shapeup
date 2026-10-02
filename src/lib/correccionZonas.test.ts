import { describe, it, expect } from "vitest";
import { planificarCorreccionZonas } from "./correccionZonas";
import { zonasDesdeFcMax } from "./zonas";

const AHORA = 1_790_000_000_000;

// /config/perfiles como estaba el 01/10 (zonas del seed viejo, sin origen).
const delSeed = (fc: number, z: number[][]) => ({
  color: "#000", fcMaxTeorica: fc,
  zonasFC: Object.fromEntries(z.map(([min, max], i) => [`Z${i + 1}`, { min, max }])),
});
const DOC = {
  juanpablo: delSeed(169, [[85, 101], [101, 118], [118, 135], [135, 152], [152, 169]]),
  maria: delSeed(170, [[85, 102], [102, 119], [119, 136], [136, 153], [153, 170]]),
  sofia: delSeed(203, [[102, 122], [122, 142], [142, 162], [162, 183], [183, 203]]),
  federico: delSeed(204, [[102, 122], [122, 143], [143, 163], [163, 184], [184, 204]]),
  ultimaActualizacion: { _seconds: 1, _nanoseconds: 0 },
};

/** Lo que haría `update()` con el plan sobre el documento. */
function aplicar(doc: Record<string, unknown>, plan: ReturnType<typeof planificarCorreccionZonas>) {
  const out = structuredClone(doc) as Record<string, Record<string, unknown>>;
  for (const k of plan.correcciones) Object.assign(out[k.miembro], k.cambio);
  return out;
}

describe("planificarCorreccionZonas (P97)", () => {
  const plan = planificarCorreccionZonas(DOC, AHORA);

  it("recalcula las zonas de los cuatro perfiles desde su FC máxima", () => {
    expect(plan.correcciones.map((k) => k.miembro)).toEqual(["federico", "juanpablo", "maria", "sofia"]);
    for (const k of plan.correcciones) expect(k.cambio.zonasFC).toEqual(zonasDesdeFcMax(k.fcMax));
    expect(plan.correcciones.find((k) => k.miembro === "juanpablo")!.cambio.zonasFC!.Z5).toEqual({ min: 153, max: 169 });
  });
  it("declara el origen donde falta: samsung para juanpablo, por edad para los demás", () => {
    const origen = Object.fromEntries(plan.correcciones.map((k) => [k.miembro, k.cambio.fcMaxOrigen]));
    expect(origen).toEqual({ juanpablo: "samsung", maria: "edad-provisoria", sofia: "edad-provisoria", federico: "edad-provisoria" });
    for (const k of plan.correcciones) expect(k.cambio.fcMaxDesdeMs).toBe(AHORA);
  });
  it("saltea ultimaActualizacion", () => {
    expect(plan.omitidos).toEqual([{ clave: "ultimaActualizacion", motivo: "no es un miembro" }]);
  });
  it("es idempotente: aplicado una vez, la segunda corrida no cambia nada", () => {
    const despues = aplicar(DOC, plan);
    const segunda = planificarCorreccionZonas(despues, AHORA + 1000);
    for (const k of segunda.correcciones) expect(k.cambio, k.miembro).toEqual({});
  });
  it("no pisa un origen ya declarado", () => {
    const doc = { juanpablo: { ...DOC.juanpablo, fcMaxOrigen: "medida", fcMaxDesdeMs: 5 } };
    const k = planificarCorreccionZonas(doc, AHORA).correcciones[0];
    expect(k.cambio.fcMaxOrigen).toBeUndefined();
    expect(k.cambio.fcMaxDesdeMs).toBeUndefined();
    expect(k.origenDespues).toBe("medida");
  });
  it("un perfil sin FC máxima se saltea", () => {
    expect(planificarCorreccionZonas({ maria: { color: "#f00" } }, AHORA).omitidos)
      .toEqual([{ clave: "maria", motivo: "sin FC máxima" }]);
  });
});
