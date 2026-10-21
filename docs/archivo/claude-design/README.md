# Archivo de Claude Design

Lo que había en **Claude Design** (la versión por separado) y no estaba en el repo, traído por P104 el
21/10/2026. **La versión de Claude Design por separado cierra el 14/12/2026**: lo que no estuviera acá
para entonces se perdía.

**Esto es archivo, no fuente de verdad.** La fuente de verdad del diseño sigue siendo el sistema de
diseño de la raíz del repo (P100: `README.md`, `SKILL.md`, `colors_and_type.css`, `styles.css`,
`assets/`, `preview/` y `ui_kits/`). Lo que la auditoría de diseño (P101) decida rescatar de acá vuelve a
la raíz por un prompt de Code. Plan y estado: `docs/AUDITORIA-DISENO.md`.

## De dónde sale cada cosa

| Carpeta o archivo | Cuenta | Proyecto | Descargado |
|---|---|---|---|
| `cuenta-A/` | **Cuenta A** («Cuenta 1» para Juan) | «ShapeUp Design System», design system id `9dcf2f54…`, con 5 temas, modo claro y `explorations/` | 21/10/2026 (`design-A-design-system.zip`, 167 archivos) |
| `cuenta-B/BRIEF-para-design.md` | **Cuenta B** («cuenta 2» para Juan) | El design system viejo, id `e649aeba…`: un solo tema, sin modo claro. Es lo único de esa cuenta que no estaba en el repo | 21/10/2026 (`design-B-design-system.zip`, en `export-completo/_design-system-adjunto/uploads/`) |
| `handoff-design-2026-09-25.md` | — | El handoff que Juan le pasó a Design el 25/09/2026, con 6 superficies nuevas | Lo dejó el chat el 21/10/2026 |

Los inventarios de las dos cuentas, que Design escribió el 21/10, están en `docs/reportes/`:
`design-export-cuenta-A-2026-10-21.md` y `design-export-cuenta-B-2026-10-21.md`.

**El proyecto del handoff de la cuenta A** (el de `ShapeUp Estados.dc.html` y `HANDOFF-portado.md`)
**no se encontró** y no está acá. Lo que se sabe de él está en `docs/AUDITORIA-DISENO.md` §8.

## Qué hay en `cuenta-A/`

- **`explorations/`:** las decisiones, auditorías y mocks de junio a julio que el repo citaba sin tenerlos:
  - `DECISION-home-aurora.md` (la cita P31) y `DIRECCIONES-DISENO-home.md`;
  - las auditorías `AUDITORIA-UI-2026-06-10`, `AUDITORIA-kit-datos-jun2026` y `AUDITORIA-d9-d10`, con sus
    versiones en HTML;
  - en `home-redux/`: las auditorías P53, P54 y de temas claro/oscuro (la cita P65), `P54-fix-theming.md`
    y las copias de trabajo de `home-redux.css` y del prototipo, posteriores al handoff;
  - los mocks `Home Aurora+ (mock).html`, `Entrenar - opciones de media.html` y `vr-headers-check.html`;
  - las capturas que citan esas auditorías: `audit-shots/`, `auditoria-evidencia/`, `_b.png`, `_c.png` y
    `_preview.png`.

  **No se copió `explorations/home-redux/design_handoff_theming/`:** es idéntico a
  `docs/home-redux/design_handoff_theming/` (los cuatro archivos, comparados por hash sin el final de línea).
- **`design-canvas.jsx`, `.design-canvas.state.json` y `_opts.png`:** el lienzo de Design.
- **`pwa-iconos-opciones.html` y `assets/pwa-options/`:** las 10 variantes de ícono de la PWA que se
  evaluaron. Los íconos en uso están en `assets/pwa/` de la raíz.
- **`prompts-code/`:** solo los que difieren de `docs/prompts/`:
  - `37-f-flujo-programa.md`: cambia la ruta a `MAPEO-ADDENDUM` (el del repo es el más nuevo);
  - `45-borrar-historial.md`: tiene una sección más, el botón «Borrar esta sesión» en `HistorialDetalle`;
  - `MAPEO-ADDENDUM.md`: distinto de `docs/reportes/MAPEO-ADDENDUM.md` (tiene filas D14b, B2 y F4, y una
    «Deuda abierta tras B2»).

  Los otros 28 archivos de `prompts-code/` (del 46 al 49 y `PROMPTS-design.md` incluidos) son iguales a
  los del repo sin el final de línea, y no se copiaron.
- **`scripts/data/traducciones-fedb.es.json` y `scripts/borrar-historial.ts.txt`.**

**Los HTML piden `../colors_and_type.css`**, que en esta carpeta no existe: para verlos con estilo,
abrilos con un servidor desde la raíz o copialos al lado de `colors_and_type.css`.

## Lo que no se trajo, y por qué

- **Los generados de la plataforma:** `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` y
  `.thumbnail`.
- **`uploads/`:** copias viejas de documentos que el repo ya tiene.
- **`fedb/`:** igual al del repo.
- **`assets/pwa/`:** los íconos son iguales a los de `assets/pwa/` de la raíz, con otra ruta.
  `assets/pwa/30-d8-pwa-instalar.md` es igual a `docs/prompts/30-d8-pwa-instalar.md`.
- **Lo de la raíz** (`colors_and_type.css`, `styles.css`, `thumbnail.html`, `preview/` y `ui_kits/`): no
  está acá porque pasó a ser la raíz del repo (commit de P104).
- **El design system viejo de la cuenta B:** superado. Solo se guardó el brief.
