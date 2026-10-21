# 104 — Traer lo de Claude Design al repo, antes de que cierre

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**. Este archivo ya está en `docs/prompts/` (lo dejó el chat, sin commitear). Va en el primer commit.

**Modo: «pará y reportá».** Si algo no coincide con lo que dice este prompt, no lo reinterpretes: pará y reportá.

## Contexto

- **Leé primero `docs/AUDITORIA-DISENO.md`.** Está en el repo y todavía sin commitear. Es el plan de la auditoría de diseño (P101) y el registro de lo que había en Claude Design.
- **Claude Design por separado cierra el 14/12/2026.** Lo que no esté en el repo para entonces se pierde.
- **Juan trabajó Design en dos cuentas:**
  - **Cuenta A:** el proyecto «ShapeUp Design System». Es el más avanzado y es más nuevo que el sistema de diseño de la raíz del repo.
  - **Cuenta B:** tiene un design system viejo, anterior a los temas. De ahí solo se guarda el inventario.
- **Este prompt no toca `src/`, la UI ni Firestore.** Solo trae archivos y documentación.
- **Sin deploy.**

## Insumos (en `docs/auditorias/design-exports/`, que git ignora)

El chat los revisó, los renombró y los dejó ahí el 21/10. Los zips no se commitean (`*.zip` está en `.gitignore`).

| Archivo | Qué es | Qué se hace |
|---|---|---|
| `design-A-design-system.zip` | Cuenta A: el «ShapeUp Design System» (id `9dcf2f54…`), 167 archivos, con 5 temas, modo claro y `explorations/`. Es el original que bajó Juan. El «export completo» posterior de esa cuenta tiene lo mismo; solo difieren los dos wordmark, por una reescritura de comillas que hizo la copia | Partes 1 y 2 |
| `design-B-design-system.zip` | Cuenta B: el design system viejo (id `e649aeba…`): un solo tema, sin modo claro, sin `explorations/` | Solo `BRIEF-para-design.md`, en la Parte 2 |
| `design-export-cuenta-A-2026-10-21.md` | El inventario de la cuenta A | Parte 2, a `docs/reportes/` |
| `design-export-cuenta-B-2026-10-21.md` | El inventario de la cuenta B | Parte 2, a `docs/reportes/` |
| `handoff-design-2026-09-25.md` | El handoff que Juan le pasó a Design el 25/09 | Parte 2 |
| `ESTADO-DEL-PROYECTO-2026-10-21.md` | El traspaso del 21/10 | Parte 0 |

**El proyecto del handoff** es el que tiene `ShapeUp Estados.dc.html` y `HANDOFF-portado.md`, y **todavía no se descargó**.
- Si en esa carpeta aparece `design-A-handoff.zip` (o cualquier zip que tenga `ShapeUp Estados.dc.html`), hacé la Parte 3.
- Si no aparece, salteala y anotalo.

**Cómo tratar los zips:**
- Extraé cada uno en una carpeta temporal **fuera del repo**.
- No ejecutes nada de lo extraído.
- Verificá que ninguna ruta salga de la carpeta (`..` o rutas absolutas).

## Parte 0 — Los documentos pendientes del 21/10

1. **`docs/AUDITORIA-DISENO.md`:** revisá que no repita nada que ya tenga lugar según la tabla «Documentación» de `CLAUDE.md`. Si choca con algo, pará y reportá.
2. **El traspaso:** copiá `docs/auditorias/design-exports/ESTADO-DEL-PROYECTO-2026-10-21.md` a `docs/ESTADO-DEL-PROYECTO.md`. Reemplaza al del 03/10. En su §6, paso 5, agregá al final: «Plan, diagnóstico y estado: `docs/AUDITORIA-DISENO.md`.»
3. **`docs/ROADMAP-producto.md`:** la misma remisión donde figure P101 o la auditoría de diseño. Si no figura, agregala en §11 como lo próximo de pantalla.
4. **Commit:** `docs — P101: plan de la auditoría de diseño y traspaso del 21/10`. Va con este prompt (`docs/prompts/104-…`).

## Parte 1 — La raíz del sistema de diseño, desde el zip A

**Antes de tocar nada:** buscá si algo de `src/`, `index.html`, `vite.config.ts` o los tsconfig importa o lee archivos de la raíz del sistema de diseño (`colors_and_type.css`, `styles.css`, `preview/`, `ui_kits/`). Si algo los usa, **pará y reportá**: esta parte no puede cambiar la app.

**Reemplazar con la versión del zip A, tal cual:**
- `colors_and_type.css`: pasa a tener 5 temas con claro y oscuro (P65).
- **`preview/`, completo:**
  - las 24 tarjetas que existen en los dos lados (en el zip llevan una línea `<!-- @dsCard … -->`; eso es lo esperado);
  - `col-themes.html`, actualizada;
  - 5 nuevas: `brand-pwa`, `cmp-bodymap`, `cmp-sparkline`, `cmp-steppers` y `cmp-vista-semanal`.
- **`ui_kits/shapeup/`, completo:** los 10 archivos, más `body-map.jsx` y `screens-programa.jsx`.

**Agregar:**
- `styles.css`, nuevo. Su comentario todavía dice «8 temas»; **no lo corrijas**, se arregla en el paso 2b de la auditoría.
- `thumbnail.html`, nuevo.

**No tocar:**
- `README.md`: el del zip es igual al del repo, salvo la línea de P100. Queda el del repo.
- `SKILL.md`: es igual.
- `assets/`: los SVG y los PNG de PWA son iguales; en el zip solo cambian de ruta.

**Verificación:**
- Abrí `ui_kits/shapeup/index.html` con un servidor estático (por ejemplo, `npx serve` o `vite preview` apuntando a la raíz, sin instalar nada nuevo). Confirmá que carga y que las rutas a `../../colors_and_type.css` y `../../assets/` resuelven.
- Si no se puede levantar, revisá las rutas a mano y anotalo.

**Commit:** `docs — P104: sistema de diseño de Claude Design (cuenta A) en la raíz`, con la lista de archivos en el cuerpo.

## Parte 2 — El archivo de Claude Design

Creá `docs/archivo/claude-design/` con un `README.md` que diga:
- de dónde sale cada carpeta (cuenta, proyecto, fecha de descarga: 21/10/2026);
- que la versión de Claude Design por separado cierra el 14/12/2026;
- que esto es **archivo**: no es fuente de verdad. La fuente de verdad sigue siendo la raíz (P100).

**Del zip A, a `docs/archivo/claude-design/cuenta-A/`:**
- `explorations/` completo, con sus capturas (`audit-shots/`, `auditoria-evidencia/`, `_b.png`, `_c.png`, `_preview.png`).
  - **Excepción:** `explorations/home-redux/design_handoff_theming/` no se copia. Es idéntico a `docs/home-redux/design_handoff_theming/`; verificalo con un hash, y si no es idéntico, pará y reportá.
- `design-canvas.jsx`, `.design-canvas.state.json` y `_opts.png`.
- `pwa-iconos-opciones.html` y `assets/pwa-options/` (las 10 variantes de ícono).
- **De `prompts-code/`, solo los que difieren de `docs/prompts/`:** el 37, el 45, `MAPEO-ADDENDUM.md` y `PROMPTS-design.md`. Los iguales no se copian; verificalo con un hash.
- `scripts/data/traducciones-fedb.es.json` y `scripts/borrar-historial.ts.txt`.

**Lo que no se trae del zip A:**
- los generados de la plataforma: `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` y `.thumbnail`;
- `uploads/`: son copias viejas de documentos que el repo ya tiene;
- `fedb/`: es igual;
- `assets/pwa/`: es igual, con otra ruta.

**Inventarios, a `docs/reportes/`** (hallazgos que tienen que quedar): `design-export-cuenta-A-2026-10-21.md` y `design-export-cuenta-B-2026-10-21.md`, con esos nombres.

**De la cuenta B, a `docs/archivo/claude-design/cuenta-B/`:**
- solo `_design-system-adjunto/uploads/BRIEF-para-design.md` del zip B, si no está ya en el repo;
- nada más: el design system viejo no se trae.

**El handoff del 25/09:** `handoff-design-2026-09-25.md`, a `docs/archivo/claude-design/`.

**Commit:** `docs — P104: archivo de Claude Design (explorations, auditorías e inventarios)`.

## Parte 3 — El proyecto del handoff de la cuenta A (solo si está el zip)

1. **Lo que se archiva:** `ShapeUp Estados.dc.html`, `HANDOFF-portado.md` y cualquier otro archivo propio del proyecto, en `docs/archivo/claude-design/cuenta-A-handoff/`. Lo generado por la plataforma no se archiva.
2. **El inventario:** su `EXPORT-….md`, a `docs/reportes/design-export-cuenta-A-handoff-2026-10-21.md`.
3. **No se porta nada a `src/`.** Esto es insumo de la auditoría.
4. **Commit:** `docs — P104: el proyecto del handoff del 25/09 (cuenta A)`.

## Parte 4 — Cerrar la documentación

- **`docs/AUDITORIA-DISENO.md`:**
  - en el §5, marcá el paso 1 como hecho (si se hizo la Parte 3) y el 2a como hecho;
  - en el §8, poné las rutas reales de lo archivado.
- **`docs/MAPEO-IMPLEMENTACION.md`:** la entrada de P104 en la bitácora y en el índice.
- **`docs/ROADMAP-producto.md`:** P104 hecho.
- **Commit:** `docs — P104: cierre`.

## Antes de terminar

- `npx tsc -b` limpio y `npx vitest run` verde. No se tocó código, pero se confirma que nada de la raíz entró al build.
- Después de cada commit: push y confirmar `origin/main` = `HEAD`.
- **Reporte en `docs/auditorias/ultimochat.md`:**
  - qué se trajo, qué no y por qué;
  - los hashes que comparaste y los que no coincidieron;
  - si la Parte 3 se hizo o se salteó;
  - las preguntas abiertas.
