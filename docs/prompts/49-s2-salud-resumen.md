# Prompt 49 — S2 · Salud: mostrar lo relevante (tab Resumen + contexto + refactor)

> **Código + tests.** Serie S del `CLAUDE.md`, paso S2. Requiere el 46 aplicado (usa
> `Historial.biometria` y los campos de enriquecimiento); no depende del 47/48.
> Origen: pedido del owner — *"hay que simplificar y mostrar lo relevante en salud"*.
> Hoy `/salud` son cuatro tabs de listas crudas y `getMetricasSalud` **no se usa en
> ninguna parte de la UI**: FC en reposo, HRV, estrés, pasos, VO2max y compañía se
> importan y quedan invisibles. Castellano voseo, tokens siempre, `Sparkline`/`MiniChart`
> existentes para los gráficos (no metas librerías nuevas).
>
> **Decisiones del owner (no re-discutir):**
> - "Resumen" pasa a ser la **tab default** de `/salud`. Pocas señales accionables
>   con tendencia; las listas crudas quedan en las tabs actuales.
> - Cada señal es **explicable**: valor, tendencia vs tu propio baseline, y el porqué
>   del semáforo. Nada de scores mágicos.
> - El **peso no lleva semáforo** (solo valor + tendencia): la app la usa la familia
>   incluyendo adolescentes; no emitimos juicio visual sobre el peso (verde/rojo).
> - Los umbrales viven en el módulo puro y **los reusa S3** (motor de recomendaciones):
>   una sola fuente de verdad para "qué es normal para este miembro".

## (1) Núcleo puro — `src/lib/resumenSalud.ts`

```ts
export type EstadoSenal = "ok" | "atencion" | "alerta" | "sin-datos";

export interface SenalSalud {
  clave: "fc-reposo" | "sueno" | "hrv" | "pasos" | "peso";
  valorActual?: number;          // último dato (o promedio 3 días donde se indique)
  unidad: string;
  baseline?: number;             // mediana de los días 8–35 hacia atrás
  deltaPct?: number;             // (actual − baseline) / baseline
  estado: EstadoSenal;           // "peso" siempre "ok" o "sin-datos" (sin juicio)
  motivo?: string;               // p.ej. "FC reposo +6 bpm vs tus últimas 4 semanas"
  serie14d: { fecha: string; valor: number }[];  // para el sparkline
}

export function calcularResumenSalud(
  metricas: MetricaSalud[],       // ya filtradas por miembro
  sueno: RegistroSueno[],
  mediciones: MedicionCorporal[],
  hoy: string,                    // "YYYY-MM-DD" inyectado (testeable)
): SenalSalud[]
```

- **Baseline**: mediana del valor diario en la ventana de días 8–35 hacia atrás
  (excluye la última semana para que la tendencia no se compare contra sí misma).
  Menos de 7 datos en esa ventana → la señal sale `"sin-datos"` en vez de inventar.
- **Señales y umbrales** (exportá las constantes; S3 las importa):
  - `fc-reposo` (`tipo: "fc-reposo"`, promedio de los últimos 3 días con dato):
    +5 bpm vs baseline → `atencion`; +8 bpm → `alerta`.
  - `sueno` (horas por noche desde `RegistroSueno`, promedio 3 noches):
    < 6.5 h → `atencion`; < 5.5 h → `alerta`. Independiente del baseline
    (dormir siempre poco no lo vuelve "normal").
  - `hrv` (`tipo: "hrv"`, promedio 3 días): −15% vs baseline → `atencion`;
    −25% → `alerta`. Sin datos de HRV (no todos los relojes lo exportan) →
    la señal directamente **no se lista** (no mostrar una card "sin datos" eterna).
  - `pasos` (promedio 7 días): −40% vs baseline → `atencion`. Nunca `alerta`.
  - `peso` (de `mediciones`, último valor): solo valor + `deltaPct`; `estado` fijo
    `"ok"` (o `"sin-datos"`).
- `motivo` se arma en castellano y con el dato concreto — es el mismo texto que va
  a la card y, en S3, a la recomendación.
- Función auxiliar exportada `senalPeor(senales): EstadoSenal` (para el badge de la
  tab y para S3).

## (2) UI — tab "Resumen" en `/salud`

- Sumá `"resumen"` al tipo `Tab` y hacela **default**. Orden: Resumen · Composición ·
  Cardio · Sueño · Progreso.
- Una card por señal: nombre, valor actual con unidad, flecha de tendencia
  (`deltaPct`), sparkline de 14 días (`Sparkline` existente) y punto de color por
  `estado` (tokens: éxito/advertencia/peligro — usá los que ya existan en
  `tokens.css`; no inventes colores). El `motivo` como texto secundario cuando el
  estado no es "ok".
- Tap en la card → navega a la tab con el detalle (fc-reposo/hrv/pasos → Progreso o
  la que corresponda; sueno → Sueño; peso → Composición).
- Estado vacío de la tab (miembro sin ningún dato): mensaje único invitando a
  importar desde Samsung Health, no cinco cards muertas.
- Carga: un solo `Promise.all` con `getMetricasSalud`, `getRegistrosSueno`,
  `getMediciones` (ya se traen para otras tabs — reusá el estado si ya está cargado,
  no dupliques lecturas; ADR #016/costo Spark).

## (3) Contexto en `HistorialDetalle`

Debajo de la biometría de la sesión (o donde hoy iría si no hay match), un bloque
"Contexto del día": sueño de la **noche anterior** a `fechaRealizada` y FC en reposo
de ese día, si existen. Dos datos chicos, sin gráficos. Si no hay ninguno de los dos,
el bloque no se renderiza.

## (4) Cardio vinculado vs suelto

En la tab Cardio, marcá con un badge «vinculada a entrenamiento» las sesiones cuyo
`datauuid` aparece referenciado por algún `historial[].biometria.datauuidSamsung` del
miembro (armá el `Set` una vez; el historial ya se carga para Progreso — compartí ese
estado). Ordená la lista con las vinculadas primero. Sin borrar ni ocultar nada.

## (5) Refactor de `Salud.tsx` (sin cambios de comportamiento)

Está en ~1000+ líneas. Extraé cada tab a `src/components/salud/`:
`ResumenTab.tsx`, `ComposicionTab.tsx`, `CardioTab.tsx`, `SuenoTab.tsx`,
`ProgresoTab.tsx`, más `ImportPanel.tsx` (todo el flujo de file/ZIP/preview/confirmar,
que es lo más largo del archivo). `Salud.tsx` queda como contenedor: estado
compartido, tabs y ruteo interno. **Los tests y el comportamiento no cambian**; si un
extract obliga a tocar lógica, pará y dejalo anotado en el commit en vez de mezclar.

## (6) Tests (`resumenSalud.test.ts`, sin Firebase)

- Baseline: mediana correcta en ventana 8–35; < 7 datos → "sin-datos"; datos con
  huecos (días sin métrica) no rompen la ventana.
- Umbrales: cada señal en ok / atencion / alerta con valores límite exactos
  (p.ej. +5.0 bpm es atencion, +4.9 no).
- Sueño: independiente de baseline; promedio de 3 noches con una noche faltante.
- HRV ausente → la señal no aparece en el array.
- Peso: nunca sale de "ok"/"sin-datos" aunque el delta sea grande.
- `senalPeor`: prioridad alerta > atencion > ok > sin-datos.
- `motivo` contiene el valor concreto (snapshot o `toContain`).

## (7) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde (todos los previos + los nuevos).
- Chequeo visual: `/salud` abre en Resumen; con datos reales del owner las cards
  muestran tendencia; con un miembro sin datos, el estado vacío.
- `docs/MAPEO-IMPLEMENTACION.md` actualizado; tildá S2 en `CLAUDE.md` y anotá que
  los umbrales de `resumenSalud.ts` son la base de S3.
- Commit sugerido: `feat(salud): tab Resumen con señales y tendencias (S2) + refactor de tabs`.
