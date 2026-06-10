# Prompt 41 — D15 · Micro-interacciones (movimiento con propósito)

> **Diseño/movimiento.** Origen: auditoría 2026-06-10 (hallazgo C9). Hoy todo cambio de
> pantalla/tab es un corte seco, el anillo de progreso aparece ya pintado y completar una
> serie no da feedback. Set ACOTADO de micro-interacciones — nada de librerías de animación
> nuevas (CSS transitions/keyframes + `requestAnimationFrame` donde haga falta). Castellano
> voseo. No cambies layout ni copy: solo movimiento.
>
> **(0) Tokens de movimiento** (una sola vez, en el CSS global de tokens):
> `--dur-fast: 140ms; --dur-base: 220ms; --dur-slow: 420ms;`
> `--ease-out: cubic-bezier(.22,1,.36,1); --ease-spring: cubic-bezier(.34,1.4,.64,1);`
> Usalos en todo lo que sigue — nada de duraciones hardcodeadas sueltas.
>
> **(1) Entrada de listas/cards con stagger.** Al montar una pantalla con lista de cards
> (Biblioteca, Historial, Programas, Salud): fade + translateY(8px)→0, `--dur-base`,
> delay incremental de 50–60ms por card, **cap a las primeras 6** (las siguientes entran
> juntas). Implementación sugerida: clase `entrando` + `animation-delay` por índice via
> `style`, o un util compartido — no repitas el bloque en cada pantalla.
>
> **(2) Anillo de progreso (Home Aurora y donde haya anillos).** Al montar: animar
> `stroke-dashoffset` desde 0% hasta el valor real (`--dur-slow`, `--ease-out`) + count-up
> del número central (rAF, mismo timing). Si el valor cambia en vivo (sesión guiada),
> transicionar al nuevo valor, no saltar.
>
> **(3) Feedback de "Serie hecha".** Al confirmar una serie en la sesión guiada:
> - el botón hace un pulso de escala (1 → 0.97 → 1, `--dur-fast`, `--ease-spring`),
> - el check/contador de serie entra con escala 0.6→1 + fade,
> - la barra/indicador de progreso global avanza con transición, no salta.
>
> **(4) Tabs e indicador.** El subrayado/indicador de tabs (Biblioteca, Salud, Historial)
> se desliza a su nueva posición (`--dur-base`, `--ease-out`) en vez de teletransportarse.
> El contenido del tab entra con un fade corto (`--dur-fast`); sin slides horizontales
> de pantalla completa.
>
> **(5) Estados pressed.** Cards y botones primarios: `transform: scale(.985)` en
> `:active` con `--dur-fast`. Sutil — se siente, no se ve.
>
> **(6) Accesibilidad — obligatorio.** TODO lo anterior dentro de
> `@media (prefers-reduced-motion: no-preference)`. Con reduced motion: estado final
> directo, sin animación. El count-up también se desactiva (número final directo).
>
> **Restricciones:** sin librerías nuevas; sin animaciones infinitas decorativas; sin
> animar `width/height/top/left` (solo `transform` y `opacity`, salvo el dashoffset del
> anillo); el bundle no crece más que unos KB de CSS/JS.
>
> **Verificación:** recorrida manual de Home → Biblioteca → sesión guiada → Historial con
> y sin reduced-motion (emulado en DevTools). Nada parpadea ni "salta dos veces" (cuidado
> con re-renders de React re-disparando la animación de entrada: la entrada es por MONTAJE,
> no por update). `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md`
> (Bitácora D15: tokens → dónde se aplicó → verificación reduced-motion). Commit + push.
> **Pará y esperá mi revisión.**
