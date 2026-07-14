# P54 — Fix: rampa anti-empaste, nav por dirección, caso crítico QA (Home Redux Pulse/Premium)

## Origen
Auditoría `docs/home-redux/AUDITORIA-P53-vs-handoff.md` (o el mismo archivo en el
proyecto de diseño) sobre lo implementado en P53. Tres fixes puntuales, sin tocar
nada que ya funciona.

## Fix 1 — Rampa de intensidad por acento (anti-empaste)
`src/styles/home-redux.css` hoy solo define `--accent`/`--accent-dim` por modo.
Agregar los 5 niveles derivados de cada acento, en el mismo bloque `[data-mode]`:

- `--accent-subtle` ≈ 8–12% alpha — fondos teñidos (chips "done", pastilla nav activo, relleno duotono).
- `--accent-border` ≈ 25–30% alpha — bordes teñidos (ej. `.a-hero`, hoy usa `color-mix(... 30%, var(--border))` inline: reemplazar por el token).
- `--accent-muted` — iconos secundarios (hoy varios usan `var(--accent)` a secas; bajar a este nivel donde el ícono no es foco).
- `--accent-solid` — el propio `var(--accent)` actual; usar el token nuevo como alias explícito.
- `--accent-strong` — hover/pressed (ya existe como concepto en `:hover`/`:active`, formalizarlo como token).

Reasignar en el CSS: anillo (`.a-ring .seg.on`, `.c-ring .pr`), CTA (`.a-btn1`, `.c-btn1`)
e ítem activo del nav consumen `--accent-solid`. Todo lo demás (chips "done", avatar,
badges, hero) baja a `-subtle`/`-border`/`-muted`. Verificar que ningún componente
quede referenciando `var(--accent)` crudo después del cambio — solo los 5 tokens.
Ajustar alphas por modo si algún nivel no llega a AA sobre texto/iconos.

**Regla de aceptación:** contar cuántos elementos usan `--accent-solid` en una
pantalla de Home — no puede haber más de 3 (anillo, CTA, nav activo).

## Fix 2 — Nav inferior con identidad de dirección
Hoy Home en Pulse/Premium usa el `.nav-item`/`.bottom-nav` genérico (P53 lo dejó
fuera a propósito). Portar `nav.a-nav`/`nav.c-nav` de
`docs/home-redux/design_handoff_theming/home-redux.css` (líneas del bloque nav) a
`src/styles/home-redux.css`, y en `src/layout/AppShell.tsx` renderizar el nav con
la clase de dirección correspondiente **solo cuando el `HomeLayout` activo es
`pulse`/`premium`** (leer con `getHomeLayout(memberId)`, igual que ya hace `Home.tsx`).
Fuera de esos dos layouts, el nav sigue como está — no se toca para aurora/stadium/clásico.

**Regla de aceptación:** con layout Pulse, el ítem activo muestra la barra de 3px
arriba; con Premium, la pastilla duotono con radio firma — en ambos modos y con
los 5 acentos.

## Fix 3 — Corregir el caso crítico semántico en QA
`src/routes/QaHomeRedux.tsx` usa un único `MOCK_DATA` fijo con
`peso.deltaFavorable: false` (delta rojo) en las 20 combinaciones — no cubre el
caso que motivó la validación: **Volt activo + delta positivo (verde)**.

Cambiar a dos sets de mock data y renderizar cada combinación dos veces (o agregar
una fila fija adicional destacada): uno con `deltaFavorable: true` (verde) y otro
con `false` (rojo), dejando en evidencia al menos la celda `acento=volt` con delta
verde. Alternativa más simple: si por espacio conviene una sola grilla, cambiar el
mock global a `deltaFavorable: true` y agregar un bloque separado arriba de la
grilla con únicamente "Volt · dark · delta positivo" y "Volt · light · delta
positivo" en grande, con un label que diga qué se está verificando.

**Regla de aceptación:** la ruta `/qa/home-redux` muestra, de forma explícita y
legible, Volt + delta positivo sin que el pill de delta se confunda con el acento
(por forma — flecha + pill — no solo por color).

## Fuera de alcance (no tocar en este pase)
Persistencia (sigue en localStorage), Configuración como card en Perfil (no se
separa a screen propia), verificación visual de Home/Perfil logueado — quedan
como decisiones ya tomadas en P53, pendientes de confirmación del owner por
separado.

## Verificación
`npx tsc -b` + `npx vitest run` limpios. Visual: `/qa/home-redux` con Playwright
headless, escala de grises incluida, para las 20 combinaciones y el caso crítico
del Fix 3.
