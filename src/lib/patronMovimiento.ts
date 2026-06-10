import type { PatronMovimiento } from "../types/models";

/**
 * Infiere el PatronMovimiento a partir de los metadatos FEDB.
 * Prioriza el nombre del ejercicio (keywords) sobre el campo `force` del FEDB,
 * que solo distingue push/pull pero no vertical/horizontal ni core.
 *
 * Devuelve `undefined` cuando no hay evidencia suficiente (mejor que un patrón falso).
 * El diccionario de traducciones puede overridear con `patron` explícito.
 */
export function resolverPatron(
  name:     string,
  category: string,
  mechanic: string | null,
  force:    string | null,
): PatronMovimiento | undefined {
  // Cardio / plyometrics siempre son locomoción
  if (category === "cardio" || category === "plyometrics") return "Locomoción / cardio";

  const n = name.toLowerCase();

  // ── Core ─────────────────────────────────────────────────────────────────
  if (/plank|rollout|ab wheel|pallof/.test(n))                         return "Core anti-extensión";
  if (/twist|rotat|wood chop/.test(n))                                 return "Core anti-rotación";
  if (/crunch|sit.?up|leg raise|knee raise|v.?up|flutter/.test(n))     return "Core flexión";

  // ── Dominante de rodilla ──────────────────────────────────────────────────
  if (/squat|lunge|leg press|step.?up|split squat|hack squat|front squat|goblet|pistol/.test(n))
    return "Dominante de rodilla";

  // ── Dominante de cadera ───────────────────────────────────────────────────
  if (/deadlift|hip thrust|glute bridge|good morning|swing|rdl|romanian|sumo|hip hinge|snatch|clean/.test(n))
    return "Dominante de cadera";

  // ── Empuje vertical ───────────────────────────────────────────────────────
  if (/overhead|military press|shoulder press|push press|handstand|z press|arnold/.test(n))
    return "Empuje vertical";

  // ── Tracción vertical ─────────────────────────────────────────────────────
  if (/pull.?up|chin.?up|pulldown|lat pull|pull down/.test(n))
    return "Tracción vertical";

  // ── Tracción horizontal ───────────────────────────────────────────────────
  if (/row|face pull|inverted row|seal row/.test(n))
    return "Tracción horizontal";

  // ── Empuje horizontal ─────────────────────────────────────────────────────
  if (/bench|push.?up|pushup|dip|chest press|chest fly|fly|pec deck|cable cross/.test(n))
    return "Empuje horizontal";

  // ── Acarreo / locomoción → mapeamos a lo más cercano del enum ────────────
  if (/carry|farmer|suitcase/.test(n)) return "Locomoción / cardio";

  // ── Fallback: isolation antes que force (más específico) ────────────────
  if (mechanic === "isolation") return "Aislamiento";

  // Force como último recurso (push/pull sin contexto de nombre)
  if (force === "push") return "Empuje horizontal";
  if (force === "pull") return "Tracción horizontal";

  return undefined;
}
