/* ShapeUp UI Kit — Salud (tabs + import preview) + Historial + Perfil */

function Historial({ go }) {
  const fmt = (s) => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Historial</h1></div>
      {HISTORIAL.map((h) => (
        <div key={h.id} className="rutina-card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }} onClick={() => go("historialDetalle", { id: h.id })}>
          <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--accent-dim)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="biceps-flexed" size={20} fill="currentColor" stroke={1.6} color="var(--accent)" />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="rutina-card-title" style={{ marginBottom: 6 }}>{h.nombreRutina}</p>
            <div className="rutina-card-meta">
              <span>{fmt(h.fecha)}</span>
              <span>⏱ {h.duracionMin} min</span>
              <span>· {h.series} series</span>
              {h.tonelajeKg > 0 && <span>· {h.tonelajeKg.toLocaleString()} kg</span>}
              <Badge kind="muted">RPE {h.rpe}</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistorialDetalle({ id, go }) {
  const h = HISTORIAL.find((x) => x.id === id) || HISTORIAL[0];
  const fmt = (s) => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
  return (
    <div className="page">
      <button className="back-btn" onClick={() => go("historial")}><Icon name="chevron-left" size={16} /> Historial</button>
      <div className="page-header"><h1 className="page-title" style={{ fontSize: 22 }}>{h.nombreRutina}</h1></div>
      <p style={{ margin: "-8px 0 0", color: "var(--muted)", fontSize: 13 }}>{fmt(h.fecha)}</p>
      <div className="card">
        <div className="stats-row">
          <div className="stat"><span className="stat-value">{h.duracionMin}</span><span className="stat-label">minutos</span></div>
          <div className="stat"><span className="stat-value">{h.series}</span><span className="stat-label">series</span></div>
          <div className="stat"><span className="stat-value">{h.tonelajeKg.toLocaleString()}</span><span className="stat-label">kg tonelaje</span></div>
          <div className="stat"><span className="stat-value">{h.rpe}</span><span className="stat-label">RPE</span></div>
        </div>
      </div>
      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Series registradas</p>
        {[["Press de banca", "4 × 10 · 22.5 kg"], ["Remo a una mano", "4 × 12 · 20 kg"], ["Plancha frontal", "3 × 45s"]].map(([n, d], i) => (
          <div key={i} className="bloque-row">
            <span className="bloque-num">{i + 1}</span>
            <div style={{ flex: 1 }}><p className="bloque-nombre">{n}</p><p className="bloque-prescripcion">{d}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return <div className="stat"><span className="stat-value">{value}</span><span className="stat-label">{label}</span></div>;
}

function Salud() {
  const [tab, setTab] = React.useState("composicion");
  const [preview, setPreview] = React.useState(false);
  const [msg, setMsg] = React.useState(null);
  const S = SALUD;
  const TABS = [["composicion", "Composición"], ["cardio", "Cardio"], ["sueno", "Sueño"], ["progreso", "Progreso"]];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Salud</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-icon-sm" title="Importar CSV" onClick={() => setPreview(true)}><Icon name="upload" size={18} /></button>
          <button className="btn-icon-sm" title="Carga manual"><Icon name="plus" size={18} /></button>
        </div>
      </div>

      <div className="tabs" style={{ marginTop: -4 }}>
        {TABS.map(([k, l]) => <button key={k} className={`tab${tab === k ? " active" : ""}`} onClick={() => setTab(k)}>{l}</button>)}
      </div>

      {msg && <div style={{ padding: "10px 14px", borderRadius: "var(--r-sm)", background: "var(--accent-dim)", color: "var(--accent)", fontSize: 13 }}>{msg}</div>}

      {tab === "composicion" && (
        <React.Fragment>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 10 }}>Último — {S.mediciones[0].fecha}</p>
            <div className="stats-row" style={{ gap: 16 }}>
              <Stat value={`${S.mediciones[0].pesoKg} kg`} label="peso" />
              <Stat value={`${S.mediciones[0].grasaPct}%`} label="grasa" />
              <Stat value={`${S.mediciones[0].masaMuscularKg} kg`} label="músculo" />
              <Stat value={S.mediciones[0].imc} label="IMC" />
            </div>
          </div>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 10 }}>Tendencia de peso</p>
            <MiniChart data={[...S.mediciones].reverse().map((m) => ({ label: m.fecha.slice(5), value: m.pesoKg }))} color="var(--accent)" />
          </div>
        </React.Fragment>
      )}

      {tab === "cardio" && (
        <div className="card">
          <p className="section-title" style={{ marginBottom: 10 }}>Sesiones ({S.cardio.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {S.cardio.map((c, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: 14 }}>{c.actividad}</strong>
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>{c.fecha}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{c.duracionMin} min · {c.kcal} kcal · FC ~{c.fcPromedio}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: ZONA_DIM[c.zona], color: ZONA_COLOR[c.zona] }}>{c.zona}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "sueno" && (
        <React.Fragment>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 10 }}>Última semana</p>
            <div className="stats-row">
              <Stat value={`${(S.sueno.reduce((a, s) => a + s.horas, 0) / S.sueno.length).toFixed(1)} h`} label="promedio" />
              <Stat value={`${S.sueno[0].horas} h`} label="última noche" />
            </div>
          </div>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 10 }}>Historial</p>
            {S.sueno.map((s, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0" }}>
                <span style={{ color: "var(--muted)" }}>{s.fecha}</span><span>{s.horas} h · acostó {s.acostarse}</span>
              </div>
            ))}
          </div>
        </React.Fragment>
      )}

      {tab === "progreso" && (
        <React.Fragment>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 10 }}>Tonelaje de entrenamiento</p>
            <MiniChart data={[...HISTORIAL].reverse().filter((h) => h.tonelajeKg > 0).map((h) => ({ label: h.fecha.slice(5), value: h.tonelajeKg }))} color="var(--info)" />
          </div>
          <div className="card">
            <p className="section-title" style={{ marginBottom: 10 }}>Composición vs anterior</p>
            <div className="stats-row" style={{ gap: 24 }}>
              <div><p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{S.mediciones[0].pesoKg} kg</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--accent)" }}>−0.6 kg vs anterior</p></div>
              <div><p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{S.mediciones[0].grasaPct}%</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--accent)" }}>−0.5% vs anterior</p></div>
            </div>
          </div>
        </React.Fragment>
      )}

      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><span>Previsualización — weight_2026.csv</span>
              <button className="modal-close" onClick={() => setPreview(false)}><Icon name="x" size={16} /></button></div>
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 8px" }}>Tipo: <strong style={{ color: "var(--fg)" }}>weight</strong> · 5 registros</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead><tr>{["Fecha", "Peso", "Grasa", "IMC"].map((c) => <th key={c} style={{ padding: "4px 8px", textAlign: "left", color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>{c}</th>)}</tr></thead>
                <tbody>{S.mediciones.map((m, i) => (
                  <tr key={i}>{[m.fecha, `${m.pesoKg} kg`, `${m.grasaPct}%`, m.imc].map((v, j) => <td key={j} style={{ padding: "4px 8px", borderBottom: "1px solid var(--border-dim)" }}>{v}</td>)}</tr>
                ))}</tbody>
              </table>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => { setPreview(false); setMsg("✅ 5 registros importados"); }}>Importar 5 registros</button>
                <button className="btn-secondary" style={{ width: "auto", padding: "12px 18px" }} onClick={() => setPreview(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Perfil({ memberId, theme, onTheme, onLogout }) {
  const m = MEMBERS[memberId];
  const THEMES = [
    { id: "ion", label: "Ion", color: "#22d3ee" },
    { id: "volt", label: "Volt", color: "#4ade80" },
    { id: "solar", label: "Solar", color: "#f5b62b" },
    { id: "blaze", label: "Blaze", color: "#ff7a45" },
    { id: "crimson", label: "Crimson", color: "#fb3b53" },
    { id: "pulse", label: "Pulse", color: "#ff4d79" },
    { id: "grape", label: "Grape", color: "#b15cff" },
    { id: "indigo", label: "Indigo", color: "#7c83ff" },
  ];
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Perfil</h1></div>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 16px" }}>
        <Avatar id={memberId} size={52} />
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{m.nombre}</p>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>{m.edad} años · FC máx {m.fcMax}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
            {m.objetivos.map((o) => <Badge key={o} kind="accent">{o}</Badge>)}
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <p className="section-title">Tema</p>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>solo para {m.nombre}</span>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {THEMES.map((t) => {
            const active = t.id === theme;
            return (
              <button key={t.id} onClick={() => onTheme(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <span style={{ width: 44, height: 44, borderRadius: "50%", background: t.color, boxShadow: active ? "0 0 0 3px var(--bg), 0 0 0 5px " + t.color : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {active && <Icon name="check" size={20} color="#0a0a0a" />}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? "var(--fg)" : "var(--muted)" }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <p className="section-title" style={{ marginBottom: 10 }}>Cambiar de miembro</p>
        <div style={{ display: "flex", gap: 10 }}>
          {Object.keys(MEMBERS).map((id) => (
            <button key={id} onClick={() => window.__setMember(id)} style={{ background: "none", border: id === memberId ? "2px solid var(--accent)" : "2px solid transparent", borderRadius: "50%", padding: 2, cursor: "pointer" }}>
              <Avatar id={id} size={40} />
            </button>
          ))}
        </div>
      </div>
      <button className="btn-secondary" style={{ marginTop: 8, maxWidth: 200 }} onClick={onLogout}>Cerrar sesión</button>
    </div>
  );
}

Object.assign(window, { Salud, Historial, HistorialDetalle, Perfil });
