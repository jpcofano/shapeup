/* ShapeUp UI Kit — Salud (tabs + import preview) + Historial + Perfil */

/* Store de historial compartido (lista ↔ detalle) para el demo del kit. */
const HistStore = {
  items: HISTORIAL.slice(),
  subs: new Set(),
  remove(id) { this.items = this.items.filter((x) => x.id !== id); this._emit(); },
  clear() { this.items = []; this._emit(); },
  _emit() { this.subs.forEach((f) => f()); },
};
function useHistStore() {
  const [, force] = React.useReducer((n) => n + 1, 0);
  React.useEffect(() => { HistStore.subs.add(force); return () => HistStore.subs.delete(force); }, []);
  return HistStore;
}

function Historial({ go }) {
  const fmt = (s) => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
  const [tab, setTab] = React.useState("sesiones");
  const store = useHistStore();
  const sesiones = store.items;
  const [editMode, setEditMode] = React.useState(false);
  const [confirmar, setConfirmar] = React.useState(null); // sesión | "all" | null
  const P = PROGRESO;
  const volUp = P.volumenSemanal[P.volumenSemanal.length - 1] - P.volumenSemanal[P.volumenSemanal.length - 2];
  const ejecutarBorrado = () => {
    if (confirmar === "all") store.clear(); else store.remove(confirmar.id);
    setConfirmar(null);
  };
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Historial</h1>
        {tab === "sesiones" && sesiones.length > 0 && (
          editMode
            ? <button className="btn-icon-sm" style={{ width: "auto", padding: "0 10px", fontSize: 13, fontWeight: 700, color: "var(--accent)" }} onClick={() => setEditMode(false)}>Listo</button>
            : <button className="btn-icon-sm" title="Editar historial" onClick={() => setEditMode(true)}><Icon name="trash-2" size={18} /></button>
        )}
      </div>
      <div className="tabs" style={{ marginTop: -4 }}>
        <button className={`tab${tab === "sesiones" ? " active" : ""}`} onClick={() => setTab("sesiones")}>Sesiones</button>
        <button className={`tab${tab === "progreso" ? " active" : ""}`} onClick={() => setTab("progreso")}>Progreso</button>
      </div>

      {tab === "progreso" ? (
        <React.Fragment>
          {/* Hero: volumen semanal */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="section-title">Volumen semanal</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: volUp >= 0 ? "var(--accent)" : "var(--danger)" }}>
                {volUp >= 0 ? "↑" : "↓"} {(Math.abs(volUp) / 1000).toFixed(1)}k vs sem. ant.
              </span>
            </div>
            <Sparkline data={P.volumenSemanal} />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>hace 5 sem</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>esta sem · {(P.volumenSemanal[4] / 1000).toFixed(1)}k kg</span>
            </div>
          </div>

          {/* Totales */}
          <div className="bento-row bento-row-2">
            <div className="bento-tile"><span className="t-label">Sesiones totales</span><span className="bento-value">{P.totalSesiones}</span></div>
            <div className="bento-tile"><span className="t-label">Horas entrenadas</span><span className="bento-value">{P.totalHoras} h</span></div>
          </div>

          {/* Records / PR */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="section-title">Records personales</span>
            {P.records.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="trophy" size={17} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{r.ejercicio}</p>
                  <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{fmt(r.fecha)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{r.valor}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>{r.nota}</div>
                </div>
              </div>
            ))}
          </div>
        </React.Fragment>
      ) : sesiones.length === 0 ? (
        <div className="empty-state" style={{ marginTop: 8 }}>
          <Icon name="history" size={28} />
          <p>No hay sesiones en tu historial.</p>
          <p style={{ fontSize: 12 }}>Las sesiones que registres aparecerán acá.</p>
        </div>
      ) : (
        <React.Fragment>
          {sesiones.map((h) => (
            <div key={h.id} className="rutina-card" style={{ display: "flex", gap: 12, alignItems: "flex-start" }} onClick={editMode ? undefined : () => go("historialDetalle", { id: h.id })}>
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
              {editMode && (
                <button className="btn-icon-sm" title="Borrar sesión" style={{ color: "var(--danger)", flexShrink: 0 }} onClick={(e) => { e.stopPropagation(); setConfirmar(h); }}>
                  <Icon name="trash-2" size={18} />
                </button>
              )}
            </div>
          ))}
          {editMode && (
            <button onClick={() => setConfirmar("all")} style={{ marginTop: 4, width: "100%", padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <Icon name="trash-2" size={16} /> Borrar todo el historial
            </button>
          )}
        </React.Fragment>
      )}

      {confirmar && (
        <div className="modal-backdrop" onClick={() => setConfirmar(null)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>{confirmar === "all" ? "Borrar todo el historial" : "Borrar sesión"}</span>
              <button className="modal-close" onClick={() => setConfirmar(null)}>✕</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>
                {confirmar === "all"
                  ? `Se borrarán tus ${sesiones.length} sesiones registradas. No se puede deshacer. Tus rutinas y ejercicios no se tocan.`
                  : <React.Fragment>Se borrará <strong style={{ color: "var(--fg)" }}>{confirmar.nombreRutina}</strong> del {fmt(confirmar.fecha)}. No se puede deshacer.</React.Fragment>}
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => setConfirmar(null)}>Cancelar</button>
                <button style={{ flex: 1, padding: 12, borderRadius: "var(--r-md)", border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }} onClick={ejecutarBorrado}>Borrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HistorialDetalle({ id, go }) {
  const store = useHistStore();
  const fmt = (s) => { const [y, m, d] = s.split("-"); return `${d}/${m}/${y}`; };
  const h = store.items.find((x) => x.id === id) || HISTORIAL.find((x) => x.id === id) || HISTORIAL[0];
  const [confirmar, setConfirmar] = React.useState(false);
  const borrar = () => { store.remove(h.id); go("historial"); };
  return (
    <div className="page">
      <button className="back-btn" onClick={() => go("historial")}><Icon name="chevron-left" size={16} /> Historial</button>
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="page-title" style={{ fontSize: 22 }}>{h.nombreRutina}</h1>
        <button className="btn-icon-sm" title="Borrar sesión" style={{ color: "var(--danger)" }} onClick={() => setConfirmar(true)}><Icon name="trash-2" size={18} /></button>
      </div>
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

      <button onClick={() => setConfirmar(true)} style={{ width: "100%", marginTop: 4, padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Icon name="trash-2" size={16} /> Borrar esta sesión
      </button>

      {confirmar && (
        <div className="modal-backdrop" onClick={() => setConfirmar(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Borrar sesión</span>
              <button className="modal-close" onClick={() => setConfirmar(false)}>✕</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>Se borrará <strong style={{ color: "var(--fg)" }}>{h.nombreRutina}</strong> del {fmt(h.fecha)}. No se puede deshacer.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => setConfirmar(false)}>Cancelar</button>
                <button style={{ flex: 1, padding: 12, borderRadius: "var(--r-md)", border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }} onClick={borrar}>Borrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
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

      {tab === "composicion" && (() => {
        const m0 = S.mediciones[0], m1 = S.mediciones[1];
        const delta = (a, b) => +(a - b).toFixed(1);
        const tiles = [
          { label: "Grasa", val: m0.grasaPct + "%", d: delta(m0.grasaPct, m1.grasaPct), good: "down" },
          { label: "Músculo", val: m0.masaMuscularKg + " kg", d: delta(m0.masaMuscularKg, m1.masaMuscularKg), good: "up" },
          { label: "IMC", val: m0.imc, d: delta(m0.imc, m1.imc), good: "down" },
        ];
        return (
          <React.Fragment>
            {/* Hero peso */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                <div>
                  <span className="t-label">Peso actual</span>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em" }}>{m0.pesoKg}</span>
                    <span style={{ fontSize: 15, color: "var(--muted)" }}>kg</span>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: delta(m0.pesoKg, m1.pesoKg) < 0 ? "var(--accent)" : "var(--danger)" }}>
                  {delta(m0.pesoKg, m1.pesoKg) > 0 ? "+" : ""}{delta(m0.pesoKg, m1.pesoKg)} kg
                </span>
              </div>
              <Sparkline data={[...S.mediciones].reverse().map((m) => m.pesoKg)} />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>hace 5 sem</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>hoy</span>
              </div>
            </div>
            {/* Tiles composición */}
            <div className="bento-row bento-row-3">
              {tiles.map((t) => {
                const mejora = (t.good === "down" && t.d < 0) || (t.good === "up" && t.d > 0);
                return (
                  <div key={t.label} className="bento-tile">
                    <span className="t-label">{t.label}</span>
                    <span className="bento-value">{t.val}</span>
                    {t.d !== 0 && <span className="bento-delta" style={{ color: mejora ? "var(--accent)" : "var(--danger)" }}>{t.d > 0 ? "+" : ""}{t.d}</span>}
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        );
      })()}

      {tab === "cardio" && (
        <React.Fragment>
          {/* Distribución de tiempo por zona */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="section-title">Tiempo por zona (semana)</span>
            <div style={{ display: "flex", height: 14, borderRadius: 999, overflow: "hidden", gap: 2 }}>
              {[["Z1", 10], ["Z2", 32], ["Z3", 38], ["Z4", 16], ["Z5", 4]].map(([z, pct]) => (
                <div key={z} style={{ width: pct + "%", background: ZONA_COLOR[z] }} title={`${z} · ${pct}%`} />
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[["Z1", "recup."], ["Z2", "suave"], ["Z3", "aeróbico"], ["Z4", "umbral"], ["Z5", "máx"]].map(([z, l]) => (
                <span key={z} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: ZONA_COLOR[z] }} /> {z} {l}
                </span>
              ))}
            </div>
          </div>
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
        </React.Fragment>
      )}

      {tab === "sueno" && (
        <React.Fragment>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
              <div>
                <span className="t-label">Promedio semanal</span>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em" }}>{(S.sueno.reduce((a, s) => a + s.horas, 0) / S.sueno.length).toFixed(1)}</span>
                  <span style={{ fontSize: 15, color: "var(--muted)" }}>h</span>
                </div>
              </div>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>última: {S.sueno[0].horas} h</span>
            </div>
            <Sparkline data={[...S.sueno].reverse().map((s) => s.horas)} color="var(--info)" />
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

function Perfil({ memberId, theme, onTheme, mode, onMode, homeVariant, onHomeVariant, onLogout }) {
  const m = MEMBERS[memberId];
  const store = useHistStore();
  const [confirmar, setConfirmar] = React.useState(false);
  const mias = store.items.length;
  const THEMES = [
    { id: "ion", label: "Ion", color: "#22d3ee" },
    { id: "volt", label: "Volt", color: "#4ade80" },
    { id: "blaze", label: "Blaze", color: "#ff7a45" },
    { id: "indigo", label: "Indigo", color: "#8b90ff" },
    { id: "pulse", label: "Pulse", color: "#ff4d79" },
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
        <p className="section-title" style={{ marginBottom: 12 }}>Apariencia</p>
        <div style={{ display: "flex", gap: 8 }}>
          {[["light", "Claro", "sun"], ["dark", "Oscuro", "moon"]].map(([id, label, icon]) => {
            const active = mode === id;
            return (
              <button key={id} onClick={() => onMode && onMode(id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", borderRadius: "var(--r-md)", padding: "11px 12px", background: active ? "var(--accent-dim)" : "transparent", border: active ? "1px solid var(--accent)" : "1px solid var(--border)", color: active ? "var(--accent)" : "var(--fg)", fontWeight: 700, fontSize: 13, fontFamily: "var(--font-sans)" }}>
                <Icon name={icon} size={16} color={active ? "var(--accent)" : "var(--muted)"} /> {label}
              </button>
            );
          })}
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
        <p className="section-title" style={{ marginBottom: 12 }}>Estilo de inicio</p>
        <div style={{ display: "flex", gap: 8 }}>
          {[["aurora", "Aurora", "Anillo + glass"], ["stadium", "Stadium", "Hero + acción"], ["clasico", "Clásico", "Tarjetas"]].map(([id, label, desc]) => {
            const active = homeVariant === id;
            return (
              <button key={id} onClick={() => onHomeVariant && onHomeVariant(id)} style={{ flex: 1, textAlign: "left", cursor: "pointer", borderRadius: "var(--r-md)", padding: "10px 11px", background: active ? "var(--accent-dim)" : "transparent", border: active ? "1px solid var(--accent)" : "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--accent)" : "var(--fg)" }}>{label}</div>
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{desc}</div>
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
      <div className="card" style={{ borderColor: "color-mix(in srgb, var(--danger) 40%, var(--border))" }}>
        <p className="section-title" style={{ marginBottom: 6, color: "var(--danger)" }}>Zona de peligro</p>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>Borra tu historial de entrenamiento y sesiones. No afecta rutinas ni ejercicios.</p>
        <button onClick={() => setConfirmar(true)} disabled={mias === 0} style={{ width: "100%", padding: 12, borderRadius: "var(--r-md)", border: "1px solid var(--danger)", background: "transparent", color: "var(--danger)", fontWeight: 700, fontSize: 14, cursor: mias === 0 ? "default" : "pointer", opacity: mias === 0 ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Icon name="trash-2" size={16} /> {mias === 0 ? "Sin historial" : "Borrar mi historial"}
        </button>
      </div>
      <button className="btn-secondary" style={{ marginTop: 8, maxWidth: 200 }} onClick={onLogout}>Cerrar sesión</button>

      {confirmar && (
        <div className="modal-backdrop" onClick={() => setConfirmar(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span>Borrar mi historial</span>
              <button className="modal-close" onClick={() => setConfirmar(false)}>✕</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--muted)", lineHeight: 1.5 }}>Se borrarán {mias} sesiones de {m.nombre}. No se puede deshacer. Tus rutinas y ejercicios no se tocan.</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn-secondary" style={{ flex: 1, padding: 12 }} onClick={() => setConfirmar(false)}>Cancelar</button>
                <button style={{ flex: 1, padding: 12, borderRadius: "var(--r-md)", border: "none", background: "var(--danger)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }} onClick={() => { store.clear(); setConfirmar(false); }}>Borrar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Salud, Historial, HistorialDetalle, Perfil });
