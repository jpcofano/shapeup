import { useState, useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/useAuth";
import { getPerfiles } from "../data/perfiles";
import { MemberAvatar } from "../components/MemberAvatar";
import type { MiembroId } from "../types/models";

export function Perfil() {
  const { user, memberId }      = useAuth();
  const [color, setColor]       = useState<string | undefined>(undefined);
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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Perfil</h1>
      </div>

      {/* Avatar + nombre */}
      {memberId && (
        <div className="card" style={{ display: "flex", alignItems: "center", gap: 16, padding: "20px 16px" }}>
          <MemberAvatar memberId={memberId as MiembroId} color={color} size={52} />
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 18 }}>
              {user?.displayName ?? user?.email}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
              {memberId}
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

      <button
        className="btn-secondary"
        style={{ marginTop: 16, maxWidth: 200 }}
        onClick={() => signOut(auth)}
      >
        Cerrar sesión
      </button>
    </div>
  );
}
