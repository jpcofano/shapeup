import { describe, it, expect } from "vitest";
import {
  elegirSesionSamsung,
  enriquecerSerie,
  derivarZona,
  construirBiometriaSesion,
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

  it("elige la de mayor solapamiento entre múltiples candidatas", () => {
    const parcial: SesionSamsung = {
      datauuid: "uuid-parcial",
      startMs: 1_002_000_000,  // empieza tarde → menos solapo
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

  it("retorna undefined si no hay zonasFC en el perfil", () => {
    expect(derivarZona(130, {})).toBeUndefined();
    expect(derivarZona(130, undefined)).toBeUndefined();
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
