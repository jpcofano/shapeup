# Prompt 48 — S1-prep · Script `limpiar-salud.ts` (depurar y empezar de cero)

> **Solo script de mantenimiento** (no toca la app ni sus tests). Independiente de los
> prompts 46/47: se puede aplicar antes o después, pero el owner lo va a **correr antes**
> de probar S1, para que el primer import con match arranque sobre colecciones limpias.
> Origen: decisión del owner (2026-07-04). Seguí el patrón de los seeds existentes
> (`scripts/seed-config.ts`): firebase-admin + `service-account.json`, tsx, flags,
> mensajes en castellano.
>
> **Decisiones del owner (no re-discutir):**
> - Se depura **solo el módulo de salud**: `/mediciones`, `/cardio`, `/sueno`,
>   `/metricas-salud`. **NUNCA** toca `/historial`, `/sesiones`, `/rutinas`,
>   `/programas`, `/ejercicios` ni `/config` — eso es la app, no el import.
> - Destructivo ⇒ **seguro por defecto**: sin `--confirmar` el script es un dry-run
>   que solo cuenta y lista; no existe modo "borrar sin mostrar antes".
> - Por defecto borra solo lo importado (`fuente == "samsung-health-csv"`); lo cargado
>   a mano (`fuente == "manual"`) se conserva salvo flag explícito.

## (1) `scripts/limpiar-salud.ts`

Uso:

```
npx tsx scripts/limpiar-salud.ts --miembro=juanpablo            # dry-run (default)
npx tsx scripts/limpiar-salud.ts --miembro=juanpablo --confirmar
```

Flags:
- `--miembro=<id>` — **obligatorio**, salvo `--todos` (explícito para limpiar los 4).
  Validá contra los miembros conocidos; id inválido → error claro y exit 1.
- `--confirmar` — sin él, dry-run: muestra el resumen y termina sin escribir.
- `--incluir-manual` — borra también `fuente == "manual"`. Default: solo
  `"samsung-health-csv"`. (Los docs de `/sueno` y `/metricas-salud` importados también
  tienen `fuente`; aplicá el mismo filtro en las cuatro colecciones.)
- `--colecciones=cardio,sueno` — opcional, subconjunto; default las cuatro.
- `--limpiar-biometria` — además, en `/historial` del miembro: elimina el campo
  `biometria` (`FieldValue.delete()`) y, dentro de `bloques[].series[]`, los campos de
  enriquecimiento `fcPico`, `fcFinSerie`, `recuperacionBpm` (reescribiendo el array
  `bloques` sin esos campos). **No toca** `inicioMs`/`finMs` ni ningún otro campo del
  Historial: eso es dato de la app, no del import. Útil para re-probar el match del
  P46 desde cero.

Comportamiento:
- Query por colección: `where("miembro", "==", id)` + filtro de fuente en memoria
  (evitás índices compuestos nuevos en Spark).
- Borrado en **batches de ≤500** (`db.batch()`), con progreso por consola.
- Resumen final por colección, estilo seeds:

```
── limpiar-salud · miembro: juanpablo · fuente: samsung-health-csv ──
/mediciones      142 a borrar
/cardio           87 a borrar
/sueno            365 a borrar
/metricas-salud  1204 a borrar
/historial        —  (sin --limpiar-biometria)
DRY-RUN: no se borró nada. Repetí con --confirmar para ejecutar.
```

- Con `--confirmar`, mismo resumen pero con "borrados" y total final. Errores por
  batch no abortan el resto: se acumulan y se reportan al final (exit 1 si hubo alguno).

## (2) Registro

- Alias en `package.json`: `"limpiar:salud": "npx tsx scripts/limpiar-salud.ts"`.
- Entrada corta en `docs/SEEDS.md` (sección de mantenimiento): qué hace, flags, y la
  advertencia de que no toca datos de la app.
- Una línea en `CLAUDE.md` bajo la serie S: el flujo de prueba de S1 es
  `limpiar:salud --confirmar` → importar el ZIP real nivel biométrico → validar el
  resumen de matcheo.

## (3) Verificación

- `npx tsc -b` limpio (el script debe tipar; si los scripts están fuera del build de
  `tsc -b`, al menos `npx tsx --check` o una corrida `--dry-run` sin credenciales debe
  fallar con el mensaje claro de `service-account.json`, no con un stack trace).
- Probá el dry-run contra Firestore real con un miembro y verificá que los conteos
  coincidan con lo esperado antes de documentarlo como listo.
- Commit sugerido: `chore(scripts): limpiar-salud.ts para depurar el módulo de salud (S1-prep)`.
