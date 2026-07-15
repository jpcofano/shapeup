import { Lightbulb } from "lucide-react";
import type { SugerenciaProgresion } from "../../lib/progresion";

interface Props {
  sugerencia: SugerenciaProgresion;
  onUsar: () => void;
  onDescartar: () => void;
}

function formatFecha(s: string): string {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
}

/**
 * Propuesta de progresión de cargas (I3) — visible con un tap para aplicar,
 * jamás se autocompleta sola. Descartable solo por esta sesión (sin persistir).
 */
export function SugerenciaChip({ sugerencia, onUsar, onDescartar }: Props) {
  return (
    <div className="card" style={{ padding: "10px 12px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Lightbulb size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} strokeWidth={2} />
        <p style={{ margin: 0, fontSize: 13, flex: 1, lineHeight: 1.4, color: "var(--fg)" }}>
          {sugerencia.motivo} <span style={{ color: "var(--muted)" }}>({formatFecha(sugerencia.basadoEnFecha)})</span>
        </p>
        <button
          onClick={onDescartar}
          aria-label="Descartar sugerencia"
          style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}
        >
          ✕
        </button>
      </div>
      <button
        className="btn-secondary"
        style={{ marginTop: 8, fontSize: 12, padding: "5px 12px" }}
        onClick={onUsar}
      >
        Usar
      </button>
    </div>
  );
}
