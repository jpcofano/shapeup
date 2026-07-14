import { describe, it, expect } from "vitest";
import {
  elegirSesionSamsung,
  enriquecerSerie,
  derivarZona,
  construirBiometriaSesion,
  construirBiometriaRango,
  topeInicioSiguiente,
  TOPE_RECUPERACION_ULTIMA_SERIE_MS,
  type SesionSamsung,
} from "./matchBiometrico";
import type { SerieRegistro, PerfilMiembro } from "../types/models";
import type { LiveDataPoint } from "../import/samsungLiveData";

// ── elegirSesionSamsung ───────────────────────────────────────────────────────

const APP = { inicioMs: 1_000_000, finMs: 1_003_600_000 }; // ~1h sesión

const SAMSUNG_SHAPEUP: SesionSamsung = {
  datauuid: "uuid-shapeup",
  startMs: 1_000_000,
  endMs:   1_003_600_000,
  customId: "mq1mz4gd_gq",
  fcMedia: 130,
};
const SAMSUNG_OTRO: SesionSamsung = {
  datauuid: "uuid-otro",
  startMs: 1_000_000,
  endMs:   1_003_600_000,
  // sin customId — otro tipo
};

describe("elegirSesionSamsung", () => {
  it("elige por custom_id cuando se conoce", () => {
    const res = elegirSesionSamsung(APP, [SAMSUNG_OTRO, SAMSUNG_SHAPEUP], "mq1mz4gd_gq");
    expect(res?.sesion?.datauuid).toBe("uuid-shapeup");
    expect(res?.matchPor).toBe("custom-id");
  });

  it("cae al fallback por ventana si no hay custom_id match", () => {
    const res = elegirSesionSamsung(APP, [SAMSUNG_OTRO]);
    expect(res?.matchPor).toBe("ventana");
    expect(res?.sesion?.datauuid).toBe("uuid-otro");
  });

  it("elige la de menor Δinicio entre múltiples candidatas (ranking por Δinicio, P57)", () => {
    const parcial: SesionSamsung = {
      datauuid: "uuid-parcial",
      startMs: 1_002_000_000,  // empieza tarde → mayor Δinicio
      endMs:   1_003_600_000,
      customId: "mq1mz4gd_gq",
    };
    const res = elegirSesionSamsung(APP, [parcial, SAMSUNG_SHAPEUP], "mq1mz4gd_gq");
    expect(res?.sesion?.datauuid).toBe("uuid-shapeup");
  });

  it("retorna null si ninguna candidata solapa", () => {
    const lejos: SesionSamsung = {
      datauuid: "uuid-lejos",
      startMs: 9_000_000_000,
      endMs:   9_003_600_000,
    };
    expect(elegirSesionSamsung(APP, [lejos])).toBeNull();
  });
});

// ── elegirSesionSamsung — fallback "día único" (S-fix-b) ─────────────────────

describe("elegirSesionSamsung — día único", () => {
  const APP_SINTETICA = {
    inicioMs: 1_000_000, finMs: 1_003_600_000,
    sintetica: true, fecha: "2026-07-07",
  };
  const APP_REAL = {
    inicioMs: 1_000_000, finMs: 1_003_600_000,
    sintetica: false, fecha: "2026-07-07",
  };

  const UNICA_DEL_DIA: SesionSamsung = {
    datauuid: "uuid-unica", startMs: 9_000_000_000, endMs: 9_003_600_000, // lejos, no solapa
    customId: "mq1mz4gd_gq", fecha: "2026-07-07",
  };
  const OTRA_DEL_DIA: SesionSamsung = {
    datauuid: "uuid-otra", startMs: 9_100_000_000, endMs: 9_103_600_000, // lejos, no solapa
    customId: "mq1mz4gd_gq", fecha: "2026-07-07",
  };
  const DE_OTRO_DIA: SesionSamsung = {
    datauuid: "uuid-otro-dia", startMs: 9_200_000_000, endMs: 9_203_600_000,
    customId: "mq1mz4gd_gq", fecha: "2026-07-06",
  };

  it("ventana sintética + exactamente 1 ShapeUp ese día → matchPor 'dia'", () => {
    const res = elegirSesionSamsung(APP_SINTETICA, [UNICA_DEL_DIA, DE_OTRO_DIA], "mq1mz4gd_gq");
    expect(res).not.toBeNull();
    expect(res!.matchPor).toBe("dia");
    expect(res!.sesion?.datauuid).toBe("uuid-unica");
  });

  it("ventana sintética + 2+ ShapeUp ese día → 'ambiguo' (no adivina)", () => {
    const res = elegirSesionSamsung(APP_SINTETICA, [UNICA_DEL_DIA, OTRA_DEL_DIA], "mq1mz4gd_gq");
    expect(res).toEqual({ sesion: null, matchPor: "ambiguo" });
  });

  it("ventana real (no sintética) con las mismas candidatas → sigue sin matchear (no afloja techos)", () => {
    const res = elegirSesionSamsung(APP_REAL, [UNICA_DEL_DIA, DE_OTRO_DIA], "mq1mz4gd_gq");
    expect(res).toBeNull();
  });

  it("ventana sintética sin shapeUpCustomId → no aplica el fallback", () => {
    const res = elegirSesionSamsung(APP_SINTETICA, [UNICA_DEL_DIA]);
    expect(res).toBeNull();
  });
});

// ── elegirSesionSamsung — ranking por Δinicio (P57, docs/prompts/57-*.md) ────

describe("elegirSesionSamsung — ranking por Δinicio (P57)", () => {
  const VENTANA_REAL = { inicioMs: 1_000_000, finMs: 4_600_000 }; // ~1h, no sintética

  it("pool custom-id: gana la de menor Δinicio aunque otra solape más", () => {
    // Solapa poco (10 min) pero arranca justo → Δinicio 0
    const cercanaPocoSolape: SesionSamsung = {
      datauuid: "uuid-cercana", startMs: 1_000_000, endMs: 1_600_000, customId: "cid",
    };
    // Solapa toda la ventana pero arranca 5 min tarde → Δinicio 5 min
    const lejanaMuchoSolape: SesionSamsung = {
      datauuid: "uuid-lejana", startMs: 1_300_000, endMs: 20_000_000, customId: "cid",
    };
    const res = elegirSesionSamsung(VENTANA_REAL, [lejanaMuchoSolape, cercanaPocoSolape], "cid");
    expect(res?.matchPor).toBe("custom-id");
    expect(res?.sesion?.datauuid).toBe("uuid-cercana");
  });

  it("pool custom-id: 29 min de Δinicio entra, 31 no", () => {
    const A29: SesionSamsung = {
      datauuid: "a29", startMs: VENTANA_REAL.inicioMs + 29 * 60_000, endMs: VENTANA_REAL.finMs, customId: "cid",
    };
    expect(elegirSesionSamsung(VENTANA_REAL, [A29], "cid")?.sesion?.datauuid).toBe("a29");

    const A31: SesionSamsung = {
      datauuid: "a31", startMs: VENTANA_REAL.inicioMs + 31 * 60_000, endMs: VENTANA_REAL.finMs, customId: "cid",
    };
    expect(elegirSesionSamsung(VENTANA_REAL, [A31], "cid")).toBeNull();
  });

  it("pool custom-id: caso 'olvido de corte' — arranca junto y termina 3h después, matchea igual", () => {
    const olvidoDeCorte: SesionSamsung = {
      datauuid: "uuid-olvido", startMs: VENTANA_REAL.inicioMs, endMs: VENTANA_REAL.finMs + 3 * 60 * 60_000,
      customId: "cid",
    };
    const res = elegirSesionSamsung(VENTANA_REAL, [olvidoDeCorte], "cid");
    expect(res?.matchPor).toBe("custom-id");
    expect(res?.sesion?.datauuid).toBe("uuid-olvido");
  });

  it("pool ventana: Δinicio 11 min no matchea aunque solape mucho", () => {
    const candidata: SesionSamsung = {
      // sin customId → cae al pool ventana. Solapa casi toda la ventana real.
      datauuid: "uuid-11min", startMs: VENTANA_REAL.inicioMs + 11 * 60_000, endMs: VENTANA_REAL.finMs + 10_000_000,
    };
    expect(elegirSesionSamsung(VENTANA_REAL, [candidata])).toBeNull();
  });

  it("pool ventana: Δinicio 10 min exacto matchea", () => {
    const candidata: SesionSamsung = {
      datauuid: "uuid-10min", startMs: VENTANA_REAL.inicioMs + 10 * 60_000, endMs: VENTANA_REAL.finMs,
    };
    expect(elegirSesionSamsung(VENTANA_REAL, [candidata])?.sesion?.datauuid).toBe("uuid-10min");
  });

  it("pool ventana: ambigüedad cuando el top-2 difiere < 5 min de Δinicio", () => {
    const c1: SesionSamsung = { datauuid: "c1", startMs: VENTANA_REAL.inicioMs + 1 * 60_000, endMs: VENTANA_REAL.finMs };
    const c2: SesionSamsung = { datauuid: "c2", startMs: VENTANA_REAL.inicioMs + 4 * 60_000, endMs: VENTANA_REAL.finMs };
    const res = elegirSesionSamsung(VENTANA_REAL, [c1, c2]);
    expect(res).toEqual({ sesion: null, matchPor: "ambiguo" });
  });

  it("pool ventana: sin ambigüedad cuando el top-2 difiere ≥ 5 min de Δinicio", () => {
    const c1: SesionSamsung = { datauuid: "c1", startMs: VENTANA_REAL.inicioMs, endMs: VENTANA_REAL.finMs };
    const c2: SesionSamsung = { datauuid: "c2", startMs: VENTANA_REAL.inicioMs + 5 * 60_000, endMs: VENTANA_REAL.finMs };
    const res = elegirSesionSamsung(VENTANA_REAL, [c1, c2]);
    expect(res?.matchPor).toBe("ventana");
    expect(res?.sesion?.datauuid).toBe("c1");
  });

  it("caso real de regresión: 29/06 — ventana real 16:52→17:29, ShapeUp 19:50 → Δinicio 178 min > 30 → sin match", () => {
    const inicio = new Date("2026-06-29T16:52:00-03:00").getTime();
    const fin    = new Date("2026-06-29T17:29:00-03:00").getTime();
    const shapeUp1950: SesionSamsung = {
      datauuid: "uuid-shapeup-1950",
      startMs: new Date("2026-06-29T19:50:00-03:00").getTime(),
      endMs:   new Date("2026-06-29T20:23:00-03:00").getTime(),
      customId: "cid",
    };
    const ventana = { inicioMs: inicio, finMs: fin, sintetica: false };
    expect(elegirSesionSamsung(ventana, [shapeUp1950], "cid")).toBeNull();
  });
});

// ── enriquecerSerie ───────────────────────────────────────────────────────────

const CURVA: LiveDataPoint[] = [
  { ms: 1000, fc: 100 },
  { ms: 2000, fc: 150 },
  { ms: 3000, fc: 160 }, // pico dentro de la serie
  { ms: 4000, fc: 145 }, // finSerie
  { ms: 5000, fc: 120 }, // descanso
  { ms: 6000, fc: 100 }, // finDescanso / inicioSiguiente
];

const SERIE: SerieRegistro = {
  serie: 1, completada: true,
  inicioMs: 1000, finMs: 4000,
};

describe("enriquecerSerie", () => {
  it("calcula fcPico y fcFinSerie en la ventana", () => {
    const enriq = enriquecerSerie(SERIE, CURVA);
    expect(enriq.fcPico).toBe(160);
    expect(enriq.fcFinSerie).toBe(145);
  });

  it("calcula recuperacionBpm usando inicioSiguienteMs", () => {
    const enriq = enriquecerSerie(SERIE, CURVA, 6000);
    expect(enriq.recuperacionBpm).toBe(160 - 100); // pico - fcFinDescanso
  });

  it("devuelve {} si la serie no tiene timestamps", () => {
    const sinTs: SerieRegistro = { serie: 1, completada: true };
    expect(enriquecerSerie(sinTs, CURVA)).toEqual({});
  });

  it("devuelve {} si la curva está vacía", () => {
    expect(enriquecerSerie(SERIE, [])).toEqual({});
  });
});

// ── derivarZona ───────────────────────────────────────────────────────────────

const PERFIL: PerfilMiembro = {
  fcMaxTeorica: 170,
  zonasFC: {
    Z1: { min: 85,  max: 102 },
    Z2: { min: 102, max: 119 },
    Z3: { min: 119, max: 136 },
    Z4: { min: 136, max: 153 },
    Z5: { min: 153, max: 170 },
  },
};

describe("derivarZona", () => {
  it("asigna la zona correcta según la FC", () => {
    expect(derivarZona(90,  PERFIL)).toBe("Z1");
    expect(derivarZona(110, PERFIL)).toBe("Z2");
    expect(derivarZona(125, PERFIL)).toBe("Z3");
    expect(derivarZona(145, PERFIL)).toBe("Z4");
    expect(derivarZona(160, PERFIL)).toBe("Z5");
  });

  it("retorna undefined si no hay zonasFC ni fcMaxTeorica en el perfil", () => {
    expect(derivarZona(130, {})).toBeUndefined();
    expect(derivarZona(130, undefined)).toBeUndefined();
  });

  it("fallback a bandas estándar de fcMaxTeorica cuando no hay zonasFC (hotfix P58)", () => {
    const soloFcMax: PerfilMiembro = { fcMaxTeorica: 180 };
    expect(derivarZona(90,  soloFcMax)).toBe("Z1");  // 50-60% de 180 = 90-108
    expect(derivarZona(115, soloFcMax)).toBe("Z2");  // 60-70% = 108-126
    expect(derivarZona(135, soloFcMax)).toBe("Z3");  // 70-80% = 126-144
    expect(derivarZona(150, soloFcMax)).toBe("Z4");  // 80-90% = 144-162
    expect(derivarZona(170, soloFcMax)).toBe("Z5");  // 90-100% = 162-180
  });

  it("zonasFC a medida gana sobre el fallback de fcMaxTeorica si ambas están configuradas", () => {
    const ambas: PerfilMiembro = { ...PERFIL, fcMaxTeorica: 999 }; // banda estándar daría otra zona
    expect(derivarZona(90, ambas)).toBe("Z1"); // usa zonasFC (85-102), no la banda de 999
  });
});

// ── construirBiometriaSesion ──────────────────────────────────────────────────

describe("construirBiometriaSesion", () => {
  it("construye la biometria con zona derivada del perfil", () => {
    const bio = construirBiometriaSesion(SAMSUNG_SHAPEUP, "custom-id", PERFIL);
    expect(bio.fuente).toBe("samsung-health-csv");
    expect(bio.datauuidSamsung).toBe("uuid-shapeup");
    expect(bio.fcMedia).toBe(130);
    expect(bio.zonaPrincipal).toBe("Z3"); // 130 cae en Z3
    expect(bio.matchPor).toBe("custom-id");
    expect(bio.granularidad).toBe("sesion");
  });

  it("funciona sin perfil (zona = undefined)", () => {
    const bio = construirBiometriaSesion(SAMSUNG_SHAPEUP, "ventana");
    expect(bio.zonaPrincipal).toBeUndefined();
  });
});

// ── construirBiometriaSesion / construirBiometriaRango — sin claves undefined ──
// Hotfix P57: Firestore (SDK admin, sin `ignoreUndefinedProperties`) rechaza
// escribir un campo con valor `undefined` explícito — a diferencia de que
// simplemente el campo no exista. `bio.x === undefined` no distingue eso
// (una clave ausente también da `undefined` al leerla); por eso estos tests
// chequean `"x" in bio`, no el valor.

describe("construirBiometriaSesion — sin claves undefined al persistir (hotfix P57)", () => {
  it("fila sin fcMin/fcMax/kcal → el objeto no tiene esas claves (no 'clave: undefined')", () => {
    // SAMSUNG_SHAPEUP no define fcMax, fcMin ni kcal
    const bio = construirBiometriaSesion(SAMSUNG_SHAPEUP, "custom-id"); // sin perfil → zonaPrincipal también ausente
    expect(Object.prototype.hasOwnProperty.call(bio, "fcMax")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "fcMin")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "kcal")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "zonaPrincipal")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "finMsEfectivo")).toBe(false);
  });

  it("serializa sin error (ninguna clave con valor undefined, ni siquiera vía JSON)", () => {
    const bio = construirBiometriaSesion(SAMSUNG_SHAPEUP, "custom-id");
    for (const [k, v] of Object.entries(bio)) {
      expect(v, `clave "${k}" no debería ser undefined`).not.toBeUndefined();
    }
    // JSON.parse(JSON.stringify(x)) debe conservar todas las claves (si alguna
    // tuviera valor undefined, JSON.stringify la habría descartado en silencio).
    expect(Object.keys(JSON.parse(JSON.stringify(bio)))).toEqual(Object.keys(bio));
  });

  it("anti-olvido sin curva: kcal/fcMedia ausentes, no undefined", () => {
    const ventana = { inicioMs: 0, finMs: 3_600_000, sintetica: false };
    const sesion: SesionSamsung = {
      datauuid: "x", startMs: 0, endMs: ventana.finMs + 20 * 60_000, fcMedia: 130, kcal: 300,
    };
    const bio = construirBiometriaSesion(sesion, "custom-id", undefined, ventana);
    expect(Object.prototype.hasOwnProperty.call(bio, "kcal")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "fcMedia")).toBe(false);
    expect(bio.finMsEfectivo).toBe(ventana.finMs); // esta sí debe estar (se sella a propósito)
  });
});

describe("construirBiometriaRango — sin claves undefined al persistir (hotfix P57)", () => {
  it("sin perfil → sin la clave zonaPrincipal (no 'zonaPrincipal: undefined')", () => {
    const ventana = { inicioMs: 0, finMs: 3_600_000 };
    const muestras = Array.from({ length: 10 }, (_, i) => ({ ms: (i + 1) * 100_000, fc: 100 + i }));
    const bio = construirBiometriaRango(ventana, muestras);
    expect(bio).not.toBeNull();
    expect(Object.prototype.hasOwnProperty.call(bio, "zonaPrincipal")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "datauuidSamsung")).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(bio, "kcal")).toBe(false);
    for (const [k, v] of Object.entries(bio!)) {
      expect(v, `clave "${k}" no debería ser undefined`).not.toBeUndefined();
    }
  });
});

// ── construirBiometriaSesion — anti-"olvido de corte" (P57) ──────────────────

describe("construirBiometriaSesion — anti-olvido de corte", () => {
  const VENTANA_REAL = { inicioMs: 0, finMs: 3_600_000, sintetica: false }; // 1h

  it("exceso ≤ 15 min → fila tal cual, sin finMsEfectivo", () => {
    const sesion: SesionSamsung = {
      datauuid: "uuid-1", startMs: 0, endMs: VENTANA_REAL.finMs + 15 * 60_000,
      fcMedia: 130, fcMax: 160, fcMin: 90, kcal: 300,
    };
    const bio = construirBiometriaSesion(sesion, "custom-id", undefined, VENTANA_REAL);
    expect(bio.fcMedia).toBe(130);
    expect(bio.kcal).toBe(300);
    expect(bio.finMsEfectivo).toBeUndefined();
  });

  it("exceso > 15 min con curva → recalcula FC solo dentro de la ventana, omite kcal, sella finMsEfectivo", () => {
    const sesion: SesionSamsung = {
      datauuid: "uuid-2", startMs: 0, endMs: VENTANA_REAL.finMs + 20 * 60_000, // 20 min de más
      fcMedia: 130, fcMax: 160, fcMin: 90, kcal: 300,
    };
    const curva: LiveDataPoint[] = [
      { ms: 100_000, fc: 120 },
      { ms: 200_000, fc: 140 }, // dentro de la ventana (max 100–140)
      { ms: VENTANA_REAL.finMs + 10 * 60_000, fc: 200 }, // fuera de la ventana — no debe contarse
    ];
    const bio = construirBiometriaSesion(sesion, "custom-id", undefined, VENTANA_REAL, curva);
    expect(bio.fcMedia).toBe(130); // (120+140)/2
    expect(bio.fcMax).toBe(140);
    expect(bio.fcMin).toBe(120);
    expect(bio.kcal).toBeUndefined();
    expect(bio.finMsEfectivo).toBe(VENTANA_REAL.finMs);
  });

  it("exceso > 15 min sin curva → conserva solo fcMax, omite fcMedia/kcal, sella finMsEfectivo", () => {
    const sesion: SesionSamsung = {
      datauuid: "uuid-3", startMs: 0, endMs: VENTANA_REAL.finMs + 20 * 60_000,
      fcMedia: 130, fcMax: 160, fcMin: 90, kcal: 300,
    };
    const bio = construirBiometriaSesion(sesion, "custom-id", undefined, VENTANA_REAL);
    expect(bio.fcMax).toBe(160);
    expect(bio.fcMedia).toBeUndefined();
    expect(bio.kcal).toBeUndefined();
    expect(bio.finMsEfectivo).toBe(VENTANA_REAL.finMs);
  });

  it("ventana sintética con exceso grande → no aplica anti-olvido (fila tal cual, sin finMsEfectivo)", () => {
    const ventanaSintetica = { inicioMs: 0, finMs: 3_600_000, sintetica: true };
    const sesion: SesionSamsung = {
      datauuid: "uuid-4", startMs: 0, endMs: ventanaSintetica.finMs + 3 * 60 * 60_000,
      fcMedia: 130, kcal: 300,
    };
    const bio = construirBiometriaSesion(sesion, "dia", undefined, ventanaSintetica);
    expect(bio.fcMedia).toBe(130);
    expect(bio.kcal).toBe(300);
    expect(bio.finMsEfectivo).toBeUndefined();
  });

  it("sin ventanaApp (compat con llamadas viejas) → fila tal cual", () => {
    const bio = construirBiometriaSesion(SAMSUNG_SHAPEUP, "custom-id", PERFIL);
    expect(bio.finMsEfectivo).toBeUndefined();
    expect(bio.kcal).toBeUndefined(); // SAMSUNG_SHAPEUP no define kcal
  });
});

// ── construirBiometriaRango (P57, nivel 3) ───────────────────────────────────

describe("construirBiometriaRango", () => {
  const VENTANA = { inicioMs: 0, finMs: 3_600_000 };

  function muestras(n: number, base = 100): LiveDataPoint[] {
    return Array.from({ length: n }, (_, i) => ({ ms: (i + 1) * 100_000, fc: base + i }));
  }

  it("10 muestras dentro de la ventana → biometría 'rango' sin kcal", () => {
    const bio = construirBiometriaRango(VENTANA, muestras(10));
    expect(bio).not.toBeNull();
    expect(bio!.matchPor).toBe("rango");
    expect(bio!.datauuidSamsung).toBeUndefined();
    expect(bio!.kcal).toBeUndefined();
    expect(bio!.fcMedia).toBeCloseTo((100 + 109) / 2, 5);
    expect(bio!.fcMax).toBe(109);
    expect(bio!.fcMin).toBe(100);
  });

  it("9 muestras → null (no alcanza el guardrail)", () => {
    expect(construirBiometriaRango(VENTANA, muestras(9))).toBeNull();
  });

  it("ignora muestras fuera de la ventana para el conteo del guardrail", () => {
    const fuera = Array.from({ length: 5 }, (_, i) => ({ ms: VENTANA.finMs + (i + 1) * 1000, fc: 999 }));
    expect(construirBiometriaRango(VENTANA, [...muestras(9), ...fuera])).toBeNull();
  });

  it("ventana sintética también puede llegar a 'rango' si hay suficientes muestras", () => {
    const ventanaSintetica = { inicioMs: 0, finMs: 3_600_000, sintetica: true };
    const bio = construirBiometriaRango(ventanaSintetica, muestras(10));
    expect(bio?.matchPor).toBe("rango");
  });

  it("deriva zonaPrincipal del perfil si se pasa", () => {
    const bio = construirBiometriaRango(VENTANA, muestras(10, 119), PERFIL); // fcMedia ~123.5 → Z3
    expect(bio!.zonaPrincipal).toBe("Z3");
  });
});

// ── topeInicioSiguiente (P57, tope de recuperación en la última serie) ───────

describe("topeInicioSiguiente", () => {
  it("acota a 90 s después del fin de la ventana cuando hay más datos disponibles", () => {
    const finVentana = 1_000_000;
    const finDatos    = finVentana + 10 * 60_000; // hay datos hasta 10 min después
    expect(topeInicioSiguiente(finVentana, finDatos)).toBe(finVentana + TOPE_RECUPERACION_ULTIMA_SERIE_MS);
  });

  it("no se pasa del fin real de los datos disponibles si es menor a 90 s", () => {
    const finVentana = 1_000_000;
    const finDatos    = finVentana + 30_000; // solo 30 s de datos después
    expect(topeInicioSiguiente(finVentana, finDatos)).toBe(finDatos);
  });
});
