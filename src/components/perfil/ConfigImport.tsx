import { useEffect, useState } from "react";
import { getConfigImport, setConfigImport, CONFIG_IMPORT_DEFAULT, type ConfigImport as Config } from "../../data/configImport";
import { validarDuracionMinima } from "../../lib/configuracion";

/**
 * Cuánto tiene que durar una actividad del reloj para entrar al historial
 * (ADR #020, /config/import). P86: antes solo se cambiaba desde la consola.
 *
 * `actividadesSiempreRelevantes` **no se ofrece a propósito**: desde P75 la
 * regla 5 de `clasificarImport` deja entrar cualquier actividad que llegue al
 * mínimo, y la regla 4 (la de la lista) exige el mismo mínimo. La lista solo
 * cambia el texto del motivo, no el destino. Un ajuste que no hace nada no va
 * en la pantalla. Se conserva lo que haya en el documento.
 */
export function ConfigImport() {
  const [original, setOriginal] = useState<Config | null>(null);
  const [duracion, setDuracion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cargar(c: Config) {
    setOriginal(c);
    setDuracion(String(c.duracionMinimaMin));
  }

  useEffect(() => {
    void getConfigImport().then((r) => { if (r.ok) cargar(r.value); else setError(r.error); });
  }, []);

  const duracionNum = Number(duracion);
  const errorDuracion = duracion.trim() === "" ? "Completá la duración." : validarDuracionMinima(duracionNum);
  const hayCambios = original != null && duracionNum !== original.duracionMinimaMin;

  async function guardar() {
    if (errorDuracion || !original) return;
    setGuardando(true); setError(null); setAviso(null);
    const r = await setConfigImport({ ...original, duracionMinimaMin: duracionNum });
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }
    cargar(r.value);
    setAviso("Guardado. Vale para los próximos imports y sincronizaciones.");
  }

  if (!original) {
    return error ? <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p> : null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Actividades del reloj en el historial</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
          Entran siempre las marcadas como ShapeUp, las que coinciden con una sesión de la
          app y las de VR. Las demás, si duran al menos esto. Todas se guardan igual en Salud.
        </p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <label htmlFor="dur-min" style={{ fontSize: 12, color: "var(--muted)" }}>Duración mínima</label>
        <input
          id="dur-min" type="number" inputMode="numeric" className="form-input" style={{ maxWidth: 80 }}
          value={duracion} onChange={(e) => setDuracion(e.target.value)}
        />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          min · por defecto {CONFIG_IMPORT_DEFAULT.duracionMinimaMin}
        </span>
      </div>
      {errorDuracion && <p style={{ margin: 0, fontSize: 11, color: "var(--warning)" }}>{errorDuracion}</p>}
      <button className="btn-primary" disabled={!hayCambios || !!errorDuracion || guardando} onClick={() => void guardar()}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
      {aviso && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{aviso}</p>}
    </div>
  );
}
