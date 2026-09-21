import { describe, it, expect } from "vitest";
import {
  completarSerie, deshacerSerie, saltarDescanso, ajustarDescanso,
  irABloque, siguienteBloque, anteriorBloque, toggleModoVista,
  bloqueCompleto, bloquesCompletados, rutinaCompleta,
  proximoBloqueIncompleto, descansoRestanteMs,
  INITIAL_ENTRENAR_STATE,
  buildBloqueLibre, buildVirtualRutina, construirBloquesRegistro,
  valorPrefillSerie,
  trabajoObjetivoSeg, trabajoRestanteMs, asegurarInicioSerie, ajustarTrabajo,
  objetivoSerieLabel,
  asegurarInicioSesion, seriesHechasTotales, loadEntrenarState,
  estadoReiniciado, asignarIdSesion, duracionParcialMin, sesionVieja, quitarBloques,
  UMBRAL_SESION_VIEJA_MS,
  saltarBloque, retomarBloque, bloqueSaltado, bloqueResuelto, rutinaTerminada,
  siguientePendiente, aContinuacionDescanso,
  sellarLugar, cambiarLugar,
  sustituirBloque, deshacerSustitucion,
} from "./entrenarState";
import type { Ejercicio, PrescripcionFuerza, PrescripcionCardio, Rutina } from "../types/models";

// ── Rutina de prueba ──────────────────────────────────────────────────────────
const rutina: Rutina = {
  idRutina: "RUT-TEST",
  nombre: "Test",
  nombreCanonico: "test",
  foco: "Cuerpo completo",
  objetivo: "General / salud",
  nivel: "Principiante",
  nivelOrden: 1,
  lugar: "Casa",
  equipoNecesario: [],
  duracionEstimadaMin: 30,
  totalSeries: 6,
  bloques: [
    {
      orden: 1,
      idEjercicio: "EJ-0001",
      nombreEjercicio: "Press",
      modalidad: "Fuerza",
      prescripcion: { modalidad: "Fuerza", series: 3, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 60 },
    },
    {
      orden: 2,
      idEjercicio: "EJ-0002",
      nombreEjercicio: "Remo",
      modalidad: "Fuerza",
      prescripcion: { modalidad: "Fuerza", series: 3, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 60 },
    },
  ],
  vecesEntrenada: 0,
};

const s0 = { ...INITIAL_ENTRENAR_STATE };

// ── completarSerie ────────────────────────────────────────────────────────────
describe("completarSerie", () => {
  it("incrementa seriesHechas del bloque", () => {
    const s = completarSerie(s0, rutina, 0);
    expect(s.seriesHechas[0]).toBe(1);
  });

  it("guarda registro con completada: true", () => {
    const s = completarSerie(s0, rutina, 0, { reps: 10, cargaKg: 60 });
    expect(s.registro[0][0]).toMatchObject({ serie: 1, completada: true, reps: 10, cargaKg: 60 });
  });

  it("arranca descanso si quedan series", () => {
    const s = completarSerie(s0, rutina, 0);
    expect(s.descanso).not.toBeNull();
    expect(s.descanso?.bloqueIdx).toBe(0);
    expect(s.descanso?.durMs).toBe(60_000);
  });

  it("NO arranca descanso si descansoSeg = 0", () => {
    const rutinaSD: Rutina = {
      ...rutina,
      bloques: [{
        ...rutina.bloques[0],
        prescripcion: { modalidad: "Fuerza", series: 3, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 0 },
      }, rutina.bloques[1]],
    };
    const s = completarSerie(s0, rutinaSD, 0);
    expect(s.descanso).toBeNull();
  });

  it("al completar la última serie avanza al siguiente bloque incompleto", () => {
    // completar las 3 series del bloque 0
    let s = completarSerie(s0, rutina, 0);
    s = completarSerie(s, rutina, 0);
    s = completarSerie(s, rutina, 0);
    expect(s.bloqueActual).toBe(1);
    expect(s.descanso).toBeNull();
  });

  it("no hace nada si el bloque ya está completo", () => {
    let s = completarSerie(s0, rutina, 0);
    s = completarSerie(s, rutina, 0);
    s = completarSerie(s, rutina, 0); // completo
    const sExtra = completarSerie(s, rutina, 0);
    expect(sExtra.seriesHechas[0]).toBe(3); // no sube a 4
  });
});

// ── deshacerSerie ─────────────────────────────────────────────────────────────
describe("deshacerSerie", () => {
  it("decrementa seriesHechas", () => {
    const s = completarSerie(s0, rutina, 0);
    const s2 = deshacerSerie(s, 0);
    expect(s2.seriesHechas[0]).toBe(0);
  });

  it("elimina el último registro", () => {
    const s = completarSerie(s0, rutina, 0, { reps: 10 });
    const s2 = deshacerSerie(s, 0);
    expect(s2.registro[0]).toHaveLength(0);
  });

  it("cancela el descanso del mismo bloque", () => {
    const s = completarSerie(s0, rutina, 0); // tiene descanso
    const s2 = deshacerSerie(s, 0);
    expect(s2.descanso).toBeNull();
  });

  it("no modifica estado si seriesHechas = 0", () => {
    const s2 = deshacerSerie(s0, 0);
    expect(s2).toEqual(s0);
  });
});

// ── saltarDescanso / ajustarDescanso ──────────────────────────────────────────
describe("saltarDescanso", () => {
  it("pone descanso a null", () => {
    const s = completarSerie(s0, rutina, 0);
    expect(saltarDescanso(s).descanso).toBeNull();
  });

  it("no cambia estado si no hay descanso", () => {
    expect(saltarDescanso(s0)).toEqual(s0);
  });
});

describe("ajustarDescanso", () => {
  it("suma delta en segundos", () => {
    const s = completarSerie(s0, rutina, 0);
    const durOriginal = s.descanso!.durMs;
    const s2 = ajustarDescanso(s, 30);
    expect(s2.descanso!.durMs).toBe(durOriginal + 30_000);
  });

  it("no baja de 0", () => {
    const s = completarSerie(s0, rutina, 0);
    const s2 = ajustarDescanso(s, -9999);
    expect(s2.descanso!.durMs).toBe(0);
  });

  // Descanso de 60 s arrancado en t = 1000.
  const conDescanso = completarSerie(s0, rutina, 0, undefined, 1000);

  it("+30 mientras corre suma a durMs", () => {
    const s2 = ajustarDescanso(conDescanso, 30, 21_000);
    expect(s2.descanso).toEqual({ bloqueIdx: 0, startMs: 1000, durMs: 90_000 });
  });

  it("−30 mientras corre resta, con clamp en 0", () => {
    expect(ajustarDescanso(conDescanso, -30, 11_000).descanso!.durMs).toBe(30_000);
    expect(ajustarDescanso(conDescanso, -90, 11_000).descanso!.durMs).toBe(0);
  });

  it("+30 con el descanso terminado arranca una cuenta nueva desde now", () => {
    const now = 1000 + 60_000 + 45_000; // venció hace 45 s
    const s2 = ajustarDescanso(conDescanso, 30, now);
    expect(s2.descanso!.durMs).toBe(now - 1000 + 30_000);
    expect(descansoRestanteMs(s2, now)).toBe(30_000);
  });

  it("sin descanso devuelve el mismo estado", () => {
    expect(ajustarDescanso(s0, 30, 5000)).toBe(s0);
  });
});

// ── asegurarInicioSesion ──────────────────────────────────────────────────────
describe("asegurarInicioSesion", () => {
  it("el estado inicial arranca sin inicio", () => {
    expect(INITIAL_ENTRENAR_STATE.inicioMs).toBeNull();
  });

  it("sella el inicio si es null", () => {
    expect(asegurarInicioSesion(s0, 5000).inicioMs).toBe(5000);
  });

  it("no pisa un inicio existente", () => {
    const sellado = { ...s0, inicioMs: 1234 };
    expect(asegurarInicioSesion(sellado, 5000)).toBe(sellado);
  });

  it("un estado viejo en localStorage sin el campo carga con inicioMs null", () => {
    const viejo: Record<string, unknown> = { ...s0, seriesHechas: { 0: 2 } };
    delete viejo.inicioMs;
    localStorage.setItem("entrenar:test-viejo", JSON.stringify(viejo));
    try {
      const cargado = loadEntrenarState("test-viejo");
      expect(cargado.inicioMs).toBeNull();
      expect(cargado.seriesHechas).toEqual({ 0: 2 });
      expect(asegurarInicioSesion(cargado, 7000).inicioMs).toBe(7000);
    } finally {
      localStorage.removeItem("entrenar:test-viejo");
    }
  });
});

// ── P68: sesión única, parcial, vieja ─────────────────────────────────────────
describe("estadoReiniciado", () => {
  it("conserva idSesion y vuelve todo lo demás al estado inicial", () => {
    let s = asignarIdSesion(s0, "SES-1");
    s = asegurarInicioSesion(s, 1000);
    s = completarSerie(s, rutina, 0, { reps: 8, cargaKg: 20 }, 2000);
    s = { ...s, modoVista: "scroll" };
    expect(estadoReiniciado(s)).toEqual({ ...INITIAL_ENTRENAR_STATE, idSesion: "SES-1" });
  });

  it("sin idSesion devuelve el estado inicial", () => {
    expect(estadoReiniciado(completarSerie(s0, rutina, 0))).toEqual(INITIAL_ENTRENAR_STATE);
  });

  it("un estado viejo en localStorage sin idSesion carga con null", () => {
    const viejo: Record<string, unknown> = { ...s0, inicioMs: 1000 };
    delete viejo.idSesion;
    localStorage.setItem("entrenar:test-sin-id", JSON.stringify(viejo));
    try {
      const cargado = loadEntrenarState("test-sin-id");
      expect(cargado.idSesion).toBeNull();
      expect(cargado.inicioMs).toBe(1000);
    } finally {
      localStorage.removeItem("entrenar:test-sin-id");
    }
  });
});

describe("duracionParcialMin", () => {
  const MIN = 60_000;

  it("mide desde el inicio hasta el fin de la última serie", () => {
    let s = asegurarInicioSesion(s0, 0);
    s = completarSerie(s, rutina, 0, undefined, 10 * MIN);
    s = completarSerie(s, rutina, 0, undefined, 14 * MIN);
    expect(duracionParcialMin(s)).toBe(14);
  });

  it("sin series devuelve null", () => {
    expect(duracionParcialMin(asegurarInicioSesion(s0, 0))).toBeNull();
  });

  it("sin inicioMs devuelve null", () => {
    expect(duracionParcialMin(completarSerie(s0, rutina, 0, undefined, 5 * MIN))).toBeNull();
  });

  it("con varios bloques usa el finMs más alto, no el último bloque", () => {
    let s = asegurarInicioSesion(s0, 0);
    s = completarSerie(s, rutina, 1, undefined, 30 * MIN);
    s = completarSerie(s, rutina, 0, undefined, 12 * MIN);
    expect(duracionParcialMin(s)).toBe(30);
  });
});

describe("sesionVieja", () => {
  const inicio = 1_000_000;
  const s = asegurarInicioSesion(s0, inicio);

  it("justo en el umbral no es vieja", () => {
    expect(sesionVieja(s, inicio + UMBRAL_SESION_VIEJA_MS)).toBe(false);
  });

  it("por debajo del umbral no es vieja", () => {
    expect(sesionVieja(s, inicio + UMBRAL_SESION_VIEJA_MS - 1)).toBe(false);
  });

  it("por encima del umbral es vieja", () => {
    expect(sesionVieja(s, inicio + UMBRAL_SESION_VIEJA_MS + 1)).toBe(true);
  });

  it("sin inicioMs no es vieja", () => {
    expect(sesionVieja(s0, Number.MAX_SAFE_INTEGER)).toBe(false);
  });

  it("el umbral es de 12 h y se puede pasar otro", () => {
    expect(UMBRAL_SESION_VIEJA_MS).toBe(12 * 60 * 60 * 1000);
    expect(sesionVieja(s, inicio + 11, 10)).toBe(true);
  });
});

describe("quitarBloques", () => {
  it("saca el bloque y corre los índices del resto", () => {
    const s = {
      ...s0,
      bloqueActual: 2,
      seriesHechas: { 0: 1, 1: 2, 2: 3 },
      ultimoLog: { 2: { reps: 5 } },
      descanso: { bloqueIdx: 2, startMs: 0, durMs: 1000 },
    };
    const r = quitarBloques(s, [1], 2);
    expect(r.seriesHechas).toEqual({ 0: 1, 1: 3 });
    expect(r.ultimoLog).toEqual({ 1: { reps: 5 } });
    expect(r.descanso?.bloqueIdx).toBe(1);
    expect(r.bloqueActual).toBe(1);
  });

  it("si el descanso era de un bloque quitado, lo corta", () => {
    const s = { ...s0, descanso: { bloqueIdx: 0, startMs: 0, durMs: 1000 } };
    expect(quitarBloques(s, [0], 1).descanso).toBeNull();
  });

  it("sin quitados devuelve el mismo estado", () => {
    expect(quitarBloques(s0, [], 3)).toBe(s0);
  });
});

// ── P68b: saltar, retomar, extras, navegación ─────────────────────────────────
const rutina3: Rutina = {
  ...rutina,
  bloques: [
    ...rutina.bloques,
    {
      orden: 3,
      idEjercicio: "EJ-0003",
      nombreEjercicio: "Plancha",
      modalidad: "Fuerza",
      prescripcion: { modalidad: "Fuerza", series: 2, repsObjetivo: { value: 10, raw: "10" }, descansoSeg: 60 },
    },
  ],
};

/** Completa todas las series del bloque `idx` (3 series en los bloques de prueba 0 y 1). */
function completarBloque(s: typeof s0, r: Rutina, idx: number, series: number, t0 = 1000) {
  let x = s;
  for (let i = 0; i < series; i++) x = completarSerie(x, r, idx, undefined, t0 + i);
  return x;
}

describe("saltarBloque", () => {
  it("marca el salto con motivo", () => {
    const s = saltarBloque(s0, rutina3, 0, "dolor", 5000);
    expect(s.saltados).toEqual({ 0: "dolor" });
    expect(bloqueSaltado(s, 0)).toBe(true);
  });

  it("marca el salto sin motivo (null)", () => {
    const s = saltarBloque(s0, rutina3, 0, null, 5000);
    expect(s.saltados).toEqual({ 0: null });
    expect(bloqueSaltado(s, 0)).toBe(true);
    expect(bloqueResuelto(s, rutina3, 0)).toBe(true);
  });

  it("cancela el descanso de ese bloque y borra su inicio de serie", () => {
    const conDescanso = completarSerie({ ...s0, serieInicioMs: { 0: 900 } }, rutina3, 0, undefined, 1000);
    expect(conDescanso.descanso?.bloqueIdx).toBe(0);
    const s = saltarBloque({ ...conDescanso, serieInicioMs: { 0: 1500 } }, rutina3, 0, null, 2000);
    expect(s.descanso).toBeNull();
    expect(s.serieInicioMs[0]).toBeUndefined();
  });

  it("avanza al próximo pendiente, sella su inicio y deja ultimoBloqueCerrado", () => {
    const s = saltarBloque(s0, rutina3, 0, "otro", 5000);
    expect(s.bloqueActual).toBe(1);
    expect(s.serieInicioMs[1]).toBe(5000);
    expect(s.ultimoBloqueCerrado).toBe(0);
  });

  it("no hace nada en un bloque completo", () => {
    const completo = completarBloque(s0, rutina3, 0, 3);
    expect(saltarBloque(completo, rutina3, 0, "dolor", 9000)).toBe(completo);
  });

  it("si era el último pendiente: terminada pero no completa", () => {
    let s = completarBloque(s0, rutina3, 0, 3);
    s = completarBloque(s, rutina3, 1, 3);
    expect(rutinaTerminada(s, rutina3)).toBe(false);
    s = saltarBloque(s, rutina3, 2, "sin-tiempo", 9000);
    expect(rutinaTerminada(s, rutina3)).toBe(true);
    expect(rutinaCompleta(s, rutina3)).toBe(false);
  });
});

describe("retomarBloque", () => {
  it("conserva las series, quita el salto y limpia ultimoBloqueCerrado", () => {
    let s = completarSerie(s0, rutina3, 0, { reps: 8 }, 1000);
    s = saltarBloque(s, rutina3, 0, "equipo-ocupado", 2000);
    expect(s.ultimoBloqueCerrado).toBe(0);
    s = retomarBloque({ ...s, modoVista: "scroll" }, 0);
    expect(bloqueSaltado(s, 0)).toBe(false);
    expect(s.seriesHechas[0]).toBe(1);
    expect(s.registro[0]).toHaveLength(1);
    expect(s.bloqueActual).toBe(0);
    expect(s.modoVista).toBe("guiada");
    expect(s.ultimoBloqueCerrado).toBeNull();
  });
});

describe("completarSerie con extra", () => {
  it("registra por encima del objetivo, sin descanso ni avance, numerando 4 y 5", () => {
    const completo = completarBloque(s0, rutina3, 0, 3);
    const enBloque0 = { ...completo, bloqueActual: 0, ultimoBloqueCerrado: 0 };
    let s = completarSerie(enBloque0, rutina3, 0, { reps: 12 }, 5000, { extra: true });
    s = completarSerie(s, rutina3, 0, undefined, 6000, { extra: true });
    expect(s.seriesHechas[0]).toBe(5);
    expect(s.registro[0].map((r) => r.serie)).toEqual([1, 2, 3, 4, 5]);
    expect(s.descanso).toBeNull();
    expect(s.bloqueActual).toBe(0);
    expect(s.ultimoBloqueCerrado).toBe(0);
  });

  it("sin extra, un bloque completo no registra más", () => {
    const completo = completarBloque(s0, rutina3, 0, 3);
    expect(completarSerie(completo, rutina3, 0, undefined, 5000)).toBe(completo);
  });

  it("una extra sobre otro bloque no toca ultimoBloqueCerrado ni el bloque actual", () => {
    const s = completarBloque(s0, rutina3, 0, 3);
    expect(s.bloqueActual).toBe(1);
    const x = completarSerie(s, rutina3, 0, undefined, 5000, { extra: true });
    expect(x.bloqueActual).toBe(1);
    expect(x.ultimoBloqueCerrado).toBe(0);
    expect(x.serieInicioMs[0]).toBeUndefined();
  });
});

describe("ultimoBloqueCerrado", () => {
  it("se setea al completar un bloque", () => {
    const s = completarBloque(s0, rutina3, 0, 3);
    expect(s.ultimoBloqueCerrado).toBe(0);
    expect(s.bloqueActual).toBe(1);
  });

  it("se setea al saltear", () => {
    expect(saltarBloque(s0, rutina3, 1, null, 1).ultimoBloqueCerrado).toBe(1);
  });

  it("se limpia al completar una serie de otro bloque", () => {
    const s = completarBloque(s0, rutina3, 0, 3);
    const x = completarSerie(s, rutina3, 1, undefined, 5000);
    expect(x.ultimoBloqueCerrado).toBeNull();
  });

  it("no se limpia con una serie del mismo bloque", () => {
    const s = { ...s0, ultimoBloqueCerrado: 1 };
    expect(completarSerie(s, rutina3, 1, undefined, 5000).ultimoBloqueCerrado).toBe(1);
  });

  it("se limpia con irABloque y al retomar", () => {
    const s = completarBloque(s0, rutina3, 0, 3);
    expect(irABloque(s, 2).ultimoBloqueCerrado).toBeNull();
    const saltado = saltarBloque(s0, rutina3, 0, null, 1);
    expect(retomarBloque(saltado, 0).ultimoBloqueCerrado).toBeNull();
  });
});

describe("proximoBloqueIncompleto con salteados", () => {
  it("saltea los salteados hacia adelante", () => {
    const s = { ...s0, saltados: { 1: null } };
    expect(proximoBloqueIncompleto(s, rutina3, 0)).toBe(2);
  });

  it("saltea los salteados al volver a buscar desde el principio", () => {
    let s = completarBloque(s0, rutina3, 2, 2);
    s = { ...s, saltados: { 0: "dolor" } };
    // Después del último bloque no hay nada: vuelve al principio, saltea el 0 y cae en el 1.
    expect(proximoBloqueIncompleto(s, rutina3, 2)).toBe(1);
  });

  it("devuelve -1 si todo está resuelto", () => {
    let s = completarBloque(s0, rutina3, 0, 3);
    s = { ...s, saltados: { 1: null, 2: "otro" } };
    expect(proximoBloqueIncompleto(s, rutina3, 0)).toBe(-1);
  });

  it("siguientePendiente no devuelve el bloque actual", () => {
    let s = completarBloque(s0, rutina3, 1, 3);
    s = completarBloque(s, rutina3, 2, 2);
    // Solo queda el 0: para "A continuación" desde el 0 no hay otro.
    expect(proximoBloqueIncompleto(s, rutina3, 0)).toBe(0);
    expect(siguientePendiente(s, rutina3, 0)).toBe(-1);
  });
});

describe("aContinuacionDescanso", () => {
  it("solo en el descanso previo a la última serie", () => {
    const una = completarSerie(s0, rutina3, 0, undefined, 1000);
    expect(aContinuacionDescanso(una, rutina3)).toBeUndefined();
    const dos = completarSerie(una, rutina3, 0, undefined, 2000);
    expect(aContinuacionDescanso(dos, rutina3)).toBe("Remo");
  });
});

describe("irABloque (P68b)", () => {
  it("borra el inicio de serie del bloque que se deja y cancela su descanso", () => {
    const s = {
      ...s0,
      bloqueActual: 0,
      serieInicioMs: { 0: 1000, 1: 2000 },
      descanso: { bloqueIdx: 0, startMs: 0, durMs: 60_000 },
    };
    const x = irABloque(s, 2);
    expect(x.bloqueActual).toBe(2);
    expect(x.serieInicioMs).toEqual({ 1: 2000 });
    expect(x.descanso).toBeNull();
  });

  it("no cancela un descanso de otro bloque", () => {
    const s = { ...s0, bloqueActual: 0, descanso: { bloqueIdx: 1, startMs: 0, durMs: 1 } };
    expect(irABloque(s, 2).descanso).toEqual({ bloqueIdx: 1, startMs: 0, durMs: 1 });
  });
});

describe("quitarBloques (P68b)", () => {
  it("reindexa saltados y ajusta ultimoBloqueCerrado", () => {
    const s = { ...s0, saltados: { 0: null, 2: "dolor" as const }, ultimoBloqueCerrado: 2 };
    const r = quitarBloques(s, [1], 2);
    expect(r.saltados).toEqual({ 0: null, 1: "dolor" });
    expect(r.ultimoBloqueCerrado).toBe(1);
  });

  it("si se quitó el último bloque cerrado, queda en null", () => {
    const s = { ...s0, ultimoBloqueCerrado: 1 };
    expect(quitarBloques(s, [1], 2).ultimoBloqueCerrado).toBeNull();
  });
});

describe("construirBloquesRegistro (P68b)", () => {
  it("marca saltado y motivoSalto solo donde corresponde", () => {
    const s = { ...s0, saltados: { 1: "dolor" as const, 2: null } };
    const bloques = construirBloquesRegistro(s, rutina3);
    expect(bloques[0]).not.toHaveProperty("saltado");
    expect(bloques[0]).not.toHaveProperty("motivoSalto");
    expect(bloques[1]).toMatchObject({ saltado: true, motivoSalto: "dolor" });
    expect(bloques[2]).toMatchObject({ saltado: true });
    expect(bloques[2]).not.toHaveProperty("motivoSalto");
  });
});

describe("loadEntrenarState (P68b)", () => {
  it("un estado previo sin saltados ni ultimoBloqueCerrado carga con los iniciales", () => {
    const viejo: Record<string, unknown> = { ...s0, seriesHechas: { 0: 1 } };
    delete viejo.saltados;
    delete viejo.ultimoBloqueCerrado;
    localStorage.setItem("entrenar:test-p68b", JSON.stringify(viejo));
    try {
      const cargado = loadEntrenarState("test-p68b");
      expect(cargado.saltados).toEqual({});
      expect(cargado.ultimoBloqueCerrado).toBeNull();
      expect(cargado.seriesHechas).toEqual({ 0: 1 });
    } finally {
      localStorage.removeItem("entrenar:test-p68b");
    }
  });

  it("estadoReiniciado limpia saltados y ultimoBloqueCerrado", () => {
    const s = { ...s0, saltados: { 0: null }, ultimoBloqueCerrado: 0, idSesion: "SES-9" };
    const r = estadoReiniciado(s);
    expect(r.saltados).toEqual({});
    expect(r.ultimoBloqueCerrado).toBeNull();
    expect(r.idSesion).toBe("SES-9");
  });
});

describe("seriesHechasTotales", () => {
  it("suma las series de todos los bloques", () => {
    expect(seriesHechasTotales(s0)).toBe(0);
    expect(seriesHechasTotales({ ...s0, seriesHechas: { 0: 2, 1: 3 } })).toBe(5);
  });
});

// ── navegación ────────────────────────────────────────────────────────────────
describe("irABloque / siguienteBloque / anteriorBloque", () => {
  it("irABloque cambia bloqueActual", () => {
    expect(irABloque(s0, 1).bloqueActual).toBe(1);
  });

  it("siguienteBloque avanza", () => {
    expect(siguienteBloque(s0, rutina).bloqueActual).toBe(1);
  });

  it("siguienteBloque no pasa del último", () => {
    const s = irABloque(s0, 1);
    expect(siguienteBloque(s, rutina).bloqueActual).toBe(1);
  });

  it("anteriorBloque retrocede", () => {
    const s = irABloque(s0, 1);
    expect(anteriorBloque(s).bloqueActual).toBe(0);
  });

  it("anteriorBloque no baja de 0", () => {
    expect(anteriorBloque(s0).bloqueActual).toBe(0);
  });
});

// ── rutinaCompleta / bloquesCompletados ───────────────────────────────────────
describe("rutinaCompleta", () => {
  it("false al inicio", () => {
    expect(rutinaCompleta(s0, rutina)).toBe(false);
  });

  it("true cuando todos los bloques están completos", () => {
    let s = s0;
    for (let blq = 0; blq < 2; blq++) {
      for (let i = 0; i < 3; i++) s = completarSerie(s, rutina, blq);
    }
    expect(rutinaCompleta(s, rutina)).toBe(true);
  });
});

// ── descansoRestanteMs ────────────────────────────────────────────────────────
describe("descansoRestanteMs", () => {
  it("devuelve 0 sin descanso activo", () => {
    expect(descansoRestanteMs(s0)).toBe(0);
  });

  it("devuelve ms restantes", () => {
    const now = Date.now();
    const s: typeof s0 = { ...s0, descanso: { bloqueIdx: 0, startMs: now, durMs: 60_000 } };
    expect(descansoRestanteMs(s, now + 10_000)).toBe(50_000);
  });

  it("devuelve 0 si vencido", () => {
    const s: typeof s0 = { ...s0, descanso: { bloqueIdx: 0, startMs: 0, durMs: 1000 } };
    expect(descansoRestanteMs(s, Date.now())).toBe(0);
  });
});

// ── toggleModoVista ───────────────────────────────────────────────────────────
describe("toggleModoVista", () => {
  it("guiada → scroll", () => {
    expect(toggleModoVista(s0, rutina).modoVista).toBe("scroll");
  });

  it("scroll → guiada (salta al primer incompleto)", () => {
    const s = { ...s0, modoVista: "scroll" as const };
    expect(toggleModoVista(s, rutina).modoVista).toBe("guiada");
  });
});

// ── Sesión libre: buildBloqueLibre + buildVirtualRutina ───────────────────────

const ejFuerza: Ejercicio = {
  idEjercicio: "EJ-TEST-F",
  nombre: "Sentadilla",
  nombreCanonico: "sentadilla",
  modalidad: "Fuerza",
  patron: "Dominante de rodilla",
  grupoMuscularPrimario: "Cuádriceps",
  gruposSecundarios: [],
  equipo: ["Peso corporal"],
  unilateral: false,
  nivel: "Principiante",
  instrucciones: [],
  puntosClave: [],
  erroresComunes: [],
  descansoSugeridoSeg: 90,
  sinonimos: [],
  vecesUsado: 0,
  origen: "manual",
};

const ejMovilidad: Ejercicio = {
  ...ejFuerza,
  idEjercicio: "EJ-TEST-M",
  nombre: "Estiramiento cadera",
  nombreCanonico: "estiramiento cadera",
  modalidad: "Movilidad",
  patron: "Locomoción / cardio",
  descansoSugeridoSeg: 30,
};

describe("buildBloqueLibre", () => {
  it("Fuerza: 3 series, 10 reps, usa descansoSugeridoSeg", () => {
    const b = buildBloqueLibre(ejFuerza, 1);
    expect(b.orden).toBe(1);
    expect(b.idEjercicio).toBe("EJ-TEST-F");
    expect(b.modalidad).toBe("Fuerza");
    expect(b.prescripcion.modalidad).toBe("Fuerza");
    if (b.prescripcion.modalidad === "Fuerza") {
      expect(b.prescripcion.series).toBe(3);
      expect(b.prescripcion.repsObjetivo.value).toBe(10);
      expect(b.prescripcion.descansoSeg).toBe(90);
    }
  });

  it("Movilidad: 3 rondas, usa descansoSugeridoSeg", () => {
    const b = buildBloqueLibre(ejMovilidad, 2);
    expect(b.prescripcion.modalidad).toBe("Movilidad");
    if (b.prescripcion.modalidad === "Movilidad") {
      expect(b.prescripcion.rondas).toBe(3);
      expect(b.prescripcion.descansoSeg).toBe(30);
    }
  });
});

describe("buildVirtualRutina", () => {
  it("conserva los bloques pasados", () => {
    const bloques = [buildBloqueLibre(ejFuerza, 1), buildBloqueLibre(ejMovilidad, 2)];
    const vr = buildVirtualRutina(bloques);
    expect(vr.bloques).toHaveLength(2);
    expect(vr.bloques[0].idEjercicio).toBe("EJ-TEST-F");
    expect(vr.bloques[1].idEjercicio).toBe("EJ-TEST-M");
  });

  it("el reducer funciona con la rutina virtual", () => {
    const bloques = [buildBloqueLibre(ejFuerza, 1)];
    const vr = buildVirtualRutina(bloques);
    let s = s0;
    for (let i = 0; i < 3; i++) s = completarSerie(s, vr, 0);
    expect(rutinaCompleta(s, vr)).toBe(true);
  });
});

// ── F4: atajo "Empezar este ejercicio" — pre-seed de 1 ejercicio a 3×10 ───────
describe("F4 — pre-seed de 1 ejercicio entra en fase 2 con 3 series", () => {
  it("la rutina virtual de 1 solo bloque pre-cargado (3×10) banca bien: incompleta hasta la 3ra, sin 'siguiente'", () => {
    // Mismo override que EntrenarSesionLibre.defaultsParaEj() aplica sobre buildBloqueLibre.
    const bl = buildBloqueLibre(ejFuerza, 1);
    const p = bl.prescripcion as PrescripcionFuerza;
    const bloque = {
      ...bl,
      prescripcion: { ...p, series: 3, repsObjetivo: { value: 10, raw: "10" } } as PrescripcionFuerza,
    };
    const vr = buildVirtualRutina([bloque]);

    expect(vr.bloques).toHaveLength(1);

    let s = s0;
    s = completarSerie(s, vr, 0, { reps: 10 });
    expect(rutinaCompleta(s, vr)).toBe(false);
    expect(s.bloqueActual).toBe(0); // sin bloque "siguiente": queda en el único que hay

    s = completarSerie(s, vr, 0, { reps: 10 });
    expect(rutinaCompleta(s, vr)).toBe(false);

    s = completarSerie(s, vr, 0, { reps: 10 });
    expect(rutinaCompleta(s, vr)).toBe(true); // 3ra serie → fin de sesión
    expect(s.bloqueActual).toBe(0); // proximoBloqueIncompleto no encontró otro → se queda
  });
});

// ── valorPrefillSerie + persistencia de ultimoLog ─────────────────────────────

const rutinaConCarga: Rutina = {
  ...rutina,
  bloques: [
    {
      orden: 1,
      idEjercicio: "EJ-0001",
      nombreEjercicio: "Curl de bíceps",
      modalidad: "Fuerza",
      prescripcion: {
        modalidad: "Fuerza", series: 3,
        repsObjetivo: { value: 12, raw: "12" },
        cargaKg: 8,
        descansoSeg: 45,
      },
    },
    rutina.bloques[1],
  ],
};

describe("valorPrefillSerie", () => {
  it("devuelve defaults de prescripción si no hay ultimoLog", () => {
    const prefill = valorPrefillSerie(rutinaConCarga, 0, s0);
    expect(prefill).toEqual({ reps: 12, cargaKg: 8 });
  });

  it("omite reps si value = 0 (AMRAP / máx)", () => {
    const rutinaMáx: Rutina = {
      ...rutina,
      bloques: [{
        ...rutina.bloques[0],
        prescripcion: { modalidad: "Fuerza", series: 3, repsObjetivo: { value: 0, raw: "máx" }, descansoSeg: 60 },
      }, rutina.bloques[1]],
    };
    const prefill = valorPrefillSerie(rutinaMáx, 0, s0);
    expect(prefill.reps).toBeUndefined();
  });

  it("devuelve {} para bloque no-Fuerza", () => {
    const rutinaISO: Rutina = {
      ...rutina,
      bloques: [{
        orden: 1,
        idEjercicio: "EJ-ISO",
        nombreEjercicio: "Plancha lateral",
        modalidad: "Isométrico",
        prescripcion: { modalidad: "Isométrico", series: 3, duracionHoldSeg: 30, porLado: true, descansoSeg: 30 },
      }],
    };
    expect(valorPrefillSerie(rutinaISO, 0, s0)).toEqual({});
  });

  it("usa ultimoLog si ya hay un registro previo (herencia de serie)", () => {
    const s = completarSerie(s0, rutinaConCarga, 0, { reps: 11, cargaKg: 9 });
    const prefill = valorPrefillSerie(rutinaConCarga, 0, s);
    expect(prefill).toEqual({ reps: 11, cargaKg: 9 });
  });

  it("el ultimoLog persiste tras múltiples series y hereda a la siguiente", () => {
    let s = completarSerie(s0, rutinaConCarga, 0, { reps: 10, cargaKg: 8.5 });
    s = completarSerie(s, rutinaConCarga, 0, { reps: 9 }); // cambia reps, mantiene cargaKg anterior
    const prefill = valorPrefillSerie(rutinaConCarga, 0, s);
    expect(prefill.reps).toBe(9);
    expect(prefill.cargaKg).toBe(8.5); // heredado de la primera serie
  });

  it("el ultimoLog del bloque 0 no afecta al bloque 1", () => {
    const s = completarSerie(s0, rutinaConCarga, 0, { reps: 11, cargaKg: 9 });
    const prefill1 = valorPrefillSerie(rutinaConCarga, 1, s);
    // bloque 1 tiene prescripción sin cargaKg y reps 10
    expect(prefill1).toEqual({ reps: 10 });
  });
});

describe("P70: e1rmKg y rir en el registro", () => {
  it("construirBloquesRegistro escribe e1rmKg solo si hay valor", () => {
    let s = completarSerie(s0, rutina, 0, { reps: 5, cargaKg: 100 }, 1000);
    s = completarSerie(s, rutina, 1, { reps: 12 }, 2000); // sin carga: sin 1RM
    const reg = construirBloquesRegistro(s, rutina);
    expect(reg[0].e1rmKg).toBe(116.7);
    expect(reg[1]).not.toHaveProperty("e1rmKg");
  });

  it("no calcula e1rmKg en bloques que no son de Fuerza", () => {
    const vr = buildVirtualRutina([buildBloqueLibre({ ...ejFuerza, modalidad: "Isométrico" }, 1)]);
    const s = completarSerie(s0, vr, 0, { reps: 5, cargaKg: 20 }, 1000);
    expect(construirBloquesRegistro(s, vr)[0]).not.toHaveProperty("e1rmKg");
  });

  it("completarSerie conserva el rir que viene en reg", () => {
    const s = completarSerie(s0, rutina, 0, { reps: 8, cargaKg: 40, rir: 2 }, 1000);
    expect(s.registro[0][0]).toMatchObject({ reps: 8, cargaKg: 40, rir: 2 });
    expect(construirBloquesRegistro(s, rutina)[0].series[0].rir).toBe(2);
  });
});

describe("construirBloquesRegistro con rutina virtual", () => {
  it("arma BloqueRegistro a partir del estado", () => {
    const bloques = [buildBloqueLibre(ejFuerza, 1)];
    const vr = buildVirtualRutina(bloques);
    let s = s0;
    s = completarSerie(s, vr, 0, { reps: 8, cargaKg: 40 });
    const reg = construirBloquesRegistro(s, vr);
    expect(reg).toHaveLength(1);
    expect(reg[0].idEjercicio).toBe("EJ-TEST-F");
    expect(reg[0].series[0]).toMatchObject({ serie: 1, completada: true, reps: 8, cargaKg: 40 });
  });
});

// ── Cronómetro de trabajo (P51 — VR series/timers) ────────────────────────────

const cardioIntervalos: PrescripcionCardio = {
  modalidad: "Cardio", formato: "Intervalos",
  rondas: 5, trabajoSeg: 240, descansoSeg: 90, juegoSugerido: "Creed",
};

const rutinaVR: Rutina = {
  ...rutina,
  bloques: [
    { orden: 1, idEjercicio: "EJ-9004", nombreEjercicio: "Creed (VR)", modalidad: "Cardio", prescripcion: cardioIntervalos },
    rutina.bloques[1],
  ],
};

describe("trabajoObjetivoSeg", () => {
  it("Cardio Intervalos → trabajoSeg", () => {
    expect(trabajoObjetivoSeg(cardioIntervalos)).toBe(240);
  });

  it("Cardio Intervalos sin trabajoSeg → null", () => {
    expect(trabajoObjetivoSeg({ modalidad: "Cardio", formato: "Intervalos" })).toBeNull();
  });

  it("Cardio Continuo con duracionMin → *60", () => {
    expect(trabajoObjetivoSeg({ modalidad: "Cardio", formato: "Continuo", duracionMin: 20 })).toBe(1200);
  });

  it("Cardio Continuo sin duracionMin → null", () => {
    expect(trabajoObjetivoSeg({ modalidad: "Cardio", formato: "Continuo" })).toBeNull();
  });

  it("Isométrico → duracionHoldSeg", () => {
    expect(trabajoObjetivoSeg({ modalidad: "Isométrico", series: 3, duracionHoldSeg: 30, porLado: false, descansoSeg: 30 })).toBe(30);
  });

  it("Fuerza → null (sin cuenta regresiva de trabajo)", () => {
    expect(trabajoObjetivoSeg(rutina.bloques[0].prescripcion)).toBeNull();
  });

  it("Movilidad → null", () => {
    expect(trabajoObjetivoSeg({ modalidad: "Movilidad", rondas: 3, porLado: false, descansoSeg: 20 })).toBeNull();
  });
});

describe("trabajoRestanteMs", () => {
  it("null si el bloque actual no tiene trabajo cronometrable", () => {
    const s = { ...s0, bloqueActual: 1 }; // bloque 1 = Fuerza
    expect(trabajoRestanteMs(s, rutinaVR)).toBeNull();
  });

  it("null si no hay serieInicioMs para el bloque", () => {
    expect(trabajoRestanteMs(s0, rutinaVR)).toBeNull();
  });

  it("resto correcto mientras no venció", () => {
    const now = 1_000_000;
    const s = { ...s0, serieInicioMs: { 0: now } };
    expect(trabajoRestanteMs(s, rutinaVR, now + 100_000)).toBe(140_000); // 240s - 100s
  });

  it("0 cuando el objetivo venció", () => {
    const now = 1_000_000;
    const s = { ...s0, serieInicioMs: { 0: now } };
    expect(trabajoRestanteMs(s, rutinaVR, now + 500_000)).toBe(0);
  });
});

describe("asegurarInicioSerie", () => {
  it("setea serieInicioMs si no existía y no hay descanso", () => {
    const s = asegurarInicioSerie(s0, 0, 5000);
    expect(s.serieInicioMs[0]).toBe(5000);
  });

  it("no pisa un inicio ya sellado (volver atrás no reinicia el reloj)", () => {
    const s0conInicio = { ...s0, serieInicioMs: { 0: 1000 } };
    const s = asegurarInicioSerie(s0conInicio, 0, 5000);
    expect(s.serieInicioMs[0]).toBe(1000);
  });

  it("no setea si hay descanso activo", () => {
    const sConDescanso = { ...s0, descanso: { bloqueIdx: 0, startMs: 0, durMs: 60_000 } };
    const s = asegurarInicioSerie(sConDescanso, 0, 5000);
    expect(s.serieInicioMs[0]).toBeUndefined();
  });
});

describe("ajustarTrabajo", () => {
  it("no-op si el bloque no arrancó", () => {
    const s = ajustarTrabajo(s0, 0, 30);
    expect(s).toBe(s0);
  });

  it("corre el inicio hacia adelante (extiende el restante)", () => {
    const sConInicio = { ...s0, serieInicioMs: { 0: 1000 } };
    const s = ajustarTrabajo(sConInicio, 0, 30);
    expect(s.serieInicioMs[0]).toBe(1000 + 30_000);
  });
});

describe("objetivoSerieLabel — Cardio Intervalos con juegoSugerido", () => {
  it("formatea minutos de juego + descanso", () => {
    expect(objetivoSerieLabel(cardioIntervalos)).toBe("4 min de juego · 90 s de descanso");
  });

  it("sin juegoSugerido mantiene el label genérico", () => {
    const p: PrescripcionCardio = { modalidad: "Cardio", formato: "Intervalos", rondas: 5, trabajoSeg: 30, descansoSeg: 15 };
    expect(objetivoSerieLabel(p)).toBe("30 s fuerte / 15 s suave");
  });
});

// ── Lugar de la sesión (P72) ──────────────────────────────────────────────────
describe("sellarLugar", () => {
  it("regla 1: manda el lugar de la rutina", () => {
    expect(sellarLugar(INITIAL_ENTRENAR_STATE, "Gimnasio", "Casa").lugar).toBe("Gimnasio");
  });

  it("regla 2: sin lugar de rutina, el lugar habitual del perfil", () => {
    expect(sellarLugar(INITIAL_ENTRENAR_STATE, undefined, "Aire libre").lugar).toBe("Aire libre");
  });

  it("regla 3: sin rutina ni perfil, Casa", () => {
    expect(sellarLugar(INITIAL_ENTRENAR_STATE, undefined, undefined).lugar).toBe("Casa");
  });

  it("no pisa un lugar ya sellado", () => {
    const sellado = sellarLugar(INITIAL_ENTRENAR_STATE, "VR", undefined);
    const otra    = sellarLugar(sellado, "Gimnasio", "Casa");
    expect(otra.lugar).toBe("VR");
    expect(otra).toBe(sellado);
  });

  it("cambiarLugar lo cambia a mano sin tocar nada más", () => {
    const s = completarSerie(sellarLugar(INITIAL_ENTRENAR_STATE, "Casa", undefined), rutina, 0);
    const c = cambiarLugar(s, "Gimnasio");
    expect(c.lugar).toBe("Gimnasio");
    expect(c.seriesHechas).toEqual(s.seriesHechas);
    expect(c.registro).toEqual(s.registro);
  });

  it("estadoReiniciado conserva el lugar, igual que idSesion", () => {
    const s = completarSerie(
      cambiarLugar(asignarIdSesion(INITIAL_ENTRENAR_STATE, "SES-1"), "Gimnasio"),
      rutina, 0,
    );
    const r = estadoReiniciado(s);
    expect(r.lugar).toBe("Gimnasio");
    expect(r.idSesion).toBe("SES-1");
    expect(r.seriesHechas).toEqual({});
  });

  it("un estado viejo en localStorage sin el campo carga con lugar null", () => {
    const { lugar: _sin, ...viejo } = INITIAL_ENTRENAR_STATE;
    localStorage.setItem("entrenar:test-p72", JSON.stringify(viejo));
    try {
      const cargado = loadEntrenarState("test-p72");
      expect(cargado.lugar).toBeNull();
      // Y sellarlo después funciona igual que en una sesión nueva.
      expect(sellarLugar(cargado, undefined, "VR").lugar).toBe("VR");
    } finally {
      localStorage.removeItem("entrenar:test-p72");
    }
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Sustitución en vivo (P73)
// ════════════════════════════════════════════════════════════════════════════

describe("sustituirBloque / deshacerSustitucion", () => {
  const SUST = {
    idOriginal: "EJ-0001", idNuevo: "EJ-0999", nombreNuevo: "Press con mancuernas",
    motivo: "equipo-ocupado" as const, posicion: 1,
  };

  /** Estado con el bloque 0 a medio registrar. */
  const conSeries = {
    ...s0,
    seriesHechas: { 0: 2, 1: 1 },
    registro: { 0: [{ serie: 1, completada: true, reps: 10 }], 1: [{ serie: 1, completada: true }] },
    serieInicioMs: { 0: 123456, 1: 999 },
    ultimoLog: { 0: { reps: 10 }, 1: { reps: 8 } },
  };

  it("borra las series de ese bloque: eran de otro ejercicio", () => {
    const r = sustituirBloque(conSeries, 0, SUST);
    expect(r.seriesHechas[0]).toBeUndefined();
    expect(r.registro[0]).toBeUndefined();
    expect(r.serieInicioMs[0]).toBeUndefined();
    expect(r.ultimoLog[0]).toBeUndefined();
  });

  it("no toca los otros bloques", () => {
    const r = sustituirBloque(conSeries, 0, SUST);
    expect(r.seriesHechas[1]).toBe(1);
    expect(r.registro[1]).toHaveLength(1);
  });

  it("guarda la posición del ranking", () => {
    const r = sustituirBloque(s0, 0, { ...SUST, posicion: 3 });
    expect(r.sustituciones[0]).toMatchObject({ idNuevo: "EJ-0999", posicion: 3 });
  });

  it("deshacer vuelve al original y también borra las series", () => {
    const sustituido = sustituirBloque(conSeries, 0, SUST);
    const conNuevas = { ...sustituido, seriesHechas: { ...sustituido.seriesHechas, 0: 1 } };
    const r = deshacerSustitucion(conNuevas, 0);
    expect(r.sustituciones[0]).toBeUndefined();
    expect(r.seriesHechas[0]).toBeUndefined();
  });

  it("deshacer un bloque sin sustitución no cambia nada", () => {
    expect(deshacerSustitucion(conSeries, 0)).toBe(conSeries);
  });

  it("quitarBloques reindexa las sustituciones", () => {
    const s = sustituirBloque({ ...s0 }, 2, SUST);
    const r = quitarBloques(s, [1], 2);
    expect(r.sustituciones[1]).toMatchObject({ idNuevo: "EJ-0999" });
    expect(r.sustituciones[2]).toBeUndefined();
  });

  it("estadoReiniciado las limpia", () => {
    const s = sustituirBloque(s0, 0, SUST);
    expect(estadoReiniciado(s).sustituciones).toEqual({});
  });

  it("construirBloquesRegistro escribe los cuatro campos solo en el sustituido", () => {
    const s = sustituirBloque(
      { ...s0, seriesHechas: { 0: 1, 1: 1 } }, 0,
      { ...SUST, motivo: "dolor", zona: "hombro", posicion: 2 },
    );
    const bloques = construirBloquesRegistro(s, rutina);
    expect(bloques[0]).toMatchObject({
      idEjercicio: "EJ-0999",
      nombreEjercicio: "Press con mancuernas",
      idEjercicioOriginal: "EJ-0001",
      motivoSustitucion: "dolor",
      zonaMolestia: "hombro",
      posicionSustituto: 2,
    });
    expect(bloques[1].idEjercicioOriginal).toBeUndefined();
    expect(bloques[1].motivoSustitucion).toBeUndefined();
  });

  it("sin zona no escribe zonaMolestia", () => {
    const s = sustituirBloque({ ...s0, seriesHechas: { 0: 1 } }, 0, SUST);
    expect(construirBloquesRegistro(s, rutina)[0].zonaMolestia).toBeUndefined();
  });

  it("un estado previo sin `sustituciones` carga vacío", () => {
    const viejo = JSON.stringify({ ...INITIAL_ENTRENAR_STATE, sustituciones: undefined });
    localStorage.setItem("su-entrenar-SES-VIEJA", viejo);
    expect(loadEntrenarState("SES-VIEJA").sustituciones).toEqual({});
  });
});
