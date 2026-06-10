import type { GrupoMuscular } from "../types/models";

export interface BodyMapProps {
  primario:     GrupoMuscular;
  secundarios?: GrupoMuscular[];
}

// ── Mapa grupo → región(es) SVG ───────────────────────────────────────────────
// f = vista frontal, b = vista posterior

type RegionId = string;
interface RegSet { f?: RegionId[]; b?: RegionId[] }

const GRUPO_REGION: Partial<Record<GrupoMuscular, RegSet>> = {
  "Pecho":         { f: ["chest"] },
  "Hombros":       { f: ["sh-l","sh-r"],          b: ["sh-l","sh-r"] },
  "Bíceps":        { f: ["bic-l","bic-r"] },
  "Tríceps":       {                               b: ["tri-l","tri-r"] },
  "Antebrazos":    { f: ["fa-l","fa-r"],           b: ["fa-l","fa-r"] },
  "Espalda":       {                               b: ["lat-l","lat-r","midb"] },
  "Dorsales":      {                               b: ["lat-l","lat-r"] },
  "Espalda media": {                               b: ["midb"] },
  "Trapecios":     {                               b: ["trap"] },
  "Lumbares":      {                               b: ["lowb"] },
  "Core":          { f: ["core"] },
  "Glúteos":       {                               b: ["glu-l","glu-r"] },
  "Cuádriceps":    { f: ["qua-l","qua-r"] },
  "Isquios":       {                               b: ["ham-l","ham-r"] },
  "Pantorrillas":  { f: ["caf-l","caf-r"],         b: ["caf-l","caf-r"] },
  "Abductores":    { f: ["qua-l","qua-r"] },
  "Aductores":     { f: ["qua-l","qua-r"] },
  "Cuello":        { f: ["neck"],                  b: ["neck"] },
  "Cuerpo completo": {
    f: ["chest","sh-l","sh-r","bic-l","bic-r","fa-l","fa-r","core","qua-l","qua-r","caf-l","caf-r"],
    b: ["sh-l","sh-r","trap","lat-l","lat-r","midb","lowb","tri-l","tri-r","fa-l","fa-r","glu-l","glu-r","ham-l","ham-r","caf-l","caf-r"],
  },
};

// ── Colores ───────────────────────────────────────────────────────────────────

const C_PRIM = "var(--accent)";
const C_SEC  = "color-mix(in srgb, var(--accent) 40%, transparent)";
const C_INAC = "var(--card-hover)";
const S_INAC = "var(--border)";

function buildFills(
  primario:    GrupoMuscular,
  secundarios: GrupoMuscular[],
): Map<RegionId, string> {
  const fills = new Map<RegionId, string>();
  const primR = GRUPO_REGION[primario];
  if (primR) {
    [...(primR.f ?? []), ...(primR.b ?? [])].forEach((id) => fills.set(id, C_PRIM));
  }
  for (const sec of secundarios) {
    const secR = GRUPO_REGION[sec];
    if (!secR) continue;
    [...(secR.f ?? []), ...(secR.b ?? [])].forEach((id) => {
      if (!fills.has(id)) fills.set(id, C_SEC);
    });
  }
  return fills;
}

// ── Shapes ────────────────────────────────────────────────────────────────────

type Sh =
  | { t: "c"; id: string; cx: number; cy: number; r: number }
  | { t: "e"; id: string; cx: number; cy: number; rx: number; ry: number }
  | { t: "r"; id: string; x: number; y: number; w: number; h: number; rx?: number };

// Vista frontal  (viewBox 0 0 80 172)
const FRONT: Sh[] = [
  { t:"c", id:"head",  cx:40, cy:13,  r:11 },
  { t:"r", id:"neck",  x:35,  y:24,   w:10, h:8,  rx:2 },
  { t:"e", id:"sh-l",  cx:20, cy:38,  rx:11, ry:8 },
  { t:"e", id:"sh-r",  cx:60, cy:38,  rx:11, ry:8 },
  { t:"r", id:"chest", x:23,  y:32,   w:34, h:26, rx:4 },
  { t:"e", id:"bic-l", cx:11, cy:57,  rx:7,  ry:13 },
  { t:"e", id:"bic-r", cx:69, cy:57,  rx:7,  ry:13 },
  { t:"e", id:"fa-l",  cx:9,  cy:80,  rx:5,  ry:12 },
  { t:"e", id:"fa-r",  cx:71, cy:80,  rx:5,  ry:12 },
  { t:"r", id:"core",  x:27,  y:58,   w:26, h:22, rx:3 },
  { t:"e", id:"qua-l", cx:29, cy:112, rx:12, ry:22 },
  { t:"e", id:"qua-r", cx:51, cy:112, rx:12, ry:22 },
  { t:"e", id:"caf-l", cx:29, cy:150, rx:8,  ry:15 },
  { t:"e", id:"caf-r", cx:51, cy:150, rx:8,  ry:15 },
];

// Vista posterior (viewBox 0 0 80 172)
const BACK: Sh[] = [
  { t:"c", id:"head",  cx:40, cy:13,  r:11 },
  { t:"r", id:"neck",  x:35,  y:24,   w:10, h:8,  rx:2 },
  { t:"e", id:"sh-l",  cx:20, cy:38,  rx:11, ry:8 },
  { t:"e", id:"sh-r",  cx:60, cy:38,  rx:11, ry:8 },
  { t:"e", id:"trap",  cx:40, cy:37,  rx:18, ry:9 },
  { t:"e", id:"lat-l", cx:21, cy:62,  rx:10, ry:18 },
  { t:"e", id:"lat-r", cx:59, cy:62,  rx:10, ry:18 },
  { t:"r", id:"midb",  x:28,  y:44,   w:24, h:20, rx:3 },
  { t:"r", id:"lowb",  x:28,  y:64,   w:24, h:18, rx:3 },
  { t:"e", id:"tri-l", cx:11, cy:57,  rx:7,  ry:13 },
  { t:"e", id:"tri-r", cx:69, cy:57,  rx:7,  ry:13 },
  { t:"e", id:"fa-l",  cx:9,  cy:80,  rx:5,  ry:12 },
  { t:"e", id:"fa-r",  cx:71, cy:80,  rx:5,  ry:12 },
  { t:"e", id:"glu-l", cx:29, cy:95,  rx:13, ry:15 },
  { t:"e", id:"glu-r", cx:51, cy:95,  rx:13, ry:15 },
  { t:"e", id:"ham-l", cx:29, cy:128, rx:11, ry:21 },
  { t:"e", id:"ham-r", cx:51, cy:128, rx:11, ry:21 },
  { t:"e", id:"caf-l", cx:29, cy:157, rx:8,  ry:15 },
  { t:"e", id:"caf-r", cx:51, cy:157, rx:8,  ry:15 },
];

function renderShape(s: Sh, fills: Map<RegionId, string>) {
  const active = fills.has(s.id);
  const fill   = active ? fills.get(s.id)! : C_INAC;
  const stroke = active ? fill : S_INAC;
  const common = { fill, stroke, strokeWidth: 0.8 };
  if (s.t === "c") return <circle   key={s.id} cx={s.cx} cy={s.cy} r={s.r}                               {...common} />;
  if (s.t === "e") return <ellipse  key={s.id} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}                   {...common} />;
  return               <rect     key={s.id} x={s.x}   y={s.y}   width={s.w} height={s.h} rx={s.rx ?? 0} {...common} />;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function BodyMap({ primario, secundarios = [] }: BodyMapProps) {
  const fills = buildFills(primario, secundarios);
  return (
    <div className="body-map">
      <div className="body-map-view">
        <svg viewBox="0 0 80 172" xmlns="http://www.w3.org/2000/svg">
          {FRONT.map((s) => renderShape(s, fills))}
        </svg>
        <span className="body-map-label">Frente</span>
      </div>
      <div className="body-map-view">
        <svg viewBox="0 0 80 172" xmlns="http://www.w3.org/2000/svg">
          {BACK.map((s) => renderShape(s, fills))}
        </svg>
        <span className="body-map-label">Espalda</span>
      </div>
    </div>
  );
}
