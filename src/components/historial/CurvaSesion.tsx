import { useState } from "react";
import type { CurvaGuardada, MarcaAnalisis, MarcaSesion, ZonaFC } from "../../types/models";
import { geometriaCurva, marcasDibujables, type MarcaDibujable } from "../../lib/curvaSesion";
import { textoMarca } from "../../lib/marcasSesion";

interface Props {
  curva: CurvaGuardada;
  /** Inicio y duración de la ventana del análisis: la escala de los tramos de las marcas. */
  ventanaInicioMs: number;
  duracionS: number;
  /** Las zonas con que se calculó la sesión (`zonasUsadas`). */
  zonas?: Partial<Record<ZonaFC, { min: number; max: number }>>;
  marcasApp: MarcaSesion[];
  marcasAnalisis?: MarcaAnalisis[];
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * La curva de FC de la sesión (P99 Parte 4, P103), en SVG a mano: las bandas de
 * zona con las zonas de la sesión, la curva guardada a 30 s y encima las marcas
 * que tienen momento o tramo. Las de la app van sólidas; las del análisis, con
 * borde punteado. Tocar una muestra su texto.
 *
 * Sin curva guardada no se monta: lo decide quien la usa.
 */
export function CurvaSesion({ curva, ventanaInicioMs, duracionS, zonas, marcasApp, marcasAnalisis }: Props) {
  const [elegida, setElegida] = useState<number | null>(null);
  const g = geometriaCurva({ curva, ventanaInicioMs, duracionS, zonas });
  if (!g) return null;
  const marcas = marcasDibujables(marcasApp, marcasAnalisis, textoMarca, g.duracionS);
  const sel = elegida != null ? marcas[elegida] : null;
  // Las del análisis que apuntan a una marca de la app (refMarca) se dibujan
  // encima pero no toman el toque: tocar la de la app muestra su texto y, abajo,
  // lo que dijo el análisis sobre ella.
  const tocable = (m: MarcaDibujable) => !(m.origen === "analisis" && m.idMarca);
  const comentarios = sel && sel.origen === "app" && sel.idMarca
    ? marcas.filter((m) => m.origen === "analisis" && m.idMarca === sel.idMarca)
    : [];

  const color = (m: MarcaDibujable) =>
    m.origen === "analisis" ? (m.tono === "atencion" ? "var(--warning)" : "var(--accent)") : "var(--fg)";

  return (
    <div data-testid="curva-sesion" style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${g.ancho} ${g.alto}`}
        style={{ display: "block", width: "100%", height: "auto", maxWidth: "100%" }}
        role="img"
        aria-label="Curva de frecuencia cardíaca de la sesión"
      >
        {g.bandas.map((b) => (
          <rect key={b.zona} x={0} y={b.y} width={g.ancho} height={b.alto}
            fill={`var(--zona-${b.zona.toLowerCase()}-dim)`} />
        ))}
        {marcas.map((m, i) => m.tipo === "tramo" && (
          <rect
            key={`t${i}`}
            data-marca={m.origen} data-ref={m.idMarca ?? ""}
            data-inicio={m.inicioS} data-fin={m.finS}
            x={g.x(m.inicioS)} y={0} width={Math.max(1, g.x(m.finS) - g.x(m.inicioS))} height={g.alto}
            fill={m.origen === "app" ? "var(--accent-dim)" : "transparent"}
            stroke={color(m)} strokeWidth={m.origen === "app" ? 0 : 1.2}
            strokeDasharray={m.origen === "analisis" ? "4 3" : undefined}
            style={{ cursor: "pointer", pointerEvents: tocable(m) ? undefined : "none" }}
            onClick={() => setElegida(elegida === i ? null : i)}
          />
        ))}
        {g.segmentos.map((d, i) => (
          <path key={`s${i}`} d={d} fill="none" stroke="var(--accent)" strokeWidth={1.6}
            strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {marcas.map((m, i) => m.tipo === "momento" && (
          <g key={`m${i}`} style={{ cursor: "pointer", pointerEvents: tocable(m) ? undefined : "none" }}
            onClick={() => setElegida(elegida === i ? null : i)}
            data-marca={m.origen} data-ref={m.idMarca ?? ""} data-inicio={m.inicioS} data-fin={m.finS}>
            {/* El área de toque, más ancha que la línea. */}
            <rect x={g.x(m.inicioS) - 8} y={0} width={16} height={g.alto} fill="transparent" />
            <line x1={g.x(m.inicioS)} x2={g.x(m.inicioS)} y1={0} y2={g.alto}
              stroke={color(m)} strokeWidth={1.2}
              strokeDasharray={m.origen === "analisis" ? "4 3" : undefined} />
          </g>
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
        <span>0:00</span><span>{mmss(g.duracionS)}</span>
      </div>
      {sel ? (
        <p data-testid="curva-texto" style={{ margin: 0, fontSize: 12, lineHeight: 1.4 }}>
          {sel.origen === "analisis" && (
            <span className="badge badge-muted" style={{ marginRight: 6, borderStyle: "dashed", borderWidth: 1 }}>análisis</span>
          )}
          {sel.texto}
          <span style={{ color: "var(--muted)" }}>
            {" "}· {sel.tipo === "momento" ? mmss(sel.inicioS) : `${mmss(sel.inicioS)}–${mmss(sel.finS)}`}
          </span>
          {comentarios.map((c, j) => (
            <span key={j} data-testid="curva-comentario" style={{ display: "block", marginTop: 4 }}>
              <span className="badge badge-muted" style={{ marginRight: 6, borderStyle: "dashed", borderWidth: 1 }}>análisis</span>
              {c.texto}
            </span>
          ))}
        </p>
      ) : marcas.length > 0 ? (
        <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>Tocá una marca para ver qué es.</p>
      ) : null}
    </div>
  );
}
