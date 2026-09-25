# ShapeUp — Runbook de seeds

Cómo sembrar Firestore desde cero. **El orden importa**: varios seeds reusan ejercicios o
rutinas creados por otros, así que correrlos desordenados deja referencias colgadas (rutinas que
apuntan a ejercicios que todavía no existen). Corré siempre `--dry-run` primero.

> Los nombres de los scripts los define `package.json`. Para ver la lista real corré `npm run`
> (sin argumentos). Acá se asume el patrón `seed:<nombre>`.

## Requisitos previos
- `scripts/service-account.json` en su lugar (gitignoreado).
- `firebase-admin` y `tsx` en `devDependencies`.
- Para el catálogo FEDB: el importador baja `fedb/exercises.json` solo.
- Mails reales en `scripts/data/familia.local.json` (a partir del prompt 20; antes estaban en `seed-config.ts`).

## Orden de corrida

| # | Comando | Crea | Depende de | Prompt |
|---|---|---|---|---|
| 1 | `seed:config` | `config/familia`, `metodologia`, `diccionarios` | — | base |
| 2 | `seed:perfiles` | `config/perfiles` (equipo, objetivos, zonas FC) | — | 15 |
| 3 | `import:fedb` | `catalogo-ejercicios.json` (baja el dataset) | — | E2 |
| 4 | `seed:ejercicios` | `/ejercicios` `EJ-0001+` (873 FEDB) | `import:fedb` | E2 |
| 5 | `seed:vr` | `EJ-9001..9010` (juegos VR) | — | 07 |
| 6 | `seed:plan` | `EJ-8001..8018` + `RUT-0001..0008` + `PRG-0001..0005` | — | 09 |
| 7 | `seed:planes-extra` | `EJ-8019..8027` + `RUT-0009..0016` + `PRG-0006..0009` | `seed:plan`, `seed:vr` | 10 |
| 8 | `seed:rugby-juvenil` | `EJ-8028/8029` + `RUT-0017/0018` + `PRG-0010` | `seed:plan` | 11 |
| 9 | `seed:futbol-juvenil` | `EJ-8030..8032` + `RUT-0019/0020` + `PRG-0011` | `seed:plan`, `seed:rugby-juvenil` | 12 |
| 10 | `seed:maria` | `EJ-8033/8034` + `RUT-0021/0022` + `PRG-0012` | `seed:plan`, `seed:vr`, `seed:futbol-juvenil` | 13 |
| 11 | `seed:visibilidad` | `config/visibilidad` | `seed:maria` (ref `PRG-0012`) | 14 |
| 12 | `seed:salud-rutinas` | `RUT-0023..0025` (Cardio Z2, HIIT corto, Descarga activa) | `seed:plan`, `seed:planes-extra` (reutiliza EJ-8023..8027) | 50 |

## Pasada de prueba (no escribe nada)

El `--` hace que npm pase el flag al script.

```bash
npm run seed:config        -- --dry-run
npm run seed:perfiles      -- --dry-run
npm run import:fedb
npm run seed:ejercicios    -- --dry-run
npm run seed:vr            -- --dry-run
npm run seed:plan          -- --dry-run
npm run seed:planes-extra  -- --dry-run
npm run seed:rugby-juvenil -- --dry-run
npm run seed:futbol-juvenil -- --dry-run
npm run seed:maria         -- --dry-run
npm run seed:visibilidad   -- --dry-run
npm run seed:salud-rutinas -- --dry-run
```

## Pasada real

```bash
npm run seed:config
npm run seed:perfiles
npm run import:fedb
npm run seed:ejercicios    -- --aplicar   # P87: simula por defecto
npm run seed:vr            -- --aplicar   # P87: simula por defecto
npm run seed:plan
npm run seed:planes-extra
npm run seed:rugby-juvenil
npm run seed:futbol-juvenil
npm run seed:maria
npm run seed:visibilidad
npm run seed:salud-rutinas -- --aplicar   # P87: simula por defecto
```

## Notas
- **P87:** `seed:ejercicios`, `seed:vr` y `seed:salud-rutinas` corren con `scripts/lib/corrida.ts`:
  **simulan por defecto** (su `--dry-run` ya no hace falta), escriben con `--aplicar`, y con
  `--force` escriben antes un respaldo de lo que pisan. Terminan con
  `escritas · fallidas · omitidas` (o `se escribirían` en simulación). Los demás seeds siguen
  como estaban hasta que se migren.
- **`SKIP`** en la salida = el documento ya existía; el seed no lo pisa. Para sobreescribir uno
  puntual: `npm run seed:<nombre> -- --force`.
- **`seed:plan` va antes que todo lo de miembros**: crea los `EJ-80xx` y las rutinas de VR
  (`RUT-0004`, `RUT-0008`) que rugby/fútbol/maría reusan.
- **`seed:maria` necesita `seed:futbol-juvenil`**: María usa `EJ-8030` (caminata lateral con
  banda), que lo crea el seed de Sofía.
- **`seed:visibilidad` va al final**: referencia `PRG-0010/0011/0012`. Si lo corrés antes de
  sembrar esos programas, los miembros no verán nada hasta que existan (no rompe, pero queda vacío).

## Verificación post-seed
Entrá como cada miembro y confirmá que ve **su** programa con los ejercicios cargados
(nombre + instrucciones). Si un ejercicio aparece vacío, falta el seed que lo crea (revisá el orden).

---

## Mantenimiento: `limpiar:salud`

Depura el módulo de salud (/mediciones, /cardio, /sueno, /metricas-salud) sin tocar ningún dato de la app (/historial, /sesiones, /rutinas, /programas, /ejercicios, /config).

```bash
# Dry-run (solo cuenta, no borra):
npm run limpiar:salud -- --miembro=juanpablo

# Borrar datos importados de un miembro:
npm run limpiar:salud -- --miembro=juanpablo --confirmar

# También borrar los cargados a mano:
npm run limpiar:salud -- --miembro=juanpablo --confirmar --incluir-manual

# Solo cardio y sueño:
npm run limpiar:salud -- --miembro=juanpablo --confirmar --colecciones=cardio,sueno

# Además limpiar biometría del historial (para re-probar el match de S1):
npm run limpiar:salud -- --miembro=juanpablo --confirmar --limpiar-biometria

# Todos los miembros de una vez:
npm run limpiar:salud -- --todos --confirmar
```

**Flags:**
- `--miembro=<id>` — Obligatorio (o `--todos`). IDs válidos: juanpablo, maria, sofia, federico.
- `--confirmar` — Sin este flag es dry-run: muestra conteos pero no escribe.
- `--incluir-manual` — También borra `fuente=="manual"`. Default: solo `"samsung-health-csv"`.
- `--colecciones=a,b` — Subconjunto de colecciones. Default: las 4.
- `--limpiar-biometria` — En `/historial`: elimina el campo `biometria` y los campos `fcPico`, `fcFinSerie`, `recuperacionBpm` de cada serie. **No toca** `inicioMs`/`finMs` ni ningún otro campo del Historial.

**Flujo de prueba de S1:**
1. `npm run limpiar:salud -- --miembro=juanpablo --confirmar [--limpiar-biometria]`
2. Importar el ZIP real nivel biométrico desde la UI.
3. Validar el resumen de matcheo ("X matcheadas, Y por custom-id, Z por ventana").

---

## Mantenimiento: `rematch:salud`

Re-corre el match biométrico **sin volver a subir el ZIP**, usando `inicioMs`/`finMs` que ya están persistidos en `/cardio` (S-audit-b, P54). Sirve para diagnosticar o reparar historiales que no matchearon durante el import (auditoría S-fix, P55). Sin curvas de FC (no se persisten): la biometría siempre sale con `granularidad: "sesion"`.

```bash
# Dry-run: imprime el diagnóstico por Historial (matcheó/no, por qué nivel, Δinicio)
npm run rematch:salud -- --miembro=juanpablo

# Persiste el match con enriquecerHistorial
npm run rematch:salud -- --miembro=juanpablo --confirmar
```

**Flags:**
- `--miembro=<id>` — Obligatorio. IDs válidos: juanpablo, maria, sofia, federico.
- `--confirmar` — Sin este flag es dry-run: solo imprime el diagnóstico, no escribe.

## Scripts borrados (P87, 25/09/2026)

Se borraron en el commit **«Herramientas — P84 y P87»** (el que sigue a «App — P85 y P86»).
El último commit que los tiene sin tocar es **`d99623e`**. Para recuperarlos:

```bash
git show d99623e:scripts/auditoria-features.ts      > scripts/auditoria-features.ts
git show d99623e:scripts/borrar-rut-0006.ts         > scripts/borrar-rut-0006.ts
git show d99623e:scripts/migrar-equipo-por-lugar.ts > scripts/migrar-equipo-por-lugar.ts
# o, para ver en qué commit se borró cada uno:
git log --diff-filter=D --oneline -- scripts/auditoria-features.ts
```

| Script | Por qué se borró |
|---|---|
| `auditoria-features.ts` | Auditaba feature por feature las series S e I (cerradas en julio) para contestar una pregunta de P62 que hoy se contesta con la app. No compilaba: importaba `filtrarCardioRelevante`, que ya no existe. Era también el alias `auditoria:features`, que se sacó. |
| `borrar-rut-0006.ts` | Script de una vez, ya corrido: borró `RUT-0006`. |
| `migrar-equipo-por-lugar.ts` | Migró `/config/perfiles` de `equipoDisponible` a `equipoPorLugar` (P72). Ya no hace falta: `seed-perfiles` siembra `equipoPorLugar` directamente, y la app migra en lectura cualquier perfil viejo (`lib/perfil.migrarEquipoPorLugar`). |
