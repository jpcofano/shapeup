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
