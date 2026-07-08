# Prompt 50 — S3 · Motor de recomendaciones + rutinas guiadas por salud

> **Código + tests + seeds.** Serie S del `CLAUDE.md`, paso S3 (último de la serie).
> Requiere S2 aplicado: **reusa las señales y umbrales de `lib/resumenSalud.ts`** —
> no dupliques ni un umbral; si el motor necesita algo que resumenSalud no expone,
> exportalo desde ahí. Los tipos (`Recomendacion`, `TipoRecomendacion`,
> `SENALES_SALUD`) ya existen en `models.ts` desde hace tiempo, sin lógica detrás.
> Castellano voseo, tokens siempre.
>
> **Decisiones del owner (no re-discutir):**
> - Recomendaciones **explicables** (ADR #022): cada una muestra su porqué con el
>   dato concreto — reusá el `motivo` que ya arma `resumenSalud`. Nada de caja negra.
> - **Nunca bloquea**: la tarjeta sugiere; el miembro entrena lo planificado si quiere.
>   Descartable, y descartada no vuelve a aparecer ese día.
> - **Máximo una tarjeta por día** (la de mayor severidad). Una app que regaña todos
>   los días se ignora a la semana.
> - **El peso NO es señal del motor** (coherente con S2): la familia incluye
>   adolescentes; ninguna regla usa `tendencia-peso` ni `tendencia-grasa`.
> - **Sin colección nueva** (ADR #023, agregalo al `CLAUDE.md`): las recomendaciones
>   se calculan al vuelo en el cliente, no se persisten en Firestore (costo Spark,
>   y son derivables). El descarte se guarda en `localStorage`
>   (`rec-descartada-{miembro}-{fecha}`). Si a futuro hace falta trackear `aplicada`,
>   se revisa el ADR.

## (1) Seeds — 3 rutinas nuevas (`scripts/seed-salud-rutinas.ts`)

Seguí las convenciones de los seeds existentes (`seed-plan.ts` / `seed-planes-extra.ts`:
firebase-admin, `--dry-run`, ids de rango reservado, visibilidad como las rutinas
generales). Ejercicios: usá los del catálogo (`catalogo-ejercicios.json` / `/ejercicios`)
buscándolos por nombre; si alguno no existe, elegí el más cercano del catálogo — **no
crees ejercicios nuevos** en este prompt.

- **RUT-0023 · Cardio Z2 base** (~35 min): entrada en calor 5 min · bloque principal
  25–30 min continuo en **zona 2** (usar `zonasFC` del perfil del miembro; fallback
  60–70% de `fcMaxTeorica`; si tampoco hay, 220−edad) · vuelta a la calma 5 min.
  Modalidad libre (caminata rápida, bici, eliptico — lo que el equipo del miembro
  permita). En la descripción de la rutina explicá cómo saber que estás en Z2
  ("podés hablar en frases completas").
- **RUT-0024 · HIIT corto** (~20 min): calor 4 min · 6–8 rondas de 30s fuerte /
  90s suave · vuelta a la calma. En la descripción: pensada para días de **buena
  recuperación**; si el resumen de salud está en atención/alerta, mejor RUT-0023 o
  RUT-0025.
- **RUT-0025 · Descarga activa** (~25 min): movilidad general (aprovechá los
  ejercicios de la rutina de movilidad existente como referencia) + 10 min de
  caminata Z1 + respiración/estiramiento final. Cero cargas.

## (2) Núcleo puro — `src/lib/recomendaciones.ts`

```ts
export const RUTINAS_RECOMENDADAS = {
  z2: "RUT-0023", hiit: "RUT-0024", descarga: "RUT-0025", deload: "PRG-0009",
} as const;

export function calcularRecomendacion(
  senales: SenalSaludResumen[],   // salida de calcularResumenSalud (renombrá si choca
                                  // con el SenalSalud de models — priorizá claridad)
  historial: Historial[],         // del miembro, ya cargado
  hoy: string,                    // "YYYY-MM-DD" inyectado
): Recomendacion | null
```

Reglas, evaluadas en orden — **gana la primera que aplica** (una sola tarjeta):

1. **Descanso** (`severidad: "importante"`): sueño o HRV en `alerta` →
   `tipo: "Día de descanso"`, acción RUT-0025. `basadoEn` con la(s) señal(es) real(es).
2. **Bajar intensidad** (`"sugerencia"`): sueño o HRV en `atencion` (sin llegar a
   alerta) → `tipo: "Bajar intensidad"`, acción RUT-0025 o "hacé la sesión planeada
   más liviana" en `cambio`.
3. **Cardio Z2** (`"sugerencia"`): `fc-reposo` en `atencion` o `alerta` →
   `tipo: "Sumar cardio Z2"`, acción RUT-0023.
4. **Deload** (`"sugerencia"`): 4+ semanas corridas con ≥ 2 sesiones de fuerza por
   semana en `historial` y ninguna semana liviana en el medio (semana liviana =
   ≤ 1 sesión) → `tipo: "Deload"`, acción PRG-0009. Helper puro exportado
   `semanasSinDescarga(historial, hoy): number` con sus propios tests
   (semana según `semanaArrancaEn` de config — recibilo por parámetro, default lunes).
5. **Felicitación / HIIT** (`"info"`): TODAS las señales en `ok` **y** ≥ 2 sesiones
   en los últimos 7 días → `tipo: "Felicitación"`, mensaje positivo + acción RUT-0024
   («buena recuperación: si querés, hoy es un buen día para intensidad»). Si no se
   cumple lo segundo, `null` (silencio; no felicitar de oficio).

Sin datos de salud suficientes (todas las señales "sin-datos") → `null`. El `mensaje`
siempre incluye el dato («Dormiste 5,2 h de promedio — hoy te sugiero Descarga
activa»); reusá los `motivo` de las señales.

## (3) UI — tarjeta en Home

- En `Home.tsx`, arriba de la vista semanal: si `calcularRecomendacion` devuelve algo
  y no está descartada hoy (`localStorage`), mostrá una card compacta: icono según
  severidad, `mensaje`, botón/tap «Ver rutina» → `RutinaDetalle` de la acción
  (o el programa en el caso deload), y una ✕ para descartar.
- Datos: Home no debe sumar lecturas pesadas nuevas en cada visita. Cargá métricas/
  sueño/mediciones con el mismo patrón que `/salud` pero **solo si el miembro tiene
  algo importado alguna vez** (probá primero con una lectura barata o cacheá en
  memoria de sesión el "no tiene datos" para no repetir 3 queries vacías por visita;
  documentá lo que elijas en el mapeo). El historial ya se carga para la vista
  semanal — compartilo.
- Miembros juveniles: la tarjeta aplica igual (las reglas son de sueño/FC/carga, no
  de peso), pero con el tono ya definido de la app.

## (4) Tests (`recomendaciones.test.ts`, sin Firebase)

- Cada regla dispara con su señal exacta y no con la vecina (atencion vs alerta).
- Orden/prioridad: alerta de sueño + fc-reposo alta → sale "Día de descanso" (regla 1),
  no la 3.
- `semanasSinDescarga`: 4 semanas llenas → 4; semana liviana en el medio → resetea;
  borde de arranque de semana lunes vs domingo.
- Felicitación: todas ok con 2 sesiones/7d → sale; todas ok con 1 sesión → `null`.
- Todas "sin-datos" → `null`. `mensaje` contiene el dato concreto.
- `basadoEn` refleja las señales reales que dispararon.

## (5) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde (345 previos + los nuevos).
- Seed en dry-run primero; después real y chequeo visual de las 3 rutinas en la app
  (prescripciones completas, se pueden entrenar con el flujo normal).
- Chequeo visual de la tarjeta en Home con datos reales del owner; descartar y
  verificar que no reaparece hasta mañana.
- `docs/MAPEO-IMPLEMENTACION.md` y `docs/SEEDS.md` actualizados; en `CLAUDE.md`:
  tildá S3, agregá ADR #023 y marcá la **serie S completa** (S4/roadmap queda como
  próxima conversación de arquitectura).
- Commit sugerido: `feat(salud): motor de recomendaciones + rutinas Z2/HIIT/descarga (S3, ADR #022/#023)`.
