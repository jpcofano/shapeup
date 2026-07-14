# Prompt 58 — I1 · Progreso: tendencias largas de salud (arranca la serie I, insights)

> **Código + tests.** Serie I (insights) — actualizá `CLAUDE.md`: serie S cerrada
> (2026-07-13, primera biometría persistida y visible), arranca serie I con este
> plan: I1 tendencias largas (este prompt), I2 costo cardíaco por sesión, I3
> progresión de cargas. La serie H (Health Connect) va después y NO se mezcla:
> los insights leen de Firestore y son agnósticos de cómo llegó el dato.
>
> Origen: auditoría del 2026-07-13 — el owner tiene **diez años** de datos
> dormidos: 1537 días de fc-reposo/fc-media-dia/fc-max-dia (2015→hoy), 552 de
> SpO2, 154 de presión, 251 pesajes, 1363 noches. Hoy nada de eso se puede ver
> como tendencia. Castellano voseo, tokens siempre.
>
> **Decisiones del owner (no re-discutir):**
> - Sin librerías de gráficos nuevas (el bundle ya pesa 1.2 MB): extender el
>   enfoque SVG propio (`Sparkline`/`MiniChart`) con un componente `TrendChart`.
> - Nada de juicio visual sobre peso (coherente con S2): tendencia sí, colores no.
> - La agregación es **pura y testeada**; el componente solo dibuja.

## (0) Fix pendiente de la serie S (una línea, ya que estás)

`rematch-salud.ts` construyó la biometría del 07/07 con `zonaPrincipal=—`: no
carga el perfil del miembro. Cargalo (admin) y pasá `zonasFC` a
`construirBiometriaSesion`, con fallback a `fcMaxTeorica`/220−edad como en el
resto. Re-verificable con un rematch dry-run (mostraría la zona que escribiría).

## (1) Núcleo puro — `src/lib/tendencias.ts`

```ts
export type RangoTendencia = "3m" | "1a" | "5a" | "todo";

export interface PuntoTendencia {
  fecha: string;      // representante del bucket (día, semana ISO o mes)
  valor: number;      // mediana del bucket
  min?: number;       // para la banda min-máx del bucket
  max?: number;
}

export interface SerieTendencia {
  puntos: PuntoTendencia[];
  actual?: number;          // mediana de los últimos 7 días con dato
  haceUnAnio?: number;      // mediana de la misma ventana hace 365 días (si hay)
  deltaAnualPct?: number;
}

export function serieTendencia(
  valores: { fecha: string; valor: number }[],  // ya filtrados por métrica
  rango: RangoTendencia,
  hoy: string,
): SerieTendencia
```

- **Bucketing por rango** (para no renderizar 3600 puntos): `3m` → diario;
  `1a` → semanal (semana ISO); `5a`/`todo` → mensual. Valor del bucket =
  mediana; `min`/`max` del bucket para la banda.
- Huecos: un bucket sin datos NO se interpola — el punto no existe y el chart
  corta la línea (mejor honesto que inventar continuidad; el owner tiene épocas
  sin reloj).
- `deltaAnualPct` solo si ambas ventanas tienen ≥ 5 datos.
- Tests: bucketing exacto por rango, mediana con huecos, delta anual con y sin
  datos suficientes, orden cronológico, serie vacía.

## (2) Componente — `src/components/TrendChart.tsx`

SVG puro estilo `Sparkline` pero completo: línea de la mediana, banda min-máx
translúcida, línea punteada horizontal opcional (baseline/valor de referencia),
eje X con 4-6 marcas de fecha (años en rangos largos, meses en cortos), eje Y
con 3 marcas. Props: `puntos`, `unidad`, `lineaRef?`, `alto?`. Sin tooltips
complejos en esta pasada (mobile): un tap sobre el chart muestra el valor del
punto más cercano en un texto fijo arriba, nada flotante.

## (3) ProgresoTab — sección "Tendencias de salud"

Arriba de lo que ya muestra (progreso de entrenamiento), nueva sección:
- **Selector de métrica** (chips): FC reposo · FC media día · FC máx día ·
  SpO2 · Presión · Peso · Sueño.
  - FC*/SpO2 → `/metricas-salud` por tipo; Peso → `mediciones.pesoKg`;
    Sueño → `consolidarNoches(...).horasTotal` (reusar, no recalcular);
    Presión → **dos líneas** (sistólica y diastólica) en el mismo chart, con
    la ref punteada en 120/80.
- **Selector de rango**: 3M · 1A · 5A · Todo (default 1A).
- Debajo del chart, el resumen: «Ahora: 66 bpm · hace un año: 71 · −7%»
  (de `SerieTendencia`; ocultar lo que no haya).
- Solo se listan métricas con ≥ 10 datos en total; el resto ni aparece como chip.
- Carga: las lecturas ya existen en el estado compartido de `/salud` — no
  agregues queries nuevas; si Progreso puede abrirse sin pasar por Salud,
  cargá una sola vez y cacheá como hace Home.

## (4) Tests

- `tendencias.test.ts`: todo el punto 1.
- Presión: los pares se agrupan por fecha sin mezclar días.
- Chips: métrica con 9 datos no aparece; con 10 sí.

## (5) Verificación

- `tsc -b` limpio · vitest verde · commit + push (¡esta vez de una!).
- Deploy y prueba del owner: FC reposo en "Todo" debería contar la historia de
  diez años; presión con las dos líneas y la ref 120/80; sueño en 1A.
- `MAPEO-IMPLEMENTACION.md` + tilde I1 en `CLAUDE.md`.
- Commit: `feat(salud): tendencias largas en Progreso (I1) + zonaPrincipal en rematch`.
