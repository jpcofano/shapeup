import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Flame } from "lucide-react";
import type { Programa, Historial } from "../types/models";
import type { MiembroId } from "../types/models";
import { getProgramaActivo } from "../data/programas";
import { getPerfiles } from "../data/perfiles";
import { getHistorialMiembro } from "../data/historial";
import { useAuth } from "../auth/useAuth";
import { MemberAvatar } from "../components/MemberAvatar";
import { WeekStrip } from "../components/WeekStrip";
import { ShapeUpMark, ShapeUpWordmark } from "../components/Brand";
import { proximaSesion, type ProximaSesionResult } from "../lib/proximaSesion";

const DIA_SEMANA_IDX: Partial<Record<string, number>> = {
  lunes: 0, martes: 1, "miércoles": 2, jueves: 3, viernes: 4, sábado: 5, domingo: 6,
};
const PRIMER_NOMBRE: Record<MiembroId, string> = {
  juanpablo: "Juan Pablo", maria: "María", sofia: "Sofía", federico: "Federico",
};

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
  const [proxima,  setProxima]  = useState<ProximaSesionResult | null | undefined>(undefined); // undefined = loading
  const [loading,  setLoading]  = useState(true);
  const [color,    setColor]    = useState<string | undefined>(undefined);
  const [semana,   setSemana]   = useState<SemanaStats | null>(null);

  useEffect(() => {
    if (!memberId) return;
    getPerfiles().then((r) => {
      if (r.ok) setColor(r.value[memberId as MiembroId]?.color);
    });

    const semanaInicio = lunesDeSemana();

    Promise.all([
      getProgramaActivo(),
      getHistorialMiembro(memberId as MiembroId),
    ]).then(([progR, histR]) => {
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

        if (progR.ok && progR.value) {
          const prog = progR.value;
          setPrograma(prog);
          setProxima(proximaSesion(prog, estaSemana));
        } else {
          setProxima(null);
        }
      } else if (progR.ok && progR.value) {
        setPrograma(progR.value);
        setProxima(proximaSesion(progR.value, []));
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

      {/* ── Hero: Próxima sesión ─────────────────────────────────────────── */}
      {!loading && programa && proxima !== undefined && (
        proxima !== null ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p className="t-label" style={{ margin: 0 }}>
              Próxima sesión · Día {proxima.indice} de {proxima.total}
            </p>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 22, letterSpacing: "-.01em" }}>
              {proxima.dia.idRutina
                ? proxima.dia.etiqueta.replace(/^[^—–]*[—–]\s*/, "")
                : proxima.dia.etiqueta}
            </p>
            {proxima.dia.diaSemana && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                Planificado: {proxima.dia.diaSemana}
              </p>
            )}
            <button
              className="btn-primary"
              onClick={() => proxima.dia.idRutina && navigate(`/entrenar/${proxima.dia.idRutina}`)}
              disabled={!proxima.dia.idRutina}
            >
              <Zap size={18} /> Empezar
            </button>
          </div>
        ) : (
          /* Semana completa */
          <div className="card" style={{ textAlign: "center", padding: "20px 16px" }}>
            <p style={{ margin: 0, fontSize: 22 }}>🎉</p>
            <p style={{ margin: "8px 0 4px", fontWeight: 700 }}>¡Semana completa!</p>
            <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: 13 }}>
              Ya hiciste todas las sesiones de la semana. Descansá o elegí otra rutina.
            </p>
            <button
              className="btn-secondary"
              style={{ maxWidth: 200, margin: "0 auto" }}
              onClick={() => navigate("/entrenar")}
            >
              Elegir otra rutina
            </button>
          </div>
        )
      )}

      {/* ── Sin programa ─────────────────────────────────────────────────── */}
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
                {semana.rachaSemanas} {semana.rachaSemanas === 1 ? "sem de racha" : "sems de racha"}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 28, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-.02em" }}>
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
          <div style={{ height: 7, borderRadius: 999, background: "var(--card-hover)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${Math.min(100, Math.round((semana.sesionesHechas / semana.sesionesObjetivo) * 100))}%`,
              background: "var(--accent)", borderRadius: 999, transition: "width .4s ease",
            }} />
          </div>
        </div>
      )}

      {/* ── Info programa activo ─────────────────────────────────────────── */}
      {!loading && programa && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <p className="t-label" style={{ margin: 0 }}>Programa activo</p>
          <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{programa.nombre}</p>
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            {programa.diasPorSemana} días / semana · {programa.objetivo}
          </p>
        </div>
      )}
    </div>
  );
}
