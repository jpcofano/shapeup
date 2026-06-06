# Prompt 24 — D2 · Home

> Etapa de pulido D2. Pulís la pantalla más visible: `src/routes/Home.tsx` y
> `src/components/WeekStrip.tsx`. Target visual: `ui_kits/shapeup/screens-home.jsx` +
> `primitives.jsx` del design system. **No** toques `data/`/`lib`. Tokens siempre. Voseo.
>
> **(1) Header de marca:** reemplazá el título "Inicio" por un header con `<ShapeUpMark>` +
> wordmark "Shape**Up**" (la "Up" en `var(--accent)`) a la izquierda y el `MemberAvatar`
> (cliqueable → Perfil) a la derecha. Debajo, saludo grande en voseo: **"Dale, {primerNombre}."**
> (el punto en color de acento). 800, tracking ajustado.
>
> **(2) WeekStrip con bíceps:** en `WeekStrip.tsx`, reemplazá el **punto** de los días con
> entrenamiento por el ícono `biceps-flexed` (componente `<Bicep>` de D1) en color del acento —
> hoy a opacidad 1, otros días de sesión a ~0.5. Mantené el resaltado de "hoy" (fondo
> `--accent-dim`, número/letra en acento). Esto diferencia la Home del look de Comida.
>
> **(3) Card "Tu semana" (nueva, presentacional):** entre la WeekStrip y "Programa activo".
> Muestra: chip de **racha** con ícono `flame` relleno en acento ("3 sem de racha"),
> **sesiones X/Y** (cifra grande tabular) con **barra de progreso** (`--accent`), y **volumen**
> semanal ("8.2k kg"). Derivá los números de los datos que ya existen (historial de la semana /
> `getHistorialMiembro`); si todavía no hay un helper, calculalo en la capa de presentación con
> lo disponible y dejá un TODO — **no** agregues lógica a `lib`/`data`.
>
> **(4) "Hoy toca" y "Programa activo":** mantené el comportamiento; pulí espaciado, badges
> (foco/nivel/duración) y el botón **"Empezar sesión"** (primario, ícono `zap`). Conservá los
> estados día de descanso / VR / sin programa con su copy en voseo.
>
> **Verificación:** Home igual al UI kit, re-skinea con el tema del miembro, bíceps y llama
> toman el acento. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D2). `tsc -b` limpio,
> tests verdes, commit + push. **Pará y esperá mi revisión.**
