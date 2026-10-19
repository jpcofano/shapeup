import { useEffect, useState } from "react";
import type { MiembroId } from "../types/models";
import { getProgramaActivo } from "../data/programas";
import { getPerfiles } from "../data/perfiles";
import { planSemanaDe } from "../lib/adherencia";

type PlanSemana = { metaDias: number; idPrograma: string | null };

/**
 * La meta de la semana y el programa vigentes, para guardarlos en la sesión al
 * cerrar (P99). Las dos lecturas están cacheadas en memoria (P77a). Mientras no
 * cargó, o si falló, es `null`: la sesión se guarda igual, sin el dato, y su
 * marca `semana` no aparece. No se completa después con el plan de hoy.
 */
export function usePlanSemana(memberId: MiembroId | string | null | undefined): PlanSemana | null {
  const [plan, setPlan] = useState<PlanSemana | null>(null);
  useEffect(() => {
    if (!memberId) return;
    let vivo = true;
    void Promise.all([getProgramaActivo(memberId as MiembroId), getPerfiles()]).then(([prog, perf]) => {
      if (!vivo) return;
      const perfil = perf.ok ? perf.value[memberId as MiembroId] : undefined;
      setPlan(planSemanaDe(prog.ok ? prog.value : null, perfil));
    }).catch(() => undefined);
    return () => { vivo = false; };
  }, [memberId]);
  return plan;
}
