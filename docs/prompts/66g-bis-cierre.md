# Prompt P66g-bis — Cierre de P66g

Decisiones cerradas. Si algo es inviable o ambiguo, pará y reportá en vez de reinterpretar.

Restricciones:

- Solo `docs/`. No toques `src/` ni `scripts/`.
- No toques `docs/prompts/`, salvo guardar este mismo archivo ahí si todavía no está.
- No commitees.

## Contexto

P66g quedó aplicado y dejó dos cabos sueltos:

1. §16.13 (discrepancias de P66f) todavía dice que `deviceId` o el log vacío separan las sesiones
   autodetectadas, lo que contradice el ADR #035 corregido.
2. Los hitos del puente se llaman M1–M4, lo que choca con el backlog de MAPEO
   ("M1. Exportar el historial", "M2. Compartir", `MAPEO-IMPLEMENTACION.md:2011`). Además, M3 no
   está definido en ningún doc.

---

## 1. §16.13

Corregí toda afirmación de que `deviceId` o el log vacío separan autodetectadas. Reemplazala por
una remisión al ADR #035:

> El criterio es la densidad del ADR #034 (0,1/s). `deviceId` `DQLXfARDMe` es el teléfono, que
> también escribe la sesión de ShapeUp y los registros de Health Sync, así que no separa nada.
> Las autodetectadas del teléfono no tienen el log vacío: tienen 12 y 13 entradas.

---

## 2. Hitos del puente: renombrar a PU1–PU4

1. Antes de editar, buscá `PU1`, `PU2`, `PU3` y `PU4` en todo el repo. Si alguno ya existe, pará
   y reportá.
2. Si no existen, agregá en §15.8 la definición de los hitos del puente:

   | Hito | Qué es | Estado |
   |---|---|---|
   | **PU1** | Leer por SDK y volcar a JSON | Hecho y verificado |
   | **PU2** | El JSON viaja solo a Firebase | Siguiente |
   | **PU3** | Lectura incremental y corrida periódica en background | Pendiente |
   | **PU4** | Adaptador TypeScript, en este repo | Pendiente, depende de P75 |

3. Reemplazá toda mención a M1–M4 que se refiera al puente por PU1–PU4. Como mínimo:
   - el título de la subsección "M1 del puente: lectura verificada";
   - el "en M3…" del párrafo de fricción operativa.
4. No toques el M1/M2 del backlog de MAPEO.

---

## Al terminar

Mostrame:

1. El diff por archivo.
2. El grep de `M1`, `M2`, `M3` y `M4` en `docs/` fuera de `docs/prompts/`, para confirmar que lo
   que queda pertenece al backlog.
3. Cualquier punto donde hayas parado en vez de aplicar.
