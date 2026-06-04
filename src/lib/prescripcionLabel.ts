import type { Prescripcion } from "../types/models";

/** Genera un resumen de texto legible para mostrar en listas/cards. */
export function prescripcionLabel(p: Prescripcion): string {
  switch (p.modalidad) {
    case "Fuerza": {
      const reps  = p.alFallo ? "al fallo" : p.repsObjetivo.raw;
      const carga = p.cargaKg != null ? ` · ${p.cargaKg} kg` : "";
      const rir   = p.rirObjetivo != null ? ` · RIR ${p.rirObjetivo}` : "";
      return `${p.series}×${reps}${carga} · ${p.descansoSeg}s${rir}`;
    }
    case "Isométrico": {
      const lado = p.porLado ? " c/lado" : "";
      return `${p.series}×${p.duracionHoldSeg}s${lado} · ${p.descansoSeg}s`;
    }
    case "Movilidad": {
      const hold = p.duracionHoldSeg != null ? `${p.duracionHoldSeg}s` : (p.repsObjetivo?.raw ?? "—");
      const lado = p.porLado ? " c/lado" : "";
      return `${p.rondas}×${hold}${lado}`;
    }
    case "Cardio": {
      if (p.formato === "Intervalos") {
        return `${p.rondas ?? "?"} rondas · ${p.trabajoSeg ?? "?"}s / ${p.descansoSeg ?? "?"}s`;
      }
      if (p.duracionMin)  return `${p.duracionMin} min`;
      if (p.distanciaKm)  return `${p.distanciaKm} km`;
      return "cardio continuo";
    }
  }
}
