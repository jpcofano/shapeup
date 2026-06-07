import { useState, useEffect, useCallback } from "react";
import type { Rutina, SerieRegistro } from "../types/models";
import {
  loadEntrenarState, persistEntrenarState, clearEntrenarState,
  completarSerie as _completarSerie,
  deshacerSerie as _deshacerSerie,
  saltarDescanso as _saltarDescanso,
  ajustarDescanso as _ajustarDescanso,
  irABloque as _irABloque,
  siguienteBloque as _siguienteBloque,
  anteriorBloque as _anteriorBloque,
  toggleModoVista as _toggleModoVista,
  construirBloquesRegistro,
  type EntrenarState,
} from "../lib/entrenarState";

/**
 * Hook que envuelve el reducer puro de entrenarState.ts:
 * carga desde localStorage, persiste en cada acción,
 * descarta descansos vencidos al montar (ya lo hace loadEntrenarState).
 *
 * sessionKey: "rutina:<idRutina>" — una key por rutina.
 */
export function useEntrenarState(sessionKey: string, rutina: Rutina | null) {
  const [state, setState] = useState<EntrenarState>(() =>
    loadEntrenarState(sessionKey),
  );

  // Persistir en localStorage en cada cambio de estado
  useEffect(() => {
    persistEntrenarState(sessionKey, state);
  }, [sessionKey, state]);

  const dispatch = useCallback(
    (updater: (s: EntrenarState) => EntrenarState) => {
      setState((s) => updater(s));
    },
    [],
  );

  return {
    state,

    completarSerie(idx: number, reg?: Partial<SerieRegistro>) {
      if (!rutina) return;
      dispatch((s) => _completarSerie(s, rutina, idx, reg));
    },
    deshacerSerie(idx: number) {
      dispatch((s) => _deshacerSerie(s, idx));
    },
    saltarDescanso() {
      const now = Date.now();
      dispatch((s) => _saltarDescanso(s, now));
    },
    ajustarDescanso(deltaSeg: number) {
      dispatch((s) => _ajustarDescanso(s, deltaSeg));
    },
    irABloque(idx: number) {
      dispatch((s) => _irABloque(s, idx));
    },
    siguienteBloque() {
      if (!rutina) return;
      dispatch((s) => _siguienteBloque(s, rutina));
    },
    anteriorBloque() {
      dispatch(_anteriorBloque);
    },
    toggleModo() {
      if (!rutina) return;
      dispatch((s) => _toggleModoVista(s, rutina));
    },

    /** Reinicia la sesión (borra localStorage y estado). */
    reiniciar() {
      clearEntrenarState(sessionKey);
      setState(loadEntrenarState(sessionKey));
    },

    /** Construye BloqueRegistro[] para escribir al Historial. */
    bloquesRegistro() {
      return rutina ? construirBloquesRegistro(state, rutina) : [];
    },
  };
}
