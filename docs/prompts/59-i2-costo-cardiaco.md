# Prompt 59 — I2 · Costo cardíaco por rutina (el match empieza a pagar)

> **Código + tests.** Serie I, segundo insight. Requiere I1 (reusa `TrendChart`).
> Idea del owner-chat validada por los datos: con las sesiones matcheadas, la FC
> media **a igual rutina** a lo largo del tiempo es una medida directa de mejora
> aeróbica — misma Fuerza A con 8 bpm menos que hace un mes = tu corazón hace el
> mismo trabajo con menos esfuerzo. Hoy hay 1 sesión enriquecida: la feature
> arranca modesta a propósito y **acumula valor con cada import** — ese es el
> diseño, no un defecto. Castellano voseo, tokens siempre.
>
> **Decisiones del owner (no re-discutir):**
> - La comparación es SIEMPRE contra uno mismo y a igual rutina — nunca entre
>   miembros, nunca entre rutinas distintas (comparar FC de Fuerza A vs HIIT no
>   significa nada).
> - Sesiones libres (sin `idRutina`) quedan FUERA de la comparación (no hay
>   "igual trabajo" contra qué comparar). Muestran su biometría como hasta ahora.
> - Sin dato suficiente, silencio: nada de "necesitás más sesiones" en cada
>   pantalla. El insight aparece cuando puede decir algo.

## (1) Núcleo puro — `src/lib/costoCardiaco.ts`

```ts
export interface ComparativaCardiaca {
  fcMediaActual: number;
  fcMediaPrevias: number;      // mediana de las previas de la misma rutina
  deltaBpm: number;            // actual − previas (negativo = mejora)
  sesionesPrevias: number;     // cuántas respaldan la mediana
  kcalMinActual?: number;
  kcalMinPrevias?: number;
}

export function compararConPrevias(
  sesion: Historial,           // con biometria
  historial: Historial[],      // del miembro, completo
): ComparativaCardiaca | null

export interface PuntoCosto { fecha: string; fcMedia: number; kcalMin?: number }
export function serieCostoRutina(idRutina: string, historial: Historial[]): PuntoCosto[]
```

- Elegibles: sesiones con `biometria.fcMedia` y el mismo `idRutina` (auditá el
  nombre real del campo en `Historial`), anteriores a la fecha de la actual.
- `compararConPrevias` devuelve `null` con < 2 previas elegibles (con 1 previa la
  "mediana" es una anécdota). `kcalMin` solo si ambas partes tienen kcal Y
  duración (recordá que el anti-olvido puede omitir kcal — ahí kcalMin no se
  computa, no se inventa).
- Nada de normalizar por duración en la FC: la mediana de FC media ya es
  comparable a igual rutina; documentá esa decisión en un comentario.
- Tests: mediana con 2/3/5 previas; < 2 → null; sesión libre → null; kcal
  omitida en una parte → sin kcalMin; delta con signo correcto; la serie ordena
  cronológico y excluye sesiones sin biometría.

## (2) `HistorialDetalle` — la frase del insight

En el bloque de biometría, si `compararConPrevias` devuelve algo:
«FC media 122 · **−8 bpm** vs tus últimas 3 sesiones de esta rutina» — con el
delta en color de tokens solo si mejora (bajó); si subió, texto neutro (una FC
más alta puede ser esfuerzo deliberado, no "empeoraste" — sin rojo).

## (3) `RutinaDetalle` — sección "Costo cardíaco"

Solo si la rutina tiene ≥ 3 sesiones con biometría del miembro actual:
`TrendChart` chico con `serieCostoRutina` (FC media por sesión, eje X por
fecha), y debajo «Primera: 130 bpm · última: 122 · −6% en N sesiones». Con
< 3, la sección no existe (decisión del owner: silencio).

## (4) Verificación

- `tsc -b` limpio · vitest verde · commit + push.
- Con los datos reales de hoy (1 sesión enriquecida) TODO debe quedar en
  silencio — verificalo explícitamente: ni frase ni sección ni errores. La ruta
  QA con mocks (patrón del I1) sirve para ver la feature "adelantada en el
  tiempo" con 5 sesiones simuladas.
- `MAPEO-IMPLEMENTACION.md` + tilde I2 en `CLAUDE.md`.
- Commit: `feat(salud): costo cardíaco por rutina (I2)`.
