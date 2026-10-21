# Inventario del proyecto ShapeUp — EXPORT 2026-10-21

> El pedido traía `[CUENTA]` sin completar y yo no puedo ver el nombre de la cuenta. Por eso el archivo se llama `EXPORT-CUENTA-2026-10-21.md`; renombralo con la cuenta real.

## 1. Identificación
- **Cuenta:** no la puedo determinar desde acá. Solo sé que el dominio del usuario es gmail.com.
- **Proyecto:** "ShapeUp Design System" (proyecto de tipo design system).
- **Fecha del inventario:** 2026-10-21.
- **Otros proyectos de ShapeUp en esta cuenta:** no puedo listarlos, así que no lo sé.
- **Repo comparado:** `jpcofano/shapeup@main`, commit resuelto `55a20d111119` (consultado el 2026-10-21 15:25 UTC). Lo leí con la conexión de GitHub, sin clonarlo. La comparación es por **hash de blob git**: calculé el SHA-1 de cada archivo local y lo comparé con el del repo. IGUAL significa byte a byte idéntico.

## 2. Árbol de archivos

No tengo fechas de creación ni de modificación confiables por archivo. Las fechas que aparecen abajo salen del nombre o del contenido del archivo.

Columnas: ruta · bytes · estado frente al repo.

### Raíz
- `README.md` · 13 389 · **DISTINTO** (repo: 13 444). No analicé el diff línea por línea.
- `SKILL.md` · 2 471 · **IGUAL**
- `colors_and_type.css` · 11 909 · **DISTINTO**. El repo tiene la versión vieja: 8 temas, solo oscuro (ver §5).
- `styles.css` · 750 · no existe en el repo. Es el punto de entrada del DS e importa `colors_and_type.css`.
- `thumbnail.html` · 1 147 · no existe en el repo. Es el tile del DS, creado en esta sesión.
- `design-canvas.jsx` · 50 083 · no existe en el repo. Es el shell del canvas de exploraciones.
- `pwa-iconos-opciones.html` · 3 102 · no existe en el repo. Muestra opciones de ícono PWA.
- `_opts.png` · 40 920 · no existe en el repo. Captura de las opciones PWA.
- `.design-canvas.state.json` · 100 · no existe en el repo. Estado del canvas (label "B · Aurora").
- `_ds_bundle.js` (205 576), `_ds_manifest.json` (18 263), `_adherence.oxlintrc.json` (5 067): los **genera el compilador** del DS. No hace falta llevarlos al repo.

### assets/
- `shapeup-icon.svg`, `shapeup-mark.svg`, `shapeup-wordmark.svg`, `shapeup-wordmark-light.svg` · **IGUALES** a `assets/` del repo.
- `pwa/manifest.json` · 1 156 · **IGUAL**
- `pwa/icons/*` (8 PNG: apple-touch, favicon 16/32/48, icon 192/512, maskable 192/512) · **IGUALES**, pero cambia la ruta: en el repo están en `assets/pwa/*.png`, sin la carpeta `icons/`.
- `pwa/icons-alt-v2/*` (8 PNG) · **IGUALES**, también con otra ruta: en el repo están en `assets/icons-alt-v2/`.
- `pwa/30-d8-pwa-instalar.md` · 4 013 · IGUAL a `docs/prompts/30-d8-pwa-instalar.md` del repo.
- `pwa-options/v01…v10-*.png` (10 PNG) · no existen en el repo. Son las 10 variantes de ícono PWA exploradas.

### preview/ (cards del DS)
- **Las 25 cards que existen en ambos lados son DISTINTAS.** Todas pesan entre 110 y 150 bytes más acá. Lo probable es que sea la línea `@dsCard` que agrega el sistema de diseño, pero no lo verifiqué card por card.
- `col-themes.html` además **cambió de contenido**: acá muestra 5 temas × claro/oscuro (4 210 bytes); en el repo, 8 temas solo oscuro (3 078).
- **Solo acá (5 cards):** `brand-pwa.html`, `cmp-bodymap.html`, `cmp-sparkline.html`, `cmp-steppers.html`, `cmp-vista-semanal.html`.

### ui_kits/shapeup/
Los 10 archivos que existen en ambos lados son **DISTINTOS**, y la versión de acá es mucho más grande en todos. El repo tiene una versión anterior del kit, sin Aurora, sin programas y sin mapa muscular.

| Archivo | Acá | Repo |
|---|---|---|
| README.md | 4 678 | 2 538 |
| app.css | 19 846 | 14 036 |
| app.jsx | 10 474 | 5 134 |
| data.jsx | 10 370 | 6 798 |
| index.html | 3 520 | 3 223 |
| primitives.jsx | 5 665 | 4 494 |
| screens-biblioteca.jsx | 10 082 | 6 685 |
| screens-entrenar.jsx | 20 267 | 8 659 |
| screens-home.jsx | 15 244 | 5 486 |
| screens-salud.jsx | 30 247 | 13 393 |

**Solo acá:** `body-map.jsx` (6 352) y `screens-programa.jsx` (6 868).

### explorations/home-redux/
- `design_handoff_theming/` (4 archivos: canvas HTML 70 768, README 8 398, Prototipo 16 617, home-redux.css 29 518) · **IGUALES** a `docs/home-redux/design_handoff_theming/` del repo.
- `Home Redux - Pulso y Sereno.html` · 70 768 · IGUAL al del handoff.
- `home-redux.css` · 30 467 · **DISTINTO** del handoff (29 518). Es la copia de trabajo, posterior al handoff.
- `ShapeUp Prototipo.html` · 17 598 · **DISTINTO** del handoff (16 617). También es la copia de trabajo.
- `AUDITORIA-P53-vs-handoff.md` (3 441), `AUDITORIA-P54-vs-main.md` (3 443), `AUDITORIA-temas-claro-oscuro.md` (3 745), `P54-fix-theming.md` (4 057) · **no existen en el repo**.

### explorations/ (resto)
Ninguno de estos archivos existe en el repo:
- `AUDITORIA-UI-2026-06-10.md` (9 059) + `Auditoria UI 2026-06-10.html` (23 136)
- `AUDITORIA-kit-datos-jun2026.md` (6 396) + `Auditoria ShapeUp jun2026.html` (15 719)
- `AUDITORIA-d9-d10.md` (2 130)
- `DECISION-home-aurora.md` (3 464)
- `DIRECCIONES-DISENO-home.md` (3 606)
- `Entrenar - opciones de media.html` (11 398)
- `Home Aurora+ (mock).html`: no pude leerlo porque el nombre tiene caracteres que la herramienta no acepta. No sé su tamaño ni si está completo.
- `vr-headers-check.html` (2 045)
- `_b.png`, `_c.png`, `_preview.png`, `audit-shots/01–05-shot.png`, `auditoria-evidencia/01–06-ev.png`: capturas de las auditorías.

### prompts-code/
Comparados contra `docs/prompts/` del repo:
- **IGUALES (26):** 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 38, 39, 40, 40b, 41, 42, 43, 44, 46-entrenar-videos-timer-persistencia, 47-demo-ejercicio-exacto, 48-bug-semana-timezone, 49-sacar-pistol-whip.
- **IGUAL:** `65-temas-claro-oscuro-sync-kit.md`
- **DISTINTOS:**
  - `37-f-flujo-programa.md`: acá 3 785, repo 3 799.
  - `45-borrar-historial.md`: acá 3 053, repo 2 548.
  - `MAPEO-ADDENDUM.md` (15 572): distinto de `docs/reportes/MAPEO-ADDENDUM.md` y de las 3 copias en `docs/archivo/docs-prompts/`.
  - `PROMPTS-design.md` (5 996): distinto de `docs/archivo/docs-prompts/PROMPTS-design.md` (4 161).

### Otros
- `fedb/exercises.json` · 1 001 472 · **IGUAL** (está en `fedb/` y en `scripts/fedb/` del repo).
- `scripts/data/traducciones-fedb.es.json` · 69 429 · no la encontré en el repo con esa ruta. El repo tiene `scripts/fix-traducciones-*.ts`.
- `scripts/borrar-historial.ts.txt` · 5 287 · no la encontré en el repo con esa ruta.
- `uploads/FORMA-DE-TRABAJO-comida-familiar.md` · IGUAL a `docs/FORMA-DE-TRABAJO-comida-familiar.md`.
- `uploads/MAPEO-IMPLEMENTACION.md`, `SAMSUNG-HEALTH-MAPEO.md`, `SEEDS.md` · IGUALES a `docs/archivo/uploads/*`. Las versiones vigentes en `docs/` del repo son más nuevas y más grandes.
- `uploads/pasted-*.png` (6): capturas pegadas en el chat. Por el timestamp del nombre son de junio de 2026 aproximadamente.

## 3. Historial (reconstruido)
No tengo el historial completo de la conversación: partes anteriores se recortaron. Lo que sigue sale de los archivos y del tramo del chat que todavía veo.

1. **Creación del DS, aprox. junio de 2026:** tokens `colors_and_type.css` (8 temas, oscuro), cards `preview/`, logo y wordmark, primera versión del UI kit.
2. **Prompts de pulido de diseño D1–D8 (23–30):** identidad y temas, Home, Entrenar, Biblioteca, Historial/Progreso, Salud, Perfil/Auth, PWA. Dejó `prompts-code/23…30` y `PROMPTS-design.md`.
3. **Exploración de Home → decisión Aurora:** `DIRECCIONES-DISENO-home.md`, `DECISION-home-aurora.md`, `Home Aurora+ (mock).html`, prompt 31 (D9).
4. **Iconos PWA:** `pwa-iconos-opciones.html`, `assets/pwa-options/`, `assets/pwa/`.
5. **Funcionalidades y pulido, prompts 32–47:** modo libre, ejercicio rico, mapa muscular, flujo de programa, MediaTabs, layouts de Home, traducciones, micro-interacciones, video demo, empezar ejercicio, borrar historial, videos/timer, demo exacta. Se fueron sumando al kit `body-map.jsx`, `screens-programa.jsx`, Sparkline, Stepper, RestRing y SesionLibre. También dejó `Entrenar - opciones de media.html`, `scripts/` y `MAPEO-ADDENDUM.md`.
6. **Auditorías de junio de 2026:** `AUDITORIA-UI-2026-06-10`, `AUDITORIA-kit-datos-jun2026`, `AUDITORIA-d9-d10`, con sus capturas.
7. **Prompts 48–49:** bug de semana por zona horaria y sacar Pistol Whip.
8. **Home Redux / theming:** dos direcciones (Pulse, Premium), modo claro/oscuro y 5 acentos. Dejó `explorations/home-redux/`. Al repo pasó solo el `design_handoff_theming/`.
9. **Auditorías P53 y P54 contra main:** `AUDITORIA-P53-vs-handoff.md`, `AUDITORIA-P54-vs-main.md`, `P54-fix-theming.md`.
10. **Esta sesión:** auditoría de temas claro/oscuro (`AUDITORIA-temas-claro-oscuro.md`) y prompt 65. Después actualicé el DS acá: tokens a 5 temas con claro/oscuro, toggle en el copete del kit, Apariencia en Perfil, card `col-themes` y README del kit. También se agregó `thumbnail.html`. Un `50-fix-theming.md` se creó y se borró por estar duplicado.
    - **Ojo:** dentro de `AUDITORIA-temas-claro-oscuro.md` puse "Fecha: 2026-07-17". **Esa fecha no es confiable.** La fecha real de la sesión no la sé con certeza.

## 4. Pantallas y componentes del kit (`ui_kits/shapeup/`)

| Pantalla / componente | ¿Está? | Estados |
|---|---|---|
| Login | Sí | Entrar con Google (mock), toggle de modo |
| Inicio Aurora | Sí | Anillo de progreso, "Hoy toca" o "Día de descanso", bento, vista semanal |
| Inicio Stadium | Sí | Hero marquesina, stats |
| Inicio Clásico | Sí | Tarjetas |
| **Inicio Pulse** | **No en el kit** | Solo en `explorations/home-redux/` (canvas y prototipo) |
| **Inicio Premium** | **No en el kit** | Solo en `explorations/home-redux/` |
| Selector de estilo de inicio | Sí, en Perfil | Solo Aurora / Stadium / Clásico |
| Entrenar (landing) | Sí | Hoy toca, elegir rutina, sesión libre |
| Sesión guiada | Sí | Progreso global, ‹›, ProgressDots, steppers, banners, serie hecha → descanso con RestRing → finish con RPE; modo scroll |
| Pestañas Foto/Demo/Músculo | Sí (`MediaTabs`) | Con o sin imagen, demo play o reproduciendo, músculo con o sin datos |
| Mapa muscular | Sí (`BodyMap`) | Primario y secundarios, frente y espalda |
| Sparklines | Sí (`Sparkline`, `MiniChart`) | — |
| Récords | Sí | PR con trofeo en Historial → Progreso |
| Sesión libre | Sí (`SesionLibre`) | Agregar, reordenar, borrar, series y reps, empezar |
| Biblioteca | Sí | Pestañas Programas / Rutinas / Ejercicios, buscador, filtros, detalle con video, BodyMap y ficha técnica |
| Programas | Sí | Detalle, "Activar para mí", vista semanal |
| Historial | Sí | Sesiones y Progreso, detalle |
| Salud | Sí | Composición, Cardio, Sueño y Progreso; zonas FC; preview de importación CSV |
| Perfil | Sí | Apariencia (claro/oscuro), 5 temas, estilo de inicio, instalar app, cambiar miembro |

**Lo del handoff del 25/09: nada de esto está en este proyecto.** Busqué en todos los archivos y no lo encontré:
- Configuración (Mío / De la familia)
- Chip de sincronización
- Tarjeta de progresión de VR
- Sesión por tiempo
- Sesión de juego
- Chip de dificultad al cerrar VR
- Tarjeta de adherencia
- Tira semanal con 4 estados: el `WeekStrip` del kit solo distingue hoy, marcado y vacío.
- Historial con actividades externas

En el repo hay un `docs/reportes/estado-funcional-2026-09-25.md`. Es posible que ese handoff se haya hecho en la otra cuenta, pero no lo puedo confirmar.

**Configuración como pantalla propia** existe solo en el prototipo de `explorations/home-redux/` (sección Apariencia). No está en el kit.

## 5. Tokens y temas
- **Temas:** 5 (Ion, Volt, Blaze, Indigo, Pulse), por miembro. Cada uno tiene su par oscuro y claro (`--acc-d` / `--acc-l`).
- **Modo claro:** sí. Se activa con `[data-mode="light"|"dark"]` y cambia superficies, texto, acento, sombras y `color-scheme`. El default es oscuro.
- **Fuentes:**
  - El DS usa la fuente del sistema (`system-ui`), sin webfonts.
  - Home Redux (explorations) usa Archivo y Hanken Grotesk.
  - La exploración Aurora usaba Space Grotesk, según el label del canvas.
- **Direcciones Pulse y Premium:** existen solo en `explorations/home-redux/home-redux.css` y en el handoff, con los ejes `data-direction` / `data-theme` / `data-accent`. No están en `colors_and_type.css` ni en el kit.
- **Diferencias con `colors_and_type.css` del repo:**
  - El repo tiene 8 temas (también Solar, Crimson y Grape) y es solo oscuro.
  - En el repo cada tema tiñe las superficies.
  - En el repo Indigo es `#7c83ff`; acá es `#8b90ff` / `#4f46e5`.
  - Acá hay 5 temas, las superficies son neutras y dependen del modo, y existen los bloques `[data-mode]`.
  - **El `colors_and_type.css` de la raíz del repo no se actualizó con P65.** El vivo (`src/`) ya maneja `data-mode` en `AppShell.tsx`, pero no revisé sus tokens a fondo.

## 6. Lo que no está en el repo
- **Decisiones y exploraciones:**
  - `explorations/DECISION-home-aurora.md`, `DIRECCIONES-DISENO-home.md`
  - `Home Aurora+ (mock).html`, `Entrenar - opciones de media.html`, `vr-headers-check.html`
- **Auditorías:**
  - `AUDITORIA-UI-2026-06-10` (.md y .html), `AUDITORIA-kit-datos-jun2026` (.md), `Auditoria ShapeUp jun2026.html`, `AUDITORIA-d9-d10.md`, con sus capturas.
  - En home-redux: `AUDITORIA-P53-vs-handoff.md`, `AUDITORIA-P54-vs-main.md`, `AUDITORIA-temas-claro-oscuro.md`, `P54-fix-theming.md`.
- **Copias de trabajo de Home Redux** posteriores al handoff: `home-redux.css` y `ShapeUp Prototipo.html`.
- **UI kit completo actual:** el repo tiene una versión vieja.
- **Cards nuevas:** brand-pwa, cmp-bodymap, cmp-sparkline, cmp-steppers, cmp-vista-semanal. Además, `col-themes` actualizada.
- **Tokens a 5 temas + claro/oscuro** en `colors_and_type.css`, más `styles.css` y `thumbnail.html`.
- **Exploración de íconos PWA:** `pwa-iconos-opciones.html` y `assets/pwa-options/`.
- **Scripts:** `scripts/data/traducciones-fedb.es.json` y `scripts/borrar-historial.ts.txt`.
- **Propuestas que nunca se implementaron o que no puedo confirmar:**
  - Las direcciones Pulse y Premium en el kit.
  - Configuración como pantalla propia: según la auditoría P53, en el vivo quedó como card dentro de Perfil.
  - No sé si las variantes de ícono PWA v01–v10 se descartaron todas.

## 7. Lo que no sé
- El nombre de la cuenta y si hay otros proyectos de ShapeUp en ella.
- Las fechas exactas de creación y modificación de cada archivo, y las fechas de cada iteración.
- El historial completo del chat, porque partes se recortaron.
- Qué cambia en `README.md` de la raíz y en las 24 cards que solo difieren en tamaño. No hice el diff de contenido.
- El contenido y el estado de `Home Aurora+ (mock).html`, que no pude leer.
- Si los tokens del vivo (`src/`) coinciden con los de acá. No los comparé en detalle.
- La comparación es contra el commit `55a20d1`. Si hubo pushes después del 2026-10-21 15:25 UTC, no están contemplados.
