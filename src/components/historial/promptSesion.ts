// El prompt del análisis de sesión, tomado del archivo versionado del repo
// (P93). **El archivo es la fuente**: si cambia, se crea el -v2, se agrega acá
// y sube VERSION_PROMPT_SESION. Si la versión no tiene archivo, falla el build.
import promptV1 from "../../../docs/analisis/prompt-sesion-v1.md?raw";
import promptV2 from "../../../docs/analisis/prompt-sesion-v2.md?raw";
import promptV3 from "../../../docs/analisis/prompt-sesion-v3.md?raw";
import { VERSION_PROMPT_SESION } from "../../lib/analisis";

const PROMPTS: Record<number, string> = { 1: promptV1, 2: promptV2, 3: promptV3 };

export const PROMPT_SESION: string = PROMPTS[VERSION_PROMPT_SESION] ?? (() => {
  throw new Error(`Falta docs/analisis/prompt-sesion-v${VERSION_PROMPT_SESION}.md`);
})();
