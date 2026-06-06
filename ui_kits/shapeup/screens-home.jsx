/* ShapeUp UI Kit — Login + Home */

function Login({ onLogin }) {
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <svg width="56" height="56" viewBox="0 0 120 120" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
          <g stroke="var(--accent)" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 60 L60 33 L90 60" /><path d="M30 87 L60 60 L90 87" />
          </g>
        </svg>
        <h1>ShapeUp</h1>
        <p className="auth-subtitle">Tu plan para ponerte en forma</p>
        <button className="btn-primary" onClick={onLogin}>
          <Icon name="chrome" size={18} /> Entrar con Google
        </button>
        <p style={{ marginTop: 18, fontSize: 11, color: "var(--muted)" }}>Acceso solo para miembros de la familia</p>
      </div>
    </div>
  );
}

function Home({ memberId, go }) {
  const prog = PROGRAMA;
  const rutina = RUTINAS[prog.hoy.idRutina];
  const m = MEMBERS[memberId];
  const sem = SEMANA;
  const pct = Math.round((sem.sesionesHechas / sem.sesionesObjetivo) * 100);
  return (
    <div className="page">
      {/* Header de marca */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width="26" height="26" viewBox="0 0 120 120" fill="none">
            <g stroke="var(--accent)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
              <path d="M30 60 L60 33 L90 60" /><path d="M30 87 L60 60 L90 87" />
            </g>
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-.02em" }}>Shape<span style={{ color: "var(--accent)" }}>Up</span></span>
        </div>
        <button onClick={() => go("perfil")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
          <Avatar id={memberId} size={34} />
        </button>
      </div>
      <h1 style={{ margin: "2px 0 6px", fontSize: 27, fontWeight: 800, letterSpacing: "-.02em" }}>
        Dale, {m.nombre.split(" ")[0]}
        <span style={{ color: "var(--accent)" }}>.</span>
      </h1>

      <div className="card" style={{ padding: "14px 16px" }}>
        <WeekStrip marcados={prog.diasMarcados} hoyIdx={2} />
      </div>

      {/* Tu semana — racha + volumen (motivo de progreso) */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="section-title">Tu semana</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--accent)", fontSize: 12, fontWeight: 700 }}>
            <Icon name="flame" size={14} fill="currentColor" color="var(--accent)" /> {sem.rachaSemanas} sem de racha
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>{sem.sesionesHechas}</span>
            <span style={{ fontSize: 14, color: "var(--muted)" }}>/ {sem.sesionesObjetivo} sesiones</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{(sem.volumenKg / 1000).toFixed(1)}k</div>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".05em" }}>kg volumen</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: "var(--accent)", borderRadius: 999 }} />
        </div>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <p className="section-title">Programa activo</p>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{prog.nombre}</p>
        <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{prog.diasPorSemana} días / semana · {prog.objetivo}</p>
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <p className="section-title" style={{ marginBottom: 4 }}>Hoy toca</p>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 22, letterSpacing: "-.01em" }}>{rutina.nombre}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <Badge kind="accent">{rutina.foco}</Badge>
            <Badge kind="muted">{rutina.nivel}</Badge>
            <Badge kind="muted">⏱ {rutina.duracion} min</Badge>
          </div>
        </div>
        <button className="btn-primary" onClick={() => go("sesion", { rutinaId: rutina.id })}>
          <Icon name="zap" size={18} color="var(--on-accent)" /> Empezar sesión
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <p className="section-title">Familia entrenando</p>
        <AvatarStack ids={["juanpablo", "maria", "sofia", "federico"]} size={30} />
      </div>
    </div>
  );
}

Object.assign(window, { Login, Home });
