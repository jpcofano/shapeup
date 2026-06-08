# Prompt 32 — A2 · Modo libre / un ejercicio (funcional)

> Etapa funcional A2 (del backlog del MAPEO). Permite hacer una **sesión ad-hoc** sin rutina:
> elegir uno o varios ejercicios del catálogo y entrenarlos, registrándolos en el Historial con
> `tipo: "libre"` (sin `idRutina`). Respetá la arquitectura: lógica en `lib`/`data`, presentación
> aparte. **No** rompas el flujo de sesión guiada existente.
>
> **(1) Modelo / tipos — `src/types/models.ts`:** `Historial` suma `tipo?: "rutina" | "libre"`
> (default "rutina" para compatibilidad) y permite `idRutina` ausente cuando `tipo === "libre"`.
> Si hace falta, un `nombreLibre?: string` para titular la sesión ("Sesión libre").
>
> **(2) Estado de entrenamiento — `src/lib/entrenarState.ts`:** que el reducer pueda iniciar
> desde una **lista de bloques armada al vuelo** (no desde una `Rutina` persistida). Agregá un
> constructor de estado a partir de `BloqueEjercicio[]` ad-hoc. Las series/reps/carga por defecto
> salen del ejercicio o de un valor genérico editable (ej. 3×10). Mantené pura la lógica + tests.
>
> **(3) Cierre — `src/data/historial.ts`:** `finalizarSesion` acepta sesiones libres
> (sin `idRutina`, `tipo:"libre"`). La tx sigue escribiendo SOLO documentos del miembro (respetá
> ADR #014: nada de contadores en `/ejercicios`). Si no hay rutina, no intentes actualizar
> `vecesEntrenada`.
>
> **(4) UI (presentación, mínima):** en **Entrenar**, activá la 3ª puerta "Sesión libre" (hoy
> deshabilitada/placeholder): abre un **selector de ejercicios** (reusá el `ExercisePicker` del
> catálogo) para armar la lista; "Empezar" lanza `EntrenarSesion` en modo libre (mismo fullscreen,
> mismos dots/descanso/log/RPE). Al finalizar, va al Historial como sesión libre.
>
> **(5) Historial:** una sesión libre se ve en la lista con su badge de bíceps y un distintivo
> sutil ("Libre" como `badge-muted`) para diferenciarla de las de rutina. El detalle funciona
> igual (series registradas).
>
> **Nota de diseño:** dejá la UI funcional pero **sin pulir** — el pulido visual de la sesión
> libre va en el prompt D10. No inventes estilos nuevos; reusá clases existentes.
>
> **Verificación:** se puede armar una sesión con 2–3 ejercicios del catálogo, entrenarla,
> registrarla, y aparece en Historial como "Libre". `tsc -b` limpio, tests verdes (sumá los del
> reducer libre + cierre libre). Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora A2 + fila de
> Estado + ADR si cambia la forma de `Historial`). Commit + push. **Pará y esperá mi revisión.**
