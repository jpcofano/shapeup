import type { Rutina } from "../../types/models";
import {
  bloqueCompleto, bloqueSaltado, seriesObjetivo, type EntrenarState,
} from "../../lib/entrenarState";

interface Props {
  rutina:   Rutina;
  state:    EntrenarState;
  /** Bloque a mostrar (normalmente `state.ultimoBloqueCerrado`). */
  idx:      number;
  onExtra:  (idx: number) => void;
  /** Solo se ofrece si el bloque tiene series de más; la ruta borra la última. */
  onDeshacerExtra: (idx: number) => void;
  onVolver: (idx: number) => void;
}

/**
 * Chip del último bloque cerrado (P68b): "+ serie de X" si quedó completo,
 * "Saltaste X · Volver" si se salteó. Sin ninguno de los dos, no muestra nada.
 */
export function BloqueAnteriorChip({ rutina, state, idx, onExtra, onDeshacerExtra, onVolver }: Props) {
  const bloque = rutina.bloques[idx];
  if (!bloque) return null;
  const nombre = bloque.nombreEjercicio;

  if (bloqueSaltado(state, idx)) {
    return (
      <div className="bloque-anterior">
        <span className="bloque-anterior-texto">Saltaste {nombre}</span>
        <button type="button" className="bloque-anterior-accion" onClick={() => onVolver(idx)}>
          Volver
        </button>
      </div>
    );
  }

  if (!bloqueCompleto(state, rutina, idx)) return null;
  const extras = (state.seriesHechas[idx] ?? 0) - seriesObjetivo(bloque.prescripcion);
  return (
    <div className="bloque-anterior">
      <button type="button" className="bloque-anterior-accion" onClick={() => onExtra(idx)}>
        + serie de {nombre}
      </button>
      {extras > 0 && (
        <button type="button" className="bloque-anterior-deshacer" onClick={() => onDeshacerExtra(idx)}>
          Deshacer
        </button>
      )}
    </div>
  );
}
