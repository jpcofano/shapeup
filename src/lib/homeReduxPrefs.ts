export type HomeReduxModo   = "light" | "dark" | "system";
export type HomeReduxAcento = "ion" | "volt" | "blaze" | "indigo" | "pulse";

export interface HomeReduxPrefs {
  modo:   HomeReduxModo;
  acento: HomeReduxAcento;
}

const DEFAULTS: HomeReduxPrefs = { modo: "system", acento: "ion" };

const LS_KEY = "su-home-redux-by-member";

const MODOS:   readonly HomeReduxModo[]   = ["light", "dark", "system"];
const ACENTOS: readonly HomeReduxAcento[] = ["ion", "volt", "blaze", "indigo", "pulse"];

function loadMap(): Record<string, Partial<HomeReduxPrefs>> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveMap(map: Record<string, Partial<HomeReduxPrefs>>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch { /* */ }
}

export function getHomeReduxPrefs(memberId: string): HomeReduxPrefs {
  const p = loadMap()[memberId];
  return {
    modo:   p?.modo   && (MODOS as string[]).includes(p.modo)     ? p.modo   : DEFAULTS.modo,
    acento: p?.acento && (ACENTOS as string[]).includes(p.acento) ? p.acento : DEFAULTS.acento,
  };
}

export function setHomeReduxModo(memberId: string, modo: HomeReduxModo): void {
  const map = loadMap();
  map[memberId] = { ...map[memberId], modo };
  saveMap(map);
}

export function setHomeReduxAcento(memberId: string, acento: HomeReduxAcento): void {
  const map = loadMap();
  map[memberId] = { ...map[memberId], acento };
  saveMap(map);
}

/** Resuelve "system" contra prefers-color-scheme; light/dark pasan directo. */
export function resolverModo(modo: HomeReduxModo): "light" | "dark" {
  if (modo !== "system") return modo;
  if (typeof matchMedia !== "function") return "dark";
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
