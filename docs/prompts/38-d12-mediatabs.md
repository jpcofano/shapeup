# Prompt 38 — D12 · MediaTabs (Foto / Demo / Músculo) en la sesión guiada

> Etapa de diseño. Lleva al repo lo que ya está en el kit: en la sesión guiada, el ejercicio se
> muestra con **pestañas Foto / Demo / Músculo** en vez de solo la foto estática. Target visual:
> `ui_kits/shapeup/screens-entrenar.jsx` (`MediaTabs`). **No** toques `lib`/`data`/`types`. Tokens,
> voseo, re-skinea con el tema. Depende de B3 (BodyMap, prompt 35) — si B3 no está hecho aún,
> hacelo primero o incluí el BodyMap acá.
>
> **(1) Componente `src/components/entrenar/MediaTabs.tsx`:** segmented control de 3 pestañas
> (`Foto` / `Demo` / `Músculo`) + un frame 16:11 (`--r-md`, borde, `--card-hover`):
> - **Foto** (default): `ej.imagenes[0]` con `object-fit: cover`; `onError` → placeholder
>   (ícono `Dumbbell`).
> - **Demo**: la foto atenuada con botón **play** central (acento, `--shadow-fab`) + badge "Demo".
>   Al tocar → estado "Reproduciendo demo…" (spinner). El video real (YouTube/clip) es B2 — acá
>   queda el placeholder con play, listo para enchufar la fuente cuando exista.
> - **Músculo**: `<BodyMap primario={ej.grupoMuscularPrimario} secundarios={ej.gruposSecundarios} />`
>   centrado.
> - Reset a "Foto" cuando cambia el ejercicio (`useEffect` sobre `ej.id`).
>
> **(2) Integración en `BloqueGuiado.tsx`:** reemplazá la foto estática actual por `<MediaTabs ej={ejercicio} />`
> justo debajo del nombre grande del ejercicio. Si el ejercicio no tiene imagen ni músculo, las
> pestañas degradan (Foto → placeholder, Músculo → solo leyenda) sin romper.
>
> **(3) Estilos** (`src/index.css`): `.media-seg` (segmented), `.media-frame`, `.media-play(-btn/-overlay)`,
> `.media-badge`, `.media-playing`, `.media-musc`. Copialos de `ui_kits/shapeup/app.css`
> (bloque "MediaTabs"). Animación del spinner gateada por `prefers-reduced-motion`.
>
> **Verificación:** en sesión guiada, las 3 pestañas funcionan; Foto muestra la imagen real, Demo
> el play, Músculo el mapa con el grupo correcto; re-skinea con el tema; ejercicios sin media no
> rompen. `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D12).
> Commit + push. **Pará y esperá mi revisión.**
