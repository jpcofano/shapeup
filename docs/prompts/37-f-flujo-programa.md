# Prompt 37 — F1+F2+F3 (D11) · Flujo de programa semanal

> Etapa funcional+diseño. Hace claro **cómo el miembro elige, ve y cambia su programa semanal**,
> con días **por día de semana** y descansos visibles, y **programa activo por miembro**. Target
> visual: `ui_kits/shapeup/screens-programa.jsx` + `screens-home.jsx` (variante aurora). Respetá
> el nav de 6 ítems (Programas entra por tab en Biblioteca). Tokens siempre, voseo.
> Ver decisiones y ADRs en `MAPEO-ADDENDUM.md` §B.
>
> ## F1 — Programa activo POR MIEMBRO
> - Nuevo doc `config/programaActivo` = mapa `{ miembroId: programaId }` (análogo a
>   `config/visibilidad`). **No** migres los docs de `/programas`.
> - `src/data/programas.ts`: `getProgramaActivo(miembroId)` lee ese mapa; **fallback** al
>   `estado:"Activo"` actual si no hay entrada. Nuevo `setProgramaActivo(miembroId, programaId)`.
> - Regla Firestore para `config/programaActivo`: cualquier miembro puede escribir su propia clave
>   (o, más simple y consistente con el resto: isFamilyMember read/write). Tests de reglas.
>
> ## F2 — Días POR DÍA DE SEMANA
> - `DiaPrograma` debe tener `diaSemana` (0=Lunes … 6=Domingo). Si el modelo/seed no lo puebla,
>   agregalo a los seeds de programas (sin romper `orden`, que sigue para el fallback secuencial).
> - `src/lib/sesionDeHoy.ts` (nuevo, puro): `sesionDeHoy(programa, diaSemanaHoy, historialSemana)`
>   → `{ tipo: "descanso" }` | `{ tipo: "rutina", idRutina, yaHecha: bool }`. Resuelve qué toca
>   HOY según el día de la semana. Tests.
> - `proximaSesion` (existente) se mantiene como fallback para "qué sigue" si saltaron días.
>
> ## F3 — Elegir / ver / cambiar (UI)
> - **Biblioteca**: agregá tab **"Programas"** (queda `Programas | Rutinas | Ejercicios`; el
>   catálogo NO suma ítem al nav). Lista de programas filtrada por `visibilidad` del miembro;
>   cada uno con mini-vista semanal + "X días/sem · Y descanso" + badge "Activo" si lo es.
> - **`src/routes/ProgramaDetalle.tsx`** (nuevo): cabecera + badges (objetivo/nivel/X días/Y
>   descanso); **vista semanal** (L–D, entreno vs descanso); **día por día** (Lunes Empuje ·
>   Martes Descanso…); `comoUsar`/`reglasProgresion`; botón **"Activar para mí"** →
>   `setProgramaActivo(miembroId, id)` → navega a Home. Si ya es el activo, botón deshabilitado
>   "Activo para {nombre}".
> - Ruta `/programa/:id`.
>
> ## D11 — Pulido visual
> - **Componente `src/components/VistaSemanal.tsx`**: fila L–D. Día de entreno = círculo
>   `--accent-dim` con `<Bicep>`; día de descanso = círculo con borde punteado + ícono `Moon` en
>   `--muted`; hoy resaltado (`--accent-dim` + borde acento). Copiá formas/estados de
>   `ui_kits/shapeup/screens-programa.jsx`.
> - **Home (aurora)**: la glass card "Hoy toca · {día}" usa `sesionDeHoy`; si hoy es descanso,
>   muta a "**Día de descanso** — Recuperá. La recuperación es parte del entrenamiento." con botón
>   secundario "Entrenar igual". La WeekStrip/card semanal de Home usa `VistaSemanal` del programa
>   activo (entrenado / planificado / descanso distinguibles). Clickeable → `/programa/:activo`.
> - **Entrenar**: la puerta 1 ("Hoy toca") usa `sesionDeHoy` — debe coincidir con Home (no pueden
>   discrepar sobre qué toca hoy).
>
> **Verificación:** elegir un programa desde Biblioteca → "Activar para mí" → Home y Entrenar
> reflejan la sesión de hoy de ese programa (o "descanso"); cada miembro tiene su programa activo;
> días de descanso visibles; re-skinea con el tema. `tsc -b` limpio, tests verdes (sesionDeHoy +
> reglas de `config/programaActivo`). Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora F1/F2/F3/D11
> + ADRs del addendum + tabla de Estado). Commit + push. **Pará y esperá mi revisión.**
