# Prompt 10 — Seed · Planes adicionales (hipertrofia, movilidad, express, deload)

> Sumá al repo el script `scripts/seed-planes-extra.ts` (te lo paso aparte; va en `scripts/`).
> Es **aditivo**: no toca lo sembrado por `seed-plan.ts`. Agrega 9 ejercicios nuevos
> (`EJ-8019`–`EJ-8027`: variantes de hipertrofia y movilidad), 8 rutinas (`RUT-0009`–`RUT-0016`)
> y 4 programas (`PRG-0006`–`PRG-0009`): Hipertrofia 4 días, Movilidad y recuperación, Express
> 2 días/30 min, y Semana de descarga (deload). Mismo patrón idempotente (`--dry-run`/`--force`,
> `firebase-admin` con `scripts/service-account.json`).
>
> Dependencias: reusa `RUT-0001`/`RUT-0002` y `EJ-9003`, así que **corré antes `seed-plan.ts`
> (prompt 09) y `seed-vr.ts` (prompt 07)**. No corras el seed vos; lo corre el usuario.
>
> Tareas: (1) verificá que tipa con `tsc -b` y que es consistente con `Rutina`, `Programa`,
> `BloqueEjercicio`, la unión `Prescripcion` y `Ejercicio` de `src/types/models.ts`. (2) Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa: `scripts/seed-planes-extra.ts ✅`). Notá en la
> bitácora que el programa deload (`PRG-0009`) reduce volumen vía `comoUsar`/`reglasProgresion`
> (reusa las rutinas existentes, no crea versiones "livianas" duplicadas). (3) `git add -A &&
> git commit` con mensaje claro y `git push`. **Pará y esperá mi revisión.**
