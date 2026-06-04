import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import type {
  BloqueEjercicio, Ejercicio, Modalidad, Prescripcion,
  FocoRutina, Objetivo, Nivel, Lugar,
} from "../types/models";
import { FOCOS_RUTINA, OBJETIVOS, NIVELES, LUGARES } from "../types/models";
import { getRutina, crearRutina, actualizarRutina, type RutinaInput } from "../data/rutinas";
import { BloqueFormItem } from "../components/rutina/BloqueFormItem";
import { ExercisePicker } from "../components/rutina/ExercisePicker";

// Prescripción por defecto según modalidad
function defaultPrescripcion(modalidad: Modalidad): Prescripcion {
  switch (modalidad) {
    case "Fuerza":     return { modalidad, series: 3, repsObjetivo: { value: 8, min: 8, max: 12, raw: "8-12" }, descansoSeg: 90 };
    case "Cardio":     return { modalidad, formato: "Continuo", duracionMin: 20 };
    case "Movilidad":  return { modalidad, rondas: 2, duracionHoldSeg: 30, porLado: false, descansoSeg: 0 };
    case "Isométrico": return { modalidad, series: 3, duracionHoldSeg: 30, porLado: false, descansoSeg: 60 };
  }
}

const NIVEL_ORDEN: Record<Nivel, number> = {
  Principiante: 1, Intermedio: 2, Avanzado: 3,
};

interface FormData {
  nombre:      string;
  foco:        FocoRutina;
  objetivo:    Objetivo;
  nivel:       Nivel;
  lugar:       Lugar;
  descripcion: string;
  notas:       string;
  calentamiento: string;
  vueltaACalma:  string;
}

const EMPTY_FORM: FormData = {
  nombre: "", foco: "Cuerpo completo", objetivo: "General / salud",
  nivel: "Intermedio", lugar: "Casa",
  descripcion: "", notas: "", calentamiento: "", vueltaACalma: "",
};

export function RutinaForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [form,    setForm]    = useState<FormData>(EMPTY_FORM);
  const [bloques, setBloques] = useState<BloqueEjercicio[]>([]);
  const [picker,  setPicker]  = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Cargar datos en modo edición
  useEffect(() => {
    if (!id) return;
    getRutina(id).then((r) => {
      if (!r.ok) { setError(r.error); return; }
      const ru = r.value;
      setForm({
        nombre: ru.nombre, foco: ru.foco, objetivo: ru.objetivo,
        nivel: ru.nivel, lugar: ru.lugar,
        descripcion: ru.descripcion ?? "", notas: ru.notas ?? "",
        calentamiento: ru.calentamiento ?? "", vueltaACalma: ru.vueltaACalma ?? "",
      });
      setBloques(ru.bloques);
    });
  }, [id]);

  function handleSelectEjercicio(ej: Ejercicio) {
    const bloque: BloqueEjercicio = {
      orden:          bloques.length + 1,
      idEjercicio:    ej.idEjercicio,
      nombreEjercicio: ej.nombre,
      modalidad:      ej.modalidad,
      prescripcion:   defaultPrescripcion(ej.modalidad),
    };
    setBloques((prev) => [...prev, bloque]);
    setPicker(false);
  }

  function updateBloque(idx: number, b: BloqueEjercicio) {
    setBloques((prev) => prev.map((x, i) => (i === idx ? b : x)));
  }

  function moveBloque(idx: number, dir: -1 | 1) {
    setBloques((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next.map((b, i) => ({ ...b, orden: i + 1 }));
    });
  }

  function deleteBloque(idx: number) {
    setBloques((prev) => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, orden: i + 1 })));
  }

  async function handleSave() {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true);
    setError(null);

    const input: RutinaInput = {
      ...form,
      nivelOrden: NIVEL_ORDEN[form.nivel],
      bloques:    bloques.map((b, i) => ({ ...b, orden: i + 1 })),
    };

    const result = isEditing
      ? await actualizarRutina(id!, input)
      : await crearRutina(input);

    if (!result.ok) { setError(result.error); setSaving(false); return; }
    navigate(isEditing ? `/biblioteca/${id}` : "/biblioteca", { replace: true });
  }

  return (
    <div className="page">
      {/* Cabecera */}
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> {isEditing ? "Detalle" : "Rutinas"}
        </button>
        <h1 className="page-title" style={{ fontSize: 18 }}>
          {isEditing ? "Editar rutina" : "Nueva rutina"}
        </h1>
      </div>

      {error && <p className="inline-error">{error}</p>}

      {/* Datos básicos */}
      <div className="card form-section">
        <p className="section-title">Información</p>

        <div className="form-field">
          <label className="form-label">Nombre *</label>
          <input className="form-input" value={form.nombre} placeholder="Ej: Fuerza A — Tren superior"
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} />
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Foco</label>
            <select className="form-select" value={form.foco}
              onChange={(e) => setForm((f) => ({ ...f, foco: e.target.value as FocoRutina }))}>
              {FOCOS_RUTINA.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Objetivo</label>
            <select className="form-select" value={form.objetivo}
              onChange={(e) => setForm((f) => ({ ...f, objetivo: e.target.value as Objetivo }))}>
              {OBJETIVOS.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label className="form-label">Nivel</label>
            <select className="form-select" value={form.nivel}
              onChange={(e) => setForm((f) => ({ ...f, nivel: e.target.value as Nivel }))}>
              {NIVELES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Lugar</label>
            <select className="form-select" value={form.lugar}
              onChange={(e) => setForm((f) => ({ ...f, lugar: e.target.value as Lugar }))}>
              {LUGARES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="form-field">
          <label className="form-label">Descripción</label>
          <textarea className="form-textarea" value={form.descripcion} placeholder="Objetivo de la sesión, cómo usarla…"
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
        </div>
      </div>

      {/* Bloques */}
      <div className="form-section">
        <p className="section-title">Ejercicios ({bloques.length})</p>

        {bloques.map((b, i) => (
          <BloqueFormItem
            key={i}
            bloque={b}
            index={i}
            total={bloques.length}
            onUpdate={(nb) => updateBloque(i, nb)}
            onMoveUp={() => moveBloque(i, -1)}
            onMoveDown={() => moveBloque(i, 1)}
            onDelete={() => deleteBloque(i)}
          />
        ))}

        <button className="btn-add-bloque" onClick={() => setPicker(true)}>
          <Plus size={16} /> Agregar ejercicio
        </button>
      </div>

      {/* Notas adicionales */}
      <div className="card form-section">
        <p className="section-title">Notas adicionales</p>
        <div className="form-field">
          <label className="form-label">Calentamiento</label>
          <textarea className="form-textarea" value={form.calentamiento}
            onChange={(e) => setForm((f) => ({ ...f, calentamiento: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="form-label">Vuelta a la calma</label>
          <textarea className="form-textarea" value={form.vueltaACalma}
            onChange={(e) => setForm((f) => ({ ...f, vueltaACalma: e.target.value }))} />
        </div>
        <div className="form-field">
          <label className="form-label">Notas</label>
          <textarea className="form-textarea" value={form.notas}
            onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))} />
        </div>
      </div>

      {/* Guardar */}
      <div className="action-bar">
        <button className="btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ flex: 1 }}
        >
          {saving ? "Guardando…" : isEditing ? "Guardar cambios" : "Crear rutina"}
        </button>
      </div>

      {/* Picker de ejercicios */}
      {picker && (
        <ExercisePicker onSelect={handleSelectEjercicio} onClose={() => setPicker(false)} />
      )}
    </div>
  );
}
