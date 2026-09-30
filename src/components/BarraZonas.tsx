import type { ZonaFC } from "../types/models";

const ZONAS: ZonaFC[] = ["Z1", "Z2", "Z3", "Z4", "Z5"];

/** Solo se muestran "bajo Z1" y "sin dato" si pasan de esto (P92). */
const MIN_VISIBLE = 1;

/**
 * Barra de minutos por zona (P92). Chica, en línea.
 *
 * "Bajo Z1" y "sin dato" van **aparte y distintos**: uno es "estuviste
 * tranquilo", el otro "no sabemos". Bajo Z1 es un tramo liso neutro; sin dato,
 * rayado. Cada uno solo si pasa de un minuto.
 */
export function BarraZonas({
  porZona, bajoZonas = 0, sinDato = 0, conLeyenda = true,
}: {
  porZona: Partial<Record<ZonaFC, number>>;
  bajoZonas?: number;
  sinDato?: number;
  conLeyenda?: boolean;
}) {
  const bajo = bajoZonas > MIN_VISIBLE ? bajoZonas : 0;
  const hueco = sinDato > MIN_VISIBLE ? sinDato : 0;
  const total = ZONAS.reduce((a, z) => a + (porZona[z] ?? 0), 0) + bajo + hueco;
  if (total <= 0) return null;

  const tramos: { clave: string; min: number; fondo: string; etiqueta: string; color: string }[] = [
    ...(bajo ? [{ clave: "bajo", min: bajo, fondo: "var(--border)", etiqueta: "bajo Z1", color: "var(--muted)" }] : []),
    ...ZONAS.filter((z) => (porZona[z] ?? 0) > 0).map((z) => ({
      clave: z, min: porZona[z]!, fondo: `var(--zona-${z.toLowerCase()})`, etiqueta: z, color: `var(--zona-${z.toLowerCase()})`,
    })),
    ...(hueco ? [{
      clave: "sin", min: hueco,
      fondo: "repeating-linear-gradient(45deg, var(--border) 0 3px, transparent 3px 6px)",
      etiqueta: "sin dato", color: "var(--muted)",
    }] : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div
        role="img"
        aria-label={tramos.map((t) => `${t.etiqueta} ${t.min} min`).join(", ")}
        style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", gap: 1 }}
      >
        {tramos.map((t) => (
          <div key={t.clave} style={{ width: `${(t.min / total) * 100}%`, minWidth: 3, background: t.fondo }} />
        ))}
      </div>
      {conLeyenda && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 8px" }}>
          {tramos.map((t) => (
            <span key={t.clave} style={{ fontSize: 10, color: t.color, fontWeight: 600 }}>
              {t.etiqueta} · {Math.round(t.min)} min
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
