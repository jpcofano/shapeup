import { useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { X } from "lucide-react";
import type { BloqueEjercicio, Ejercicio, MotivoSalto } from "../../types/models";
import { seriesObjetivo } from "../../lib/entrenarState";
import { SaltarEjercicio } from "./SaltarEjercicio";
import {
  aplicarPaso, pasoCarga, pasoCargaPorEquipo, PASOS_CARGA_OPCIONES,
} from "../../lib/pasoCarga";
import { actualizarEjercicio } from "../../data/ejercicios";

const LONG_PRESS_MS = 500;
const LONG_PRESS_TOLERANCIA_PX = 10;

/** Opciones de RIR en la última serie (P70). "3+" se guarda como 3. */
const OPCIONES_RIR: ReadonlyArray<readonly [number, string]> = [[0, "0"], [1, "1"], [2, "2"], [3, "3+"]];

interface Props {
  bloque:       BloqueEjercicio;
  /** Ejercicio resuelto del catálogo. Sin él, el toque largo no abre el editor de paso. */
  ejercicio:    Ejercicio | undefined;
  seriesHechas: number;
  reps:         string;
  carga:        string;
  onRepsChange:  (v: string) => void;
  onCargaChange: (v: string) => void;
  /** `rir` solo viene en la última serie de un bloque de Fuerza, si se eligió (P70). */
  onSerie:      (rir?: number) => void;
  /** Con el bloque completo, el botón principal registra una serie de más (P68b). */
  onSerieExtra: () => void;
  onDeshacer:   () => void;
  /** Saltea el bloque actual con motivo opcional (P68b). */
  onSaltar:     (motivo: MotivoSalto | null) => void;
  /** Reemplaza la copia local del ejercicio al cambiar el paso (sin esperar la escritura). */
  onEjercicioChange: (ej: Ejercicio) => void;
  pulsing?:     boolean;
}

/**
 * Footer del modo guiado: steppers de reps y carga (solo Fuerza), "Serie N hecha"
 * (o "+ Serie extra" con el bloque completo), "Deshacer" y "Saltar ejercicio".
 * Compartido por la sesión de rutina y la sesión libre (P67, P68b).
 */
export function RegistroSerie({
  bloque, ejercicio, seriesHechas, reps, carga,
  onRepsChange, onCargaChange, onSerie, onSerieExtra, onDeshacer, onSaltar,
  onEjercicioChange, pulsing,
}: Props) {
  const [pasoAbierto,   setPasoAbierto]   = useState(false);
  const [pasoError,     setPasoError]     = useState<string | null>(null);
  const [saltarAbierto, setSaltarAbierto] = useState(false);
  // RIR elegido, atado a (bloque, serie): cambiar de bloque o de serie lo limpia solo.
  const [rirSel, setRirSel] = useState<{ clave: string; valor: number } | null>(null);
  const longPress = useLongPress(() => setPasoAbierto(true), !!ejercicio);

  const p  = bloque.prescripcion;
  const pf = bloque.modalidad === "Fuerza" && p.modalidad === "Fuerza" ? p : null;

  const placeholderReps  = pf?.repsObjetivo?.value != null ? String(pf.repsObjetivo.value) : "—";
  const placeholderCarga = pf?.cargaKg != null ? String(pf.cargaKg) : "—";
  const baseReps  = numeroO(placeholderReps, 1);
  const baseCarga = numeroO(placeholderCarga, 0);
  const paso      = pasoCarga(ejercicio);

  function pasoReps(dir: 1 | -1) {
    onRepsChange(aplicarPaso(reps, baseReps, dir, 1, 0));
  }

  function pasoCargaClick(dir: 1 | -1) {
    if (longPress.consumir()) return; // el toque largo no dispara el paso
    onCargaChange(aplicarPaso(carga, baseCarga, dir * paso, 0, 2));
  }

  async function elegirPaso(nuevo: number | null) {
    if (!ejercicio) return;
    setPasoAbierto(false);
    setPasoError(null);
    const copia: Ejercicio = { ...ejercicio };
    if (nuevo == null) delete copia.pasoCargaKg;
    else copia.pasoCargaKg = nuevo;
    onEjercicioChange(copia);
    const r = await actualizarEjercicio(ejercicio.idEjercicio, { pasoCargaKg: nuevo });
    // Si falla, el paso elegido queda para el resto de la sesión: no se revierte.
    if (!r.ok) setPasoError(`No se pudo guardar el paso de carga (${r.error}). Se usa igual en esta sesión.`);
  }

  const objetivo = seriesObjetivo(p);
  const completo = seriesHechas >= objetivo;

  // RIR solo en la última serie del objetivo de un bloque de Fuerza (P70).
  const pideRir  = pf != null && seriesHechas + 1 === objetivo;
  const claveRir = `${bloque.orden}:${bloque.idEjercicio}:${seriesHechas}`;
  const rir      = pideRir && rirSel?.clave === claveRir ? rirSel.valor : null;

  function elegirRir(valor: number) {
    setRirSel(rir === valor ? null : { clave: claveRir, valor });
  }

  function serieHecha() {
    onSerie(rir ?? undefined);
    setRirSel(null);
  }

  return (
    <div className="workout-footer">
      {pf && (
        <div className="registro-campos">
          <div className="registro-campo">
            <span className="quick-log-label">Reps</span>
            <button type="button" className="stepper-btn" aria-label="Restar una rep"
              onClick={() => pasoReps(-1)}>
              −
            </button>
            <input
              className="quick-log-input"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder={placeholderReps}
              value={reps}
              onChange={(e) => onRepsChange(e.target.value)}
            />
            <button type="button" className="stepper-btn" aria-label="Sumar una rep"
              onClick={() => pasoReps(1)}>
              +
            </button>
          </div>

          <div className="registro-campo">
            <span className="quick-log-label">
              Carga (kg)
              <span className="registro-paso">±{paso}</span>
            </span>
            <button type="button" className="stepper-btn" aria-label={`Restar ${paso} kg`}
              {...longPress.handlers}
              onClick={() => pasoCargaClick(-1)}>
              −
            </button>
            <input
              className="quick-log-input"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder={placeholderCarga}
              value={carga}
              onChange={(e) => onCargaChange(e.target.value)}
            />
            <button type="button" className="stepper-btn" aria-label={`Sumar ${paso} kg`}
              {...longPress.handlers}
              onClick={() => pasoCargaClick(1)}>
              +
            </button>
          </div>

          {pasoError && <p className="inline-error" style={{ margin: 0 }}>{pasoError}</p>}
        </div>
      )}

      {pideRir && (
        <div className="registro-rir" role="group" aria-label="¿Cuántas te quedaban?">
          <span className="quick-log-label">¿Cuántas te quedaban?</span>
          <div className="registro-rir-opciones">
            {OPCIONES_RIR.map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                className={`filter-chip rir-chip${rir === valor ? " active" : ""}`}
                aria-pressed={rir === valor}
                onClick={() => elegirRir(valor)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        className={`btn-serie-hecha${pulsing ? " btn-pulsing" : ""}`}
        onClick={completo ? onSerieExtra : serieHecha}
      >
        {completo ? "+ Serie extra" : `Serie ${seriesHechas + 1} hecha ✓`}
      </button>

      {(seriesHechas > 0 || !completo) && (
        <div className="registro-secundarios">
          {seriesHechas > 0 ? (
            <button type="button" className="btn-deshacer-serie" onClick={onDeshacer}>
              Deshacer última serie
            </button>
          ) : <span />}
          {!completo && (
            <button type="button" className="btn-deshacer-serie" onClick={() => setSaltarAbierto(true)}>
              Saltar ejercicio
            </button>
          )}
        </div>
      )}

      {saltarAbierto && (
        <SaltarEjercicio
          nombre={bloque.nombreEjercicio}
          onSaltar={(motivo) => { setSaltarAbierto(false); onSaltar(motivo); }}
          onCancelar={() => setSaltarAbierto(false)}
        />
      )}

      {pasoAbierto && ejercicio && (
        <PasoCargaSheet
          ejercicio={ejercicio}
          onElegir={(v) => void elegirPaso(v)}
          onClose={() => setPasoAbierto(false)}
        />
      )}
    </div>
  );
}

function numeroO(texto: string, fallback: number): number {
  const n = parseFloat(texto);
  return Number.isFinite(n) ? n : fallback;
}

// ── Toque largo ──────────────────────────────────────────────────────────────

/**
 * Toque largo con pointer events: dispara `onLong` a los 500 ms si el dedo no
 * se movió más de 10 px. `consumir()` avisa al click siguiente que ese toque
 * fue largo, para que no aplique el paso.
 */
function useLongPress(onLong: () => void, habilitado: boolean) {
  const timer   = useRef<number | null>(null);
  const origen  = useRef<{ x: number; y: number } | null>(null);
  const disparo = useRef(false);

  function cancelar() {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    origen.current = null;
  }

  return {
    handlers: {
      onPointerDown(e: ReactPointerEvent) {
        disparo.current = false;
        if (!habilitado) return;
        cancelar();
        origen.current = { x: e.clientX, y: e.clientY };
        timer.current = window.setTimeout(() => {
          timer.current = null;
          disparo.current = true;
          onLong();
        }, LONG_PRESS_MS);
      },
      onPointerMove(e: ReactPointerEvent) {
        if (timer.current == null || !origen.current) return;
        const dx = e.clientX - origen.current.x;
        const dy = e.clientY - origen.current.y;
        if (Math.hypot(dx, dy) > LONG_PRESS_TOLERANCIA_PX) cancelar();
      },
      onPointerUp:     cancelar,
      onPointerCancel: cancelar,
      onPointerLeave:  cancelar,
      onContextMenu(e: ReactMouseEvent) {
        if (habilitado) e.preventDefault();
      },
    },
    consumir(): boolean {
      if (!disparo.current) return false;
      disparo.current = false;
      return true;
    },
  };
}

// ── Hoja de paso de carga ────────────────────────────────────────────────────

interface PasoCargaSheetProps {
  ejercicio: Ejercicio;
  onElegir:  (paso: number | null) => void;
  onClose:   () => void;
}

function PasoCargaSheet({ ejercicio, onElegir, onClose }: PasoCargaSheetProps) {
  // El toque largo abre la hoja con el dedo todavía apoyado: su click no tiene que
  // cerrarla. Solo cierra un click que también empezó sobre el fondo.
  const presionEnFondo = useRef(false);
  const override = ejercicio.pasoCargaKg != null && ejercicio.pasoCargaKg > 0
    ? ejercicio.pasoCargaKg
    : null;

  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => { presionEnFondo.current = e.target === e.currentTarget; }}
      onClick={(e) => { if (presionEnFondo.current && e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-sheet" role="dialog" aria-modal="true" aria-label="Paso de carga">
        <div className="modal-header">
          <span>Paso de carga — {ejercicio.nombre}</span>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <div className="paso-carga-body">
          <div className="paso-carga-chips">
            {PASOS_CARGA_OPCIONES.map((v) => (
              <button
                key={v}
                type="button"
                className={`filter-chip${override === v ? " active" : ""}`}
                aria-pressed={override === v}
                onClick={() => onElegir(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`filter-chip${override == null ? " active" : ""}`}
            aria-pressed={override == null}
            onClick={() => onElegir(null)}
          >
            Usar default del equipo ({pasoCargaPorEquipo(ejercicio)})
          </button>
        </div>
      </div>
    </div>
  );
}
