// ════════════════════════════════════════════════════════════════════════════
//  scripts/data/videos-genericos.ts — Clips representativos por patrón de
//  movimiento, para poblar `videoUrl` (P43/B2) donde no hay footage propio.
//
//  Fuente: Wikimedia Commons, vía Special:FilePath (hotlinkeable, estable
//  aunque cambie el hash de carpeta de `upload.wikimedia.org`).
//  Todos verificados de licencia libre (CC BY / CC BY-SA / dominio público) —
//  ver `credito` y `paginaUrl` de cada entrada para la atribución exacta.
//
//  Cobertura: 10/12 patrones. Sin clip → "Core anti-extensión" (plank) y
//  "Core anti-rotación" (russian twist / woodchop): no se encontró un video
//  libre adecuado en Commons. Queda como deuda — ver Bitácora B2.
// ════════════════════════════════════════════════════════════════════════════
import type { PatronMovimiento } from "../../src/types/models";

const COMMONS_FILEPATH = "https://commons.wikimedia.org/wiki/Special:FilePath/";

export interface ClipGenerico {
  archivo: string;        // nombre de archivo en Commons
  credito: string;        // texto de atribución a mostrar bajo el frame
  paginaUrl: string;      // página del archivo en Commons (referencia, no se hotlinkea)
}

export const VIDEOS_GENERICOS: Partial<Record<PatronMovimiento, ClipGenerico>> = {
  "Empuje horizontal": {
    archivo: "Bench press - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Bench_press_-_exercise_demonstration_video.webm",
  },
  "Empuje vertical": {
    archivo: "Shoulder press - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Shoulder_press_-_exercise_demonstration_video.webm",
  },
  "Tracción horizontal": {
    archivo: "Bent-over row - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Bent-over_row_-_exercise_demonstration_video.webm",
  },
  "Tracción vertical": {
    archivo: "Pull-ups - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Pull-ups_-_exercise_demonstration_video.webm",
  },
  "Dominante de rodilla": {
    archivo: "Squat - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Squat_-_exercise_demonstration_video.webm",
  },
  "Dominante de cadera": {
    archivo: "Deadlift - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Deadlift_-_exercise_demonstration_video.webm",
  },
  "Zancada / unilateral": {
    archivo: "Strength Training Circuit- Forward Lunge.webm",
    credito: "Demo: U.S. Army (ACFT) · Wikimedia Commons · dominio público",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Strength_Training_Circuit-_Forward_Lunge.webm",
  },
  "Core flexión": {
    archivo: "Hanging crunches - exercise demonstration video.webm",
    credito: "Demo: FitnessScape · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Hanging_crunches_-_exercise_demonstration_video.webm",
  },
  "Locomoción / cardio": {
    archivo: "Jumping jacks and burpees.webm",
    credito: "Demo: Taco Fleur / Cavemantraining · Wikimedia Commons · CC BY-SA 4.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Jumping_jacks_and_burpees.webm",
  },
  "Aislamiento": {
    archivo: "Video of EZ Bar Curl and Straight Bar Curl.webm",
    credito: "Demo: Colossus Fitness · Wikimedia Commons · CC BY 3.0",
    paginaUrl: "https://commons.wikimedia.org/wiki/File:Video_of_EZ_Bar_Curl_and_Straight_Bar_Curl.webm",
  },
};

export function videoGenericoPorPatron(patron: PatronMovimiento): ClipGenerico | undefined {
  return VIDEOS_GENERICOS[patron];
}

export function urlClip(clip: ClipGenerico): string {
  return COMMONS_FILEPATH + clip.archivo.replace(/ /g, "_");
}
