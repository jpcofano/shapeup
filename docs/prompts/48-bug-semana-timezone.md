# Tarea: Bug de zona horaria en el cálculo de "semana" (anillo del Home cuenta mal)

Repo: jpcofano/shapeup. Usuario en Argentina (UTC−3). El anillo de sesiones del
Home (ProgressRing done/total) cuenta mal: una sesión hecha un día aparece y al día
siguiente "desaparece" del conteo, o no arranca en 0/N. Causa = dos cálculos de
"lunes de la semana" inconsistentes y ambos con bug de UTC vs hora local.

## Causa raíz (dos lugares, dos métodos distintos)

**1. `src/data/historial.ts`** — al guardar la sesión:
```ts
function hoy() { return new Date().toISOString().split("T")[0]; }   // ← fecha en UTC
function lunesDe(fecha: string) {
  const d = new Date(fecha);   // "2026-06-29" se parsea como MEDIANOCHE UTC
  const dow = d.getDay();      // ← getDay() lo lee en LOCAL → en UTC−3 da el día anterior
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];   // ← formatea en UTC
}
```
De noche (después de ~21:00 ART) `hoy()` ya devuelve la fecha de mañana en UTC, así
que `semanaInicio` se guarda corrido. Y `new Date("YYYY-MM-DD").getDay()` (parse UTC,
lee local) corre el día de la semana uno para atrás.

**2. `src/routes/Home.tsx`** — `lunesDeSemana()`: arranca de `new Date()` (local) pero
cierra con `toISOString().slice(0,10)` (UTC). Distinto método que (1) → pueden dar
lunes distintos para el mismo instante, y el filtro
`hist.filter(h => h.semanaInicio === lunesDeSemana())` falla → el anillo cuenta 0.

## Fix: un único helper de fecha local, sin UTC

Crear **`src/lib/semana.ts`**:
```ts
/** Y-M-D en hora LOCAL (sin corrimiento UTC de toISOString). */
export function ymdLocal(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Lunes de la semana de `ref`, como Y-M-D local. Acepta Date o "YYYY-MM-DD". */
export function lunesDeSemana(ref: Date | string = new Date()): string {
  const d = typeof ref === "string" ? new Date(ref + "T00:00:00") : new Date(ref);
  const dow = d.getDay();                 // local
  const diff = dow === 0 ? -6 : 1 - dow;  // semana arranca lunes
  d.setDate(d.getDate() + diff);
  return ymdLocal(d);
}
```
Claves: `new Date(ymd + "T00:00:00")` parsea como **medianoche local** (no UTC), y
`ymdLocal()` formatea en local. Así guardar y leer usan exactamente el mismo criterio.

### Cablear
- **historial.ts**: `hoy()` → `ymdLocal()`; `lunesDe(fecha)` → `lunesDeSemana(fecha)`
  (borrar las dos funciones locales y la fecha que va a `fechaRealizada`/`idHist`
  debe salir de `ymdLocal()`).
- **Home.tsx**: borrar `lunesDeSemana()` local e importar la de `lib/semana`.
- Buscar en TODO el repo otros `new Date(...).getDay()` sobre strings `YYYY-MM-DD`,
  `toISOString().slice(0,10)`/`.split("T")[0]` usados como "fecha de hoy", y
  cualquier otro `lunesDe*` (p. ej. en `sesionDeHoy.ts`, `proximaSesion`, Historial,
  Salud, seeds) → unificar contra `lib/semana`. `calcRacha` ya usa `T12:00:00`
  (mediodía, a salvo del corrimiento) — dejalo, pero pasalo por el mismo helper si
  aplica.

## Datos viejos (una sola vez, opcional)
Las sesiones ya guardadas con `semanaInicio` corrido seguirán mal hasta recalcularse.
Script chico `scripts/fix-semana-inicio.ts`: por cada doc de /historial, recomputar
`semanaInicio = lunesDeSemana(fechaRealizada)` y actualizar si cambió (idempotente,
con `--dry-run`). La mayoría no cambia; solo las registradas en la franja nocturna.

## Tests
- `lib/semana.test.ts`: `ymdLocal` y `lunesDeSemana` con un instante nocturno simulado
  (mockear TZ a America/Argentina/Buenos_Aires o fijar el reloj a 2026-06-29T23:30
  local) → el lunes NO se corre de semana; un domingo 23:30 cae en la semana que
  empieza el lunes correcto.
- Caso de regresión: sesión guardada el domingo de noche y leída el lunes → el anillo
  la cuenta en la semana correcta (1/N, no 0/N ni desaparece).
