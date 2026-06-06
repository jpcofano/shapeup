/* ShapeUp UI Kit — Biblioteca (Rutinas | Ejercicios) + RutinaDetalle */

function Biblioteca({ go }) {
  const [tab, setTab] = React.useState("rutinas");
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Biblioteca</h1></div>
      <div className="tabs" style={{ marginTop: -4 }}>
        <button className={`tab${tab === "rutinas" ? " active" : ""}`} onClick={() => setTab("rutinas")}>Rutinas</button>
        <button className={`tab${tab === "ejercicios" ? " active" : ""}`} onClick={() => setTab("ejercicios")}>Ejercicios</button>
      </div>
      {tab === "rutinas" ? <RutinasTab go={go} /> : <CatalogoTab />}
    </div>
  );
}

function RutinasTab({ go }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Object.values(RUTINAS).map((r) => (
        <div key={r.id} className="rutina-card" onClick={() => go("rutinaDetalle", { rutinaId: r.id })}>
          <p className="rutina-card-title">{r.nombre}</p>
          <div className="rutina-card-meta">
            <Badge kind="accent">{r.foco}</Badge>
            <Badge kind="muted">{r.nivel}</Badge>
            <span>· {r.bloques.length} ejercicios</span>
            <span>· ⏱ {r.duracion} min</span>
          </div>
        </div>
      ))}
      <button className="fab" onClick={() => {}} title="Nueva rutina"><Icon name="plus" size={24} color="var(--on-accent)" /></button>
    </div>
  );
}

function CatalogoTab() {
  const grupos = ["Pecho", "Espalda", "Pierna", "Core"];
  const [grupo, setGrupo] = React.useState("");
  const [busqueda, setBusqueda] = React.useState("");
  const [abierto, setAbierto] = React.useState(null);
  const lista = Object.values(EJERCICIOS).filter((e) =>
    (!grupo || e.grupo === grupo) && (!busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase())));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", display: "flex" }}><Icon name="search" size={16} /></span>
        <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Buscar ejercicio…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      </div>
      <div className="filter-scroll">
        <button className={`filter-chip${grupo === "" ? " active" : ""}`} onClick={() => setGrupo("")}>Todos</button>
        {grupos.map((g) => <button key={g} className={`filter-chip${grupo === g ? " active" : ""}`} onClick={() => setGrupo(grupo === g ? "" : g)}>{g}</button>)}
      </div>
      <p style={{ margin: "0 0 2px", fontSize: 12, color: "var(--muted)" }}>{lista.length} ejercicio{lista.length !== 1 ? "s" : ""}</p>
      {lista.map((e) => (
        <div key={e.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
          <button onClick={() => setAbierto(abierto === e.id ? null : e.id)} style={{ width: "100%", padding: "12px 14px", background: "none", border: "none", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left", color: "inherit" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{e.nombre}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                <Badge kind="accent">{e.grupo}</Badge><Badge kind="muted">{e.modalidad}</Badge><Badge kind="muted">{e.nivel}</Badge>
              </div>
            </div>
            <Icon name={abierto === e.id ? "chevron-up" : "chevron-down"} size={16} color="var(--muted)" />
          </button>
          {abierto === e.id && (
            <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--border)" }}>
              <section style={{ marginTop: 12 }}>
                <p className="section-title" style={{ marginBottom: 6 }}>Ejecución</p>
                <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 4 }}>
                  {e.instrucciones.map((p, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{p}</li>)}
                </ol>
              </section>
              <section style={{ marginTop: 12, background: "rgba(74,222,128,.07)", borderRadius: 8, padding: "10px 12px" }}>
                <p className="section-title" style={{ marginBottom: 6, color: "var(--accent)" }}>Puntos clave</p>
                <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                  {e.puntosClave.map((p, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{p}</li>)}
                </ul>
              </section>
              <section style={{ marginTop: 10, background: "rgba(251,191,36,.07)", borderRadius: 8, padding: "10px 12px" }}>
                <p className="section-title" style={{ marginBottom: 6, color: "var(--warning)" }}>Errores comunes</p>
                <ul style={{ margin: 0, paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
                  {e.erroresComunes.map((p, i) => <li key={i} style={{ fontSize: 13, lineHeight: 1.5 }}>{p}</li>)}
                </ul>
              </section>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RutinaDetalle({ rutinaId, go }) {
  const r = RUTINAS[rutinaId];
  return (
    <div className="page">
      <button className="back-btn" onClick={() => go("biblioteca")}><Icon name="chevron-left" size={16} /> Biblioteca</button>
      <div className="page-header"><h1 className="page-title" style={{ fontSize: 24 }}>{r.nombre}</h1></div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Badge kind="accent">{r.foco}</Badge><Badge kind="muted">{r.nivel}</Badge><Badge kind="muted">⏱ {r.duracion} min</Badge>
      </div>
      <div className="card">
        <p className="section-title" style={{ marginBottom: 6 }}>Bloques</p>
        {r.bloques.map((b, i) => (
          <div key={i} className="bloque-row">
            <span className="bloque-num">{i + 1}</span>
            <div style={{ flex: 1 }}>
              <p className="bloque-nombre">{b.nombre}</p>
              <p className="bloque-prescripcion">{b.series} series · {objetivoLabel(b)} · descanso {b.descansoSeg}s</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => go("sesion", { rutinaId: r.id })}>
        <Icon name="zap" size={18} color="var(--on-accent)" /> Empezar sesión
      </button>
    </div>
  );
}

Object.assign(window, { Biblioteca, RutinaDetalle });
