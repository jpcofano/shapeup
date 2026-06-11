import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import type { Rutina, Programa, FocoRutina, Nivel, Lugar, MiembroId } from "../types/models";
import { FOCOS_RUTINA, NIVELES, LUGARES } from "../types/models";
import { getRutinas } from "../data/rutinas";
import { getProgramas, getProgramaActivo } from "../data/programas";
import { getVisibilidad, programaVisible } from "../data/visibilidad";
import { useAuth } from "../auth/useAuth";
import { Catalogo } from "./Catalogo";
import { VistaSemanal } from "../components/VistaSemanal";
import { TabBar } from "../components/TabBar";

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

// ── Tab Programas ─────────────────────────────────────────────────────────────

function ProgramasList() {
  const navigate     = useNavigate();
  const { memberId } = useAuth();

  const [programas, setProgramas] = useState<Programa[]>([]);
  const [activoId,  setActivoId]  = useState<string | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!memberId) return;
    Promise.all([
      getProgramas(),
      getProgramaActivo(memberId as MiembroId),
      getVisibilidad(memberId as MiembroId),
    ]).then(([progR, activoR, visR]) => {
      if (!progR.ok) { setError(progR.error); setLoading(false); return; }
      const vis = visR.ok ? visR.value : null;
      const visibles = progR.value.filter((p) => programaVisible(p.idPrograma, vis));
      setProgramas(visibles);
      if (activoR.ok && activoR.value) setActivoId(activoR.value.idPrograma);
      setLoading(false);
    });
  }, [memberId]);

  if (loading) return <div className="empty-state"><div className="spinner" /></div>;
  if (error)   return <p className="inline-error">{error}</p>;
  if (programas.length === 0) return (
    <div className="empty-state"><p>No tenés programas asignados todavía.</p></div>
  );

  return (
    <div className="card-list">
      {programas.map((p) => {
        const activos   = p.dias.filter((d) => d.tipo !== "descanso");
        const descansos = p.dias.filter((d) => d.tipo === "descanso");
        const esActivo  = p.idPrograma === activoId;
        return (
          <div
            key={p.idPrograma}
            className="card"
            style={{
              cursor: "pointer",
              borderColor: esActivo ? "var(--accent)" : undefined,
              borderWidth: esActivo ? 1.5 : undefined,
            }}
            onClick={() => navigate(`/programa/${p.idPrograma}`)}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <div>
                <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: 16, letterSpacing: "-.01em" }}>
                  {p.nombre}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  <span className="badge badge-muted">{p.objetivo}</span>
                  <span className="badge badge-muted">{p.nivel}</span>
                  <span className="badge badge-muted">{activos.length} días/sem</span>
                  {descansos.length > 0 && (
                    <span className="badge badge-muted">{descansos.length} desc.</span>
                  )}
                </div>
              </div>
              {esActivo && (
                <span className="badge badge-accent" style={{ flexShrink: 0, fontSize: 11 }}>Activo</span>
              )}
            </div>
            <VistaSemanal dias={p.dias} size="sm" />
          </div>
        );
      })}
    </div>
  );
}

// ── Tab Rutinas ───────────────────────────────────────────────────────────────

function RutinasList() {
  const navigate    = useNavigate();
  const { memberId } = useAuth();
  const isOwner     = memberId === "juanpablo";

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
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FilterRow label="Foco"  all="" value={foco}  options={FOCOS_RUTINA} onChange={(v) => setFoco(v as FocoRutina | "")} />
        <FilterRow label="Nivel" all="" value={nivel} options={NIVELES}      onChange={(v) => setNivel(v as Nivel | "")} />
        <FilterRow label="Lugar" all="" value={lugar} options={LUGARES}      onChange={(v) => setLugar(v as Lugar | "")} />
      </div>

      {loading && <div className="empty-state"><div className="spinner" /></div>}
      {error   && <p className="inline-error">{error}</p>}

      {!loading && !error && visibles.length === 0 && (
        <div className="empty-state">
          <p>{rutinas.length === 0 ? "No hay rutinas todavía." : "Sin resultados con estos filtros."}</p>
        </div>
      )}

      <div className="card-list">
        {visibles.map((r) => (
          <div key={r.idRutina} className="rutina-card" onClick={() => navigate(`/biblioteca/${r.idRutina}`)}>
            <p className="rutina-card-title">{r.nombre}</p>
            <div className="rutina-card-meta">
              <span className="badge badge-accent">{r.foco}</span>
              <span className="badge badge-muted">{r.nivel}</span>
              {r.duracionEstimadaMin != null && (
                <span className="badge badge-muted">⏱ {r.duracionEstimadaMin} min</span>
              )}
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {r.bloques.length} ejercicio{r.bloques.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ))}
      </div>

      {isOwner && (
        <button className="fab" onClick={() => navigate("/biblioteca/nueva")} title="Nueva rutina">
          <Plus size={24} />
        </button>
      )}
    </>
  );
}

// ── Pantalla con tabs Programas | Rutinas | Ejercicios ────────────────────────

type LibTab = "programas" | "rutinas" | "ejercicios";

export function Biblioteca() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const tab: LibTab = raw === "ejercicios" ? "ejercicios" : raw === "rutinas" ? "rutinas" : "programas";

  function switchTab(t: LibTab) {
    setParams(t === "programas" ? {} : { tab: t });
  }

  const TABS: { key: LibTab; label: string }[] = [
    { key: "programas",  label: "Programas" },
    { key: "rutinas",    label: "Rutinas" },
    { key: "ejercicios", label: "Ejercicios" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Biblioteca</h1>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={switchTab} />

      {tab === "programas"  && <ProgramasList />}
      {tab === "rutinas"    && <RutinasList />}
      {tab === "ejercicios" && <Catalogo embedded />}
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
        <button className={`filter-chip ${value === all ? "active" : ""}`} onClick={() => onChange(all)}>
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
