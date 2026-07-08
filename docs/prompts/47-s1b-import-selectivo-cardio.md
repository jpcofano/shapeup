# Prompt 47 — S1b · Import selectivo de cardio (ADR #020)

> **Código + tests.** Serie S del `CLAUDE.md`, cierre de S1. **Requiere el prompt 46
> aplicado** (usa `_startMs`/`_endMs` de `parsearEjercicio`, `ventanaDeHistorial` y
> `sesionesSamsung`). Origen: pedido explícito del owner — *"no se trata de importar
> todo, sino de matchear los ejercicios hechos en la app con los datos de salud"* —
> más costo Spark (ADR #016). Hoy `confirmarImport` mete **todo** el cardio del export
> a `/cardio`: años de caminatas y sesiones sueltas que no aportan al análisis.
> Castellano voseo, tokens siempre.
>
> **Decisiones del owner (no re-discutir):**
> - El filtro aplica **solo a cardio** (`/cardio`). Mediciones, sueño y métricas son
>   agregados diarios livianos y se importan como siempre.
> - Por defecto se importa solo lo **relevante**; "Importar todo el cardio" es un
>   toggle opt-in en el preview, no al revés.
> - El filtro es **puro y explicable**: cada sesión sabe por qué quedó
>   (`"historial" | "vr" | "actividad" | "todo"`).

## (1) Núcleo puro — `src/lib/importSelectivo.ts`

```ts
export type MotivoRelevancia = "shapeup" | "historial" | "vr" | "actividad";

export interface FiltroCardio<T> {
  relevantes: (T & { _motivo: MotivoRelevancia })[];
  descartadas: T[];
}

export function filtrarCardioRelevante<T extends CardioInput &
  { _startMs?: number; _endMs?: number; _customId?: string }>(
  cardio: T[],
  historial: Historial[],
  shapeUpCustomIds: string[],
): FiltroCardio<T>
```

Una sesión de cardio es **relevante** si cumple al menos uno, evaluado en este orden
(el primero que aplica define `_motivo`):

1. **`"shapeup"`** — `_customId` incluido en `shapeUpCustomIds` (lista no vacía).
   El owner etiqueta sus sesiones como ejercicio custom "ShapeUp" en el reloj; una
   sesión así marcada es entrenamiento propio **por definición** y se importa siempre,
   tenga o no Historial que la respalde (p.ej. registró solo en el reloj). Ojo: el
   `title` de las sesiones custom viene vacío (ver SAMSUNG-HEALTH-MAPEO §custom_id),
   así que sin esta regla las salvaría únicamente el solape con historial.
2. **`"historial"`** — su ventana `[_startMs, _endMs]` solapa (±5 min, misma
   `TOLERANCIA_MS` que el match — importala de `matchBiometrico`, no la dupliques) con
   la ventana de algún `Historial` del miembro (`ventanaDeHistorial`, del prompt 46).
   Si la sesión no trae `_startMs/_endMs`, caé a comparar `fecha` contra
   `fechaRealizada` (mismo día cuenta como solape).
3. **`"vr"`** — `esVR === true` (las sesiones VR son entrenamiento de la familia
   aunque no pasen por el ciclo guiado).
4. **`"actividad"`** — `actividad` figura en `ACTIVIDADES_SIEMPRE_RELEVANTES`,
   constante exportada y editable. Arrancá con:
   `["Body Combat", "Aeróbic", "HIIT", "Entrenamiento en circuito", "Entrenamiento de fuerza"]`
   (revisá `resolverActividad` en `samsungHealth.ts` y usá los nombres exactos que
   produce; si alguno no existe ahí, no lo inventes).

Todo lo demás va a `descartadas`. La función **no muta** la entrada. Antes de persistir,
strippeá `_motivo` (mismo tratamiento que `_uuid`/`_startMs`).

## (2) UI — preview del ZIP en `Salud.tsx`

- En `handleZip`, tras la extracción, traé el historial del miembro
  (`getHistorialMiembro`) y corré `filtrarCardioRelevante(result.cardio, historial,
  result.shapeUpCustomIds)`. Guardá ambos conjuntos en el estado del preview.
  (En el CSV suelto no hay `custom_exercise`, así que ahí la lista va vacía `[]`
  y la regla 1 no aplica — es el comportamiento correcto.)
- En el panel de preview, para la categoría cardio mostrá:
  «Cardio: **12 relevantes** de 87 en el export (5 ShapeUp, 4 matchean tu historial,
  2 VR, 1 por actividad) · 75 se omiten» — con los números reales por motivo.
- Toggle **"Importar todo el cardio (87)"**, apagado por defecto. Al prenderlo, el
  contador del preview se actualiza.
- En `confirmarImport` (caso ZIP): importá `relevantes` o todo según el toggle. El
  mensaje final refleja lo omitido por filtro **separado** de los omitidos por error:
  «✅ 14 importados · 75 filtrados (no relevantes) desde ZIP».
- **CSV suelto de `exercise`** (`handleFile`): aplicá el mismo filtro con el mismo
  toggle. Es el mismo dato por otra puerta; no dejes un bypass.
- El enriquecimiento del prompt 46 corre igual que antes (usa `sesionesSamsung`, que
  no se filtra): toda sesión que matchea historial es relevante por la regla 1, así
  que nunca se enriquece contra un cardio que no se importó.

## (3) Nota de alcance — lo ya importado no se toca

Este filtro aplica **hacia adelante**. Si el owner ya tiene cardio histórico importado
de pruebas anteriores y quiere depurarlo, eso es una decisión de datos aparte (se puede
hacer a mano o con un script puntual); no agregues lógica de borrado acá.

## (4) Tests (`importSelectivo.test.ts`, sin Firebase)

- Regla ShapeUp: `_customId` en la lista → relevante aun **sin** Historial que solape;
  lista vacía → la regla no aplica (y jamás matchear `_customId` vacío contra lista vacía).
- Solape con historial: dentro de tolerancia, fuera de tolerancia, sin `_startMs`
  (fallback por fecha, mismo día / distinto día).
- Prioridad de motivos: una sesión ShapeUp que además solapa historial sale con
  `_motivo: "shapeup"`; una VR que solapa historial sale con `_motivo: "historial"`.
- Allowlist: actividad incluida / no incluida; case exacto según `resolverActividad`.
- No mutación de la entrada; `descartadas` + `relevantes` = entrada completa.
- Strippeo de `_motivo` antes de persistir (test del consumidor, como en P46).

## (5) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde (todos los previos + los nuevos).
- `docs/MAPEO-IMPLEMENTACION.md` actualizado; en `CLAUDE.md` tildá S1 completo
  (núcleo + selectivo, ADR #020 implementado).
- Prueba manual sugerida al owner: importar el ZIP real a nivel biométrico y validar
  (a) el resumen de matcheo del P46, (b) que el conteo de relevantes tenga sentido
  contra su historial real, (c) prender "importar todo" y ver el contador cambiar.
- Commit sugerido: `feat(salud): import selectivo de cardio por relevancia (S1b, ADR #020)`.
