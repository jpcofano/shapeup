# P53 — Home Redux: theming Pulse / Premium (handoff `docs/home-redux/`)

## Origen
`docs/home-redux/design_handoff_theming/` — paquete de diseño (HTML de referencia +
`home-redux.css` fuente de verdad de estilos + `README.md`). Rediseño de Home con
2 direcciones visuales × claro/oscuro/sistema × 5 acentos.

## Decisiones de alcance (confirmadas con el owner)
1. **No se reemplaza nada existente.** Los 8 temas actuales (Ion/Volt/Solar/Blaze/
   Crimson/Pulse/Grape/Indigo, `ThemeProvider` + `data-theme` global) siguen intactos
   para los layouts `aurora`/`stadium`/`clasico`.
2. **Se suman 2 opciones nuevas** a `HomeLayout` (`src/lib/homeLayout.ts`):
   `"pulse"` (dirección A del handoff) y `"premium"` (dirección B v2/v2.1 — `.dir-c.v21`).
   Mismo selector "Estilo de inicio" en Perfil, dos filas más.
3. Cuando el layout es `pulse`/`premium`, aparece una card "Apariencia" en Perfil
   (Claro/Oscuro/Sistema + 5 acentos duales Ion/Volt/Blaze/Indigo/Pulse — **distintos
   de los 8 temas globales**, con valores propios AA para claro y oscuro).
4. **Fase implementada ahora: Home + Configuración + ruta QA**, tal como pide el
   README del handoff. Nav inferior, Biblioteca, Entrenar, Historial, Salud NO se
   tocan — siguen con el look actual sin importar el layout de Home elegido.
5. Preferencias (`modo`, `acento`) en `localStorage` por miembro (mismo patrón que
   `ThemeProvider` y `homeLayout.ts` — no Firestore, para no romper la convención
   existente ni sumar costo Spark).

## Arquitectura de theming (scope local, no global)
Los tokens de la dirección nueva (`--bg`, `--card`/`--surface`, `--border`, `--fg`,
`--muted`, `--track`, `--accent`, `--accent-dim`, `--on-accent`, `--pos`/`--neg`)
se definen en un wrapper `<div class="dir-a" data-mode="..." data-accent="...">`
(o `dir-c v21`) que envuelve solo el contenido de Home cuando el layout es
pulse/premium — **no tocan `:root` ni `document.documentElement`**. Por cascada de
CSS custom properties, las clases genéricas del proyecto (`.card`, `.btn-primary`,
`.btn-secondary`, `.t-label`, `RecCard`) heredan los valores del wrapper sin cambios
de código — por eso `dir-c` alias `--card: var(--surface)` (el handoff usa nombres
distintos para superficie en B v2).

Archivo nuevo: `src/styles/home-redux.css` (importado desde `src/index.css`), con las
clases `.a-*` (dirección A) y `.c-*`/`.v21` (dirección B v2.1) portadas de
`docs/home-redux/design_handoff_theming/home-redux.css`. Se omiten del port: `.phone`,
`.statusbar`, `.proto-sw`, `nav.a-nav`/`nav.c-nav` (nav no se toca), y las clases de
canvas/doc (`.frame`, `.doc-card`, `.pal-*`) que son solo del material de diseño.

## Módulo semanal (chips L→D)
El handoff lo llama "Movilidad y recuperación" con datos de ejemplo — no existe esa
métrica en el modelo de datos actual. Se reutiliza como **"Tu semana"**: día
`done` = existe `Historial.fechaRealizada` ese día dentro de la semana actual;
`today` = fecha de hoy; resto `pending`. Lógica pura en `src/lib/weekChips.ts`
(testeable, ADR #009).

## Archivos
- `src/styles/home-redux.css` — tokens + componentes `.a-*`/`.c-*`/`.v21`/`.cfg-*`.
- `src/lib/weekChips.ts` — `calcularWeekChips(programa, historial, semanaInicio, hoy)`.
- `src/lib/homeReduxPrefs.ts` — `getHomeReduxPrefs`/`setHomeReduxModo`/`setHomeReduxAcento`
  por miembro + `resolverModo(modo)` (system → matchMedia).
- `src/lib/homeLayout.ts` — `HomeLayout` +`"pulse" | "premium"`.
- `src/routes/Home.tsx` — dos ramas nuevas (`pulse`, `premium`), datos reales
  (mismo estado que aurora/stadium/clasico: `sesHechas/sesObj`, `hoy`, `volumen`,
  `racha`, `lastMed`/`pesoDelta`, `programa`, `recVisible`).
- `src/routes/Perfil.tsx` — 2 filas nuevas en "Estilo de inicio" + card "Apariencia"
  condicional.
- `src/routes/QaHomeRedux.tsx` — ruta interna `/qa/home-redux`, grilla de 20
  combinaciones (2 dirección × 2 modo × 5 acento) con datos mock fijos (los del
  prototipo), toggle escala de grises. Fuera de `AppShell` (fullscreen, sin nav).
- `index.html` — Google Fonts Archivo + Hanken Grotesk.

## Verificación (P53, primera pasada)
- `npx tsc -b` limpio, `npx vitest run` verde (401 tests, incluye `weekChips.test.ts` nuevo).
- `/qa/home-redux` verificado visualmente con Playwright headless (auth-exempt a propósito,
  ver `App.tsx`): las 20 combinaciones renderizan colores/fuentes correctos, toggle de
  escala de grises funciona. Se encontró y corrigió un bug real: el `id` del gradiente SVG
  del anillo Premium (`hr-pg`) era fijo → colisionaba entre instancias en la misma página
  (todas las tarjetas Premium mostraban el acento de la primera). Fix: `useId()` de React
  para un id único por instancia (`HomeReduxContent.tsx`).
- `Home.tsx` (layouts `pulse`/`premium` con datos reales) y la card "Apariencia" en
  `Perfil.tsx` **no se verificaron visualmente**: el login es Google OAuth real, sin
  emulador de Auth ni bypass de dev — no se pudo autenticar en el entorno del agente.
  Quedan validados por `tsc`/revisión de código; falta que el owner los pruebe logueado.

## Pendiente / follow-up (no en esta pasada)
- QA visual pixel-a-pixel contra el HTML de referencia (esta pasada prioriza
  arquitectura + fidelidad razonable, no pixel-perfect al 100%).
- Micropatrón chevron del `.c-card.pattern` (SVG data-URI) — portado tal cual pero
  sin validar en dispositivo real.
- Sync de preferencias a Firebase (el README lo sugiere; se deja en localStorage
  por consistencia con `ThemeProvider` existente — revisar si hace falta).
