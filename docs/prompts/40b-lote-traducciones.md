# Prompt 40b — Lote de traducciones (REPETIBLE)

> **Mini-prompt repetible.** Requiere el prompt 40 (D14) ya cerrado: validador de ratio en
> `importar-fedb.ts` y reglas de traducción fiel en su §3. Corré este prompt **una vez por
> lote**, cuando el owner lo pida — se puede intercalar entre cualquier otra etapa del mapeo.
> Castellano voseo. **Este prompt NO toca código** — solo `scripts/data/traducciones-fedb.es.json`.
>
> **(1) Estado:** corré `npx tsx scripts/importar-fedb.ts` y anotá los conteos
> (traducidos / pendientes / warnings de ratio).
>
> **(2) Armá el lote (~30 entradas), con esta prioridad:**
> 1. Re-pases: entradas existentes con ratio < 0.7 o menos pasos que el EN (peores primero).
> 2. Nuevos: `beginner` + equipo hogareño (peso corporal, mancuernas, banda, kettlebell).
> 3. Nuevos: resto del set hogareño.
> 4. Después de cubierto el set hogareño: cola de gimnasio (sin apuro).
>
> **(3) Traducí con las reglas fiel del prompt 40 §3:** 1 paso EN = 1 paso ES (sin fusionar);
> "Tip:" → `puntosClave`; "Caution:" → `erroresComunes`; respiración dentro de los pasos;
> voseo directo. En re-pases: conservá `nombre`, `sinonimos`, `patron`, `modalidad`,
> `unilateral` y el curado original de `puntosClave`/`erroresComunes` (sumale lo del EN,
> no lo reemplaces).
>
> **(4) Validá:** re-corré el importador; las entradas del lote pasan el umbral 0.7.
>
> **Entregable:** UN commit con el lote, mensaje tipo
> `trad: lote N (~30) — X re-pases + Y nuevos · traducidos T/873 · warnings W`.
> Actualizá la línea de avance en `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D14, una línea
> por lote). Push. **Pará y esperá — no encadenes otro lote sin que el owner lo pida.**
