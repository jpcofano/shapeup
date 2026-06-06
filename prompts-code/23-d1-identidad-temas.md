# Prompt 23 — D1 · Identidad + sistema de temas

> Etapa de pulido D1 (la base de todo lo demás). Implementás la identidad propia de ShapeUp y
> el **sistema de temas por miembro**, sin tocar la lógica. Fuente de verdad: el design system
> de Claude Design (`colors_and_type.css`, `assets/`, `README.md` §Temas/§ICONOGRAPHY,
> `ui_kits/shapeup/`). **No toques** `src/lib`, `src/data`, `src/types`, `src/auth`, ni el nav
> de 6 ítems. Usá siempre tokens. Texto en voseo.
>
> **(1) Tokens — `src/styles/tokens.css`:** reemplazá el contenido por el de
> `colors_and_type.css` del design system (es un superset del actual). Incluye:
> - Acento **tematizable** (default **Ion**, cian `#22d3ee`) con `--accent`, `--accent-dim`,
>   `--accent-strong`, `--on-accent`.
> - Escala de **zonas de FC** `--zona-z1..z5` (rampa fría→caliente) + sus `*-dim`. Constantes,
>   NO cambian con el tema. Enganchan con `zonasFC` de `/config/perfiles`.
> - **Estados de fitness** (`--estado-activa/descanso/pausa/hecho`).
> - Mantené los `--member-*` (sync con seed-perfiles) y el resto de radios/espaciado/tipografía.
>
> **(2) Temas — bloques `[data-theme="…"]`** (ya están en `colors_and_type.css`): **8 temas**
> Ion, Volt, Solar, Blaze, Crimson, Pulse, Grape, Indigo. Cada uno redefine la familia del
> acento + un **tinte de superficie marcado** (`--bg/--card/--card-hover/--border/--border-dim`).
> Default sin atributo = Ion.
>
> **(3) Tema POR MIEMBRO — `src/contexts/ThemeProvider.tsx` (nuevo, capa de presentación):**
> - Cada miembro tiene su propio tema, persistido. Default por miembro: juanpablo→`ion`,
>   maria→`pulse`, sofia→`grape`, federico→`volt`.
> - El provider lee el `memberId` de `useAuth()`, resuelve el tema del miembro y setea
>   `data-theme` en el contenedor raíz de la app (en `AppShell` y en `EntrenarSesion`, que va
>   fuera del shell). Persistí en `localStorage` (`shapeup-themes`, mapa por miembro). Exponé
>   `useTheme()` → `{ theme, setTheme }` (setTheme escribe el del miembro actual).
> - **No** persistas en Firestore por ahora (decisión local; dejalo anotado como posible ADR si
>   más adelante se quiere sincronizar entre dispositivos).
>
> **(4) Logo / marca:** copiá `assets/shapeup-icon.svg`, `shapeup-mark.svg`,
> `shapeup-wordmark.svg` y `-light.svg` a `public/` (o `src/assets/`). Creá
> `src/components/Brand.tsx` con `<ShapeUpMark size />` (chevron doble en `currentColor` =
> acento) y `<ShapeUpWordmark />`. La marca debe seguir el tema (usar `color: var(--accent)`).
>
> **(5) Motivo bíceps — `src/components/Bicep.tsx` (o helper):** el ícono Lucide
> `biceps-flexed` relleno con el acento (`fill="currentColor"`), que se usa en la WeekStrip
> (D2) y en el Historial (D5). Centralizalo para reutilizar.
>
> **(6) PWA (si el proyecto usa `vite-plugin-pwa`):** generá los íconos a partir de
> `shapeup-icon.svg` (192/512/maskable), el `theme-color` del manifest = `#0f1115` (fondo base)
> y `background_color` igual. Si la decisión de instalabilidad no está tomada, dejá los íconos
> listos y anotá el pendiente.
>
> **Verificación:** la app arranca en Ion; al cambiar de miembro (cuando esté el selector en
> D7, por ahora con el default) la app re-skinea; las zonas FC y los `--member-*` no cambian.
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D1 + ADR "tema por miembro en localStorage,
> presentación; zonas FC y member colors fuera del tema"). `tsc -b` limpio, tests verdes,
> commit + push. **Pará y esperá mi revisión.**
