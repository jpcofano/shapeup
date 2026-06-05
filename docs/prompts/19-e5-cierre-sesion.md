# Prompt 19 — E5.1 · Cierre de sesión correcto (multiusuario)

> Bug crítico: hoy **un miembro que no sea el owner no puede cerrar una sesión**, y la máquina de
> estados de la sesión es código muerto desde la UI. Hay que arreglarlo junto.
>
> **Problema 1 — la transacción de `finalizarSesion` falla para no-owners.** Dentro de la tx se
> incrementan contadores en `/ejercicios` (`vecesUsado`), `/rutinas` (`vecesEntrenada`,
> `ultimaVez`, `ultimoRpe`) y `/programas` (`vecesUsado`) — las tres son colecciones **owner-only**
> por reglas. Si entrena María/Sofía/Federico, la escritura se rechaza y aborta TODO, perdiendo
> el Historial. Decisión de arquitectura: **separar lo personal de lo compartido.** La transacción
> de cierre debe escribir SOLO documentos del propio miembro: crear el `Historial` y transicionar
> la `SesionProgramada` a `Registrada` (+ `progreso`/`rpe`). **Sacá de esa transacción los
> incrementos de contadores en ejercicios/rutinas/programas.** Esos contadores son derivables del
> Historial (analítica), no deben bloquear el guardado. Si los querés mantener "en vivo", hacelos
> en un camino aparte best-effort (no bloqueante) o por agregación; documentá la decisión en un ADR.
>
> **Problema 2 — la sesión nunca cambia de estado y el Historial queda huérfano.**
> `EntrenarSesion.tsx` solo llama a `finalizarSesion`; nunca a `iniciarSesion`/`registrarSesion`,
> y `finalizarSesion` fabrica su propio `idSesion` con `Date.now()`. Arreglo: al empezar la
> sesión, llamá `iniciarSesion` (`Programada → En curso`); al cerrar, **pasale el `idSesion` real**
> de la `SesionProgramada` y, en la misma transacción, marcá esa sesión como `Registrada`. El
> `Historial` debe apuntar al `idSesion` que lo originó (nada de `Date.now()`).
>
> **Problema 3 — robustez.** Si quedara algún read-modify de docs que pueden no existir, leé
> dentro de la tx (las lecturas van antes que las escrituras en Firestore) y salteá los faltantes,
> o usá `set` con `merge`.
>
> **Limpieza:** unificá `seriesObjetivo` (`lib/entrenarState.ts`) y `seriesDeBloque`
> (`lib/metricas.ts`), que son idénticas, en una sola función pura compartida.
>
> Agregá/extendé tests: que `finalizarSesion` cierre bien (Historial + sesión `Registrada` con el
> id correcto) y, si tenés los tests de reglas (prompt 18), uno que confirme que **un miembro
> no-owner puede registrar su sesión**. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E5.1 +
> ADR de la separación personal/compartido). `git add -A && git commit` + `git push`. **Pará y
> esperá mi revisión.**
