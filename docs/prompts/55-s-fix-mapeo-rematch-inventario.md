# Prompt 55 — S-fix · Mapeo de actividades, re-match sin ZIP, inventario e higiene

> **Código + tests.** Origen: auditoría real del owner (P53, 2026-07-08). Hallazgos:
> (1) 1969/1975 cardio etiquetados "HIIT" que son caminatas auto-detectadas de
> 2016–2024 (muestras: 1 min/0.03 km, 11 min/0.8 km) → bug de `resolverActividad`,
> que en cascada anuló el filtro selectivo ("HIIT" está en la allowlist);
> (2) las 2 sesiones con ShapeUp del mismo día NO matchearon → el enriquecimiento
> no corrió o falló en silencio en el import nuevo;
> (3) las 13 métricas genéricas en CERO días → parsers no detectan los archivos
> del export (o no vienen);
> (4) "noches con dato en últimos 30 días: 0/30" contradice los datos de julio.
> Castellano voseo. **Auditá el código real de cada punto antes de tocarlo.**
>
> **Decisiones del owner (no re-discutir):**
> - El match debe poder correrse **sin el ZIP**, contra `/cardio` persistido.
> - El resultado del enriquecimiento es SIEMPRE visible, incluido el error.
> - Ningún dato mal etiquetado se "acomoda" con reglas aguas abajo: se corrige el
>   mapeo en el origen.

## (1) Mapeo de actividades (raíz del problema del filtro)

- Investigá en `samsungHealth.ts` por qué las caminatas auto-detectadas salen "HIIT".
  Contrastá con la tabla de `exercise_type` de `docs/SAMSUNG-HEALTH-MAPEO.md` y con
  los códigos estándar de Samsung (1001 caminata, 1002 correr, 11007 ciclismo,
  13001 senderismo, etc. — verificá contra el mapeo documentado, no de memoria).
  Reportá en el commit cuál era el bug (¿default equivocado? ¿columna corrida?
  ¿tabla incompleta?).
- Mapeá al menos los tipos que existen en los datos del owner (el bug afecta 1969
  filas: los códigos reales van a aparecer enseguida al loguear los no mapeados).
  No mapeado → "Otro (N)" como quedó en P51, jamás un nombre de otra actividad.
- Revisá `ACTIVIDADES_SIEMPRE_RELEVANTES` tras el fix: "HIIT" puede quedarse SOLO
  si el mapeo corregido garantiza que HIIT significa HIIT. Sumá una guarda extra a
  la regla "actividad": duración ≥ 10 min (una caminata de 1 min jamás es
  entrenamiento, se llame como se llame).
- Test con los datos reales de la auditoría: la fila `{16 min, 1.12 km, tipo
  auto-detectado}` NO debe salir "HIIT" ni pasar el filtro.

## (2) Re-match sin ZIP — `scripts/rematch-salud.ts` + visibilidad en import

- **Script** (patrón limpiar-salud: `--miembro`, dry-run default, `--confirmar`):
  1. Lee `/historial` y `/cardio` del miembro.
  2. Construye `SesionSamsung[]` desde los docs de cardio que tienen `inicioMs`:
     `datauuid` = uuid del `idCardio` (`CAR-{uuid}`), `startMs/endMs` =
     `inicioMs/finMs`, `fcMedia/fcMax/kcal` de los campos. Para el pool por
     custom-id: los docs con `actividad === "ShapeUp"` reciben un `customId`
     sintético `"__shapeup__"` y se pasa `shapeUpCustomIds = ["__shapeup__"]` —
     así reusa `calcularEnriquecimiento` **sin tocarlo**.
  3. Sin curvas (no están persistidas): la biometría sale con
     `granularidad: "sesion"`. Correcto y suficiente para validar el match hoy.
  4. Dry-run imprime el resultado por Historial (matcheó/no, por qué nivel,
     Δinicio en min); `--confirmar` persiste con `enriquecerHistorial`.
- **Import**: auditá por qué el enriquecimiento no corrió/falló en el flujo del
  botón único (P52). Arreglá la causa y hacé el resultado inescapable: el resumen
  post-import SIEMPRE incluye la línea de matcheo — «3 sesiones evaluadas: 2
  enriquecidas (2 por custom-id), 1 sin candidatas» — o el error textual si tiró.
  Nada de advertencias que desaparecen.

## (3) Inventario del ZIP (diagnóstico de las métricas en cero)

- Al procesar un ZIP, generá un inventario: por cada archivo CSV/JSON del export,
  nombre → parser que lo tomó ("cardio", "sueño", "métricas: pasos", …) o
  **"sin parser"**. Mostralo plegado en el preview («Ver detalle del archivo»,
  lista simple) y agregalo a la auditoría (nueva sección G si el ZIP se pasa por
  parámetro `--zip=<ruta>`; opcional, no bloqueante).
- Con eso el owner nos dice qué archivos de métricas trae su export realmente
  (pedometer, heart_rate, stress, oxygen_saturation…) y la próxima ronda agrega
  los parsers que falten — **no agregues parsers a ciegas en este prompt**.

## (4) Bug "0/30 noches en últimos 30 días"

En la auditoría o en `consolidarNoches` (auditá cuál): la comparación de la ventana
de 30 días falla con datos de julio presentes (promedios 7/28 noches salen bien, la
ventana no). Probable comparación de fechas string vs Date o el corrimiento de
noche (+1 día). Fix + test con el caso exacto: noches del 2026-07-01..05, hoy
2026-07-08 → 5/30, no 0/30.

## (5) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde.
- Flujo del owner tras deploy: `limpiar:salud --confirmar` → re-import (el preview
  debe mostrar DECENAS de relevantes, no ~2000, y el inventario de archivos) →
  si el import matcheó, listo; si no, `rematch-salud --confirmar` y verificar
  biometría en las sesiones del 29/06 y 07/07 en la app.
- Re-correr `auditoria:salud` y confirmar: top de actividades sin el falso HIIT
  masivo, vinculadas > 0, sección D con las noches de los últimos 30 días.
- Commit sugerido: `fix(salud): mapeo de actividades, re-match sin ZIP, inventario de export (S-fix)`.
