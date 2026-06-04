import type { BloqueEjercicio } from "../../types/models";
import { seriesObjetivo, bloqueCompleto } from "../../lib/entrenarState";
import { prescripcionLabel } from "../../lib/prescripcionLabel";
import type { EntrenarState } from "../../lib/entrenarState";

interface Props {
  bloque:      BloqueEjercicio;
  bloqueIdx:   number;
  state:       EntrenarState;
  onCompletar: (bloqueIdx: number, serieIdx: number) => void;
  onDeshacer:  (bloqueIdx: number) => void;
}

/**
 * Fila de bloque en modo scroll: muestra botones de serie para marcar
 * cada una como hecha, sin seguir un orden estricto.
 */
export function BloqueScroll({ bloque, bloqueIdx, state, onCompletar, onDeshacer }: Props) {
  const total   = seriesObjetivo(bloque.prescripcion);
  const hechas  = state.seriesHechas[bloqueIdx] ?? 0;
  const completo = bloqueCompleto(state, { bloques: [bloque] } as never, 0);
  void completo;

  return (
    <div className={`bloque-scroll${hechas === total ? " done" : ""}`}
      style={hechas === total ? { opacity: 0.6 } : undefined}>
      {/* Header */}
      <div className="bloque-scroll-header">
        <span className="bloque-num">{bloqueIdx + 1}</span>
        <span className="bloque-scroll-nombre">{bloque.nombreEjercicio}</span>
        {hechas > 0 && (
          <button
            className="btn-icon-sm"
            onClick={() => onDeshacer(bloqueIdx)}
            title="Deshacer última serie"
            style={{ fontSize: 11, color: "var(--muted)" }}
          >
            ↩
          </button>
        )}
      </div>

      {/* Prescripción resumen */}
      <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
        {prescripcionLabel(bloque.prescripcion)}
      </p>

      {/* Botones de serie */}
      <div className="series-btns">
        {Array.from({ length: total }, (_, i) => (
          <button
            key={i}
            className={`serie-btn${i < hechas ? " done" : ""}`}
            onClick={() => i >= hechas && onCompletar(bloqueIdx, i)}
            disabled={i < hechas}
            title={`Serie ${i + 1}`}
          >
            {i < hechas ? "✓" : i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
