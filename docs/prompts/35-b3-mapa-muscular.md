# Prompt 35 — B3 · Mini-mapa muscular en el detalle de ejercicio

> Etapa B3 (visual, alto impacto). Agregás un **mini-mapa corporal** que resalta los músculos
> que trabaja cada ejercicio, en el detalle del Catálogo. El dato **ya existe** en el modelo
> (`grupoMuscularPrimario`, `gruposSecundarios`). Target visual: `ui_kits/shapeup/body-map.jsx`
> y la card `preview/cmp-bodymap.html` del design system. **No** toques `lib`/`data`/`types`.
> Tokens siempre, voseo, re-skinea con el tema.
>
> **(1) Componente `src/components/BodyMap.tsx` (presentación pura):** dos siluetas SVG
> esquemáticas (frente + espalda, viewBox 100×220) con regiones musculares como shapes. Props:
> `{ primario: GrupoMuscular; secundarios?: GrupoMuscular[] }`. Pintado por token:
> - primario → `var(--accent)`
> - secundarios → `color-mix(in srgb, var(--accent) 38%, transparent)`
> - inactivo → `var(--card-hover)`, borde `var(--border)`.
> Copiá las formas/coordenadas de `ui_kits/shapeup/body-map.jsx` (Front/Back) — ya están
> resueltas. Es un diagrama funcional, no decorativo: NO uses imágenes ni íconos para esto.
>
> **(2) Mapa `GrupoMuscular → región`:** el modelo tiene su propio enum de `GrupoMuscular`
> (en castellano). Mapealo a las regiones del SVG (pecho, hombros, biceps, triceps, core,
> cuadriceps, dorsales, espalda_alta, trapecio, gluteos, isquios, pantorrillas, antebrazo).
> Si un grupo del modelo no tiene región (ej. "Cuerpo completo", "Cardio"), no resaltes nada y
> mostrá solo la leyenda — sin romper.
>
> **(3) Integración en `Catalogo.tsx`:** dentro del detalle expandido, ARRIBA de la
> `FichaTecnica` (de B1), una sección "Músculos trabajados" con `<BodyMap primario={…}
> secundarios={…} />` + leyenda (chip de color + nombre del primario; secundarios atenuados).
> Mantené el orden: imagen → **mapa muscular** → ficha técnica → ejecución → banners.
>
> **(4) Reutilizable:** dejá `BodyMap` lo bastante chico para poder mostrarlo también en la
> sesión guiada más adelante (no es parte de B3, pero no lo acoples a Catálogo).
>
> **Detalle:** los colores salen de tokens, así que el mapa re-skinea con el tema del miembro
> (en Crimson el músculo se pinta rojo, etc.). Las siluetas inactivas usan `--card-hover`.
>
> **Verificación:** al expandir un ejercicio, el mapa resalta el músculo correcto en la vista
> correcta (pecho→frente, dorsales→espalda, cuádriceps→frente…), con secundarios atenuados;
> re-skinea con el tema; ejercicios sin grupo válido no rompen. `tsc -b` limpio, tests verdes.
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora B3 + fila de Estado + el mapeo
> GrupoMuscular→región). Commit + push. **Pará y esperá mi revisión.**
