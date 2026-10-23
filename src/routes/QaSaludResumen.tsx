import { Link, useSearchParams } from "react-router-dom";
import type { ThemeName } from "../contexts/ThemeProvider";
import { ResumenTab } from "../components/salud/ResumenTab";
import { SaludEncabezado, PildoraTabs } from "../components/salud/SaludEncabezado";
import { LineaPuente, PuentePanel } from "../components/salud/PuentePanel";
import type { MedicionCorporal, MetricaSalud, RegistroSueno } from "../types/models";

// Salud → Resumen con datos INVENTADOS (P109): nunca datos de Juan. La fecha
// está fija (jueves 22/10/2026, 10:00 hora local) para que la pantalla sea
// siempre la misma. Cada columna es un ancho de teléfono (360 px).

export const HOY_QA = "2026-10-22";
export const AHORA_QA = new Date(2026, 9, 22, 10, 0).getTime();

/** La fecha `HOY_QA` menos `n` días, "YYYY-MM-DD". */
function hace(n: number): string {
  const d = new Date(2026, 9, 22 - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 35 noches inventadas; la última, 23:41 → 6:35 (6 h 54). */
function suenoQa(): RegistroSueno[] {
  const horas = [7.1, 6.6, 7.6, 7.3, 6.2, 7.9, 6.9];
  return Array.from({ length: 35 }, (_, n) => {
    const fecha = hace(n);
    const [y, m, d] = fecha.split("-").map(Number);
    const fin = n === 0 ? new Date(y, m - 1, d, 6, 35) : new Date(y, m - 1, d, 7, 0);
    const h = n === 0 ? 6.9 : horas[n % horas.length];
    const inicio = new Date(fin.getTime() - h * 3_600_000);
    const hhmm = (t: Date) => `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
    return {
      idSueno: `QA-${fecha}`, miembro: "juanpablo", fecha, horas: h,
      horaAcostarse: hhmm(inicio), horaLevantarse: hhmm(fin),
      inicioMs: inicio.getTime(), finMs: fin.getTime(), fuente: "manual",
    };
  });
}

/** Peso casi todos los días; grasa cada 3 días (si `conGrasa`). */
function medicionesQa(conGrasa: boolean): MedicionCorporal[] {
  return Array.from({ length: 35 }, (_, n) => ({
    idMedicion: `QA-${n}`, miembro: "juanpablo" as const, fecha: hace(n),
    pesoKg: +(80.4 - (35 - n) * 0.03 + Math.sin(n / 2) * 0.3).toFixed(1),
    ...(conGrasa && n % 3 === 0 ? { grasaPct: +(21.5 - (35 - n) * 0.02 + Math.cos(n) * 0.2).toFixed(1) } : {}),
    fuente: "manual" as const,
  })).filter((_, n) => n % 5 !== 4);
}

function metrica(tipo: MetricaSalud["tipo"], fecha: string, valor: number): MetricaSalud {
  return { idMetrica: `juanpablo-${tipo}-${fecha}`, miembro: "juanpablo", tipo, fecha, valor, agregacion: "dia", fuente: "manual" };
}

/** Presión cada 2 días (la última, hace 2 días) y SpO2 todos los días. */
function metricasQa(): MetricaSalud[] {
  const out: MetricaSalud[] = [];
  for (let n = 2; n < 35; n += 2) {
    out.push(metrica("presion-sistolica", hace(n), 121 + (n % 6) - 2));
    out.push(metrica("presion-diastolica", hace(n), 78 + (n % 4) - 1));
  }
  for (let n = 0; n < 35; n++) out.push(metrica("spo2", hace(n), 96 + (n % 3 === 0 ? 1 : 0)));
  return out;
}

export interface EscenarioQa {
  id: string;
  label: string;
  metricas: MetricaSalud[];
  sueno: RegistroSueno[];
  mediciones: MedicionCorporal[];
  puente: "al-dia" | "error";
}

export const ESCENARIOS_QA: EscenarioQa[] = [
  { id: "con-todo",  label: "Con todo · puente al día",        metricas: metricasQa(), sueno: suenoQa(), mediciones: medicionesQa(true),  puente: "al-dia" },
  { id: "sin-sueno", label: "Sin sueño · puente con error",    metricas: metricasQa(), sueno: [],        mediciones: medicionesQa(true),  puente: "error" },
  { id: "sin-grasa", label: "Sin grasa · tres tarjetas",       metricas: metricasQa(), sueno: suenoQa(), mediciones: medicionesQa(false), puente: "al-dia" },
  { id: "sin-datos", label: "Sin datos",                       metricas: [],           sueno: [],        mediciones: [],                  puente: "al-dia" },
];

const ULTIMA_CORRIDA_QA = AHORA_QA - 2 * 3_600_000;

export function PantallaResumenQa({ e }: { e: EscenarioQa }) {
  return (
    <div className="page" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="page-header">
        <SaludEncabezado ahora={AHORA_QA} onZip={() => {}} onCsv={() => {}} onManual={() => {}} />
      </div>
      <PildoraTabs tab="resumen" onChange={() => {}} />
      {e.puente === "al-dia"
        ? <LineaPuente ultimaCorridaMs={ULTIMA_CORRIDA_QA} ahora={AHORA_QA} onSincronizar={() => {}} />
        : <PuentePanel estado={{ ultimaCorridaMs: ULTIMA_CORRIDA_QA, leidos: 42, subidos: 3, sinCambios: 39 }} ahora={AHORA_QA} sincronizando={false}
            onSincronizar={() => {}} error="No se pudo leer lo que subió el puente." />}
      <ResumenTab metricas={e.metricas} sueno={e.sueno} mediciones={e.mediciones} hoy={HOY_QA} onTabChange={() => {}} />
    </div>
  );
}

const TEMAS: ThemeName[] = ["ion", "volt", "blaze", "pulse", "indigo"];
const MODOS = [{ id: "oscuro", modo: "dark" }, { id: "claro", modo: "light" }] as const;

export function QaSaludResumen() {
  // Tema y modo por la URL, como /qa/sesion: /qa/salud-resumen?tema=ion&modo=claro.
  const [params] = useSearchParams();
  const tema = TEMAS.includes(params.get("tema") as ThemeName) ? (params.get("tema") as ThemeName) : "ion";
  const modo = MODOS.find((m) => m.id === params.get("modo")) ?? MODOS[0];
  return (
    <div data-theme={tema} data-mode={modo.modo} style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)", padding: 16, boxSizing: "border-box" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>QA — Salud · Resumen (P109)</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
          Datos inventados. Cada columna es un ancho de teléfono (360 px). Tema y modo por la URL: ?tema=ion&amp;modo=claro.
        </p>
        <Link to="/" style={{ color: "var(--accent)", fontSize: 13 }}>← Volver a la app</Link>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {ESCENARIOS_QA.map((e) => (
          <div key={e.id} data-escenario={e.id} style={{ width: 360, flexShrink: 0 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700 }}>{e.label}</p>
            <div style={{ border: "1px solid var(--border)", borderRadius: 20, overflow: "hidden" }}>
              <PantallaResumenQa e={e} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
