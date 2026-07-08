# Prompt 46 — B2.1 · Video YouTube curado: cableado + lote 1 (5/34)

> **Datos + feature chica.** Continúa B2 (prompt 43, ya en el repo): hoy todos los videos son
> **genéricos por patrón** (`videoEsGenerico: true`) porque FEDB no trae footage y Wikimedia
> Commons tiene ~8 clips, ya todos mapeados. Para tener **demo exacta** sin fuente libre por
> ejercicio, curamos **un video de YouTube por ejercicio**, embebido por iframe (no redistribuís
> el archivo: lo embebés vía el player de YouTube, permitido por sus términos cuando el video deja
> embeber). Scope: **los 34 ejercicios de rutina (EJ-8xxx)**, no los 873. Castellano voseo.
>
> **Este prompt hace el CABLEADO (una vez) + el lote 1 (5 videos).** Los lotes siguientes vienen
> en prompts numerados aparte (47, 48, 49) y solo agregan entradas a `videos-curados.ts`.
> **Aplicá este 46 ANTES que cualquier lote posterior.**
>
> ---
>
> ## (A) Cableado — una sola vez
>
> **(A1) Modelo** (`src/types/models.ts`). Agregá a `Ejercicio`:
> ```ts
> videoYoutubeId?: string;   // ID de YouTube (11 chars). Si existe → demo EXACTA.
> ```
> Mantené `videoUrl` (webm genérico) y `videoEsGenerico`. **Precedencia en la tab Demo:**
> 1. `videoYoutubeId` → iframe de YouTube (exacto, sin badge de genérico).
> 2. si no, `videoUrl` → `<video>` webm representativo (badge "demo representativa" como hoy).
> 3. si no, foto.
>
> **(A2) MediaTabs** (`src/components/entrenar/MediaTabs.tsx`). En la tab Demo, al dar play,
> si `ej.videoYoutubeId`:
> - Render iframe contenedor 16:9 responsivo, fuente:
>   `https://www.youtube-nocookie.com/embed/${ej.videoYoutubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`
>   (dominio **nocookie** por privacidad; `rel=0` no muestra videos de otros canales).
> - Foto como póster hasta el play (misma UX que hoy con el webm).
> - Crédito chico bajo el frame: "Demo: YouTube". **Sin** rótulo "representativa" (es exacta).
> - **Bonus iOS:** el iframe de YouTube reproduce en Safari de iPhone — esto resuelve de paso la
>   deuda de webm/iOS anotada en el prompt 43 para los ejercicios que tengan YouTube.
> - El camino webm y el de foto quedan **intactos** como fallback.
>
> **(A3) Archivo de datos editable** (`scripts/data/videos-curados.ts`), separado del código para
> editarlo fácil lote a lote. Creá el archivo con el lote 1:
> ```ts
> // EJ-id → video de YouTube curado y CONFIRMADO. Demo exacta del ejercicio.
> // Los lotes siguientes (prompts 47, 48, 49) agregan entradas a este mismo objeto.
> export const VIDEOS_CURADOS: Record<string, { youtubeId: string; canal?: string }> = {
>   // ── Lote 1 ──
>   "EJ-8001": { youtubeId: "BR4tlEE_A98" },              // Sentadilla goblet
>   "EJ-8002": { youtubeId: "WDIpL0pjun0", canal: "NASM" },// Flexiones de brazos
>   "EJ-8004": { youtubeId: "gfUg6qWohTk" },              // Remo a una mano con mancuerna
>   "EJ-8010": { youtubeId: "IJdUtnxAmNo" },              // Peso muerto rumano (RDL)
>   "EJ-8012": { youtubeId: "pA6o-a3y1Vo" },              // Swings con pesa
> };
> ```
> En los seeds que definen EJ-8xxx (`seed-plan.ts`, `seed-maria.ts`, `seed-rugby-juvenil.ts`,
> `seed-futbol-juvenil.ts`, `seed-planes-extra.ts`), al construir cada ejercicio, seteá
> `videoYoutubeId: VIDEOS_CURADOS[id]?.youtubeId`. (Para EJ-0xxx en el futuro, mismo patrón en
> `importar-fedb.ts`.)
>
> **Nota:** los 5 IDs del lote 1 vienen de búsqueda web; **confirmá cada uno con un clic antes de
> lockear** (que exista, sea del ejercicio correcto y permita embeber). Si alguno no sirve,
> reemplazalo y avisá.
>
> ---
>
> **Verificación:**
> - `tsc -b` limpio. Tests verdes (sumá uno que verifique precedencia YouTube > webm > foto en la
>   lógica de la tab Demo).
> - Re-seed + regenerar catálogo: los 5 del lote 1 quedan con `videoYoutubeId`.
> - En navegador real: la Demo de esos 5 reproduce el video de YouTube al tap, sin badge de
>   genérico; un ejercicio sin YouTube sigue mostrando el webm representativo o la foto.
> - En iPhone: los que tienen YouTube reproducen (a diferencia del webm).
> - Bitácora en `docs/MAPEO-IMPLEMENTACION.md` (B2.1: modelo `videoYoutubeId`, iframe nocookie,
>   archivo `videos-curados.ts`, lote 1 = 5, fix iOS de paso). Anotá el avance: `curados 5/34`.
>
> **Un commit**, mensaje tipo:
> `feat(video): cableado YouTube + lote 1 (5/34 rutinas)`
> Push. **Pará y esperá mi revisión.**
