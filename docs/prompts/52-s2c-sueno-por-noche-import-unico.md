# Prompt 52 — S2c · Sueño por noche (bug de señal) + import único

> **Código + tests.** Origen: prueba real del owner (2026-07-05, captura de la tab
> Sueño). Dos problemas:
> (1) **El sueño se muestra y se calcula por TRAMO, no por noche.** Samsung exporta
> una fila por sesión de sueño (noche partida, siestas), la tab lista cada tramo como
> si fuera una noche ("2026-07-02" aparece 3 veces: 3.6 + 1.3 + 1.2 h) y el
> "promedio 7 noches: 3.5 h" es falso. **Gravedad**: esa cifra alimenta la señal de
> sueño de `resumenSalud` y el motor de recomendaciones → recomendaciones de descanso
> por un dato mal agregado. Además "acostó 07:11" (inicio de un tramo matutino) es
> ilegible.
> (2) **Tres niveles de import confunden.** Decisión del owner: una sola forma de
> importar — la completa con lo necesario nomás. Esto REEMPLAZA la parte 2 del P51
> (que mantenía el selector con default): el selector se elimina.
> Castellano voseo, tokens siempre.
>
> **Decisiones del owner (no re-discutir):**
> - Una noche = la suma de sus tramos. La lista muestra **una fila por noche**.
> - **Las siestas SUMAN al total del día** (decisión del owner): el sueño de una
>   fecha es todo lo dormido — noche + siestas. Se muestra el desglose, pero el
>   número que manda (y el que usa la señal) es el total.
> - **Import: un solo botón, sin selector ni modo avanzado** (decisión del owner).
> - La consolidación vive en UN módulo puro y la consumen todos: tab Sueño, señal de
>   `resumenSalud`, "Contexto del día" y, por transición, las recomendaciones.

## (1) Parser y modelo — capturar el rango real del tramo

- `RegistroSueno` hoy solo tiene `fecha`, `horas?`, `horaAcostarse?`. Sumá:
  `inicioMs?: number`, `finMs?: number`, `horaLevantarse?: string`. En
  `parsearSueno`, poblalos desde las columnas de start/end del CSV (usá `epochToMs`
  del P46; el offset como en el resto).
- Los datos ya importados no tienen los campos nuevos: no migres — el owner va a
  correr `limpiar:salud` + re-import de todos modos. La consolidación debe tolerar
  registros legacy sin `inicioMs` (ver regla de asignación).

## (2) Núcleo puro — `src/lib/sueno.ts`

```ts
export interface NocheSueno {
  fecha: string;            // la fecha de la MAÑANA en que te levantaste
  horasTotal: number;       // noche + siestas: EL número que manda
  horasNoche: number;       // suma de tramos nocturnos
  horasSiesta?: number;     // suma de tramos diurnos, si hubo
  horaAcostarse?: string;   // inicio del primer tramo nocturno
  horaLevantarse?: string;  // fin del último tramo nocturno
  tramos: number;           // total de tramos del día (1 = noche corrida)
}

export function consolidarNoches(registros: RegistroSueno[]): NocheSueno[]
```

- **Asignación de tramo a noche**: un tramo pertenece a la noche de la fecha D si
  arranca entre las 15:00 de D−1 y las 14:59 de D (con `inicioMs`). Legacy sin
  `inicioMs`: si `horaAcostarse` ≥ "15:00", el tramo va a la noche de `fecha`+1 día;
  si no, a la de `fecha`. Sin `horaAcostarse`, a la de `fecha`.
- **Nocturno vs siesta** (solo para el desglose visual): dentro de una fecha, un
  tramo es "siesta" si arranca entre las 10:00 y las 19:59 **y** dura < 3 h; el
  resto es nocturno. (Captura del owner: "1.4 h acostó 12:02" → siesta; "3.8 h
  acostó 05:30" → nocturno.)
- `horasTotal = horasNoche + horasSiesta` — es lo que consumen la señal, los
  promedios y el header. El desglose noche/siesta es informativo.
- Ordená descendente por fecha. Exportá también
  `promedioNoches(noches, n): number | undefined` (promedio de `horasTotal` de las
  últimas n fechas CON dato; < 3 noches → undefined, mejor sin promedio que
  promedio de una noche).

## (3) Consumidores — todos leen del mismo lugar

- **`resumenSalud.ts`**: la señal de sueño pasa a usar `consolidarNoches` +
  `promedioNoches(·, 3)`. Los umbrales no cambian. Ajustá los tests que armaban
  registros por tramo. **Este es el fix de mayor impacto del prompt.**
- **`SuenoTab`**: header con "última noche" (`horasTotal` + rango
  «00:30 → 07:11»), "promedio 7 noches" consolidado, y sacá el "1841 registros"
  (número sin significado para el usuario) — en su lugar «X noches con dato en los
  últimos 30 días». Gráfico de barras: una barra por fecha con `horasTotal`.
  Lista: una fila por fecha: `2026-07-03 · 5.2 h · 00:30 → 07:11 · 2 tramos` y, si
  hubo, `incl. siesta 1.4 h` como texto secundario. Nada de "acostó".
- **`HistorialDetalle` (Contexto del día)**: "sueño de la noche anterior" = la
  `NocheSueno` cuya `fecha` es la de la sesión (te levantaste esa mañana), total
  consolidado — no un tramo suelto.

## (4) Import único

- Eliminá el selector de nivel de la UI de `/salud`. Un solo flujo:
  - **ZIP** → pipeline completo de una: agregados diarios + extracción biométrica +
    filtro selectivo + enriquecimiento post-import. (Lo "necesario nomás" ya lo
    garantizan ADR #016 —agregados diarios, no crudo— y ADR #020 —cardio selectivo—;
    no hay nada que elegir.)
  - **CSV suelto** → se detecta el tipo por nombre como hoy.
  - El alta manual (+) no cambia.
- Internamente podés dejar el tipo `nivel` como plomería (siempre "biometrico" para
  ZIP) o eliminarlo si queda muerto — decidilo por menor diff, documentalo en el
  mapeo. No queda ningún selector ni modo avanzado en la UI.
- El preview sigue siendo el único punto de confirmación; el texto del nivel del P51
  («Nivel: biométrico...») ya no hace falta — reemplazalo por una línea fija de qué
  va a pasar: «Se importan tus métricas diarias y se matchean tus entrenamientos».

## (5) Tests (`sueno.test.ts` + ajustes)

- Consolidación: 3 tramos de la misma fecha → 1 `NocheSueno` con `horasTotal`
  correcto y rango del primero al último tramo nocturno; tramo que arranca 23:40
  del día D → noche D+1; tramo 05:30 → noche D; siesta 12:02/1.4h desglosada pero
  **sumada** a `horasTotal`.
- Legacy sin `inicioMs`: reglas por `horaAcostarse`.
- `promedioNoches`: usa `horasTotal`; con huecos; < 3 noches → undefined.
- `resumenSalud`: la señal con tramos partidos da el estado correcto (el caso de la
  captura: 3.6+1.3+1.2 → 6.1 h totales → atención, no la falsa alerta de promediar
  tramos como noches).
- Import: ZIP dispara pipeline completo sin selector.

## (6) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde.
- Tras deploy + limpiar + re-import: la tab Sueño muestra una fila por noche con
  rango legible; el promedio 7 noches coincide con contar a mano; el Resumen y la
  tarjeta de Home reflejan el sueño consolidado.
- `docs/MAPEO-IMPLEMENTACION.md` y `CLAUDE.md` (anotá en S2 la consolidación como
  fuente única de verdad del sueño).
- Commit sugerido: `fix(salud): sueño consolidado por noche + import único (S2c)`.
