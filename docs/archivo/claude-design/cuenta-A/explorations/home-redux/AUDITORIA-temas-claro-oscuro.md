# Auditoría — Temas claro/oscuro (5 temas) · prototipo vs. tokens vs. kit vs. vivo

Fecha: 2026-07-17. Alcance: por qué "al cambiar a claro se ve mal" y por qué el
toggle no está disponible en todos los temas. Se auditan **tres fuentes** que hoy
**no coinciden**.

## Lo que encontré: hay DOS sistemas de theming en paralelo

### 1. `colors_and_type.css` (fuente de verdad del design system) — DESACTUALIZADO
- Define **8 temas**: `ion, volt, solar, blaze, crimson, pulse, grape, indigo`
  vía `[data-theme]`.
- Es **solo oscuro**: `color-scheme: dark`, base oscura fija ("la base oscura no
  cambia; lo que cambia es la familia del acento"). **No existe ningún
  `[data-mode="light"]` ni variante clara de ningún token.**
- → Cualquier consumidor de estos tokens (incluido el UI kit) **no tiene modo
  claro**: al forzar claro, no hay tokens que respondan → se ve mal.

### 2. `explorations/home-redux/home-redux.css` (prototipo Home Redux) — ES EL BUENO
- Consolida a **5 acentos**: `ion, volt, blaze, indigo, pulse` (se descartaron
  solar, crimson, grape). Coincide con "mantuvimos todos, son 5".
- Separa acento de modo: `[data-accent]` + `[data-mode="dark"|"light"]`, con
  **valor dark y valor light-AA por acento** (`--acc-d` / `--acc-l`).
- **Claro y oscuro andan bien** en las 2 direcciones (Pulso / Sereno v2) y los 5
  acentos — verificado por captura.
- **Toggle sol/luna en el copete** (`.hdr-toggle`, `[data-toggle-mode]`),
  presente en Home y Configuración, en ambas direcciones y los 5 acentos.
- Nota: el `indigo` del prototipo (`#8b90ff` / `#4f46e5`) **no** es el mismo hex
  que el `indigo` de `colors_and_type.css` (`#7c83ff` / `#6366f1`). Hay que fijar
  cuál queda.

### 3. `ui_kits/shapeup/` (UI kit) — DESALINEADO con la decisión de 5 + claro/oscuro
- Consume `colors_and_type.css` → hereda los **8 temas solo-oscuro**.
- `index.html` **no tiene toggle de modo ni `data-mode`**: el frame es dark fijo.
- `README.md` todavía dice **"selector de tema (8, por miembro)"** y **3 layouts
  de home (Aurora / Stadium / Clásico)** — no refleja los 5 temas ni las
  direcciones Pulso / Sereno v2 del rediseño.

## Diagnóstico de los 2 síntomas reportados
1. **"Al cambiar a claro se ve mal"** → porque el modo claro **solo existe en el
   prototipo Home Redux**. Ni los tokens del design system ni el kit tienen capa
   clara; el vivo la tiene parcial (donde se portó el rediseño), pero los tokens
   base que comparte con el resto de pantallas siguen siendo dark-only → mezcla.
2. **"El toggle debería estar en el copete y para todos los temas"** → hoy el
   toggle solo vive en el prototipo. En tokens/kit no existe; en el vivo, si está,
   no está garantizado en las pantallas que no son Home Redux.

## Qué falta sincronizar (kit ↔ vivo)
**Agregar al kit lo que ya está en el vivo (rediseño):**
- Capa **light/dark** en los tokens (portar el patrón `--acc-d`/`--acc-l` +
  `[data-mode]` del prototipo a `colors_and_type.css`).
- **Toggle de modo en el copete**, disponible en todas las pantallas y los 5 temas.
- Pantalla/card de **Configuración → Apariencia** (modo + acento + preview).

**Revisar qué hay en el kit que NO está en el vivo (o quedó viejo):**
- El kit ofrece **8 temas**; la decisión es **5**. Quitar solar/crimson/grape del
  kit y del selector (o confirmar que el vivo ya los quitó).
- README del kit desactualizado (8 temas, layouts viejos) → reescribir a 5 temas
  claro/oscuro + direcciones Pulso/Sereno v2.

## Decisión pendiente del owner
- ¿Los 5 temas definitivos son `ion, volt, blaze, indigo, pulse`? (así en el
  prototipo). Confirmar los hex de `indigo`.
- ¿El modo por defecto sigue siendo oscuro con opción de claro/sistema?
