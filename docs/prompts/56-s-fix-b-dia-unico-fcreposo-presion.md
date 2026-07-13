# Prompt 56 — S-fix-b · Regla "día único", fc-reposo real, señales presión/SpO2

> **Código + tests.** Origen: segunda auditoría real (2026-07-08, datos ya limpios).
> Hallazgos: (1) la sesión del 07/07 no puede matchear — se registró con la PWA
> vieja (0 series con timestamps), su ventana es sintética y Δinicio=34 min supera
> el techo; (2) `/metricas-salud` tiene 1310 días de "fc-reposo" con valores 120+
> bpm → es el agregado diario del tracker general de FC mal etiquetado como reposo;
> (3) presión arterial (154 días, baseline OK) y SpO2 (552 días) tienen sustento
> real y no se muestran en ningún lado. Castellano voseo. Auditá el código real
> antes de cada cambio.
>
> **Decisiones del owner (no re-discutir):**
> - Ventana sintética + **exactamente un** ShapeUp ese día = match por día. Con dos
>   o más candidatas ShapeUp el mismo día → ambigua, no adivinar.
> - `fc-reposo` queda reservado a una fuente real de FC en reposo. El agregado
>   diario general NO es reposo y no alimenta esa señal.
> - Presión y SpO2 entran al Resumen **sin semáforo** (como el peso): valor +
>   tendencia. La app no diagnostica; si hay valores llamativos, el texto invita a
>   consultarlo con un médico, nunca alarma con colores.

## (1) Regla "día único" en el match

- `ventanaDeHistorial` pasa a devolver también `sintetica: boolean` (true cuando la
  ventana salió del fallback por fecha, no de timestamps reales de series/sesión).
- En `elegirSesionSamsung`: si la ventana es sintética y el pool por custom-id tiene
  **exactamente una** candidata en la fecha de la sesión → match con
  `matchPor: "dia"` (sumalo a la unión del modelo y a lo que muestra
  `HistorialDetalle`: «por día (único ShapeUp)»). Dos o más candidatas ese día →
  `"ambiguo"`. Con ventana real, nada cambia (rigen Δinicio y sus techos).
- `rematch-salud.ts` y el import lo aprovechan sin cambios (pasa por
  `calcularEnriquecimiento`). El dry-run del rematch debe mostrar el motivo "dia"
  en el diagnóstico.
- Tests: ventana sintética + 1 ShapeUp → "dia"; + 2 ShapeUp → ambiguo; ventana real
  + Δinicio 34 min → sigue sin matchear por custom-id (la regla no afloja los
  techos de ventanas reales).

## (2) fc-reposo: re-mapeo del tracker general

- Auditá en `samsungHealth.ts`/detección de métricas qué archivo está alimentando
  `fc-reposo` (por los datos: el agregado diario de `tracker.heart_rate`, promedio
  de TODAS las muestras del día). Re-mapealo a un tipo nuevo `"fc-media-dia"`
  (sumalo a `TIPOS_METRICA`).
- `fc-reposo` queda reservado: solo se puebla si el export trae una fuente real de
  reposo (`resting_heart_rate` o equivalente — verificá contra el inventario del
  ZIP y SAMSUNG-HEALTH-MAPEO; si el export del owner no la trae, la señal queda
  honestamente en sin-datos).
- La señal `fc-reposo` en `resumenSalud`: cuando está `sin-datos`, NO mostrar
  `valorActual` (la auditoría mostró "123 bpm" junto a sin-datos — confuso y en
  este caso además falso). Card ausente o explícitamente vacía, no un número
  huérfano.
- Datos ya persistidos mal etiquetados: documentá en el reporte del prompt que el
  owner corre `limpiar:salud --colecciones=metricas-salud --confirmar` + re-import
  (sin tocar cardio/sueño ya limpios). Verificá que el flag de colecciones exista
  y funcione así; si no, arreglalo.
- `fc-media-dia` no alimenta ninguna señal por ahora (dato de contexto, no de
  decisión) — puede mostrarse en Progreso si ya hay un lugar natural, sin forzarlo.

## (3) Señales informativas: presión arterial y SpO2

En `resumenSalud.ts`, dos señales nuevas estilo "peso" (sin semáforo):
- `presion`: último par sistólica/diastólica (mismo día), `valorActual` compuesto
  («113/78»), tendencia de la sistólica vs baseline. Solo se lista si hay dato en
  los últimos 60 días (el owner se la mide por rachas; no mostrar un valor de hace
  un año como actual).
- `spo2`: último valor + tendencia. Misma regla de recencia.
- En ambas, si el último valor está fuera de rangos publicados de referencia
  (definí constantes con fuente en comentario), el `motivo` dice «valor fuera del
  rango típico — vale la pena comentarlo con tu médico» — texto, sin color.
- `ResumenTab` las renderiza con el mismo componente de card; orden: las señales
  accionables primero, las informativas (peso/presión/spo2) al final.
- Tests: recencia de 60 días; par sistólica/diastólica del mismo día (no mezclar
  fechas); rango de referencia dispara el motivo sin cambiar `estado`.

## (4) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde.
- Flujo owner: deploy → `rematch:salud` dry-run (debe proponer 29/06 por
  custom-id/inicio y 07/07 por "dia") → `--confirmar` → biometría visible en ambas
  sesiones y 2/6 vinculadas en Cardio. Después
  `limpiar:salud --colecciones=metricas-salud --confirmar` + re-import → señal
  fc-reposo honesta y cards de presión/SpO2 en Resumen.
- Re-correr auditoría: sección C con `fc-media-dia` poblado y `fc-reposo` en cero
  (o con fuente real), sección F con las señales nuevas.
- Commit sugerido: `fix(salud): match por día único, fc-reposo real, señales presión/SpO2 (S-fix-b)`.
