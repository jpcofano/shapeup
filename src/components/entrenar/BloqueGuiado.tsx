import { useState } from "react";
import { ChevronDown, ChevronRight, List } from "lucide-react";
import type { BloqueEjercicio, Ejercicio, MotivoSalto } from "../../types/models";
import { seriesObjetivo, objetivoSerieLabel, motivoSaltoLabel } from "../../lib/entrenarState";
import { ProgressDots } from "./ProgressDots";
import { MediaTabs } from "./MediaTabs";

interface Props {
  bloque:       BloqueEjercicio;
  bloqueIdx:    number;
  total:        number;
  seriesHechas: number;
  ejercicio?:   Ejercicio;   // cargado del catálogo (instrucciones, puntos, errores)
  onIrASerie:   (serieIdx: number) => void;
  /** Nombre del próximo pendiente; `null` si este es el último. */
  aContinuacion: string | null;
  /** Motivo si el bloque está salteado (`null` = sin motivo); `undefined` si no lo está. */
  saltado?:     MotivoSalto | null;
  /** Abre la vista del día (el contador "Ejercicio X de N"). */
  onAbrirDia:   () => void;
  onRetomar:    () => void;
}

/**
 * Vista guiada de un bloque: contador (abre la vista del día), nombre, dots de
 * progreso, objetivo de la serie, qué viene después, instrucciones, puntos
 * clave (verde) y errores comunes (ámbar).
 */
export function BloqueGuiado({
  bloque, bloqueIdx, total, seriesHechas, ejercicio, onIrASerie,
  aContinuacion, saltado, onAbrirDia, onRetomar,
}: Props) {
  const [instrOpen, setInstrOpen] = useState(false);

  const objetivo = objetivoSerieLabel(bloque.prescripcion);
  const serieNum = seriesHechas + 1;
  const totalSeries = seriesObjetivo(bloque.prescripcion);
  const esSaltado = saltado !== undefined;
  const motivo = motivoSaltoLabel(saltado);

  const instrucciones = ejercicio?.instrucciones ?? [];
  const puntosClave   = ejercicio?.puntosClave   ?? [];
  const errores       = ejercicio?.erroresComunes ?? [];

  return (
    <div className="bloque-guiado">
      {/* Contador — abre la vista del día */}
      <button type="button" className="bloque-counter bloque-counter-btn" onClick={onAbrirDia}>
        <List size={13} aria-hidden />
        Ejercicio {bloqueIdx + 1} de {total}
        <ChevronDown size={13} aria-hidden />
      </button>

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

      {/* Objetivo, o estado de salteado */}
      {esSaltado ? (
        <div className="bloque-saltado">
          <span className="objetivo-chip objetivo-chip-saltado">
            Salteado{motivo ? ` · ${motivo}` : ""}
          </span>
          <button type="button" className="btn-primary" onClick={onRetomar}>
            Retomar
          </button>
        </div>
      ) : (
        <span className="objetivo-chip">
          {seriesHechas >= totalSeries
            ? `Serie extra · ${objetivo}`
            : `Serie ${serieNum} de ${totalSeries} · ${objetivo}`}
        </span>
      )}

      <p className="bloque-siguiente">
        {aContinuacion != null ? `A continuación: ${aContinuacion}` : "Último ejercicio"}
      </p>

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
