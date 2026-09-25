import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, Check, CloudOff } from "lucide-react";
import { textoChipSincronizacion } from "../lib/sincronizacionAutomatica";
import { useEstadoSincronizacion, descartarChipSincronizacion } from "../hooks/useSincronizacionAutomatica";

/** Cuánto queda a la vista el resultado antes de irse solo. */
const MS_VISIBLE = 6000;

/**
 * Chip de Home con la sincronización automática del puente (P85). Discreto, en
 * el mismo lugar que el de sesiones sin subir. Sin nada nuevo no se muestra.
 */
export function SincronizacionChip() {
  const estado = useEstadoSincronizacion();
  const navigate = useNavigate();
  const texto = textoChipSincronizacion(estado);
  const terminado = estado.fase === "lista" || estado.fase === "fallo";

  useEffect(() => {
    if (!terminado || !texto) return;
    const id = setTimeout(descartarChipSincronizacion, MS_VISIBLE);
    return () => clearTimeout(id);
  }, [terminado, texto]);

  if (!texto) return null;
  const fallo = estado.fase === "fallo";

  return (
    <div className={`pendientes-chip sync-chip${fallo ? " fallo" : estado.fase === "lista" ? " ok" : ""}`}>
      <button
        type="button"
        className="pendientes-chip-boton"
        onClick={() => { descartarChipSincronizacion(); navigate("/salud"); }}
      >
        {estado.fase === "corriendo" && <RefreshCw size={14} aria-hidden />}
        {estado.fase === "lista" && <Check size={14} aria-hidden />}
        {fallo && <CloudOff size={14} aria-hidden />}
        {texto}
      </button>
    </div>
  );
}
