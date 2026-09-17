import { useState } from "react";
import { MapPin, X } from "lucide-react";
import { LUGARES, type Lugar, type Rutina } from "../../types/models";
import {
  bloqueCompleto, motivoSaltoLabel, objetivoSerieLabel, seriesHechasTotales, seriesObjetivo,
  type EntrenarState,
} from "../../lib/entrenarState";

interface Props {
  titulo:   string;
  /** Duración estimada; `null` no la muestra (sesión libre). */
  minutos:  number | null;
  rutina:   Rutina;
  state:    EntrenarState;
  onIr:     (idx: number) => void;
  onCerrar: () => void;
  /** Cambia el lugar de la sesión (P72). El chip no se muestra sin sellar. */
  onCambiarLugar: (lugar: Lugar) => void;
}

/**
 * Vista del día (P68b): todos los ejercicios con su estado. Tocar una fila va a
 * ese ejercicio. Acá va a vivir "recortar la rutina" del bloque 8.
 */
export function VistaDia({
  titulo, minutos, rutina, state, onIr, onCerrar, onCambiarLugar,
}: Props) {
  // Selector de lugar plegado: el chip muestra dónde estás; tocarlo abre los cuatro.
  const [eligiendoLugar, setEligiendoLugar] = useState(false);
  const n = rutina.bloques.length;
  const encabezado = [
    titulo,
    `${n} ${n === 1 ? "ejercicio" : "ejercicios"}`,
    ...(minutos != null ? [`~${minutos} min`] : []),
  ].join(" · ");

  return (
    <div className="modal-backdrop" onClick={onCerrar}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Ejercicios del día"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <span>{encabezado}</span>
          <button className="modal-close" onClick={onCerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Lugar de la sesión (P72). En P72 no filtra nada: lo usa la sustitución de P73. */}
        {state.lugar && (
          <div className="vista-dia-lugar">
            <button
              type="button"
              className={`filter-chip${eligiendoLugar ? " active" : ""}`}
              aria-expanded={eligiendoLugar}
              onClick={() => setEligiendoLugar((v) => !v)}
            >
              <MapPin size={12} style={{ verticalAlign: "-2px", marginRight: 4 }} />
              {state.lugar}
            </button>
            {eligiendoLugar && (
              <div className="filter-scroll" style={{ marginTop: 8 }}>
                {LUGARES.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`filter-chip${state.lugar === l ? " active" : ""}`}
                    aria-pressed={state.lugar === l}
                    onClick={() => { onCambiarLugar(l); setEligiendoLugar(false); }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-list">
          {rutina.bloques.map((b, idx) => {
            const objetivo = seriesObjetivo(b.prescripcion);
            const hechas   = state.seriesHechas[idx] ?? 0;
            const actual   = idx === state.bloqueActual;
            const motivo   = state.saltados[idx];
            const saltado  = motivo !== undefined;
            const completo = bloqueCompleto(state, rutina, idx);

            let estado: string | null = null;
            let estadoClase = "";
            if (saltado) {
              const m = motivoSaltoLabel(motivo);
              estado = m ? `Salteado · ${m}` : "Salteado";
              estadoClase = " saltado";
            } else if (completo) {
              const extras = hechas - objetivo;
              estado = `✓ ${objetivo}/${objetivo}${extras > 0 ? ` +${extras}` : ""}`;
              estadoClase = " hecho";
            } else if (hechas > 0) {
              estado = `${hechas}/${objetivo}`;
            }

            return (
              <button
                key={idx}
                type="button"
                className={`vista-dia-fila${actual ? " actual" : ""}`}
                aria-current={actual ? "step" : undefined}
                onClick={() => (actual ? onCerrar() : onIr(idx))}
              >
                <span className="bloque-num">{idx + 1}</span>
                <span className="vista-dia-info">
                  <span className="vista-dia-nombre">{b.nombreEjercicio}</span>
                  <span className="vista-dia-presc">
                    {objetivo} × {objetivoSerieLabel(b.prescripcion)}
                  </span>
                </span>
                {estado && <span className={`vista-dia-estado${estadoClase}`}>{estado}</span>}
              </button>
            );
          })}
        </div>

        <div className="vista-dia-pie">
          <button type="button" className="btn-primary" onClick={onCerrar}>
            {seriesHechasTotales(state) === 0 ? "Empezar" : "Cerrar"}
          </button>
        </div>
      </div>
    </div>
  );
}
