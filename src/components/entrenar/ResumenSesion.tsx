import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Bicep } from "../Bicep";
import type { BloqueRegistro, Historial, Rutina, ZonaMolestia } from "../../types/models";
import type { EntrenarState } from "../../lib/entrenarState";
import {
  cifrasSesion, deltaEjercicio, esPR, leyendaRpe, mejorCarga,
  MEJORAS, SENSACIONES, ZONAS_MOLESTIA,
  type DeltaEjercicio,
} from "../../lib/resumenSesion";
import { ResumenSalteados } from "./ResumenSalteados";
import { esRutinaVR } from "../../lib/progresionVR";

/** Lo que el usuario completa en la pantalla de fin. */
export interface DatosCierre {
  rpe:          number | null;
  comoMeSenti?: string;
  queMejorar?:  string;
  molestias?:   ZonaMolestia[];
  notas?:       string;
  /**
   * Cómo le resultó la sesión de VR (P79, §9.1). Opcional, igual que el RPE.
   *
   * ⛔ **Dato de análisis: ninguna regla de progresión lo lee.** Está para
   * poder mirar después si lo que se midió "en zona" se sintió como tal.
   */
  dificultadPercibida?: "suave" | "normal" | "intenso";
}

/** Las tres opciones del chip de VR, en orden. */
const DIFICULTADES: ReadonlyArray<readonly ["suave" | "normal" | "intenso", string]> = [
  ["suave", "Suave"], ["normal", "Normal"], ["intenso", "Intenso"],
];

interface Props {
  rutina:    Rutina;
  state:     EntrenarState;
  /** `session.bloquesRegistro()` de la sesión actual. */
  bloques:   BloqueRegistro[];
  /** Historial previo del miembro, sin la sesión actual. `null` si no cargó: no hay deltas. */
  historial: Historial[] | null;
  completa:  boolean;
  saving:    boolean;
  saveError: string | null;
  onFinalizar: (datos: DatosCierre) => void;
  onRetomar:   (idx: number) => void;
  onEmpezarDeNuevo: () => void;
  /** Chip "+ serie de…" del último bloque cerrado, si corresponde. */
  chipAnterior?:  ReactNode;
  /** Botones propios de la ruta (p. ej. "Sumar otro ejercicio" en la libre). */
  accionesExtra?: ReactNode;
}

function fmtKg(n: number): string {
  return String(Math.round(n * 100) / 100);
}

function textoDelta(d: DeltaEjercicio): { texto: string; positivo: boolean } | null {
  switch (d.tipo) {
    case "primera-vez": return { texto: "Primera vez", positivo: false };
    case "sin-carga":   return null;
    case "sustituido":  return { texto: "Sustituido — sin comparación", positivo: false };
    case "carga":
      return {
        texto: `${d.deltaKg > 0 ? "+" : "−"}${fmtKg(Math.abs(d.deltaKg))} kg`,
        positivo: d.deltaKg > 0,
      };
    case "reps": {
      if (d.deltaReps === 0) return { texto: "=", positivo: false };
      const n = Math.abs(d.deltaReps);
      return {
        texto: `${d.deltaReps > 0 ? "+" : "−"}${n} ${n === 1 ? "rep" : "reps"}`,
        positivo: d.deltaReps > 0,
      };
    }
  }
}

/**
 * Pantalla de fin (P70), compartida por la sesión de rutina y la libre: cifras,
 * ejercicios con su comparación, salteados, RPE con leyenda y un pliegue
 * opcional para sensación, molestias, qué mejorar y nota.
 */
export function ResumenSesion({
  rutina, state, bloques, historial, completa, saving, saveError,
  onFinalizar, onRetomar, onEmpezarDeNuevo, chipAnterior, accionesExtra,
}: Props) {
  const [rpe,          setRpe]          = useState<number | null>(null);
  const [dificultad,   setDificultad]   = useState<DatosCierre["dificultadPercibida"]>(undefined);
  /** Una sesión es VR si su rutina tiene un bloque de intervalos con juego (P79). */
  const esVR = esRutinaVR(rutina);
  const [plegado,      setPlegado]      = useState(true);
  const [sensacion,    setSensacion]    = useState<string | null>(null);
  const [molestias,    setMolestias]    = useState<ZonaMolestia[]>([]);
  const [sinMolestias, setSinMolestias] = useState(false);
  const [mejoras,      setMejoras]      = useState<string[]>([]);
  const [nota,         setNota]         = useState("");

  const cifras = cifrasSesion(bloques, state.inicioMs, Date.now());
  const hechos = bloques.filter((b) => b.series.some((s) => s.completada));

  function alternarMolestia(z: ZonaMolestia) {
    setSinMolestias(false);
    setMolestias((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));
  }

  function alternarMejora(m: string) {
    setMejoras((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  }

  function finalizar() {
    const notaLimpia = nota.trim();
    onFinalizar({
      rpe,
      ...(dificultad ? { dificultadPercibida: dificultad } : {}),
      ...(sensacion ? { comoMeSenti: sensacion } : {}),
      // Orden estable: el de las opciones, no el de los toques.
      ...(mejoras.length > 0 ? { queMejorar: MEJORAS.filter((m) => mejoras.includes(m)).join(", ") } : {}),
      ...(molestias.length > 0
        ? { molestias: ZONAS_MOLESTIA.map(([z]) => z).filter((z) => molestias.includes(z)) }
        : {}),
      ...(notaLimpia ? { notas: notaLimpia } : {}),
    });
  }

  return (
    <div className="finish-screen">
      <span style={{ color: "var(--accent)", lineHeight: 0, display: "block" }}>
        <Bicep size={52} />
      </span>
      <h2 className="finish-title">{completa ? "¡Sesión completada!" : "Sesión terminada"}</h2>

      {/* Cifras */}
      <div className="resumen-cifras">
        <div className="resumen-cifra">
          <span className="resumen-cifra-valor">
            {cifras.tonelajeKg > 0 ? cifras.tonelajeKg.toLocaleString("es-AR") : "—"}
          </span>
          <span className="resumen-cifra-label">kg</span>
        </div>
        <div className="resumen-cifra">
          <span className="resumen-cifra-valor">{cifras.seriesEfectivas}</span>
          <span className="resumen-cifra-label">{cifras.seriesEfectivas === 1 ? "serie" : "series"}</span>
        </div>
        <div className="resumen-cifra">
          <span className="resumen-cifra-valor">{cifras.duracionMin ?? "—"}</span>
          <span className="resumen-cifra-label">min</span>
        </div>
      </div>

      {/* Ejercicios hechos */}
      {hechos.length > 0 && (
        <ul className="resumen-ejercicios">
          {hechos.map((b) => {
            const n = b.series.filter((s) => s.completada).length;
            const carga = mejorCarga(b);
            const pr = historial != null && esPR(b, historial);
            const delta = historial != null && !pr ? textoDelta(deltaEjercicio(b, historial)) : null;
            return (
              <li key={`${b.orden}-${b.idEjercicio}`} className="resumen-ejercicio">
                <span className="resumen-ejercicio-info">
                  <span className="resumen-ejercicio-nombre">{b.nombreEjercicio}</span>
                  <span className="resumen-ejercicio-detalle">
                    {carga != null ? `${n} × ${fmtKg(carga)} kg` : `${n} ${n === 1 ? "serie" : "series"}`}
                  </span>
                </span>
                {pr && <span className="resumen-pr">PR</span>}
                {delta && (
                  <span className={`resumen-delta${delta.positivo ? " positivo" : ""}`}>{delta.texto}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ResumenSalteados rutina={rutina} state={state} onRetomar={onRetomar} />
      {chipAnterior && <div style={{ width: "100%" }}>{chipAnterior}</div>}

      {/* VR: el chip de dificultad ocupa el lugar del RPE (P79, §9.1) */}
      {esVR && (
        <div style={{ width: "100%", textAlign: "left" }}>
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
            ¿Cómo te resultó?
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {DIFICULTADES.map(([valor, label]) => (
              <button
                key={valor}
                type="button"
                className={`btn-secondary${dificultad === valor ? " active" : ""}`}
                aria-pressed={dificultad === valor}
                style={{
                  flex: 1, padding: "14px 0", fontSize: 14, fontWeight: 600,
                  ...(dificultad === valor
                    ? { borderColor: "var(--accent-border)", color: "var(--accent)" }
                    : {}),
                }}
                onClick={() => setDificultad(dificultad === valor ? undefined : valor)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="rpe-leyenda">Es opcional, y no cambia lo que la app te va a sugerir.</p>
        </div>
      )}

      {/* RPE */}
      {!esVR && (
      <div style={{ width: "100%", textAlign: "left" }}>
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>
          ¿Cómo fue el esfuerzo? (RPE)
        </p>
        <div className="rpe-selector">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <button
              key={n}
              className={`rpe-btn${rpe === n ? " selected" : ""}`}
              aria-pressed={rpe === n}
              onClick={() => setRpe(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="rpe-leyenda">
          {rpe != null
            ? `${rpe} · ${leyendaRpe(rpe)}`
            : "Tocá un número. 7 = te quedaban unas 3 reps."}
        </p>
      </div>
      )}

      {/* Cómo te sentiste — plegado por defecto */}
      <div className="resumen-pliegue">
        <button
          type="button"
          className="instrucciones-toggle"
          aria-expanded={!plegado}
          onClick={() => setPlegado((v) => !v)}
        >
          {plegado ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          Cómo te sentiste
        </button>

        {!plegado && (
          <div className="resumen-pliegue-cuerpo">
            <div className="resumen-grupo">
              <span className="quick-log-label">Sensación</span>
              <div className="paso-carga-chips">
                {SENSACIONES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`filter-chip${sensacion === s ? " active" : ""}`}
                    aria-pressed={sensacion === s}
                    onClick={() => setSensacion(sensacion === s ? null : s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="resumen-grupo">
              <span className="quick-log-label">Molestias</span>
              <div className="paso-carga-chips">
                <button
                  type="button"
                  className={`filter-chip${sinMolestias ? " active" : ""}`}
                  aria-pressed={sinMolestias}
                  onClick={() => { setMolestias([]); setSinMolestias((v) => !v); }}
                >
                  Ninguna
                </button>
                {ZONAS_MOLESTIA.map(([z, label]) => (
                  <button
                    key={z}
                    type="button"
                    className={`filter-chip${molestias.includes(z) ? " active" : ""}`}
                    aria-pressed={molestias.includes(z)}
                    onClick={() => alternarMolestia(z)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="resumen-grupo">
              <span className="quick-log-label">Qué mejorar</span>
              <div className="paso-carga-chips">
                {MEJORAS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`filter-chip${mejoras.includes(m) ? " active" : ""}`}
                    aria-pressed={mejoras.includes(m)}
                    onClick={() => alternarMejora(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <label className="resumen-grupo">
              <span className="quick-log-label">Nota</span>
              <input
                className="form-input"
                type="text"
                placeholder="Algo para acordarte de esta sesión"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      {saveError && <p className="inline-error">{saveError}</p>}
      <button
        className="btn-primary"
        style={{ width: "100%", marginTop: 8 }}
        disabled={saving}
        onClick={finalizar}
      >
        {saving ? "Guardando…" : "Finalizar y guardar"}
      </button>
      {accionesExtra}
      <button className="btn-secondary" style={{ width: "100%" }} onClick={onEmpezarDeNuevo}>
        Empezar de nuevo
      </button>
    </div>
  );
}
