import { describe, it, expect } from "vitest";
import {
  adaptarEjercicio, adaptarComposicion, adaptarRegistros, elegirPorPuente,
  actividadDeTipo, TITULO_SHAPEUP, type MedicionSdk, type RegistroSdk,
} from "./adaptadorSdk";
import { esAutodetectada, origenDe, clasificarImport, type ConfigClasificacion } from "./importSelectivo";
import { idCardioDe } from "../data/salud";
import { marcasDe } from "./actividadRelevante";
import { parsearEjercicio } from "../import/samsungHealth";
import type { Historial } from "../types/models";
import {
  CRUDO_SHAPEUP, CRUDO_CAMINATA, CRUDO_COMPOSICION_GARMIN,
  CRUDO_COMPOSICION_HEALTHSYNC, CRUDO_COMPOSICION_RELOJ,
} from "./__fixtures__/crudoSdk";

const MIEMBRO = "juanpablo" as const;

// ── adaptarEjercicio ──────────────────────────────────────────────────────────

describe("adaptarEjercicio — sesión de ShapeUp", () => {
  const item = adaptarEjercicio(CRUDO_SHAPEUP, MIEMBRO)!;

  it("sale un EjercicioItem con los campos del ZIP", () => {
    expect(item._uuid).toBe("078f3af5-f086-4b09-9bfd-aeac9305f6a3");
    expect(item._startMs).toBe(1783427640729);
    expect(item._endMs).toBe(1783430898914);
    expect(item.fecha).toBe("2026-07-07");
    expect(item.duracionMin).toBe(54);
    expect(item.kcal).toBe(527.49);
    expect(item.fcPromedio).toBe(130);
    expect(item.fcMaxima).toBe(157);
    expect(item._fcMin).toBe(69);
    expect(item.miembro).toBe(MIEMBRO);
    expect(item.fuente).toBe("samsung-health-csv");
  });

  it("la fecha sale de la hora LOCAL, no del UTC", () => {
    // El inicio es 12:34 UTC del 7/7, que en -03:00 es 09:34 del 7/7. Acá
    // coinciden, pero el campo que se usa es `startLocalDateTime`.
    expect(item.fecha).toBe(CRUDO_SHAPEUP.startLocalDateTime.slice(0, 10));
  });

  it("customTitle ocupa el lugar de custom_id", () => {
    expect(item._customId).toBe(TITULO_SHAPEUP);
  });

  it("la actividad es el título propio", () => {
    expect(item.actividad).toBe("ShapeUp");
  });

  it("esVR queda en false: por el SDK, fuerza y VR son indistinguibles", () => {
    // ADR #028: un solo workout custom para las dos. Quien sabe si fue VR es el
    // Historial de la app, y esta sesión lo enriquece.
    expect(item.esVR).toBe(false);
  });

  it("cuenta las muestras de curva pero NO se lleva la curva", () => {
    expect(item._muestrasCurva).toBe(3);   // la fixture trae 3 puntos
    expect(item).not.toHaveProperty("log");
    expect(JSON.stringify(item)).not.toContain("timestamp");
  });

  it("no la marca como autodetectada", () => {
    expect(item._autoDetected).toBe(false);
    expect(esAutodetectada(item)).toBe(false);
    expect(origenDe(item)).toBe("declarada");
  });

  it("sin distancia no inventa el campo", () => {
    expect(item.distanciaKm).toBeUndefined();
  });
});

describe("adaptarEjercicio — caminata autodetectada", () => {
  const item = adaptarEjercicio(CRUDO_CAMINATA, MIEMBRO)!;

  it("traduce el enum de texto al mismo nombre que usa el ZIP", () => {
    expect(item.actividad).toBe("Caminata");
  });

  it("convierte la distancia de metros a km", () => {
    expect(item.distanciaKm).toBe(0.71);
  });

  it("la marca autodetectada por el flag, aunque tenga FC y curva", () => {
    // Es el caso que rompía la heurística de densidad: 0,82 muestras/s y FC
    // media 98, y aun así el reloj la registró solo.
    expect(item.fcPromedio).toBe(98);
    expect(item._muestrasCurva).toBeGreaterThan(0);
    expect(esAutodetectada(item)).toBe(true);
    expect(origenDe(item)).toBe("autodetectada");
  });

  it("sin customTitle no hay _customId", () => {
    expect(item._customId).toBeUndefined();
  });
});

describe("adaptarEjercicio — robustez", () => {
  it("un crudo sin sesiones devuelve null", () => {
    expect(adaptarEjercicio({ uid: "x", fields: { sessions: [] } }, MIEMBRO)).toBeNull();
  });

  it("un crudo vacío o de otra forma devuelve null, no rompe", () => {
    expect(adaptarEjercicio(null, MIEMBRO)).toBeNull();
    expect(adaptarEjercicio({}, MIEMBRO)).toBeNull();
    expect(adaptarEjercicio({ hola: 1 }, MIEMBRO)).toBeNull();
  });

  it("no muta la entrada", () => {
    const copia = structuredClone(CRUDO_SHAPEUP);
    adaptarEjercicio(CRUDO_SHAPEUP, MIEMBRO);
    expect(CRUDO_SHAPEUP).toEqual(copia);
  });

  it("deriva la zona si hay zonas configuradas", () => {
    const item = adaptarEjercicio(CRUDO_SHAPEUP, MIEMBRO, {
      Z2: { min: 101, max: 118 }, Z3: { min: 118, max: 135 },
    })!;
    expect(item.zonaPrincipal).toBe("Z3");   // FC media 130
  });
});

describe("actividadDeTipo", () => {
  it("el título propio manda sobre el tipo", () => {
    expect(actividadDeTipo("OTHER", "ShapeUp")).toBe("ShapeUp");
    expect(actividadDeTipo("WALKING", "Mi caminata")).toBe("Mi caminata");
  });

  it("traduce los enums conocidos", () => {
    expect(actividadDeTipo("WALKING", null)).toBe("Caminata");
    expect(actividadDeTipo("POOL_SWIMMING", null)).toBe("Natación");
    expect(actividadDeTipo("AEROBICS", null)).toBe("Aeróbico");
  });

  it("OTHER sin título es Personalizado, como el tipo 0 del ZIP", () => {
    expect(actividadDeTipo("OTHER", null)).toBe("Personalizado");
  });

  it("un enum desconocido queda a la vista, no se lo traga", () => {
    expect(actividadDeTipo("PADDLE_TENNIS", null)).toBe("Otro (PADDLE_TENNIS)");
  });
});

// ── adaptarComposicion ────────────────────────────────────────────────────────

describe("adaptarComposicion", () => {
  it("sale un MedicionInput con los campos del ZIP", () => {
    const m = adaptarComposicion(CRUDO_COMPOSICION_GARMIN, MIEMBRO)!;
    expect(m._uuid).toBe("06a63f36-ea1d-4cce-8d5b-20b4fa8a9758");
    expect(m.fecha).toBe("2026-09-05");
    expect(m.pesoKg).toBe(89.3);
    expect(m.imc).toBe(34);
    expect(m.miembro).toBe(MIEMBRO);
    expect(m.fuente).toBe("samsung-health-csv");
  });

  it("los campos que Garmin no llena no se inventan", () => {
    const m = adaptarComposicion(CRUDO_COMPOSICION_GARMIN, MIEMBRO)!;
    expect(m.grasaPct).toBeUndefined();
    expect(m.masaMuscularKg).toBeUndefined();
    expect(m.aguaPct).toBeUndefined();
  });

  it("por Health Sync vienen más campos y se guardan todos", () => {
    const m = adaptarComposicion(CRUDO_COMPOSICION_HEALTHSYNC, MIEMBRO)!;
    expect(m.pesoKg).toBe(89.3);
    expect(m.grasaPct).toBe(32.2);
    expect(m.masaMuscularKg).toBe(34.82);
    expect(m.aguaPct).toBe(42.77);
  });

  it("el peso del reloj se descarta: lo hereda del perfil, no lo mide", () => {
    expect(adaptarComposicion(CRUDO_COMPOSICION_RELOJ, MIEMBRO)).toBeNull();
  });

  it("sin peso no hay medición", () => {
    const sinPeso = { ...CRUDO_COMPOSICION_GARMIN, fields: { ...CRUDO_COMPOSICION_GARMIN.fields, weight: null } };
    expect(adaptarComposicion(sinPeso, MIEMBRO)).toBeNull();
  });

  it("un crudo de otra forma devuelve null, no rompe", () => {
    expect(adaptarComposicion(null, MIEMBRO)).toBeNull();
    expect(adaptarComposicion({ uid: "x" }, MIEMBRO)).toBeNull();
  });
});

describe("elegirPorPuente — los métodos no se mezclan", () => {
  const garmin    = adaptarComposicion(CRUDO_COMPOSICION_GARMIN, MIEMBRO)!;
  const healthSync = adaptarComposicion(CRUDO_COMPOSICION_HEALTHSYNC, MIEMBRO)!;

  it("con los dos en el mismo instante entra solo Health Sync", () => {
    const { elegidas, descartadas } = elegirPorPuente([garmin, healthSync]);
    expect(elegidas).toHaveLength(1);
    expect(elegidas[0]._appId).toBe("nl.appyhapps.healthsync");
    expect(descartadas).toHaveLength(1);
    expect(descartadas[0].medicion._appId).toBe("com.garmin.android.apps.connectmobile");
  });

  it("el orden en que llegan no cambia quién gana", () => {
    expect(elegirPorPuente([healthSync, garmin]).elegidas[0]._appId).toBe("nl.appyhapps.healthsync");
  });

  it("sin Health Sync entra Garmin: es preferencia, no lista negra", () => {
    const { elegidas, descartadas } = elegirPorPuente([garmin]);
    expect(elegidas).toHaveLength(1);
    expect(elegidas[0]._appId).toBe("com.garmin.android.apps.connectmobile");
    expect(descartadas).toHaveLength(0);
  });

  it("no fusiona campos de una con la otra", () => {
    const { elegidas } = elegirPorPuente([garmin, healthSync]);
    // La de Garmin tenía grasaPct undefined; la elegida es la de Health Sync
    // ENTERA, no una mezcla de las dos.
    expect(elegidas[0]._uuid).toBe(healthSync._uuid);
    expect(elegidas[0].grasaPct).toBe(32.2);
  });

  it("mediciones en instantes distintos entran las dos", () => {
    const otra: MedicionSdk = { ...garmin, _uuid: "otro", _inicioMs: garmin._inicioMs + 86_400_000 };
    expect(elegirPorPuente([garmin, otra]).elegidas).toHaveLength(2);
  });
});

// ── adaptarRegistros ──────────────────────────────────────────────────────────

describe("adaptarRegistros", () => {
  const registros: RegistroSdk[] = [
    { id: "exercise_a", dataType: "exercise", crudo: CRUDO_SHAPEUP },
    { id: "exercise_b", dataType: "exercise", crudo: CRUDO_CAMINATA },
    { id: "bc_garmin",  dataType: "body_composition", crudo: CRUDO_COMPOSICION_GARMIN },
    { id: "bc_hs",      dataType: "body_composition", crudo: CRUDO_COMPOSICION_HEALTHSYNC },
    { id: "bc_reloj",   dataType: "body_composition", crudo: CRUDO_COMPOSICION_RELOJ },
    { id: "pasos_1",    dataType: "step_count", crudo: {} },
  ];

  const r = adaptarRegistros(registros, MIEMBRO);

  it("reparte por dataType", () => {
    expect(r.ejercicios).toHaveLength(2);
    expect(r.mediciones).toHaveLength(1);       // Garmin y Health Sync son la misma
  });

  it("un dataType no soportado se ignora con el motivo", () => {
    expect(r.ignorados).toEqual([{ id: "pasos_1", motivo: "dataType no soportado: step_count" }]);
  });

  it("informa por qué se descartó cada medición", () => {
    const motivos = r.medicionesDescartadas.map((d) => d.motivo);
    expect(motivos).toContainEqual("peso del reloj (heredado, no medido)");
    expect(motivos.some((m) => m.startsWith("mismo instante"))).toBe(true);
  });

  it("lista vacía no rompe", () => {
    const vacio = adaptarRegistros([], MIEMBRO);
    expect(vacio.ejercicios).toEqual([]);
    expect(vacio.mediciones).toEqual([]);
  });
});

// ── La comprobación que evita duplicar el historial ───────────────────────────

describe("mismo hecho por las dos vías = mismo id", () => {
  const porSdk = adaptarEjercicio(CRUDO_SHAPEUP, MIEMBRO)!;

  /** Lo que produciría el parser del ZIP para la MISMA fila (datauuid igual). */
  const porZip = {
    _uuid: "078f3af5-f086-4b09-9bfd-aeac9305f6a3",
    _startMs: 1783427640729,
    _endMs: 1783430898914,
    miembro: MIEMBRO, fecha: "2026-07-07", actividad: "ShapeUp", esVR: false,
    duracionMin: 54, kcal: 527.49, fcPromedio: 130, fcMaxima: 157, _fcMin: 69,
    fuente: "samsung-health-csv" as const,
  };

  it("el uid del SDK es el datauuid del ZIP", () => {
    expect(porSdk._uuid).toBe(porZip._uuid);
  });

  it("el id de cardio coincide", () => {
    expect(idCardioDe(porSdk._uuid)).toBe(idCardioDe(porZip._uuid));
    expect(idCardioDe(porSdk._uuid)).toBe("CAR-078f3af5-f086-4b09-9bfd-aeac9305f6a3");
  });

  it("el id de /cardio coincide en las dos vías", () => {
    // Desde P76b no hay una segunda copia en /historial: el único id que hay
    // que hacer coincidir es el de la actividad (P76b).
    expect(idCardioDe(porSdk._uuid)).toBe(idCardioDe(porZip._uuid));
  });

  it("los campos que se guardan coinciden en las dos vías", () => {
    for (const k of ["fecha", "duracionMin", "kcal", "fcPromedio", "fcMaxima", "_fcMin", "_startMs", "_endMs"] as const) {
      expect(porSdk[k as keyof typeof porSdk]).toBe(porZip[k as keyof typeof porZip]);
    }
  });

  it("el id de la medición coincide con el del ZIP", () => {
    const m = adaptarComposicion(CRUDO_COMPOSICION_GARMIN, MIEMBRO)!;
    expect(`MED-${m._uuid}`).toBe("MED-06a63f36-ea1d-4cce-8d5b-20b4fa8a9758");
  });
});

// ── El clasificador de P75 sobre lo que trae el puente ────────────────────────

describe("clasificarImport sobre lo adaptado", () => {
  const CONFIG: ConfigClasificacion = {
    duracionMinimaMin: 10,
    actividadesSiempreRelevantes: ["Body Combat", "Aeróbico"],
  };
  const AHORA = Date.UTC(2026, 8, 17, 12, 0);
  const items = [
    adaptarEjercicio(CRUDO_SHAPEUP, MIEMBRO)!,
    adaptarEjercicio(CRUDO_CAMINATA, MIEMBRO)!,
  ];

  it("la de ShapeUp enriquece la sesión de la app si existe", () => {
    const hist: Historial[] = [{
      idHist: "H-20260707", fechaRealizada: "2026-07-07", tipo: "rutina",
      inicioMs: 1783427640729, finMs: 1783430898914, nombreRutina: "Fuerza A",
      bloques: [],
    } as unknown as Historial];
    const [shapeUp] = clasificarImport(items, hist, [TITULO_SHAPEUP], CONFIG, AHORA);
    expect(shapeUp.destino).toBe("enriquece");
    expect(shapeUp.motivo).toBe("shapeup");
    expect(shapeUp.idHist).toBe("H-20260707");
  });

  it("sin sesión que enriquecer entra como externa marcada, no se pierde", () => {
    const [shapeUp] = clasificarImport(items, [], [TITULO_SHAPEUP], CONFIG, AHORA);
    expect(shapeUp.destino).toBe("externa");
    expect(shapeUp.motivoIngreso).toBe("shapeup-sin-sesion");
  });

  it("la caminata de 12 min entra como externa por duración", () => {
    const [, caminata] = clasificarImport(items, [], [TITULO_SHAPEUP], CONFIG, AHORA);
    expect(caminata.destino).toBe("externa");
    expect(caminata.motivoIngreso).toBe("duracion");
  });

  it("y queda marcada como autodetectada en el documento de /cardio", () => {
    const [, caminata] = clasificarImport(items, [], [TITULO_SHAPEUP], CONFIG, AHORA);
    expect(marcasDe(caminata.item).autodetectada).toBe(true);
  });
});

// ── Verificación cruzada ZIP ↔ SDK (P76a) ────────────────────────────────────
//
// La prueba de fuego del arreglo de hora: la MISMA sesión, entrando por las dos
// vías, tiene que dar el mismo `inicioMs`. Los datos de abajo son reales, de la
// sesión de pileta del 10/7/2026 (uuid ca63c94f…): la fila del CSV del export
// del 14/9 y el crudo que devolvió el Data SDK para el mismo uid.
//
// Contra los datos completos: 71 actividades existen por las dos vías, y con el
// parser corregido coinciden 71/71 (antes, 0/71).

describe("verificación cruzada ZIP ↔ SDK — misma sesión, mismo inicioMs", () => {
  const UUID = "ca63c94f-dcdd-4232-8055-a0dd09988b37";
  const INICIO_REAL = 1783701598319;   // 2026-07-10T16:39:58.319Z = 13:39 en -03:00

  const CSV_ZIP =
    `com.samsung.shealth.exercise,7006011,17\n` +
    `com.samsung.health.exercise.start_time,com.samsung.health.exercise.end_time,` +
    `com.samsung.health.exercise.time_offset,com.samsung.health.exercise.datauuid,` +
    `com.samsung.health.exercise.exercise_type,com.samsung.health.exercise.calorie,` +
    `com.samsung.health.exercise.duration\n` +
    `2026-07-10 16:39:58.319,2026-07-10 16:48:30.219,UTC-0300,${UUID},14001,113.08,511900\n`;

  const CRUDO_SDK = {
    uid: UUID,
    appId: "com.sec.android.app.shealth",
    startTime: { epochMs: INICIO_REAL, iso: "2026-07-10T16:39:58.319Z" },
    endTime:   { epochMs: 1783702110219, iso: "2026-07-10T16:48:30.219Z" },
    zoneOffset: "-03:00",
    startLocalDateTime: "2026-07-10T13:39:58.319",
    fields: {
      sessions: [{
        startTime: { epochMs: INICIO_REAL, iso: "2026-07-10T16:39:58.319Z" },
        endTime:   { epochMs: 1783702110219, iso: "2026-07-10T16:48:30.219Z" },
        duration:  { ms: 511900, iso: "PT8M31.9S" },
        exerciseType: "POOL_SWIMMING", customTitle: null,
        calories: 113.08, distance: null,
        maxHeartRate: 104, meanHeartRate: 100, minHeartRate: 97,
        autoDetected: true, logSize: null, logWithHeartRate: null, log: null,
      }],
    },
  };

  const porZip = parsearEjercicio(CSV_ZIP, MIEMBRO).items[0];
  const porSdk = adaptarEjercicio(CRUDO_SDK, MIEMBRO)!;

  it("el ZIP da el inicioMs real, el mismo que el SDK", () => {
    expect(porZip._startMs).toBe(INICIO_REAL);
    expect(porSdk._startMs).toBe(INICIO_REAL);
  });

  it("las dos vías coinciden en fecha y actividad", () => {
    expect(porZip.fecha).toBe("2026-07-10");
    expect(porSdk.fecha).toBe("2026-07-10");
    expect(porZip.actividad).toBe("Natación");
    expect(porSdk.actividad).toBe("Natación");
  });

  it("y por lo tanto caen en el mismo documento de /cardio", () => {
    expect(idCardioDe(porZip._uuid)).toBe(idCardioDe(porSdk._uuid));
  });
});
