# Prompt 39 — D13 · Home 3 layouts + Historial/Salud enriquecidos

> Etapa de diseño. Lleva al repo el resto de mejoras del kit. Target visual:
> `ui_kits/shapeup/screens-home.jsx`, `primitives.jsx` (Sparkline), `screens-salud.jsx`. **No**
> toques `lib`/`data`/`types`. Tokens, voseo, re-skinea con el tema. Va **después** de D11 (usa
> `sesionDeHoy` y el programa activo).
>
> **(1) Home — 3 estilos de layout seleccionables (por miembro):**
> - `<Home>` con branches **`aurora | stadium | clasico`** (copiá de `screens-home.jsx`):
>   - **Aurora** (default, ya hecho en D9): anillo + glass "Hoy toca/descanso" + bento 3 tiles +
>     vista semanal del programa activo.
>   - **Stadium**: hero marquesina (nombre de la sesión grande + glow + "Empezar ahora") + fila de
>     stats scrolleable (racha/volumen/sesiones/peso).
>   - **Clásico**: la Home de tarjetas (D2) — conservar como opción sobria.
> - Selector en **Perfil → "Estilo de inicio"** (3 opciones), persistido **por miembro**
>   (`localStorage` `su-home-by-member`, igual que el tema). Default: aurora.
>
> **(2) Sparkline — `src/components/Sparkline.tsx`:** gráfico de área SVG (línea + relleno
> degradado + punto final), `data: number[]`, `color`, `height`. Copiá de `primitives.jsx`.
>
> **(3) Historial — tab Progreso:** `Historial.tsx` suma tabs **Sesiones | Progreso**. En Progreso:
> Sparkline de volumen semanal (con "↑/↓ vs sem. ant."), tiles de totales (sesiones / horas), y
> **records personales** (PR) con ícono `Trophy`. Derivá de los datos existentes en la capa de
> presentación; si falta un dato, degradá.
>
> **(4) Salud — enriquecido:** en `Salud.tsx`:
> - **Composición**: hero de peso con Sparkline de tendencia + tiles (grasa/músculo/IMC) con Δ
>   (verde si mejora, rojo si empeora).
> - **Cardio**: barra de **distribución de tiempo por zona FC** (Z1→Z5 con sus tokens) + leyenda,
>   arriba de la lista de sesiones (que ya tiene chips de zona de D6).
> - **Sueño**: hero con Sparkline (en `--info`).
> Mantené el flujo de import con preview intacto.
>
> **Verificación:** los 3 layouts de Home andan y se eligen por miembro; Historial/Progreso y Salud
> muestran sparklines/records/distribución por zona; todo re-skinea con el tema; los datos faltantes
> degradan. `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D13).
> Commit + push. **Pará y esperá mi revisión.**
