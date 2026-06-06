# Prompt 25 — D3 · Entrenar / EntrenarSesion

> Etapa de pulido D3 — el corazón de la app. Pulís `src/routes/Entrenar.tsx`,
> `src/routes/EntrenarSesion.tsx` y `src/components/entrenar/*` (`ProgressDots`,
> `DescansoTimer`, `BloqueGuiado`, `BloqueScroll`). Target: `ui_kits/shapeup/screens-entrenar.jsx`.
> `EntrenarSesion` es **fullscreen sin nav** (respetar). **No** toques `useEntrenarState` ni
> `lib/entrenarState`. Tokens siempre. Voseo.
>
> **(1) Sesión guiada (`BloqueGuiado`):** counter "Ejercicio N de M", nombre grande (800,
> tracking -0.02em), `ProgressDots` de series (done/active con el acento), chip de objetivo
> ("Serie N · {reps/carga o segundos}"), instrucciones colapsables, y los banners de técnica:
> **verde** `puntosClave` y **ámbar** `erroresComunes` (clases `banner-green`/`banner-amber`).
>
> **(2) Log rápido + serie hecha:** inputs grandes tabulares de reps/carga (solo en Fuerza),
> botón **"Serie N hecha ✓"** (verde, `scale(.98)` al apretar), y "Deshacer última serie".
>
> **(3) Descanso (`DescansoTimer`):** card centrada, cifra `timer-big` (52px, tabular) en el
> acento, urgente en `--danger` ≤5s; botones "+30 s" y "Saltar". Conservá el beep/Notification.
>
> **(4) Modo scroll:** botones de serie por bloque (done con `--accent-dim`/borde acento).
> Mantené el toggle guiada↔scroll en el header (íconos `align-justify`/`zap`).
>
> **(5) Finalización:** pantalla de cierre con título 800, total de series, **selector de RPE**
> 1–10 (seleccionado en acento) y botones "Finalizar y guardar" / "Empezar de nuevo". Reforzá el
> motivo: sumá el `<Bicep>` o `flame` arriba del título de cierre (decorativo, en acento).
>
> **Verificación:** flujo completo igual al UI kit; re-skinea con el tema. Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D3). `tsc -b` limpio, tests verdes, commit + push.
> **Pará y esperá mi revisión.**
