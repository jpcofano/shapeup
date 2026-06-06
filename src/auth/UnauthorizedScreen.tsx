import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { ShapeUpMark } from "../components/Brand";

export function UnauthorizedScreen() {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span style={{ color: "var(--accent)", display: "block", marginBottom: 16 }}>
          <ShapeUpMark size={52} />
        </span>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, letterSpacing: "-.02em" }}>
          Acceso no autorizado
        </h1>
        <p className="auth-subtitle">
          Tu cuenta no está en la lista de miembros de ShapeUp.
          Contactá al administrador.
        </p>
        <button className="btn-secondary" onClick={() => signOut(auth)}>
          Cerrar sesión
        </button>
      </div>
    </main>
  );
}
