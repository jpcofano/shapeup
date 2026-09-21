import { Flame, Trophy } from "lucide-react";
import type { SemanaAdherencia } from "../lib/adherencia";

interface Props {
  /** La semana en curso. `null` si todavía no hay ninguna sesión registrada. */
  semana: SemanaAdherencia | null;
  /** Meta de días por semana. `null` = sin programa activo. */
  meta: number | null;
  racha: number;
  record: number;
  tasa: { cumplidas: number; total: number } | null;
  /** Días con actividad esta semana, para el caso sin meta. */
  diasActivos: number;
  onElegirPlan: () => void;
}

/**
 * La adherencia de la semana, en tres líneas de jerarquía decreciente (P77a).
 *
 * Reemplaza al `N/7` de la tira, que contaba sesiones y no días y no decía
 * nada de cómo venías. Los números salen de `lib/adherencia`, que los deriva
 * del historial cada vez — **no hay contador guardado** (ADR #037).
 */
export function AdherenciaCard({
  semana, meta, racha, record, tasa, diasActivos, onElegirPlan,
}: Props) {
  // ── Sin programa activo: no hay meta, y un 0 sería mentir ────────────────
  if (meta == null) {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <p className="section-title" style={{ margin: 0 }}>Tu semana</p>
        <p style={{ margin: 0, fontSize: 15 }}>
          {diasActivos > 0
            ? <><strong style={{ fontSize: 22, fontWeight: 800 }}>{diasActivos}</strong>
                {" "}{diasActivos === 1 ? "día activo" : "días activos"}</>
            : <span style={{ color: "var(--muted)" }}>Todavía no te moviste esta semana.</span>}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          Sin un plan activo no hay meta que medir.{" "}
          <button
            onClick={onElegirPlan}
            style={{
              background: "none", border: "none", padding: 0, cursor: "pointer",
              color: "var(--accent)", font: "inherit", fontWeight: 600,
            }}
          >
            Elegí un plan
          </button>
        </p>
      </div>
    );
  }

  const hechos = semana?.diasPlan ?? 0;
  // `null` = no se cargaron las actividades de la semana. No se dibuja el
  // sufijo: ni guion, ni cero, ni "sin datos" (P77b).
  const movimiento = semana?.diasMovimiento ?? null;

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p className="section-title" style={{ margin: 0 }}>Tu semana</p>

      {/* ── Línea 1: la semana en curso contra la meta ───────────────────── */}
      <p style={{ margin: 0, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>
          {hechos} de {meta}
        </span>
        <span style={{ fontSize: 14, color: "var(--muted)" }}>días</span>
        {/* Sufijo de menor jerarquía: el movimiento acompaña, nunca suma (P76b). */}
        {movimiento != null && movimiento > 0 && (
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            · {movimiento} {movimiento === 1 ? "día de movimiento" : "días de movimiento"}
          </span>
        )}
      </p>

      {/* ── Línea 2: racha y récord. Nunca "0 semanas" ───────────────────── */}
      <p style={{ margin: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
        {racha > 0 ? (
          <>
            <Flame size={14} fill="var(--accent)" strokeWidth={0} style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 700 }}>
              Racha: {racha} {racha === 1 ? "semana" : "semanas"}
            </span>
            {record > racha && (
              <span style={{ color: "var(--muted)" }}>· récord {record}</span>
            )}
          </>
        ) : record > 0 ? (
          // Racha cortada: se muestra el récord y se arranca de nuevo. Un cero
          // grande desalienta y no informa nada que el usuario no sepa.
          <>
            <Trophy size={14} color="var(--muted)" strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span style={{ color: "var(--muted)" }}>
              Récord: {record} {record === 1 ? "semana" : "semanas"}
            </span>
          </>
        ) : (
          <span style={{ color: "var(--muted)" }}>Tu primera semana completa arranca la racha.</span>
        )}
      </p>

      {/* ── Línea 3: la tasa. Ausente si no hay historia suficiente ──────── */}
      {tasa && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
          Últimas {tasa.total} semanas: {tasa.cumplidas} de {tasa.total}
        </p>
      )}
    </div>
  );
}
