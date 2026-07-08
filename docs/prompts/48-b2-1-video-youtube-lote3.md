# Prompt 48 — B2.1 · Video YouTube curado: lote 3 (→ 24/34)

> **Solo datos.** Continúa el prompt 46 (cableado). **Prerrequisito: 46 aplicado** (idealmente
> también el 47). No toca código: solo **agrega 10 entradas** a `VIDEOS_CURADOS`. Castellano voseo.
>
> ---
>
> Agregá estas entradas a `scripts/data/videos-curados.ts` (dentro de `VIDEOS_CURADOS`):
> ```ts
>   // ── Lote 3 ──
>   "EJ-8003": { youtubeId: "4yE-XGDWJPg" },              // Dominadas asistidas con banda
>   "EJ-8009": { youtubeId: "e1YSApl-QcM" },              // Dominadas / chin-ups
>   "EJ-8011": { youtubeId: "Fl0UMfdEzsE" },              // Remo invertido
>   "EJ-8017": { youtubeId: "ZdAHe9_HeEw", canal: "NASM" },// Bird dog
>   "EJ-8018": { youtubeId: "P16SQlmWj1o" },              // Pallof press (banda)
>   "EJ-8020": { youtubeId: "vLuhN_glFZ8" },              // Sentadilla búlgara
>   "EJ-8021": { youtubeId: "AlTGQrDOd98" },              // Face pull con banda
>   "EJ-8023": { youtubeId: "dRXO0agekxA" },              // Gato–camello
>   "EJ-8032": { youtubeId: "iS7atZhcRnw" },              // Peso muerto rumano a una pierna
>   "EJ-8034": { youtubeId: "DRZeD0Ns71k" },              // Patada de glúteo (cuadrupedia)
> ```
> IDs de búsqueda web: **confirmá cada uno con un clic antes de lockear** (ejercicio correcto y
> que permita embeber). Si alguno no sirve, reemplazalo y avisá.
>
> ---
>
> **Verificación:**
> - `tsc -b` limpio, tests verdes.
> - Re-seed + regenerar catálogo: los 10 quedan con `videoYoutubeId`; total `curados 24/34`.
> - En navegador: la Demo de esos 10 reproduce YouTube; el resto sigue con genérico/foto.
> - Bitácora en `docs/MAPEO-IMPLEMENTACION.md`: `B2.1 lote 3 = +10 · curados 24/34`.
>
> **Un commit**, mensaje tipo:
> `feat(video): YouTube curado — lote 3 (24/34 rutinas)`
> Push. **Pará y esperá mi revisión.**
