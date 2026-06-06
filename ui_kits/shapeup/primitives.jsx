/* ShapeUp UI Kit — primitivos reutilizables. */

/* Icono lucide. Inyecta el SVG en cada cambio de props. fill="currentColor" lo rellena. */
function Icon({ name, size = 22, stroke = 1.8, color, fill, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = `<i data-lucide="${name}"></i>`;
    window.lucide.createIcons({ attrs: { "stroke-width": stroke } });
    if (fill) { const svg = el.querySelector("svg"); if (svg) svg.setAttribute("fill", fill); }
  }, [name, stroke, fill]);
  return <span className="ic" ref={ref} style={{ width: size, height: size, color, ...style }} />;
}

/* Avatar de miembro */
function Avatar({ id, size = 28, withName = false }) {
  const m = MEMBERS[id];
  if (!m) return null;
  const circle = (
    <span style={{
      width: size, height: size, borderRadius: "50%", background: m.color, color: "#fff",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: size <= 24 ? 10 : size <= 36 ? 13 : 18, fontWeight: 700, flexShrink: 0, userSelect: "none",
    }}>{m.iniciales}</span>
  );
  if (!withName) return circle;
  return <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>{circle}
    <span style={{ fontSize: 14, fontWeight: 600 }}>{m.nombre}</span></span>;
}

function AvatarStack({ ids, size = 28, onClick }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", cursor: onClick ? "pointer" : "default" }} onClick={onClick}>
      {ids.map((id, i) => (
        <span key={id} style={{ marginLeft: i === 0 ? 0 : -8, border: "2px solid var(--card)", borderRadius: "50%", display: "inline-flex" }}>
          <Avatar id={id} size={size} />
        </span>
      ))}
    </span>
  );
}

function Badge({ kind = "muted", children }) {
  return <span className={`badge badge-${kind}`}>{children}</span>;
}

/* Tira semanal */
function WeekStrip({ marcados = [], hoyIdx = 2 }) {
  const letras = ["L", "M", "M", "J", "V", "S", "D"];
  const fechas = [10, 11, 12, 13, 14, 15, 16];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
      {letras.map((l, i) => {
        const today = i === hoyIdx, ses = marcados.includes(i);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 0", borderRadius: 10, background: today ? "var(--accent-dim)" : "transparent" }}>
            <span style={{ fontSize: 10, fontWeight: 500, textTransform: "uppercase", letterSpacing: ".05em", color: today ? "var(--accent)" : "var(--muted)" }}>{l}</span>
            <span style={{ fontSize: 15, fontWeight: today ? 700 : 500, color: today ? "var(--accent)" : "var(--fg)" }}>{fechas[i]}</span>
            <span style={{ height: 16, display: "flex", alignItems: "center" }}>
              {ses
                ? <Icon name="biceps-flexed" size={15} fill="currentColor" stroke={1.6} color="var(--accent)" style={{ opacity: today ? 1 : 0.5 }} />
                : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProgressDots({ total, hechas }) {
  return (
    <div className="progress-dots">
      {Array.from({ length: total }, (_, i) => {
        const done = i < hechas, active = i === hechas;
        return <span key={i} className={`dot${done ? " done" : ""}${active ? " active" : ""}`} />;
      })}
    </div>
  );
}

/* Mini gráfico de barras (peso / tonelaje) */
function MiniChart({ data, color = "var(--accent)" }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value));
  const min = Math.min(...data.map((d) => d.value));
  const range = max - min || 1;
  const W = 280, H = 56, barW = Math.floor(W / data.length) - 3;
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} style={{ display: "block" }}>
      {data.map((d, i) => {
        const bh = Math.max(3, Math.round(((d.value - min) / range) * (H - 8)) + 8);
        const x = i * (barW + 3);
        return (
          <g key={i}>
            <rect x={x} y={H - bh} width={barW} height={bh} fill={color} opacity={0.75} rx={2} />
            <text x={x + barW / 2} y={H + 12} textAnchor="middle" fontSize={8} fill="var(--muted)">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

Object.assign(window, { Icon, Avatar, AvatarStack, Badge, WeekStrip, ProgressDots, MiniChart });
