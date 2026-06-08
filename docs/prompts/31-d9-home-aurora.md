# Prompt 31 — D9 · Home "Aurora+" (rediseño premium)

> Etapa de diseño D9. Reemplazás el look "dashboard/de sistemas" de la Home por el rediseño
> **Aurora+** (decidido en `explorations/DECISION-home-aurora.md`; referencia visual:
> `explorations/Home - Direcciones modernas.html`, dirección **B Aurora** + tiles de **C Bento**).
> **No** toques `lib`/`data`/`types`/`auth`. La Home **ya tiene la lógica de A1**
> (`proximaSesion`, historial de la semana, "Semana completa") — **consumí lo que ya expone, no
> cambies el flujo**. Tokens siempre, voseo. Re-skinea con el tema del miembro.
>
> **Composición (de arriba a abajo):**
> 1. **Top bar** — `<ShapeUpMark>` + wordmark a la izquierda, `MemberAvatar` (→ /perfil) a la
>    derecha. Saludo grande **"Dale, {primerNombre}."** (primer nombre real: Juan/María/Sofía/
>    Fede; punto en `--accent`, 800, tracking apretado) + subtítulo de contexto (ej. "Te queda 1
>    sesión esta semana" / "Día 3 de 4").
> 2. **Hero Aurora** — el centro:
>    - **Glow ambiental** detrás: un radial sutil del acento (`radial-gradient` con
>      `--accent` a baja opacidad, blur), contenido, no estridente.
>    - **Anillo de progreso** SVG grande (≈150px) = sesiones de la semana / objetivo (ej. 2/4).
>      Gradiente del acento **por tema con `color-mix`** (sin mantener 8 pares a mano):
>      ```css
>      --ring-from: var(--accent);
>      --ring-to: color-mix(in oklch, var(--accent), #ffffff 32%);
>      ```
>      Aplicá los stops vía `stop-color: var(--ring-from/to)`. Sumá un glow suave
>      (`filter: drop-shadow` o `feGaussianBlur`) en el trazo de progreso. Centro del anillo:
>      cifra grande tabular "2/4" + label "sesiones".
>    - **Card "glass"** (fondo semitransparente del card + `backdrop-filter: blur`, borde sutil)
>      con la **próxima sesión**: etiqueta "Próxima sesión · Día N de M", nombre de la rutina,
>      meta (foco/nivel/⏱), y botón **Empezar** primario (ícono `zap`). Esta card consume el
>      resultado de A1 (`proximaSesion`).
> 3. **Fila Bento** — **3 tiles** compactos (fondo `--card`, radio `--r-lg`, cifra 800 tabular +
>    label en `.t-label`): **Volumen** (kg de la semana), **Peso actual** (último de Salud, con
>    Δ vs anterior en `--accent` si baja / `--danger` si sube), **Racha** (con `flame` relleno).
>    - **Degradación:** si el miembro no tiene mediciones de peso, mostrá **2 tiles** (Volumen +
>      Racha) sin hueco. No inventes datos.
> 4. **WeekStrip** — igual que D2 (bíceps en días de sesión, hoy resaltado). Sin cambios.
>
> **Estado "Semana completa"** (cuando `proximaSesion` devuelve null): el anillo va **100% + check**
> en el centro, y la card glass muta a **"🎉 Semana completa"** + botón "Elegir otra rutina"
> (mantené el comportamiento que ya tiene A1, solo vestilo con el lenguaje Aurora).
>
> **Animación (micro, con buen gusto):**
> - El **anillo se llena animado** al entrar (~600ms, ease-out) desde 0 hasta el `pct`. Hacelo con
>   transición de `stroke-dashoffset` o `@keyframes`; gateá con
>   `@media (prefers-reduced-motion: no-preference)`.
> - **Micro-fades con stagger** en las tiles bento y la card glass al montar (fade+translateY
>   chico, 40–80ms de offset entre items). Nada de loops infinitos.
> - Con `prefers-reduced-motion: reduce` → todo aparece en su estado final, sin animar.
>
> **Detalles:** el gradiente y el glow re-skinean con el tema (vienen de `--accent`). El glass
> usa el `--card` con alpha, no un color nuevo. Nada hardcodeado.
>
> **Verificación:** Home se ve premium (anillo + glow + glass + bento), re-skinea en los 8 temas,
> el anillo se llena animado, el estado "Semana completa" se ve bien, y degrada a 2 tiles si no
> hay peso. `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D9 +
> fila en la tabla de Estado + ADR "gradiente de anillo por tema con color-mix"). Commit + push.
> **Pará y esperá mi revisión.**
