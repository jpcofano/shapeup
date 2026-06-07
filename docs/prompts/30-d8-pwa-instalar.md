# Prompt 30 — D8 · PWA instalable + botón "Instalar app"

> Etapa final de Design (D8). Hacés ShapeUp **instalable** como PWA, **igual que Comida
> Familiar** (mismo patrón: `vite-plugin-pwa` + `public/manifest.json` + `public/icons/`), y
> agregás un **botón "Instalar app"** visible (Comida no lo tenía explícito; ShapeUp sí lo
> quiere). **No** toques `lib`/`data`/`types`/`auth`. Tokens siempre, voseo.
>
> **Insumos que te paso (del design system):** la carpeta `assets/pwa/` con:
> - `icons/` — los 8 íconos PNG (V10, fondo oscuro + chevron cian con glow) ya generados:
>   favicon 16/32/48, apple-touch-icon 180, icon 192/512, icon-maskable 192/512.
> - `icons-alt-v2/` — set alternativo (V2: oscuro sólido + chevron cian, sin glow), por si
>   preferís ese. Si lo usás, copiá `icons-alt-v2/` en vez de `icons/`.
> - `manifest.json` — listo. Copiá el set elegido a `public/icons/` y el manifest a
>   `public/manifest.json`.
>
> **(1) Íconos + manifest:** copiá los 8 PNG a `public/icons/` y `manifest.json` a
> `public/manifest.json`. En `index.html` (head), agregá (mismo set que Comida):
> ```html
> <link rel="manifest" href="/manifest.json" />
> <meta name="theme-color" content="#0f1115" />
> <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
> <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
> <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
> <meta name="apple-mobile-web-app-capable" content="yes" />
> <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
> ```
>
> **(2) `vite.config.ts` — `VitePWA` igual que Comida:**
> ```ts
> import { VitePWA } from 'vite-plugin-pwa'
> // …
> plugins: [
>   react(),
>   VitePWA({
>     manifest: false,                 // viene de public/manifest.json
>     registerType: 'autoUpdate',
>     workbox: {
>       globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
>       navigateFallback: 'index.html',
>       navigateFallbackDenylist: [/^\/__\//],   // rutas de Firebase Auth
>       cleanupOutdatedCaches: true,
>     },
>   }),
> ],
> ```
> Instalá `vite-plugin-pwa` como devDependency.
>
> **(3) Hook `useInstallPrompt` — `src/hooks/useInstallPrompt.ts` (presentación):**
> - Escuchá `beforeinstallprompt`: `e.preventDefault()`, guardá el evento en estado, exponé
>   `canInstall`.
> - `promptInstall()` → `await deferred.prompt()`, leé `userChoice`, limpiá el evento.
> - Detectá ya-instalado: `window.matchMedia('(display-mode: standalone)').matches` o
>   `navigator.standalone` (iOS) → `isInstalled` (oculta el botón).
> - Escuchá `appinstalled` para limpiar.
> - Exponé `{ canInstall, isInstalled, promptInstall }`.
>
> **(4) Botón "Instalar app" en Perfil:** debajo de la card "Tema" (o arriba de "Cerrar
> sesión"), una card/botón con ícono `download` y texto **"Instalar app"** que llama a
> `promptInstall()`. Mostralo **solo si `canInstall && !isInstalled`**. Estilo: `btn-secondary`
> o una card con el ícono en `--accent-dim`. Subtítulo: "Agregá ShapeUp a tu pantalla de inicio".
> - **iOS (Safari no dispara `beforeinstallprompt`):** si es iOS y no está instalada, en vez del
>   botón mostrá un hint corto: "En iPhone: Compartir → Agregar a inicio" con el ícono `share`.
>
> **(5) Detalle de marca:** el ícono de la PWA es el squircle cian (Ion) con el doble chevron —
> es el ícono de la app, **fijo** (no cambia con el tema del miembro). El `theme-color` es el
> fondo base `#0f1115`.
>
> **Verificación:** `npm run build && npm run preview`; en Chrome/Android aparece el prompt de
> instalación y el botón en Perfil lo dispara; en desktop instalable; en iOS se ve el hint;
> Lighthouse PWA installable en verde. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D8 +
> ADR "PWA con manifest estático en public/, patrón heredado de Comida; ícono fijo no-temático").
> `tsc -b` limpio, tests verdes, commit + push. **Pará y esperá mi revisión.**
