import { describe, it, expect } from "vitest";
import {
  completarSerie, deshacerSerie, saltarDescanso, ajustarDescanso,
  irABloque, siguienteBloque, anteriorBloque, toggleModoVista,
  bloqueCompleto, bloquesCompletados, rutinaCompleta,
  proximoBloqueIncompleto, descansoRestanteMs,
  INITIAL_ENTRENAR_STATE,
} from "./entrenarState";
import type { Rutina } from "../types/models";

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
