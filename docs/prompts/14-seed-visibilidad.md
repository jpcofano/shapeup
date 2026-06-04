# Prompt 14 — Seed · Visibilidad por miembro

> Sumá al repo `scripts/seed-visibilidad.ts` (te lo paso aparte; va en `scripts/`). Escribe
> `/config/visibilidad` (forma `VisibilidadConfig` de `src/types/models.ts`): cada miembro ve
> solo su programa y las rutinas que usa; el owner (`juanpablo`) ve todo por las reglas de
> Firestore (no se lista). Reparto: `maria`→PRG-0012, `federico`→PRG-0010, `sofia`→PRG-0011.
> Idempotente (`--dry-run`/`--force`; sin `--force` no pisa si ya existe). Depende de que estén
> sembrados esos programas/rutinas (prompts 09–13).
>
> Tareas: (1) `tsc -b` y consistencia con `VisibilidadConfig`/`VisibilidadMiembro` de
> `src/types/models.ts`. (2) Verificá que `data/visibilidad.ts` (E5) lea este doc y que el owner
> efectivamente vea todo aunque no figure listado. (3) Actualizá `docs/MAPEO-IMPLEMENTACION.md`
> (Bitácora + Mapa: `scripts/seed-visibilidad.ts ✅`). (4) `git add -A && git commit` + `git push`.
> **Pará y esperá mi revisión.**
