import { useId, useState } from "react";
import type { PuntoTendencia, RangoTendencia } from "../lib/tendencias";

interface TrendChartProps {
  puntos: PuntoTendencia[];
  unidad: string;
  rango: RangoTendencia;
  /** Línea(s) punteada(s) de referencia (p.ej. 120/80 para presión). */
  lineaRef?: number | number[];
  alto?: number;
  color?: string;
  /** Segunda serie superpuesta (p.ej. diastólica) — solo línea, sin banda min-máx. */
  puntosSecundarios?: PuntoTendencia[];
  colorSecundario?: string;
}

const W = 320;

/** Gap (en días) a partir del cual se corta la línea — según la cadencia esperada del bucketing. */
const GAP_CORTE_DIAS: Record<RangoTendencia, number> = {
  "3m": 3, "1a": 14, "5a": 45, "todo": 45,
};

function diasEntre(a: string, b: string): number {
  return (new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86_400_000;
}

function formatFechaEje(fecha: string, rango: RangoTendencia): string {
  const [y, m, d] = fecha.split("-");
  if (rango === "5a" || rango === "todo") return y;
  if (rango === "1a") return `${m}/${y.slice(2)}`;
  return `${d}/${m}`;
}

function formatFechaCompleta(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

/** Índices de puntos consecutivos agrupados en "segmentos" — un gap mayor al esperado corta el segmento. */
function segmentos(puntos: PuntoTendencia[], rango: RangoTendencia): PuntoTendencia[][] {
  if (puntos.length === 0) return [];
  const tope = GAP_CORTE_DIAS[rango];
  const out: PuntoTendencia[][] = [[puntos[0]]];
  for (let i = 1; i < puntos.length; i++) {
    const prev = puntos[i - 1];
    const actual = puntos[i];
    if (diasEntre(prev.fecha, actual.fecha) > tope) out.push([]);
    out[out.length - 1].push(actual);
  }
  return out.filter((s) => s.length > 0);
}

function ticksEje(min: number, max: number, n: number): number[] {
  if (max === min) return [min];
  const paso = (max - min) / (n - 1);
  return Array.from({ length: n }, (_, i) => min + paso * i);
}

/**
 * Gráfico SVG de tendencia larga: línea de mediana + banda min-máx, línea(s)
 * de referencia punteada, hasta dos series (para presión sistólica/diastólica),
 * ejes con marcas. Un tap muestra el valor del punto más cercano en un texto
 * fijo arriba — sin tooltips flotantes (mobile).
 */
export function TrendChart({
  puntos, unidad, rango, lineaRef, alto = 160, color = "var(--accent)",
  puntosSecundarios, colorSecundario = "var(--info)",
}: TrendChartProps) {
  const id = useId();
  const [seleccionado, setSeleccionado] = useState<{ fecha: string; valor: number } | null>(null);

  if (puntos.length === 0) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Sin datos suficientes para graficar.</p>;
  }
  if (puntos.length < 3) {
    return <p style={{ color: "var(--muted)", fontSize: 13 }}>Pocos datos en este rango — probá 1A o Todo.</p>;
  }

  const H = alto;
  const PAD_X = 8;
  const EJE_Y_W = 34;
  const EJE_X_H = 18;
  const plotW = W - EJE_Y_W - PAD_X;
  const plotH = H - EJE_X_H;

  const todosLosPuntos = [...puntos, ...(puntosSecundarios ?? [])];
  const fechas = todosLosPuntos.map((p) => p.fecha).sort();
  const fechaMinMs = new Date(fechas[0] + "T00:00:00").getTime();
  const fechaMaxMs = new Date(fechas[fechas.length - 1] + "T00:00:00").getTime();
  const rangoMs = Math.max(fechaMaxMs - fechaMinMs, 1);

  const valores = todosLosPuntos.flatMap((p) => [p.valor, p.min ?? p.valor, p.max ?? p.valor]);
  const refs = Array.isArray(lineaRef) ? lineaRef : lineaRef != null ? [lineaRef] : [];
  const valorMin = Math.min(...valores, ...refs);
  const valorMax = Math.max(...valores, ...refs);
  const margenY = (valorMax - valorMin) * 0.1 || 1;
  const yMin = valorMin - margenY;
  const yMax = valorMax + margenY;

  const x = (fecha: string) => EJE_Y_W + ((new Date(fecha + "T00:00:00").getTime() - fechaMinMs) / rangoMs) * plotW;
  const y = (v: number) => plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  const lineaDe = (pts: PuntoTendencia[]) =>
    pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.fecha).toFixed(1)},${y(p.valor).toFixed(1)}`).join(" ");

  const bandaDe = (pts: PuntoTendencia[]) => {
    const conBanda = pts.filter((p) => p.min != null && p.max != null);
    if (conBanda.length < 2) return null;
    const arriba = conBanda.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.fecha).toFixed(1)},${y(p.max!).toFixed(1)}`).join(" ");
    const abajo = [...conBanda].reverse().map((p) => `L${x(p.fecha).toFixed(1)},${y(p.min!).toFixed(1)}`).join(" ");
    return `${arriba} ${abajo} Z`;
  };

  const segmentosPrimarios = segmentos(puntos, rango);
  const segmentosSecundarios = puntosSecundarios ? segmentos(puntosSecundarios, rango) : [];

  const ticksY = ticksEje(yMin, yMax, 3);
  // Con rangos chicos, redondear a entero duplica etiquetas (90, 90, 89) — un
  // decimal alcanza para separarlas sin agregar ruido en rangos grandes.
  const decimalesY = yMax - yMin < 5 ? 1 : 0;
  const nTicksX = rango === "3m" ? 4 : 6;
  const pasoTickX = Math.max(1, Math.floor(puntos.length / (nTicksX - 1)));
  // Sin etiquetas consecutivas repetidas (p.ej. dos ticks del mismo año en "todo").
  const ticksX = puntos
    .filter((_, i) => i % pasoTickX === 0)
    .filter((p, i, arr) => i === 0 || formatFechaEje(p.fecha, rango) !== formatFechaEje(arr[i - 1].fecha, rango));

  function alTocar(evt: React.PointerEvent<SVGSVGElement>) {
    const svg = evt.currentTarget;
    const rect = svg.getBoundingClientRect();
    const xClic = ((evt.clientX - rect.left) / rect.width) * W;
    let mejor: PuntoTendencia | null = null;
    let mejorDist = Infinity;
    for (const p of puntos) {
      const dist = Math.abs(x(p.fecha) - xClic);
      if (dist < mejorDist) { mejorDist = dist; mejor = p; }
    }
    if (mejor) setSeleccionado({ fecha: mejor.fecha, valor: mejor.valor });
  }

  return (
    <div>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--muted)", minHeight: 16 }}>
        {seleccionado
          ? `${formatFechaCompleta(seleccionado.fecha)}: ${seleccionado.valor.toFixed(1)} ${unidad}`
          : "Tocá el gráfico para ver un punto"}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: "block", width: "100%", height: H, touchAction: "pan-y" }}
        onPointerDown={alTocar}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.20" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Eje Y: 3 marcas */}
        {ticksY.map((t, i) => (
          <g key={i}>
            <line x1={EJE_Y_W} y1={y(t)} x2={W} y2={y(t)} stroke="var(--border)" strokeWidth="1" />
            <text x={0} y={y(t) + 3} style={{ fontSize: 9, fill: "var(--muted)" }}>{t.toFixed(decimalesY)}</text>
          </g>
        ))}

        {/* Línea(s) de referencia */}
        {refs.map((r, i) => (
          <line
            key={i} x1={EJE_Y_W} y1={y(r)} x2={W} y2={y(r)}
            stroke="var(--muted)" strokeWidth="1" strokeDasharray="4,3"
          />
        ))}

        {/* Banda min-máx + línea de la serie primaria, por segmento (no atraviesa huecos) */}
        {segmentosPrimarios.map((seg, i) => (
          <g key={`p-${i}`}>
            {bandaDe(seg) && <path d={bandaDe(seg)!} fill={`url(#${id})`} stroke="none" />}
            <path d={lineaDe(seg)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}

        {/* Serie secundaria (p.ej. diastólica): solo línea */}
        {segmentosSecundarios.map((seg, i) => (
          <path
            key={`s-${i}`} d={lineaDe(seg)} fill="none"
            stroke={colorSecundario} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round"
          />
        ))}

        {/* Punto final de la serie primaria */}
        {(() => {
          const ultimo = puntos[puntos.length - 1];
          return <ellipse cx={x(ultimo.fecha)} cy={y(ultimo.valor)} rx="3" ry="3" fill={color} />;
        })()}

        {/* Eje X: marcas de fecha */}
        {ticksX.map((p, i) => (
          <text
            key={i} x={x(p.fecha)} y={H - 2} textAnchor="middle"
            style={{ fontSize: 9, fill: "var(--muted)" }}
          >
            {formatFechaEje(p.fecha, rango)}
          </text>
        ))}
      </svg>
    </div>
  );
}
