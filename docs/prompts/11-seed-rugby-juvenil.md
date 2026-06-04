# Prompt 11 — Seed · Programa juvenil de rugby (prevención)

> Sumá al repo `scripts/seed-rugby-juvenil.ts` (te lo paso aparte; va en `scripts/`). Es
> **aditivo**. Agrega 2 ejercicios de prevención (`EJ-8028` curl nórdico asistido, `EJ-8029`
> plancha copenhague), 2 rutinas (`RUT-0017`/`RUT-0018`) y 1 programa (`PRG-0010`: complemento
> de rugby para un jugador de 16, 2 días, foco prevención de lesiones + movilidad, cargas
> submáximas). Mismo patrón idempotente (`--dry-run`/`--force`, `firebase-admin` con
> `scripts/service-account.json`). Reusa ejercicios `EJ-80xx`, así que **corré antes
> `seed-plan.ts` (prompt 09)**. No corras el seed vos.
>
> Tareas: (1) verificá `tsc -b` y consistencia con `Ejercicio` (usa el campo opcional
> `consejosSeguridad`), `Rutina`, `Programa` y la unión `Prescripcion` de `src/types/models.ts`.
> (2) Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa: `scripts/seed-rugby-juvenil.ts ✅`).
> (3) `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
>
> Nota: la visibilidad de `PRG-0010` para el miembro `federico` se setea aparte en
> `config/visibilidad` (no en este seed).
