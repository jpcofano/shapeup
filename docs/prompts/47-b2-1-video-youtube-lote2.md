# Prompt 47 — B2.1 · Video YouTube curado: lote 2 (→ 14/34)

> **Solo datos.** Continúa el prompt 46 (cableado + lote 1). **Prerrequisito: el 46 debe estar
> aplicado** (existe `scripts/data/videos-curados.ts` y MediaTabs ya renderiza YouTube). Este
> prompt no toca código: solo **agrega 9 entradas** al objeto `VIDEOS_CURADOS`. Castellano voseo.
>
> ---
>
> Agregá estas entradas a `scripts/data/videos-curados.ts` (dentro de `VIDEOS_CURADOS`):
> ```ts
>   // ── Lote 2 ──
>   "EJ-8006": { youtubeId: "ykJmrZ5v0Oo" },              // Curl de bíceps
>   "EJ-8007": { youtubeId: "iH16WFso6fo" },              // Extensión de tríceps (fondos en silla)
>   "EJ-8008": { youtubeId: "MyqQRJ2lW7Q" },              // Zancada hacia atrás
>   "EJ-8013": { youtubeId: "Q_olQdxEPF4" },              // Mountain climbers
>   "EJ-8014": { youtubeId: "L9KZfxT654Y" },              // Puente de glúteos
>   "EJ-8015": { youtubeId: "JAA855alyw4" },              // Press de hombros
>   "EJ-8016": { youtubeId: "44ND4bOB-T0", canal: "NASM" },// Plancha lateral
>   "EJ-8019": { youtubeId: "nnH63icHYXY" },              // Elevaciones laterales
>   "EJ-8033": { youtubeId: "29OfN4ztW_g" },              // Empuje de cadera (hip thrust)
> ```
> IDs de búsqueda web: **confirmá cada uno con un clic antes de lockear** (ejercicio correcto y
> que permita embeber). Si alguno no sirve, reemplazalo y avisá.
>
> ---
>
> **Verificación:**
> - `tsc -b` limpio, tests verdes.
> - Re-seed + regenerar catálogo: los 9 quedan con `videoYoutubeId`; total `curados 14/34`.
> - En navegador: la Demo de esos 9 reproduce YouTube; el resto sigue con genérico/foto.
> - Bitácora en `docs/MAPEO-IMPLEMENTACION.md`: `B2.1 lote 2 = +9 · curados 14/34`.
>
> **Un commit**, mensaje tipo:
> `feat(video): YouTube curado — lote 2 (14/34 rutinas)`
> Push. **Pará y esperá mi revisión.**
