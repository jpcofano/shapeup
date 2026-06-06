import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import type { MiembroId } from "../types/models";

export type ThemeName =
  | "ion" | "volt" | "solar" | "blaze"
  | "crimson" | "pulse" | "grape" | "indigo";

const DEFAULTS: Record<MiembroId, ThemeName> = {
  juanpablo: "ion",
  maria:     "pulse",
  sofia:     "grape",
  federico:  "volt",
};

const STORAGE_KEY = "shapeup-themes";

interface ThemeCtx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
}

const ThemeContext = createContext<ThemeCtx>({ theme: "ion", setTheme: () => {} });

function loadThemes(): Partial<Record<MiembroId, ThemeName>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { memberId } = useAuth();
  const [themes, setThemes] = useState<Partial<Record<MiembroId, ThemeName>>>(loadThemes);

  const theme: ThemeName = memberId
    ? (themes[memberId] ?? DEFAULTS[memberId] ?? "ion")
    : "ion";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function setTheme(t: ThemeName) {
    if (!memberId) return;
    const updated = { ...themes, [memberId]: t };
    setThemes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeCtx {
  return useContext(ThemeContext);
}
