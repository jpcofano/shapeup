// ════════════════════════════════════════════════════════════════════════════
//  routes/SesionJuego.tsx — registrar un juego de VR que no cuenta (P81).
//
//  Elegís el juego y arrancás. Después, la misma pantalla de P80: el reloj en
//  grande y un solo botón, pero **sin objetivo de tiempo** — acá no hay nada
//  que cumplir. Al cerrar, ni chip de dificultad ni RPE: no hay progresión que
//  alimentar.
//
//  Lo que sí importa es la FC, y por eso la línea sobre arrancar el workout en
//  el reloj: sin eso, la sesión queda como "40 minutos de Behemoth" y no dice
//  nada.
// ════════════════════════════════════════════════════════════════════════════
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../auth/useAuth";
import { esOwner } from "../data/visibilidad";
import { getJuegosSinEjercicio, setJuegosSinEjercicio } from "../data/diccionarios";
import { agregarJuego, quitarJuego, renombrarJuego } from "../lib/juegos";
import { finalizarSesion } from "../data/historial";
import { SesionPorTiempo } from "../components/entrenar/SesionPorTiempo";
import { useWakeLock } from "../hooks/useWakeLock";

/** La sesión en curso sobrevive a un reload: el reloj no se puede perder. */
const CLAVE = "shapeup:sesion-juego";

interface EnCurso { juego: string; inicioMs: number }

function leerEnCurso(): EnCurso | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const v = JSON.parse(raw) as EnCurso;
    return typeof v?.juego === "string" && typeof v?.inicioMs === "number" ? v : null;
  } catch {
    return null;
  }
}

export function SesionJuego() {
  const navigate = useNavigate();
  const { memberId } = useAuth();
  const puedeEditar = esOwner(memberId);

  const [juegos, setJuegos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState("");
  const [editando, setEditando] = useState(false);
  const [enCurso, setEnCurso] = useState<EnCurso | null>(() => leerEnCurso());
  const [guardando, setGuardando] = useState(false);

  useWakeLock(enCurso != null);

  useEffect(() => {
    void (async () => {
      const r = await getJuegosSinEjercicio();
      if (r.ok) setJuegos(r.value); else setError(r.error);
      setCargando(false);
    })();
  }, []);

  /** Guarda la lista y la deja en pantalla solo si el servidor la aceptó. */
  async function guardarLista(lista: string[]) {
    const r = await setJuegosSinEjercicio(lista);
    if (r.ok) { setJuegos(r.value); setError(null); }
    else setError(r.error);
  }

  function empezar(juego: string) {
    const v: EnCurso = { juego, inicioMs: Date.now() };
    try { localStorage.setItem(CLAVE, JSON.stringify(v)); } catch { /* sesión privada */ }
    setEnCurso(v);
  }

  async function terminar() {
    if (!enCurso) return;
    if (!memberId) { setError("No se pudo identificar al miembro."); return; }
    const finMs = Date.now();
    setGuardando(true);
    setError(null);

    const r = await finalizarSesion({
      tipo: "juego",
      nombreJuego: enCurso.juego,
      miembro: memberId,
      bloques: [],                       // un juego no tiene series que registrar
      rpe: null,                         // ni RPE: no hay progresión que alimentar
      duracionMin: Math.round((finMs - enCurso.inicioMs) / 60_000) || null,
      ventana: { inicioMs: enCurso.inicioMs, finMs },
    });
    if (!r.ok) { setError(r.error); setGuardando(false); return; }

    try { localStorage.removeItem(CLAVE); } catch { /* sesión privada */ }
    navigate("/historial");
  }

  // ── Sesión en curso: el reloj de P80, sin objetivo ────────────────────────
  if (enCurso) {
    return (
      <div className="page">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <button className="btn-icon-sm" onClick={() => navigate("/entrenar")} title="Volver">
            <X size={18} />
          </button>
          <p style={{ margin: 0, fontWeight: 600 }}>Sesión de juego</p>
        </div>

        <SesionPorTiempo
          inicioMs={enCurso.inicioMs}
          objetivoMin={0}
          juego={enCurso.juego}
          onTerminar={() => void terminar()}
          guardando={guardando}
        />

        {error && <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>}

        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 12, textAlign: "center" }}>
          Para que quede la frecuencia cardíaca, arrancá el workout "Shape up" en el reloj.
        </p>
      </div>
    );
  }

  // ── Elegir el juego ───────────────────────────────────────────────────────
  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <button className="btn-icon-sm" onClick={() => navigate("/entrenar")} title="Volver">
          <X size={18} />
        </button>
        <p style={{ margin: 0, fontWeight: 600 }}>Sesión de juego</p>
      </div>

      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 12px 34px" }}>
        Queda en el historial y en el análisis, pero no cuenta como entrenamiento.
      </p>

      {error && <p style={{ fontSize: 13, color: "var(--danger)" }}>{error}</p>}
      {cargando && <p style={{ fontSize: 13, color: "var(--muted)" }}>Cargando…</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {juegos.map((j) => (
          <div key={j} className="card" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {editando ? (
              // Editando, el nombre es el campo: renombrar es escribir encima.
              // Se guarda al salir del campo, y solo si cambió.
              <input
                className="form-input"
                style={{ flex: 1 }}
                defaultValue={j}
                aria-label={`Renombrar ${j}`}
                onBlur={(e) => {
                  const nombre = e.target.value.trim();
                  if (!nombre || nombre === j) { e.target.value = j; return; }
                  void guardarLista(renombrarJuego(juegos, j, nombre));
                }}
              />
            ) : (
              <button
                style={{
                  flex: 1, textAlign: "left", background: "none", border: "none",
                  color: "var(--fg)", fontSize: 15, fontWeight: 600, cursor: "pointer", padding: 0,
                }}
                onClick={() => empezar(j)}
              >
                {j}
              </button>
            )}
            {editando && (
              <button
                className="btn-icon-sm"
                title={`Quitar ${j}`}
                onClick={() => void guardarLista(quitarJuego(juegos, j))}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {!cargando && juegos.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--muted)" }}>
            No hay juegos en la lista todavía.
          </p>
        )}
      </div>

      {/* La edición es del owner. La garantía está en las reglas de Firestore;
          esconder el botón es solo para no ofrecer lo que va a fallar. */}
      {puedeEditar && (
        <div style={{ marginTop: 16 }}>
          {!editando ? (
            <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditando(true)}>
              Editar la lista
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Nombre del juego"
                  value={nuevo}
                  onChange={(e) => setNuevo(e.target.value)}
                />
                <button
                  className="btn-primary"
                  style={{ fontSize: 13 }}
                  disabled={!nuevo.trim()}
                  onClick={() => { void guardarLista(agregarJuego(juegos, nuevo)); setNuevo(""); }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button className="btn-secondary" style={{ fontSize: 13 }} onClick={() => setEditando(false)}>
                Listo
              </button>
              <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
                Sacar un juego de la lista no borra sus sesiones: quedan en el historial con su nombre.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
