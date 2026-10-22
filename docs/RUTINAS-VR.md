# Rutinas de VR por escalones — diseño

Las decisiones están en el **ADR #046** (`docs/ADR.md`), con sus enmiendas al #039 y al #040. Acá va
cómo quedó implementado lo que el ADR no detalla (P98, 02/10/2026; P102, 15/10/2026). El código está en
`src/lib/escalonesVR.ts` (la regla), `src/lib/catalogoVR.ts` (las rutinas y el programa) y las
pantallas `InicioEscalonVR`, `CierreEscalonVR` y `ProgresionEscalonesVR`.

## Series por dificultad declarada (enmienda del 02/10 al ADR #046)

La regla no compara sesiones jugadas en dificultades distintas. Dentro de una rutina, un escalón, un
modo y un juego, cada **dificultad declarada al cerrar** es una serie:

| | La serie de la dificultad prevista | Las otras («Mixto» incluida) |
|---|---|---|
| Referencia y última sesión | Dentro de la serie | Dentro de la serie |
| 3 sesiones, 2 semanas, «dos seguidas» | Dentro de la serie | Dentro de la serie |
| Estado y números | Se calculan y se muestran | Se calculan y se muestran |
| ¿Es una propuesta? | **Sí**: puede proponer subir (o bajar, en Ritmo suave) | **No**: informativa, sin botón |
| ¿Se excluye alguna sesión por la dificultad? | No | No |

La serie prevista aparece siempre, aunque todavía no tenga sesiones. Después vienen las demás
dificultades, «Mixto» y, al final, las sesiones sin dificultad declarada. El código está en
`evaluarSeriesVR` (`src/lib/escalonesVR.ts`).

**Sin dificultad declarada** (decisión del 02/10): el cierre (`CierreEscalonVR`) no deja guardar sin
elegir la dificultad; «Guardar» queda deshabilitado hasta entonces. Si alguna sesión llega igual sin
ella, como respaldo, forma su propia serie informativa, que nunca propone. Contestar si se completó
sigue siendo opcional: sin respuesta, la sesión no cuenta como completada.

## Los motivos de «mantener»

El estado «mantener» se muestra con el motivo a la vista (`MotivoReglaVR`). Son cinco:

| Motivo | Cuándo |
|---|---|
| `fc-subio` | La FC media de la última sesión subió el umbral o más contra la referencia |
| `no-completo-dos-seguidas` | Las dos últimas sesiones no contaron como completadas |
| `incompletas` | Alguna sesión del escalón no contó como completada, sin ser dos seguidas |
| `fc-sin-bajar` | Todas completadas, pero la FC bajó menos que el umbral |
| `en-el-tope` | Se darían las condiciones para subir, pero ya está en el último escalón |

En Ritmo suave, que no tiene escalera, «mantener» tiene un motivo propio: `debajo-techo`, cuando la
FC no pasó el techo de Z3 en las dos últimas sesiones.

## Las exclusiones van antes de contar

Las sesiones con `fcDudosa`, con cobertura del reloj baja, con discrepancia de duración o sin FC
media quedan fuera del cálculo **antes** de contar. Las 3 sesiones, las 2 semanas distintas y las
«dos seguidas» se cuentan solo entre las que entran. Las excluidas se muestran aparte, con su
motivo.

## El modo que se ofrece primero

Es el de la rutina (`RutinaVR.modoPorDefecto`): por bloques en Combat largo y en Creed, de corrido
en Ritmo suave. **No sale de la última sesión**, como en las rutinas viejas (P80). Combat corto
tiene un solo modo (1 × 20 sin descanso) y no pregunta.

## El juego alternativo de Ritmo suave

Si se elige PowerBeats al empezar, la sesión guarda PowerBeats como el ejercicio del bloque y en
`Historial.vr.idEjercicio`. **No se registra como una sustitución de P73**: es un juego elegible de la
rutina, no un cambio en el momento. La regla lo evalúa por separado de Beat the Beats.

## Salir a mitad de sesión (03/10)

Una sesión de VR por escalones **se guarda solo desde el cierre**, con la dificultad. La ✕ y el
«atrás» abren la hoja de salida en las tres pantallas (arranque, reloj y cierre), pero sin «Guardar
y salir»: quedan «Salir sin guardar», «Seguir entrenando» y «Reiniciar sesión».

- **Salir sin guardar** descarta la sesión en Firestore (`descartarSesion`) y en el teléfono. Con
  tiempo jugado pide confirmación y lo dice en minutos («Se descartan 40 min jugados.»): en el reloj
  no hay ninguna serie hasta «Terminar», así que contar series no alcanzaba.
- **Reiniciar sesión** vuelve al arranque (elegir modo y juego), con la misma confirmación por
  minutos. Conserva la `SesionProgramada`, como en el resto de las rutinas.

Los minutos salen de `minutosJugadosVR` (`lib/entrenarState.ts`): de «Empezar» a «Terminar», o
hasta ahora si el reloj sigue. Las rutinas que no son de VR por escalones no cambiaron.

## La guía de bloques (P102, 15/10)

Código en `src/lib/guiaBloquesVR.ts` y `SesionPorTiempo.tsx`. Vale en todas las rutinas de VR por
escalones y en la a medida. **Guía, no corta ni pide toques**: sale solo del tiempo desde «Empezar»
y de la prescripción sellada (ADR #040 y #046 siguen).

Debajo del reloj total, en hora local de 24 h:

- **Bloque:** «Bloque 1 de 2 · quedan 12:34 (hasta las 16:20)».
- **Descanso:** «Descanso · quedan 1:15 (bloque 2 a las 16:22)». Sin descanso después del último bloque.
- **Siempre:** «Fin previsto 17:02».
- **Pasado el fin:** «Cumplido a las 17:02 · +3:10». Es tiempo de más, no un error.
- **De corrido (1 bloque):** solo el reloj y el fin previsto.

En el arranque (`InicioEscalonVR` y el a medida): «Si empezás ahora, terminás a las 17:02». Se
actualiza cada minuto.

**Pitidos** (`lib/audioAlert.ts`: `playFinBloque`, `playFinDescanso`, `playFinSesion`): tres sonidos
distinguibles. Suenan solo los cambios que pasan con la pantalla montada. Al reabrir la sesión no
suenan los ya pasados (`pitidoDeTransicion` con fase anterior `null` no suena). Si el `AudioContext`
está suspendido (se reabrió la sesión sin tocar la pantalla), el reloj muestra «Tocá la pantalla para
activar el sonido», que se va con el primer toque (`audioSuspendido` en `audioAlert.ts`).

## VR a medida (P102, 15/10)

`RUT-0030` «VR — A medida» (`src/lib/catalogoVR.ts`; la parte pura en `src/lib/vrAMedida.ts`; el
arranque en `InicioAMedidaVR.tsx`). Decisión en la enmienda del 15/10 al ADR #046.

- **Juego:** uno de los cuatro de P98. Les Mills BodyCombat por defecto; alternativas Creed, Beat the
  Beats y PowerBeats. Los juegos que no cuentan como entrenamiento no se ofrecen.
- **Controles:** bloques de 1 a 4, minutos por bloque de 15 a 40 (de a 5), descanso de 0 a 3 min (de a
  30 s). Los rangos viven en `RutinaVR.aMedida`.
- **Valores iniciales:** la última configuración con ese juego **en esta rutina** (sale de
  `vr.prescripto` del historial). Sin historia: con Les Mills, el escalón actual de Combat largo por
  bloques (vía `sigueA`); con los demás, 2 × 15 con 2:00.
- **Si el historial tarda:** «Cargando tu última configuración…» hasta 3 s, con «Empezar» habilitado.
  Si llega antes y no se tocó ningún control, los valores se actualizan; si ya se tocó alguno, no se
  pisan. Pasados los 3 s, o sin señal, queda el respaldo y no se dice nada.
- **Dificultad prevista:** no sale del historial. Les Mills, la de Combat largo; los demás, «base».
- **Modo:** con 1 bloque se sella `descansoSeg: 0` y modo `corrido` (con un bloque el descanso nunca
  se usa); si no, `bloques`.
- **Sin escalera:** `regla: "ninguna"`, escalera de un solo escalón (valor inicial y respaldo).
  `RutinaDetalle` dice «Sin escalera: elegís los tiempos al empezar». No propone nada.
- **Cierre:** el mismo, `CierreEscalonVR` (completó y dificultad; «Guardar» deshabilitado hasta
  elegir la dificultad).
- **Dónde está:** no va en el PRG-0013. Se llega desde «Cambiar» (Home y Entrenar) y desde Entrenar.
- **Para después:** la sesión guarda juego, configuración, dificultad y si completó, para agrupar
  series informativas por configuración (backlog).

## La sesión vieja en el cierre (P102, 15/10)

Caso: una sesión de VR por escalones que quedó **en el cierre** hace más de 12 h (la de prueba del
02/10 dejaba «Seguir entrenando» en un cierre de hace 13 días que guardaba 0 minutos). La decide
`cierreViejoVR` (`lib/entrenarState.ts`), en el montaje de `EntrenarSesion` y en `HojaSalida`.

| Caso | Qué pasa |
|---|---|
| Vieja, en el cierre, menos de 1 min jugado | Se reinicia sola |
| Vieja, en el cierre, 1 min o más | Hoja con el contexto («quedó abierta desde…») |
| Vieja con el reloj corriendo (sin «Terminar») | Se reinicia sola, como antes; lo que midió el reloj entra por el puente (ADR #026) |

La hoja ofrece:

- **Guardar la de ese día:** va al cierre, para elegir la dificultad. Se guarda con `fechaMs` = inicio
  del juego, así `fechaRealizada` y `semanaInicio` son los de ese día. `finalizarSesion` recibe la
  opción nueva `fechaMs`; en el cierre de VR por escalones se pasa siempre.
- **Descartar y empezar de nuevo:** descarta la `SesionProgramada` vieja (Firestore y teléfono),
  crea una nueva y vuelve al arranque.
- **Salir sin guardar.**

Sin «Seguir entrenando» ni «Reiniciar», y tocar afuera no cierra la hoja.

## «Ver todas» por Programas (P103, respuesta del 22/10)

En la pestaña Programas de Biblioteca no se empieza ninguna sesión, así que la franja «Cambiando…» se
oculta ahí (P103, Bloque 3); el cambio sigue en la URL y vuelve al pasar a Rutinas o Ejercicios.
**Decidido el 22/10: alcanza con eso.** La prevista no viaja por `ProgramaDetalle` → rutina.
