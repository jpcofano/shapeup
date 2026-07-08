# Prompt 51 — S2b · Fixes de la prueba real: "Tipo 0", nivel de import, Cardio legible

> **Código + tests.** Origen: primera prueba en producción del owner (2026-07-05,
> capturas). Hallazgos: (1) importó el ZIP con el selector de nivel en "Básico" y el
> match nunca corrió — el default invita al error; (2) sus sesiones ShapeUp aparecen
> como **"Tipo 0"** en Cardio (exercise_type 0 = custom en Samsung y `resolverActividad`
> no lo mapea) — lo más importante se ve como lo más críptico; (3) la tab Cardio es
> ilegible: 1974 filas planas, "FC ~133.65286", chips de zonas que las filas no usan.
> Castellano voseo, tokens siempre.
>
> **Decisiones del owner (no re-discutir):**
> - Si el archivo es un **ZIP**, el nivel de import default es el **biométrico**.
>   El selector queda visible por si quiere bajar de nivel, pero el camino feliz
>   no requiere tocarlo.
> - Las sesiones custom del owner se muestran como **"ShapeUp"**, no "Tipo 0".
> - Cardio deja de ser un volcado: agrupada, redondeada y con las vinculadas primero.

## (1) Nombre de las sesiones custom (el fix más importante)

En `resolverActividad` (o donde se resuelva el nombre en `samsungHealth.ts`):
- `exercise_type === 0` (custom): si la fila trae `custom_id` y está en
  `shapeUpCustomIds` → actividad **"ShapeUp"**. Si trae `custom_id` pero no es
  ShapeUp, buscá el nombre en el índice de `custom_exercise` del ZIP (pasalo como
  parámetro opcional; en CSV suelto no hay índice) → usá ese nombre. Sin nada →
  **"Personalizado"**, nunca "Tipo N".
- Ya que estás: cualquier `exercise_type` no mapeado sale "Otro (N)" en vez de
  "Tipo N", y revisá contra la tabla de SAMSUNG-HEALTH-MAPEO si falta algún código
  frecuente del owner (HIIT ya resuelve bien, se ve en sus datos).
- **Dato migratorio**: el owner ya tiene sesiones persistidas como "Tipo 0". Sumá al
  final de `limpiar-salud.ts` un flag `--renombrar-tipo0` que las re-etiquete en
  `/cardio` usando la misma lógica (o documentá que un re-import limpio las corrige,
  si eso es cierto con la idempotencia por `_uuid` — verificalo: si el upsert
  idempotente NO pisa el campo `actividad`, el flag es necesario).

## (2) Nivel de import: default inteligente

En el flujo de import de `/salud` (`ImportPanel`):
- Al seleccionar/soltar un **ZIP**: si el selector está en un nivel menor, pasalo a
  biométrico automáticamente (el usuario puede volver a bajarlo). CSV suelto: sin
  cambio de comportamiento.
- En el preview del ZIP mostrá el nivel activo en texto («Nivel: biométrico — se
  matchean tus entrenamientos») para que el estado sea visible antes de confirmar.
- Si el ZIP se importa en un nivel NO biométrico, agregá al mensaje de resultado:
  «Ojo: sin nivel biométrico no se matchean tus entrenamientos».

## (3) Cardio legible

En `CardioTab`:
- **Redondeo en TODA la tab**: FC sin decimales (`Math.round`), kcal sin decimales,
  duración en minutos enteros. Aplicalo también en `HistorialDetalle` (biometría) y
  en cualquier otro lugar que muestre estos valores — grep de los formatos.
- **Zona con color por fila**: el chip de zona (Z1–Z5) que ya existe como leyenda,
  aplicado a cada sesión según `zonaPrincipal` (o derivada de FC media vs `zonasFC`
  del perfil si el campo no está). Sin zona derivable → sin chip.
- **Agrupar por mes** (encabezado "Julio 2026", etc.), vinculadas a entrenamiento
  primero dentro del mes, con su badge. Mostrar por defecto los **últimos 3 meses**
  con botón «Ver más» que agrega de a 3 meses — con ~2000 sesiones el render plano
  también es un problema de performance; no renderices todo el array de una.
- El contador del título («SESIONES (1974)») queda, pero agregá al lado cuántas están
  vinculadas: «SESIONES (1974 · 12 vinculadas)».

## (4) Versión visible (diagnóstico de PWA vieja)

La prueba del owner pudo haber corrido sobre un bundle viejo cacheado por el service
worker. Para que eso sea diagnosticable en 5 segundos:
- Exponé la versión del build (por ej. `__APP_VERSION__` vía `define` en
  `vite.config.ts` con `package.json version` + fecha del build) y mostrala chiquita
  al pie de **Perfil**.
- Subí `version` en `package.json` en este commit (y de acá en más en cada deploy).
- Si `vite-plugin-pwa` no está ya en `registerType: "autoUpdate"`, configuralo así
  para que los deploys se tomen sin desinstalar la app.

## (5) Tests

- `resolverActividad`: type 0 + custom_id ShapeUp → "ShapeUp"; type 0 + otro
  custom_id con nombre en índice → ese nombre; type 0 sin nada → "Personalizado";
  type desconocido → "Otro (N)".
- Agrupación por mes: orden de meses descendente, vinculadas primero dentro del mes.
- Redondeo: FC 133.65286 → 134; kcal 47.08 → 47.
- Default de nivel: ZIP → biométrico; CSV no cambia el selector.

## (6) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde.
- Deploy y prueba del owner: versión visible en Perfil coincide con la del deploy;
  re-import limpio en biométrico; "ShapeUp" en Cardio donde antes decía "Tipo 0".
- `docs/MAPEO-IMPLEMENTACION.md` actualizado.
- Commit sugerido: `fix(salud): ShapeUp en vez de Tipo 0, nivel biométrico default para ZIP, Cardio legible (S2b)`.
