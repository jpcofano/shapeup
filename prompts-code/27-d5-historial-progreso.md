# Prompt 27 — D5 · Historial + Progreso

> Etapa de pulido D5. Pulís `src/routes/Historial.tsx` y `src/routes/HistorialDetalle.tsx`
> (y los `MiniChart` de progreso). Target: `ui_kits/shapeup/screens-salud.jsx` (Historial /
> HistorialDetalle). **No** toques `data/`/`lib`. Tokens siempre. Voseo.
>
> **(1) Lista de sesiones (`Historial`):** cada fila es una `rutina-card` con un **badge de
> bíceps** a la izquierda (`<Bicep>` en un cuadrado `--accent-dim`, ~38px) — refuerza el motivo
> de marca de la WeekStrip. A la derecha el contenido: nombre, fecha, ⏱ duración, series,
> tonelaje y badge **RPE N**. Vacío con copy en voseo ("Todavía no completaste ninguna sesión.").
>
> **(2) Detalle (`HistorialDetalle`):** back-btn, nombre + fecha, fila de **stats** (minutos,
> series, kg tonelaje, RPE) con `stat-value` tabular, y la lista de series registradas por
> bloque (`bloque-num` en acento).
>
> **(3) Progreso / MiniChart:** barras simples (SVG) con el color del acento (peso/tonelaje) y
> el `--info` donde corresponda; etiquetas en `--muted`. Mantené el cálculo existente; solo
> pulí el render.
>
> **Verificación:** igual al UI kit; el bíceps toma el acento del tema. Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D5). `tsc -b` limpio, tests verdes, commit + push.
> **Pará y esperá mi revisión.**
