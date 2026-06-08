# Prompt 28 — A1 · "Empezar" claro (próxima sesión + 3 puertas)

> Problema (del análisis de UX): hoy Home calcula "qué toca" **por día de la semana** (frágil para
> quien entrena cuando puede), y Entrenar muestra una **lista plana de las 22 rutinas** sin decir
> cuáles son tuyas ni cuál sigue. Resultado: no se entiende cómo empezar ni dónde elegir.
>
> Solución: reorientar todo alrededor de **"tu próxima sesión"** (secuencia, no día fijo) y convertir
> Entrenar en un **chooser de 3 puertas**. El modelo ya soporta esto (`Programa.dias[]` con
> `orden/diaSemana/tipo/idRutina`, `config/visibilidad`, `Historial`); no hay que tocarlo.
>
> **(1) Lógica pura — `src/lib/proximaSesion.ts` (+ `.test.ts`):**
> `proximaSesion(programa, historialSemana)` → `{ dia: DiaPrograma; indice: number; total: number } | null`.
> - `total` = días no-descanso del programa. Recorre `programa.dias` por `orden`, salteando `tipo:"descanso"`.
> - Un día está **hecho** si hay en `historialSemana` una sesión con su `idRutina` (contemplá
>   **repeticiones**: si una rutina aparece en 2 días, hace falta 2 sesiones para tachar ambos).
> - Devuelve el **primer día no hecho** (con su índice 1..total). Si están todos → `null`
>   ("semana completa").
> - **No usa el día de la semana** para decidir (eso queda solo como dato de display). Función pura,
>   sin Firestore.
>
> **(2) Helper de datos — `src/data/rutinas.ts` (o donde corresponda):**
> `getRutinasDelMiembro(memberId)` → las rutinas visibles para ese miembro, cruzando `getRutinas()`
> con `config/visibilidad.rutinas`. El owner ve todas. Reusar caché existente.
>
> **(3) Home (`src/routes/Home.tsx`) — hero "Empezar":**
> - Arriba, grande: **"Próxima sesión: {nombre rutina} · Día {indice} de {total}"** + botón primario
>   **Empezar** → `navigate('/entrenar/{idRutina}')`.
> - Si `proximaSesion` devuelve `null`: estado positivo "Semana completa 🎉" + acceso a "elegir otra"
>   (no dejar la pantalla muerta).
> - Mantener WeekStrip y el progreso (sesionesHechas/objetivo) debajo.
>
> **(4) Entrenar (`src/routes/Entrenar.tsx`) — 3 puertas en vez de lista plana:**
> - **Puerta 1 — Tu próxima sesión:** misma que el hero (destacada arriba).
> - **Puerta 2 — Elegir una rutina:** lista filtrada con `getRutinasDelMiembro` (NO las 22 de todos),
>   con nombre + meta. Tocar → `/entrenar/{idRutina}`.
> - **Puerta 3 — Libre / un ejercicio:** entrada visible que apunta al modo libre. Ese modo lo
>   implementa **A2 (prompt aparte)**; por ahora dejá la puerta presente (deshabilitada o
>   "próximamente") para no romper el layout ni prometer algo que no anda.
>
> **(5) Tests:** `proximaSesion` con casos — semana vacía (devuelve día 1), algunos hechos (devuelve
> el siguiente), rutina repetida (cuenta ocurrencias), todo hecho (`null`), programa con descansos
> intercalados (los saltea).
>
> `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora A1 + mover A1 del
> Backlog a hecho; ADR: "próxima sesión por secuencia, no por día de la semana"). JSDoc en lo público.
> `git add -A && git commit` + `git push`. **Pará para revisión.**
