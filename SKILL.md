---
name: shapeup-design
description: Use this skill to generate well-branded interfaces and assets for ShapeUp, either for production or throwaway prototypes/mocks/etc. ShapeUp is a family fitness app with 5 themes in light and dark (sibling of the Comida Familiar app). Contains essential design guidelines, colors, type, the FC heart-rate zone scale, fonts, logo assets, and a full interactive UI kit for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill first — it covers the product context, the
sibling relationship with Comida Familiar, the identity layer (logo, themed accent, FC zones,
fitness states), and the full content + visual + iconography guidelines. Then explore the
other files.

The kit matches the app as built (P105, 22/10/2026). **When the kit and the app differ, the app
wins**: the real source is the code (`src/styles/tokens.css`, `src/styles/home-redux.css`,
`src/components/`, `src/routes/`). Read «Cómo es la app hoy» in `README.md` first; some older
README sections describe June intentions.

Key files:
- `colors_and_type.css` — the kit's tokens, copied from the app's `src/styles/tokens.css`, plus
  the Home directions (Pulse/Premium) at the end. Always import it; never hardcode hex.
- `assets/shapeup-*.svg` — logo (icon, mark, wordmark light/dark).
- `preview/*.html` — Design System cards (color / type / spacing / components).
- `ui_kits/shapeup/` — interactive, high-fidelity recreation of the app. Reuse its screens and
  primitives (`Avatar`, `WeekStrip`, `ProgressDots`, `DescansoTimer`, `MiniChart`, badges,
  banners) instead of reinventing them.

Non-negotiables when designing for ShapeUp:
- **5 themes** (`data-theme`: ion · volt · blaze · pulse · indigo; default Ion) × **light and
  dark** (`data-mode`). In dark mode surfaces are tinted per theme; in light mode they are neutral
  and shared. Design for both modes.
- Fonts: `system-ui` everywhere. Archivo and Hanken Grotesk exist only for the Pulse and Premium
  Home styles, whose tokens apply in the app only to Home and the bottom nav.
- Mobile-first, single column. Respect the fixed **6-item bottom nav**
  (Inicio · Rutinas · Entrenar · Historial · Salud · Perfil) and the fullscreen no-nav workout
  session.
- UI copy in **Argentine Spanish (voseo)**, sentence case, section labels in UPPERCASE.
- **Lucide** icons at `stroke-width: 1.8`. Logo from `assets/`. Never hand-draw SVG icons or
  use emoji as UI icons (only the inherited glyph set: 🎉 😴 🥽 ✅ ⚠️ ⏱).
- Brand accent = the theme's accent (default Ion cyan `#22d3ee` dark / `#0e7490` light), used
  with discipline. Use the FC zone scale
  (`--zona-z1..z5`, cold→hot) for any heart-rate / cardio / intensity UI.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create
static HTML files for the user to view. If working on production code (the `jpcofano/shapeup`
repo), copy assets and apply these rules to design with the brand — and remember the brief:
Design touches presentation only, never the logic (`lib`/`data`/`types`/`auth`).

If the user invokes this skill without other guidance, ask what they want to build or design,
ask a few focused questions, and act as an expert ShapeUp designer who outputs HTML artifacts
or production code, depending on the need.
