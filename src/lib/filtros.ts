// ════════════════════════════════════════════════════════════════════════════
//  lib/filtros.ts — filtra el catálogo de ejercicios (lógica pura, sin I/O).
//  Todos los criterios son AND. Busqueda opera sobre nombre + sinónimos.
// ════════════════════════════════════════════════════════════════════════════
import type {
  Ejercicio, Modalidad, GrupoMuscular, RegionMuscular,
  Equipo, Nivel, PatronMovimiento,
} from "../types/models";
import { GRUPOS_MUSCULARES_REGION } from "../types/models";
import { normalizeText } from "./canonical";

export interface FiltrosEjercicio {
  busqueda?:     string;
  modalidad?:    Modalidad;
  grupoMuscular?: GrupoMuscular;
  region?:       RegionMuscular;
  equipo?:       Equipo;
  nivel?:        Nivel;
  patron?:       PatronMovimiento;
}

function gruposDeRegion(region: RegionMuscular): GrupoMuscular[] {
  return (GRUPOS_MUSCULARES_REGION as Record<string, GrupoMuscular[]>)[region] ?? [];
}

/**
 * Filtra ejercicios según los criterios dados.
 * Criterios vacíos/undefined no filtran.
 */
export function filtrarEjercicios(
  ejercicios: Ejercicio[],
  filtros: FiltrosEjercicio,
): Ejercicio[] {
  return ejercicios.filter((ej) => {
    if (filtros.modalidad && ej.modalidad !== filtros.modalidad)         return false;
    if (filtros.nivel     && ej.nivel     !== filtros.nivel)             return false;
    if (filtros.patron    && ej.patron    !== filtros.patron)             return false;
    if (filtros.equipo    && !ej.equipo.includes(filtros.equipo))        return false;

    if (filtros.grupoMuscular) {
      const primary   = ej.grupoMuscularPrimario === filtros.grupoMuscular;
      const secondary = ej.gruposSecundarios.includes(filtros.grupoMuscular);
      if (!primary && !secondary) return false;
    }

    if (filtros.region) {
      const grupos = gruposDeRegion(filtros.region);
      const enRegion =
        grupos.includes(ej.grupoMuscularPrimario) ||
        ej.gruposSecundarios.some((g) => grupos.includes(g));
      if (!enRegion) return false;
    }

    if (filtros.busqueda) {
      const needle   = normalizeText(filtros.busqueda);
      const haystack = [ej.nombre, ...ej.sinonimos].map(normalizeText).join(" ");
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}
