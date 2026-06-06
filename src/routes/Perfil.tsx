import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { Check } from "lucide-react";
import { auth } from "../firebase";
import { useAuth } from "../auth/useAuth";
import { getPerfiles } from "../data/perfiles";
import { MemberAvatar } from "../components/MemberAvatar";
import { useTheme, type ThemeName } from "../contexts/ThemeProvider";
import { MIEMBRO_IDS, type MiembroId } from "../types/models";

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
  const { user, memberId }        = useAuth();
  const { theme, setTheme }       = useTheme();
  const [color,    setColor]      = useState<string | undefined>(undefined);
  const [objetivos, setObjetivos] = useState<string[]>([]);

  useEffect(() => {
    if (!memberId) return;
    getPerfiles().then((r) => {
      if (!r.ok) return;
      const perfil = r.value[memberId];
      setColor(perfil?.color);
      setObjetivos(perfil?.objetivos ?? []);
    });
  }, [memberId]);

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

      {/* ── Cerrar sesión ────────────────────────────────────────────────── */}
      <button className="btn-secondary" onClick={() => signOut(auth)}>
        Cerrar sesión
      </button>
    </div>
  );
}
