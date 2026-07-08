import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { Check, Download, Share } from "lucide-react";
import { auth } from "../firebase";
import { useAuth } from "../auth/useAuth";
import { getPerfiles } from "../data/perfiles";
import { MemberAvatar } from "../components/MemberAvatar";
import { useTheme, type ThemeName } from "../contexts/ThemeProvider";
import { useInstallPrompt } from "../hooks/useInstallPrompt";
import { MIEMBRO_IDS, type MiembroId } from "../types/models";
import { getHomeLayout, setHomeLayout, type HomeLayout } from "../lib/homeLayout";
import {
  getHomeReduxPrefs, setHomeReduxModo, setHomeReduxAcento, resolverModo,
  type HomeReduxModo, type HomeReduxAcento,
} from "../lib/homeReduxPrefs";

const REDUX_ACENTOS: { name: HomeReduxAcento; dark: string; light: string; label: string }[] = [
  { name: "ion",    dark: "#22d3ee", light: "#0e7490", label: "Ion"    },
  { name: "volt",   dark: "#4ade80", light: "#15803d", label: "Volt"   },
  { name: "blaze",  dark: "#ff7a45", light: "#c2410c", label: "Blaze"  },
  { name: "indigo", dark: "#8b90ff", light: "#4f46e5", label: "Indigo" },
  { name: "pulse",  dark: "#ff4d79", light: "#be185c", label: "Pulse"  },
];

const NOMBRES: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};

const TEMAS: { name: ThemeName; color: string; label: string }[] = [
  { name: "ion",     color: "#22d3ee", label: "Ion"     },
  { name: "volt",    color: "#4ade80", label: "Volt"    },
  { name: "solar",   color: "#f5b62b", label: "Solar"   },
  { name: "blaze",   color: "#ff7a45", label: "Blaze"   },
  { name: "crimson", color: "#fb3b53", label: "Crimson" },
  { name: "pulse",   color: "#ff4d79", label: "Pulse"   },
  { name: "grape",   color: "#b15cff", label: "Grape"   },
  { name: "indigo",  color: "#7c83ff", label: "Indigo"  },
];

export function Perfil() {
  const { user, memberId }              = useAuth();
  const { theme, setTheme }             = useTheme();
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [color,    setColor]      = useState<string | undefined>(undefined);
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [homeLayout, setHomeLayoutState] = useState<HomeLayout>("aurora");
  const [reduxModo,   setReduxModoState]   = useState<HomeReduxModo>("system");
  const [reduxAcento, setReduxAcentoState] = useState<HomeReduxAcento>("ion");

  useEffect(() => {
    if (!memberId) return;
    setHomeLayoutState(getHomeLayout(memberId));
    const prefs = getHomeReduxPrefs(memberId);
    setReduxModoState(prefs.modo);
    setReduxAcentoState(prefs.acento);
    getPerfiles().then((r) => {
      if (!r.ok) return;
      const perfil = r.value[memberId];
      setColor(perfil?.color);
      setObjetivos(perfil?.objetivos ?? []);
    });
  }, [memberId]);

  function handleLayout(l: HomeLayout) {
    if (!memberId) return;
    setHomeLayoutState(l);
    setHomeLayout(memberId, l);
  }

  function handleReduxModo(m: HomeReduxModo) {
    if (!memberId) return;
    setReduxModoState(m);
    setHomeReduxModo(memberId, m);
  }

  function handleReduxAcento(a: HomeReduxAcento) {
    if (!memberId) return;
    setReduxAcentoState(a);
    setHomeReduxAcento(memberId, a);
  }

  const reduxDireccionClass = homeLayout === "pulse" ? "dir-a" : "dir-c v21";
  const reduxModoEfectivo = resolverModo(reduxModo);
  const reduxAcentoObj = REDUX_ACENTOS.find((a) => a.name === reduxAcento)!;
  const reduxAcentoHex = reduxModoEfectivo === "dark" ? reduxAcentoObj.dark : reduxAcentoObj.light;

  const nombre = memberId ? NOMBRES[memberId as MiembroId] : (user?.displayName ?? "");

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Perfil</h1>
      </div>

      {/* ── Info del miembro ─────────────────────────────────────────────── */}
      {memberId && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 16px" }}>
          <MemberAvatar memberId={memberId as MiembroId} color={color} size={52} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>{nombre}</p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {user?.email}
            </p>
            {objetivos.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
                {objetivos.map((o) => (
                  <span key={o} className="badge badge-accent">{o}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Selector de tema ─────────────────────────────────────────────── */}
      {memberId && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p className="section-title" style={{ margin: "0 0 2px" }}>Tema</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Solo para {NOMBRES[memberId as MiembroId]}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {TEMAS.map((t) => {
              const activo = theme === t.name;
              return (
                <button
                  key={t.name}
                  onClick={() => setTheme(t.name)}
                  title={t.label}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                  }}
                >
                  <span style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: t.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: activo
                      ? `0 0 0 3px var(--bg), 0 0 0 5px ${t.color}`
                      : "none",
                    transition: "box-shadow 0.15s",
                  }}>
                    {activo && <Check size={18} color="#fff" strokeWidth={2.5} />}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: activo ? 700 : 400,
                    color: activo ? "var(--accent)" : "var(--muted)",
                    letterSpacing: "0.02em",
                  }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Estilo de inicio ─────────────────────────────────────────────── */}
      {memberId && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <p className="section-title" style={{ margin: "0 0 2px" }}>Estilo de inicio</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              Solo para {NOMBRES[memberId as MiembroId]}
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {([
              { id: "aurora",  label: "Aurora",   desc: "Anillo de progreso + glass card" },
              { id: "stadium", label: "Stadium",  desc: "Marquesina grande + tira de stats" },
              { id: "clasico", label: "Clásico",  desc: "Tarjetas simples y limpias" },
              { id: "pulse",   label: "Pulse",    desc: "Enérgico · anillo segmentado, claro/oscuro/sistema" },
              { id: "premium", label: "Premium",  desc: "Minimalista contemporáneo · claro/oscuro/sistema" },
            ] as { id: HomeLayout; label: string; desc: string }[]).map((opt) => {
              const active = homeLayout === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleLayout(opt.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    background: active ? "var(--accent-dim)" : "var(--card-hover)",
                    border: active ? "1.5px solid var(--accent)" : "1.5px solid transparent",
                    borderRadius: "var(--r-sm)", cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: active ? "var(--accent)" : "var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    {active && <Check size={13} color="var(--on-accent)" strokeWidth={2.5} />}
                  </span>
                  <div style={{ textAlign: "left" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: active ? "var(--accent)" : "var(--fg)" }}>{opt.label}</p>
                    <p style={{ margin: 0, fontSize: 11, color: "var(--muted)" }}>{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Apariencia (Pulse/Premium) ───────────────────────────────────── */}
      {memberId && (homeLayout === "pulse" || homeLayout === "premium") && (
        <div className={reduxDireccionClass} data-mode={reduxModoEfectivo} data-accent={reduxAcento}>
          <div className="c-card" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <p className="section-title" style={{ margin: 0, color: "var(--fg)" }}>Apariencia</p>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "var(--muted)" }}>
              Solo para {NOMBRES[memberId as MiembroId]} · layout {homeLayout === "pulse" ? "Pulse" : "Premium"}
            </p>

            <div className="cfg-seg">
              {([
                { id: "light",  label: "Claro"   },
                { id: "dark",   label: "Oscuro"  },
                { id: "system", label: "Sistema" },
              ] as { id: HomeReduxModo; label: string }[]).map((m) => (
                <button key={m.id} className={reduxModo === m.id ? "on" : ""} onClick={() => handleReduxModo(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>

            <div className="cfg-sws" style={{ marginTop: 14 }}>
              {REDUX_ACENTOS.map((a) => (
                <button
                  key={a.name}
                  className={`cfg-sw ${reduxAcento === a.name ? "on" : ""}`}
                  title={a.label}
                  onClick={() => handleReduxAcento(a.name)}
                >
                  <span className="dot" style={{ background: reduxModoEfectivo === "dark" ? a.dark : a.light }} />
                </button>
              ))}
            </div>

            <div className="cfg-preview">
              <svg width={44} height={44} viewBox="0 0 44 44">
                <circle cx={22} cy={22} r={17} fill="none" stroke="var(--track)" strokeWidth={6} />
                <g transform="rotate(-90 22 22)">
                  <circle cx={22} cy={22} r={17} fill="none" stroke={reduxAcentoHex} strokeWidth={6} strokeLinecap="round" strokeDasharray="53 107" />
                </g>
              </svg>
              <button className={homeLayout === "pulse" ? "a-btn1" : "c-btn1"} style={{ padding: "9px 14px" }}>
                Entrenar
              </button>
              <span className="plab">Preview</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Familia ──────────────────────────────────────────────────────── */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p className="section-title" style={{ margin: 0 }}>Familia</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {MIEMBRO_IDS.map((id) => (
            <div key={id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ opacity: id === memberId ? 1 : 0.5 }}>
                <MemberAvatar memberId={id} size={36} />
              </span>
              <span style={{
                fontSize: 11, color: id === memberId ? "var(--accent)" : "var(--muted)",
                fontWeight: id === memberId ? 700 : 400,
              }}>
                {NOMBRES[id]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Instalar app ─────────────────────────────────────────────────── */}
      {!isInstalled && canInstall && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{
            width: 42, height: 42, borderRadius: 12,
            background: "var(--accent-dim)", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent)",
          }}>
            <Download size={20} />
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>Instalar app</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Agregá ShapeUp a tu pantalla de inicio
            </p>
          </div>
          <button className="btn-primary" style={{ width: "auto", padding: "10px 16px" }} onClick={promptInstall}>
            Instalar
          </button>
        </div>
      )}

      {/* Hint para iOS (Safari no dispara beforeinstallprompt) */}
      {!isInstalled && isIOS && !canInstall && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "var(--accent)", flexShrink: 0 }}>
            <Share size={20} />
          </span>
          <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
            En iPhone: tocá <strong style={{ color: "var(--fg)" }}>Compartir</strong> → <strong style={{ color: "var(--fg)" }}>Agregar a inicio</strong>
          </p>
        </div>
      )}

      {/* ── Cerrar sesión ────────────────────────────────────────────────── */}
      <button className="btn-secondary" onClick={() => signOut(auth)}>
        Cerrar sesión
      </button>

      {/* ── Versión del build (diagnóstico de PWA cacheada) ─────────────── */}
      <p style={{ textAlign: "center", fontSize: 10, color: "var(--muted)", margin: "4px 0 0", opacity: 0.5 }}>
        v{__APP_VERSION__} · {__BUILD_DATE__}
      </p>
    </div>
  );
}
