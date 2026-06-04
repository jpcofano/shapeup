# Prompt 7 — Seed · Juegos de VR (catálogo)

> Sumá al repo el script `scripts/seed-vr.ts` (te lo paso aparte; dejalo en `scripts/`).
> Siembra 10 juegos de VR de PSVR2 como ejercicios de catálogo (`modalidad: "Cardio"`,
> `equipo: ["VR"]`, `patron: "Locomoción / cardio"`), con IDs reservados `EJ-9001`–`EJ-9010`
> para no colisionar con el importador FEDB (que arranca en `EJ-0001`). Es idempotente y sigue
> el mismo patrón que `seed-config.ts` / `seed-ejercicios.ts`: flags `--dry-run` y `--force`,
> usa `firebase-admin` con `scripts/service-account.json`.
>
> Verificá que tipa con `tsc -b` y que es consistente con la interfaz `Ejercicio` de
> `src/types/models.ts`. **Ojo:** el script agrega un campo extra `poseidoPorOwner` que NO está
> en el modelo; el seed corre con `tsx` (no entra al build de `src/`), así que no rompe el
> type-check del proyecto, pero registrá la decisión en el ADR. No corras el seed vos; lo corre
> el usuario con las credenciales.
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora con la entrada del seed de VR,
> Mapa del código: `scripts/seed-vr.ts ✅`, y ADR con la decisión de `poseidoPorOwner` + IDs
> reservados `EJ-9001+`). Después hacé `git add -A && git commit` con un mensaje claro y
> `git push` a `origin/main`. **Pará y esperá mi revisión.**
