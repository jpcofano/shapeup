// ════════════════════════════════════════════════════════════════════════════
//  __fixtures__/crudoSdk.ts — registros reales del puente (PU4), recortados.
//
//  Son los `crudo` tal cual los sube el puente Android, con la curva reducida a
//  unos pocos puntos (en el original son miles) y sin `deviceId`. Los uuid son
//  los verdaderos a propósito: el test de la comprobación cruzada necesita que
//  el `uid` del SDK sea el mismo `datauuid` del CSV del ZIP.
// ════════════════════════════════════════════════════════════════════════════

/** Sesión hecha con la app: `customTitle: "ShapeUp"`, tipo OTHER, no autodetectada. */
export const CRUDO_SHAPEUP = {
  uid: "078f3af5-f086-4b09-9bfd-aeac9305f6a3",
  clientDataId: null,
  clientVersion: null,
  appId: "com.sec.android.app.shealth",
  deviceId: null,
  startTime: { epochMs: 1783427640729, iso: "2026-07-07T12:34:00.729Z" },
  endTime:   { epochMs: 1783430898914, iso: "2026-07-07T13:28:18.914Z" },
  updateTime: { epochMs: 1783430909587, iso: "2026-07-07T13:28:29.587Z" },
  zoneOffset: "-03:00",
  startLocalDateTime: "2026-07-07T09:34:00.729",
  endLocalDateTime: "2026-07-07T10:28:18.914",
  fields: {
    sessions: [{
      startTime: { epochMs: 1783427640729, iso: "2026-07-07T12:34:00.729Z" },
      endTime:   { epochMs: 1783430898914, iso: "2026-07-07T13:28:18.914Z" },
      duration: { ms: 3258185, iso: "PT54M18.185S" },
      exerciseType: "OTHER",
      customTitle: "ShapeUp",
      calories: 527.49,
      distance: null,
      count: null,
      countType: "UNDEFINED",
      maxHeartRate: 157,
      meanHeartRate: 130,
      minHeartRate: 69,
      autoDetected: false,
      swimmingLog: null,
      logSize: 3438,
      logWithHeartRate: 3251,
      routeSize: null,
      log: [
        { timestamp: { epochMs: 1783427648729, iso: "2026-07-07T12:34:08.729Z" }, heartRate: null },
        { timestamp: { epochMs: 1783427671729, iso: "2026-07-07T12:34:31.729Z" }, heartRate: 96 },
        { timestamp: { epochMs: 1783427683729, iso: "2026-07-07T12:34:43.729Z" }, heartRate: 101 },
      ],
      route: null,
    }],
  },
};

/** Caminata que el reloj detectó solo: `autoDetected: true`, con curva igual. */
export const CRUDO_CAMINATA = {
  uid: "01ff83bf-c12c-43d8-a565-cf14933422c0",
  clientDataId: null,
  clientVersion: null,
  appId: "com.sec.android.app.shealth",
  deviceId: null,
  startTime: { epochMs: 1786040800212, iso: "2026-08-06T18:26:40.212Z" },
  endTime:   { epochMs: 1786041614479, iso: "2026-08-06T18:40:14.479Z" },
  updateTime: { epochMs: 1786041690341, iso: "2026-08-06T18:41:30.341Z" },
  zoneOffset: "-03:00",
  startLocalDateTime: "2026-08-06T15:26:40.212",
  endLocalDateTime: "2026-08-06T15:40:14.479",
  fields: {
    sessions: [{
      startTime: { epochMs: 1786040800212, iso: "2026-08-06T18:26:40.212Z" },
      endTime:   { epochMs: 1786041614479, iso: "2026-08-06T18:40:14.479Z" },
      duration: { ms: 761032, iso: "PT12M41.032S" },
      exerciseType: "WALKING",
      customTitle: null,
      calories: 82,
      distance: 714.86,
      count: 1070,
      countType: "STRIDE",
      maxHeartRate: 116,
      meanHeartRate: 98,
      minHeartRate: 88,
      autoDetected: true,
      swimmingLog: null,
      logSize: 625,
      logWithHeartRate: 609,
      routeSize: null,
      log: [
        { timestamp: { epochMs: 1786040801212, iso: "2026-08-06T18:26:41.212Z" }, heartRate: null },
        { timestamp: { epochMs: 1786040860212, iso: "2026-08-06T18:27:40.212Z" }, heartRate: 94 },
      ],
      route: null,
    }],
  },
};

/** Composición corporal por Garmin: solo peso, altura y bmi. */
export const CRUDO_COMPOSICION_GARMIN = {
  uid: "06a63f36-ea1d-4cce-8d5b-20b4fa8a9758",
  clientDataId: null,
  clientVersion: null,
  appId: "com.garmin.android.apps.connectmobile",
  deviceId: null,
  startTime: { epochMs: 1788615549000, iso: "2026-09-05T13:39:09Z" },
  endTime: null,
  updateTime: { epochMs: 1788660259488, iso: "2026-09-06T02:04:19.488Z" },
  zoneOffset: "-03:00",
  startLocalDateTime: "2026-09-05T10:39:09",
  endLocalDateTime: null,
  fields: {
    basal_metabolic_rate: null,
    fat_free_mass: null,
    fat_free: null,
    total_body_water: null,
    weight: 89.3,
    skeletal_muscle: null,
    muscle_mass: null,
    height: 162,
    body_fat_mass: null,
    body_fat: null,
    bmi: 34,
    skeletal_muscle_mass: null,
  },
};

/** La MISMA medición, transportada por Health Sync: mismo instante, más campos. */
export const CRUDO_COMPOSICION_HEALTHSYNC = {
  ...CRUDO_COMPOSICION_GARMIN,
  uid: "9f2b71aa-0000-4000-8000-aaaaaaaaaaaa",
  appId: "nl.appyhapps.healthsync",
  fields: {
    ...CRUDO_COMPOSICION_GARMIN.fields,
    total_body_water: 42.77,
    body_fat: 32.2,
    muscle_mass: 34.82,
    body_fat_mass: 28.75,
  },
};

/** El reloj: peso heredado del perfil, sin medir (bioimpedancia de muñeca). */
export const CRUDO_COMPOSICION_RELOJ = {
  ...CRUDO_COMPOSICION_GARMIN,
  uid: "5c1d0000-0000-4000-8000-bbbbbbbbbbbb",
  appId: "com.sec.android.app.shealth",
  startTime: { epochMs: 1788700000000, iso: "2026-09-06T13:06:40Z" },
  startLocalDateTime: "2026-09-06T10:06:40",
  fields: {
    ...CRUDO_COMPOSICION_GARMIN.fields,
    weight: 93.1,          // casi cuatro kilos más que la balanza
    skeletal_muscle_mass: 31.2,
    bmi: null,
  },
};
