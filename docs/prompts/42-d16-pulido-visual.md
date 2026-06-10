# Prompt 42 — D16 · Pulido visual: Home, Historial, Salud, sesión guiada, FAB

> **Diseño** (pulido, sin features nuevas). Origen: auditoría 2026-06-10 (hallazgos B5–B8 y
> C10). Cinco arreglos puntuales e independientes — hacelos en este orden y NO aproveches
> para refactorizar nada más. Tokens siempre, voseo, re-skinea por tema.
>
> **(1) B5 — Home Aurora: una sola métrica de semana.**
> Hoy conviven "Día 3 de 4" (bajo el saludo) y el anillo "2/4 SESIONES" — dos formas de
> contar lo mismo que se contradicen. Decisión: el **anillo es la única métrica grande**
> (sesiones hechas / planificadas de la semana). La línea bajo el saludo pasa a ser contexto,
> una sola, en este formato: `Semana N · X de Y sesiones` (si el programa no lleva semanas,
> solo `X de Y sesiones esta semana`). Aplica a los 3 layouts (Aurora/Stadium/Clásico) si
> repiten el patrón.
>
> **(2) B6 — Historial: card consistente.**
> Hoy el chip RPE a veces queda inline con la meta y a veces en segunda línea, y fecha/series/kg
> pelean al mismo peso. Estructura fija de card:
> - Fila 1: título de la rutina + **chip RPE siempre a la derecha del título** (mismo lugar
>   en todas las cards; si no hay RPE, no hay chip).
> - Fila 2 (meta, una sola línea): `fecha · duración · series · kg totales`, con los **kg en
>   seminegrita** como dato principal y el resto en muted.
>
> **(3) B7 — Salud · Composición: llenar la mitad muerta.**
> Tras los 3 KPIs queda ~media pantalla vacía y el gráfico de peso es una recta sin puntos.
> - Gráfico de peso: tendencia de los últimos 30 días con **un punto por pesaje** y labels
>   de extremos (primera y última fecha + valor). Sin grilla pesada.
> - Debajo de cada KPI (grasa/músculo/IMC): última medición con fecha relativa ("hace 5 días").
> - Si sigue sobrando aire: card "Última medición" con la fila completa de la balanza
>   (fecha, peso, grasa, músculo, agua si existe). No inventes métricas que no estén en los datos.
>
> **(4) B8 — Sesión guiada: señalar que hay más contenido.**
> El dock inferior (steppers + CTA) tapa el final de "Cómo se hace" sin ninguna señal.
> - Scrim/fade de ~32px en el borde inferior del área scrolleable (gradiente a `--bg`),
>   visible SOLO cuando hay overflow real y no se llegó al final (un listener de scroll
>   barato o `scroll-timeline` si ya hay soporte).
> - `padding-bottom` extra en el contenido igual a la altura del dock + 16px, para que el
>   último renglón nunca quede tapado.
>
> **(5) C10 — FAB "+" sin acción.**
> Si ya existe la creación correspondiente en el repo (formulario de rutina/ejercicio),
> conectá el FAB a esa ruta. Si NO existe todavía, **ocultá el FAB** detrás de un flag o
> directamente sacalo de esa pantalla — un botón que no hace nada es peor que ninguno.
> Dejá en la Bitácora cuál de las dos fue.
>
> **Verificación:** recorrida visual de las 4 pantallas en 2 temas (ion + uno cálido) y
> en viewport angosto (360px). Capturas antes/después en la Bitácora si es práctico.
> `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D16:
> qué se tocó por hallazgo + decisión del FAB). Commit + push. **Pará y esperá mi revisión.**
