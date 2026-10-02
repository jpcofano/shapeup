import { useEffect, useState } from "react";
import type { ConfigProgresion as Config } from "../../types/models";
import { getConfigProgresion, setConfigProgresion } from "../../data/configProgresion";
import { CONFIG_PROGRESION_DEFAULT, validarConfigProgresion } from "../../lib/escalonesVR";

/**
 * Los números de la regla de progresión de las rutinas de VR (P98, ADR #046),
 * en `/config/progresion`. El umbral es **provisorio**: un punto de partida para
 * revisar después de un mes con datos reales, no un dato medido.
 */
export function ConfigProgresion() {
  const [original, setOriginal] = useState<Config | null>(null);
  const [umbral, setUmbral] = useState("");
  const [sesiones, setSesiones] = useState("");
  const [semanas, setSemanas] = useState("");
  const [fraccion, setFraccion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  function cargar(c: Config) {
    setOriginal(c);
    setUmbral(String(c.umbralFcBpm));
    setSesiones(String(c.sesionesMinimas));
    setSemanas(String(c.semanasMinimas));
    setFraccion(String(Math.round(c.fraccionTiempo * 100)));
  }

  useEffect(() => {
    void getConfigProgresion().then((r) => { if (r.ok) cargar(r.value); else setError(r.error); });
  }, []);

  const borrador: Config = {
    umbralFcBpm: Number(umbral),
    sesionesMinimas: Number(sesiones),
    semanasMinimas: Number(semanas),
    fraccionTiempo: Number(fraccion) / 100,
  };
  const vacio = [umbral, sesiones, semanas, fraccion].some((v) => v.trim() === "");
  const errorCampos = vacio ? "Completá los cuatro valores." : validarConfigProgresion(borrador);
  const hayCambios = original != null && JSON.stringify(borrador) !== JSON.stringify(original);

  async function guardar() {
    if (errorCampos || !original) return;
    setGuardando(true); setError(null); setAviso(null);
    const r = await setConfigProgresion(borrador);
    setGuardando(false);
    if (!r.ok) { setError(r.error); return; }
    cargar(r.value);
    setAviso("Guardado. Vale para la próxima vez que se evalúe la regla.");
  }

  if (!original) {
    return error ? <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p> : null;
  }

  const campo = (id: string, label: string, valor: string, set: (v: string) => void, unidad: string, def: number) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <label htmlFor={id} style={{ fontSize: 12, color: "var(--muted)", minWidth: 120 }}>{label}</label>
      <input
        id={id} type="number" inputMode="numeric" className="form-input" style={{ maxWidth: 80 }}
        value={valor} onChange={(e) => set(e.target.value)}
      />
      <span style={{ fontSize: 12, color: "var(--muted)" }}>{unidad} · por defecto {def}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Progresión de las rutinas de VR</p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--muted)" }}>
          Se propone subir de escalón cuando la FC media baja al menos el umbral, con suficientes
          sesiones completadas. El umbral es provisorio: revisalo después de un mes con datos.
        </p>
      </div>
      {campo("prog-umbral", "Umbral de FC", umbral, setUmbral, "latidos", CONFIG_PROGRESION_DEFAULT.umbralFcBpm)}
      {campo("prog-sesiones", "Sesiones mínimas", sesiones, setSesiones, "por escalón", CONFIG_PROGRESION_DEFAULT.sesionesMinimas)}
      {campo("prog-semanas", "Semanas mínimas", semanas, setSemanas, "distintas", CONFIG_PROGRESION_DEFAULT.semanasMinimas)}
      {campo("prog-fraccion", "Tiempo para completar", fraccion, setFraccion, "% del prescripto", Math.round(CONFIG_PROGRESION_DEFAULT.fraccionTiempo * 100))}
      {errorCampos && <p style={{ margin: 0, fontSize: 11, color: "var(--warning)" }}>{errorCampos}</p>}
      <button className="btn-primary" disabled={!hayCambios || !!errorCampos || guardando} onClick={() => void guardar()}>
        {guardando ? "Guardando…" : "Guardar"}
      </button>
      {error && <p style={{ margin: 0, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
      {aviso && <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{aviso}</p>}
    </div>
  );
}
