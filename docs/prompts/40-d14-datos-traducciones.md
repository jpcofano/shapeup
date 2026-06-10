# Prompt 40 — D14 · Datos: re-traducción fiel + catálogo completo + patrones + descansos

> **Datos/contenido** (importador + diccionario + UI mínima del catálogo). Origen: auditoría
> 2026-06-10 (hallazgos A1–A4, ver §D del mapeo). Problema central medido: de las 115
> traducciones, **107 conservan menos del 60% del texto EN** (las peores 14–18%; se pierden
> tips, respiración y advertencias), y **758 de 873 ejercicios están sin traducir** → catálogo
> bilingüe con fichas vacías. Castellano voseo. No toques pantallas fuera del catálogo/ficha.
>
> **(0) Política decidida por el owner (no re-discutir):** se importa TODO el dataset (873).
> Los pendientes se muestran con **badge "EN"** y existe un filtro **"Solo en español"**.
> La cobertura se amplía por lotes priorizando beginner+strength.
>
> **(0b) Preparación previa — la hace el OWNER antes de correr este prompt:** mergear al repo
> el `traducciones-fedb.es.json` de la conversación paralela (~133 entradas, formato resumido).
> Si al arrancar el diccionario tiene ~133 entradas, ya está mergeado; si tiene 115, avisale
> al owner y seguí con lo que hay (el flujo es el mismo).
>
> **(1) A3 — Arreglar `patronAprox()` en `scripts/importar-fedb.ts`.**
> Hoy: todo `push` → "Empuje horizontal" (un press militar es vertical), todo `pull` →
> "Tracción horizontal" (un chin-up es vertical), default "Aislamiento" (que es mecánica, no
> patrón). Reemplazá por un mapa de keywords sobre `name` (en minúsculas), en este orden:
> - `squat|lunge|leg press|step-up|split squat` → "Dominante de rodilla"
> - `deadlift|hip thrust|glute bridge|good morning|swing|rdl|romanian` → "Dominante de cadera"
> - `overhead|military|shoulder press|push press|handstand` → "Empuje vertical"
> - `pulldown|pull-up|chin-up|chinup|lat pull` → "Tracción vertical"
> - `row|face pull` → "Tracción horizontal"
> - `bench|push-up|pushup|dip|chest press|fly` → "Empuje horizontal"
> - `carry|farmer` → "Acarreo / locomoción" (o el valor más cercano del enum)
> - `plank|crunch|sit-up|rollout|pallof|twist|raise.*leg|leg raise` → "Core / anti-movimiento"
> - cardio/plyometrics → "Locomoción / cardio" (como hoy)
> - Fallback: el heurístico actual por `force`, y si no hay nada, "Aislamiento" SOLO si
>   `mechanic === "isolation"`; si no, dejá el patrón vacío/`undefined` antes que uno falso.
> Usá los valores EXACTOS del enum `PatronMovimiento` de `src/types/models.ts` (no inventes
> strings nuevos). Agregá test unitario del mapeo con ~15 casos representativos.
>
> **(2) A4 — `descansoSugeridoSeg` por mecánica/categoría** (en el mismo importador):
> compuesto 105 · aislamiento 70 · stretching/movilidad 25 · cardio/plyometrics 45.
> La traducción manual puede overridear (si el diccionario trae `descansoSugeridoSeg`, gana).
>
> **(3) A1 — Reglas de traducción fiel + validador.**
> En `scripts/data/traducciones-fedb.es.json` el formato no cambia, pero las traducciones
> nuevas (y las re-hechas) deben cumplir:
> - **1 paso EN = 1 paso ES** — no fusionar ni resumir pasos.
> - Los "Tip:" embebidos en un paso van a `puntosClave` (uno por tip).
> - Los "Caution:"/advertencias van a `erroresComunes`.
> - Mantener señales de respiración ("exhalá al subir, inhalá al bajar").
> - Voseo, lenguaje directo, sin tecnicismos innecesarios.
> En `importar-fedb.ts`, agregá un **validador**: para cada ejercicio traducido, si
> `lenES/lenEN < 0.7` (largo total de instrucciones) o `pasosES < pasosEN`, logueá un warning
> con el id y el ratio. Al final: resumen "N traducciones por debajo del umbral". No bloquea
> el import, solo reporta.
>
> **(3b) Ejemplo del estándar esperado (Chin-Up, hoy ratio 0.17):**
> ```json
> "Chin-Up": {
>   "nombre": "Dominada supina (chin-up)",
>   "instrucciones": [
>     "Agarrá la barra con las palmas hacia vos, a un ancho apenas menor que el de hombros.",
>     "Colgá con los brazos extendidos, torso lo más recto posible, con leve arco lumbar y el pecho hacia afuera. Esa es tu posición inicial.",
>     "Exhalando, subí el torso hasta que la cabeza llegue a la altura de la barra. Concentrate en tirar con los bíceps y mantené los codos pegados al cuerpo.",
>     "Apretá los bíceps arriba un segundo.",
>     "Bajá lento hasta extender los brazos por completo, inhalando durante la bajada."
>   ],
>   "puntosClave": [
>     "El agarre supino suma más bíceps que la dominada prona.",
>     "Torso recto = más bíceps y menos espalda.",
>     "Solo se mueven los brazos; los antebrazos únicamente sostienen la barra."
>   ],
>   "erroresComunes": ["Balanceo (kipping) involuntario."]
> }
> ```
> Fijate: 5 pasos EN → 5 pasos ES; los dos "Tip:" del EN pasaron a `puntosClave`; el curado
> original ES ("agarre supino suma más bíceps", "kipping") se conservó; la respiración quedó
> en los pasos.
>
> **(4) A1 — Re-pase de muestra: SOLO las 15 peores.** Aplicando las reglas de (3), re-traducí
> las 15 entradas con peor ratio según el validador (las demás quedan para el prompt 40b, que
> se corre por lotes aparte). Conservá `nombre`, `sinonimos`, `patron`, `modalidad`,
> `unilateral` ya curados — lo que se re-hace es `instrucciones`. **Importante:**
> los `puntosClave`/`erroresComunes` actuales tienen curado original que NO está en el EN
> (p.ej. "agarre supino suma más bíceps", "codos a ~45°", "kipping involuntario") —
> **conservalos y sumales** los Tips/Cautions del EN; no los reemplaces. Lo mismo con
> adaptaciones hogareñas embebidas ("o en el piso"): se mantienen.
>
> **(5) A2 — UI del catálogo para pendientes** (mínimo, sin rediseñar):
> - Badge **"EN"** (chip chico, tono muted) junto al nombre cuando `traduccion === "pendiente"`.
> - Filter chip **"Solo en español"** en la fila de filtros del catálogo (default: apagado).
> - En la ficha de un pendiente: instrucciones EN tal cual + nota tenue "Traducción pendiente".
>   No mostrar secciones vacías de puntos clave / errores comunes.
>
> **(6) NO sigas traduciendo más allá de (4).** El resto de los re-pases y los ejercicios
> nuevos se hacen con el **prompt 40b** (lote repetible), que el owner corre cuando quiere,
> intercalado con otras etapas. Este prompt entrega el código + el validador + la muestra.
>
> **Verificación:** `npx tsx scripts/importar-fedb.ts` regenera el catálogo sin errores y
> reporta conteos (total / traducidos / pendientes / warnings de ratio). Las 15 re-traducidas
> pasan el umbral 0.7. Catálogo muestra badge EN + filtro y la ficha pendiente se ve digna.
> `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D14:
> medición previa → reglas → lotes hechos → conteos finales). Commit + push.
> **Pará y esperá mi revisión.**
