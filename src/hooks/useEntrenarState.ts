import { useState, useEffect, useCallback } from "react";
import type { Rutina, SerieRegistro } from "../types/models";
import {
  loadEntrenarState, persistEntrenarState, clearEntrenarState,
  completarSerie as _completarSerie,
  deshacerSerie as _deshacerSerie,
  saltarDescanso as _saltarDescanso,
  ajustarDescanso as _ajustarDescanso,
  asegurarInicioSerie as _asegurarInicioSerie,
  asegurarInicioSesion as _asegurarInicioSesion,
  ajustarTrabajo as _ajustarTrabajo,
  irABloque as _irABloque,
  siguienteBloque as _siguienteBloque,
  anteriorBloque as _anteriorBloque,
  toggleModoVista as _toggleModoVista,
  estadoReiniciado,
  asignarIdSesion as _asignarIdSesion,
  quitarBloques as _quitarBloques,
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
      const now = Date.now();
      dispatch((s) => _ajustarDescanso(s, deltaSeg, now));
    },
    asegurarInicioSerie(idx: number) {
      dispatch((s) => _asegurarInicioSerie(s, idx));
    },
    /**
     * Sella el inicio de la sesión si todavía no lo tiene. Llamado después de
     * `reiniciar()` en el mismo handler, se aplica sobre el estado reiniciado:
     * React procesa las actualizaciones encoladas en orden.
     */
    asegurarInicioSesion() {
      const now = Date.now();
      dispatch((s) => _asegurarInicioSesion(s, now));
    },
    ajustarTrabajo(idx: number, deltaSeg: number) {
      dispatch((s) => _ajustarTrabajo(s, idx, deltaSeg));
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

    /** Guarda el id de la `SesionProgramada` creada para esta sesión. */
    asignarIdSesion(idSesion: string) {
      dispatch((s) => _asignarIdSesion(s, idSesion));
    },
    /** Saca bloques (sesión libre con ejercicios que ya no existen) y corre los índices. */
    quitarBloques(quitados: number[], totalRestante: number) {
      dispatch((s) => _quitarBloques(s, quitados, totalRestante));
    },

    /** Empieza la sesión de nuevo: todo en cero, conserva `idSesion` (P68). */
    reiniciar() {
      dispatch(estadoReiniciado);
    },

    /**
     * Borra el estado persistido sin tocar el que está en memoria. Usar justo
     * antes de salir de la pantalla (sesión guardada o descartada): como el estado
     * no cambia, nada vuelve a persistirlo, y la próxima visita arranca de cero.
     */
    limpiar() {
      clearEntrenarState(sessionKey);
    },

    /** Construye BloqueRegistro[] para escribir al Historial. */
    bloquesRegistro() {
      return rutina ? construirBloquesRegistro(state, rutina) : [];
    },
  };
}
