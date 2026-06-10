import { Moon } from "lucide-react";
import { Bicep } from "./Bicep";
import type { DiaPrograma } from "../types/models";

const DIAS_SHORT = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_FULL  = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

interface VistaSemanalProps {
  dias: DiaPrograma[];
  /** 0=Lunes … 6=Domingo. Si se pasa, resalta el día de hoy. */
  hoy?: number;
  /** Día de semana de sesiones ya hechas esta semana (para marcar como entrenado). */
  hechos?: number[];
  size?: "sm" | "md";
}

/**
 * Fila L–M–X–J–V–S–D con estado por día:
 * - entrenado    : bíceps lleno en acento
 * - planificado  : bíceps outline (acento, menor opacidad)
 * - descanso     : luna tenue
 * - sin asignar  : puntito vacío
 * - hoy          : borde acento
 */
export function VistaSemanal({ dias, hoy, hechos = [], size = "md" }: VistaSemanalProps) {
  const sz = size === "sm" ? 32 : 40;
  const bsz = size === "sm" ? 13 : 16;

  // Mapa diaSemana → DiaPrograma (primero que matchee)
  const porDia = new Map<number, DiaPrograma>();
  for (const d of dias) {
    if (d.diaSemana) {
      const idx = DIAS_FULL.indexOf(d.diaSemana);
      if (idx >= 0 && !porDia.has(idx)) porDia.set(idx, d);
    }
  }

  return (
    <div style={{ display: "flex", gap: size === "sm" ? 4 : 6, justifyContent: "center" }}>
      {DIAS_SHORT.map((letra, i) => {
        const dia    = porDia.get(i);
        const esHoy  = hoy === i;
        const esHecho = hechos.includes(i);

        let bg     = "transparent";
        let border = `1.5px solid var(--border)`;
        let icono: React.ReactNode = (
          <div style={{ width: bsz, height: bsz, borderRadius: "50%", background: "var(--border)" }} />
        );

        if (dia?.tipo === "descanso") {
          bg     = "var(--card)";
          icono  = <Moon size={bsz} color="var(--muted)" strokeWidth={1.5} />;
        } else if (dia) {
          if (esHecho) {
            bg    = "var(--accent-dim)";
            icono = <Bicep size={bsz} style={{ color: "var(--accent)" }} />;
          } else {
            bg    = "var(--card)";
            icono = <Bicep size={bsz} style={{ color: "var(--accent)", opacity: 0.45 }} />;
          }
        }

        if (esHoy) border = "1.5px solid var(--accent)";

        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
              width: sz, height: sz, borderRadius: "50%",
              background: bg, border,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {icono}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: ".04em",
              color: esHoy ? "var(--accent)" : "var(--muted)",
            }}>
              {letra}
            </span>
          </div>
        );
      })}
    </div>
  );
}
