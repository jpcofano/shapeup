export interface MiniChartPoint {
  label: string;
  value: number;
}

interface MiniChartProps {
  data: MiniChartPoint[];
  /** Color de las barras. Default: var(--accent) */
  color?: string;
  /** Altura del área de barras en px. Default: 60 */
  height?: number;
}

/**
 * Gráfico de barras simple en SVG para Salud e Historial.
 * Barras en `color` (--accent o --info según el contexto), etiquetas en --muted.
 */
export function MiniChart({ data, color = "var(--accent)", height = 60 }: MiniChartProps) {
  if (data.length === 0) return null;

  const BAR_W = 24;
  const GAP   = 6;
  const LBL_H = 14;
  const max   = Math.max(...data.map((d) => d.value), 1);
  const totalW = data.length * (BAR_W + GAP) - GAP;
  const svgH   = height + LBL_H + 4;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg
        width={totalW}
        height={svgH}
        viewBox={`0 0 ${totalW} ${svgH}`}
        style={{ display: "block", minWidth: "100%" }}
      >
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.value / max) * height));
          const x    = i * (BAR_W + GAP);
          const y    = height - barH;
          return (
            <g key={i}>
              <rect x={x} y={y} width={BAR_W} height={barH} rx={4} fill={color} opacity={0.82} />
              <text
                x={x + BAR_W / 2}
                y={svgH - 1}
                textAnchor="middle"
                style={{ fontSize: 9, fill: "var(--muted)", fontFamily: "inherit" }}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
