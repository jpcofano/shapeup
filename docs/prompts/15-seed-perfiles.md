# Prompt 15 — Seed · Perfiles por miembro (equipo, objetivos, zonas FC)

> Sumá al repo `scripts/seed-perfiles.ts` (te lo paso aparte; va en `scripts/`). Escribe
> `/config/perfiles` (forma `PerfilesConfig` / `PerfilMiembro` de `src/types/models.ts`): por
> cada miembro, `color`, `equipoDisponible`, `objetivos`, `lugarHabitual`, `fcMaxTeorica` y
> `zonasFC` (Z1–Z5). Las zonas se calculan con FCmáx ≈ 220 − edad (juanpablo 51, maria 50,
> sofia 17, federico 16). Idempotente (`--dry-run`/`--force`; sin `--force` no pisa si existe).
>
> Tareas: (1) `tsc -b` y consistencia con `PerfilMiembro` (`zonasFC` es
> `Partial<Record<ZonaFC, {min,max}>>`, valores de `equipoDisponible` y `objetivos` deben
> existir en los enums `EQUIPOS` y `OBJETIVOS`). (2) Si más adelante hay UI de perfil, que lea
> de acá los colores y zonas; los colores son placeholders que Claude Design puede afinar (y
> conviene reflejarlos como tokens `--member-*` en `styles/tokens.css`). (3) Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa: `scripts/seed-perfiles.ts ✅`).
> (4) `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
