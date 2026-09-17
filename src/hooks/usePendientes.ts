import { useEffect, useState } from "react";
import { EVENTO_PENDIENTES, listarPendientes, type SesionPendiente } from "../lib/pendientes";

/**
 * Sesiones sin subir (P69). Se actualiza cuando cambia la lista en esta pestaña
 * (evento propio) o en otra (evento `storage`).
 */
export function usePendientes(): SesionPendiente[] {
  const [lista, setLista] = useState<SesionPendiente[]>(() => listarPendientes());

  useEffect(() => {
    const actualizar = () => setLista(listarPendientes());
    window.addEventListener(EVENTO_PENDIENTES, actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener(EVENTO_PENDIENTES, actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, []);

  return lista;
}
