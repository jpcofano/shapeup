import { useState } from "react";
import type { SemanaAdherencia } from "../lib/adherencia";

interface Props {
  /** Serie completa; se muestran las últimas `semanas`. */
  serie: SemanaAdherencia[];
  semanas?: number;
  /**
   * El rango de actividades quedó incompleto por el tope de paginado (P77b).
   * Se dice: una barra vacía por falta de datos no es lo mismo que una semana
   * en la que no entrenaste.
   */
  truncada?: boolean;
}

function fechaCorta(ymd: string): string {
  const [, m, d] = ymd.split("-");
  return `${Number(d)}/${Number(m)}`;
}

/**
 * Una barra por semana, con la altura en días y la meta cruzándolas (P77a).
 *
 * **Cumplida y no cumplida se distinguen por relleno, no solo por color**: la
 * cumplida va sólida y la que no, rayada y con borde. Tiene que poder leerse
 * en escala de grises, o el gráfico no sirve para quien no distingue el verde.
 */
export function SerieAdherencia({ serie, semanas = 12, truncada }: Props) {
  const [abierta, setAbierta] = useState<string | null>(null);
  const visibles = serie.slice(-semanas);
  if (visibles.length === 0) return null;

  const meta = visibles[visibles.length - 1].meta;
  const tope = Math.max(meta, ...visibles.map((s) => s.diasPlan));
  const ALTO = 96;
  const yMeta = ALTO - (meta / tope) * ALTO;
  const sel = visibles.find((s) => s.semanaInicio === abierta) ?? null;

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <p className="section-title" style={{ margin: 0 }}>Días por semana</p>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>meta: {meta}</span>
      </div>

      <div style={{ position: "relative", height: ALTO, display: "flex", alignItems: "flex-end", gap: 4 }}>
        {/* Línea de meta */}
        <div
          aria-hidden
          style={{
            position: "absolute", left: 0, right: 0, top: yMeta,
            borderTop: "1.5px dashed var(--muted)", opacity: 0.55, pointerEvents: "none",
          }}
        />
        {visibles.map((s) => {
          const alto = tope > 0 ? Math.max(2, (s.diasPlan / tope) * ALTO) : 2;
          const activa = s.semanaInicio === abierta;
          return (
            <button
              key={s.semanaInicio}
              onClick={() => setAbierta((v) => (v === s.semanaInicio ? null : s.semanaInicio))}
              aria-label={`Semana del ${fechaCorta(s.semanaInicio)}: ${s.diasPlan} de ${s.meta}`}
              aria-pressed={activa}
              style={{
                flex: 1, height: ALTO, padding: 0, border: "none", background: "none",
                display: "flex", alignItems: "flex-end", cursor: "pointer",
              }}
            >
              <span
                style={{
                  width: "100%", height: alto, borderRadius: 3,
                  // Cumplida: sólida. Sin cumplir: rayada, con borde — se lee
                  // sin depender del color.
                  ...(s.cumplida
                    ? { background: "var(--accent)" }
                    : {
                        border: "1.5px solid var(--muted)",
                        backgroundImage:
                          "repeating-linear-gradient(45deg, var(--muted) 0 2px, transparent 2px 5px)",
                        opacity: 0.75,
                      }),
                  ...(activa ? { outline: "2px solid var(--fg)", outlineOffset: 1 } : {}),
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Extremos del eje: alcanza para ubicarse sin saturar de etiquetas. */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ fontSize: 9, color: "var(--muted)" }}>{fechaCorta(visibles[0].semanaInicio)}</span>
        <span style={{ fontSize: 9, color: "var(--muted)" }}>
          {fechaCorta(visibles[visibles.length - 1].semanaInicio)}
        </span>
      </div>

      {truncada && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "var(--warn, var(--muted))" }}>
          ⚠ No se trajeron todas las actividades del rango: los días de
          movimiento pueden estar incompletos. Las barras y la meta no cambian.
        </p>
      )}

      <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--muted)", minHeight: 18 }}>
        {sel
          ? `Semana del ${fechaCorta(sel.semanaInicio)} · ${sel.diasPlan} de ${sel.meta}`
            // `null` = no se cargaron las actividades de esa semana: no se
            // dibuja nada. Ni guion, ni cero, ni "sin datos" (P77b).
            + (sel.diasMovimiento != null && sel.diasMovimiento > 0
              ? ` · ${sel.diasMovimiento} ${sel.diasMovimiento === 1 ? "día" : "días"} de movimiento`
              : "")
            + (sel.enCurso ? " · en curso" : "")
          : "Tocá una barra para ver la semana."}
      </p>
    </div>
  );
}
