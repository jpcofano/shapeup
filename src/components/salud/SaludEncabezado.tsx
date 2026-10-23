import { Upload, FileText, Plus } from "lucide-react";
import { fechaEncabezado } from "../../lib/resumenCuerpo";

export type TabSalud = "resumen" | "composicion" | "cardio" | "sueno" | "progreso";

/** Las pestañas de Salud. Las claves no cambian; los nombres sí (P109): «Cuerpo» y «Tendencias». */
export const TABS_SALUD: { key: TabSalud; label: string }[] = [
  { key: "resumen",     label: "Resumen"    },
  { key: "composicion", label: "Cuerpo"     },
  { key: "cardio",      label: "Cardio"     },
  { key: "sueno",       label: "Sueño"      },
  { key: "progreso",    label: "Tendencias" },
];

/**
 * El encabezado de Salud (P109): la fecha de hoy arriba del título y los tres
 * botones redondos de 44 px (importar ZIP, CSV suelto, carga manual).
 */
export function SaludEncabezado({ ahora, onZip, onCsv, onManual }: {
  ahora: number; onZip: () => void; onCsv: () => void; onManual: () => void;
}) {
  return (
    <div className="salud-header">
      <div>
        <span className="salud-fecha">{fechaEncabezado(new Date(ahora))}</span>
        <h1 className="page-title">Salud</h1>
      </div>
      <div className="salud-acciones">
        <button className="btn-redondo" title="Importar ZIP de Samsung Health" aria-label="Importar ZIP de Samsung Health" onClick={onZip}>
          <Upload size={18} />
        </button>
        <button className="btn-redondo" title="CSV suelto (alternativa al ZIP)" aria-label="CSV suelto (alternativa al ZIP)"
          onClick={onCsv} style={{ color: "var(--muted)" }}>
          <FileText size={16} />
        </button>
        <button className="btn-redondo" title="Carga manual" aria-label="Carga manual" onClick={onManual}>
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
}

/** Las pestañas en píldora (P109): si a 360 px no entran, scroll adentro de la píldora, nunca de la página. */
export function PildoraTabs({ tab, onChange }: { tab: TabSalud; onChange: (t: TabSalud) => void }) {
  return (
    <div className="pildora" role="tablist" data-testid="salud-tabs">
      {TABS_SALUD.map(({ key, label }) => (
        <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => onChange(key)}>
          {label}
        </button>
      ))}
    </div>
  );
}
