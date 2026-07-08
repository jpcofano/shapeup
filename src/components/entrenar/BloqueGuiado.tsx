import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { BloqueEjercicio, Ejercicio } from "../../types/models";
import { seriesObjetivo, objetivoSerieLabel } from "../../lib/entrenarState";
import { ProgressDots } from "./ProgressDots";
import { MediaTabs } from "./MediaTabs";

interface Props {
  bloque:       BloqueEjercicio;
  bloqueIdx:    number;
  total:        number;
  seriesHechas: number;
  ejercicio?:   Ejercicio;   // cargado del catálogo (instrucciones, puntos, errores)
  onIrASerie:   (serieIdx: number) => void;
}

/**
 * Vista guiada de un bloque: nombre, dots de progreso, objetivo de la serie,
 * instrucciones, puntos clave (verde) y errores comunes (ámbar).
 */
export function BloqueGuiado({ bloque, bloqueIdx, total, seriesHechas, ejercicio, onIrASerie }: Props) {
  const [instrOpen, setInstrOpen] = useState(false);

  const objetivo = objetivoSerieLabel(bloque.prescripcion);
  const serieNum = seriesHechas + 1;
  const totalSeries = seriesObjetivo(bloque.prescripcion);

  const instrucciones = ejercicio?.instrucciones ?? [];
  const puntosClave   = ejercicio?.puntosClave   ?? [];
  const errores       = ejercicio?.erroresComunes ?? [];

  return (
    <div className="bloque-guiado">
      {/* Contador */}
      <span className="bloque-counter">
        Ejercicio {bloqueIdx + 1} de {total}
      </span>

      {/* Nombre */}
      <h2 className="bloque-nombre-grande">{bloque.nombreEjercicio}</h2>

      {/* Chip de juego VR sugerido */}
      {bloque.prescripcion.modalidad === "Cardio" && bloque.prescripcion.juegoSugerido && (
        <span className="badge badge-accent" style={{ alignSelf: "flex-start" }}>
          🎮 {bloque.prescripcion.juegoSugerido}
        </span>
      )}

      {/* Contexto compacto: músculo primario + primer equipo */}
      {ejercicio && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>
          {[ejercicio.grupoMuscularPrimario, ejercicio.equipo[0]].filter(Boolean).join(" · ")}
        </p>
      )}

      {/* MediaTabs: Demo / Músculo */}
      <MediaTabs ej={ejercicio} />

      {/* Dots y serie actual */}
      <ProgressDots
        total={totalSeries}
        hechas={seriesHechas}
        activa={seriesHechas}
        onGoTo={onIrASerie}
      />

      {/* Objetivo */}
      <span className="objetivo-chip">
        Serie {serieNum} · {objetivo}
      </span>

      {/* Instrucciones colapsables */}
      {instrucciones.length > 0 && (
        <div>
          <button className="instrucciones-toggle" onClick={() => setInstrOpen((v) => !v)}>
            {instrOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            Instrucciones
          </button>
          {instrOpen && (
            <div className="instrucciones-body">
              <ol>
                {instrucciones.map((paso, i) => <li key={i}>{paso}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Puntos clave */}
      {puntosClave.length > 0 && (
        <div className="banner banner-green">
          <p className="banner-title">✅ Puntos clave</p>
          <ul>{puntosClave.map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
      )}

      {/* Errores comunes */}
      {errores.length > 0 && (
        <div className="banner banner-amber">
          <p className="banner-title">⚠️ Errores comunes</p>
          <ul>{errores.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
