# Prompt 9 — Seed · Plan real (ejercicios + rutinas + programas)

> Sumá al repo el script `scripts/seed-plan.ts` (te lo paso aparte; va en `scripts/`).
> Siembra, en este orden: (1) 18 ejercicios del plan con técnica curada en castellano,
> IDs reservados `EJ-8001`–`EJ-8018` (separados del FEDB `EJ-0001+` y de los VR `EJ-9001+`);
> (2) 8 rutinas `RUT-0001`–`RUT-0008` (Fuerza A/B/C + 5 de VR); (3) 5 programas
> `PRG-0001`–`PRG-0005` (uno de 5 días "Activo" + 4 plantillas: mínimo viable 3 días, 4 días,
> quema de grasa 6 días, y solo-VR). Es idempotente, mismo patrón que los otros seeds
> (`--dry-run` / `--force`, `firebase-admin` con `scripts/service-account.json`).
>
> Dependencia: las rutinas de VR referencian `EJ-9001+`, así que **corré antes `seed-vr.ts`**
> (prompt 07). No corras el seed vos; lo corre el usuario.
>
> Tareas: (1) verificá que tipa con `tsc -b` y que es consistente con `Rutina`, `Programa`,
> `BloqueEjercicio`, la unión `Prescripcion`, `DiaPrograma` y `Ejercicio` de
> `src/types/models.ts`. (2) Confirmá que `firebase-admin` y `tsx` están en `devDependencies`
> del `package.json` (los seeds los necesitan; si faltan, agregalos). (3) Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa del código: `scripts/seed-plan.ts ✅`, y ADR
> con: rangos de IDs reservados `EJ-8001+`/`EJ-9001+`; `duracionEstimadaMin`/`totalSeries` van
> como estimación del seed y la app los recalcula con `calcularCacheRutina` al editar; y que
> Fuerza C es un circuito round-robin que el motor guiado actual recorre lineal —mejora futura
> del reducer `entrenarState`—). (4) `git add -A && git commit` con mensaje claro y `git push`.
> **Pará y esperá mi revisión.**
