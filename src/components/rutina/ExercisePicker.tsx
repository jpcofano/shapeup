import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import type { Ejercicio, Modalidad } from "../../types/models";
import { MODALIDADES } from "../../types/models";
import { getEjercicios } from "../../data/ejercicios";
import { filtrarEjercicios } from "../../lib/filtros";

interface Props {
  onSelect: (ejercicio: Ejercicio) => void;
  onClose: () => void;
}

/** Bottom-sheet para buscar y seleccionar un ejercicio del catálogo. */
export function ExercisePicker({ onSelect, onClose }: Props) {
  const [todos, setTodos] = useState<Ejercicio[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad | "">("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEjercicios().then((r) => {
      if (r.ok) setTodos(r.value);
      setLoading(false);
    });
  }, []);

  const visibles = filtrarEjercicios(todos, {
    busqueda:  busqueda || undefined,
    modalidad: modalidad || undefined,
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera */}
        <div className="modal-header">
          <span>Elegir ejercicio</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Buscador */}
        <div className="modal-search">
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Buscar ejercicio…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Filtro por modalidad */}
        <div className="modal-filters">
          <div className="filter-scroll">
            <button
              className={`filter-chip ${modalidad === "" ? "active" : ""}`}
              onClick={() => setModalidad("")}
            >
              Todos
            </button>
            {MODALIDADES.map((m) => (
              <button
                key={m}
                className={`filter-chip ${modalidad === m ? "active" : ""}`}
                onClick={() => setModalidad(modalidad === m ? "" : m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="modal-list">
          {loading && (
            <div className="empty-state"><div className="spinner" /></div>
          )}
          {!loading && visibles.length === 0 && (
            <div className="empty-state"><p>Sin resultados para "{busqueda}"</p></div>
          )}
          {!loading && visibles.map((ej) => (
            <div key={ej.idEjercicio} className="exercise-item" onClick={() => onSelect(ej)}>
              <div className="exercise-item-main">
                <p className="exercise-item-name">{ej.nombre}</p>
                <p className="exercise-item-meta">
                  {ej.modalidad} · {ej.grupoMuscularPrimario} · {ej.nivel}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
