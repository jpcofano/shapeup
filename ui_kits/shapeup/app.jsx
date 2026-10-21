/* ShapeUp UI Kit — App shell, navegación inferior y router. */

const NAV = [
  { key: "inicio", label: "Inicio", icon: "house", screen: "home" },
  { key: "rutinas", label: "Rutinas", icon: "library", screen: "biblioteca" },
  { key: "entrenar", label: "Entrenar", icon: "zap", screen: "entrenar" },
  { key: "historial", label: "Historial", icon: "history", screen: "historial" },
  { key: "salud", label: "Salud", icon: "heart", screen: "salud" },
  { key: "perfil", label: "Perfil", icon: "user", screen: "perfil" },
];

// Qué item del nav resaltar según la pantalla
const SCREEN_TO_NAV = {
  home: "inicio", biblioteca: "rutinas", rutinaDetalle: "rutinas", programaDetalle: "rutinas",
  entrenar: "entrenar", historial: "historial", historialDetalle: "historial",
  salud: "salud", perfil: "perfil",
};

function EntrenarLanding({ go, activoId }) {
  const progActivo = (typeof PROGRAMAS !== "undefined" && activoId) ? PROGRAMAS[activoId] : null;
  const hoySes = progActivo ? sesionDeHoy(progActivo, 2) : null;
  const prox = (hoySes && hoySes.rutina) ? hoySes.rutina : RUTINAS[PROGRAMA.hoy.idRutina];
  const esDescanso = hoySes && hoySes.descanso;
  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Entrenar</h1></div>

      {/* Puerta 1 — sesión de hoy del programa activo */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12, borderColor: "var(--accent)" }}>
        <span className="t-label">{esDescanso ? "Hoy · descanso" : "Hoy toca"}</span>
        {esDescanso ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Hoy es día de descanso en tu programa. Podés entrenar igual eligiendo una rutina abajo.</p>
        ) : (
          <React.Fragment>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 20, letterSpacing: "-.01em" }}>{prox.nombre}</p>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <Badge kind="accent">{prox.foco}</Badge><Badge kind="muted">{prox.nivel}</Badge><Badge kind="muted">⏱ {prox.duracion} min</Badge>
              </div>
            </div>
            <button className="btn-primary" onClick={() => go("sesion", { rutinaId: prox.id })}>
              <Icon name="zap" size={18} color="var(--on-accent)" /> Empezar
            </button>
          </React.Fragment>
        )}
      </div>

      {/* Puerta 2 — elegir rutina */}
      <div>
        <p className="section-title" style={{ margin: "4px 0 8px" }}>Elegir una rutina</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.values(RUTINAS).map((r) => (
            <div key={r.id} className="rutina-card" onClick={() => go("sesion", { rutinaId: r.id })}>
              <p className="rutina-card-title">{r.nombre}</p>
              <div className="rutina-card-meta">
                <Badge kind="accent">{r.foco}</Badge><Badge kind="muted">{r.nivel}</Badge>
                <span>· {r.bloques.length} ejercicios</span><span>· ⏱ {r.duracion} min</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Puerta 3 — sesión libre */}
      <button onClick={() => go("libre")} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", background: "var(--card)", border: "1px dashed var(--border)", borderRadius: "var(--r-lg)", padding: 16, color: "inherit" }}>
        <span style={{ width: 40, height: 40, borderRadius: 10, background: "var(--accent-dim)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon name="plus" size={20} />
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 15 }}>Sesión libre</p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>Armá una sesión con los ejercicios que quieras</p>
        </div>
        <Icon name="chevron-right" size={18} color="var(--muted)" />
      </button>
    </div>
  );
}

function App() {
  const [logged, setLogged] = React.useState(false);
  const [memberId, setMemberId] = React.useState("juanpablo");
  const [screen, setScreen] = React.useState("home");
  const [params, setParams] = React.useState({});
  // Tema POR MIEMBRO — cada uno ajusta el suyo.
  const [themes, setThemes] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("su-themes")) || {}; } catch (e) { return {}; }
  });
  const DEFAULT_THEMES = { juanpablo: "ion", maria: "pulse", sofia: "indigo", federico: "volt" };
  const theme = themes[memberId] || DEFAULT_THEMES[memberId] || "ion";
  const setTheme = (t) => setThemes((prev) => ({ ...prev, [memberId]: t }));
  // Modo claro/oscuro — global, con toggle en el copete. Default oscuro.
  const [mode, setMode] = React.useState(() => localStorage.getItem("su-mode") || "dark");
  React.useEffect(() => { localStorage.setItem("su-mode", mode); }, [mode]);
  const toggleMode = () => setMode((m) => (m === "dark" ? "light" : "dark"));
  React.useEffect(() => { document.documentElement.dataset.mode = mode; document.documentElement.dataset.theme = theme; }, [mode, theme]);
  // Estilo de inicio: aurora (D9) | clasico (D2)
  const [homeVariant, setHomeVariant] = React.useState(() => localStorage.getItem("su-home") || "aurora");
  React.useEffect(() => { localStorage.setItem("su-home", homeVariant); }, [homeVariant]);
  // Programa activo POR MIEMBRO
  const [progByMember, setProgByMember] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("su-prog")) || {}; } catch (e) { return {}; }
  });
  const programaActivo = progByMember[memberId] || PROGRAMA_ACTIVO_DEFAULT[memberId] || "p_recomp";
  const setProgramaActivo = (pid) => setProgByMember((prev) => ({ ...prev, [memberId]: pid }));
  React.useEffect(() => { localStorage.setItem("su-prog", JSON.stringify(progByMember)); }, [progByMember]);

  React.useEffect(() => { window.__setMember = (id) => setMemberId(id); window.__setTheme = setTheme; }, [memberId]);
  React.useEffect(() => { localStorage.setItem("su-themes", JSON.stringify(themes)); }, [themes]);
  // refrescar iconos lucide tras cada render
  React.useEffect(() => { window.lucide && window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } }); });

  const go = (s, p = {}) => { setScreen(s); setParams(p); };

  // Toggle sol/luna del copete — presente en todas las pantallas y los 5 temas.
  const modeToggle = (
    <button onClick={toggleMode} aria-label={mode === "dark" ? "Cambiar a claro" : "Cambiar a oscuro"} style={modeToggleStyle}>
      <Icon name={mode === "dark" ? "sun" : "moon"} size={18} color="var(--fg)" />
    </button>
  );

  if (!logged) return <div className="su-app" data-theme={theme} data-mode={mode} style={appWrap}>{modeToggle}<Login onLogin={() => { setLogged(true); go("home"); }} /></div>;

  // Pantalla de sesión: fullscreen, sin nav
  if (screen === "sesion") {
    return (
      <div className="su-app" data-theme={theme} data-mode={mode} style={appWrap}>
        <EntrenarSesion rutinaId={params.rutinaId}
          onSalir={() => go("entrenar")}
          onFinalizar={() => go("historial")} />
      </div>
    );
  }

  // Sesión libre: fullscreen, sin nav
  if (screen === "libre") {
    return (
      <div className="su-app" data-theme={theme} data-mode={mode} style={appWrap}>{modeToggle}
        <SesionLibre onSalir={() => go("entrenar")} onEmpezar={() => go("sesion", { rutinaId: "r_empuje" })} />
      </div>
    );
  }

  const activeNav = SCREEN_TO_NAV[screen];
  let content = null;
  switch (screen) {
    case "home": content = <Home memberId={memberId} go={go} variant={homeVariant} activoId={programaActivo} />; break;
    case "biblioteca": content = <Biblioteca go={go} memberId={memberId} activoId={programaActivo} onActivar={setProgramaActivo} tabInicial={params.tab} />; break;
    case "rutinaDetalle": content = <RutinaDetalle rutinaId={params.rutinaId} go={go} />; break;
    case "programaDetalle": content = <ProgramaDetalle programaId={params.programaId} memberId={memberId} activoId={programaActivo} onActivar={setProgramaActivo} go={go} />; break;
    case "entrenar": content = <EntrenarLanding go={go} activoId={programaActivo} />; break;
    case "historial": content = <Historial go={go} />; break;
    case "historialDetalle": content = <HistorialDetalle id={params.id} go={go} />; break;
    case "salud": content = <Salud />; break;
    case "perfil": content = <Perfil memberId={memberId} theme={theme} onTheme={setTheme} mode={mode} onMode={setMode} homeVariant={homeVariant} onHomeVariant={setHomeVariant} onLogout={() => { setLogged(false); }} />; break;
    default: content = <Home memberId={memberId} go={go} variant={homeVariant} />;
  }

  return (
    <div className="su-app" data-theme={theme} data-mode={mode} style={appWrap}>
      {modeToggle}
      <main style={{ flex: 1, overflowY: "auto", padding: "16px 16px 78px" }}>{content}</main>
      <nav style={navStyle}>
        {NAV.map((n) => {
          const active = n.key === activeNav;
          return (
            <button key={n.key} onClick={() => go(n.screen)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: active ? "var(--accent)" : "var(--muted)", fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)" }}>
              <Icon name={n.icon} size={22} color={active ? "var(--accent)" : "var(--muted)"} />
              <span>{n.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

const appWrap = { position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "var(--bg)", overflow: "hidden" };
const modeToggleStyle = { position: "absolute", top: 10, right: 14, zIndex: 320, width: 34, height: 34, borderRadius: "50%", background: "color-mix(in srgb, var(--card) 80%, transparent)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(6px)" };
const navStyle = { height: 62, background: "var(--card)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "stretch", flexShrink: 0 };

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
