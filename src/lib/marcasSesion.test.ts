import { describe, expect, it } from "vitest";
import type { BloqueRegistro, Historial, MarcaSesion } from "../types/models";
import { IDS_MARCA } from "../types/models";
import {
  marcaCalidad, marcaCarga, marcaRecord, marcaSemana, marcaZonaAltaOVolumen,
  marcasDeSesion, separarPorNivel, textoMarca,
} from "./marcasSesion";

const LES_MILLS = "EJ-9003";
const OTRO_JUEGO = "EJ-9004";

function cardio(idEjercicio: string, nombre = "Les Mills Bodycombat (VR)"): BloqueRegistro {
  return { orden: 1, idEjercicio, nombreEjercicio: nombre, modalidad: "Cardio", series: [{ serie: 1, completada: true }] };
}
function fuerza(carga: number, id = "EJ-0001", nombre = "Press de banca"): BloqueRegistro {
  return {
    orden: 1, idEjercicio: id, nombreEjercicio: nombre, modalidad: "Fuerza",
    series: [{ serie: 1, reps: 10, cargaKg: carga, completada: true }],
  };
}
function ses(p: Partial<Historial> & { idHist: string }): Historial {
  return {
    fechaRealizada: "2026-10-05", semanaInicio: "2026-10-05", tipo: "rutina", miembro: "juan",
    duracionRealMin: null, bloques: [],
    ...p,
  } as unknown as Historial;
}
const zonas = (z1: number, z2: number, z3: number, z4: number, z5: number) => ({ Z1: z1, Z2: z2, Z3: z3, Z4: z4, Z5: z5 });
function vr(idHist: string, fecha: string, carga: [number, number, number, number, number], juego = LES_MILLS, extra: Partial<Historial> = {}): Historial {
  return ses({
    idHist, fechaRealizada: fecha, bloques: [cardio(juego)],
    biometria: { minutosPorZona: zonas(...carga) } as Historial["biometria"],
    ...extra,
  });
}

describe("calidad", () => {
  it("cobertura floja y FC dudosa", () => {
    const h = ses({ idHist: "a", biometria: { coberturaFina: 0.623, fcDudosa: true } as Historial["biometria"] });
    const m = marcaCalidad(h)!;
    expect(m).toMatchObject({ id: "calidad", nivel: 1, coberturaFina: 0.62, fcDudosa: true });
    expect(textoMarca(m)).toBe("Medición floja: el reloj cubrió el 62 % · FC dudosa: posibles artefactos");
  });
  it("textos sueltos y ausencias", () => {
    const flo = marcaCalidad(ses({ idHist: "a", biometria: { coberturaFina: 0.62 } as Historial["biometria"] }))!;
    expect(textoMarca(flo)).toBe("Medición floja: el reloj cubrió el 62 %");
    const du = marcaCalidad(ses({ idHist: "a", biometria: { coberturaFina: 0.95, fcDudosa: true } as Historial["biometria"] }))!;
    expect(textoMarca(du)).toBe("FC dudosa: posibles artefactos");
    expect(marcaCalidad(ses({ idHist: "a" }))).toBeNull();
    expect(marcaCalidad(ses({ idHist: "a", biometria: { coberturaFina: 0.95 } as Historial["biometria"] }))).toBeNull();
  });
});

describe("carga, zona alta y volumen", () => {
  it("carga = Σ min × zona, un decimal", () => {
    const m = marcaCarga(vr("a", "2026-10-05", [2, 5.5, 10, 10, 2.1]))!;
    expect(m).toMatchObject({ id: "carga", valor: 2 + 11 + 30 + 40 + 10.5 });
    expect(textoMarca(marcaCarga(vr("a", "2026-10-05", [0, 0, 0, 0, 0.5]) )!)).toBe("Carga 2,5");
    expect(marcaCarga(ses({ idHist: "a" }))).toBeNull();
  });
  it("zona alta con porcentaje sobre el tiempo con dato", () => {
    const h = vr("a", "2026-10-05", [3, 5, 8, 12, 20]);
    h.biometria!.minutosBajoZonas = 2;
    const m = marcaZonaAltaOVolumen(h)!;
    expect(m).toMatchObject({ id: "zonaAlta", minutos: 32, pct: 64 });
    expect(textoMarca(m)).toBe("Zona alta 32 min · 64 %");
  });
  it("volumen si hay tonelaje; nada si no hay ninguno", () => {
    const h = ses({ idHist: "a", bloques: [fuerza(115), { ...fuerza(115), orden: 2 }, { ...fuerza(115), orden: 3 }] });
    h.bloques[0].series[0].reps = 10;
    const m = marcaZonaAltaOVolumen(h)!;
    expect(m).toMatchObject({ id: "volumen", kg: 3450 });
    expect(textoMarca(m)).toBe("Volumen 3.450 kg");
    expect(marcaZonaAltaOVolumen(ses({ idHist: "a" }))).toBeNull();
  });
});

describe("record", () => {
  it("fuerza: récord a la fecha, ignora sesiones posteriores", () => {
    const antes = ses({ idHist: "p", fechaRealizada: "2026-09-28", bloques: [fuerza(60)] });
    const hoy = ses({ idHist: "h", fechaRealizada: "2026-10-05", bloques: [fuerza(62.5)] });
    const despues = ses({ idHist: "d", fechaRealizada: "2026-10-12", bloques: [fuerza(70)] });
    const m = marcaRecord(hoy, [antes, hoy, despues])!;
    expect(m).toMatchObject({ id: "record", metrica: "cargaKg", valor: 62.5, anterior: 60, actividad: "Press de banca" });
    expect(textoMarca(m)).toBe("Récord en Press de banca: 62,5 kg (antes 60 kg)");
    // Aunque exista una posterior mejor, la de hoy lo conserva; la posterior sí lo tiene contra todas.
    expect(marcaRecord(hoy, [antes, despues])).not.toBeNull();
    // Contra una posterior no hay récord.
    const solo = ses({ idHist: "s", fechaRealizada: "2026-09-01", bloques: [fuerza(50)] });
    expect(marcaRecord(solo, [solo, antes, hoy, despues])).toBeNull();
    // Primera vez: sin previas, no hay récord.
    expect(marcaRecord(antes, [antes])).toBeNull();
  });

  it("misma fecha: decide inicioMs", () => {
    const a = ses({ idHist: "a", inicioMs: 1000, bloques: [fuerza(60)] });
    const b = ses({ idHist: "b", inicioMs: 2000, bloques: [fuerza(65)] });
    expect(marcaRecord(b, [a, b])).not.toBeNull();
    expect(marcaRecord(a, [a, b])).toBeNull();
  });

  it("VR: récord a la fecha, ignora las posteriores y prioriza carga", () => {
    const p1 = vr("p1", "2026-09-20", [2, 5, 8, 8, 4]);
    const p2 = vr("p2", "2026-09-27", [2, 5, 8, 9, 4]);
    const hoy = vr("h", "2026-10-05", [2, 5, 9, 10, 5], LES_MILLS, { duracionRealMin: 50 });
    const post = vr("d", "2026-10-12", [2, 5, 20, 20, 10]);
    const m = marcaRecord(hoy, [p1, p2, hoy, post])!;
    expect(m).toMatchObject({ metrica: "carga", actividad: "Les Mills Bodycombat (VR)" });
    expect(m).toMatchObject({ valor: 2 + 10 + 27 + 40 + 25, anterior: 2 + 10 + 24 + 36 + 20 });
    expect(textoMarca({ ...m, valor: 180.2, anterior: 172.8 } as MarcaSesion))
      .toBe("Récord de carga en Les Mills Bodycombat (VR): 180,2 (antes 172,8)");
    // La posterior no se lleva el récord contra las anteriores... y hoy no lo tiene contra una posterior.
    expect(marcaRecord(p2, [p1, p2, hoy, post])).not.toBeNull();
    expect(marcaRecord(p1, [p1, p2, hoy, post])).toBeNull();
  });

  it("VR: Les Mills en dos rutinas se compara junto; otro juego no", () => {
    const largo = vr("l", "2026-09-20", [0, 0, 0, 5, 5], LES_MILLS, { idRutina: "RUT-0026" });
    const medida = vr("m", "2026-10-05", [0, 0, 0, 6, 6], LES_MILLS, { idRutina: "RUT-0030" });
    expect(marcaRecord(medida, [largo, medida])).toMatchObject({ metrica: "carga", anterior: 45 });
    const otro = vr("o", "2026-10-05", [0, 0, 0, 6, 6], OTRO_JUEGO);
    expect(marcaRecord(otro, [largo, otro])).toBeNull();
  });

  it("zona alta y duración cuando la carga no supera; textos en min", () => {
    const p = vr("p", "2026-09-20", [0, 0, 30, 5, 5], LES_MILLS, { duracionRealMin: 40 });
    const h = vr("h", "2026-10-05", [0, 0, 0, 6, 5], LES_MILLS, { duracionRealMin: 30 });
    const m = marcaRecord(h, [p, h])!;
    expect(m).toMatchObject({ metrica: "zonaAltaMin", valor: 11, anterior: 10 });
    expect(textoMarca(m)).toBe("Récord de zona alta en Les Mills Bodycombat (VR): 11 min (antes 10 min)");
    const d = ses({ idHist: "d", fechaRealizada: "2026-10-05", duracionRealMin: 45, bloques: [cardio(LES_MILLS)] });
    const pd = ses({ idHist: "pd", fechaRealizada: "2026-09-20", duracionRealMin: 40, bloques: [cardio(LES_MILLS)] });
    const md = marcaRecord(d, [pd, d])!;
    expect(md).toMatchObject({ metrica: "duracionMin", valor: 45, anterior: 40 });
    expect(textoMarca(md)).toBe("Récord de duración en Les Mills Bodycombat (VR): 45 min (antes 40 min)");
  });

  it("ignora lo que no es ShapeUp como previa", () => {
    const ext = { ...ses({ idHist: "x", fechaRealizada: "2026-09-20", bloques: [cardio(LES_MILLS)], duracionRealMin: 99 }), tipo: "externa" } as Historial;
    const h = ses({ idHist: "h", duracionRealMin: 30, bloques: [cardio(LES_MILLS)] });
    expect(marcaRecord(h, [ext, h])).toBeNull();
  });
});

describe("semana", () => {
  const plan = { metaDias: 5, idPrograma: "PRG-1" };
  it("sin planSemana no hay marca", () => {
    expect(marcaSemana(ses({ idHist: "a" }), [])).toBeNull();
  });
  it("con plan: días distintos hasta hoy, sin fuerza", () => {
    const lun = ses({ idHist: "l", fechaRealizada: "2026-10-05", bloques: [cardio(LES_MILLS)] });
    const mie = ses({ idHist: "m", fechaRealizada: "2026-10-07", bloques: [cardio(LES_MILLS)], planSemana: plan });
    const vie = ses({ idHist: "v", fechaRealizada: "2026-10-09", bloques: [fuerza(60)] });
    const otraSemana = ses({ idHist: "o", fechaRealizada: "2026-09-30", semanaInicio: "2026-09-28" });
    const m = marcaSemana(mie, [lun, mie, vie, otraSemana])!;
    expect(m).toMatchObject({ dias: 2, meta: 5, diasFuerza: 0 });
    expect(textoMarca(m)).toBe("2 de 5 · sin fuerza");
  });
  it("cuenta días con fuerza y no duplica fechas", () => {
    const a = ses({ idHist: "a", fechaRealizada: "2026-10-05", bloques: [fuerza(60)] });
    const a2 = ses({ idHist: "a2", fechaRealizada: "2026-10-05", bloques: [cardio(LES_MILLS)] });
    const c = ses({ idHist: "c", fechaRealizada: "2026-10-08", bloques: [cardio(LES_MILLS)], planSemana: plan });
    const m = marcaSemana(c, [a, a2])!;
    expect(m).toMatchObject({ dias: 2, diasFuerza: 1 });
    expect(textoMarca({ ...m, dias: 3 } as MarcaSesion)).toBe("3 de 5 · 1 con fuerza");
  });
});

describe("marcasDeSesion", () => {
  const guardadas: MarcaSesion[] = [
    { id: "pico", nivel: 2, suavizado: 169, crudo: 170 },
    { id: "tramoSostenido", nivel: 2, duracionSeg: 1076 },
    { id: "picoSobreVigente", nivel: 1, suavizado: 171, crudo: 173, fcMaxVigente: 169 },
    { id: "carga", nivel: 1, valor: 999 }, // choca con la calculada: gana la de acá
  ];
  const h = vr("h", "2026-10-05", [2, 5, 9, 10, 5], LES_MILLS, {
    planSemana: { metaDias: 5, idPrograma: null },
    biometria: { minutosPorZona: zonas(2, 5, 9, 10, 5), fcDudosa: true, marcas: guardadas } as Historial["biometria"],
  });
  const previa = vr("p", "2026-09-20", [2, 5, 8, 8, 4]);

  it("respeta el orden de IDS_MARCA y no duplica ids", () => {
    const ms = marcasDeSesion(h, { historial: [previa, h] });
    const ids = ms.map((m) => m.id);
    expect(ids).toEqual(["calidad", "record", "picoSobreVigente", "carga", "zonaAlta", "semana", "tramoSostenido", "pico"]);
    expect(new Set(ids).size).toBe(ids.length);
    const indices = ids.map((i) => IDS_MARCA.indexOf(i));
    expect([...indices].sort((a, b) => a - b)).toEqual(indices);
    expect(ms.find((m) => m.id === "carga")).toMatchObject({ valor: 2 + 10 + 27 + 40 + 25 });
  });

  it("los ids son fijos entre llamadas", () => {
    const a = marcasDeSesion(h, { historial: [previa, h] }).map((m) => m.id);
    const b = marcasDeSesion(h, { historial: [previa, h] }).map((m) => m.id);
    expect(a).toEqual(b);
  });

  it("separa por nivel", () => {
    const { badges, secundarias } = separarPorNivel(marcasDeSesion(h, { historial: [previa, h] }));
    expect(badges.every((m) => m.nivel === 1)).toBe(true);
    expect(secundarias.map((m) => m.id)).toEqual(["tramoSostenido", "pico"]);
  });
});

describe("textoMarca", () => {
  const t = (m: Record<string, unknown>) => textoMarca(m as unknown as MarcaSesion);
  it("marcas de la curva", () => {
    expect(t({ id: "picoSobreVigente", nivel: 1, suavizado: 171, crudo: 173, fcMaxVigente: 169 })).toBe("Pico 171 sobre tu FC máx 169 (crudo 173)");
    expect(t({ id: "tramoSostenido", nivel: 2, duracionSeg: 1076 })).toBe("Tramo sostenido 17:56");
    expect(t({ id: "tramoBajo", nivel: 2, duracionSeg: 250 })).toBe("Tramo bajo 4:10");
    expect(t({ id: "mitades", nivel: 2, primera: 140, segunda: 145.5, diferencia: 5.5, corteS: 500 })).toBe("Mitades 140 → 145,5 (+5,5)");
    expect(t({ id: "picosZ5", nivel: 2, entradas: 5, masLargaSeg: 67 })).toBe("Z5: 5 veces · la más larga 1:07");
    expect(t({ id: "entradaEnCalor", nivel: 2, segundos: 531 })).toBe("Entrada en calor 8:51");
    expect(t({ id: "pico", nivel: 2, suavizado: 169, crudo: 170 })).toBe("Pico 169 (crudo 170)");
  });
  it("recuperación entre series", () => {
    const bajadas = [1, 2, 3, 4, 5].map((i) => ({ picoS: i * 100, pico: 150, caida60: 20, caida120: 30 }));
    expect(t({ id: "recuperacionSeries", nivel: 2, bajadas, mayor: { picoS: 100, caida: 30, enSeg: 60 }, pausas: [] }))
      .toBe("5 bajadas · mayor −30 en 60 s");
    expect(t({ id: "recuperacionSeries", nivel: 2, bajadas: [], mayor: null, pausas: [{ orden: 1, serie: 1, bpm: 22 }, { orden: 1, serie: 2, bpm: 18 }] }))
      .toBe("Recuperación entre series: −22, −18 bpm");
  });
  it("semana con fuerza y mitades negativas", () => {
    expect(t({ id: "semana", nivel: 1, dias: 3, meta: 5, diasFuerza: 1 })).toBe("3 de 5 · 1 con fuerza");
    expect(t({ id: "mitades", nivel: 2, primera: 145, segunda: 140, diferencia: -5, corteS: 1 })).toBe("Mitades 145 → 140 (−5)");
  });
});
