import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import type { Rutina, FocoRutina, Nivel, Lugar } from "../types/models";
import { FOCOS_RUTINA, NIVELES, LUGARES } from "../types/models";
import { getRutinas } from "../data/rutinas";
import { Catalogo } from "./Catalogo";

/** Filtra rutinas por foco, nivel y lugar. */
function filtrar(
  rutinas: Rutina[],
  foco:  FocoRutina | "",
  nivel: Nivel | "",
  lugar: Lugar | "",
): Rutina[] {
  return rutinas.filter((r) => {
    if (foco  && r.foco  !== foco)  return false;
    if (nivel && r.nivel !== nivel) return false;
    if (lugar && r.lugar !== lugar) return false;
    return true;
  });
}

// ── Pestaña Rutinas ───────────────────────────────────────────────────────────

function RutinasList() {
  const navigate = useNavigate();
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState<string | null>(null);
  const [foco,    setFoco]     = useState<FocoRutina | "">("");
  const [nivel,   setNivel]    = useState<Nivel | "">("");
  const [lugar,   setLugar]    = useState<Lugar | "">("");

  useEffect(() => {
    getRutinas().then((r) => {
      if (r.ok) setRutinas(r.value);
      else      setError(r.error);
      setLoading(false);
    });
  }, []);

  const visibles = filtrar(rutinas, foco, nivel, lugar);

  return (
    <>
      {/* Filtros */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FilterRow label="Foco" all="" value={foco} options={FOCOS_RUTINA} onChange={(v) => setFoco(v as FocoRutina | "")} />
        <FilterRow label="Nivel" all="" value={nivel} options={NIVELES} onChange={(v) => setNivel(v as Nivel | "")} />
        <FilterRow label="Lugar" all="" value={lugar} options={LUGARES} onChange={(v) => setLugar(v as Lugar | "")} />
      </div>

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}

      {!loading && !error && visibles.length === 0 && (
        <div className="empty-state">
          <p>{rutinas.length === 0 ? "No hay rutinas todavía." : "Sin resultados con estos filtros."}</p>
        </div>
      )}

      {visibles.map((r) => (
        <div key={r.idRutina} className="rutina-card" onClick={() => navigate(`/biblioteca/${r.idRutina}`)}>
          <p className="rutina-card-title">{r.nombre}</p>
          <div className="rutina-card-meta">
            <span className="badge badge-accent">{r.foco}</span>
            <span className="badge badge-muted">{r.nivel}</span>
            <span className="badge badge-muted">{r.lugar}</span>
            {r.duracionEstimadaMin != null && <span>⏱ {r.duracionEstimadaMin} min</span>}
            {r.totalSeries != null && <span>· {r.totalSeries} series</span>}
          </div>
        </div>
      ))}

      <button className="fab" onClick={() => navigate("/biblioteca/nueva")} title="Nueva rutina">
        <Plus size={24} />
      </button>
    </>
  );
}

// ── Pantalla con tabs Rutinas | Ejercicios ────────────────────────────────────

/** Pantalla Biblioteca con pestañas "Rutinas" y "Ejercicios" (Catálogo). */
export function Biblioteca() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "ejercicios" ? "ejercicios" : "rutinas";

  function switchTab(t: "rutinas" | "ejercicios") {
    setParams(t === "rutinas" ? {} : { tab: "ejercicios" });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{tab === "rutinas" ? "Rutinas" : "Ejercicios"}</h1>
      </div>

      {/* Pestañas */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
        {(["rutinas", "ejercicios"] as const).map((t) => (
          <button
            key={t}
            onClick={() => switchTab(t)}
            style={{
              flex: 1, padding: "10px 0", background: "none", border: "none",
              borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
              color: tab === t ? "var(--accent)" : "var(--muted)",
              fontWeight: tab === t ? 700 : 400, fontSize: 14, cursor: "pointer",
              textTransform: "capitalize", transition: "color 0.15s",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "rutinas" ? <RutinasList /> : <Catalogo />}
    </div>
  );
}

// ── Filtro de chips ───────────────────────────────────────────────────────────
function FilterRow<T extends string>({
  label, all, value, options, onChange,
}: {
  label: string;
  all: T | "";
  value: T | "";
  options: readonly T[];
  onChange: (v: T | "") => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0, width: 36 }}>
        {label}
      </span>
      <div className="filter-scroll">
        <button
          className={`filter-chip ${value === all ? "active" : ""}`}
          onClick={() => onChange(all)}
        >
          Todos
        </button>
        {options.map((opt) => (
          <button
            key={opt}
            className={`filter-chip ${value === opt ? "active" : ""}`}
            onClick={() => onChange(value === opt ? all : opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
