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

const PRIMER_NOMBRE = { juanpablo: "Juan", maria: "María", sofia: "Sofía", federico: "Fede" };

function ProgressRing({ done, total }) {
  const R = 56, SIZE = 150, C = 2 * Math.PI * R;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const complete = done >= total && total > 0;
  const [offset, setOffset] = React.useState(C);
  React.useEffect(() => {
    const id = setTimeout(() => setOffset(complete ? 0 : C * (1 - pct)), 80);
    return () => clearTimeout(id);
  }, [pct, complete]);
  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: -24, background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", opacity: 0.16, filter: "blur(18px)", borderRadius: "50%", pointerEvents: "none" }} />
      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <defs><linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "var(--ring-from)" }} /><stop offset="100%" style={{ stopColor: "var(--ring-to)" }} />
        </linearGradient></defs>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="var(--border)" strokeWidth={10} />
        {(pct > 0 || complete) && (
          <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="url(#rg)" strokeWidth={10} strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={offset} className="ring-progress"
            style={{ filter: "drop-shadow(0 0 5px var(--accent))" }} />
        )}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2 }}>
        {complete
          ? <span style={{ color: "var(--accent)" }}><Icon name="check" size={30} stroke={3} /></span>
          : <React.Fragment>
              <span style={{ fontSize: 26, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em", lineHeight: 1 }}>{done}/{total}</span>
              <span className="t-label" style={{ fontSize: 10 }}>sesiones</span>
            </React.Fragment>}
      </div>
    </div>
  );
}

function BentoTile({ label, children, anim }) {
  return (
    <div className={`bento-tile aurora-anim ${anim}`}>
      <span className="t-label">{label}</span>
      {children}
    </div>
  );
}

function Home({ memberId, go, variant = "aurora", activoId }) {
  const progActivo = (typeof PROGRAMAS !== "undefined" && activoId) ? PROGRAMAS[activoId] : null;
  const prog = PROGRAMA;
  const rutina = RUTINAS[prog.hoy.idRutina];
  const m = MEMBERS[memberId];
  const sem = SEMANA;
  const med = SALUD.mediciones;
  const pesoDelta = med.length > 1 ? +(med[0].pesoKg - med[1].pesoKg).toFixed(1) : null;
  const fmtKg = (kg) => kg >= 1000 ? (kg/1000).toFixed(1) + "k" : String(Math.round(kg));

  const topbar = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
        <svg width="24" height="24" viewBox="0 0 120 120" fill="none"><g stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"><path d="M30 60 L60 33 L90 60" /><path d="M30 87 L60 60 L90 87" /></g></svg>
        <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-.02em", color: "var(--fg)" }}>Shape<span style={{ color: "var(--accent)" }}>Up</span></span>
      </div>
      <button onClick={() => go("perfil")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        <Avatar id={memberId} size={32} />
      </button>
    </div>
  );

  const saludo = (
    <div style={{ marginBottom: -4 }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1 }}>
        Dale, {PRIMER_NOMBRE[memberId]}<span style={{ color: "var(--accent)" }}>.</span>
      </h1>
      <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>Día {sem.sesionesHechas + 1} de {sem.sesionesObjetivo}</p>
    </div>
  );

  // ── Variante CLÁSICA (D2) ───────────────────────────────────────────────────
  if (variant === "clasico") {
    const pct = Math.round((sem.sesionesHechas / sem.sesionesObjetivo) * 100);
    return (
      <div className="page">
        {topbar}{saludo}
        <div className="card" style={{ padding: "14px 16px" }}><WeekStrip marcados={prog.diasMarcados} hoyIdx={2} /></div>
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
              <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmtKg(sem.volumenKg)}</div>
              <div className="t-label">kg volumen</div>
            </div>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: pct + "%", background: "var(--accent)", borderRadius: 999 }} />
          </div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p className="section-title" style={{ marginBottom: 4 }}>Hoy toca</p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 22, letterSpacing: "-.01em" }}>{rutina.nombre}</p>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <Badge kind="accent">{rutina.foco}</Badge><Badge kind="muted">{rutina.nivel}</Badge><Badge kind="muted">⏱ {rutina.duracion} min</Badge>
            </div>
          </div>
          <button className="btn-primary" onClick={() => go("sesion", { rutinaId: rutina.id })}>
            <Icon name="zap" size={18} color="var(--on-accent)" /> Empezar sesión
          </button>
        </div>
      </div>
    );
  }

  // ── Variante STADIUM (A) ────────────────────────────────────────────────────
  if (variant === "stadium") {
    return (
      <div className="page">
        {topbar}
        <h1 style={{ margin: "2px 0 0", fontSize: 28, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.1 }}>
          Dale, {PRIMER_NOMBRE[memberId]}<span style={{ color: "var(--accent)" }}>.</span>
        </h1>
        <div className="card" style={{ padding: "12px 14px" }}><WeekStrip marcados={prog.diasMarcados} hoyIdx={2} /></div>

        {/* Hero marquesina */}
        <div style={{ position: "relative", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)", background: "var(--card)", padding: "26px 20px 22px", textAlign: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 120%, var(--accent) 0%, transparent 62%)", opacity: 0.22, pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <p className="t-label" style={{ margin: "0 0 10px" }}>Próxima sesión · Día {sem.sesionesHechas + 1} de {sem.sesionesObjetivo}</p>
            <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 30, lineHeight: 1.05, letterSpacing: "-.03em" }}>{rutina.nombre}</p>
            <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
              <Badge kind="accent">{rutina.foco}</Badge><Badge kind="muted">{rutina.nivel}</Badge><Badge kind="muted">⏱ {rutina.duracion} min</Badge>
            </div>
            <button className="btn-primary" style={{ fontSize: 17, padding: "16px" }} onClick={() => go("sesion", { rutinaId: rutina.id })}>
              <Icon name="zap" size={20} color="var(--on-accent)" /> Empezar ahora
            </button>
          </div>
        </div>

        {/* Stats en fila scrolleable */}
        <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
          {[
            ["flame", `${sem.rachaSemanas}`, "racha (sem)"],
            ["dumbbell", fmtKg(sem.volumenKg), "kg volumen"],
            ["check-check", `${sem.sesionesHechas}/${sem.sesionesObjetivo}`, "sesiones"],
            ["scale", `${med[0].pesoKg}`, "kg peso"],
          ].map(([ic, val, lab], i) => (
            <div key={i} style={{ flex: "0 0 auto", minWidth: 104, background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4 }}>
              <Icon name={ic} size={18} color="var(--accent)" />
              <span style={{ fontSize: 22, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em", marginTop: 4 }}>{val}</span>
              <span className="t-label">{lab}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Variante AURORA+ (D9, default) ──────────────────────────────────────────
  return (
    <div className="page">
      {topbar}{saludo}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, position: "relative" }}>
        <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 280, height: 180, background: "radial-gradient(ellipse, var(--accent) 0%, transparent 70%)", opacity: 0.08, filter: "blur(24px)", pointerEvents: "none" }} />
        <ProgressRing done={sem.sesionesHechas} total={sem.sesionesObjetivo} />
        {(() => {
          const hoySes = progActivo ? sesionDeHoy(progActivo, 2) : null;
          if (hoySes && hoySes.descanso) {
            return (
              <div className="glass-card aurora-anim aurora-anim-1" style={{ width: "100%", maxWidth: 360 }}>
                <p className="t-label" style={{ margin: "0 0 6px" }}>Hoy</p>
                <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em", display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="moon" size={18} color="var(--accent)" /> Día de descanso
                </p>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)" }}>Recuperá. La recuperación es parte del entrenamiento.</p>
                <button className="btn-secondary" onClick={() => go("entrenar")}>
                  <Icon name="zap" size={16} /> Entrenar igual
                </button>
              </div>
            );
          }
          const r = hoySes && hoySes.rutina ? hoySes.rutina : rutina;
          return (
            <div className="glass-card aurora-anim aurora-anim-1" style={{ width: "100%", maxWidth: 360 }}>
              <p className="t-label" style={{ margin: "0 0 6px" }}>Hoy toca · {DIA_NOMBRE[2]}</p>
              <p style={{ margin: "0 0 8px", fontWeight: 800, fontSize: 18, letterSpacing: "-.01em" }}>{r.nombre}</p>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)" }}>{r.foco} · {r.nivel} · ⏱ {r.duracion} min</p>
              <button className="btn-primary" onClick={() => go("sesion", { rutinaId: r.id })}>
                <Icon name="zap" size={18} color="var(--on-accent)" /> Empezar
              </button>
            </div>
          );
        })()}
      </div>

      <div className="bento-row bento-row-3">
        <BentoTile label="Volumen" anim="aurora-anim-2">
          <span className="bento-value">{fmtKg(sem.volumenKg)}</span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>kg esta sem.</span>
        </BentoTile>
        <BentoTile label="Peso" anim="aurora-anim-3">
          <span className="bento-value">{med[0].pesoKg} kg</span>
          {pesoDelta !== null && (
            <span className="bento-delta" style={{ color: pesoDelta < 0 ? "var(--accent)" : pesoDelta > 0 ? "var(--danger)" : "var(--muted)" }}>
              {pesoDelta > 0 ? "+" : ""}{pesoDelta} kg
            </span>
          )}
        </BentoTile>
        <BentoTile label="Racha" anim="aurora-anim-4">
          <span className="bento-value" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="flame" size={18} fill="currentColor" color="var(--accent)" /> {sem.rachaSemanas}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{sem.rachaSemanas === 1 ? "sem" : "sems"}</span>
        </BentoTile>
      </div>

      {progActivo ? (
        <div className="card" style={{ padding: "14px 16px", cursor: "pointer" }} onClick={() => go("programaDetalle", { programaId: progActivo.id })}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="t-label">{progActivo.nombre}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 12, color: "var(--muted)" }}>Ver <Icon name="chevron-right" size={13} /></span>
          </div>
          <VistaSemanal prog={progActivo} hoy={2} compact={true} />
        </div>
      ) : (
        <div className="card" style={{ padding: "14px 16px" }}><WeekStrip marcados={prog.diasMarcados} hoyIdx={2} /></div>
      )}
    </div>
  );
}

Object.assign(window, { Login, Home, ProgressRing });
