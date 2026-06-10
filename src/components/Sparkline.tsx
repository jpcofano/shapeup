import { useId } from "react";

interface SparklineProps {
  data:    number[];
  color?:  string;
  height?: number;
}

/**
 * Gráfico de área SVG: línea + relleno degradado + punto final.
 * Diseñado para sparklines de tendencia (peso, sueño, volumen).
 */
export function Sparkline({ data, color = "var(--accent)", height = 44 }: SparklineProps) {
  const id = useId();
  if (data.length < 2) return null;

  const W = 200;
  const H = height;
  const PAD = H * 0.1;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", width: "100%", height }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      {/* Punto final — vectorUnits userSpaceOnUse para que no se deforme con preserveAspectRatio */}
      <ellipse cx={last.x} cy={last.y} rx="3" ry="3" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
