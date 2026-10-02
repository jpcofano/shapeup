# CLAUDE.md — ShapeUp

Memoria de proyecto para Claude Code. Leé esto antes de cualquier cambio.
Fuentes ampliadas: `docs/ESTADO-DEL-PROYECTO.md` (estado), `docs/MAPEO-IMPLEMENTACION.md`
(mapa técnico), `docs/SAMSUNG-HEALTH-MAPEO.md` (spec del export), `docs/SEEDS.md`.

## Qué es
Contexto del proyecto (stack, familia): movido a `docs/PROYECTO.md`, «Qué es».
Idioma: castellano argentino, voseo. Tokens de diseño siempre (`src/styles/tokens.css`).
**Los límites de costo siguen valiendo:** el nivel gratuito de Blaze tiene los mismos topes
que Spark, así que las decisiones tomadas "por costo Spark" siguen en pie.

## Reglas de trabajo (no re-discutir)
- Funciones puras separadas de Firebase (ADR #009): la lógica va en `src/lib/`, testeable
  sin emulador; `src/data/` solo orquesta Firestore.
- Las transacciones de cierre escriben SOLO documentos del propio miembro (ADR #014);
  contadores derivables no se actualizan en caliente.
- Métricas de salud con granularidad diaria, no crudas (ADR #016, costo: plan Blaze, con los
  mismos topes que Spark).
- IDs con rangos reservados (ADR #010). Result<T> en toda la capa de datos.
- **Los scripts se chequean como el resto; son el código que más daño puede hacer** (P87).
  `tsconfig.scripts.json` está en `tsc -b`. Todo script con `firebase-admin` corre y
  cuenta con `scripts/lib/corrida.ts`: respaldo antes de escribir, una línea final con lo
  escrito de verdad, código 1 si algo falló, y en simulación nunca dice "escritas".
- Antes de dar por terminado un prompt: `npx tsc -b` limpio + `npx vitest run` verde
  (la suite `firestore.rules.test.ts` requiere emulador; sin emulador se permite skip).
- Al terminar cada tarea, escribí el reporte final completo —tal cual se lo darías a Juan,
  con las preguntas abiertas— en `docs/auditorias/ultimochat.md`, sobrescribiéndolo. Juan no
  copia el chat: Claude lo lee de ahí.

## Documentación — dónde va cada cosa (P100)

Cada tipo de información tiene **un solo lugar**. Los demás documentos remiten; no repiten.

| Tipo | Lugar |
|---|---|
| Reglas de trabajo e índice de ADRs | `CLAUDE.md` |
| ADRs completos | `docs/ADR.md` |
| Contexto estable: infra, familia, máquina, fuentes de datos | `docs/PROYECTO.md` |
| Plan, orden de prompts y backlog | `docs/ROADMAP-producto.md` |
| Estado actual (el traspaso del chat) | `docs/ESTADO-DEL-PROYECTO.md` |
| Diseño de cada área | `docs/<AREA>.md` (p. ej. `ANALISIS-ASISTIDO.md`) |
| Bitácora e índice de prompts | `docs/MAPEO-IMPLEMENTACION.md` |
| Informes de auditoría e historia de series cerradas | `docs/reportes/` |
| Prompts | `docs/prompts/` |
| Diseño visual | Sistema de diseño en la raíz (`README.md`, `SKILL.md`, `ui_kits/`, `preview/`) |
| Archivo: versiones viejas y restos | `docs/archivo/` |
| Trabajo de Code (ignorado por git) | `docs/auditorias/` |

**Cuándo se actualiza cada uno**

- **Al cerrar un prompt** (lo hace Code):
  - la entrada en la bitácora y en el índice de `MAPEO-IMPLEMENTACION.md`;
  - el prompt marcado como hecho en el orden del roadmap;
  - un ADR en `docs/ADR.md`, y su línea en el índice de `CLAUDE.md`, si quedó una decisión que no se re-discute;
  - si cambió el diseño de un área, su documento.
- **Al cerrar una sesión de chat:** el traspaso nuevo **reemplaza** a `ESTADO-DEL-PROYECTO.md`.
- **Hallazgos de una auditoría que tienen que quedar:** van a `docs/reportes/`, nunca solo a `docs/auditorias/`.
- **Cambios de diseño visual:** van al sistema de diseño.

**Reglas**

- Antes de crear un documento, mirá esta tabla: si el tipo ya tiene lugar, va ahí.
- **Mover, no copiar.** Lo que cambia de lugar deja en el lugar viejo una línea que remite.
- **No se borra documentación:** se archiva en `docs/archivo/` con su origen. Solo se borran las copias idénticas.
- Los nombres de los documentos principales no cambian.
- Lo que el código lee (por ejemplo, los prompts de `docs/analisis/`) no se mueve sin cambiar el código en el mismo prompt.
- Si dos documentos se contradicen, no se elige: se reporta y se decide en el chat.

## ADRs — índice

Una línea por ADR, con su título. El texto completo está en `docs/ADR.md`.

- #001 tsc -b con outDir en .tsc-out/ — composite incompatible con noEmit — `docs/ADR.md`
- #002 findMemberByEmail exportada separada — testeable sin mockear Firestore — `docs/ADR.md`
- #003 E2 UI omitida a pedido — data layer implementado en E3 — `docs/ADR.md`
- #004 prescripcionLabel en lib/ — reutilizable desde E3 y E4 — `docs/ADR.md`
- #005 EntrenarSesion fuera del AppShell — pantalla fullscreen sin bottom-nav — `docs/ADR.md`
- #006 "Catálogo" reemplazado por "Salud" en bottom-nav — E2 UI pendiente — `docs/ADR.md`
- #007 [2026-06-04] poseidoPorOwner en seed-vr.ts — `docs/ADR.md`
- #008 [2026-06-04] IDs reservados EJ-9001+ para VR — `docs/ADR.md`
- #009 [2026-06-04] función pura separada del módulo con I/O de Firebase — `docs/ADR.md`
- #010 [2026-06-04] Rangos de IDs reservados para seeds — `docs/ADR.md`
- #011 [2026-06-04] duracionEstimadaMin y totalSeries en seeds son estimaciones — `docs/ADR.md`
- #012 [2026-06-04] Fuerza C (circuito) se recorre lineal en el motor actual — `docs/ADR.md`
- #013 [2026-06-04] Acceso al Catálogo via tabs en /biblioteca — `docs/ADR.md`
- #014 [2026-06-04] Contadores de ejercicios/rutinas separados de la tx de cierre — `docs/ADR.md`
- #015 [2026-06-04] Emails reales en historial de git — decisión pendiente — `docs/ADR.md`
- #016 [2026-06-05] Métricas genéricas en granularidad diaria (no datos crudos) — `docs/ADR.md`
- #017 [2026-06-09] Programa activo por miembro vía doc config/programaActivo — `docs/ADR.md`
- #018 [2026-06-09] Sesión del día por día de semana, con fallback secuencial — `docs/ADR.md`
- **ADR #019** — `Historial.inicioMs/finMs` a nivel sesión, sellados en `finalizarSesion` desde las series. — `docs/ADR.md`
- **ADR #020** ✅ — Import selectivo por defecto: solo cardio que matchea historial o actividades conocidas; "importar todo" es opt-in. — `docs/ADR.md`
- **ADR #021** — El enriquecimiento biométrico es **post-hoc e idempotente**: re-importar el mismo ZIP no duplica ni pisa biometría con datos peores (si el Historial ya tiene `granularidad: "serie"`, no se degrada a "sesion"). — `docs/ADR.md`
- **ADR #022** ✅ — Recomendaciones client-side, puras y explicables: cada recomendación muestra su porqué ("FC reposo +6 bpm vs tus últimas 4 semanas"). — `docs/ADR.md`
- **ADR #023** ✅ — Sin colección nueva para recomendaciones (costo Spark, son derivables). — `docs/ADR.md`
- **ADR #024** ✅ — VR como intervalos: las sesiones VR se modelan con `PrescripcionCardio` formato `"Intervalos"` (`rondas` = series, `trabajoSeg`/ `descansoSeg` por serie, `juegoSugerido` para el chip) en vez de extender el modelo. — `docs/ADR.md`
- **ADR #025** ✅ — Spec autoritativa del match biométrico: `docs/prompts/57-s-match-robusto.md` (S-match, P57). — `docs/ADR.md`
- #026 [2026-09-14] Toda actividad de Samsung Health entra al historial — `docs/ADR.md`
- #027 [2026-09-14] La sustitución de ejercicios se calcula, no se declara — `docs/ADR.md`
- #028 [2026-09-14] La app es la única fuente de qué ejercicio fue — `docs/ADR.md`
- #029 [2026-09-14] El programa es una cola y el atraso se mide en semanas de ciclo — `docs/ADR.md`
- #030 [2026-09-14] Cambiar el día no genera deuda — `docs/ADR.md`
- #031 [2026-09-14] La serie H arranca por puente de archivos, no por cascarón nativo — `docs/ADR.md`
- #032 [2026-09-15] Taxonomía de vías de ingesta de Samsung Health — `docs/ADR.md`
- #033 [2026-09-15] Clave canónica de actividad — `docs/ADR.md`
- #034 [2026-09-15] Precedencia por procedencia del dato — `docs/ADR.md`
- #035 [2026-09-15] Sesiones autodetectadas sin curva — `docs/ADR.md`
- #036 [2026-09-15] La vía D está verificada y pasa a ser el camino objetivo — `docs/ADR.md`
- ADR #037 — La racha se deriva, nunca se acumula (P77a) — `docs/ADR.md`
- ADR #038 — El enriquecimiento se versiona (P79, enmienda el #021) — `docs/ADR.md`
- ADR #039 — La progresión de VR se deriva del historial; la rutina nunca se muta (P79) — `docs/ADR.md`
- ADR #040 — En VR la completitud se mide por TIEMPO, no por rondas (P80, 2026-09-21) — `docs/ADR.md`
- ADR #041 — Lo que cuenta como entrenamiento es una lista POSITIVA (P81, 2026-09-21) — `docs/ADR.md`
- ADR #042 — La app define cuánto dura la sesión; el reloj aporta los datos (P83, 2026-09-22) — `docs/ADR.md`
- ADR #043 — La tolerancia del 12 %: qué muestras entran, no cuánto duró (P92, 2026-09-27) — `docs/ADR.md`
- ADR #044 — Lo medido y lo interpretado no se mezclan (P93, 2026-09-30) — `docs/ADR.md`
- ADR #045 — Las zonas como las cuenta Samsung; la FC máxima es un valor declarado (P97, 2026-10-01) — `docs/ADR.md`
- ADR #046 — Las rutinas de VR por escalones; la rutina no se muta, el modo se elige, umbral provisorio (P98, 2026-10-02) — `docs/ADR.md`

## Serie S — Integración de salud ✅ CERRADA (2026-07-04 → 2026-07-17)

Historia movida a `docs/reportes/series-S-I-H.md`. Quedan acá las reglas que siguen vigentes:

⚠ **P87: `limpiar-salud` no se corre, ni en simulación, hasta que Juan lo diga** (cambió de
comportamiento y su salida real nunca se vio).

> **Nota (P57):** la sección "1c — Robustez del match" de este prompt original
> nunca se implementó (el `docs/prompts/46-s1-*.md` guardado no la tiene — es una
> versión anterior). La spec vigente del match es `docs/prompts/57-s-match-robusto.md`
> — ver ADR #025 más abajo.

1. ✅ `lib/resumenSalud.ts`: `calcularResumenSalud` + `senalPeor`. 36 tests.
   **Umbrales exportados aquí** — S3 los importa (fuente única de verdad).
   Señal de sueño usa `consolidarNoches` (fuente única; no promedio de tramos crudos).

**`lib/sueno.ts`** — fuente única de verdad para sueño consolidado:
`NocheSueno`, `consolidarNoches`, `promedioNoches`. `fecha` = mañana del despertar.
Siesta: inicia 10:00–19:59 Y < 3h. Legacy: `horaAcostarse` ≥ "15:00" → fecha+1.

## Serie I — Insights ✅ CERRADA (2026-07-13 → 2026-07-17)

Historia movida a `docs/reportes/series-S-I-H.md`.

## Serie H — Sync automático de salud (PU1–PU4 construidos, 2026-09-18)

Historia movida a `docs/reportes/series-S-I-H.md`. Quedan acá las reglas que siguen vigentes:

### Vías de ingesta (ADR #032, superseded por #036)
Se clasifican por **de dónde leen**, no por el transporte. Auditoría ZIP vs Drive del
14/09/2026 en `docs/reportes/roadmap-informes-P66.md` §15; verificación de la vía D en §15.8 y §15.9.

| Vía | Qué es | Lee de | Estado |
|---|---|---|---|
| **A** | Health Sync → Google Drive | Health Connect | En uso, automática, **topeada** |
| **B** | Intervals.icu | Health Connect (vía Health Sync) | Descartada, mismo techo |
| **C** | Cascarón Capacitor + plugin de **Health Connect** | Health Connect | Descartada, mismo techo |
| **E** | App Wear OS + Samsung Health Sensor SDK | El sensor del reloj | Descartada por costo |

_Fila D (es estado) movida a `docs/reportes/series-S-I-H.md`._

**La vía A no se retira.** Es la única automática hoy (cardio, pasos, sueño, FC pasiva); la
D la complementa en el hueco que A no cubre. **Health Sync sigue siendo necesario** aunque
se adopte la D: es el puente que mete la medición de la balanza en Samsung Health (`docs/reportes/roadmap-informes-P66.md` §15.9).

Reglas que valen para cualquier vía: clave canónica = inicio en epoch ms UTC + tipo
normalizado + `appId`, con tabla de fuentes declarada (ADR #033, enmendado en P66f); el tipo
del workout custom es `otro`, nunca `fuerza`; ningún cero ni dato derivado pisa un dato
medido (ADR #034); sesiones autodetectadas sin curva (ADR #035); composición corporal en
series por fuente de medición, sin merge entre fuentes (`docs/reportes/roadmap-informes-P66.md` §15.9).

### Riesgo central: idempotencia por dos vías
El bloque 5 deriva el id de una entrada externa del `datauuid` de Samsung. Si el mismo
entrenamiento llega por ZIP y por Drive y el identificador no viaja, se generan dos
entradas distintas para el mismo hecho. **La clave determinista compartida hay que
definirla con los archivos del spike a la vista**, no antes — y ambas vías deben producir
exactamente el mismo id. El import por ZIP no se elimina: queda como respaldo y para la
historia previa.

> **Resuelto por el ADR #033 (P66e, enmendado en P66f):** la clave es el inicio en epoch ms
> UTC + el tipo normalizado + `appId`, con comparación exacta y una tabla de fuentes
> declarada (origen o puente, preferencia, exclusión por campo). Las tres vías entregan
> `1789418092506` para la misma sesión. El `datauuid` baja a metadato, aunque por la vía D
> viaja como `uid`. El tipo del workout custom es `otro`, nunca `fuerza`. Ver §16.9 de
> `docs/reportes/roadmap-informes-P66.md` sobre cómo obtener `appId` en las vías que no lo entregan.

### Regla heredada de la serie S
Todo timestamp en epoch ms UTC; conversión a local solo al mostrar. Los bugs de zona
horaria fueron el enemigo número uno de la serie S.

## Configuración: un solo lugar (P86, 2026-09-25)

Pedido del owner: **todo lo configurable vive en Perfil → Configuración**, no en la pantalla
donde se usa ni en la consola de Firebase. Reglas puras en `lib/configuracion.ts`.

- Por miembro (`EditorPerfil`): lugar, equipo por lugar, objetivos, meta semanal, y **FC
  máxima + zonas** (editables desde P86; antes de solo lectura, con un texto falso sobre
  la edad). Apariencia y estilo de inicio.
- Solo owner (tarjeta "Familia y datos"): **visibilidad** por miembro (`/config/visibilidad`),
  **juegos que no cuentan** (antes se editaban adentro de `SesionJuego`) y **duración
  mínima del import** (`/config/import`).
- `actividadesSiempreRelevantes` **no se ofrece**: desde P75 la regla 5 de
  `clasificarImport` deja entrar cualquier actividad que llegue al mínimo, así que la lista
  solo cambia el texto del motivo. Si algún día vuelve a decidir algo, se agrega.
- Si aparece un parámetro nuevo que alguien pueda querer cambiar, va acá.

## Roadmap (ideas evaluadas, orden tentativo)

Movido a `docs/reportes/pendientes-anteriores-a-P100.md`. Lo vigente está en `docs/ROADMAP-producto.md`.
