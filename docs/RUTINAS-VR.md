# Rutinas de VR por escalones — diseño

Las decisiones están en el **ADR #046** (`docs/ADR.md`), con sus enmiendas al #039 y al #040. Acá va
cómo quedó implementado lo que el ADR no detalla (P98, 02/10/2026). El código está en
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
dificultades, «Mixto» y, al final, las sesiones sin dificultad declarada. Cómo tratar estas últimas
está pendiente de decisión; mientras tanto forman su propia serie informativa. El código está en
`evaluarSeriesVR` (`src/lib/escalonesVR.ts`).

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

## Salir a mitad de sesión

Si se sale con la hoja de salida antes de «Terminar», la sesión se guarda **sin escalón**
(`Historial.vr` ausente), y la regla no la cuenta.
