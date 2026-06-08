# Prompt 27 — Imágenes de ejercicios

> Objetivo: que los ejercicios muestren foto, tanto en el Catálogo como en el modo guiado. Hoy el
> modelo tiene `Ejercicio.imagenes[]` pero **no se renderiza** y está **sin poblar**. Fuente: **Free
> Exercise DB**, que es **dominio público (Unlicense)** y hospeda 2 fotos por ejercicio en GitHub.
>
> **(1) Render (UI):** mostrar `ej.imagenes[0]` (y permitir ver la 2ª si existe) en:
> - `src/routes/Catalogo.tsx` — foto arriba de cada card/detalle de ejercicio.
> - el modo guiado (`src/components/entrenar/BloqueGuiado.tsx`) — foto del ejercicio actual.
> Usar `loading="lazy"`, `alt` con el nombre, y **degradar elegante**: si `imagenes` está vacío, no
> mostrar `<img>` roto (placeholder simple o nada). Nunca romper el layout por una imagen faltante.
>
> **(2) Poblar las fotos de FEDB (catálogo, EJ-0001+):** las URLs se arman con el prefijo
> `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/` + el path de imagen
> del JSON FEDB (ej. `Goblet_Squat/0.jpg`). En el import/seed del catálogo (`import:fedb` /
> `seed-ejercicios`), setear `imagenes` con esas URLs absolutas. Si ya quedaron paths relativos,
> prefijarlos. (Runtime contra raw GitHub está OK para este volumen; espejar a Firebase Storage queda
> como opción futura.)
>
> **(3) Mapear los 34 propios (EJ-80xx) a su equivalente FEDB** y heredarle las fotos: en el seed,
> setear `imagenes` de cada propio con las URLs del ejercicio FEDB equivalente. **Verificá cada id
> contra el catálogo FEDB ya importado** (los ids de abajo son sugeridos, confirmá el real); si no hay
> match bueno, dejar `imagenes` vacío (la UI ya degrada).
>
> | Propio | FEDB sugerido (verificar id real) |
> |---|---|
> | EJ-8001 Sentadilla goblet | Goblet_Squat |
> | EJ-8002 Flexiones | Pushups |
> | EJ-8003 Dominadas asistidas | Pullups (o variante asistida) |
> | EJ-8004 Remo a una mano | One-Arm_Dumbbell_Row |
> | EJ-8006 Curl de bíceps | Dumbbell_Bicep_Curl |
> | EJ-8007 Fondos en silla | Bench_Dips |
> | EJ-8008 Zancada hacia atrás | Dumbbell_Lunges |
> | EJ-8009 Dominadas / chin-ups | Chin-Up (o Pullups) |
> | EJ-8010 RDL | Romanian_Deadlift (o Stiff-Legged Dumbbell Deadlift) |
> | EJ-8011 Remo invertido | Inverted_Row |
> | EJ-8012 Swings con pesa | Kettlebell_Swing |
> | EJ-8013 Mountain climbers | Mountain_Climbers |
> | EJ-8014 Puente de glúteos | Glute_Bridge (o Butt Lift Bridge) |
> | EJ-8015 Press de hombros | Dumbbell_Shoulder_Press |
> | EJ-8016 Plancha lateral | Side_Bridge |
> | EJ-8017 Bird dog | Bird_Dog |
> | EJ-8005 Press pecho banda / EJ-8018 Pallof | banda: sin equivalente claro → dejar sin foto |
>
> Los EJ-80xx restantes (8019+, en planes-extra / rugby / fútbol / maría) se mapean por la misma
> regla: el FEDB más cercano por nombre/patrón/equipo; sin match → sin foto.
>
> **(4) Re-sembrar** lo afectado con `--force` (`import:fedb`/`seed:ejercicios`, `seed:plan`,
> `seed:planes-extra`, `seed:rugby-juvenil`, `seed:futbol-juvenil`, `seed:maria`). `--dry-run` primero.
>
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora P27 + ADR: imágenes FEDB dominio público vía URL
> raw de GitHub en runtime; mapeo propio→FEDB; espejo a Storage como futuro). `tsc -b` limpio, tests
> verdes. `git add -A && git commit` + `git push`. **Pará para revisión.**
