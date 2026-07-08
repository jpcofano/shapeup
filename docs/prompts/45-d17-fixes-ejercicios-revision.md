# Prompt 45 — D17 · Fixes de datos de la revisión de ejercicios (casa + rutinas)

> **Datos + seeds** (sin features nuevas). Origen: revisión de ejercicios del chat de
> arquitectura (2026-06). Se auditó el subset hogareño (307 ejercicios) y los 34 ejercicios
> curados de rutina (EJ-8xxx) contra el original FEDB. La data está sólida; este prompt cierra
> los huecos concretos que surgieron. Castellano voseo. **No toques pantallas ni features.**
> Tocás: 3 seeds, `scripts/data/traducciones-fedb.es.json`, el importador (solo el caso "sin EN")
> y, opcional, el video genérico de las rutinas.
>
> **Contexto de la auditoría (no hace falta re-verificar, ya está hecho):**
> - 305/307 caseros traducidos y con ficha completa. Las traducciones convierten unidades a
>   métrico y suelen ser más explicativas que el EN. **No se perdió ningún paso.**
> - Las 20 imágenes FEDB que usan las rutinas resuelven OK (HTTP 200).
> - Huecos reales: 13 ejercicios de rutina sin imagen (7 con match FEDB exacto), 2 caseros sin
>   ficha (vienen **sin instrucciones en FEDB**), 1 error de sentido en una traducción, y las
>   rutinas no tienen ni el video genérico por patrón.
>
> ---
>
> **(1) Asignar imagen FEDB a 7 ejercicios de rutina.** Todos los slugs ya están verificados
> (imágenes existen). Agregá `imagenes: imgs("<slug>")` a cada uno, en el seed donde vive:
>
> | ID | Ejercicio | Slug FEDB | Seed |
> |----|-----------|-----------|------|
> | EJ-8018 | Pallof press (banda) | `Pallof_Press` | `scripts/seed-rugby-juvenil.ts` |
> | EJ-8028 | Curl nórdico (asistido) | `Natural_Glute_Ham_Raise` | `scripts/seed-rugby-juvenil.ts` |
> | EJ-8023 | Gato–camello | `Cat_Stretch` | `scripts/seed-planes-extra.ts` |
> | EJ-8024 | Estiramiento del mundo (world's greatest) | `Worlds_Greatest_Stretch` | `scripts/seed-planes-extra.ts` |
> | EJ-8025 | Círculos de cadera | `Standing_Hip_Circles` | `scripts/seed-planes-extra.ts` |
> | EJ-8027 | Estiramiento de isquios y flexores | `Hamstring_Stretch` | `scripts/seed-planes-extra.ts` |
> | EJ-8030 | Caminata lateral con banda | `Monster_Walk` | `scripts/seed-maria.ts` |
>
> Los otros 6 sin imagen (EJ-8005 Press de pecho con banda, EJ-8017 Bird dog, EJ-8020 Sentadilla
> búlgara, EJ-8022 Aperturas de pecho con banda, EJ-8026 Apertura torácica, EJ-8029 Plancha
> copenhague) **no tienen match limpio en FEDB** — dejalos sin imagen y anotalos como deuda en la
> bitácora (candidatos a foto propia/externa).
>
> **(2) Dos fichas caseras nuevas, ya redactadas.** EJ-0358 (Iron Cross) y EJ-0664 (Side
> Jackknife) figuran como `traduccion: pendiente` pero **el origen FEDB no trae instrucciones**:
> no es traducir, es curar. Agregá estas dos entradas a
> `scripts/data/traducciones-fedb.es.json` (clave = `fuenteId`), tal cual:
>
> ```json
> "Iron_Cross": {
>   "nombre": "Cruz de hierro (iron cross)",
>   "patron": "Aislamiento",
>   "unilateral": false,
>   "sinonimos": ["iron cross", "cruz con mancuernas"],
>   "instrucciones": [
>     "Parate con una mancuerna en cada mano, pies al ancho de cadera y rodillas apenas flojas. Llevá las mancuernas al frente, a la altura de los muslos, casi tocándose. Esta es la posición inicial.",
>     "Con los brazos casi extendidos (codo fijo en un ángulo leve), abrí los brazos hacia los costados y arriba hasta la altura de los hombros, formando una cruz.",
>     "Hacé una pausa breve arriba, sin encoger los hombros hacia las orejas.",
>     "Bajá controlando en 2 s hasta volver a cruzar las mancuernas adelante. Repetí."
>   ],
>   "puntosClave": [
>     "Subí con fuerza del hombro, no con impulso de cadera.",
>     "Mantené el codo fijo en un ángulo leve durante todo el recorrido.",
>     "Arrancá liviano: es exigente para el deltoides."
>   ],
>   "erroresComunes": [
>     "Encoger los trapecios y subir los hombros a las orejas.",
>     "Usar demasiado peso y balancear el torso para llegar arriba."
>   ]
> },
> "Side_Jackknife": {
>   "nombre": "Navaja lateral (side jackknife)",
>   "patron": "Core flexión",
>   "unilateral": true,
>   "sinonimos": ["side jackknife", "navaja lateral", "crunch lateral"],
>   "instrucciones": [
>     "Acostate de costado, piernas estiradas y apiladas una sobre la otra. La mano de abajo apoyala en el piso o cruzada sobre el pecho; la mano de arriba, detrás de la cabeza. Esta es la posición inicial.",
>     "Llevá al mismo tiempo las piernas y el torso hacia arriba, acercando el codo de arriba a la cadera y contrayendo los oblicuos del costado de arriba.",
>     "Apretá un instante en la parte alta.",
>     "Bajá con control hasta la posición inicial. Completá las reps de un lado y cambiá de lado."
>   ],
>   "puntosClave": [
>     "El movimiento sale del costado del abdomen, no del cuello ni del brazo.",
>     "Subí piernas y torso a la vez, no por separado."
>   ],
>   "erroresComunes": [
>     "Tirar de la cabeza con la mano.",
>     "Usar impulso en lugar de contraer el oblicuo."
>   ]
> }
> ```
>
> **Caveat del importador:** estas dos no tienen texto EN, así que el validador de ratio del
> prompt 40 (ES vs EN) no aplica. Hacé que el importador trate "EN vacío" como **ficha curada**:
> marca `traduccion: "ok"`, salta el chequeo de ratio y no emite warning. No cambies el
> comportamiento para el resto.
>
> **(3) Fix de un error de sentido (clock push-up).** En `traducciones-fedb.es.json`, clave
> `Clock_Push-Up`, el paso 4 invierte el original. EN: *"move your outside foot **away from** your
> direction of travel"*. Hoy dice "en la dirección de desplazamiento". Reemplazá ese paso por:
>
> ```
> "Al acelerar hacia arriba, mové el pie externo en sentido opuesto a la dirección de desplazamiento; eso te impulsa hacia ese lado."
> ```
>
> **(4) (Opcional) Video genérico por patrón para las rutinas.** Hoy ningún EJ-8xxx tiene
> `videoUrl` — ni siquiera el clip representativo. No existe footage exacto libre por ejercicio
> (Wikimedia Commons tiene ~8 clips de la serie FitnessScape; ya están todos en el mapeo
> genérico). Como mínimo, importá `videoGenericoPorPatron` de `scripts/data/videos-genericos.ts`
> en los seeds y, donde el `patron` del ejercicio mapee a un clip, poblá `videoUrl` +
> `videoEsGenerico: true`, igual que el importador FEDB. Dejá sin video los patrones sin clip
> (core anti-extensión, etc.) — la foto cubre. **Esto es demo representativa, no exacta:** que
> la UI lo siga rotulando como tal (ya lo hace vía `videoEsGenerico`).
>
> ---
>
> **Verificación:**
> - Re-corré seeds + `npx tsx scripts/importar-fedb.ts` y regenerá `catalogo-ejercicios.json`.
> - Los 7 de rutina ahora tienen `imagenes` (2 URLs c/u); las URLs dan 200.
> - EJ-0358 y EJ-0664 quedan con `traduccion: "ok"`, instrucciones, puntosClave y errores
>   poblados; conteo de pendientes baja en 2.
> - `Clock_Push-Up` paso 4 corregido.
> - (Si hiciste el 4) los EJ-8xxx con patrón mapeable tienen `videoUrl` + `videoEsGenerico`.
> - `tsc -b` limpio, tests verdes (ajustá/agregá los que correspondan).
> - Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D17: 7 imágenes asignadas, 2 fichas
>   curadas sin-EN, fix clock push-up, 6 ejercicios sin imagen como deuda, caveat video exacto).
>
> **Un commit**, mensaje tipo:
> `fix(ejercicios): 7 imgs rutina + 2 fichas curadas + clock push-up + video rutinas (D17)`
> Push. **Pará y esperá mi revisión.**
