# 102 — Cambiar lo que toca hoy, VR a medida y el reloj que guía los bloques

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**.

**Regla general:** si algo de este prompt no entra en el modelo actual o choca con un ADR, **pará y reportá** antes de escribir código. No lo reinterpretes. No commitees: al terminar mostrá la lista de archivos. Cualquier escritura en Firestore la corre Juan a mano.

Va **antes de P99**. P99 (marcas y análisis) no toca nada de esto.

---

## Qué problema resuelve

Juan usó la app el 15/10 y encontró cuatro cosas.

1. **Combat largo «salta» al cierre.** Al abrirla, pide la dificultad sin haber jugado. No es el arranque: el arranque desde cero funciona (Empezar → reloj → Terminar → cierre). Es la sesión de prueba del 02/10 (`SES-20261002205619-jjmxi6`, RUT-0026), que quedó en el teléfono **en el cierre**. Como tiene una serie registrada (la de «Terminar»), al montar se abre la hoja «quedó abierta desde el viernes 02/10» encima del cierre, y «Seguir entrenando» deja a Juan en un cierre de hace 13 días que, si guarda, registra 0 minutos.
2. **El reloj de VR no guía los bloques.** En modo por bloques muestra solo el total. Con el visor puesto, Juan necesita saber en qué bloque está, cuándo descansa y a qué hora termina, sin tocar nada.
3. **No hay forma de cambiar lo que toca hoy.** La tarjeta «Hoy toca» de Home solo tiene «Empezar». El cambio está diseñado desde septiembre (ROADMAP bloque 11, **ADR #030**) y nunca se construyó.
4. **No hay una VR con tiempos a elección.** Juan quiere poner él los bloques, los minutos y el descanso. Hace sobre todo Les Mills.

Y un hallazgo de la revisión: **«Ya entrenaste hoy» mira toda la semana, no el día.** `sesionDeHoy` marca `yaHecha` si hay *cualquier* sesión de la semana con esa rutina. En el PRG-0013, Combat largo va lunes y viernes y Ritmo suave martes y jueves: si Juan hizo Combat largo el lunes, el viernes la tarjeta dice «Ya entrenaste hoy» y no muestra «Empezar».

## Decisiones cerradas

1. **El reloj guía, no corta ni pide toques.** La guía de bloques sale solo del tiempo transcurrido desde «Empezar» y de la prescripción sellada. No se marca nada durante la sesión (ADR #040 y #046 siguen en pie). Si Juan se pasa, es tiempo de más, no un error.
2. **La guía va en todas las rutinas de VR por escalones** (Combat largo, Creed, Ritmo suave, Combat corto) **y en la nueva a medida.**
3. **Horas de fin, en hora local (24 h):** la del bloque o descanso en curso, entre paréntesis, y la **hora de fin prevista** de toda la sesión. En el arranque, antes de «Empezar», también: «Si empezás ahora, terminás a las 17:02».
4. **Pitidos en cada cambio**, con `lib/audioAlert.ts`: fin de bloque, fin de descanso, fin de la sesión prevista. Tres sonidos distinguibles. Solo suenan los cambios que pasan con la pantalla montada: al reabrir la sesión no se disparan los que ya pasaron.
5. **VR a medida: una rutina nueva, `RUT-0030`, «VR — A medida».**
   - Sirve para **cualquiera de los cuatro juegos de ejercicio** de P98 (Les Mills BodyCombat, Creed, Beat the Beats, PowerBeats). **Les Mills es el juego por defecto.** Los juegos que no cuentan como entrenamiento no se ofrecen.
   - Al empezar se configuran **bloques** (1 a 4), **minutos por bloque** (15 a 40, de a 5; respeta el piso de 12 min de P98) y **descanso** (0 a 3 min, de a 30 s). Un bloque sin descanso es «de corrido».
   - **Valores iniciales:** la última configuración usada **con ese juego** en esta rutina (sale del historial, `vr.prescripto`). Sin historia: con Les Mills, el escalón actual de Combat largo por bloques; con los demás, 2 × 15 con 2:00.
   - **`regla: "ninguna"`**, como Combat corto: con tiempos libres, comparar escalones no tiene sentido. La sesión guarda todo lo necesario (juego, configuración, dificultad, completó) para que más adelante se puedan agrupar como series informativas las sesiones con la **misma configuración**. Eso va al backlog, no a este prompt.
   - Usa el mismo cierre (`CierreEscalonVR`): completó y dificultad, con «Guardar» deshabilitado hasta elegir la dificultad.
   - No se agrega al PRG-0013: se llega desde «Cambiar» y desde Entrenar.
6. **Cambiar desde la tarjeta (ADR #030, bloque 11):**
   - Botón secundario **«Cambiar»** junto a «Empezar», en la tarjeta de Home (los tres layouts) y en la de Entrenar.
   - Abre una hoja con, en este orden: **VR a medida**; las **otras rutinas del programa activo**; **otras rutinas de VR** (Combat corto incluida); **sesión libre**; y «Ver todas» (Biblioteca). El juego que no cuenta (`SesionJuego`) **no** se ofrece: no es entrenamiento.
   - **Motivo opcional**, en chips: «Poco tiempo», «Cansado», «Me duele algo», «Ganas de otra cosa». Sin elegir, se puede seguir.
   - La sesión guarda **`Historial.rutinaPrevista`** (la que tocaba) y **`motivoCambio`** (o nada). La realizada es `idRutina`, o `tipo: "libre"`. La prevista se guarda en `EntrenarState`, así sobrevive a cerrar la app.
   - **El plan avanza, sin deuda:** la prevista no queda trabada.
   - Fuera de este prompt (siguen en el backlog): el aviso a la tercera vez que se esquiva la misma rutina (11.4) y la métrica de cobertura del plan (11.3).
7. **«Ya entrenaste hoy» se calcula sobre el día, no sobre la semana:** hay una sesión de ShapeUp **de hoy** (fecha local, el mismo criterio que ya usa Home) con `idRutina` igual a la de hoy, **o con `rutinaPrevista` igual**. Con un cambio hecho hoy, la tarjeta dice «Ya entrenaste hoy» y, en una línea, qué hiciste en su lugar.
8. **Cobertura de la semana (`proximaSesion`):** una sesión con `rutinaPrevista` cubre el día de **la prevista**, no el de la realizada. Así, cambiar el miércoles Creed por Combat no «consume» el Combat largo del viernes.
9. **Sesión de VR por escalones que quedó en el cierre (vieja, más de 12 h):**
   - Con **menos de 1 minuto** jugado: se reinicia sola, como ya pasa con las sesiones viejas sin series.
   - Con 1 minuto o más: la hoja de salida, con el contexto («quedó abierta desde…»), ofrece **«Guardar la de ese día»** (va al cierre, para elegir la dificultad), **«Descartar y empezar de nuevo»** (descarta en Firestore y en el teléfono, y vuelve al arranque con una sesión nueva) y «Salir sin guardar». **No** ofrece «Seguir entrenando».
   - La sesión vieja con el **reloj corriendo** (sin «Terminar») queda como está: se reinicia sola. Lo que midió el reloj entra igual por el puente (ADR #026).

---

## Cómo repartir el trabajo (agentes y modelos)

Usá subagentes donde ahorren tiempo, con el modelo que alcance para cada tarea. Repartilo así:

| Qué | Cómo | Modelo |
|---|---|---|
| Parte 1, diagnóstico | Un agente de exploración, solo lectura | El más liviano que alcance |
| Parte 2 (guía de bloques) y Parte 3 (la parte pura de la rutina a medida: valores iniciales y límites) | En paralelo: solo tocan `src/lib/` y sus tests | Intermedio |
| Partes 3 (pantalla), 4 y 5 | **En serie, sin paralelo:** las tres tocan `EntrenarSesion`, `HojaSalida` y Home | El principal |
| Parte 6, documentación | Un agente aparte, al final | Intermedio |
| Revisión final | Un agente que **no** haya escrito el código. Revisa el diff contra las decisiones cerradas y corre `tsc` y `vitest` | El principal |

**Reglas para el reparto:**
- Dos agentes nunca editan el mismo archivo a la vez.
- Lo que reporta cada agente lo integrás vos.
- El «pará y reportá» vale también para los subagentes: si uno encuentra un choque con un ADR, se frena todo y se reporta.

## Parte 1 — Diagnóstico corto (solo lectura)

Reportá y seguí, salvo que algo choque:

- Si `RutinaVR` puede llevar la configuración a medida (rangos) sin romper `escalonDeHoy`, `evaluarSeriesVR` ni el seed. Proponé lo mínimo: por ejemplo, un campo `aMedida` con los rangos y una escalera `bloques` de un solo escalón que funcione como valor inicial. Si no entra limpio, **pará y reportá**.
- Si `Historial` admite `rutinaPrevista` y `motivoCambio` sin tocar reglas. Las de `/historial` no validan campos (P98), pero confirmalo.
- Si `sesionLibre` puede recibir la prevista por el mismo camino que `EntrenarSesion`.
- Con qué formato está `fechaRealizada`, y si «de hoy» se puede calcular sin lecturas nuevas en Home.

## Parte 2 — La guía de bloques (lib + reloj)

- Una función pura en `src/lib/escalonesVR.ts` (o un archivo nuevo en `src/lib/`): `guiaBloquesVR(prescripto, inicioMs, now)` devuelve la fase (`bloque`, `descanso` o `terminado`), el número y el total de bloques, lo que queda de la fase en segundos, la hora de fin de la fase, la **hora de fin prevista** y el tiempo de más. Sin descanso después del último bloque.
- En `SesionPorTiempo`:
  - **Bloque:** «Bloque 1 de 2 · quedan 12:34 (hasta las 16:20)».
  - **Descanso:** «Descanso · quedan 1:15 (bloque 2 a las 16:22)».
  - **Debajo, siempre:** «Fin previsto 17:02».
  - **Pasado el fin:** «Cumplido a las 17:02 · +3:10».
  - En modo corrido, solo el reloj y «Fin previsto».
  - El reloj grande sigue siendo el total. El diseño exacto lo decide Code con los tokens; la hora entre paréntesis es lo que pidió Juan.
- En `InicioEscalonVR` (y en el arranque a medida): «Si empezás ahora, terminás a las 17:02». Se actualiza cada minuto.
- Los pitidos de la decisión 4. Si el `AudioContext` está suspendido, no rompe nada.
- **Tests:** la función pura en los bordes (justo al fin de un bloque, en el descanso, en el último bloque, pasado el fin, `descansoSeg` 0, 1 bloque) y que no suene un pitido retroactivo al remontar.

## Parte 3 — VR a medida

- `RUT-0030` en `src/lib/catalogoVR.ts`, así el seed existente (`seed:rutinas-vr`, idempotente) la crea. Actualizá `SEEDS.md`.
- El arranque: juego (Les Mills primero), bloques, minutos y descanso con controles grandes de − / +, el total, la hora de fin y «Empezar». Sella `vrEscalon` con `prescripto` = lo configurado, `escalon: 1`, y `modo` = `corrido` si es 1 bloque sin descanso, si no `bloques`.
- `evaluarSeriesVR` y `ProgresionEscalonesVR` no la muestran como escalera: con `regla: "ninguna"` no propone nada. En `RutinaDetalle`, un texto corto: «Sin escalera: elegís los tiempos al empezar».
- **Tests:** los valores iniciales (por juego, desde el historial; el respaldo de Combat largo; el respaldo genérico), los límites de los controles y que el modo salga bien.

## Parte 4 — Cambiar lo que toca hoy

- `lib/`:
  - `sesionDeHoy` con la regla del día (decisión 7);
  - `proximaSesion` con la cobertura por la prevista (decisión 8).
  - **Tests:** el caso Combat largo lunes y viernes (el viernes **sí** muestra «Empezar»), un cambio hoy, un cambio otro día, una libre con prevista.
- **La hoja «Cambiar»** (decisión 6): elegir lleva a la sesión elegida con la prevista y el motivo. Al guardar, el `Historial` lleva `rutinaPrevista` y `motivoCambio`. Cerrar la hoja no cambia nada.
- **En `HistorialDetalle`:** una línea «En lugar de Creed · Poco tiempo», si corresponde.
- **Tests:** la prevista sobrevive en `EntrenarState` y llega a `finalizarSesion`; sin cambio, no se escribe nada nuevo.

## Parte 5 — La sesión vieja en el cierre

Lo de la decisión 9, en el efecto de montaje de `EntrenarSesion` y en `HojaSalida`. Tests en `EntrenarSesion.salidaVR.test.tsx`:
- **Vieja, en el cierre, con 0 minutos:** arranca en «Empezar».
- **Vieja, en el cierre, con 40 minutos:** muestra la hoja sin «Seguir entrenando». «Guardar la de ese día» lleva al cierre; «Descartar y empezar de nuevo» llama a `descartarSesion` y deja el arranque con una sesión nueva.

## Parte 6 — Documentación

Según la tabla de `CLAUDE.md`:
- `docs/RUTINAS-VR.md`: la guía de bloques, la rutina a medida y la sesión vieja en el cierre.
- `docs/ADR.md`: una **enmienda del #046** (la rutina a medida, con `regla: "ninguna"`, y la guía informativa) y una nota en el **#030** (construido en P102, sin el aviso de esquive ni la cobertura). La línea del índice de `CLAUDE.md`, si cambia el título.
- `docs/ROADMAP-producto.md`:
  - bloque 11, construido en parte;
  - P102 en el orden;
  - en el backlog: las series informativas por configuración de la rutina a medida, el aviso de esquive y la cobertura.
- `docs/MAPEO-IMPLEMENTACION.md`: la bitácora y el índice.

## Qué reportar

En `docs/auditorias/ultimochat.md`, sobrescribiéndolo:
- lo del diagnóstico;
- qué cambió en el modelo;
- los archivos tocados;
- `npx tsc -b` limpio y `npx vitest run` verde (sin emulador, la suite de reglas se saltea);
- **el orden para Juan:**
  1. el seed en seco y con `-- --aplicar`, para crear `RUT-0030` **antes** del deploy;
  2. commit;
  3. push, y confirmar `origin/main` = `HEAD`;
  4. deploy del hosting (las reglas no cambian, salvo que el diagnóstico diga otra cosa);
- **qué mirar en el teléfono, en claro y en oscuro:**
  - la guía de bloques y las horas;
  - los pitidos;
  - la rutina a medida;
  - «Cambiar» en Home;
  - que el viernes Combat largo muestre «Empezar».

Preguntas abiertas: cualquier cosa que no hayas podido decidir sin reinterpretar.
