import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import type { MiembroId } from "../types/models";

// 5 temas (P65) — antes 8; solar/crimson/grape se sacaron para converger
// con el prototipo Home Redux, que ya tenía estos 5 validados en claro y
// oscuro (ver src/styles/tokens.css).
export type ThemeName = "ion" | "volt" | "blaze" | "pulse" | "indigo";
export type Modo = "light" | "dark" | "system";

interface Prefs {
  tema: ThemeName;
  modo: Modo;
}

// sofia tenía "grape" (removido) — reasignada a indigo, el único de los 5
// que no era ya el default de otro miembro.
const DEFAULTS: Record<MiembroId, Prefs> = {
  juanpablo: { tema: "ion",    modo: "system" },
  maria:     { tema: "pulse",  modo: "system" },
  sofia:     { tema: "indigo", modo: "system" },
  federico:  { tema: "volt",   modo: "system" },
};

const TEMAS: readonly ThemeName[] = ["ion", "volt", "blaze", "pulse", "indigo"];
const MODOS:  readonly Modo[]      = ["light", "dark", "system"];

// Clave nueva (P65): antes había dos sistemas con persistencia separada
// (tema en "shapeup-themes", modo/acento de Pulse-Premium en
// "su-home-redux-by-member") que no coincidían entre sí. Se unifican acá;
// las claves viejas quedan huérfanas sin migración (bajo impacto — 4
// miembros, resetear el tema una vez es trivial).
const STORAGE_KEY = "shapeup-tema-prefs";

interface ThemeCtx {
  tema: ThemeName;
  setTema: (t: ThemeName) => void;
  modo: Modo;
  setModo: (m: Modo) => void;
  /** "system" resuelto contra prefers-color-scheme; light/dark pasan directo. */
  modoEfectivo: "light" | "dark";
}

const ThemeContext = createContext<ThemeCtx>({
  tema: "ion", setTema: () => {},
  modo: "system", setModo: () => {},
  modoEfectivo: "dark",
});

function loadPrefs(): Partial<Record<MiembroId, Partial<Prefs>>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function prefersDark(): boolean {
  return typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { memberId } = useAuth();
  const [prefs, setPrefs] = useState<Partial<Record<MiembroId, Partial<Prefs>>>>(loadPrefs);
  // Re-render cuando cambia la preferencia del SO, para que "system" se recalcule en vivo.
  const [sistemaOscuro, setSistemaOscuro] = useState(prefersDark);

  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSistemaOscuro(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const propio = memberId ? prefs[memberId] : undefined;
  const def = memberId ? DEFAULTS[memberId] : DEFAULTS.juanpablo;
  const tema: ThemeName = (propio?.tema && TEMAS.includes(propio.tema)) ? propio.tema : def.tema;
  const modo: Modo      = (propio?.modo && MODOS.includes(propio.modo)) ? propio.modo : def.modo;
  const modoEfectivo: "light" | "dark" = modo === "system" ? (sistemaOscuro ? "dark" : "light") : modo;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    document.documentElement.setAttribute("data-mode", modoEfectivo);
  }, [tema, modoEfectivo]);

  function guardar(updated: Partial<Prefs>) {
    if (!memberId) return;
    const next = { ...prefs, [memberId]: { ...prefs[memberId], ...updated } };
    setPrefs(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  return (
    <ThemeContext.Provider value={{
      tema, setTema: (t) => guardar({ tema: t }),
      modo, setModo: (m) => guardar({ modo: m }),
      modoEfectivo,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
