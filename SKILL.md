---
name: shapeup-design
description: Use this skill to generate well-branded interfaces and assets for ShapeUp, either for production or throwaway prototypes/mocks/etc. ShapeUp is a dark-themed family fitness app (sibling of the Comida Familiar app). Contains essential design guidelines, colors, type, the FC heart-rate zone scale, fonts, logo assets, and a full interactive UI kit for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill first — it covers the product context, the
sibling relationship with Comida Familiar, the identity layer (logo, brand green, FC zones,
fitness states), and the full content + visual + iconography guidelines. Then explore the
other files.

Key files:
- `colors_and_type.css` — the source of truth for tokens. Always import it; never hardcode hex.
- `assets/shapeup-*.svg` — logo (icon, mark, wordmark light/dark).
- `preview/*.html` — Design System cards (color / type / spacing / components).
- `ui_kits/shapeup/` — interactive, high-fidelity recreation of the app. Reuse its screens and
  primitives (`Avatar`, `WeekStrip`, `ProgressDots`, `DescansoTimer`, `MiniChart`, badges,
  banners) instead of reinventing them.

Non-negotiables when designing for ShapeUp:
- **Dark theme**, mobile-first, single column. Respect the fixed **6-item bottom nav**
  (Inicio · Rutinas · Entrenar · Historial · Salud · Perfil) and the fullscreen no-nav workout
  session.
- UI copy in **Argentine Spanish (voseo)**, sentence case, section labels in UPPERCASE.
- **Lucide** icons at `stroke-width: 1.8`. Logo from `assets/`. Never hand-draw SVG icons or
  use emoji as UI icons (only the inherited glyph set: 🎉 😴 🥽 ✅ ⚠️ ⏱).
- Brand accent = electric green `#4ade80`, used with discipline. Use the FC zone scale
  (`--zona-z1..z5`, cold→hot) for any heart-rate / cardio / intensity UI.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create
static HTML files for the user to view. If working on production code (the `jpcofano/shapeup`
repo), copy assets and apply these rules to design with the brand — and remember the brief:
Design touches presentation only, never the logic (`lib`/`data`/`types`/`auth`).

If the user invokes this skill without other guidance, ask what they want to build or design,
ask a few focused questions, and act as an expert ShapeUp designer who outputs HTML artifacts
or production code, depending on the need.
