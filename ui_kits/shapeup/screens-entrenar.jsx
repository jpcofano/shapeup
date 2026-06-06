/* ShapeUp UI Kit — EntrenarSesion (pantalla fullscreen, corazón de la app) */

function objetivoLabel(b) {
  if (b.modalidad === "Isométrico") return `${b.segundos}s`;
  return `${b.reps} reps · ${b.cargaKg} kg`;
}
function totalSeries(b) { return b.series; }

function EntrenarSesion({ rutinaId, onSalir, onFinalizar }) {
  const rutina = RUTINAS[rutinaId];
  const [bloqueActual, setBloque] = React.useState(0);
  const [hechas, setHechas] = React.useState(rutina.bloques.map(() => 0));
  const [descanso, setDescanso] = React.useState(null); // {restante, total}
  const [modo, setModo] = React.useState("guiada");
  const [logReps, setLogReps] = React.useState("");
  const [logCarga, setLogCarga] = React.useState("");
  const [instrOpen, setInstrOpen] = React.useState(false);
  const [rpe, setRpe] = React.useState(null);

  // tick del descanso
  React.useEffect(() => {
    if (!descanso) return;
    const id = setInterval(() => {
      setDescanso((d) => {
        if (!d) return null;
        const r = d.restante - 1;
        return r <= 0 ? null : { ...d, restante: r };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [descanso?.total, descanso ? 1 : 0]);

  const blq = rutina.bloques[bloqueActual];
  const ej = EJERCICIOS[blq?.idEjercicio];
  const terminada = bloqueActual >= rutina.bloques.length;

  function completarSerie() {
    const nuevas = [...hechas];
    nuevas[bloqueActual] += 1;
    setHechas(nuevas);
    setLogReps(""); setLogCarga("");
    if (nuevas[bloqueActual] >= totalSeries(blq)) {
      // avanzar de bloque
      if (bloqueActual + 1 < rutina.bloques.length) {
        setBloque(bloqueActual + 1);
        setDescanso({ restante: blq.descansoSeg, total: blq.descansoSeg });
        setInstrOpen(false);
      } else {
        setBloque(rutina.bloques.length); // finish
      }
    } else {
      setDescanso({ restante: blq.descansoSeg, total: blq.descansoSeg });
    }
  }

  // ── Finish ────────────────────────────────────────────────────────────────
  if (terminada) {
    const totalSer = hechas.reduce((a, b) => a + b, 0);
    return (
      <div style={fullCol}>
        <div className="workout-header"><p className="workout-title">{rutina.nombre}</p></div>
        <div className="finish-screen">
          <span className="finish-emoji">🎉</span>
          <h2 className="finish-title">¡Sesión completada!</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{totalSer} series totales</p>
          <div style={{ width: "100%", textAlign: "left" }}>
            <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>¿Cómo fue el esfuerzo? (RPE)</p>
            <div className="rpe-selector">
              {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                <button key={n} className={`rpe-btn${rpe === n ? " selected" : ""}`} onClick={() => setRpe(n)}>{n}</button>
              ))}
            </div>
          </div>
          <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => onFinalizar()}>Finalizar y guardar</button>
          <button className="btn-secondary" onClick={onSalir}>Salir sin guardar</button>
        </div>
      </div>
    );
  }

  // ── Sesión ──────────────────────────────────────────────────────────────────
  const urgent = descanso && descanso.restante <= 5;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div style={fullCol}>
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={onSalir} title="Salir"><Icon name="x" size={18} /></button>
        <p className="workout-title">{rutina.nombre}</p>
        <button className="btn-icon-sm" onClick={() => setModo(modo === "guiada" ? "scroll" : "guiada")} title="Cambiar vista">
          <Icon name={modo === "guiada" ? "align-justify" : "zap"} size={18} />
        </button>
      </div>

      {modo === "scroll" ? (
        <div className="workout-content">
          {rutina.bloques.map((b, i) => (
            <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{b.nombre}</span>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{objetivoLabel(b)}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from({ length: b.series }, (_, s) => (
                  <span key={s} className={`serie-btn${s < hechas[i] ? " done" : ""}`} onClick={() => {
                    const n = [...hechas]; n[i] = Math.min(b.series, s < hechas[i] ? s : hechas[i] + 1); setHechas(n);
                  }}>{s + 1}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <React.Fragment>
          <div className="workout-content">
            {descanso ? (
              <div className="descanso-card">
                <span className="descanso-label">Descanso</span>
                <span className={`timer-big${urgent ? " urgent" : ""}`}>{fmt(descanso.restante)}</span>
                <div className="descanso-actions">
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDescanso((d) => ({ ...d, restante: d.restante + 30, total: d.total + 30 }))}>+30 s</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setDescanso(null)}>Saltar</button>
                </div>
              </div>
            ) : (
              <div className="bloque-guiado">
                <span className="bloque-counter">Ejercicio {bloqueActual + 1} de {rutina.bloques.length}</span>
                <h2 className="bloque-nombre-grande">{blq.nombre}</h2>
                <ProgressDots total={blq.series} hechas={hechas[bloqueActual]} />
                <span className="objetivo-chip">Serie {hechas[bloqueActual] + 1} · {objetivoLabel(blq)}</span>

                {ej?.instrucciones?.length > 0 && (
                  <div>
                    <button className="instrucciones-toggle" onClick={() => setInstrOpen((v) => !v)}>
                      <Icon name={instrOpen ? "chevron-down" : "chevron-right"} size={14} /> Instrucciones
                    </button>
                    {instrOpen && <div className="instrucciones-body"><ol>{ej.instrucciones.map((p, i) => <li key={i}>{p}</li>)}</ol></div>}
                  </div>
                )}
                {ej?.puntosClave?.length > 0 && (
                  <div className="banner banner-green"><p className="banner-title">✅ Puntos clave</p>
                    <ul>{ej.puntosClave.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
                )}
                {ej?.erroresComunes?.length > 0 && (
                  <div className="banner banner-amber"><p className="banner-title">⚠️ Errores comunes</p>
                    <ul>{ej.erroresComunes.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
                )}
              </div>
            )}
          </div>

          {!descanso && (
            <div className="workout-footer">
              {blq.modalidad === "Fuerza" && (
                <div className="quick-log">
                  <div className="quick-log-field">
                    <span className="quick-log-label">Reps</span>
                    <input className="quick-log-input" type="number" placeholder={String(blq.reps)} value={logReps} onChange={(e) => setLogReps(e.target.value)} />
                  </div>
                  <div className="quick-log-field">
                    <span className="quick-log-label">Carga (kg)</span>
                    <input className="quick-log-input" type="number" placeholder={String(blq.cargaKg)} value={logCarga} onChange={(e) => setLogCarga(e.target.value)} />
                  </div>
                </div>
              )}
              <button className="btn-serie-hecha" onClick={completarSerie}>
                Serie {hechas[bloqueActual] + 1} hecha ✓
              </button>
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

const fullCol = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" };

Object.assign(window, { EntrenarSesion });
