// ════════════════════════════════════════════════════════════════════════════
//  data/sincronizarPuente.test.ts — P76a: que la sincronización no mienta.
//
//  Los tres casos que antes salían mal: un rechazo por documento que igual
//  informaba éxito, un paso que falla después de que otro escribió, y una
//  escritura que nunca resuelve y dejaba la pantalla colgada.
//
//  P76b: el paso de entradas externas ya no existe. Quedan dos pasos —
//  actividades y mediciones— y son esos dos los que prueban la escritura
//  parcial.
// ════════════════════════════════════════════════════════════════════════════
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Historial } from "../types/models";
import { ok, err } from "../lib/result";
import type { Result } from "../lib/result";
import type { ImportResult } from "./salud";
import { CRUDO_COMPOSICION_HEALTHSYNC } from "../lib/__fixtures__/crudoSdk";

vi.mock("../firebase", () => ({ db: {} }));

// ── dobles de las tres escrituras y de la lectura ──────────────────────────
let cardioImpl:     () => Promise<Result<ImportResult>>;
let medicionesImpl: () => Promise<Result<ImportResult>>;
let registros: { id: string; dataType: string; crudo: unknown }[] = [];

vi.mock("./ingestaSdk", () => ({
  leerRegistrosSdk: vi.fn(() => Promise.resolve(
    ok({ registros, documentos: registros.length, rearmados: 0, ilegibles: [] }),
  )),
}));
vi.mock("./salud", () => ({
  importarCardioIdempotente:     vi.fn(() => cardioImpl()),
  importarMedicionesIdempotente: vi.fn(() => medicionesImpl()),
}));
const { sincronizarDesdePuente } = await import("./sincronizarPuente");

/** Una sesión del SDK lo bastante larga como para entrar como actividad externa. */
function sesion(uid: string, inicioIso: string, minutos: number) {
  const inicio = Date.parse(inicioIso);
  return {
    id: `exercise_${uid}`,
    dataType: "exercise",
    crudo: {
      uid,
      appId: "com.sec.android.app.shealth",
      startTime: { epochMs: inicio, iso: inicioIso },
      startLocalDateTime: new Date(inicio - 3 * 3_600_000).toISOString().slice(0, 19),
      fields: {
        sessions: [{
          startTime: { epochMs: inicio, iso: inicioIso },
          endTime: { epochMs: inicio + minutos * 60_000, iso: "" },
          duration: { ms: minutos * 60_000, iso: "" },
          exerciseType: "POOL_SWIMMING",
          customTitle: null,
          calories: 300, distance: null,
          maxHeartRate: 140, meanHeartRate: 120, minHeartRate: 90,
          autoDetected: true, logSize: 100, logWithHeartRate: 100, log: null,
        }],
      },
    },
  };
}

const CONFIG = { duracionMinimaMin: 20, actividadesSiempreRelevantes: [] };
const HIST: Historial[] = [];

beforeEach(() => {
  registros = [sesion("nat-1", "2026-07-10T16:39:58.319Z", 31)];
  cardioImpl     = () => Promise.resolve(ok({ importados: 1, omitidos: 0, fallidos: 0 }));
  medicionesImpl = () => Promise.resolve(ok({ importados: 1, omitidos: 0, fallidos: 0 }));
});

describe("sincronizarDesdePuente — contadores honestos", () => {
  it("el resumen cuenta lo escrito, no lo clasificado", async () => {
    cardioImpl = () => Promise.resolve(ok({ importados: 1, omitidos: 0, fallidos: 0 }));
    const r = await sincronizarDesdePuente("uid", "juanpablo", HIST, CONFIG);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.escrito).toBe(true);
      expect(r.value.escritos.cardio).toBe(1);
      expect(r.value.enCola).toBe(false);
    }
  });

  it("un rechazo por documento es un error visible, no un éxito con un número menor", async () => {
    cardioImpl = () => Promise.resolve(ok({
      importados: 0, omitidos: 1, fallidos: 1,
      primerError: "Se agotó la cuota diaria de Firestore. Probá de nuevo mañana.",
    }));
    const r = await sincronizarDesdePuente("uid", "juanpablo", HIST, CONFIG);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("Cardio");
      expect(r.error).toContain("cuota diaria");
    }
  });

  it("si un paso falla después de que otro escribió, el error dice qué quedó guardado", async () => {
    // P76b: el paso de externas ya no existe — las mediciones son el segundo
    // paso, y son las que prueban la escritura parcial.
    // Hace falta una medición para que haya un segundo paso que falle.
    registros = [
      sesion("nat-1", "2026-07-10T16:39:58.319Z", 31),
      { id: "body_composition_x", dataType: "body_composition", crudo: CRUDO_COMPOSICION_HEALTHSYNC },
    ];
    cardioImpl     = () => Promise.resolve(ok({ importados: 1, omitidos: 0, fallidos: 0 }));
    medicionesImpl = () => Promise.resolve(err("permission-denied"));
    const r = await sincronizarDesdePuente("uid", "juanpablo", HIST, CONFIG);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("Mediciones");
      expect(r.error).toContain("Ya se habían guardado");
      expect(r.error).toContain("1 actividades");
    }
  });

  it("una excepción cruda de un paso vuelve como Result de error, no propaga", async () => {
    cardioImpl = () => Promise.reject(new Error("se cayó el stream"));
    const r = await sincronizarDesdePuente("uid", "juanpablo", HIST, CONFIG);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("se cayó el stream");
  });
});

describe("sincronizarDesdePuente — timeout", () => {
  it("una escritura que nunca resuelve devuelve 'en cola' y no cuelga", async () => {
    vi.useFakeTimers();
    // Promesa que no se resuelve jamás: es lo que pasa con caché persistente y
    // el servidor sin confirmar.
    cardioImpl = () => new Promise(() => { /* nunca */ });

    const promesa = sincronizarDesdePuente("uid", "juanpablo", HIST, CONFIG);
    await vi.advanceTimersByTimeAsync(8_500);
    const r = await promesa;

    vi.useRealTimers();
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.enCola).toBe(true);
      expect(r.value.escrito).toBe(true);
    }
  });
});
