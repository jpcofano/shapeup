# Prompt 13 — Seed · Programa de María (glúteos + recomposición)

> Sumá al repo `scripts/seed-maria.ts` (te lo paso aparte; va en `scripts/`). Es **aditivo**.
> Agrega 2 ejercicios (`EJ-8033` empuje de cadera/hip thrust, `EJ-8034` patada de glúteo), 2
> rutinas (`RUT-0021`/`RUT-0022`) y 1 programa (`PRG-0012`: 4 días, 2 de fuerza con foco glúteos
> + 2 de cardio VR; objetivo recomposición). Mismo patrón idempotente (`--dry-run`/`--force`,
> `firebase-admin` con `scripts/service-account.json`). Reusa `EJ-80xx` y las rutinas de VR
> `RUT-0004`/`RUT-0008`, así que **corré antes `seed-plan.ts` (09) y `seed-vr.ts` (07)**. No
> corras el seed vos.
>
> Tareas: (1) `tsc -b` y consistencia con `Ejercicio`, `Rutina`, `Programa` y la unión
> `Prescripcion` de `src/types/models.ts`. (2) Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora
> + Mapa: `scripts/seed-maria.ts ✅`). (3) `git add -A && git commit` + `git push`. **Pará y
> esperá mi revisión.**
>
> Nota: la visibilidad de `PRG-0012` para el miembro `maria` se setea aparte en `config/visibilidad`.
