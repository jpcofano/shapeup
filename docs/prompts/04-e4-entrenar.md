# Prompt 4 — E4 · Entrenar (núcleo)

> Etapa E4, la más importante. `src/hooks/useEntrenarState.ts` que envuelva
> `src/lib/entrenarState.ts` (cargar/persistir en localStorage, descartar descansos vencidos).
> Pantalla Entrenar guiada que muestre en cada momento: ejercicio y serie actual (dots de
> progreso), objetivo de la serie (`objetivoSerieLabel`), y del ejercicio sus `instrucciones`,
> `puntosClave` (banner verde), `erroresComunes` (banner ámbar) y las alternativas. Botón "Serie
> hecha" que registre reps/carga reales y dispare `completarSerie` (arranca el descanso si quedan
> series). Cronómetro de descanso con alarma (patrón de `StepTimer` de la app de comidas) +
> "Saltar" y "+30 s". Modo scroll además del guiado. Tests de `entrenarState`.
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E4 + Estado + Mapa). JSDoc en
> lo público. Después hacé `git add -A && git commit` con un mensaje claro de la etapa y `git push` a `origin/main`, así queda actualizado para revisar. **Pará y esperá mi revisión.**
