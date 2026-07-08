# Prompt 46 — B2.1 · Video exacto curado vía YouTube (rutinas) — REPETIBLE

> **Datos + feature chica.** Continúa B2 (prompt 43, ya en el repo): hoy todos los videos son
> **genéricos por patrón** (`videoEsGenerico: true`) porque FEDB no trae footage y Wikimedia
> Commons tiene ~8 clips, ya todos mapeados. Para tener **demo exacta** sin fuente libre por
> ejercicio, curamos **un video de YouTube por ejercicio**, embebido por iframe (no redistribuís
> el archivo: lo embebés vía el player de YouTube, permitido por sus términos cuando el video deja
> embeber). Scope: **los 34 ejercicios de rutina (EJ-8xxx)**, no los 873. Castellano voseo.
>
> **Este prompt tiene dos partes: (A) el cableado, se hace UNA vez; (B) la curaduría, REPETIBLE
> por lotes de ~10.** Hoy va el cableado + **lote 1 (5 videos)**. Los siguientes lotes solo
> agregan IDs al archivo de datos.
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
> editarlo fácil lote a lote:
> ```ts
> // EJ-id → video de YouTube curado y CONFIRMADO. Demo exacta del ejercicio.
> export const VIDEOS_CURADOS: Record<string, { youtubeId: string; canal?: string }> = {
>   // ── Lote 1 ──
>   "EJ-8001": { youtubeId: "BR4tlEE_A98" },              // Sentadilla goblet
>   "EJ-8002": { youtubeId: "WDIpL0pjun0", canal: "NASM" },// Flexiones de brazos
>   "EJ-8004": { youtubeId: "gfUg6qWohTk" },              // Remo a una mano con mancuerna
>   "EJ-8010": { youtubeId: "IJdUtnxAmNo" },              // Peso muerto rumano (RDL)
>   "EJ-8012": { youtubeId: "pA6o-a3y1Vo" },              // Swings con pesa
>   // ── Lote 2 ──
>   "EJ-8006": { youtubeId: "ykJmrZ5v0Oo" },              // Curl de bíceps
>   "EJ-8007": { youtubeId: "iH16WFso6fo" },              // Fondos en silla (tríceps)
>   "EJ-8008": { youtubeId: "MyqQRJ2lW7Q" },              // Zancada hacia atrás
>   "EJ-8013": { youtubeId: "Q_olQdxEPF4" },              // Mountain climbers
>   "EJ-8014": { youtubeId: "L9KZfxT654Y" },              // Puente de glúteos
>   "EJ-8015": { youtubeId: "JAA855alyw4" },              // Press de hombros
>   "EJ-8016": { youtubeId: "44ND4bOB-T0", canal: "NASM" },// Plancha lateral
>   "EJ-8019": { youtubeId: "nnH63icHYXY" },              // Elevaciones laterales
>   "EJ-8033": { youtubeId: "29OfN4ztW_g" },              // Empuje de cadera (hip thrust)
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
> };
> ```
> En los seeds que definen EJ-8xxx (`seed-plan.ts`, `seed-maria.ts`, `seed-rugby-juvenil.ts`,
> `seed-futbol-juvenil.ts`, `seed-planes-extra.ts`), al construir cada ejercicio, seteá
> `videoYoutubeId: VIDEOS_CURADOS[id]?.youtubeId`. (Para EJ-0xxx en el futuro, mismo patrón en
> `importar-fedb.ts`.)
>
> ---
>
> ## (B) Curaduría — REPETIBLE, un lote por corrida
>
> **Lotes 1, 2 y 3 (24) — ya curados y CON IDs reales arriba.** Vienen de búsqueda web; **el
> owner confirma cada uno con un clic antes de lockear** (que el video exista, sea del ejercicio
> correcto y permita embeber). Si alguno no embebe o no sirve, reemplazalo y avisá.
>
> **Para el lote 4 (final)**, completá los EJ-8xxx que falten (10 restantes). Receta de curaduría
> por ejercicio:
> 1. Buscá "`<ejercicio> proper form tutorial`" en YouTube.
> 2. Elegí un video **corto, claro, del ejercicio exacto** (no un compilado), de canal serio.
> 3. Verificá que **permita embeber** (que se vea en `youtube-nocookie.com/embed/<id>`).
> 4. Sumá `"EJ-80xx": { youtubeId: "<id>", canal: "<opcional>" }` a `VIDEOS_CURADOS`.
> 5. **Nunca inventes un ID.** Si no encontrás uno bueno, dejá el ejercicio con su genérico.
>
> Pendientes (lote 4 final, 10): EJ-8005 press pecho banda, 8022 aperturas banda, 8024 world's
> greatest, 8025 círculos cadera, 8026 apertura torácica, 8027 estiram. isquios, 8028 curl
> nórdico, 8029 copenhague, 8030 caminata lateral, 8031 salto con aterrizaje.
>
> ---
>
> **Verificación:**
> - `tsc -b` limpio. Tests verdes (sumá uno que verifique precedencia YouTube > webm > foto en la
>   lógica de la tab Demo).
> - Re-seed + regenerar catálogo: los 24 de los lotes 1-3 quedan con `videoYoutubeId`.
> - En navegador real: la Demo de esos 24 reproduce el video de YouTube al tap, sin badge de
>   genérico; un ejercicio sin YouTube sigue mostrando el webm representativo o la foto.
> - En iPhone: los que tienen YouTube reproducen (a diferencia del webm).
> - Bitácora en `docs/MAPEO-IMPLEMENTACION.md` (B2.1: modelo `videoYoutubeId`, iframe nocookie,
>   archivo `videos-curados.ts`, lotes 1-3 = 24, fix iOS de paso). Anotá el avance: `curados 24/34`.
>
> **Un commit** (cableado + lotes 1-3), mensaje tipo:
> `feat(video): demo YouTube curada — cableado + lotes 1-3 (24/34 rutinas)`
> Push. **Pará y esperá mi revisión — no encadenes el lote 4 sin que lo pida.**
