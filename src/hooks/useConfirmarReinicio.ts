import { useState } from "react";

/**
 * "Reiniciar sesión" con confirmación (P67): con al menos una serie registrada
 * pide confirmar; sin series, reinicia directo. Lo usan el header y la pantalla
 * de fin de las dos rutas de entrenamiento, junto con `<ConfirmarReinicio>`.
 * En VR por escalones no hay series hasta «Terminar»: ahí confirma por los
 * minutos jugados (P99).
 */
export function useConfirmarReinicio(seriesRegistradas: number, reiniciar: () => void, minutosJugados = 0) {
  const [abierto, setAbierto] = useState(false);
  return {
    abierto,
    pedir() {
      if (seriesRegistradas > 0 || minutosJugados > 0) setAbierto(true);
      else reiniciar();
    },
    confirmar() {
      setAbierto(false);
      reiniciar();
    },
    cancelar() {
      setAbierto(false);
    },
  };
}
