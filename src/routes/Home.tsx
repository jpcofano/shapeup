import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Flame } from "lucide-react";
import type { Programa, DiaPrograma, Rutina, Historial } from "../types/models";
import type { MiembroId } from "../types/models";
import { getProgramaActivo } from "../data/programas";
import { getRutina } from "../data/rutinas";
import { getPerfiles } from "../data/perfiles";
import { getHistorialMiembro } from "../data/historial";
import { useAuth } from "../auth/useAuth";
import { MemberAvatar } from "../components/MemberAvatar";
import { WeekStrip } from "../components/WeekStrip";
import { ShapeUpMark, ShapeUpWordmark } from "../components/Brand";

const DIAS_ES = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"] as const;
const DIA_SEMANA_IDX: Partial<Record<string, number>> = {
  lunes: 0, martes: 1, "miércoles": 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
};
const PRIMER_NOMBRE: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};

function diaHoy(): string {
  return DIAS_ES[new Date().getDay()];
}
function diaDeHoy(programa: Programa): DiaPrograma | null {
  const hoy = diaHoy();
  return programa.dias.find((d) => d.diaSemana === hoy) ?? null;
}
function lunesDeSemana(): string {
  const hoy = new Date();
  const dia = hoy.getDay();
  const diff = dia === 0 ? -6 : 1 - dia;
  hoy.setDate(hoy.getDate() + diff);
  return hoy.toISOString().slice(0, 10);
}
function diasEntrenamiento(programa: Programa): number[] {
  return programa.dias
    .filter((d) => d.tipo !== "descanso" && d.diaSemana)
    .map((d) => DIA_SEMANA_IDX[d.diaSemana!])
    .filter((i): i is number => i !== undefined);
}

interface SemanaStats {
  sesionesHechas: number;
  sesionesObjetivo: number;
  volumenKg: number;
  rachaSemanas: number;
}

function calcRacha(hist: Historial[], semanaActual: string): number {
  const porSemana = new Set(hist.map((h) => h.semanaInicio));
  let racha = 0;
  const d = new Date(semanaActual + "T12:00:00");
  while (porSemana.has(d.toISOString().slice(0, 10))) {
    racha++;
    d.setDate(d.getDate() - 7);
  }
  return racha;
}

function fmtKg(kg: number): string {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}k` : String(Math.round(kg));
}

export function Home() {
  const navigate             = useNavigate();
  const { memberId }         = useAuth();
  const [programa, setPrograma] = useState<Programa | null>(null);
  const [dia,      setDia]      = useState<DiaPrograma | null>(null);
  const [rutina,   setRutina]   = useState<Rutina | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [color,    setColor]    = useState<string | undefined>(undefined);
  const [semana,   setSemana]   = useState<SemanaStats | null>(null);

  useEffect(() => {
    if (!memberId) return;
    getPerfiles().then((r) => {
      if (r.ok) setColor(r.value[memberId]?.color);
    });

    const semanaInicio = lunesDeSemana();

    Promise.all([
      getProgramaActivo(),
      getHistorialMiembro(memberId as MiembroId),
    ]).then(async ([progR, histR]) => {
      if (histR.ok) {
        const hist = histR.value;
        const estaSemana = hist.filter((h) => h.semanaInicio === semanaInicio);
        const prog = progR.ok ? progR.value : null;
        const objetivo = prog
          ? prog.dias.filter((d) => d.tipo !== "descanso").length
          : 0;
        setSemana({
          sesionesHechas:   estaSemana.length,
          sesionesObjetivo: objetivo,
          volumenKg:        estaSemana.reduce((s, h) => s + (h.tonelajeKg ?? 0), 0),
          rachaSemanas:     calcRacha(hist, semanaInicio),
        });
      }

      if (!progR.ok || !progR.value) { setLoading(false); return; }
      const prog = progR.value;
      setPrograma(prog);
      const d = diaDeHoy(prog);
      setDia(d);
      if (d?.tipo === "rutina" && d.idRutina) {
        const rr = await getRutina(d.idRutina);
        if (rr.ok) setRutina(rr.value);
      }
      setLoading(false);
    });
  }, [memberId]);

  const primerNombre = memberId ? PRIMER_NOMBRE[memberId as MiembroId] : "";

  return (
    <div className="page">

      {/* ── Header de marca ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--accent)" }}>
          <ShapeUpMark size={26} />
          <ShapeUpWordmark size={17} />
        </div>
        {memberId && (
          <button
            onClick={() => navigate("/perfil")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
          >
            <MemberAvatar memberId={memberId as MiembroId} color={color} size={34} />
          </button>
        )}
      </div>

      {/* ── Saludo ──────────────────────────────────────────────────────── */}
      <h1 style={{ margin: "2px 0 4px", fontSize: 27, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15 }}>
        Dale, {primerNombre}<span style={{ color: "var(--accent)" }}>.</span>
      </h1>

      {loading && (
        <div className="loading-screen" style={{ minHeight: 120 }}>
          <div className="spinner" />
        </div>
      )}

      {/* ── WeekStrip ───────────────────────────────────────────────────── */}
      {!loading && programa && (
        <div className="card" style={{ padding: "14px 16px" }}>
          <WeekStrip
            semanaInicio={lunesDeSemana()}
            marcados={diasEntrenamiento(programa)}
          />
        </div>
      )}

      {/* ── Tu semana ───────────────────────────────────────────────────── */}
      {!loading && semana && semana.sesionesObjetivo > 0 && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span className="t-label">Tu semana</span>
            {semana.rachaSemanas > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                color: "var(--accent)", fontSize: 12, fontWeight: 700,
              }}>
                <Flame size={14} fill="currentColor" strokeWidth={0} />
                {semana.rachaSemanas} {semana.rachaSemanas === 1 ? "sem de racha" : "sem de racha"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{
                fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em",
              }}>
                {semana.sesionesHechas}
              </span>
              <span style={{ fontSize: 14, color: "var(--muted)" }}>/ {semana.sesionesObjetivo} sesiones</span>
            </div>
            {semana.volumenKg > 0 && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>
                  {fmtKg(semana.volumenKg)} kg
                </div>
                <div className="t-label" style={{ letterSpacing: ".05em" }}>volumen</div>
              </div>
            )}
          </div>
          {semana.sesionesObjetivo > 0 && (
            <div style={{ height: 7, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min(100, Math.round((semana.sesionesHechas / semana.sesionesObjetivo) * 100))}%`,
                background: "var(--accent)",
                borderRadius: 999,
                transition: "width .4s ease",
              }} />
            </div>
          )}
        </div>
      )}

      {/* ── Sin programa activo ─────────────────────────────────────────── */}
      {!loading && !programa && (
        <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 16px" }}>
            No hay un programa activo. Creá uno en Biblioteca para ver qué toca cada día.
          </p>
          <button
            className="btn-secondary"
            style={{ maxWidth: 200, margin: "0 auto" }}
            onClick={() => navigate("/biblioteca")}
          >
            Ver rutinas
          </button>
        </div>
      )}

      {/* ── Programa activo + Hoy toca ──────────────────────────────────── */}
      {!loading && programa && (
        <>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <p className="t-label" style={{ margin: 0 }}>Programa activo</p>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{programa.nombre}</p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              {programa.diasPorSemana} días / semana · {programa.objetivo}
            </p>
          </div>

          {!dia && (
            <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 14 }}>
                Hoy ({diaHoy()}) no hay sesión programada.
              </p>
            </div>
          )}

          {dia?.tipo === "descanso" && (
            <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
              <p style={{ margin: 0, fontSize: 22 }}>😴</p>
              <p style={{ margin: "8px 0 0", fontWeight: 700 }}>Día de descanso</p>
              <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                Descansá bien. La recuperación es parte del entrenamiento.
              </p>
            </div>
          )}

          {dia?.tipo === "vr" && (
            <div className="card" style={{ textAlign: "center", padding: "24px 16px" }}>
              <p style={{ margin: 0, fontSize: 22 }}>🥽</p>
              <p style={{ margin: "8px 0 0", fontWeight: 700 }}>Día VR</p>
              {dia.vrSugerido && (
                <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 13 }}>
                  Sugerido: {dia.vrSugerido}
                </p>
              )}
            </div>
          )}

          {dia?.tipo === "rutina" && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <p className="t-label" style={{ margin: "0 0 4px" }}>Hoy toca</p>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 22, letterSpacing: "-.01em" }}>
                  {rutina?.nombre ?? dia.etiqueta}
                </p>
                {rutina && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                    <span className="badge badge-accent">{rutina.foco}</span>
                    <span className="badge badge-muted">{rutina.nivel}</span>
                    {rutina.duracionEstimadaMin != null && (
                      <span className="badge badge-muted">⏱ {rutina.duracionEstimadaMin} min</span>
                    )}
                  </div>
                )}
              </div>
              {rutina && (
                <button
                  className="btn-primary"
                  onClick={() => navigate(`/entrenar/${rutina.idRutina}`)}
                >
                  <Zap size={18} /> Empezar sesión
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
