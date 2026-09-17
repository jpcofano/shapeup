import { WifiOff } from "lucide-react";
import { useConexion } from "../../hooks/useConexion";

/**
 * Aviso "Sin conexión" para el header de la sesión (P69). Va posicionado sobre
 * el borde inferior del header, así que no mueve el resto del layout.
 */
export function SinConexion() {
  const online = useConexion();
  if (online) return null;
  return (
    <span className="chip-sin-conexion" role="status">
      <WifiOff size={12} aria-hidden /> Sin conexión
    </span>
  );
}
