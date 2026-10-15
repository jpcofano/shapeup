import { useState } from "react";
import { textoMinutosDescartados } from "../../lib/entrenarState";

interface Props {
  /** Series registradas en toda la sesión. */
  series:      number;
  /** Aviso arriba de las opciones (sesión vieja, sesión libre sin cerrar). */
  contexto?:   string;
  guardando:   boolean;
  error:       string | null;
  onGuardar:   () => void;
  /** Salir sin guardar, ya confirmado si había series. */
  onDescartar: () => void;
  onSeguir:    () => void;
  onReiniciar: () => void;
  /**
   * Minutos jugados en VR por escalones (P99). Con más de 0, salir sin guardar
   * pide confirmación aunque no haya series, y la cuenta es en minutos.
   */
  minutosJugados?: number;
  /** `false`: no se ofrece «Guardar y salir» (VR por escalones guarda desde su cierre, P99). */
  puedeGuardar?:   boolean;
  /**
   * Sesión vieja de VR por escalones que quedó en el cierre (P102): se ofrece
   * guardarla como la de ese día, descartarla y empezar de nuevo, o salir. No
   * se ofrece «Seguir entrenando» (dejaba en un cierre de hace días), ni
   * reiniciar, y tocar afuera no cierra la hoja.
   */
  cierreViejo?: {
    onGuardarDeEseDia:   () => void;
    onDescartarYEmpezar: () => void;
  };
}

/**
 * Hoja que abre la X del header (P68): guardar como parcial, salir sin guardar
 * (con segundo paso si hay series o minutos jugados), seguir entrenando o reiniciar.
 */
export function HojaSalida({
  series, contexto, guardando, error, onGuardar, onDescartar, onSeguir, onReiniciar,
  minutosJugados = 0, puedeGuardar = true, cierreViejo,
}: Props) {
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  function salirSinGuardar() {
    if (series > 0 || minutosJugados > 0) setConfirmandoDescarte(true);
    else onDescartar();
  }

  return (
    <div className="modal-backdrop" onClick={() => { if (!guardando && !cierreViejo) onSeguir(); }}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-salida-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hoja-salida">
          {contexto && <p className="hoja-salida-contexto">{contexto}</p>}

          {!confirmandoDescarte && cierreViejo ? (
            <>
              <p id="hoja-salida-titulo" className="confirmar-titulo">¿Qué hacemos con esta sesión?</p>
              <button type="button" className="btn-primary" disabled={guardando} onClick={cierreViejo.onGuardarDeEseDia}>
                Guardar la de ese día
              </button>
              <button type="button" className="btn-secondary" disabled={guardando} onClick={cierreViejo.onDescartarYEmpezar}>
                Descartar y empezar de nuevo
              </button>
              <button type="button" className="btn-secondary" disabled={guardando} onClick={salirSinGuardar}>
                Salir sin guardar
              </button>
              {error && <p className="inline-error" style={{ margin: 0 }}>{error}</p>}
            </>
          ) : !confirmandoDescarte ? (
            <>
              <p id="hoja-salida-titulo" className="confirmar-titulo">¿Salir de la sesión?</p>
              {puedeGuardar && (
                <>
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={series === 0 || guardando}
                    onClick={onGuardar}
                  >
                    {guardando ? "Guardando…" : "Guardar y salir"}
                  </button>
                  {series === 0 && (
                    <p className="hoja-salida-nota">Todavía no hay series para guardar</p>
                  )}
                </>
              )}
              <button type="button" className="btn-secondary" disabled={guardando} onClick={salirSinGuardar}>
                Salir sin guardar
              </button>
              <button type="button" className="btn-secondary" disabled={guardando} onClick={onSeguir}>
                Seguir entrenando
              </button>
              {error && <p className="inline-error" style={{ margin: 0 }}>{error}</p>}
              <button type="button" className="hoja-salida-reiniciar" disabled={guardando} onClick={onReiniciar}>
                Reiniciar sesión
              </button>
            </>
          ) : (
            <>
              <p id="hoja-salida-titulo" className="confirmar-titulo">¿Salir sin guardar?</p>
              <p className="confirmar-texto">
                {minutosJugados > 0
                  ? textoMinutosDescartados(minutosJugados)
                  : series === 1 ? "Se descarta 1 serie." : `Se descartan ${series} series.`}
              </p>
              <div className="confirmar-acciones">
                <button type="button" className="btn-secondary" onClick={() => setConfirmandoDescarte(false)}>
                  Volver
                </button>
                <button type="button" className="btn-danger" onClick={onDescartar}>
                  Descartar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
