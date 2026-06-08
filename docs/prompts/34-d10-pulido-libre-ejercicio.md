# Prompt 34 — D10 · Pulido visual de Sesión libre + Detalle de ejercicio

> Etapa de diseño D10. Vestís lo que A2 (sesión libre) y B1 (ficha técnica) dejaron funcional.
> **No** toques `lib`/`data`/`types`/`auth`. Tokens siempre, voseo, re-skinea con el tema.
>
> **(1) Selector de "Sesión libre" (de A2):** la pantalla para armar la lista ad-hoc debe verse
> como parte de ShapeUp, no un picker pelado. Encabezado claro ("Armá tu sesión"), ejercicios
> elegidos como **tarjetas reordenables** con su mini-info (grupo, equipo) y un control de
> series/reps/carga por defecto editable, botón **Empezar** primario fijo abajo. Estado vacío con
> copy en voseo ("Sumá ejercicios del catálogo para empezar.").
>
> **(2) Distintivo "Libre" en Historial:** que la sesión libre se lea clara pero sin ruido — el
> badge de bíceps se mantiene; el chip "Libre" en `badge-muted`. En el **detalle** de una sesión
> libre, título "Sesión libre" 800 y la lista de series registradas igual que las de rutina.
>
> **(3) Ficha técnica del ejercicio (de B1) — pulido premium:** la sección de músculos/nivel/
> mecánica/patrón/equipo debe verse ordenada y jerárquica, no una sopa de chips. Sugerencia:
> - una fila "músculos" con primarios destacados (acento) y secundarios atenuados;
> - una grilla compacta 2×2 de meta (nivel · mecánica · patrón · equipo) con `.t-label` arriba
>   de cada valor;
> - separadores sutiles entre ficha / ejecución / banners.
> Mantené la imagen del ejercicio arriba.
>
> **(4) Micro-animaciones (coherentes con D9):** fade+translateY chico al expandir el detalle del
> ejercicio y al agregar/quitar ejercicios de la sesión libre. Gateá con
> `prefers-reduced-motion`. Sin loops.
>
> **Verificación:** la sesión libre se ve premium y consistente con D9; el Historial distingue
> "Libre" con elegancia; la ficha técnica del ejercicio se lee jerárquica; todo re-skinea con el
> tema. `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D10 +
> fila de Estado). Commit + push. **Pará y esperá mi revisión.**
