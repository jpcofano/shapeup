import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type {
  Modalidad, GrupoMuscular, Equipo, Nivel, PatronMovimiento,
} from "../types/models";
import {
  MODALIDADES, GRUPOS_MUSCULARES, EQUIPOS, NIVELES, PATRONES_MOVIMIENTO,
} from "../types/models";
import {
  getEjercicio, crearEjercicio, actualizarEjercicio, type EjercicioInput,
} from "../data/ejercicios";

// Parsea un textarea (una entrada por línea) a string[].
function parseLines(s: string): string[] {
  return s.split("\n").map((l) => l.trim()).filter(Boolean);
}

interface FormData {
  nombre:              string;
  modalidad:           Modalidad;
  patron:              PatronMovimiento;
  grupoMuscularPrimario: GrupoMuscular;
  gruposSecundarios:   string;   // textarea — una por línea
  equipo:              Equipo[];
  nivel:               Nivel;
  instrucciones:       string;   // textarea
  puntosClave:         string;   // textarea
  erroresComunes:      string;   // textarea
  consejosSeguridad:   string;   // textarea
  descansoSugeridoSeg: number;
  unilateral:          boolean;
}

const EMPTY_FORM: FormData = {
  nombre: "",
  modalidad: "Fuerza",
  patron: "Empuje horizontal",
  grupoMuscularPrimario: "Pecho",
  gruposSecundarios: "",
  equipo: [],
  nivel: "Intermedio",
  instrucciones: "",
  puntosClave: "",
  erroresComunes: "",
  consejosSeguridad: "",
  descansoSugeridoSeg: 90,
  unilateral: false,
};

/** Formulario de alta y edición de ejercicio (solo para el owner). */
export function EjercicioForm() {
  const { id }     = useParams<{ id: string }>();
  const navigate   = useNavigate();
  const isEditing  = !!id;

  const [form,    setForm]    = useState<FormData>(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getEjercicio(id).then((r) => {
      if (!r.ok) { setError(r.error); setLoading(false); return; }
      const ej = r.value;
      setForm({
        nombre:              ej.nombre,
        modalidad:           ej.modalidad,
        patron:              ej.patron,
        grupoMuscularPrimario: ej.grupoMuscularPrimario,
        gruposSecundarios:   ej.gruposSecundarios.join("\n"),
        equipo:              ej.equipo,
        nivel:               ej.nivel,
        instrucciones:       ej.instrucciones.join("\n"),
        puntosClave:         ej.puntosClave.join("\n"),
        erroresComunes:      ej.erroresComunes.join("\n"),
        consejosSeguridad:   (ej.consejosSeguridad ?? []).join("\n"),
        descansoSugeridoSeg: ej.descansoSugeridoSeg,
        unilateral:          ej.unilateral,
      });
      setLoading(false);
    });
  }, [id]);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleEquipo(e: Equipo) {
    setForm((f) => ({
      ...f,
      equipo: f.equipo.includes(e) ? f.equipo.filter((x) => x !== e) : [...f.equipo, e],
    }));
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError(null);

    const input: EjercicioInput = {
      nombre:              form.nombre.trim(),
      modalidad:           form.modalidad,
      patron:              form.patron,
      grupoMuscularPrimario: form.grupoMuscularPrimario,
      gruposSecundarios:   parseLines(form.gruposSecundarios) as GrupoMuscular[],
      equipo:              form.equipo,
      nivel:               form.nivel,
      instrucciones:       parseLines(form.instrucciones),
      puntosClave:         parseLines(form.puntosClave),
      erroresComunes:      parseLines(form.erroresComunes),
      consejosSeguridad:   parseLines(form.consejosSeguridad),
      descansoSugeridoSeg: form.descansoSugeridoSeg,
      unilateral:          form.unilateral,
      sinonimos:           [],
      origen:              "manual",
    };

    const result = isEditing
      ? await actualizarEjercicio(id!, input)
      : await crearEjercicio(input);

    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    navigate("/catalogo");
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="page">
      {/* Encabezado */}
      <div className="page-header">
        <button className="btn-icon" onClick={() => navigate(-1)} title="Volver">
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">{isEditing ? "Editar ejercicio" : "Nuevo ejercicio"}</h1>
      </div>

      {error && <p className="inline-error">{error}</p>}

      <div className="form-section">
        {/* Nombre */}
        <label className="form-label">Nombre *</label>
        <input
          className="form-input"
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          placeholder="Ej. Press de banca"
        />

        {/* Modalidad */}
        <label className="form-label" style={{ marginTop: 12 }}>Modalidad</label>
        <select className="form-input" value={form.modalidad} onChange={(e) => set("modalidad", e.target.value as Modalidad)}>
          {MODALIDADES.map((m) => <option key={m}>{m}</option>)}
        </select>

        {/* Patrón */}
        <label className="form-label" style={{ marginTop: 12 }}>Patrón de movimiento</label>
        <select className="form-input" value={form.patron} onChange={(e) => set("patron", e.target.value as PatronMovimiento)}>
          {PATRONES_MOVIMIENTO.map((p) => <option key={p}>{p}</option>)}
        </select>

        {/* Grupo primario */}
        <label className="form-label" style={{ marginTop: 12 }}>Grupo muscular primario</label>
        <select className="form-input" value={form.grupoMuscularPrimario} onChange={(e) => set("grupoMuscularPrimario", e.target.value as GrupoMuscular)}>
          {GRUPOS_MUSCULARES.map((g) => <option key={g}>{g}</option>)}
        </select>

        {/* Grupos secundarios */}
        <label className="form-label" style={{ marginTop: 12 }}>Grupos secundarios <span style={{ color: "var(--muted)", fontWeight: 400 }}>(uno por línea)</span></label>
        <textarea
          className="form-input"
          rows={3}
          value={form.gruposSecundarios}
          onChange={(e) => set("gruposSecundarios", e.target.value)}
          placeholder={"Tríceps\nHombros"}
        />

        {/* Nivel */}
        <label className="form-label" style={{ marginTop: 12 }}>Nivel</label>
        <select className="form-input" value={form.nivel} onChange={(e) => set("nivel", e.target.value as Nivel)}>
          {NIVELES.map((n) => <option key={n}>{n}</option>)}
        </select>

        {/* Equipo */}
        <label className="form-label" style={{ marginTop: 12 }}>Equipo necesario</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {EQUIPOS.map((e) => (
            <button
              key={e}
              className={`filter-chip ${form.equipo.includes(e) ? "active" : ""}`}
              onClick={() => toggleEquipo(e)}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Descanso */}
        <label className="form-label" style={{ marginTop: 12 }}>Descanso sugerido (seg)</label>
        <input
          className="form-input"
          type="number"
          min={0}
          step={15}
          value={form.descansoSugeridoSeg}
          onChange={(e) => set("descansoSugeridoSeg", Number(e.target.value))}
        />

        {/* Unilateral */}
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={form.unilateral} onChange={(e) => set("unilateral", e.target.checked)} />
          <span className="form-label" style={{ margin: 0 }}>Ejercicio unilateral (por lado)</span>
        </label>

        {/* Instrucciones */}
        <label className="form-label" style={{ marginTop: 16 }}>Instrucciones de ejecución <span style={{ color: "var(--muted)", fontWeight: 400 }}>(una por línea)</span></label>
        <textarea
          className="form-input"
          rows={5}
          value={form.instrucciones}
          onChange={(e) => set("instrucciones", e.target.value)}
          placeholder={"Tumbado en el banco...\nAgarra la barra..."}
        />

        {/* Puntos clave */}
        <label className="form-label" style={{ marginTop: 12, color: "var(--accent)" }}>Puntos clave <span style={{ color: "var(--muted)", fontWeight: 400 }}>(una por línea)</span></label>
        <textarea
          className="form-input"
          rows={3}
          value={form.puntosClave}
          onChange={(e) => set("puntosClave", e.target.value)}
          placeholder={"Retrae escápulas...\nCodos a 45°..."}
        />

        {/* Errores comunes */}
        <label className="form-label" style={{ marginTop: 12, color: "var(--warning)" }}>Errores comunes <span style={{ color: "var(--muted)", fontWeight: 400 }}>(una por línea)</span></label>
        <textarea
          className="form-input"
          rows={3}
          value={form.erroresComunes}
          onChange={(e) => set("erroresComunes", e.target.value)}
          placeholder={"No arquear la espalda...\nNo rebotar el pecho..."}
        />

        {/* Consejos de seguridad */}
        <label className="form-label" style={{ marginTop: 12, color: "var(--danger)" }}>Consejos de seguridad <span style={{ color: "var(--muted)", fontWeight: 400 }}>(opcional, una por línea)</span></label>
        <textarea
          className="form-input"
          rows={2}
          value={form.consejosSeguridad}
          onChange={(e) => set("consejosSeguridad", e.target.value)}
          placeholder={"Usar collar de seguridad..."}
        />
      </div>

      {/* Guardar */}
      <button
        className="btn-primary"
        style={{ marginTop: 20 }}
        disabled={saving}
        onClick={guardar}
      >
        {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear ejercicio"}
      </button>
    </div>
  );
}
