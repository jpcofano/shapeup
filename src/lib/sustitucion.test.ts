// ════════════════════════════════════════════════════════════════════════════
//  sustitucion.test.ts — el ranking de sustitutos (P73).
//
//  El catálogo es de juguete a propósito: lo que se prueba es el orden y los
//  descartes, y con 873 fichas reales no se puede razonar sobre el resultado.
// ════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  sugerirSustitutos, ultimaVezQueLoHiciste, vecesQueLoHiciste,
  similitudSecundarios, DESCARTES_POR_ZONA, TOPE_GRUPOS_SECUNDARIOS,
} from "./sustitucion";
import type { Ejercicio, Equipo, Historial, GrupoMuscular, PatronMovimiento, Nivel } from "../types/models";

const AHORA = Date.UTC(2026, 8, 20, 12, 0);   // 20/9/2026

// ── Fixtures ───────────────────────────────────────────────────────────────

function ej(
  id: string,
  nombre: string,
  extra: Partial<Ejercicio> = {},
): Ejercicio {
  return {
    idEjercicio: id,
    nombre,
    nombreCanonico: nombre.toLowerCase(),
    modalidad: "Fuerza",
    patron: "Empuje horizontal" as PatronMovimiento,
    grupoMuscularPrimario: "Pecho" as GrupoMuscular,
    gruposSecundarios: ["Tríceps"] as GrupoMuscular[],
    equipo: ["Peso corporal"] as Equipo[],
    unilateral: false,
    nivel: "Intermedio" as Nivel,
    mecanica: "Compuesto",
    instrucciones: [], puntosClave: [], erroresComunes: [],
    descansoSugeridoSeg: 90,
    ...extra,
  } as Ejercicio;
}

/** Una sesión con un bloque de `idEjercicio` y series completadas. */
function sesion(
  fecha: string,
  idEjercicio: string,
  cargaKg?: number,
  finMs?: number,
): Historial {
  return {
    idHist: `H-${fecha}-${idEjercicio}`,
    fechaRealizada: fecha,
    fechaRealizadaTimestamp: { seconds: 0, nanoseconds: 0 },
    idSesion: "SES", nombreRutina: "Rutina", semanaInicio: fecha, miembro: "juanpablo",
    duracionRealMin: 40, rpe: null, tonelajeKg: null, totalSeriesHechas: null,
    ...(finMs != null ? { finMs } : {}),
    bloques: [{
      orden: 1, idEjercicio, nombreEjercicio: idEjercicio, modalidad: "Fuerza",
      series: [{ serie: 1, completada: true, ...(cargaKg != null ? { cargaKg } : {}) }],
    }],
  } as unknown as Historial;
}

const ORIGINAL = ej("EJ-ORIG", "Press banca", { equipo: ["Barra", "Banco"] });

function correr(catalogo: Ejercicio[], extra: Partial<Parameters<typeof sugerirSustitutos>[0]> = {}) {
  return sugerirSustitutos({
    catalogo, original: ORIGINAL, equipo: ["Mancuernas", "Banco"], historial: [], now: AHORA, ...extra,
  });
}

// ── Filtros duros ──────────────────────────────────────────────────────────

describe("sugerirSustitutos · filtros duros", () => {
  it("descarta lo que pide equipo que no tenés", () => {
    const conPolea = ej("EJ-1", "Aperturas en polea", { equipo: ["Polea"] });
    const conMancuernas = ej("EJ-2", "Press con mancuernas", { equipo: ["Mancuernas", "Banco"] });
    const ids = correr([conPolea, conMancuernas]).candidatos.map((c) => c.ejercicio.idEjercicio);
    expect(ids).toEqual(["EJ-2"]);
  });

  it("'Peso corporal' siempre pasa, aunque no esté declarado", () => {
    const flexiones = ej("EJ-1", "Flexiones", { equipo: ["Peso corporal"] });
    const r = sugerirSustitutos({
      catalogo: [flexiones], original: ORIGINAL, equipo: [], historial: [], now: AHORA,
    });
    expect(r.candidatos.map((c) => c.ejercicio.idEjercicio)).toEqual(["EJ-1"]);
  });

  it("descarta el patrón distinto", () => {
    const otroPatron = ej("EJ-1", "Remo", { patron: "Tracción horizontal", equipo: ["Mancuernas"] });
    expect(correr([otroPatron]).candidatos).toEqual([]);
  });

  it("descarta el nivel superior al del original, y lo acepta al relajar", () => {
    const avanzado = ej("EJ-1", "Press a un brazo", { nivel: "Avanzado", equipo: ["Mancuernas"] });
    const conOtro = ej("EJ-2", "Press plano", { equipo: ["Mancuernas", "Banco"] });

    // Con otro de nivel válido, el avanzado no aparece.
    expect(correr([avanzado, conOtro]).candidatos.map((c) => c.ejercicio.idEjercicio)).toEqual(["EJ-2"]);

    // Solo, se relaja el filtro en vez de no ofrecer nada.
    const r = correr([avanzado]);
    expect(r.relajado).toBe(true);
    expect(r.candidatos.map((c) => c.ejercicio.idEjercicio)).toEqual(["EJ-1"]);
  });

  it("el original nunca aparece entre los candidatos", () => {
    const r = sugerirSustitutos({
      catalogo: [ORIGINAL, ej("EJ-1", "Press con mancuernas", { equipo: ["Mancuernas"] })],
      original: ORIGINAL, equipo: ["Mancuernas", "Barra", "Banco"], historial: [], now: AHORA,
    });
    expect(r.candidatos.map((c) => c.ejercicio.idEjercicio)).not.toContain("EJ-ORIG");
  });

  it("sin ningún candidato posible devuelve lista vacía, sin romperse", () => {
    expect(correr([]).candidatos).toEqual([]);
    expect(correr([]).relajado).toBe(false);
  });
});

describe("sugerirSustitutos · dolor", () => {
  const ORIG_RODILLA = ej("EJ-ORIG", "Sentadilla", {
    patron: "Dominante de rodilla", grupoMuscularPrimario: "Cuádriceps", gruposSecundarios: [],
    equipo: ["Barra"],
  });

  function correrRodilla(catalogo: Ejercicio[]) {
    return sugerirSustitutos({
      catalogo, original: ORIG_RODILLA, equipo: ["Mancuernas", "Máquina"],
      historial: [], now: AHORA, motivo: "dolor", zona: "rodilla",
    });
  }

  it("descarta por grupo cargado", () => {
    const cuadri = ej("EJ-1", "Prensa", {
      patron: "Dominante de rodilla", grupoMuscularPrimario: "Cuádriceps",
      gruposSecundarios: [], equipo: ["Máquina"],
    });
    expect(correrRodilla([cuadri]).candidatos).toEqual([]);
  });

  it("descarta por patrón cargado, aunque el grupo no esté en la lista", () => {
    const core = ej("EJ-2", "Zancada con core", {
      patron: "Dominante de rodilla", grupoMuscularPrimario: "Core",
      gruposSecundarios: [], equipo: ["Mancuernas"],
    });
    expect(correrRodilla([core]).candidatos).toEqual([]);
  });

  it("descarta también por grupo SECUNDARIO", () => {
    const conIsquiosSecundario = ej("EJ-3", "Peso muerto rumano", {
      patron: "Dominante de rodilla", grupoMuscularPrimario: "Glúteos",
      gruposSecundarios: ["Isquios"], equipo: ["Mancuernas"],
    });
    expect(correrRodilla([conIsquiosSecundario]).candidatos).toEqual([]);
  });

  it("con zona 'otra' no descarta nada: no hay información para hacerlo", () => {
    const cualquiera = ej("EJ-1", "Prensa", {
      patron: "Dominante de rodilla", grupoMuscularPrimario: "Cuádriceps",
      gruposSecundarios: [], equipo: ["Máquina"],
    });
    const r = sugerirSustitutos({
      catalogo: [cualquiera], original: ORIG_RODILLA, equipo: ["Máquina"],
      historial: [], now: AHORA, motivo: "dolor", zona: "otra",
    });
    expect(r.candidatos).toHaveLength(1);
    expect(DESCARTES_POR_ZONA.otra).toEqual({ grupos: [], patrones: [] });
  });
});

// ── Puntaje ────────────────────────────────────────────────────────────────

describe("sugerirSustitutos · orden del puntaje", () => {
  it("mismo grupo primario le gana a solo secundarios compartidos", () => {
    const mismoGrupo = ej("EJ-1", "Aperturas", {
      grupoMuscularPrimario: "Pecho", gruposSecundarios: [], equipo: ["Mancuernas"],
    });
    const soloSecundarios = ej("EJ-2", "Fondos", {
      grupoMuscularPrimario: "Tríceps", gruposSecundarios: ["Tríceps"], equipo: ["Peso corporal"],
    });
    const orden = correr([soloSecundarios, mismoGrupo]).candidatos.map((c) => c.ejercicio.idEjercicio);
    expect(orden[0]).toBe("EJ-1");
  });

  it("'ya lo hiciste' pesa más que la mecánica y el perfil de carga juntos", () => {
    // El conocido comparte grupo pero difiere en mecánica y es guiado;
    // el desconocido coincide en todo salvo en que nunca lo hiciste.
    const conocido = ej("EJ-1", "Press en máquina", {
      mecanica: "Aislamiento", equipo: ["Máquina"],
    });
    const desconocido = ej("EJ-2", "Press con mancuernas", {
      mecanica: "Compuesto", equipo: ["Mancuernas"],
    });
    const r = correr([conocido, desconocido], {
      equipo: ["Mancuernas", "Banco", "Máquina"],
      historial: [sesion("2026-05-01", "EJ-1", 40)],
    });
    expect(r.candidatos[0].ejercicio.idEjercicio).toBe("EJ-1");
    expect(r.candidatos[0].yaLoHiciste).toBe(true);
  });

  it("la frescura baja el puntaje pero no elimina al candidato", () => {
    const ej1 = ej("EJ-1", "Press con mancuernas", { equipo: ["Mancuernas"] });
    const hace20h = AHORA - 20 * 60 * 60 * 1000;
    const hace10dias = AHORA - 10 * 24 * 60 * 60 * 1000;

    const reciente = correr([ej1], { historial: [sesion("2026-09-19", "EJ-1", 30, hace20h)] });
    const viejo = correr([ej1], { historial: [sesion("2026-09-10", "EJ-1", 30, hace10dias)] });

    expect(reciente.candidatos[0].puntaje).toBeLessThan(viejo.candidatos[0].puntaje);
    expect(reciente.candidatos).toHaveLength(1);   // sigue estando
  });

  it("y con la frescura encima, el conocido puede quedar abajo de uno nuevo mejor", () => {
    // El bono de conocerlo (+30) le gana a la penalización (−20), así que para
    // que caiga hace falta que el otro además sume por otro lado.
    const hace20h = AHORA - 20 * 60 * 60 * 1000;
    const fresco = ej("EJ-1", "Aperturas", {
      equipo: ["Mancuernas"], grupoMuscularPrimario: "Hombros", gruposSecundarios: [],
    });
    const otro = ej("EJ-2", "Flexiones", { equipo: ["Peso corporal"] });
    const r = correr([fresco, otro], { historial: [sesion("2026-09-19", "EJ-1", 30, hace20h)] });
    expect(r.candidatos[0].ejercicio.idEjercicio).toBe("EJ-2");
    expect(r.candidatos.map((c) => c.ejercicio.idEjercicio)).toContain("EJ-1");
  });

  it("desempata por menos usado y después alfabético", () => {
    const a = ej("EJ-A", "Zeta press", { equipo: ["Mancuernas"] });
    const b = ej("EJ-B", "Alfa press", { equipo: ["Mancuernas"] });
    const c = ej("EJ-C", "Beta press", { equipo: ["Mancuernas"] });
    // Los tres puntúan igual y ninguno se hizo: manda el alfabético.
    const orden = correr([a, b, c]).candidatos.map((x) => x.ejercicio.nombre);
    expect(orden).toEqual(["Alfa press", "Beta press", "Zeta press"]);
  });
});

// ── Razón ──────────────────────────────────────────────────────────────────

describe("sugerirSustitutos · razón", () => {
  it("incluye la fecha y la carga cuando hay historial", () => {
    const conMancuernas = ej("EJ-1", "Press con mancuernas", { equipo: ["Mancuernas"] });
    const r = correr([conMancuernas], { historial: [sesion("2026-09-03", "EJ-1", 22.5)] });
    expect(r.candidatos[0].razon).toBe("mismo patrón, mismo grupo, tenés mancuernas");
    expect(r.candidatos[0].ultimaCargaKg).toBe(22.5);
    expect(r.candidatos[0].ultimaFecha).toBe("2026-09-03");
  });

  it("no inventa carga ni fecha cuando no hay historial", () => {
    const conMancuernas = ej("EJ-1", "Press con mancuernas", { equipo: ["Mancuernas"] });
    const r = correr([conMancuernas]);
    expect(r.candidatos[0].razon).not.toContain("kg");
    expect(r.candidatos[0].yaLoHiciste).toBe(false);
    expect(r.candidatos[0].ultimaCargaKg).toBeUndefined();
  });

  it("dice 'ya lo hiciste' cuando no hay carga registrada", () => {
    const sinEquipo = ej("EJ-1", "Flexiones", { equipo: ["Peso corporal"] });
    const r = correr([sinEquipo], { historial: [sesion("2026-09-03", "EJ-1")] });
    expect(r.candidatos[0].razon).toContain("ya lo hiciste");
  });

  it("nunca tiene más de tres partes", () => {
    const todo = ej("EJ-1", "Press con mancuernas", { equipo: ["Mancuernas"] });
    const r = correr([todo], { historial: [sesion("2026-09-03", "EJ-1", 20)] });
    expect(r.candidatos[0].razon.split(", ")).toHaveLength(3);
  });
});

// ── Helpers ────────────────────────────────────────────────────────────────

describe("ultimaVezQueLoHiciste / vecesQueLoHiciste", () => {
  const historial = [
    sesion("2026-08-01", "EJ-1", 20),
    sesion("2026-09-03", "EJ-1", 25),
    sesion("2026-09-10", "EJ-2", 10),
  ];

  it("devuelve la más reciente con su carga", () => {
    expect(ultimaVezQueLoHiciste("EJ-1", historial)).toMatchObject({ fecha: "2026-09-03", cargaKg: 25 });
  });

  it("devuelve null si nunca se hizo", () => {
    expect(ultimaVezQueLoHiciste("EJ-9", historial)).toBeNull();
  });

  it("no cuenta las series sin completar", () => {
    const sinCompletar = [{
      ...sesion("2026-09-01", "EJ-7", 15),
      bloques: [{
        orden: 1, idEjercicio: "EJ-7", nombreEjercicio: "x", modalidad: "Fuerza",
        series: [{ serie: 1, completada: false, cargaKg: 15 }],
      }],
    } as unknown as Historial];
    expect(ultimaVezQueLoHiciste("EJ-7", sinCompletar)).toBeNull();
    expect(vecesQueLoHiciste("EJ-7", sinCompletar)).toBe(0);
  });

  it("cuenta las veces por sesión, no por bloque", () => {
    expect(vecesQueLoHiciste("EJ-1", historial)).toBe(2);
    expect(vecesQueLoHiciste("EJ-2", historial)).toBe(1);
  });
});

// ════════════════════════════════════════════════════════════════════════════
//  Segunda vuelta: los secundarios miden similitud, y el desempate por nivel
// ════════════════════════════════════════════════════════════════════════════

describe("similitudSecundarios", () => {
  const con = (gs: string[]) => ej("EJ-X", "X", { gruposSecundarios: gs as never });

  it("listas idénticas dan 1", () => {
    expect(similitudSecundarios(con(["Tríceps", "Hombros"]), con(["Hombros", "Tríceps"]))).toBe(1);
  });

  it("sin nada en común da 0", () => {
    expect(similitudSecundarios(con(["Tríceps"]), con(["Isquios"]))).toBe(0);
  });

  it("uno compartido de tres en la unión da un tercio", () => {
    expect(similitudSecundarios(con(["Tríceps", "Hombros"]), con(["Tríceps", "Core"]))).toBeCloseTo(1 / 3, 5);
  });

  it("una lista vacía da 0: no hay parecido que medir", () => {
    expect(similitudSecundarios(con([]), con(["Tríceps"]))).toBe(0);
    expect(similitudSecundarios(con(["Tríceps"]), con([]))).toBe(0);
    expect(similitudSecundarios(con([]), con([]))).toBe(0);
  });

  it("tener MÁS secundarios ya no premia: gana el que se parece más", () => {
    // El original tiene dos. Uno comparte los dos y nada más; el otro comparte
    // los dos pero arrastra cuatro más. Antes empataban en el tope; ahora no.
    const original = ej("EJ-ORIG2", "O", { gruposSecundarios: ["Tríceps", "Hombros"] as never });
    const justo = ej("EJ-1", "Ajustado", {
      gruposSecundarios: ["Tríceps", "Hombros"] as never, equipo: ["Mancuernas"],
    });
    const inflado = ej("EJ-2", "Inflado", {
      gruposSecundarios: ["Tríceps", "Hombros", "Core", "Glúteos", "Isquios", "Cuádriceps"] as never,
      equipo: ["Mancuernas"],
    });
    const r = sugerirSustitutos({
      catalogo: [justo, inflado], original, equipo: ["Mancuernas"], historial: [], now: AHORA,
    });
    expect(r.candidatos[0].ejercicio.idEjercicio).toBe("EJ-1");
    expect(r.candidatos[0].puntaje - r.candidatos[1].puntaje).toBeCloseTo(
      TOPE_GRUPOS_SECUNDARIOS * (1 - 2 / 6), 5,
    );
  });

  it("un candidato sin secundarios declarados no suma por ese lado", () => {
    const original = ej("EJ-ORIG2", "O", { gruposSecundarios: ["Tríceps"] as never });
    const sinNada = ej("EJ-1", "Sin secundarios", {
      gruposSecundarios: [] as never, equipo: ["Mancuernas"],
    });
    const conTriceps = ej("EJ-2", "Con tríceps", {
      gruposSecundarios: ["Tríceps"] as never, equipo: ["Mancuernas"],
    });
    const r = sugerirSustitutos({
      catalogo: [sinNada, conTriceps], original, equipo: ["Mancuernas"], historial: [], now: AHORA,
    });
    expect(r.candidatos[0].ejercicio.idEjercicio).toBe("EJ-2");
    expect(r.candidatos[1].puntaje).toBe(r.candidatos[0].puntaje - TOPE_GRUPOS_SECUNDARIOS);
  });
});

describe("desempate por nivel", () => {
  it("entre dos empatados gana el del mismo nivel que el original", () => {
    // El alfabético pondría primero a "Alfa"; el nivel lo corrige.
    const alfa = ej("EJ-A", "Alfa press", { nivel: "Principiante", equipo: ["Mancuernas"] });
    const zeta = ej("EJ-Z", "Zeta press", { nivel: "Intermedio", equipo: ["Mancuernas"] });
    const orden = correr([alfa, zeta]).candidatos.map((c) => c.ejercicio.nombre);
    expect(orden).toEqual(["Zeta press", "Alfa press"]);   // el original es Intermedio
  });

  it("el alfabético sigue mandando entre dos del mismo nivel", () => {
    const zeta = ej("EJ-Z", "Zeta press", { nivel: "Intermedio", equipo: ["Mancuernas"] });
    const alfa = ej("EJ-A", "Alfa press", { nivel: "Intermedio", equipo: ["Mancuernas"] });
    const orden = correr([zeta, alfa]).candidatos.map((c) => c.ejercicio.nombre);
    expect(orden).toEqual(["Alfa press", "Zeta press"]);
  });

  it("el menos usado sigue ganándole al nivel", () => {
    const mismoNivelUsado = ej("EJ-A", "Alfa press", { nivel: "Intermedio", equipo: ["Mancuernas"] });
    const otroNivelNuevo = ej("EJ-Z", "Zeta press", { nivel: "Principiante", equipo: ["Mancuernas"] });
    // Los dos con el mismo puntaje: el bono de "ya lo hiciste" se lo doy a los
    // dos para que el empate quede en el escalón del uso.
    const historial = [
      sesion("2026-09-01", "EJ-A", 20), sesion("2026-09-02", "EJ-A", 20),
      sesion("2026-09-03", "EJ-Z", 20),
    ];
    const orden = correr([mismoNivelUsado, otroNivelNuevo], { historial })
      .candidatos.map((c) => c.ejercicio.nombre);
    expect(orden[0]).toBe("Zeta press");   // usado 1 vez contra 2
  });
});
