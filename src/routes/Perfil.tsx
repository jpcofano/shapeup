import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/useAuth";

export function Perfil() {
  const { user, memberId } = useAuth();

  return (
    <div className="route-placeholder">
      <h2>Perfil</h2>
      <p>{user?.displayName ?? user?.email}</p>
      <p style={{ fontSize: 12, color: "var(--muted)" }}>
        miembro: {memberId}
      </p>
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
