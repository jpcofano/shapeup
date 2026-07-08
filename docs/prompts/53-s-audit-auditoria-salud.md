# Prompt 53 — S-audit · Auditoría read-only de los datos de salud en Firestore

> **Solo script + reporte** (no toca la app ni sus tests, no escribe NADA en
> Firestore). Origen: decisión del owner (2026-07-06). Objetivo: saber qué hay de
> verdad en la base — cobertura, calidad y resultado del match de las 3 sesiones
> reales — para que el chat de arquitectura diseñe la próxima ronda de insights
> sobre datos reales y no sobre supuestos. La tab Cardio sigue poco clara para el
> owner: la auditoría tiene que dar la materia prima para repensarla.
>
> **Decisiones del owner (no re-discutir):**
> - El script es **read-only** (solo `get`, jamás `set/update/delete`).
> - El reporte contiene datos de salud personales y **el repo es público**: se
>   escribe en `docs/auditorias/` y esa carpeta va al `.gitignore` en este mismo
>   commit. Nunca commitear un reporte.

## (1) `scripts/auditoria-salud.ts`

Patrón de los scripts existentes (firebase-admin, `--miembro=<id>`, default
`juanpablo`). Genera `docs/auditorias/salud-{miembro}-{YYYYMMDD}.md` y lo imprime
también por consola. Secciones del reporte:

### A. Historial y match (lo más importante)
Por cada doc de `/historial` del miembro (son ~3):
- `idHistorial`, `fechaRealizada`, rutina, `duracionRealMin`
- ¿tiene `inicioMs`/`finMs` a nivel sesión? valores en hora local
- ¿cuántas series tienen `inicioMs`/`finMs`? (p.ej. "18/22 series con timestamps")
- `biometria`: ¿existe? → `matchPor`, `granularidad`, `fcMedia`, `fcMax`, `kcal`,
  `zonaPrincipal`, `datauuidSamsung`, `finMsEfectivo` si está
- si tiene granularidad "serie": cuántas series quedaron con `fcPico`/`recuperacionBpm`
- si NO tiene biometría: ¿existía una sesión Samsung candidata ese día? (cruzar
  contra `/cardio` por fecha y mostrar las de ese día con hora de inicio) — esto
  diagnostica por qué no matcheó

### B. Cardio
- total de docs, rango de fechas, ¿cuántos con `_motivo`?/actividad "ShapeUp"
- top 10 actividades por cantidad (con conteo)
- cuántos tienen FC media / kcal / `datauuid`
- cuántos están vinculados (su `datauuid` referenciado por alguna `biometria`)
- distribución por mes de los últimos 6 meses (tabla chica)
- 5 filas de muestra completas (todos los campos) de: 1 ShapeUp, 1 HIIT,
  1 vinculada, 2 al azar — para ver la forma real del dato

### C. Métricas genéricas (`/metricas-salud`)
Tabla por `tipo` (los 13 de `TIPOS_METRICA`): cantidad de días con dato, primera y
última fecha, valor más reciente, y un "¿alcanza para baseline 28d?" (sí/no, ≥ 7
datos en la ventana 8–35). **Esta tabla decide qué señales e insights son viables.**

### D. Sueño
- registros totales vs noches consolidadas (usar `consolidarNoches` real, importándola)
- noches con dato en los últimos 30 días, promedio 7 y 28 noches (`horasTotal`)
- cuántas fechas tienen siestas; máximo de tramos en una fecha

### E. Mediciones corporales
- cantidad, rango de fechas, campos presentes (peso/grasa/músculo/etc. — cuáles
  vienen poblados y cuáles siempre vacíos)

### F. Señales y recomendación de HOY
- correr `calcularResumenSalud` y `calcularRecomendacion` reales con los datos
  leídos e imprimir el resultado (las 5 señales con estado y motivo, y la tarjeta
  que saldría hoy) — validación de punta a punta de S2/S3 con datos reales.

## (2) `.gitignore`

Agregá `docs/auditorias/` en este commit, ANTES de generar el primer reporte.

## (3) Verificación

- `npx tsc -b` limpio (o `tsx --check` si los scripts están fuera del build).
- Correr la auditoría real de `juanpablo` y verificar que el reporte se genera y
  que `git status` NO lo lista.
- Commit sugerido: `chore(scripts): auditoria-salud read-only (S-audit)`.

## (4) Para el owner

Correla y pasale el reporte completo al chat de arquitectura. Con eso se diseña la
próxima ronda: qué insights nuevos tienen sustento en los datos, y el rediseño de
la tab Cardio (que hoy mezcla entrenamientos con actividad diaria y por eso no se
entiende — la sección B va a mostrar exactamente qué mezcla es).
