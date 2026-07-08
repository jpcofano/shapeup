# Prompt 46 — S1 · Enriquecimiento post-import: conectar el match biométrico

> **Código + tests.** Serie S del `CLAUDE.md` (leelo antes de empezar), paso S1 núcleo.
> Origen: decisión del owner (2026-07-04). El pipeline del match existe completo
> (`samsungZip` nivel biométrico, `lib/matchBiometrico`, `Historial.biometria`,
> `HistorialDetalle` que lo renderiza) pero **nadie lo conecta**: `handleZip` descarta
> `shapeUpCustomId` y `liveData`, y no hay forma de persistir biometría en un Historial.
> Este prompt cierra esa última milla. El **import selectivo (ADR #020) NO va acá** —
> queda para el prompt 47. Castellano voseo, tokens siempre, ADRs #019 y #021 aplican.
>
> **Decisiones del owner (no re-discutir):**
> - El enriquecimiento corre **después de confirmar el import** del ZIP (nivel
>   "biometrico"), automático, con resumen visible: nunca silencioso.
> - Idempotente y sin degradar (ADR #021): si un Historial ya tiene biometría con
>   `granularidad: "serie"`, no se pisa con una de "sesion". Re-importar el mismo ZIP
>   no duplica nada.
> - Núcleo **puro** (ADR #009): todo lo matcheable se testea sin Firebase.

## (1) Habilitante — la extracción debe conservar epoch ms y custom_id

Hoy `parsearEjercicio` (en `src/import/samsungHealth.ts`) convierte `start_time` a fecha
`"YYYY-MM-DD"` y tira los ms; tampoco lee `custom_id`. Sin eso, `elegirSesionSamsung`
no tiene con qué trabajar.

- Agregá un helper `epochToMs(value: string, offset?: string): number | undefined` junto a
  `epochToDate`. Tiene que soportar los **dos formatos** del export (igual que
  `epochToDate`): epoch en ms como string, y datetime local `"YYYY-MM-DD HH:MM:SS.mmm"`
  (2024+) — en ese caso interpretalo como hora local usando el `time_offset` si viene.
- En `parsearEjercicio`, siguiendo el patrón existente de `_uuid` (campos con guion bajo
  que se strippean antes de persistir), sumá a cada item: `_startMs`, `_endMs` (si no hay
  `end_time`, derivalo como `_startMs + duration`), `_customId` (de `col(f, "custom_id")`,
  solo si viene no vacío), `_fcMin` (de `min_heart_rate`, si viene).
- **Verificá que `importarCardioIdempotente` (y cualquier otro consumidor) strippee los
  campos nuevos** antes de escribir a Firestore — que no se cuelen `_startMs` en `/cardio`.
- En `src/import/samsungZip.ts`, sumá a `ZipExtraccion` el campo
  `sesionesSamsung: SesionSamsung[]` (el tipo ya existe en `lib/matchBiometrico.ts`),
  construido desde los items de ejercicio: `{ datauuid, startMs, endMs, customId?,
  fcMedia, fcMax, fcMin, kcal }`. Filtrá filas sin `startMs`/`endMs` válidos.
  En niveles "basico"/"completo" puede ir vacío (`[]`).

## (2) Persistencia — `enriquecerHistorial` en `src/data/historial.ts`

```ts
export async function enriquecerHistorial(
  idHist: string,
  biometria: BiometriaSesion,
  bloques?: BloqueRegistro[],   // solo si hubo enriquecimiento por serie
): Promise<Result<void>>
```

`updateDoc` sobre `/historial/{idHist}` con `biometria` y, si vienen, los `bloques`
enriquecidos. Escribe solo documentos del propio miembro (consistente con ADR #014).
Sin transacción: es un update simple.

## (3) Núcleo puro — `src/lib/enriquecerImport.ts`

```ts
export interface ResultadoEnriquecimiento {
  matcheadas: number; porCustomId: number; porVentana: number; sinMatch: number;
  omitidas: number;   // ya tenían granularidad "serie" (ADR #021)
  updates: { idHist: string; biometria: BiometriaSesion; bloques?: BloqueRegistro[] }[];
}

export function calcularEnriquecimiento(
  historial: Historial[],
  extraccion: Pick<ZipExtraccion, "sesionesSamsung" | "liveData" | "shapeUpCustomId">,
  perfil?: PerfilMiembro,
): ResultadoEnriquecimiento
```

Por cada `Historial`:
- **Omitir** si `h.biometria?.granularidad === "serie"` (ADR #021, contá en `omitidas`).
  Si tiene biometría "sesion" y esta pasada logra curva fina, sí se mejora.
- **Ventana de la sesión**: usá `h.inicioMs`/`h.finMs` si existen (los agrega la parte 5);
  si no, derivala de las series: mín de `serie.inicioMs` / máx de `serie.finMs` recorriendo
  `h.bloques[].series[]`. Último fallback: `fechaRealizada` a mediodía local ±
  `duracionRealMin` (o ±60 min si es null). Extraé esta derivación a un helper puro
  exportado `ventanaDeHistorial(h): SesionApp | null` — se testea aparte.
- `elegirSesionSamsung(ventana, extraccion.sesionesSamsung, extraccion.shapeUpCustomId)`.
  Sin match → `sinMatch++`.
- Con match: `construirBiometriaSesion(sesion, matchPor, perfil)`. Si hay curva
  (`extraccion.liveData[sesion.datauuid]` no vacía), enriquecé cada serie con
  `enriquecerSerie(serie, curva, inicioSiguienteMs)` — el `inicioSiguienteMs` es el
  `inicioMs` de la serie siguiente del mismo bloque (o la primera del bloque siguiente);
  la última serie de la sesión no lleva. En ese caso la biometría lleva
  `granularidad: "serie"` y el update incluye los `bloques` clonados (no mutar los de
  entrada). Sin curva → `granularidad: "sesion"`, sin `bloques`.
- **Una sesión Samsung no puede matchear dos Historiales**: procesá el historial en orden
  cronológico y sacá del pool las `datauuid` ya usadas.

Orquestador aparte (mismo archivo o `data/`):

```ts
export async function enriquecerTrasImport(
  miembro: MiembroId,
  extraccion: ZipExtraccion,
): Promise<Result<ResultadoEnriquecimiento>>
```

`getHistorialMiembro` + `getPerfiles` → `calcularEnriquecimiento` → aplicar `updates`
con `enriquecerHistorial` (usá `Promise.allSettled`; los rechazados restan de
`matcheadas` y suman a un contador de errores en el mensaje).

## (4) UI — hook en `Salud.tsx`

En el flujo de confirmación del import (donde hoy se llama a `importarCardioIdempotente`
etc.), si el preview vino de un ZIP con `nivel === "biometrico"` y
`sesionesSamsung.length > 0`: tras persistir, llamá `enriquecerTrasImport` y sumá al
mensaje de resultado una línea del estilo:

> «5 sesiones de entrenamiento matcheadas (3 por custom-id, 2 por ventana) · 1 sin match»

Mostrá `omitidas` solo si > 0 («2 ya estaban enriquecidas»). Si el enriquecimiento falla,
el import NO se considera fallido: mostrá el error como advertencia aparte.
Guardá la `extraccion` completa en el estado del preview (hoy solo van `parsedItems`)
para tenerla disponible al confirmar.

## (5) ADR #019 — ventana a nivel Historial

- En `src/types/models.ts`, sumá a `Historial`: `inicioMs?: number` y `finMs?: number`
  (epoch ms de la sesión completa, sellados al cierre).
- Helper puro `ventanaDeBloques(bloques: BloqueRegistro[]): { inicioMs?: number;
  finMs?: number }` (mín/máx de las series) — ponelo donde ya viva lógica afín
  (`lib/entrenarState.ts` o `lib/metricas.ts`, no dupliques; si existe algo parecido,
  reusalo).
- En `finalizarSesion` (`data/historial.ts`): calculá la ventana desde `opts.bloques` y
  escribila en el doc **solo si ambos valores existen** (sesiones viejas o quick-log sin
  timestamps quedan sin los campos; `stripUndef`/omit para no escribir `undefined`).

## (6) Tests (los nuevos van todos sin Firebase)

- `epochToMs`: epoch string, datetime 2024+ con y sin offset, valores inválidos.
- `parsearEjercicio`: conserva `_startMs/_endMs/_customId`; deriva `_endMs` desde
  duration; los consumidores los strippean.
- `ventanaDeHistorial` / `ventanaDeBloques`: con timestamps completos, parciales
  (algunas series sin ms), sin ninguno (fallback fecha), bloques vacíos.
- `calcularEnriquecimiento`: match por custom-id, fallback por ventana, sin match,
  omitida por granularidad "serie", upgrade de "sesion" a "serie", curva presente →
  series enriquecidas con `recuperacionBpm` correcto, pool sin doble asignación de
  `datauuid`, no muta los `Historial` de entrada.
- `samsungZip`: `sesionesSamsung` poblado en nivel biométrico, vacío en básico.

## (7) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde (267 actuales + los nuevos).
- Actualizá `docs/MAPEO-IMPLEMENTACION.md` (nuevas funciones y campos) y tildá S1
  núcleo en `CLAUDE.md` (dejá explícito que el punto 5 de S1 —import selectivo,
  ADR #020— sigue pendiente para el prompt 47).
- Commit sugerido: `feat(salud): enriquecimiento biométrico post-import (S1, ADR #019/#021)`.
