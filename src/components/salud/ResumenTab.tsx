import { useMemo, type ReactNode } from "react";
import { Moon, Scale, Droplet, HeartPulse, Droplets, Activity, Footprints, ChevronRight } from "lucide-react";
import { calcularResumenSalud, senalPeor, CLAVES_SIN_SEMAFORO } from "../../lib/resumenSalud";
import { suenoParaResumen, tarjetasCuerpo, partesSueno, type TarjetaCuerpo } from "../../lib/resumenCuerpo";
import { horasYMinutos } from "../../lib/detalleSesion";
import type { MetricaSalud, RegistroSueno, MedicionCorporal } from "../../types/models";

export type TabDestino = "composicion" | "cardio" | "sueno" | "progreso";

const ICONO: Record<TarjetaCuerpo["clave"], ReactNode> = {
  peso: <Scale size={16} />,
  grasa: <Droplet size={16} />,
  presion: <HeartPulse size={16} />,
  spo2: <Droplets size={16} />,
  hrv: <Activity size={16} />,
  pasos: <Footprints size={16} />,
};

/** La serie de 14 días: la línea en `--muted` y el último punto en el acento. */
function SparkCuerpo({ serie }: { serie: number[] }) {
  if (serie.length < 2) return <div style={{ height: 30 }} />;
  const W = 146, H = 30, PAD = 4;
  const min = Math.min(...serie), max = Math.max(...serie), rango = max - min || 1;
  const pts = serie.map((v, i) => ({
    x: (i / (serie.length - 1)) * (W - 6),
    y: PAD + (1 - (v - min) / rango) * (H - 2 * PAD),
  }));
  const ult = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: 30 }} aria-hidden>
      <polyline points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
        fill="none" stroke="var(--muted)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ult.x} cy={ult.y} r={3.5} fill="var(--accent)" />
    </svg>
  );
}

/**
 * Salud → Resumen (P109, referencia `docs/prompts/109-diseno/ResumenFinal.html`):
 * el sueño de anoche destacado, con su horario, tu promedio y las 7 noches; y
 * debajo, las tarjetas de «Tu cuerpo» (peso, grasa, presión y oxígeno en
 * sangre). La presión y el SpO2 siguen sin semáforo (P56). La FC de reposo no
 * va (P106). El aviso de señales en atención sigue, para sueño, HRV y pasos.
 */
export function ResumenTab({
  metricas, sueno, mediciones, hoy, onTabChange, metricasError, onReintentarMetricas,
}: {
  metricas:   MetricaSalud[];
  sueno:      RegistroSueno[];
  mediciones: MedicionCorporal[];
  hoy:        string;
  onTabChange: (tab: TabDestino) => void;
  metricasError?: string | null;
  onReintentarMetricas?: () => void;
}) {
  const senales = useMemo(() => calcularResumenSalud(metricas, sueno, mediciones, hoy), [metricas, sueno, mediciones, hoy]);
  const resumenSueno = useMemo(
    () => suenoParaResumen(sueno, hoy, senales.find((s) => s.clave === "sueno")),
    [sueno, hoy, senales],
  );
  const tarjetas = useMemo(() => tarjetasCuerpo(senales, mediciones, hoy), [senales, mediciones, hoy]);
  const peor = senalPeor(senales.filter((s) => !CLAVES_SIN_SEMAFORO.has(s.clave)));

  const avisoMetricas = metricasError && (
    <p className="inline-error">
      No se pudieron cargar las métricas
      {onReintentarMetricas && (
        <> · <button
          onClick={onReintentarMetricas}
          style={{ background: "none", border: "none", padding: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}
        >
          reintentar
        </button></>
      )}
    </p>
  );

  if (!resumenSueno && tarjetas.length === 0) {
    return (
      <div className="empty-state">
        {avisoMetricas}
        <p>Sin datos de salud todavía. Importá un ZIP desde Samsung Health para ver tu resumen.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {avisoMetricas}
      {peor !== "ok" && peor !== "sin-datos" && (
        <div style={{
          padding: "8px 12px", borderRadius: "var(--r-sm)", fontSize: 12, fontWeight: 600,
          background: peor === "alerta" ? "var(--danger-dim)" : "var(--warning-dim)",
          color: peor === "alerta" ? "var(--danger)" : "var(--warning)",
        }}>
          {peor === "alerta" ? "⚠ Hay señales que merecen atención" : "Revisá algunas tendencias"}
        </div>
      )}

      {resumenSueno && <TarjetaSueno r={resumenSueno} />}

      {tarjetas.length > 0 && (
        <>
          <div className="resumen-seccion">
            <span className="tarjeta-titulo">Tu cuerpo</span>
            <span className="t-secondary">últimas 2 semanas</span>
          </div>
          <div data-seccion="tu-cuerpo" className="stat-grid" style={{ marginTop: -6 }}>
            {tarjetas.map((t, i) => (
              <div key={t.clave} data-tarjeta={t.clave}
                className={`card stat-tile${tarjetas.length % 2 === 1 && i === tarjetas.length - 1 ? " ancho" : ""}`}>
                <div className="stat-tile-etiqueta">{ICONO[t.clave]}{t.titulo}</div>
                <span className="stat-tile-valor resumen-valor">{t.valor}{t.unidad && <small> {t.unidad}</small>}</span>
                <SparkCuerpo serie={t.serie} />
                <div className="resumen-pie">
                  <span>{t.cambio ?? ""}</span>
                  <span className="t-secondary">{t.cuando ?? ""}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" className="link-tendencias" onClick={() => onTabChange("progreso")}>
        Ver todas las tendencias <ChevronRight size={16} aria-hidden />
      </button>
    </div>
  );
}

/** «06:35» → «6:35», como en la referencia. */
const sinCero = (hhmm: string) => hhmm.replace(/^0(\d)/, "$1");

function TarjetaSueno({ r }: { r: NonNullable<ReturnType<typeof suenoParaResumen>> }) {
  const { valor, unidad } = partesSueno(r.noche.horasTotal);
  const tope = Math.max(...r.noches.map((n) => n.horas ?? 0), r.promedio ?? 0, 1);
  const ALTO = 64;
  const [, mes, dia] = r.noche.fecha.split("-");
  return (
    <div data-seccion="sueno" className="card resumen-sueno">
      <div className="stat-tile-etiqueta">
        <span className="icono-cuadrado"><Moon size={16} /></span>
        {r.esAnoche ? "Sueño de anoche" : `Último sueño · ${dia}/${mes}`}
      </div>
      <div className="resumen-sueno-fila">
        <div>
          <p className="resumen-sueno-valor">{valor}<small> {unidad}</small></p>
          {r.noche.horaAcostarse && r.noche.horaLevantarse && (
            <p className="t-secondary" style={{ margin: "8px 0 0" }}>{sinCero(r.noche.horaAcostarse)} → {sinCero(r.noche.horaLevantarse)}</p>
          )}
        </div>
        {r.promedio != null && (
          <div style={{ textAlign: "right" }}>
            <p className="t-secondary" style={{ margin: 0 }}>Tu promedio</p>
            <p style={{ margin: "2px 0 0", fontSize: 16, fontWeight: 700 }}>{horasYMinutos(r.promedio)}</p>
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="resumen-sueno-barras" style={{ height: ALTO }}>
          {r.promedio != null && (
            <div data-testid="sueno-promedio" className="resumen-sueno-promedio" style={{ bottom: (r.promedio / tope) * ALTO }} />
          )}
          {r.noches.map((n, i) => (
            <div key={n.fecha} data-noche={n.fecha}
              className={`resumen-sueno-barra${i === r.noches.length - 1 ? " ultima" : ""}${n.horas == null ? " vacia" : ""}`}
              style={{ height: n.horas == null ? 4 : Math.max(4, (n.horas / tope) * ALTO) }} />
          ))}
        </div>
        <div className="resumen-sueno-dias">
          {r.noches.map((n, i) => (
            <span key={n.fecha} className={i === r.noches.length - 1 ? "ultima" : undefined}>{n.inicial}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
