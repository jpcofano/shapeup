# EXPORT — [CUENTA] — 2026-10-21

> Inventario solo de lectura. No modifiqué ni creé ningún otro archivo.
> Repo de comparación: `jpcofano/shapeup@main`, commit/árbol resuelto `55a20d111119` (lo leí con acceso de lectura, no lo cloné). Consulta: 2026-10-21 15:35 UTC.

---

## 0. Conclusión primero

**Este proyecto está vacío de trabajo propio.** El único contenido es la copia automática del design system adjunto (`_ds/…`, 6 archivos), que se generó hoy. No hay pantallas, `.dc.html`, exploraciones, decisiones, handoffs ni documentos. El título del proyecto es el texto de este mismo pedido, o sea que el proyecto se creó para hacer el inventario.

El trabajo de diseño visible desde acá vive en **otro proyecto**: el design system **"ShapeUp Design System"** (id `e649aeba-97b1-4335-94c3-1ce63ee3c226`), que este proyecto tiene adjunto. Lo inventarío aparte, en la §2b, porque es lo único con contenido para comparar contra el repo.

---

## 1. Identificación

- **Cuenta:** no sé cuál es. No veo el nombre ni el email de la cuenta; solo veo que el dominio del email es `gmail.com`. El nombre del archivo mantiene el marcador `[CUENTA]` para que lo reemplaces.
- **Proyecto:** "# Inventario del proyecto ShapeUp — cuenta [CUENTA]??Antes de que cierre esta ve" (es un título generado a partir del pedido).
- **Fecha:** 2026-10-21.
- **Otros proyectos de ShapeUp en esta cuenta:** desde acá solo puedo ver uno, el design system adjunto **ShapeUp Design System** (`e649aeba-97b1-4335-94c3-1ce63ee3c226`). No tengo forma de listar los proyectos de la cuenta, así que **no sé si hay otros** (por ejemplo, uno con Home Redux / Aurora).

---

## 2. Árbol de archivos

### 2a. Este proyecto

| Ruta | Tamaño | Modificado | ¿Existe en el repo? |
|---|---|---|---|
| `_ds/shapeup-design-system-e649aeba…/README.md` | 14.111 caracteres, 115 líneas | 2026-10-21 ~15:35 UTC (copia automática) | Sí, en `README.md` (13.444 bytes). **Distinto:** el repo pesa menos en bytes que esta copia en caracteres, así que no pueden ser iguales. |
| `_ds/…/colors_and_type.css` | 8.512 caracteres, 159 líneas | ídem | Sí (11.976 bytes). **Distinto**, ver §5. |
| `_ds/…/components.css` | 12.264 caracteres, 170 líneas | ídem | No está en la raíz del repo. Dice que está portado de `src/index.css` (50.422 bytes); no lo comparé línea por línea. |
| `_ds/…/_ds_bundle.js` | 92.251 caracteres, 3.357 líneas | ídem | No. Es la compilación de los JSX de `ui_kits/shapeup-app/`. |
| `_ds/…/_ds_manifest.json` | 9.263 caracteres | ídem | No. Es el manifiesto de las tarjetas de preview. |
| `_ds/…/_adherence.oxlintrc.json` | 4.244 caracteres | ídem | No. Son reglas internas de lint del design system. |

No hay `SKILL.md`, `assets/`, `preview/`, `ui_kits/`, `docs/` ni `explorations/` en este proyecto.

La fecha de modificación de estos archivos la deduzco de su marca de versión (`v1792596916…` = 2026-10-21 ~15:35 UTC). No es la fecha en que se diseñó el contenido.

### 2b. Proyecto adjunto "ShapeUp Design System" (`e649aeba…`), solo lectura

| Ruta | Tamaño | ¿En el repo? |
|---|---|---|
| `README.md` | ~14 KB (es el mismo texto que la copia `_ds`, verificado) | Sí, pero **distinto** (ver arriba). |
| `SKILL.md` | no lo medí | Sí (2.471 bytes). **No lo comparé.** |
| `colors_and_type.css` | 8.512 caracteres (igual a la copia `_ds`) | **Distinto.** |
| `components.css` | 12.264 caracteres | No está en la raíz. |
| `assets/shapeup-mark.svg` | no lo medí | Sí (336 bytes). **No comparé el contenido.** |
| `assets/shapeup-icon.svg` | no lo medí | Sí (407 bytes). **No comparé el contenido.** |
| `assets/shapeup-icon-dark.svg` | no lo medí | **No está en el repo.** El repo tiene en cambio `shapeup-wordmark.svg`, `shapeup-wordmark-light.svg`, `icons-alt-v2/` y `pwa/`. |
| `preview/` (19 archivos) | | El repo también tiene `preview/`, pero con **25 archivos y otros nombres**. Ningún nombre coincide salvo `brand-logo.html` y `type-scale.html`, que no comparé. |
| `ui_kits/shapeup-app/` (10 archivos) | | **No está.** El repo tiene `ui_kits/shapeup/`, que es otro kit (ver abajo). |
| `uploads/BRIEF-para-design.md` | no lo medí | En el repo hay `docs/prompts/` con 140 archivos; no verifiqué si este brief está entre ellos. |
| `.thumbnail`, `_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` | | No (son artefactos de la plataforma). |

**Las dos listas de `preview/`:**
- **Design system:** brand-logo, brand-nav, colors-accent, colors-base, colors-members, colors-semantic, colors-zones, comp-badges, comp-banners, comp-buttons, comp-cards, comp-inputs, comp-progress, comp-timer, radius, shadows, spacing, type-numbers, type-scale.
- **Repo:** brand-logo, cmp-avatars, cmp-badges, cmp-banners, cmp-buttons, cmp-dots, cmp-fitness-states, cmp-form, cmp-nav, cmp-rpe, cmp-rutina-card, cmp-timer, cmp-weekstrip, col-brand, col-members, col-semantic, col-surfaces, col-text, **col-themes**, col-zonas, sp-elevation, sp-radius, sp-spacing, type-num, type-scale.

**Los dos kits:**
- **Design system, `ui_kits/shapeup-app/`:** README, app.jsx, data.jsx, index.html, ios-frame.jsx, media.jsx, primitives.jsx, screens-main.jsx, screens-salud.jsx, screens-train.jsx.
- **Repo, `ui_kits/shapeup/`:** README, app.css, app.jsx, data.jsx, index.html, primitives.jsx, screens-biblioteca.jsx, screens-entrenar.jsx, screens-home.jsx, screens-salud.jsx.
- Comparten nombres de archivo, pero la estructura es distinta. **Son kits distintos.**

**`docs/home-redux/`:** está solo en el repo (`design_handoff_theming/`: `Home Redux - Pulso y Sereno.html`, `README.md`, `ShapeUp Prototipo.html`, `home-redux.css`). No existe ni acá ni en el design system.

**Fechas del design system:** la versión del README del kit equivale aproximadamente a **2026-06-24**. Es la única fecha que pude leer. No sé las fechas del resto de los archivos.

---

## 3. Historial

**Este proyecto:**
1. **2026-10-21:** se creó el proyecto con este pedido de inventario y se copió automáticamente el design system en `_ds/`.
2. **2026-10-21:** se escribió este archivo, `EXPORT-[CUENTA]-2026-10-21.md`.

No hay iteraciones anteriores.

**Design system adjunto:** no tengo acceso a su historial de conversaciones. Por el contenido, como mínimo hubo:
- la construcción del sistema (tokens, preview, logo);
- el kit `shapeup-app` con la sesión guiada;
- el agregado posterior de `media.jsx` (Foto/Demo/Músculo, BodyMap).

**No puedo ordenar ni fechar esas etapas.** La única fecha legible es la del README del kit (~2026-06-24).

---

## 4. Pantallas y componentes (kit del design system; este proyecto no tiene ninguno)

Lo que sigue sale de las funciones del bundle y del README del kit.

**Pantallas y componentes que están:**
- **`LoginScreen`:** "Entrar con Google" y entra como María.
- **`HomeScreen`:** "Hoy toca", programa activo y `WeekStrip`. Tiene **un solo estilo**.
- **`EntrenarScreen`:** el selector de rutina.
- **`SesionGuiada`:**
  - fullscreen, con dots de progreso y banners de técnica;
  - registro de serie y RPE;
  - cronómetro de descanso (+30 s / Saltar);
  - alterna entre modo guiado y modo scroll.
- **`MediaTabs`:** **sí** tiene pestañas **Foto/Demo/Músculo**, con Foto y Demo unificadas y videos de Wikimedia (CC BY 3.0).
- **`BodyMap`:** **sí**, es el mapa muscular frente/espalda.
- **`BibliotecaScreen` + `EjercicioDetalle`.**
- **`HistorialScreen`:** con tonelaje.
- **`SaludScreen`:**
  - pestañas Composición, Cardio, Sueño y Progreso;
  - `MiniChart`;
  - zonas de FC;
  - preview del import de Samsung CSV en bottom-sheet.
- **`PerfilScreen`.**
- **Primitivas:** `Icon` (Lucide), `MemberAvatar`, `WeekStrip`, `Badge`, `ZonaPill`, `BottomNav` (6 ítems), `Wordmark`, `PageHeader`, `Stat`, y el marco `IOSDevice`.
- **Datos:** 4 miembros, el programa de María (PRG-0012), una rutina "Cardio VR — Quema" e historial de cardio VR. **VR aparece solo como datos**, no como pantalla ni componente.

**Lo que no está.** Busqué cada término en el bundle y no aparece:
- **Inicio:** Aurora, Stadium, Clásico, Pulse, Premium y el selector de estilo. **No está ninguno.**
- **Sesión:** sparklines (lo más parecido es `MiniChart` en Salud), récords/PR y sesión libre. **No están.**
- **Handoff del 25/09:**
  - Configuración (Mío / De la familia);
  - chip de sincronización;
  - tarjeta de progresión de VR;
  - sesión por tiempo;
  - sesión de juego;
  - chip de dificultad al cerrar VR;
  - tarjeta de adherencia;
  - tira semanal con 4 estados (la `WeekStrip` del kit marca entreno/hoy; no verifiqué si llega a 4 estados);
  - historial con actividades externas.

  **No hay nada de este handoff, ni acá ni en el design system.**
- **Otras pantallas fuera de la lista:** no hay.

---

## 5. Tokens y temas (`colors_and_type.css`: copia del design system vs. repo)

**Copia de este proyecto y del design system:**
- **Un solo tema**, oscuro, con acento **verde `#4ade80`**. No hay modo claro ni `[data-theme]`.
- **Fuentes:** system-ui para la UI y **Saira** (Google Fonts) para display y números.
- **Direcciones Pulse / Premium: no existen.**

**Repo:**
- **9 conjuntos de tokens:** `:root` (por defecto, Ion) más 8 temas `[data-theme]`: ion, volt, solar, blaze, crimson, **pulse**, grape, indigo.
- El acento por defecto es **cian `#22d3ee`** (Ion); el verde pasa a ser el tema "Volt".
- El tema se elige por miembro.
- **Sin Saira:** system-ui puro, con la identidad en el peso y en tabular-nums.
- **Sin modo claro** en este archivo.
- Ahí **Pulse es un tema de color** (rosa `#ff4d79`), no una dirección de Home. **"Premium" no aparece.**

**Otras diferencias concretas:**
- **Zonas de FC:**
  - Z3: `#facc15` amarillo (acá) vs `#a3e635` lima (repo).
  - Z5: `#f43f5e` (acá) vs `#ef4444` (repo).
- **Nombres de tokens:**
  - espaciado: `--sp-*` vs `--space-*`;
  - radio: `--r-pill` vs `--r-full`;
  - tinta sobre el acento: `--accent-ink` vs `--on-accent`;
  - pesos: `--w-*` vs `--fw-*`;
  - el repo agrega `--fs-*`, `--lh-*`, `--tracking-*` y `--t-fast/base`.
- **`--accent-strong`:** `#22c55e` (acá) vs `#0891b2` (repo).
- **Estados:**
  - acá: `--estado-activo/listo` y `--glow-activo/fab`;
  - repo: `--estado-activa/pausa/hecho/descanso-urgent` y `--shadow-fab/menu`.
- **`--shadow-card`:** acá es un borde inset sutil; en el repo es `0 20px 60px` (modales).
- **Clases tipográficas:**
  - acá: `.t-brand`, `.t-h1/h2/h3`, `.t-muted`, `.t-timer`, `.t-stat`;
  - repo: `.t-h1`, `.t-page-title`, `.t-card-title`, `.t-secondary`, `.t-num`.

**En síntesis:** el repo tiene un sistema de tokens **más nuevo**, con temas. La versión de acá es anterior a los temas.

---

## 6. Lo que no está en el repo

**Lo que tiene el design system adjunto (no este proyecto):**
- El kit `ui_kits/shapeup-app/` (otra estructura que `ui_kits/shapeup/`), con:
  - `media.jsx`: MediaTabs Foto/Demo/Músculo y BodyMap;
  - `ios-frame.jsx`;
  - `SesionGuiada` con descanso.
- `assets/shapeup-icon-dark.svg`.
- 19 tarjetas de `preview/` con otros nombres. Las que tienen un nombre o tema sin equivalente evidente en el repo son `comp-cards`, `comp-progress`, `shadows`, `brand-nav` y `comp-inputs`.
- La capa tipográfica **Saira** y la paleta de zonas con Z3 amarilla, ambas descartadas o reemplazadas en el repo.
- `uploads/BRIEF-para-design.md`. No verifiqué si está en `docs/prompts/`.

**Lo que no existe en ninguno de los dos proyectos que puedo ver:**
- `explorations/DECISION-home-aurora.md` y `explorations/home-redux/AUDITORIA-temas-claro-oscuro.md`: **no existen acá ni en el design system.** Tampoco existe una carpeta `explorations/` en el repo.
- Propuestas no implementadas: no encontré ninguna documentada.

---

## 7. Lo que no sé

- **El nombre de la cuenta**, y si hay otros proyectos de ShapeUp en ella.
- **Las fechas** de creación y modificación de los archivos del design system, salvo el README del kit (~2026-06-24). Las fechas de `_ds/` son de la copia automática, no del diseño.
- **Si `SKILL.md`, `assets/shapeup-mark.svg`, `assets/shapeup-icon.svg`, `preview/brand-logo.html` y `preview/type-scale.html`** son iguales a los del repo: no comparé su contenido.
- **Si `components.css`** coincide con alguna parte de `src/index.css` del repo.
- **El historial de conversaciones** del proyecto del design system.
- **Si la `WeekStrip` del kit** cubre 4 estados: no leí su implementación completa.
- **El commit exacto:** `55a20d111119` es el hash del árbol que resolvió la herramienta; puede no ser el SHA del commit.
- **Dónde está el trabajo de Aurora, Home Redux y el handoff del 25/09** en Claude Design. Si existe, está en otro proyecto o en la otra cuenta. Lo que sí está en el repo es `docs/home-redux/design_handoff_theming/` ("Pulso y Sereno").
