# Prompt 5 — E5 · Programas, sesiones, historial y visibilidad

> Etapa E5. `src/data/programas.ts` (IDs `PRG-XXXX`) y `src/data/sesiones.ts` (máquina de estados
> Programada→En curso→Completada→Registrada). `src/data/visibilidad.ts` leyendo
> `/config/visibilidad` (el owner ve todo; los demás solo lo asignado). Home con la sesión de hoy
> ("hoy toca…") derivada del programa activo. Cierre con RPE → escribe `Historial` con `tonelajeKg`
> y `totalSeriesHechas` derivados, usando `runTransaction` (subir `vecesEntrenada`/`vecesUsado`,
> `ultimaVez`, marcar el día del programa). Lista y detalle de Historial. Tests de reglas con el
> emulador (no-miembro bloqueado; solo owner edita catálogo y visibilidad).
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E5 + Estado + Mapa). JSDoc en
> lo público. Después hacé `git add -A && git commit` con un mensaje claro de la etapa y `git push` a `origin/main`, así queda actualizado para revisar. **Pará y esperá mi revisión.**
