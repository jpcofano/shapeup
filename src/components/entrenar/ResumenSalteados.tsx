import type { Rutina } from "../../types/models";
import { bloqueSaltado, motivoSaltoLabel, type EntrenarState } from "../../lib/entrenarState";

interface Props {
  rutina:    Rutina;
  state:     EntrenarState;
  onRetomar: (idx: number) => void;
}

/** Pantalla de fin (P68b): una fila por bloque salteado, con su motivo y "Retomar". */
export function ResumenSalteados({ rutina, state, onRetomar }: Props) {
  const salteados = rutina.bloques
    .map((b, idx) => ({ b, idx }))
    .filter(({ idx }) => bloqueSaltado(state, idx));
  if (salteados.length === 0) return null;

  return (
    <div className="fin-saltados">
      {salteados.map(({ b, idx }) => {
        const motivo = motivoSaltoLabel(state.saltados[idx]);
        return (
          <div key={idx} className="fin-saltado">
            <span className="fin-saltado-info">
              <span className="fin-saltado-nombre">{b.nombreEjercicio}</span>
              <span className="fin-saltado-motivo">{motivo ? `Salteado · ${motivo}` : "Salteado"}</span>
            </span>
            <button type="button" className="btn-secondary" onClick={() => onRetomar(idx)}>
              Retomar
            </button>
          </div>
        );
      })}
    </div>
  );
}
