import { signOut } from "firebase/auth";
import { auth } from "../firebase";

/** Se muestra cuando el usuario está autenticado pero su email no está en la whitelist. */
export function UnauthorizedScreen() {
  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>Acceso no autorizado</h1>
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
