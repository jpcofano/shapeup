import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();

/** Pantalla de login con Google. Se muestra cuando no hay sesión activa. */
export function LoginScreen() {
  async function handleLogin() {
    await signInWithPopup(auth, provider);
  }

  return (
    <main className="auth-screen">
      <div className="auth-card">
        <h1>ShapeUp</h1>
        <p className="auth-subtitle">Tu plan para ponerte en forma</p>
        <button className="btn-primary" onClick={handleLogin}>
          Entrar con Google
        </button>
      </div>
    </main>
  );
}
