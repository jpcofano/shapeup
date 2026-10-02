# ShapeUp — traspaso de sesión · 30/09/2026

Para el próximo chat. Reemplaza al traspaso del 28/09: lo que sigue vale de ese documento está repetido acá, y lo que estaba mal está corregido.

---

## 1 · Quién y cómo

**Juan**, Buenos Aires, castellano rioplatense con voseo. Construye **ShapeUp**, una app de entrenamiento familiar. Hoy la usa él solo; la familia todavía no, pero lo que se construye tiene que dejarla prevista.

**El método, que no cambia:**

- Juan conversa el diseño **conmigo**. Yo escribo **prompts numerados y autocontenidos** que declaran las decisiones cerradas y le ordenan a Claude Code **"pará y reportá"** en vez de reinterpretar.
- Juan le pasa el prompt a **Code**, que ejecuta y reporta en `docs/auditorias/ultimochat.md` (ignorado por git en **los dos** repos).
- **Commits:** por defecto commitea Juan. A veces le pide a Code que commitee él; en ese caso Code muestra antes la lista de archivos y confirma árbol limpio y `origin/main` = `HEAD`.
- **Juan corre a mano cualquier script que escriba en Firestore.**
- Los prompts se entregan como archivos y Juan los guarda en `docs/prompts/` del repo que corresponda.
- Code trabaja en **dos sesiones separadas**: una en el repo de la app y otra en el del puente. Juan a veces pega un texto en la sesión equivocada: si la respuesta de Code no corresponde a lo pedido, suele ser eso. Cuando le paso un texto para Code, digo **en qué sesión va**.
- Juan también pega a veces cosas de **otros proyectos** (Apps Script, experimento E3, formularios e inscriptos). No son de ShapeUp: se aclara en una línea y se sigue.

**Lo que funciona conmigo:** empezar por el hallazgo; una decisión por vez; nombrar el motivo; opciones con pros y contras cuando la decisión es suya. Juan corrige rápido cuando algo no le cierra: se reconoce y se sigue.

---

## 2 · El terreno

| | |
|---|---|
| **App** | `github.com/jpcofano/shapeup` — React + TypeScript + Firebase, público. Clon en `C:\Users\Usuario\OneDrive\Documentos\AppsScript\ShapeUp`, dentro de OneDrive a propósito (corregido el 01/10: el traspaso del 30/09 decía C:\dev\shapeup) |
| **Puente** | `github.com/jpcofano/shapeup-bridge` — Android/Kotlin, proyecto en `ShapeUpBridge/`. Clon en `C:\dev\shapeup-bridge` |
| **Firebase** | `shapeup-41e74`, Firestore en `southamerica-east1`, nivel gratuito |
| **Máquina** | Windows, cmd.exe |

La cadena de datos: **reloj Samsung → puente (Data SDK) → `/ingesta-sdk` en Firestore → ShapeUp importa y enriquece.** ShapeUp también le **pide** corridas al puente con un push silencioso.

---

## 3 · Estado al cierre

**Cerrado y pusheado:**

| Repo | Commit | Qué |
|---|---|---|
| App | `d2ce189` | P91, P92, 84c y **92c** |
| App | `e50c50f` | Herramientas: 84b, 84c, 92b; `.claude/settings.local.json` ignorado |
| Puente | `acac1aa` | **P96** y el cierre de la prueba 2b de P90; `docs/auditorias/` al `.gitignore` |

Deploys de reglas, functions y hosting hechos el 28/09.

**Sin commitear en la app: P93 completo**, en tres pasadas: el análisis asistido, la enmienda de ventana y prescripción, y la enmienda **v3** del prompt de análisis. Code confirmó la v3 terminada (`tsc` limpio, 1472 tests, build OK). **Falta la prueba a mano de la v3** (ver §6, paso 1). _(01/10: commiteado en `600aa37`.)_

**Escritos y sin pasar a Code:** `97-zonas-como-samsung.md` y `98-rutinas-vr-y-progresion.md`. _(01/10: commiteados en `fa1014f`.)_

_(01/10: el plan de marcas y análisis quedó integrado en `docs/ANALISIS-ASISTIDO.md`, `d0decc9`.)_

_(01/10: P100, el orden de la documentación, en curso.)_

_(02/10: P97 commiteado. Falta que Juan corra `npm run corregir:zonas -- --aplicar` y después deploye el hosting, en ese orden.)_

---

## 4 · Lo que se aprendió en esta sesión

**P96 — el push que se dormía.** En Doze pasaban **72 s** entre el push y la corrida del puente, y la corrida arrancaba solo porque otra app despertaba el teléfono. Causa: `onMessageReceived` encolaba en WorkManager **sin esperar el resultado**, y la CPU se dormía antes de que el trabajo quedara agendado. El trabajo ya era expedited y el push llegaba con prioridad alta (hipótesis B y C descartadas con evidencia). Arreglo: esperar el encolado con tope de 3 s, fuera del hilo principal. Resultado: **55 ms** en Doze profundo forzado y **45 ms en Doze profundo natural** (42 min en profundo). Cada push registra su prioridad en `corridas.json`.
- La noche entera de Doze **no se hace**: afecta a la sincronización periódica, no al push. Queda como "no probada, riesgo bajo".
- Doze **sin exclusión** de batería tampoco: el teléfono de Juan queda "sin restricciones" y quien use el puente lo configura así con el botón.

**92c — la sesión testigo del 27/09.** El **método de zonas quedó verificado contra Samsung**: con sus rangos, las cinco zonas quedan a menos de un minuto, la resta de la Parte 4 cierra al segundo y las calorías coinciden (504). La tolerancia del 12 % adoptó (desfase −2,2 %).
- **Corrección al traspaso anterior:** el cartel "Samsung siguió grabando de más" **no** acusaba al extremo equivocado. El reloj arrancó **70 s después** que la app, y lo recortado fueron 6,8 s del final. El problema real era que el cartel salía por segundos. Ahora nombra el extremo correcto y solo aparece si lo recortado pasa de un minuto.
- Lo que no coincidió: **Z5 con las zonas del perfil da +1,1 min** porque el piso de Z5 está en 152 y no en 153. Es redondeo en `seed-perfiles.ts`. Lo resuelve P97. _(02/10: resuelto; con las zonas corregidas Z5 da 3,6 contra 4,08.)_
- Z5 queda 32 s abajo aun con los rangos de Samsung, dentro de tolerancia: nosotros atribuimos por intervalo (promedio de dos muestras). En picos cortos tendemos a quedar un poco abajo. No se toca.

**P93 — análisis asistido.** La primera prueba devolvió un análisis largo y solo con reparos. La mitad de las quejas eran por datos que faltaban o que el paquete no explicaba, y la otra mitad por el formato. De ahí salieron las dos enmiendas:
- **Ventana y prescripción:** el paquete declara `ventanaOrigen` (`sesion` · `series` · `null`) y `discrepanciaDuracion` cuando no cierra; y `prescripcionOrigen` (`sesion` en VR, `rutina-actual` en el resto, con aclaración). Las sesiones de **fuerza no guardan la prescripción** del día: queda en el backlog.
- **v3:** resumen de 2-3 oraciones, máximo 4 hallazgos con al menos uno positivo, 2 sugerencias sobre entrenamiento (nunca cómo cargar datos ni RPE), 2 preguntas, cada limitación una sola vez en `banderas`, `datosFaltantes` en campo propio y sin reproche, y no marcar como dudoso lo que el paquete explica. El validador rechaza los topes; los juicios de contenido quedan solo en el prompt.

**Zonas y FC máxima — lo que dicen Samsung y el SDK.**
- El SDK **no expone** ni la FC máxima ni las zonas de Samsung, ni en el perfil ni en el registro de ejercicio (Code revisó el `.aar` 1.1.0 y las 79 claves). Solo expone la fecha de nacimiento, sin fecha de cambio. `MAX_HEART_RATE` es el máximo del registro, no el de la persona.
- Samsung calcula su FC máxima con un modelo propio (edad, altura, peso y mediciones) y la ajusta sola, pero **no sigue los picos**: Juan ya tuvo sesiones con 170 y sigue en 169.
- La convención de zonas de Samsung está confirmada por su propia pantalla: techo = `floor(pct × fcMax)` con 60/70/80/90 %, piso siguiente = techo + 1, piso de Z1 = `floor(0,5 × fcMax)`. Con 169: **84-101 · 102-118 · 119-135 · 136-152 · 153-169**.

---

## 5 · Decisiones cerradas — no se re-discuten

Las del traspaso anterior siguen en pie: ADR #042 (la app define la duración), ADR #043 (el 12 %), la zona de un intervalo es la más alta cuyo piso alcanzó, la ventana nace del mismo par de instantes que la duración, ADR #044 (lo medido y lo interpretado no se mezclan) y P79 (el sistema mide, no pregunta cómo te sentiste). Nuevas:

- **FC máxima: opción C.** Samsung queda en **automático**. ShapeUp tiene su **FC máxima vigente declarada** (hoy 169, origen `samsung`) y calcula **su propia estimación** (segundo pico de la curva suavizada, últimas 12 semanas, solo sube), pero **no la aplica sola**. Cada 3 meses, o antes si la estimación supera la vigente, muestra estimación, vigente y el valor de Samsung que Juan copia, y **Juan elige**. Cada sesión guarda con qué zonas se calculó: los cambios trimestrales no reescriben la historia. La única excepción es la corrección del 152, que es un error de redondeo y sí rehace las sesiones pasadas.
- **No se lee el perfil de Samsung desde el puente.** "220 − edad" queda descartada: no es lo que usa Samsung.
- **Cuando Samsung cambie las zonas,** Juan anota la fecha y el valor y lo traemos al chat para entender qué lo movió antes de adoptarlo.
- **Rutinas de VR por tiempo, no por lo que dura cada entrenamiento del juego.** Bloques largos (ninguno bajo 12 min); Juan los llena encadenando entrenamientos y sigue los tiempos él. **Cada rutina tiene modo por bloques y modo corrido**, con escaleras independientes, y la regla **nunca compara modos distintos**.
- **Durante la sesión no se marca nada** (con el visor es impráctico). Al cerrar, Juan confirma si completó y en qué nivel. "Completó" = confirmación + ventana ≥ 90 % del tiempo prescripto.
- **La progresión la calcula el sistema** con una regla pura sobre la FC media de toda la ventana; **propone y Juan acepta**; el análisis solo la explica. Umbral de 5 latidos **provisorio**, a revisar tras un mes de datos.
- **Meta semanal: 5 días, todos de VR por ahora.** Fuerza se suma más adelante. Nunca dos días duros seguidos.
- **Juegos de ejercicio:** Les Mills BodyCombat (nivel intermedio, 2 entrenamientos de 15-20 min), Creed: Rise to Glory, Beat the Beats VR y PowerBeatsVR. **Beat Saber no.** Behemoth, Drums Rock y similares no son ejercicio: se registran sin contar.
- **Numeración de prompts:** P94 (análisis global) y P95 (sincronización incremental y duplicados) siguen **reservados**. P96 hecho. P97 y P98 escritos.

---

## 6 · Próximos pasos, en orden

### Paso 1 — Probar la v3 de P93 y cerrarlo (sesión de la **app**) _(01/10: hecho; P93 en `600aa37`. El deploy de hosting lo hace Juan.)_

Probarlo **en local** (`npm run dev`, reiniciado para que tome la v3), así no se publica nada sin commitear. Con la sesión de VR del 27/09:

1. Borrar el análisis viejo desde la app.
2. **Preparar análisis** y verificar que `versionPrompt` diga 3.
3. Pegarlo en un **chat nuevo**, copiar el JSON y **Cargar análisis**.
4. Revisar: resumen corto que arranca por cómo salió; al menos un hallazgo positivo; la serie única y la FC de muñeca aparecen una sola vez; no pide RPE; los datos faltantes salen en gris bajo «Para completar».
5. Agregar a mano un quinto hallazgo al JSON e intentar cargarlo: tiene que rechazarlo.

Si anda, texto para Code:

> Probé la v3 y anda. Commiteá y pusheá todo lo de P93 con sus enmiendas. Mostrame antes la lista de archivos, que no incluya `docs/auditorias/`, y confirmame que el árbol quedó limpio y que `origin/main` quedó en el mismo commit que `HEAD`. El deploy de hosting lo hago yo.

Después: `npm run build` y `npx firebase deploy --only hosting`.

Si el análisis sigue largo o quejoso, se trae al chat y se ajusta el prompt antes de commitear.

### Paso 2 — P97, las zonas (sesión de la **app**) _(02/10: hecho, ADR #045. Sin cambios de reglas. Falta el script con `--aplicar` y el deploy, en ese orden.)_

Con `97-zonas-como-samsung.md` adjunto:

> Nuevo prompt: guardalo como `docs/prompts/97-zonas-como-samsung.md` y ejecutalo. Arrancá por la Parte 1 (diagnóstico) y reportámela antes de cambiar nada.

Del reporte hay que mirar: la tabla de la sesión testigo con las zonas corregidas (Z5 tiene que entrar en el minuto de tolerancia) y qué da hoy la estimación de ShapeUp. Después Juan corre el script **en seco** (`npm run <comando>`), revisa el antes y el después de cada perfil, y aplica con `npm run <comando> -- --aplicar`. Commit y deploy; si hubo cambios de reglas, primero `firestore:rules`.

### Paso 3 — P98, las rutinas de VR (sesión de la **app**)

Va después de P97 porque la regla usa las zonas. Con `98-rutinas-vr-y-progresion.md` adjunto:

> Nuevo prompt: guardalo como `docs/prompts/98-rutinas-vr-y-progresion.md` y ejecutalo. Arrancá por la Parte 1 (diagnóstico, incluida tu propuesta para los modos) y reportámela antes de cambiar nada.

Si Code para porque escaleras y modos no entran en el modelo, se resuelve en el chat antes de seguir. Después, script de rutinas en seco y con `-- --aplicar`, commit y deploy.

### Paso 4 — Usarlo

Jugar como siempre, elegir el modo al empezar, confirmar al cerrar. Semana de referencia: Combat largo, Ritmo suave, Creed, Ritmo suave, Combat largo. Tras 3 sesiones en 2 semanas, la regla empieza a decir algo.

---

## 7 · Backlog

- **Diagnóstico de la sesión libre del 07/07** (ambigua, dos candidatas) y de la **sesión de fuerza del 29/06** (dura 17 min pero sus series abarcan 38,6 y el reloj midió 39; anterior a P84c, sin inicio ni fin guardados). Ambas de lectura, en un mismo prompt.
- **Guardar la prescripción al cerrar las sesiones de fuerza.** Chico, no urgente.
- **P94** — análisis global sobre un rango de semanas. Code avisó que no es trivial: falta el agregado, una colección nueva con sus reglas y otra identidad (miembro y rango).
- **P95** — sincronización incremental y duplicados (18 MB por sincronización, 12 registros duplicados, `updateTime` disponible).
- Del inventario del SDK, aprobado como idea: la **cadencia** como testigo de la FC de muñeca en VR y boxeo, `logWithHeartRate` para la cobertura, `skeletal_muscle_mass`.
- Umbrales aeróbico y anaeróbico de Samsung: no salen por el SDK. Si algún día interesan, van como dato que Juan copia a mano, igual que la FC máxima.
- Backlog viejo: P76 (convertir 9 `shapeup-sin-sesion`), enlazar externas, PRs y logros, panel familiar, PWA completa, registro de eventos de sesión para diagnosticar casos como el 25/09.

---

## 8 · Las trampas, aprendidas a los golpes

- **Nunca restar dos relojes distintos.** Teléfono, navegador, PC, función y FCM (`sentTime` incluido) son relojes distintos. La evidencia es que **el contador del puente se mueva**, o medir con el mismo reloj en las dos puntas (el historial de batería del teléfono, `corridas.json`).
- **Anclar en el extremo confiable.** El fin es cuando alguien apretó "terminar"; el inicio derivado de marcas llega tarde.
- **No medir sobre datos que estás por corregir.**
- **Verificar contra una medición externa antes de construir encima** (92c antes de 93; P97 antes de P98).
- **`npm run algo -- --flag`**, con el `--` en el medio.
- **cmd.exe:** un `-m` por párrafo en los commits.
- **WorkManager:** si algo tiene que agendarse dentro de un despertar corto (un push en Doze), hay que esperar el resultado del encolado.
- **`connectedAndroidTest` desinstala la app** y se pierde la sesión del puente: correr los tests instrumentados con `am instrument`.
- **Pruebas de Doze:** el cable carga y no deja entrar en Doze; `adb` inalámbrico conectado puede mantener el teléfono más despierto (`adb disconnect`); las notificaciones prenden la pantalla (No molestar, boca abajo; nunca modo avión, que corta el push). Y **ShapeUp pide corridas solo**: al guardar cualquier sesión, y al abrir la app si pasaron más de 6 h desde la última sincronización automática exitosa. Durante una prueba, no abrir la app publicada.
- **Probar en local antes de deployar** lo que todavía no está commiteado.
- **`docs/auditorias/` está ignorado en los dos repos:** lo que tiene que quedar va a los reportes versionados (`REPORTE-P90.md`, ADR en `CLAUDE.md`).

---

## 9 · Un detalle que conviene no perder

Todo lo que se destrabó estas dos semanas salió de **mirar datos reales** contra una fuente externa: el historial de batería del teléfono mostró los 72 s; las capturas de Samsung verificaron las zonas y destaparon el 152; la pantalla de Samsung explicó por qué su FC máxima no se mueve. Y dos veces me equivoqué por suponer en lugar de mirar: el cartel del 27/09 y la hipótesis de "220 − edad".

Cuando haya que decidir entre suponer y medir, se mide.


---

## Observaciones del cierre de P93 (01/10)

Las dos quedaron **cerradas** el 01/10.

- **La versión del prompt entre P98 y P99.** El plan de marcas (§4) dice que P99 lleva el esquema a 3
  y el prompt a v4. Pero P98, que va antes, en su Parte 5 le agrega una regla al prompt vigente, y por
  el ADR #044 todo cambio del prompt es un archivo nuevo: P98 lo dejaría en v4 y P99 lo llevaría a v5.
  **01/10: el análisis de sesión no menciona la progresión (ver ANALISIS-ASISTIDO.md). P98 no toca el prompt; P99 crea la v4.**
- **La progresión en el análisis de sesión.** P98 (Parte 5) pide que el análisis explique el estado de
  la regla de progresión, que mide si se completó lo prescripto. El plan descarta la progresión como
  marca de la sesión (se muestra en la rutina) y su decisión 6 dice que el análisis no evalúa el
  cumplimiento de la prescripción.
