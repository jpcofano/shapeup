# Prompt 43 — B2 · Video de demostración real en MediaTabs

> **Diseño + datos** (feature). Origen: trabajo en kit (otra cuenta, 2026-06) + hallazgo B2 del
> mapeo. Hoy en el repo `src/components/entrenar/MediaTabs.tsx` la tab **Demo** es un placeholder
> (spinner "Reproduciendo demo…", sin `<video>`), y `videoUrl` existe en el tipo `Ejercicio`
> pero está **vacío en los 800+** del catálogo. El UI kit ya resolvió el patrón final — **2 tabs:
> Demo (foto→play→video) + Músculo** — y se poblaron clips públicos. Este prompt porta eso al
> repo. Castellano voseo. Tokens siempre. No toques otras pantallas.
>
> **(1) MediaTabs.tsx — 2 tabs: "Demo" (foto→video) + "Músculo".**
> Decisión del owner (2026-06): **unificar Foto + Demo en una sola tab** — igual que el kit.
> El `type Tab` pasa de `"foto" | "demo" | "musculo"` a **`"demo" | "musculo"`**, el segmented
> control queda con **2 botones** ("Demo" / "Músculo") y el reset al cambiar de ejercicio va a
> `"demo"`. La tab **Demo** usa la **foto como póster**; al click/play arranca el video:
> - Estado inicial (no `playing`): foto del ejercicio (`ej.imagenes[0]`) a opacidad plena +
>   botón play encima. Sin foto → placeholder con `Dumbbell` + play.
> - Al click: si `ej?.videoUrl` existe → `<video src={ej.videoUrl}>` con `autoPlay`, `muted`,
>   `loop`, `playsInline`, `controls`, cubriendo el frame (`object-fit: cover`).
> - Mientras bufferea (`onWaiting` / antes de `onCanPlay`): overlay `.spinner` + "Cargando demo…".
> - `onError` o **sin** `videoUrl`: volvé a la foto + nota tenue "Video pronto". Nunca spinner
>   colgado para ejercicios sin video.
> - Crédito chico bajo el frame cuando la fuente es Commons: "Demo: Wikimedia Commons · CC BY 3.0".
> La tab **Músculo** queda igual (BodyMap con `grupoMuscularPrimario` + `gruposSecundarios`).
>
> **(2) Poblar `videoUrl` por patrón de movimiento.**
> No hay footage por ejercicio; usamos clips representativos públicos de la serie
> *"exercise demonstration video"* de **FitnessScape en Wikimedia Commons (CC BY 3.0)**,
> hotlinkeables vía `Special:FilePath`. Mapeá por `patron`/`grupoMuscularPrimario` al clip más
> cercano (squat / deadlift-hinge / press / row / core…) y poblá `videoUrl` en el importador
> (`scripts/importar-fedb.ts`), de modo que se regenere el catálogo con el campo lleno.
> - Marcá estos como **representativos** con un flag `videoEsGenerico: true` (nuevo, opcional
>   en el tipo) para poder distinguirlos del footage exacto cuando exista.
> - **iOS**: `.webm` no reproduce en Safari de iPhone. Si la app apunta a iOS, conseguí/serví
>   también `.mp4` (Commons suele tener transcodes; si no, dejalo anotado como deuda y que el
>   fallback de foto cubra iOS).
>
> **(3) Tabla de mapeo patrón→clip** en un archivo de datos versionado
> (`scripts/data/videos-genericos.ts` o JSON), no hardcodeada en el importador, para editarla
> fácil. Comentario con la URL de la página del archivo de Commons al lado de cada uno (atribución).
>
> **Verificación:** correr el importador deja `videoUrl` poblado en todo el catálogo
> (representativo donde no hay propio). El segmented control muestra **2 tabs** (Demo / Músculo).
> En un navegador real, Demo de un ejercicio reproduce el webm al tap; un ejercicio sin mapeo
> muestra "Video pronto", no spinner colgado. `tsc -b` limpio, tests verdes (sumá uno que
> verifique que el importador asigna `videoUrl` por patrón; ajustá los tests que asuman 3 tabs).
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora B2: fuente CC + mapeo + caveat iOS/webm).
> Commit + push. **Pará y esperá mi revisión.**
