# Prompt 51 — VR: series, cronómetro de trabajo, tiempo total e imágenes

> **Código + datos + tests.** Post-serie S. Origen: revisión del owner (2026-07-07):
> las rutinas de VR (RUT-0004..0008) hoy son un único bloque de cardio "Continuo"
> sin series, sin descanso, sin timer y sin imagen. Este prompt las convierte en
> sesiones guiadas reales: rondas por juego, cronómetro de trabajo por serie,
> descanso entre series (reusa `DescansoTimer`), tiempo total visible e ilustración
> por juego. Castellano voseo, tokens siempre (`src/styles/tokens.css`), ADR #009
> (lógica pura en `src/lib/`, orquestación en `src/data/`).
>
> **Decisiones del owner (no re-discutir):**
> - Las rutinas VR pasan de formato `"Continuo"` a `"Intervalos"` en `PrescripcionCardio`.
>   **No se agrega ningún campo nuevo al modelo**: `rondas` = cantidad de series,
>   `trabajoSeg` = tiempo por serie, `descansoSeg` = descanso entre series. Con eso
>   `seriesObjetivo`, `descansoSeg()`, `objetivoSerieLabel`, `estimarDuracionMin` y el
>   `DescansoTimer` funcionan sin tocarlos.
> - **Nada de arte oficial de los juegos** (carátulas, screenshots de marketing):
>   es material con copyright. Se generan ilustraciones SVG **originales** por juego,
>   locales en `public/vr/`, con los tokens de diseño. El owner puede reemplazarlas
>   después por sus propios screenshots vía `Ejercicio.imagenes` (URLs).
> - El cronómetro de trabajo es un **espejo de `DescansoTimer`** (Web Audio + Notification,
>   descartar timers vencidos al montar). No introducir otra librería ni otro patrón.
> - Las estructuras de rondas por juego de la sección (2) son **valores iniciales del
>   owner, ajustables por él**, no derivados del modelo.

## (1) Núcleo puro — cronómetro de trabajo en `lib/entrenarState.ts`

Hoy `serieInicioMs[bloqueIdx]` ya guarda el epoch ms de arranque de la serie actual
(se setea al saltar/terminar el descanso). Falta poder derivar cuánto queda:

- `trabajoObjetivoSeg(p: Prescripcion): number | null` — segundos de trabajo de una
  serie según modalidad: Cardio Intervalos → `trabajoSeg ?? null`; Isométrico →
  `duracionHoldSeg`; Cardio Continuo → `duracionMin*60` si existe; Fuerza/Movilidad
  → `null` (no hay cuenta regresiva de trabajo).
- `trabajoRestanteMs(state, rutina, ahoraMs): number | null` — `null` si el bloque
  actual no tiene trabajo cronometrable o no hay `serieInicioMs` del bloque; si no,
  `max(0, inicio + objetivo*1000 − ahora)`.
- Asegurar que `serieInicioMs[bloqueActual]` se setee también **al entrar por primera
  vez a un bloque** (hoy solo se setea al salir del descanso, así la serie 1 de la
  sesión no tiene inicio). Regla: al montar la sesión y al cambiar de bloque, si el
  bloque actual no tiene `serieInicioMs` y no hay descanso activo → setear `Date.now()`.
- Tests en `entrenarState.test.ts`: cada modalidad devuelve su objetivo correcto;
  restante en 0 cuando venció; `null` para fuerza; serie 1 obtiene inicio al montar;
  el inicio NO se pisa si ya existía (volver atrás con los dots no reinicia el reloj).

## (2) Datos — re-prescribir RUT-0004..0008 como Intervalos

En `scripts/seed-plan.ts`, reemplazar el helper `CVR` por uno de intervalos VR
(`CVRI(orden, id, nombre, rondas, trabajoSeg, descansoSeg, zona, juego)`) que emite
`formato: "Intervalos"` conservando `zonaObjetivo`, `intensidad` y `juegoSugerido`.
Estructuras iniciales (decisión del owner, ajustables):

| Rutina | Juego | Rondas × trabajo / descanso | ≈ total |
|---|---|---|---|
| RUT-0004 | PowerBeatsVR | 5 × 5 min / 60 s | 29 min |
| RUT-0005 | Beat the Beats | 6 × 4 min / 60 s | 29 min |
| RUT-0006 | Pistol Whip | 6 × 4 min / 60 s | 29 min |
| RUT-0007 | Creed | 5 × 4 min / 90 s (rounds de boxeo) | 26 min |
| RUT-0008 | Body Combat | 3 × 10 min / 60 s (bloques de clase) | 32 min |

- Recalcular `duracionEstimadaMin` y `totalSeries` de esas rutinas con
  `estimarDuracionMin`/`seriesTotales` (no hardcodear).
- **Migración**: las rutinas ya viven en Firestore. Correr el seed con `--force`
  acotado a RUT-0004..0008 (si el flag actual pisa todo, agregar `--solo=RUT-0004..0008`
  o equivalente). Dry-run primero. No tocar RUT-0001..0003 ni RUT-0023..0025.
- `notas` de cada rutina VR: una línea que explique el mapeo ("cada serie es una
  canción/round; pausá el juego en el descanso si hace falta").

## (3) UI — cronómetro de trabajo + tiempo total en la sesión

- `src/components/entrenar/SerieTimer.tsx`: espejo de `DescansoTimer` pero cuenta
  regresiva de `trabajoRestanteMs`. Muestra "Serie N · M:SS", beep + notificación al
  llegar a 0 (el beep NO completa la serie: el usuario marca "Serie hecha" como
  siempre — en VR tenés el visor puesto, el registro es manual al sacártelo).
  Botón secundario "+30 s" para estirar. Solo se renderiza si `trabajoRestanteMs !== null`
  y no hay descanso activo (nunca los dos timers a la vez).
- Integración en `EntrenarSesion.tsx` y `EntrenarSesionLibre.tsx`, junto al
  `DescansoTimer` existente.
- **Tiempo total**: en `workout-header`, agregar reloj de sesión transcurrida
  (desde el primer `serieInicioMs`; formato H:MM o M:SS) + "estimado: X min"
  (`rutina.duracionEstimadaMin`). Vale para todas las rutinas, no solo VR.
- `BloqueGuiado`: si la prescripción es Cardio con `juegoSugerido`, mostrar chip
  "🎮 {juegoSugerido}" bajo el nombre. `objetivoSerieLabel` ya muestra
  "240 s fuerte / 60 s suave" para intervalos — ajustar SOLO para el caso con
  `juegoSugerido` a algo legible: "4 min de juego · 60 s de descanso".

## (4) Imágenes — ilustraciones SVG originales por juego

- Crear en `public/vr/` un SVG **original** por juego (EJ-9001..9010) + `generic.svg`
  (headset) de fallback. Estilo: flat, 2 colores de token + acento, motivo temático
  (pistola estilizada, guantes de boxeo, kayak, paleta de ping pong, notas/ritmo,
  siluetas de pose para OhShape, etc.). Nada que copie arte, logos ni tipografías
  de los juegos. `viewBox` 4:3 para encajar en `media-frame`.
- `scripts/seed-vr.ts`: agregar `imagenes: ["/vr/ej-900X.svg"]` a cada juego y
  re-correr con `--force` (dry-run primero). Documentar en el propio seed que el
  owner puede reemplazar por URLs de screenshots propios.
- `MediaTabs` ya renderiza `imagenes[0]` — verificar que resuelve rutas locales
  (`/vr/...`) igual que URLs absolutas; si el placeholder "Video pronto" molesta
  para VR (no va a haber video), ocultar la pestaña de video cuando el ejercicio
  tenga equipo `["VR"]`.

## (5) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde (373 previos + los nuevos de
  `entrenarState`).
- Seeds en dry-run, después reales; chequeo visual en la app:
  - Detalle de RUT-0007: "5 series · ~26 min" y la ilustración de boxeo.
  - Entrenar RUT-0007 guiado: arranca `SerieTimer` en 4:00, beep al final,
    marcar serie → `DescansoTimer` 90 s → serie 2 con el reloj reiniciado;
    header muestra transcurrido vs estimado.
  - Una rutina de fuerza: el header muestra el tiempo total pero NO aparece
    `SerieTimer` (fuerza no tiene trabajo cronometrable).
- Docs: `MAPEO-IMPLEMENTACION.md` (P51 en estado y bitácora); en `CLAUDE.md`
  agregar **ADR #024 — VR como intervalos**: las sesiones VR se modelan con
  `PrescripcionCardio` formato Intervalos (rondas=series) en vez de extender el
  modelo; las imágenes de juegos son SVG originales locales por copyright.
- Commit sugerido: `feat(vr): rutinas VR con series + timers de trabajo/descanso, tiempo total e ilustraciones (P51, ADR #024)`.
