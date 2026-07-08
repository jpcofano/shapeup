# Prompt 49 — B2.1 · Video YouTube curado: lote 4 FINAL (→ 34/34)

> **Solo datos.** Cierra B2.1. **Prerrequisito: prompt del cableado aplicado** (existe
> `scripts/data/videos-curados.ts`). No toca código: **agrega las 10 entradas finales** a
> `VIDEOS_CURADOS` y deja los 34 ejercicios de rutina con video exacto. Castellano voseo.
>
> **Nota de numeración:** en la secuencia del chat de arquitectura esto es el "lote 4". Si en tu
> repo el 49 ya está tomado, renumeralo al que siga — el contenido no cambia.
>
> ---
>
> Agregá estas entradas a `scripts/data/videos-curados.ts` (dentro de `VIDEOS_CURADOS`):
> ```ts
>   // ── Lote 4 (final) ──
>   "EJ-8005": { youtubeId: "4B6O2dHDjBw" },              // Press de pecho con banda
>   "EJ-8022": { youtubeId: "UpyX0O740Gg" },              // Aperturas de pecho con banda
>   "EJ-8024": { youtubeId: "T6j7BpxeqqU" },              // Estiramiento del mundo (world's greatest)
>   "EJ-8025": { youtubeId: "JYqLwajOGjI", canal: "Runna" },// Círculos de cadera
>   "EJ-8026": { youtubeId: "peeW19ofFUg" },              // Apertura torácica (open book)
>   "EJ-8027": { youtubeId: "9ESpoUPqpFw" },              // Estiramiento de isquios y flexores
>   "EJ-8028": { youtubeId: "_e9vFU9-tkc", canal: "E3 Rehab" },// Curl nórdico (asistido)
>   "EJ-8029": { youtubeId: "48wlc5zn02A" },              // Plancha copenhague
>   "EJ-8030": { youtubeId: "y_bqFDQZSHQ" },              // Caminata lateral con banda
>   "EJ-8031": { youtubeId: "AzZLYpEc93E" },              // Salto con aterrizaje
> ```
> IDs de búsqueda web: **confirmá cada uno con un clic antes de lockear** (ejercicio correcto y
> que permita embeber). Si alguno no sirve, reemplazalo y avisá.
>
> ---
>
> **Verificación:**
> - `tsc -b` limpio, tests verdes.
> - Re-seed + regenerar catálogo: los 10 quedan con `videoYoutubeId`; total **`curados 34/34`**.
> - En navegador: los 34 de rutina reproducen YouTube en la Demo.
> - Bitácora en `docs/MAPEO-IMPLEMENTACION.md`: `B2.1 lote 4 = +10 · curados 34/34 · B2.1 COMPLETO`.
>
> **Un commit**, mensaje tipo:
> `feat(video): YouTube curado — lote 4 final (34/34 rutinas · B2.1 completo)`
> Push. **Pará y esperá mi revisión.**
