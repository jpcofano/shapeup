# Prompt 12 — Seed · Programa juvenil de fútbol (prevención)

> Sumá al repo `scripts/seed-futbol-juvenil.ts` (te lo paso aparte; va en `scripts/`). Es
> **aditivo**. Agrega 3 ejercicios (`EJ-8030` caminata lateral con banda, `EJ-8031` salto con
> aterrizaje controlado, `EJ-8032` RDL a una pierna), 2 rutinas (`RUT-0019`/`RUT-0020`) y 1
> programa (`PRG-0011`: complemento de fútbol para una jugadora de 17, 2 días, foco prevención
> de lesiones —rodilla/ligamento, isquios, ingle— + movilidad, cargas submáximas). Mismo patrón
> idempotente (`--dry-run`/`--force`, `firebase-admin` con `scripts/service-account.json`).
> Reusa `EJ-80xx` y `EJ-8028`/`EJ-8029`, así que **corré antes `seed-plan.ts` (09) y
> `seed-rugby-juvenil.ts` (11)**. No corras el seed vos.
>
> Tareas: (1) `tsc -b` y consistencia con `Ejercicio` (campo opcional `consejosSeguridad`),
> `Rutina`, `Programa` y la unión `Prescripcion` de `src/types/models.ts`. (2) Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa: `scripts/seed-futbol-juvenil.ts ✅`).
> (3) `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
>
> Nota: la visibilidad de `PRG-0011` para el miembro `sofia` se setea aparte en
> `config/visibilidad`.
