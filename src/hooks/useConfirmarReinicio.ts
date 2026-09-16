import { useState } from "react";

/**
 * "Reiniciar sesión" con confirmación (P67): con al menos una serie registrada
 * pide confirmar; sin series, reinicia directo. Lo usan el header y la pantalla
 * de fin de las dos rutas de entrenamiento, junto con `<ConfirmarReinicio>`.
 */
export function useConfirmarReinicio(seriesRegistradas: number, reiniciar: () => void) {
  const [abierto, setAbierto] = useState(false);
  return {
    abierto,
    pedir() {
      if (seriesRegistradas > 0) setAbierto(true);
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
