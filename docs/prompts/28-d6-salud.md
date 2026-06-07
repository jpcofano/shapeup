# Prompt 28 — D6 · Salud (acotado: zonas FC + pulido)

> Etapa de pulido D6. La pantalla `src/routes/Salud.tsx` **ya funciona** (tabs, import con
> preview, MiniChart, carga manual) — **no la rehagas**. Esta etapa es **acotada**: hacer
> visible la **escala de zonas de FC** (el diferenciador de identidad de ShapeUp) y limpiar 3
> detalles. **No** toques `data/salud`, `import/samsungHealth` ni la lógica de parseo. **Mantené
> el preview antes de importar.** Tokens siempre, voseo. Target visual:
> `ui_kits/shapeup/screens-salud.jsx` (Salud).
>
> **(1) Chips de zona FC en el `CardioTab` (lo principal):** hoy la zona se muestra como texto
> gris plano (`· ${c.zonaPrincipal}`). Reemplazalo por un **chip de color** que use los tokens
> de zona (`--zona-z1..z5` y `--zona-z1..z5-dim`). La zona viene como `"Z1".."Z5"`:
> ```jsx
> {c.zonaPrincipal && (
>   <span style={{
>     padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600,
>     background: `var(--zona-${c.zonaPrincipal.toLowerCase()}-dim)`,
>     color: `var(--zona-${c.zonaPrincipal.toLowerCase()})`,
>   }}>{c.zonaPrincipal}</span>
> )}
> ```
> Sacá la zona de la línea de texto muted y ponela como chip al lado de la actividad/fecha (mirá
> el layout del UI kit: actividad + fecha arriba, y abajo "dur · kcal · FC ~X" + chip de zona).
> Las zonas **NO** cambian con el tema (son semánticas) — por eso usan sus propios tokens, no
> `--accent`.
>
> **(2) Leyenda de zonas (chico, suma):** arriba de la lista de sesiones de cardio, una fila
> compacta con las 5 zonas (Z1 recuperación · Z2 suave · Z3 aeróbico · Z4 umbral · Z5 máximo),
> cada una con su color de token, para que se entienda la rampa. Una sola línea, discreta.
>
> **(3) Verde hardcodeado en el mensaje de import:** `background: rgba(74,222,128,0.12)` está
> hardcodeado y desentona con temas no-verdes. Para éxito, usá un verde **semántico fijo** para
> fondo Y texto (p.ej. `background: rgba(74,222,128,0.12); color: #4ade80`) — el éxito es verde
> siempre, no debe seguir el acento. Para error mantené `--danger`/su tint.
>
> **(4) Etiqueta del tipo en el preview, en castellano:** en `ImportPreview`, el `tipo` crudo
> ("weight"/"exercise"/"sleep"/"metricas") se muestra tal cual. Mapealo a etiqueta legible
> ("Peso", "Ejercicio", "Sueño", "Métricas") con un objeto local de presentación.
>
> **(5) Limpieza extra (de pasada):** en `Home.tsx`, card "Tu semana", el ternario de la racha
> tiene las dos ramas idénticas (`=== 1 ? "sem de racha" : "sem de racha"`). Dejá singular/plural
> correcto: `=== 1 ? "sem de racha" : "sems de racha"`.
>
> **Verificación:** en Cardio, cada sesión muestra su chip de zona con el color correcto (Z1 sky
> → Z5 rojo) y la leyenda arriba; los chips **no** cambian al cambiar de tema; el mensaje de
> import se ve bien en Crimson/Pulse; el preview muestra el tipo en castellano; la racha
> pluraliza. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D6). `tsc -b` limpio, tests
> verdes, commit + push. **Pará y esperá mi revisión.**
