# Auditoría D9–D10 + A2/B1 (repo vs target) — 2026-06-08

Revisión del repo `jpcofano/shapeup@main` contra los prompts 31–34. Mapeo confirmado:
D9, A2, B1, D10 **cerrados** el 2026-06-08, 158 tests verdes, `tsc -b` limpio.

## ✅ Lo que quedó fiel
- **D9 Home Aurora+** — `ProgressRing` SVG con glow + gradiente `url(#rg)` por tema vía
  `--ring-from/--ring-to` (color-mix), animación de llenado por `strokeDashoffset`, glass card
  con `backdrop-filter`, bento de 3 tiles (2 si no hay peso), estado "Semana completa" con check.
  Micro-fades con stagger (`aurora-anim-1..4`). **Coincide con el mock** `Home Aurora+ (mock).html`.
- **A2 Sesión libre** — `EntrenarSesionLibre.tsx`, `buildBloqueLibre`/`buildVirtualRutina`,
  Historial `tipo:"libre"`, 5 tests nuevos. Reducer puro intacto.
- **B1 Ficha técnica** — `FichaTecnica` en Catálogo (chips de músculos/nivel/mecánica/patrón/
  equipo), campos FEDB ya traducidos en import. Contexto compacto en `BloqueGuiado`.
- **D10 Pulido** — selector libre premium, ficha 2×2, badge "Libre" en detalle, micro-animaciones
  gateadas por `prefers-reduced-motion`.

## 🟡 Discrepancia menor (1) — pendiente
**Saludo usa nombre completo.** En `Home.tsx`, `PRIMER_NOMBRE` mapea
`juanpablo: "Juan Pablo"`, así que el saludo dice **"Dale, Juan Pablo."**. El target (mock + prompt
D2/D9) es **"Dale, Juan."** — solo el primer nombre, más punchy/atlético.
- **Fix:** `PRIMER_NOMBRE = { juanpablo: "Juan", maria: "María", sofia: "Sofía", federico: "Fede" }`
  (o "Federico" si no quieren el apodo).
- **Severidad:** cosmético, 1 línea. No bloquea. Va junto al próximo cleanup.

## Veredicto
La tanda 31–34 quedó **completa y fiel**. Solo queda el ajuste del primer nombre (1 línea),
para sumar al próximo prompt de cleanup junto con cualquier otro detalle que aparezca.

## Mock de referencia
`explorations/Home Aurora+ (mock).html` — Home Aurora+ con los 8 temas conmutables (barra
inferior). Es el target visual para comparar contra el repo. Reemplaza a las exploraciones
viejas (3 direcciones), que se eliminaron una vez decidida la dirección.
