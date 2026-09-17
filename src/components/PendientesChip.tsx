import { useState } from "react";
import { CloudOff, AlertTriangle } from "lucide-react";
import type { SesionPendiente } from "../lib/pendientes";

interface Props {
  pendientes: SesionPendiente[];
}

function textoChip(pendientes: SesionPendiente[]): string {
  const conError = pendientes.filter((p) => p.error).length;
  if (conError > 0) {
    return conError === 1
      ? "1 sesión no se pudo subir"
      : `${conError} sesiones no se pudieron subir`;
  }
  const n = pendientes.length;
  return n === 1 ? "1 sesión sin subir" : `${n} sesiones sin subir`;
}

/** Chip de Home con las sesiones guardadas en el teléfono que faltan subir (P69). */
export function PendientesChip({ pendientes }: Props) {
  const [abierto, setAbierto] = useState(false);
  if (pendientes.length === 0) return null;
  const hayError = pendientes.some((p) => p.error);

  return (
    <div className={`pendientes-chip${hayError ? " error" : ""}`}>
      <button
        type="button"
        className="pendientes-chip-boton"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        {hayError ? <AlertTriangle size={14} aria-hidden /> : <CloudOff size={14} aria-hidden />}
        {textoChip(pendientes)}
      </button>
      {abierto && (
        <ul className="pendientes-detalle">
          {pendientes.map((p) => (
            <li key={p.idHist}>
              <span className="pendientes-nombre">{p.nombreRutina} · {p.fecha}</span>
              <span className="pendientes-estado">
                {p.error ? `Error: ${p.error}` : "Esperando señal para subir"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
