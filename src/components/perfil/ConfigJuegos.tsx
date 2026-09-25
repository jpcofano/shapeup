import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { getJuegosSinEjercicio, setJuegosSinEjercicio } from "../../data/diccionarios";
import { agregarJuego, quitarJuego, renombrarJuego } from "../../lib/juegos";

/**
 * Juegos que se registran pero no cuentan como entrenamiento (ADR #041).
 * P86: se editaba adentro de la sesión de juego; ahora vive con el resto de la
 * configuración. Solo el owner: lo garantizan las reglas, esto solo no ofrece
 * lo que va a fallar.
 */
export function ConfigJuegos() {
  const [juegos, setJuegos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState("");

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Juegos que no cuentan como entrenamiento</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
          Quedan en el historial y en el análisis, pero no suman a la racha ni a la meta.
          Sacar uno no borra sus sesiones.
        </p>
      </div>
      {cargando && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>Cargando…</p>}
      {juegos.map((j) => (
        <div key={j} style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
          <button className="btn-icon-sm" title={`Quitar ${j}`} onClick={() => void guardarLista(quitarJuego(juegos, j))}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="form-input"
          style={{ flex: 1 }}
          placeholder="Agregar un juego"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
        />
        <button
          className="btn-secondary"
          style={{ width: "auto", padding: "6px 10px" }}
          disabled={!nuevo.trim()}
          aria-label="Agregar juego"
          onClick={() => { void guardarLista(agregarJuego(juegos, nuevo)); setNuevo(""); }}
        >
          <Plus size={16} />
        </button>
      </div>
      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
    </div>
  );
}
