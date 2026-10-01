# 98 — Las rutinas de VR y cómo avanzar

Repo: `jpcofano/shapeup`.

**Regla general:** si algo de este prompt no entra en el modelo actual o choca con un ADR, **pará y reportá** antes de escribir código. No lo reinterpretes. No commitees. Cualquier escritura en Firestore la corre Juan a mano.

---

## Qué problema resuelve

Hoy hay una sola rutina de VR, escrita como 5 rondas de 5 minutos con descanso. Juan no juega así. Por eso el análisis de P93 le marcó como fallas cosas que en realidad son de la rutina, como "duró el doble de lo prescripto" o "una sola serie".

Además, no hay ninguna regla que diga cuándo avanzar. Este prompt arma el catálogo y las rutinas de VR, y una regla de progresión que **calcula el sistema** a partir de lo medido.

## Decisiones cerradas

1. **Las rutinas se definen por tiempo, no por lo que dura cada entrenamiento del juego.** Un bloque es, por ejemplo, 20 minutos de trabajo. Juan lo completa encadenando los entrenamientos del juego que hagan falta (uno de 20, o uno de 15 más uno de 5) y sigue los tiempos él mismo. La prescripción es fija y no depende de cómo vengan armados los juegos.
2. **Bloques largos siempre que se pueda.** Ningún bloque baja de 12 minutos. Con el visor puesto, parar cada pocos minutos no funciona.
3. **Cada rutina tiene dos modos: por bloques o corrido.** En modo corrido se juega todo el tiempo sin descansos. El modo se elige al empezar la sesión y queda guardado en ella. **La regla nunca compara sesiones de modos distintos,** porque los descansos cambian la FC media.
4. **No se marca nada durante la sesión.** Al cerrarla, Juan confirma si completó lo prescripto y en qué nivel o dificultad jugó; la dificultad puede ser `mixto`. El sistema contrasta lo que confirma con la duración de la ventana.
5. **La evidencia de la progresión es la FC media de toda la ventana de la sesión**, descansos incluidos. Es justo comparar así porque dentro de un mismo escalón y modo la estructura es la misma.
6. **El sistema calcula la progresión y el análisis la explica.** Por el ADR #044, el análisis nunca decide: recibe el estado de la regla y lo cuenta en palabras, sin poder contradecirlo ni saltearse un escalón.
7. **El sistema propone y Juan acepta.** Nunca se cambia una rutina sola. Cada subida aceptada queda registrada: cuándo, de qué escalón a cuál, en qué modo y con qué datos.
8. **El visor es equipo, no lugar.**
9. **Meta semanal de 5 días, todos de VR por ahora.** Más adelante se suma fuerza. Nunca dos días duros seguidos.
10. **El umbral de 5 latidos es un punto de partida, no un dato medido.** Tiene que quedar configurable en un solo lugar, para revisarlo después de un mes con datos reales.

---

## Parte 1 — Diagnóstico (solo lectura)

Antes de tocar nada, reportá:

- Cómo está modelado hoy un ejercicio de VR en el catálogo, y cómo lo está una rutina: sus campos de prescripción, dónde vive y quién la lee.
- Si una rutina puede tener dos modos, o si conviene modelarlos como dos rutinas vinculadas. Proponé lo más simple.
- Si una sesión puede guardar el modo, si se completó lo prescripto y la dificultad, sin marcas durante la sesión.
- Qué guarda hoy `prescripcionUsada` en las sesiones de VR.
- Si ya existe algo parecido a escalones o progresión. El roadmap habla de una escalada de dificultad, descanso y rondas guiada por la FC.
- Qué sesiones y qué rutinas referencian hoy a la rutina actual de PowerBeats.

Si el modelo no admite escalones y modos sin un cambio grande, **pará y reportá** con una propuesta.

## Parte 2 — El catálogo

Cuatro ejercicios, con el visor como equipo:

| Ejercicio | Dificultad |
|---|---|
| Les Mills BodyCombat | `principiante` / `intermedio` / `avanzado` |
| Creed: Rise to Glory | La del juego; se parte de la que trae por defecto |
| Beat the Beats VR | La del juego |
| PowerBeatsVR | La del juego |

## Parte 3 — Las rutinas y sus escaleras

Se sube de a un escalón por vez, y la escalera de cada modo es independiente.
- **Por bloques**, el orden de lo que cambia es: dificultad, después descanso, después un bloque más.
- **Corrido**, el orden es: dificultad, después más minutos.

### Combat largo — Les Mills, 2 veces por semana, objetivo Z3-Z4

**Por bloques:**

| Escalón | Bloques | Nivel | Descanso |
|---|---|---|---|
| E1 (inicial) | 2 × 20 min | Intermedio | 2 min |
| E2 | 2 × 20 min | Avanzado | 2 min |
| E3 | 2 × 20 min | Avanzado | 1:30 |
| E4 | 2 × 20 min | Avanzado | 1 min |
| E5 (tope) | 3 × 20 min | Avanzado | 1 min |

**Corrido:**

| Escalón | Tiempo | Nivel |
|---|---|---|
| E1 (inicial) | 40 min | Intermedio |
| E2 | 40 min | Avanzado |
| E3 | 50 min | Avanzado |
| E4 (tope) | 60 min | Avanzado |

### Creed — 1 vez por semana, objetivo Z4-Z5

**Por bloques:**

| Escalón | Bloques | Dificultad | Descanso |
|---|---|---|---|
| E1 (inicial) | 3 × 12 min | Por defecto | 2 min |
| E2 | 3 × 12 min | Una más | 2 min |
| E3 | 3 × 12 min | Una más | 1:30 |
| E4 | 3 × 12 min | Una más | 1 min |
| E5 (tope) | 4 × 12 min | Una más | 1 min |

**Corrido:**

| Escalón | Tiempo | Dificultad |
|---|---|---|
| E1 (inicial) | 30 min | Por defecto |
| E2 | 30 min | Una más |
| E3 (tope) | 40 min | Una más |

### Ritmo suave — Beat the Beats o PowerBeats, 2 veces por semana, objetivo Z2-Z3

- Su modo por defecto es **corrido, 30 min.** Por bloques sería 2 × 15 min con 2 min de descanso.
- **No tiene escalera, a propósito.** Su trabajo es quedarse suave.
- La regla es la inversa: si la FC media pasa el techo de Z3 en dos sesiones seguidas, se sugiere **bajar** la dificultad.

### Combat corto — Les Mills, comodín para días con poco tiempo

- Es 1 bloque de 20 min.
- Sigue el nivel del escalón actual de Combat largo por bloques.
- No tiene escalera propia y **no cuenta** para la regla de Combat largo.

**Semana de referencia** (5 días): Combat largo, Ritmo suave, Creed, Ritmo suave, Combat largo. Es solo una guía en la documentación, no algo que la app imponga.

## Parte 4 — La regla

Se evalúa por rutina **y por modo**.

**Subir** — se propone cuando se cumplen todas:
- Hay por lo menos **3 sesiones** en el escalón y modo actuales, en al menos **2 semanas** distintas.
- En todas se completó lo prescripto. Lo confirma Juan, y la ventana de la sesión dura por lo menos el 90 % del tiempo prescripto.
- La FC media de las últimas sesiones es por lo menos **5 latidos más baja** que la de las dos primeras del escalón.

**Mantener** — se muestra, sin cambiar nada, cuando:
- la FC media subió 5 latidos o más, o
- no se completó lo prescripto en dos sesiones seguidas.

**Quedan afuera del cálculo** las sesiones con `fcDudosa`, las que tienen poca cobertura del reloj (usá el umbral que ya exista), y las que tienen `ventanaOrigen: 'series'` con `discrepanciaDuracion`.

**Dónde vive la regla:** en una función pura, testeable, que devuelva el estado (`subir`, `mantener`, `sin datos suficientes` o `bajar dificultad` para Ritmo suave), junto con los números que lo sostienen. **No entra en la racha, la adherencia ni el tonelaje, y el análisis no puede modificarla.**

**En la app:**
- Al empezar, se elige el modo, y se muestra el escalón de ese modo con sus tiempos.
- Un aviso en la rutina con el estado de la regla y los números.
- Un botón **Subir de escalón** que actualiza la rutina y registra la subida.

## Parte 5 — El paquete del análisis

El paquete de P93 suma:
- el modo y el escalón actual de la rutina;
- el estado de la regla, con sus números.

El prompt de análisis vigente, que es la v3 si ya existe (si no, coordiná con esa enmienda), suma una regla: **explicá el estado de la progresión con esos números. Nunca propongas otro escalón ni contradigas la regla.** Y deja de sugerir marcar series durante la sesión.

## Parte 6 — El script

`scripts/seed-rutinas-vr.ts`, con un comando de npm:
- **Crea** los 4 ejercicios y las 4 rutinas, con sus dos modos y sus escaleras, en el escalón E1.
- **Es idempotente:** si se corre dos veces, no duplica nada.
- **Corre en seco por defecto**, mostrando lo que haría. Aplica con `npm run <comando> -- --aplicar`.
- **La rutina actual de PowerBeats se archiva, no se borra.** Hay sesiones viejas que la referencian.
- Lo corre Juan.

## Parte 7 — Tests

- La regla, en cada estado: `subir`, `mantener` por FC y por no completar, `sin datos suficientes`, y `bajar dificultad` en Ritmo suave.
- **La regla no mezcla modos:** sesiones corridas no cuentan para el escalón por bloques, y al revés.
- "Completó" exige la confirmación y el 90 % del tiempo prescripto en la ventana.
- Las exclusiones: `fcDudosa`, cobertura baja y discrepancia de duración.
- Combat corto no cuenta para Combat largo.
- Aislamiento: con y sin estado de progresión, la racha, la adherencia y el tonelaje dan igual.
- El script: correrlo dos veces no duplica nada, y el modo en seco no escribe.

`tsc`, tests y build.

---

## Qué reportar

Escribí el reporte en `docs/auditorias/ultimochat.md`, con:

1. El diagnóstico de la Parte 1, incluida tu propuesta para los modos.
2. Qué modelaste y dónde.
3. Lo que muestra el script en seco, sin aplicarlo.
4. Todo lo que no coincidió con este prompt.

Agregá la regla como ADR en `CLAUDE.md`, con el umbral marcado como provisorio. No commitees.

Guardá este prompt como `docs/prompts/98-rutinas-vr-y-progresion.md`.

---

## Enmienda del 01/10

P98 no modifica el prompt de análisis ni el paquete. La propuesta de progresión no viaja al análisis de sesión.
La pantalla de la rutina muestra la propuesta con los datos que usó la regla: la FC media de esta sesión, la de la referencia, la diferencia contra el umbral y si contó como completada. Son solo datos medidos, sin texto interpretativo.
Lo demás de P98 no cambia. Donde el prompt pida que el análisis explique la regla, esta enmienda lo reemplaza.
