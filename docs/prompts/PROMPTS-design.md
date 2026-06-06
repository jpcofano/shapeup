# ShapeUp — Prompts para Claude Code · PULIDO de Design (D1–D7)

Continúa la secuencia numerada de `docs/prompts/` (que llega hasta el **22 / E6.1**). Estos
son los prompts del **pulido visual** que produjo Claude Design: implementan la identidad
propia de ShapeUp, el sistema de **temas por miembro** y el pulido pantalla por pantalla.

Pegale a Claude Code **uno a la vez**, en orden, y revisá antes de pasar al siguiente (cada
prompt termina con "pará y esperá mi revisión").

```
docs/prompts/
  01-e1-base.md … 22-e6-ingesta-completa-salud.md   ← etapas de ingeniería (hechas)
  23-d1-identidad-temas.md                          ← este lote (pulido de Design)
  24-d2-home.md
  25-d3-entrenar.md
  26-d4-biblioteca.md
  27-d5-historial-progreso.md
  28-d6-salud.md
  29-d7-perfil-auth.md
```

## Fuente de verdad visual (el design system de ShapeUp)
Claude Design entregó un **design system** aparte. Antes de empezar, conseguí esa carpeta y
tratala como la fuente de verdad del pulido. Sus piezas clave:

| Archivo del design system | Para qué |
|---|---|
| `colors_and_type.css` | Tokens completos: accent **tematizable**, 8 temas `[data-theme]`, escala de **zonas FC** (`--zona-z1..z5`), **estados de fitness**, radios, espaciado, tipografía + clases semánticas. **Se vuelca a `src/styles/tokens.css`.** |
| `assets/shapeup-*.svg` | Logo: `shapeup-icon.svg` (app), `shapeup-mark.svg` (marca), `shapeup-wordmark.svg` / `-light.svg`. |
| `README.md` | CONTENT FUNDAMENTALS (voseo, casing, copy), VISUAL FOUNDATIONS, ICONOGRAPHY (Lucide 1.8 + bíceps + llama), sección **Temas**. |
| `ui_kits/shapeup/` | **Recreación interactiva** de cada pantalla pulida (Home, EntrenarSesion, Biblioteca, Historial, Salud, Perfil) — es el target visual a igualar. Mirá `*.jsx` para el detalle de cada componente. |
| `preview/*.html` | Tarjetas del sistema (colores, temas, tipografía, componentes). |

## Regla permanente (vale para TODOS los prompts)
> Documentá todo. Al cerrar cada etapa, **antes de frenar**, actualizá
> `docs/MAPEO-IMPLEMENTACION.md`: entrada en la Bitácora (archivos, decisiones, desviaciones,
> tests, cómo probarlo), tabla de Estado y Mapa del código, y ADR para decisiones de peso. Si
> se construyó algo y no quedó en el mapeo, se considera no hecho. JSDoc en lo público de
> `data/` y `lib/`. `tsc -b` limpio y tests verdes. `git add -A && git commit` + `git push`.

## Qué NO tocar (restricciones de diseño — repetir en cada etapa)
> Design toca **presentación**. No toques la lógica: `src/lib/`, `src/data/`, `src/types/`,
> `src/auth/`. El **nav inferior de 6 ítems** (Inicio/Rutinas/Entrenar/Historial/Salud/Perfil)
> es fijo — el catálogo entra por tabs en Biblioteca, no suma un 7º ítem. `EntrenarSesion` es
> **fullscreen sin nav** (respetarlo). El **preview antes de importar** en Salud se mantiene.
> Usá **siempre tokens**, nunca colores hardcodeados. Texto de UI en **castellano (voseo)**.

## Antes de empezar (manual, una vez)
> Corré los seeds (`docs/SEEDS.md`) para trabajar con la app **llena** (cada miembro con su
> programa, ejercicios con técnica, perfiles con color/zonas), no vacía.

---

## Orden (resumen)
1. **23 · D1 — Identidad + temas:** tokens, logo, zonas FC, estados, motivo bíceps, sistema de 8 temas **por miembro** + `ThemeProvider`.
2. **24 · D2 — Home:** header de marca + saludo, WeekStrip con bíceps, card "Tu semana" (racha + volumen).
3. **25 · D3 — Entrenar / EntrenarSesion:** sesión guiada, dots, descanso, banners de técnica, finish.
4. **26 · D4 — Biblioteca + Catálogo:** tabs, tarjetas de rutina/ejercicio, filtros, detalle.
5. **27 · D5 — Historial + Progreso:** lista con badge bíceps, detalle, MiniChart.
6. **28 · D6 — Salud:** tabs, chips de zona FC, MiniChart, flujo de import con preview.
7. **29 · D7 — Perfil + auth:** perfil, **selector de tema** refinado, Login / no-autorizado con marca.

### Notas
- Un prompt por vez; revisá y recién ahí seguís.
- El avance real se sigue en `docs/MAPEO-IMPLEMENTACION.md` (lo mantiene Code).
- Si Code se desvía del target del UI kit, corregí antes de avanzar.
