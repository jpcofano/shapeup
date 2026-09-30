// P84c: la ventana tiene que medir lo que dice el cronómetro de la app.
//   |(finMs − inicioMs) − duracionRealMin × 60000| <= 60_000
//
// Un test por tipo de sesión, sobre el camino de guardado: el estado se arma
// con las mismas funciones que usa la pantalla (entrenarState), el cierre con
// la misma función que llama la ruta (`cierreDeSesion`), y lo que se verifica
// es el documento que `finalizarSesion` le entrega a Firestore — no un objeto
// armado a mano.
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../firebase", () => ({ db: {}, auth: { currentUser: { uid: "u1" } } }));

const escritos: Record<string, unknown>[] = [];
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(), doc: vi.fn((_db, ...p: string[]) => ({ path: p.join("/") })),
  getDocs: vi.fn(), getDoc: vi.fn(), getDocFromServer: vi.fn(),
  serverTimestamp: vi.fn(() => "TS"), updateDoc: vi.fn(),
  query: vi.fn(), where: vi.fn(), orderBy: vi.fn(), limit: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: (ref: { path: string }, data: Record<string, unknown>) => {
      if (ref.path.startsWith("historial/")) escritos.push(data);
    },
    commit: () => Promise.resolve(),
  })),
}));
vi.mock("./pedidoPuente", () => ({ pedirSincronizacion: () => Promise.resolve({ ok: true, value: 1 }) }));

import { finalizarSesion } from "./historial";
import {
  INITIAL_ENTRENAR_STATE, asegurarInicioSesion, asegurarInicioSerie, completarSerie,
  irABloque, saltarDescanso, sellarProgresionVR, cerrarPorTiempo,
  construirBloquesRegistro, finParcialMs, type EntrenarState,
} from "../lib/entrenarState";
import { cierreDeSesion, ventanaCumpleInvariante, ventanaDeBloques, TOLERANCIA_VENTANA_MS } from "../lib/metricas";
import type { Rutina, BloqueEjercicio } from "../types/models";

const MIN = 60_000;
const T0 = 1_790_378_700_000; // 25/09/2026 ~20:25 (Buenos Aires)

function rutina(bloques: BloqueEjercicio[], id = "RUT-X"): Rutina {
  return {
    idRutina: id, nombre: id, nombreCanonico: id.toLowerCase(), foco: "Cuerpo completo",
    objetivo: "General / salud", nivel: "Principiante", nivelOrden: 1, lugar: "Casa",
    equipoNecesario: [], duracionEstimadaMin: null, totalSeries: null, bloques, vecesEntrenada: 0,
  } as Rutina;
}
const cardio = (orden: number, id: string): BloqueEjercicio => ({
  orden, idEjercicio: id, nombreEjercicio: id, modalidad: "Cardio",
  prescripcion: { modalidad: "Cardio", formato: "Continuo", duracionMin: 20 },
} as BloqueEjercicio);
const fuerza = (orden: number, id: string): BloqueEjercicio => ({
  orden, idEjercicio: id, nombreEjercicio: id, modalidad: "Fuerza",
  prescripcion: { modalidad: "Fuerza", series: 2, descansoSeg: 60, repsObjetivo: { value: 10, raw: "10" } },
} as BloqueEjercicio);
const vr: BloqueEjercicio = {
  orden: 1, idEjercicio: "EJ-9010", nombreEjercicio: "Beat the Beats (VR)", modalidad: "Cardio",
  prescripcion: { modalidad: "Cardio", formato: "Intervalos", rondas: 4, trabajoSeg: 360, descansoSeg: 60, juegoSugerido: "Beat the Beats" },
} as BloqueEjercicio;

/** Lo último que `finalizarSesion` escribió en /historial. */
function escrito() {
  const h = escritos.at(-1) as { inicioMs?: number; finMs?: number; duracionRealMin: number | null };
  expect(h).toBeDefined();
  return h;
}
function cumple(h: { inicioMs?: number; finMs?: number; duracionRealMin: number | null }) {
  expect(h.inicioMs).toBeTypeOf("number");
  expect(h.finMs).toBeTypeOf("number");
  expect(h.duracionRealMin).toBeTypeOf("number");
  expect(Math.abs((h.finMs! - h.inicioMs!) - h.duracionRealMin! * MIN)).toBeLessThanOrEqual(TOLERANCIA_VENTANA_MS);
  expect(ventanaCumpleInvariante(h)).toBe(true);
}

/**
 * La sesión libre del 25/09, reproducida: arranca 20:25, el cronómetro de la
 * serie del bloque 0 se re-sella a las 20:46 (acá, yendo a otro bloque y
 * volviendo: `irABloque` borra el inicio del bloque que se deja y el efecto de
 * la pantalla lo vuelve a sellar con la hora del momento) y cierra 21:15.
 */
function sesionLibre2509(): { state: EntrenarState; r: Rutina; cierreMs: number } {
  const r = rutina([cardio(1, "EJ-9010"), cardio(2, "EJ-9002"), cardio(3, "EJ-9009")], "libre");
  let s = asegurarInicioSesion({ ...INITIAL_ENTRENAR_STATE }, T0);
  s = asegurarInicioSerie(s, 0, T0);                     // efecto al montar
  s = irABloque(s, 1); s = asegurarInicioSerie(s, 1, T0 + 21 * MIN);
  s = irABloque(s, 0); s = asegurarInicioSerie(s, 0, T0 + 21 * MIN + 24_000);
  s = completarSerie(s, r, 0, undefined, T0 + 37 * MIN);  // 21:02
  s = asegurarInicioSerie(s, 1, T0 + 40 * MIN);
  s = completarSerie(s, r, 1, undefined, T0 + 42 * MIN);
  s = asegurarInicioSerie(s, 2, T0 + 43 * MIN);
  s = completarSerie(s, r, 2, undefined, T0 + 50 * MIN);  // 21:15
  return { state: s, r, cierreMs: T0 + 50 * MIN + 2_000 };
}

beforeEach(() => { escritos.length = 0; localStorage.clear(); });

describe("la ventana mide lo que dice el cronómetro de la app (P84c)", () => {
  it("el 25/09 con las series: la ventana mide 29 min contra 50 — el bug", () => {
    const { state, r } = sesionLibre2509();
    const v = ventanaDeBloques(construirBloquesRegistro(state, r));
    expect(Math.round((v.finMs! - v.inicioMs!) / MIN)).toBe(29);
    expect(v.inicioMs! - state.inicioMs!).toBeGreaterThan(20 * MIN);
  });

  it("libre — Finalizar: arranque y cierre de la sesión", async () => {
    const { state, r, cierreMs } = sesionLibre2509();
    const cierre = cierreDeSesion(state.inicioMs, cierreMs);
    await finalizarSesion({
      tipo: "libre", nombreLibre: "Sesión libre", miembro: "juanpablo",
      bloques: construirBloquesRegistro(state, r), rpe: null, ...cierre, completitud: "completa",
    });
    const h = escrito();
    cumple(h);
    expect(h.inicioMs).toBe(T0);
    expect(h.duracionRealMin).toBe(50);
  });

  it("libre — Guardar y salir: el cierre es la última serie", async () => {
    const { state, r } = sesionLibre2509();
    const cierre = cierreDeSesion(state.inicioMs, finParcialMs(state)!);
    await finalizarSesion({
      tipo: "libre", nombreLibre: "Sesión libre", miembro: "juanpablo",
      bloques: construirBloquesRegistro(state, r), rpe: null, ...cierre, completitud: "parcial",
    });
    const h = escrito();
    cumple(h);
    expect(h.finMs).toBe(T0 + 50 * MIN);
  });

  it("rutina — Finalizar: la primera serie tarda en sellarse y no mueve el inicio", async () => {
    const r = rutina([fuerza(1, "EJ-0001"), fuerza(2, "EJ-0002")]);
    let s = asegurarInicioSesion({ ...INITIAL_ENTRENAR_STATE }, T0);
    // Leyó la tarjeta, calentó: la primera serie arranca 8 min después.
    s = irABloque(s, 1); s = irABloque(s, 0); s = asegurarInicioSerie(s, 0, T0 + 8 * MIN);
    s = completarSerie(s, r, 0, { reps: 10 }, T0 + 9 * MIN); s = saltarDescanso(s, T0 + 10 * MIN);
    s = completarSerie(s, r, 0, { reps: 10 }, T0 + 11 * MIN);
    s = asegurarInicioSerie(s, 1, T0 + 12 * MIN);
    s = completarSerie(s, r, 1, { reps: 10 }, T0 + 13 * MIN); s = saltarDescanso(s, T0 + 14 * MIN);
    s = completarSerie(s, r, 1, { reps: 10 }, T0 + 15 * MIN);
    // Estira y aprieta "Finalizar" 5 min después de la última serie.
    const cierre = cierreDeSesion(s.inicioMs, T0 + 20 * MIN);
    await finalizarSesion({
      rutinaId: "RUT-X", nombreRutina: "RUT-X", miembro: "juanpablo",
      bloques: construirBloquesRegistro(s, r), rpe: 7, ...cierre, completitud: "completa",
    });
    const h = escrito();
    cumple(h);
    expect([h.inicioMs, h.finMs, h.duracionRealMin]).toEqual([T0, T0 + 20 * MIN, 20]);
  });

  it("rutina — Guardar y salir", async () => {
    const r = rutina([fuerza(1, "EJ-0001"), fuerza(2, "EJ-0002")]);
    let s = asegurarInicioSesion({ ...INITIAL_ENTRENAR_STATE }, T0);
    s = asegurarInicioSerie(s, 0, T0 + 6 * MIN);
    s = completarSerie(s, r, 0, { reps: 10 }, T0 + 7 * MIN);
    const cierre = cierreDeSesion(s.inicioMs, finParcialMs(s)!);
    await finalizarSesion({
      rutinaId: "RUT-X", nombreRutina: "RUT-X", miembro: "juanpablo",
      bloques: construirBloquesRegistro(s, r), rpe: null, ...cierre, completitud: "parcial",
    });
    cumple(escrito());
  });

  it("VR por tiempo: desde que se decidió la tarjeta hasta Terminar", async () => {
    const r = rutina([vr], "RUT-0030");
    let s = asegurarInicioSesion({ ...INITIAL_ENTRENAR_STATE }, T0);
    s = sellarProgresionVR(s, { rondas: 4, trabajoSeg: 360, descansoSeg: 60 }, null, T0 + 2 * MIN);
    const now = T0 + 32 * MIN;
    const cerrado = cerrarPorTiempo(s, r, now);
    const cierre = cierreDeSesion(s.vrInicioMs ?? s.inicioMs, now);
    await finalizarSesion({
      rutinaId: "RUT-0030", nombreRutina: "Beat the Beats", miembro: "juanpablo",
      bloques: construirBloquesRegistro(cerrado, r), rpe: null, ...cierre, completitud: "completa",
    });
    const h = escrito();
    cumple(h);
    expect([h.inicioMs, h.duracionRealMin]).toEqual([T0 + 2 * MIN, 30]);
  });

  it("juego: sin series, la ventana es el reloj de la pantalla", async () => {
    await finalizarSesion({
      tipo: "juego", nombreJuego: "Walkabout", miembro: "juanpablo",
      bloques: [], rpe: null, ...cierreDeSesion(T0, T0 + 41 * MIN + 20_000),
    });
    cumple(escrito());
  });

  it("sin ventana explícita, finalizarSesion ancla en el fin y resta la duración", async () => {
    const { state, r } = sesionLibre2509();
    await finalizarSesion({
      tipo: "libre", miembro: "juanpablo", bloques: construirBloquesRegistro(state, r),
      rpe: null, duracionMin: 50,
    });
    const h = escrito();
    cumple(h);
    expect(h.finMs).toBe(T0 + 50 * MIN);   // el fin de las series se conserva
  });
});
