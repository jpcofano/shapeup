/* ShapeUp UI Kit — EntrenarSesion (pantalla fullscreen, corazón de la app) */

function objetivoLabel(b) {
  if (b.modalidad === "Isométrico") return `${b.segundos}s`;
  return `${b.reps} reps · ${b.cargaKg} kg`;
}
function totalSeries(b) { return b.series; }

/* Stepper grande (sin teclado) */
function Stepper({ label, value, setValue, step = 1, suffix }) {
  const dec = () => setValue(Math.max(0, +(value - step).toFixed(1)));
  const inc = () => setValue(+(value + step).toFixed(1));
  return (
    <div className="stepper-field">
      <span className="quick-log-label">{label}</span>
      <div className="stepper">
        <button className="stepper-btn" onClick={dec} aria-label={`menos ${label}`}><Icon name="minus" size={18} /></button>
        <span className="stepper-val">{value}{suffix ? <span className="stepper-suffix">{suffix}</span> : null}</span>
        <button className="stepper-btn" onClick={inc} aria-label={`más ${label}`}><Icon name="plus" size={18} /></button>
      </div>
    </div>
  );
}

/* Anillo de descanso con cuenta regresiva */
function RestRing({ restante, total }) {
  const R = 52, SIZE = 130, C = 2 * Math.PI * R;
  const pct = total > 0 ? restante / total : 0;
  const urgent = restante <= 5;
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} style={{ transform: "rotate(-90deg)", display: "block" }}>
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="var(--border)" strokeWidth={9} />
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke={urgent ? "var(--danger)" : "var(--accent)"} strokeWidth={9} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: "stroke-dashoffset 1s linear" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.03em", color: urgent ? "var(--danger)" : "var(--fg)" }}>{fmt(restante)}</span>
      </div>
    </div>
  );
}

/* Media del ejercicio en sesión guiada: pestañas Foto / Demo / Músculo */
function MediaTabs({ ej }) {
  const [tab, setTab] = React.useState("foto");
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => { setTab("foto"); setPlaying(false); }, [ej?.id]);
  const tabs = [["foto", "Foto", "image"], ["video", "Demo", "play"], ["musc", "Músculo", "target"]];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="media-seg">
        {tabs.map(([id, label, ic]) => (
          <button key={id} className={tab === id ? "on" : ""} onClick={() => { setTab(id); setPlaying(false); }}>
            <Icon name={ic} size={14} /> {label}
          </button>
        ))}
      </div>
      <div className="media-frame">
        {tab === "foto" && (ej?.imagen
          ? <img src={ej.imagen} alt={ej.nombre} onError={(e) => { e.target.style.display = "none"; }} />
          : <div className="media-empty"><Icon name="dumbbell" size={32} color="var(--muted)" /></div>)}
        {tab === "video" && (playing
          ? <div className="media-playing"><span className="vp-pulse"><Icon name="loader" size={22} color="var(--accent)" /></span><span style={{ fontSize: 11, color: "var(--muted)" }}>Reproduciendo demo…</span></div>
          : <button className="media-play" onClick={() => setPlaying(true)}>
              {ej?.imagen && <img src={ej.imagen} alt="" onError={(e) => { e.target.style.display = "none"; }} />}
              <span className="media-play-overlay"><span className="media-play-btn"><Icon name="play" size={22} fill="currentColor" color="var(--on-accent)" /></span></span>
              <span className="media-badge"><Icon name="video" size={11} /> Demo · 0:12</span>
            </button>)}
        {tab === "musc" && (ej?.musculoPrimario
          ? <div className="media-musc"><BodyMap primario={ej.musculoPrimario} secundarios={ej.musculosSecundarios} /></div>
          : <div className="media-empty"><Icon name="target" size={32} color="var(--muted)" /></div>)}
      </div>
    </div>
  );
}

function EntrenarSesion({ rutinaId, onSalir, onFinalizar }) {
  const rutina = RUTINAS[rutinaId];
  const [bloqueActual, setBloque] = React.useState(0);
  const [hechas, setHechas] = React.useState(rutina.bloques.map(() => 0));
  const [descanso, setDescanso] = React.useState(null); // {restante, total}
  const [modo, setModo] = React.useState("guiada");
  const [instrOpen, setInstrOpen] = React.useState(true);
  const [rpe, setRpe] = React.useState(null);

  const blq = rutina.bloques[bloqueActual];
  const ej = EJERCICIOS[blq?.idEjercicio];
  const terminada = bloqueActual >= rutina.bloques.length;

  // valores editables de la serie en curso (prefill con el objetivo)
  const [reps, setReps] = React.useState(blq?.reps || 10);
  const [carga, setCarga] = React.useState(blq?.cargaKg || 0);
  React.useEffect(() => { if (blq) { setReps(blq.reps || 0); setCarga(blq.cargaKg || 0); } }, [bloqueActual]);

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

  // progreso global de la sesión
  const seriesTotales = rutina.bloques.reduce((a, b) => a + b.series, 0);
  const seriesHechas = hechas.reduce((a, b) => a + b, 0);
  const pctGlobal = Math.round((seriesHechas / seriesTotales) * 100);

  function completarSerie() {
    const nuevas = [...hechas];
    nuevas[bloqueActual] += 1;
    setHechas(nuevas);
    if (nuevas[bloqueActual] >= totalSeries(blq)) {
      if (bloqueActual + 1 < rutina.bloques.length) {
        setBloque(bloqueActual + 1);
        setDescanso({ restante: blq.descansoSeg, total: blq.descansoSeg });
        setInstrOpen(false);
      } else {
        setBloque(rutina.bloques.length);
      }
    } else {
      setDescanso({ restante: blq.descansoSeg, total: blq.descansoSeg });
    }
  }

  function irBloque(i) {
    if (i < 0 || i >= rutina.bloques.length) return;
    setDescanso(null); setInstrOpen(false); setBloque(i);
  }

  // ── Finish ────────────────────────────────────────────────────────────────
  if (terminada) {
    return (
      <div style={fullCol}>
        <div className="workout-header"><p className="workout-title">{rutina.nombre}</p></div>
        <div className="finish-screen">
          <span style={{ color: "var(--accent)" }}><Icon name="biceps-flexed" size={56} fill="currentColor" /></span>
          <h2 className="finish-title">¡Sesión completada!</h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{seriesHechas} series · {rutina.nombre}</p>
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

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const proximoBloque = rutina.bloques[bloqueActual]; // tras descanso seguimos en el bloque actual o el nuevo

  return (
    <div style={fullCol}>
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={onSalir} title="Salir"><Icon name="x" size={18} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p className="workout-title" style={{ margin: 0 }}>{rutina.nombre}</p>
          <div className="workout-progress"><div className="workout-progress-fill" style={{ width: pctGlobal + "%" }} /></div>
        </div>
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
                <RestRing restante={descanso.restante} total={descanso.total} />
                {/* qué viene */}
                <div className="proximo-chip">
                  <Icon name="arrow-right" size={14} color="var(--accent)" />
                  <span>Próximo: <strong>{proximoBloque.nombre}</strong> · Serie {hechas[bloqueActual] + 1}</span>
                </div>
                <div className="descanso-actions">
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setDescanso((d) => ({ ...d, restante: d.restante + 30, total: d.total + 30 }))}>+30 s</button>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={() => setDescanso(null)}>Listo</button>
                </div>
              </div>
            ) : (
              <div className="bloque-guiado">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="bloque-counter">Ejercicio {bloqueActual + 1} de {rutina.bloques.length}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn-icon-sm" disabled={bloqueActual === 0} onClick={() => irBloque(bloqueActual - 1)} title="Anterior"><Icon name="chevron-left" size={18} /></button>
                    <button className="btn-icon-sm" disabled={bloqueActual >= rutina.bloques.length - 1} onClick={() => irBloque(bloqueActual + 1)} title="Siguiente"><Icon name="chevron-right" size={18} /></button>
                  </div>
                </div>
                <h2 className="bloque-nombre-grande">{blq.nombre}</h2>

                {/* media: Foto / Demo / Músculo */}
                <MediaTabs ej={ej} />

                <ProgressDots total={blq.series} hechas={hechas[bloqueActual]} />
                <span className="objetivo-chip">Serie {hechas[bloqueActual] + 1} de {blq.series} · objetivo {objetivoLabel(blq)}</span>

                {ej?.instrucciones?.length > 0 && (
                  <div>
                    <button className="instrucciones-toggle" onClick={() => setInstrOpen((v) => !v)}>
                      <Icon name={instrOpen ? "chevron-down" : "chevron-right"} size={14} /> Cómo se hace
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
                  <Stepper label="Reps" value={reps} setValue={setReps} step={1} />
                  <Stepper label="Carga" value={carga} setValue={setCarga} step={2.5} suffix=" kg" />
                </div>
              )}
              <button className="btn-serie-hecha" onClick={completarSerie}>
                {hechas[bloqueActual] + 1 >= blq.series && bloqueActual + 1 >= rutina.bloques.length
                  ? "Última serie · Terminar ✓"
                  : `Serie ${hechas[bloqueActual] + 1} hecha ✓`}
              </button>
            </div>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

const fullCol = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" };

/* ── Sesión libre (A2): armá una sesión ad-hoc ─────────────────────────────── */
function SesionLibre({ onSalir, onEmpezar }) {
  const [picker, setPicker] = React.useState(false);
  const [elegidos, setElegidos] = React.useState([]); // [{id, series, reps}]

  const agregar = (ej) => {
    if (elegidos.find((x) => x.id === ej.id)) return;
    setElegidos([...elegidos, { id: ej.id, series: 3, reps: ej.modalidad === "Isométrico" ? null : 10 }]);
    setPicker(false);
  };
  const quitar = (id) => setElegidos(elegidos.filter((x) => x.id !== id));
  const mover = (i, dir) => {
    const j = i + dir; if (j < 0 || j >= elegidos.length) return;
    const n = [...elegidos]; [n[i], n[j]] = [n[j], n[i]]; setElegidos(n);
  };
  const setSerie = (id, k, v) => setElegidos(elegidos.map((x) => x.id === id ? { ...x, [k]: Math.max(1, v) } : x));

  return (
    <div style={fullCol}>
      <div className="workout-header">
        <button className="btn-icon-sm" onClick={onSalir} title="Salir"><Icon name="x" size={18} /></button>
        <p className="workout-title" style={{ margin: 0 }}>Armá tu sesión</p>
        <span style={{ width: 32 }} />
      </div>

      <div className="workout-content">
        {elegidos.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 60 }}>
            <span style={{ color: "var(--muted)" }}><Icon name="dumbbell" size={40} /></span>
            <p>Sumá ejercicios del catálogo para empezar.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {elegidos.map((x, i) => {
              const ej = EJERCICIOS[x.id];
              return (
                <div key={x.id} className="card libre-item" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>{ej.nombre}</p>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        <Badge kind="accent">{ej.grupo}</Badge><Badge kind="muted">{ej.equipo[0]}</Badge>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button className="btn-icon-sm" disabled={i === 0} onClick={() => mover(i, -1)}><Icon name="chevron-up" size={16} /></button>
                      <button className="btn-icon-sm" disabled={i === elegidos.length - 1} onClick={() => mover(i, 1)}><Icon name="chevron-down" size={16} /></button>
                      <button className="btn-icon-sm" onClick={() => quitar(x.id)}><Icon name="trash-2" size={16} /></button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div className="libre-default">
                      <span className="quick-log-label">Series</span>
                      <div className="libre-default-ctl">
                        <button onClick={() => setSerie(x.id, "series", x.series - 1)}><Icon name="minus" size={14} /></button>
                        <span>{x.series}</span>
                        <button onClick={() => setSerie(x.id, "series", x.series + 1)}><Icon name="plus" size={14} /></button>
                      </div>
                    </div>
                    {x.reps !== null && (
                      <div className="libre-default">
                        <span className="quick-log-label">Reps</span>
                        <div className="libre-default-ctl">
                          <button onClick={() => setSerie(x.id, "reps", x.reps - 1)}><Icon name="minus" size={14} /></button>
                          <span>{x.reps}</span>
                          <button onClick={() => setSerie(x.id, "reps", x.reps + 1)}><Icon name="plus" size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setPicker(true)}>
          <Icon name="plus" size={16} /> Sumá ejercicio
        </button>
      </div>

      {elegidos.length > 0 && (
        <div className="workout-footer">
          <button className="btn-serie-hecha" onClick={() => onEmpezar(elegidos)}>
            Empezar · {elegidos.length} ejercicio{elegidos.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}

      {/* Picker de ejercicios */}
      {picker && (
        <div className="modal-backdrop" onClick={() => setPicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><span>Elegí un ejercicio</span>
              <button className="modal-close" onClick={() => setPicker(false)}><Icon name="x" size={16} /></button></div>
            <div style={{ padding: "8px 12px 16px", overflowY: "auto" }}>
              {Object.values(EJERCICIOS).map((ej) => {
                const ya = elegidos.find((x) => x.id === ej.id);
                return (
                  <button key={ej.id} disabled={!!ya} onClick={() => agregar(ej)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 8px", background: "none", border: "none", borderBottom: "1px solid var(--border-dim)", cursor: ya ? "default" : "pointer", color: "inherit", opacity: ya ? 0.45 : 1, textAlign: "left" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{ej.nombre}</p>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{ej.grupo} · {ej.equipo[0]}</span>
                    </div>
                    <Icon name={ya ? "check" : "plus"} size={18} color={ya ? "var(--accent)" : "var(--muted)"} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { EntrenarSesion, SesionLibre });
