import { useState } from "react";
import type { EscalonVR } from "../../types/models";
import { DIFICULTAD_MIXTA, etiquetaDificultad, minutosPrescriptos } from "../../lib/escalonesVR";
import { textoEscalon } from "./InicioEscalonVR";

interface Props {
  prescripto: EscalonVR;
  /** Minutos de la ventana: desde «Empezar» hasta «Terminar». */
  minutosJugados: number;
  dificultades: { id: string; etiqueta: string }[];
  guardando: boolean;
  error: string | null;
  onGuardar: (datos: { completoDeclarado: boolean | null; dificultad: string | null }) => void;
}

/**
 * El cierre de una sesión de VR por escalones (P98). Se confirma si se completó
 * lo prescripto y en qué dificultad se jugó (puede ser mixta). La app lo
 * contrasta con la ventana: completar exige las dos cosas. Sin contestar, la
 * sesión se guarda igual y no cuenta como completada.
 */
export function CierreEscalonVR({ prescripto, minutosJugados, dificultades, guardando, error, onGuardar }: Props) {
  const [completo, setCompleto] = useState<boolean | null>(null);
  const [dificultad, setDificultad] = useState<string | null>(null);
  const opciones = [...dificultades.map((d) => d.id), DIFICULTAD_MIXTA];

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Prescripto: {textoEscalon(prescripto)}</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
          {Math.round(minutosJugados)} de {Math.round(minutosPrescriptos(prescripto))} min ·
          dificultad prevista {etiquetaDificultad(prescripto.dificultad, dificultades)}
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13 }}>¿Completaste lo prescripto?</span>
        {([true, false] as const).map((v) => (
          <button key={String(v)} className={completo === v ? "btn-primary" : "btn-secondary"} style={{ fontSize: 13 }}
            onClick={() => setCompleto(v)}>
            {v ? "Sí" : "No"}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13 }}>¿En qué dificultad jugaste?</span>
        {opciones.map((id) => (
          <button key={id} className={dificultad === id ? "btn-primary" : "btn-secondary"} style={{ fontSize: 13 }}
            onClick={() => setDificultad(id)}>
            {etiquetaDificultad(id, dificultades)}
          </button>
        ))}
      </div>
      <button className="btn-primary" disabled={guardando}
        onClick={() => onGuardar({ completoDeclarado: completo, dificultad })}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      {error && <p style={{ margin: 0, fontSize: 13, color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
