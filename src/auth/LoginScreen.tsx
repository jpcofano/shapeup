import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { LogIn } from "lucide-react";
import { auth } from "../firebase";
import { ShapeUpMark, ShapeUpWordmark } from "../components/Brand";

const provider = new GoogleAuthProvider();

export function LoginScreen() {
  async function handleLogin() {
    await signInWithPopup(auth, provider);
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <span style={{ color: "var(--accent)", display: "block", marginBottom: 16 }}>
          <ShapeUpMark size={52} />
        </span>
        <h1 style={{ margin: "0 0 4px", fontSize: 32, fontWeight: 800, letterSpacing: "-.02em" }}>
          <ShapeUpWordmark size={28} />
        </h1>
        <p className="auth-subtitle">Tu plan para ponerte en forma</p>
        <button className="btn-primary" onClick={handleLogin}>
          <LogIn size={18} /> Entrar con Google
        </button>
        <p style={{ marginTop: 18, fontSize: 11, color: "var(--muted)" }}>
          Acceso solo para miembros de la familia
        </p>
      </div>
    </main>
  );
}
