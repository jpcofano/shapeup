# Prompt 26 — Carga + reps en las rutinas de casa

> Objetivo: que **cada ejercicio de fuerza de las rutinas de casa** muestre peso y repeticiones.
> Hoy el helper `F` de `scripts/seed-plan.ts` arma la prescripción con `series/reps/descanso` pero
> **no acepta `cargaKg`**, así que ninguna rutina tiene peso. La carga va en la **prescripción**
> (rutina), no en el ejercicio — el modelo `PrescripcionFuerza.cargaKg` ya existe, no hay que tocarlo.
>
> **(1) Helper `F` (`scripts/seed-plan.ts`):** agregá `cargaKg?: number` al objeto `extra` y
> propagalo a la prescripción: `...(extra.cargaKg != null ? { cargaKg: extra.cargaKg } : {})`.
>
> **(2) Asignar carga inicial** a los ejercicios de fuerza **con implemento** en las rutinas de casa
> (RUT-0001/0002/0003 y las de fuerza de cada miembro). Valores **sugeridos de arranque, ajustables**
> (la app registra el peso real de cada serie). Equipo disponible: mancuernas regulables DeporAr
> (2 unidades, 25 kg total → ~12,5 kg por mano), una mancuerna fija de hierro ~6 kg, banda elástica,
> barra de dominadas. Para juanpablo (51, recomposición, RIR 2):
>
> | Ejercicio | cargaKg sugerida |
> |---|---|
> | EJ-8001 Sentadilla goblet | 12 (una mancuerna al pecho) |
> | EJ-8004 Remo a una mano | 10 |
> | EJ-8006 Curl de bíceps | 8 (por mano) |
> | EJ-8008 Zancada hacia atrás | 8 (por mano) |
> | EJ-8010 Peso muerto rumano (RDL) | 14 (dos mancuernas) |
> | EJ-8012 Swings con pesa | 10 |
> | EJ-8015 Press de hombros | 8 (por mano) |
> | EJ-8014 Puente de glúteos | 12 (opcional) |
>
> Ejercicios de **peso corporal** (EJ-8002 flexiones, EJ-8003/8009 dominadas, EJ-8007 fondos,
> EJ-8011 remo invertido) y **banda** (EJ-8005 press banda, EJ-8018 pallof): **sin `cargaKg`**, solo
> reps — están bien así.
>
> **(3) Que la carga se lea claro:** `prescripcionLabel` ya muestra `· X kg` cuando hay carga (queda
> `3×10-12 · 12 kg · 75s`). Para los de peso corporal/banda, mostrar el implemento en vez de un kg
> vacío: si la prescripción no tiene `cargaKg`, que el label (o la card) indique "peso corporal" o
> "banda" según `Ejercicio.equipo`, para que nunca quede ambiguo. (Cambio chico en
> `src/lib/prescripcionLabel.ts` o en la card de `RutinaDetalle`.)
>
> **(4) Mismo tratamiento** para las rutinas de fuerza de casa de María (`scripts/seed-maria.ts`) con
> cargas acordes a su nivel (glúteos/recomposición; sugerir 6–10 kg según ejercicio). Las de los
> chicos (rugby/fútbol) quedan para después.
>
> **(5) Re-sembrar:** estas rutinas ya existen, así que corré los seeds afectados con `--force`
> (`seed:plan --force`, `seed:maria --force`). Verificá en `--dry-run` primero.
>
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + nota: carga inicial en rutinas de casa, valores
> de arranque ajustables). `git add -A && git commit` + `git push`. **Pará para revisión.**
