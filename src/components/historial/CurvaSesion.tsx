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

/** El ancho del dibujo; a la derecha quedan 30 para las ppm de las guías. */
const ANCHO = 342;
const ALTO = 146;
const MARGEN_DER = 30;
const ALTO_EJE = 22;

/**
 * El texto del chip. Los de la app: el de la marca, con la hora si es un momento
 * («Pico 169 (crudo 170) · 37:49»). Los del análisis: solo cuándo («17:00–34:55»);
 * su comentario aparece al tocarlo, como antes.
 */
function textoChip(m: MarcaDibujable): string {
  if (m.origen === "analisis") return m.tipo === "momento" ? mmss(m.inicioS) : `${mmss(m.inicioS)}–${mmss(m.finS)}`;
  return m.tipo === "momento" ? `${m.texto} · ${mmss(m.inicioS)}` : m.texto;
}

/**
 * La curva de FC de la sesión (P99, P103; rediseño P109, ADR #044 y #047 sin
 * cambios de lógica):
 * - la línea se pinta por zona, con las zonas de la sesión, sin bandas; por
 *   debajo de Z1, en `--muted`;
 * - líneas guía punteadas en los pisos, con las ppm a la derecha, y un eje de
 *   tiempo con marcas redondas;
 * - el pico es un punto con borde;
 * - **las marcas salen de la curva** y son chips debajo: los de la app,
 *   sólidos; los del análisis, con borde punteado y «análisis». Tocar un chip
 *   resalta su tramo con una franja tenue y muestra su texto.
 *
 * Sin curva guardada no se monta: lo decide quien la usa.
 */
export function CurvaSesion({ curva, ventanaInicioMs, duracionS, zonas, marcasApp, marcasAnalisis }: Props) {
  const [elegida, setElegida] = useState<number | null>(null);
  const g = geometriaCurva({ curva, ventanaInicioMs, duracionS, zonas, ancho: ANCHO, alto: ALTO });
  if (!g) return null;
  const marcas = marcasDibujables(marcasApp, marcasAnalisis, textoMarca, g.duracionS);
  // Las del análisis que apuntan a una marca de la app (refMarca) no son un chip
  // aparte: van como comentario de ese chip, como antes (si no, se veían dos veces).
  const chips = marcas.map((m, i) => ({ m, i })).filter(({ m }) => !(m.origen === "analisis" && m.idMarca));
  const conComentario = new Set(marcas.filter((m) => m.origen === "analisis" && m.idMarca).map((m) => m.idMarca));
  // Sesiones anteriores a P97, sin zonas guardadas: la línea va en el acento, como antes.
  const sinZonas = !zonas || Object.keys(zonas).length === 0;
  const sel = elegida != null ? marcas[elegida] : null;
  // Tocar una marca de la app muestra, abajo, lo que dijo el análisis sobre ella.
  const comentarios = sel && sel.origen === "app" && sel.idMarca
    ? marcas.filter((m) => m.origen === "analisis" && m.idMarca === sel.idMarca)
    : [];
  const pico = marcasApp.find((m) => (m.id === "pico" || m.id === "picoSobreVigente") && m.tramo);
  const puntoPico = pico?.tramo ? g.punto(pico.tramo.inicioS) : null;

  return (
    <div data-testid="curva-sesion" style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
      <svg
        viewBox={`0 0 ${g.ancho + MARGEN_DER} ${g.alto + ALTO_EJE}`}
        style={{ display: "block", width: "100%", height: "auto", maxWidth: "100%" }}
        role="img"
        aria-label="Curva de frecuencia cardíaca, pintada por zona"
      >
        {/* La franja de la marca elegida, detrás de todo. */}
        {sel && (
          <rect
            data-testid="curva-franja" data-inicio={sel.inicioS} data-fin={sel.finS}
            x={sel.tipo === "momento" ? g.x(sel.inicioS) - 2 : g.x(sel.inicioS)} y={0}
            width={sel.tipo === "momento" ? 4 : Math.max(2, g.x(sel.finS) - g.x(sel.inicioS))} height={g.alto}
            fill="var(--accent-dim)"
          />
        )}
        <g stroke="var(--border)" strokeWidth={1} strokeDasharray="2 4">
          {g.guias.map((gu) => <line key={gu.fc} x1={0} x2={g.ancho} y1={gu.y} y2={gu.y} />)}
        </g>
        <g fill="var(--muted)" fontSize={9.5}>
          {g.guias.map((gu) => <text key={gu.fc} x={g.ancho + 6} y={gu.y + 3}>{gu.fc}</text>)}
        </g>
        <g fill="none" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round">
          {g.tramos.map((t, i) => (
            <polyline key={i} data-zona={t.zona ?? "bajo"} points={t.puntos}
              stroke={t.zona ? `var(--zona-${t.zona.toLowerCase()})` : sinZonas ? "var(--accent)" : "var(--muted)"} />
          ))}
        </g>
        {puntoPico && (
          <circle data-testid="curva-pico" cx={puntoPico.x} cy={puntoPico.y} r={4}
            fill="var(--bg)" stroke="var(--fg)" strokeWidth={2} />
        )}
        <line x1={0} x2={g.ancho} y1={g.alto + 4} y2={g.alto + 4} stroke="var(--border)" strokeWidth={1} />
        <g fill="var(--muted)" fontSize={9.5}>
          {g.marcasTiempo.map((m, i) => (
            <text key={i} x={m.x} y={g.alto + 17}
              textAnchor={i === 0 ? "start" : i === g.marcasTiempo.length - 1 ? "end" : "middle"}>
              {m.texto}
            </text>
          ))}
        </g>
      </svg>

      {chips.length > 0 && (
        <div data-testid="curva-chips" className="chips-marcas">
          {chips.map(({ m, i }) => (
            <button
              key={i}
              type="button"
              className={`chip-marca${m.origen === "analisis" ? " analisis" : ""}${elegida === i ? " activo" : ""}`}
              data-marca={m.origen} data-ref={m.idMarca ?? ""} data-inicio={m.inicioS} data-fin={m.finS}
              aria-pressed={elegida === i}
              onClick={() => setElegida(elegida === i ? null : i)}
            >
              <span aria-hidden className={m.tipo === "momento" ? "chip-marca-punto" : "chip-marca-tramo"}
                style={m.origen === "analisis" && m.tono === "atencion" ? { background: "var(--warning)" } : undefined} />
              {m.origen === "analisis" && <span className="chip-marca-etiqueta">análisis</span>}
              {textoChip(m)}
              {m.origen === "app" && m.idMarca && conComentario.has(m.idMarca) && (
                <span data-con-analisis className="chip-marca-etiqueta">· análisis</span>
              )}
            </button>
          ))}
        </div>
      )}

      {!sel && chips.length > 0 && (
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Tocá una marca para ver qué es.</p>
      )}
      {sel && (
        <p data-testid="curva-texto" style={{ margin: 0, fontSize: 13, lineHeight: 1.45 }}>
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
      )}
    </div>
  );
}
