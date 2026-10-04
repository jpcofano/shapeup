# ShapeUp — traspaso de sesión · 03/10/2026

Para el próximo chat. Reemplaza al traspaso del 02/10 (y al del 30/09). Desde P100, este documento **es** `docs/ESTADO-DEL-PROYECTO.md`: Code lo copia ahí tal cual y reemplaza al anterior.

---

## 0 · Para el próximo chat: primero clonar y leer

El repo de la app es público: `https://github.com/jpcofano/shapeup`. Antes de responder, clonalo y leé, en este orden:

1. `CLAUDE.md`: las reglas de trabajo, el índice de ADRs y la sección **«Documentación»**, que dice dónde va cada cosa.
2. `docs/ESTADO-DEL-PROYECTO.md`: tendría que ser este documento (03/10). Si es más viejo, la copia todavía no se commiteó.
3. `docs/ANALISIS-ASISTIDO.md`: el plan de marcas y análisis (P99 y P94), con sus insumos de las pruebas del 30/09 y el 02/10. **Es la base de P99.**
4. `docs/RUTINAS-VR.md`: cómo funciona la regla de progresión de VR (series por dificultad, motivos de «mantener», salida a mitad). Remite al ADR #046.
5. `docs/ADR.md`: los ADRs completos. Los nuevos son el #045 (zonas y FC máxima) y el #046 (rutinas de VR y progresión, con su enmienda de la dificultad).
6. `docs/ROADMAP-producto.md` §11: el orden de lo que viene.
7. `docs/prompts/97-…`, `98-…` y `100-…`: muestran el formato de los prompts que funcionan.

Para ver lo último commiteado, corré `git log --oneline -15`. Al cierre del 03/10, `HEAD` era `043bf7d` (más el commit de esta copia).

---

## 1 · Quién y cómo

**Juan**, Buenos Aires, castellano rioplatense con voseo. Construye **ShapeUp**, una app de entrenamiento familiar. Hoy la usa él solo; lo que se construye tiene que dejar prevista a la familia.

**El método:**
- Juan conversa el diseño **conmigo**. Yo escribo **prompts numerados y autocontenidos**, que declaran las decisiones cerradas y le piden a Claude Code **«pará y reportá»** en vez de reinterpretar.
- **Code** ejecuta y reporta en `docs/auditorias/ultimochat.md`, que está ignorado por git en los dos repos.
- **Commits:** cuando lo hace Code, muestra antes la lista de archivos y confirma árbol limpio y `origin/main` = `HEAD`.
- **Juan corre a mano cualquier script que escriba en Firestore**, primero en seco y después con `-- --aplicar`.
- Code trabaja en **dos sesiones**, una por repo. Cuando le paso un texto para Code, digo **en qué sesión va**. Si la respuesta de Code no corresponde a lo pedido, suele ser que se pegó en la sesión equivocada.
- **Juan a veces no sabe si ya le pasó un texto a Code.** Antes de dar el paso siguiente, se verifica con el último reporte.
- Juan a veces pega cosas de otros proyectos (Apps Script, E3, formularios). Se aclara en una línea y se sigue.

**Lo que funciona:** empezar por el hallazgo; una decisión por vez; opciones con pros y contras cuando la decisión es suya; textos para Code listos para pegar. Juan corrige rápido: se reconoce y se sigue.

---

## 2 · El terreno

| | |
|---|---|
| **App** | `github.com/jpcofano/shapeup`: React, TypeScript y Firebase, público. **El clon está en OneDrive, a propósito** (corregido el 01/10: el traspaso del 30/09 decía `C:\dev\shapeup`) |
| **Puente** | `github.com/jpcofano/shapeup-bridge`: Android y Kotlin. Clon en `C:\dev\shapeup-bridge` |
| **Firebase** | `shapeup-41e74`, Firestore en `southamerica-east1`, nivel gratuito |
| **Máquina** | Windows, cmd.exe |

La cadena de datos: **reloj Samsung → puente (Data SDK) → `/ingesta-sdk` → ShapeUp importa y enriquece.**

---

## 3 · Estado al cierre (03/10)

**Commits de la app, del 30/09 al 03/10:**

| Commit | Qué |
|---|---|
| `600aa37` | P93: análisis asistido, con las enmiendas de ventana y prescripción y el prompt v3 |
| `d0decc9` | El plan de marcas integrado en `ANALISIS-ASISTIDO.md` |
| `fa1014f` | Los prompts 97 y 98 |
| `a636dce` | **P100**: el orden de la documentación |
| `557749b` / `817d74f` | Decisión del 01/10: el análisis no menciona la progresión; enmienda a P98 |
| `9529fdb` + `aa0d8a1` | **P97**: zonas como Samsung, FC máxima declarada, estimación, revisión y enriquecimiento v8 |
| `6a90eaf` | Los insumos de las pruebas del 30/09 y el 02/10 para P99 |
| `ba9e41f` | **P98** (app): las rutinas de VR por escalones, con dos modos y la regla de progresión, y su documentación |
| `6a5a98a` | **P98** (herramientas): el seed `seed:rutinas-vr`, `package.json` y `SEEDS.md` |
| `b7be4d8` | Cierre de P98: este ESTADO, el insumo de P99 y `docs/RUTINAS-VR.md` (nuevo) |
| `12a9ca3` | Ajuste a P98: la dificultad declarada separa las series de la regla (enmienda del #046) |
| `b947bb9` | Arreglo: el botón principal invisible en modo oscuro (`home-redux.css` pisaba `--accent` en `<html>` desde P65) |
| `22bcd4d` | Ajuste a P98: el cierre de VR no deja guardar sin elegir la dificultad |
| `043bf7d` | Arreglo: la salida de las pantallas de VR (✕ en el cierre, confirmación por minutos jugados, «Reiniciar» que funciona, sin «Guardar y salir» en VR) |

**P98: cerrado.** Seed aplicado, hosting deployado (antes del commit: ver §8) y commiteado. `tsc` limpio y 1564 tests; falla solo la suite de reglas, que necesita el emulador.
- **Reglas: sin cambios y sin deploy.**
  - `/config/progresion` cae en `/config/{docId}`: lo lee cualquier miembro y lo escribe solo el owner. Lo escribe solo la tarjeta de «Familia y datos», que ve solo Juan.
  - `archivada` en `/rutinas`, `subidasVR` en `/config/perfiles` y el escalón en `/historial` pasan porque esas reglas no validan campos.

**Ya aplicado en Firestore:**
- `corregir:zonas`: las zonas de los cuatro perfiles con la convención de Samsung, y el origen de la FC máxima;
- `seed:rutinas-vr`.

**Deployado:** el hosting con P93, P97 y P98. Las sesiones se rehicieron a la biometría v8. **Los cuatro ajustes del 02 y 03/10 (`12a9ca3` a `043bf7d`) estaban sin deployar al cierre**: ver §6.

**Lo que muestra la app ahora:**
- **Revisión de la FC máxima de Juan:** la estimación de ShapeUp da **173** y la vigente es **169** (origen `samsung`). **La decisión es de Juan.** Quedarse en 169 mantiene las zonas iguales a las de la pantalla de Samsung; con 173 suben unos 3 latidos. Hay tres sesiones excluidas de la estimación (12/09, 18/09 y 29/09), con picos suavizados de 174, 179 y 183, por la regla «pico > vigente + 10».
- **maria, sofia y federico:** «falta confirmar». Su origen es `edad-provisoria` (220 − edad).
- **Programa activo de Juan: el PRG-0013, de 5 días:** Combat largo, Ritmo suave, Creed, Ritmo suave, Combat largo. El PRG-0012 de María no se tocó.
  - Qué programa usa cada miembro lo dice `config/programaActivo`, no el estado del programa. El PRG-0013 queda en estado «Plantilla» **a propósito**: si estuviera en «Activo», la app se lo daría por defecto a los miembros sin programa elegido.
  - El PRG-0004 (6 días) lleva la etiqueta «Pausado», que la app no lee.
- **Sesión de prueba sin descartar:** `SES-20261002205619-jjmxi6` (RUT-0026, Combat largo), «En curso» en `/sesiones`, 0 min. No llegó a `/historial`. Se descarta en el teléfono con ✕ → «Salir sin guardar» después del deploy de `043bf7d`; si no, la borra Home en la PC (sesiones abiertas de más de 24 h que ese dispositivo no tiene en local). Dejarla «En curso» no afecta ninguna pantalla.

---

## 4 · Lo que se aprendió en esta sesión

- **P97: las zonas quedaron verificadas.** En la sesión testigo del 27/09, Z5 da 3,6 min contra 4,08 de Samsung, y las cinco zonas quedan a menos de medio minuto.
  - Había **tres copias** del cálculo de zonas: el seed, el botón del editor y el respaldo de `pisosDe`. Ahora hay una sola, `zonasDesdeFcMax`.
  - **Trampa de redondeo:** en punto flotante, `0.7 × 170 = 118,999…`. El cálculo se hace con enteros.
- **La estimación de la FC máxima puede subir como mucho 10 latidos por revisión,** por la regla de `fcDudosa`. Lo que distingue un pico real de uno falso es la cadencia como testigo, que está en el backlog.
- **P98: había cuatro rutinas de VR, no una,** y el diseño chocaba con los ADR #039 y #040. Se resolvió con el #046:
  - la rutina no se modifica, y las subidas de escalón van en `perfiles.{miembro}.subidasVR[]`;
  - el modo se elige al empezar;
  - la confirmación de Juan entra en la regla como condición «y»: puede frenar una subida, nunca causarla.
- **«2 de 6» en el análisis del 30/09:** salía del PRG-0004, que es de 6 días. Lo resuelve el PRG-0013.
- **Verificar P98 en el teléfono encontró dos errores que los tests no veían:** el botón principal invisible en oscuro (venía de P65, afectaba a toda la app) y el cierre de VR sin salida. Los dos se arreglaron el 02 y 03/10. Mirar la app real en los dos modos es parte de verificar.
- **Code paró bien dos veces** en vez de reinterpretar: la dificultad (que la regla ignoraba) y la hoja de salida (reusarla tal cual se salteaba la dificultad obligatoria).
- **Análisis de prueba** (chat «PowerBeatsVR sesión análisis», 27/09 y 30/09): la v3 todavía compara contra lo prescripto y comenta las calorías. Pide datos que la app tiene (FC de reposo, sueño y edad) y duda de la FC aunque la app no la marcó como dudosa. Todo eso está en los insumos de P99.

---

## 5 · Decisiones cerradas: no se re-discuten

Las de antes siguen en pie: ADR #042 a #044, P79, la FC máxima en la opción C, VR por tiempo con modo por bloques y modo corrido, que no se marque nada durante la sesión, y que la progresión la calcule el sistema y la acepte Juan. Las nuevas:

**Marcas y análisis (P99 y P94).** El detalle está en `ANALISIS-ASISTIDO.md`.
- **Dos capas.** La app calcula las marcas medidas en todas las sesiones. El análisis suma un veredicto, dos destacados y marcas propias que **apuntan a una marca de la app o a un tramo**, sin escribir números propios.
- **La prioridad de las marcas la fija la app.**
  - **Nivel 1 (badges):** calidad, récord, pico sobre la vigente, carga, zona alta o volumen, y semana con meta.
  - **Nivel 2 (secundarias):** tramo sostenido, mitades, recuperación, picos en Z5, entrada en calor, recuperación al terminar y pico.
  - **Candidata nueva: tramo bajo.**
- Las marcas que tienen un momento o un tramo se dibujan sobre la curva.
- **El análisis mira solo lo realizado:** no evalúa el cumplimiento de la prescripción.
- **Las calorías salen del paquete.**
- **El análisis puede recomendar fuerza.**
- **El análisis de sesión no menciona la progresión (opción A):** la propuesta se explica en la rutina, con los datos que usó la regla.
- **P99 crea el prompt v4 y el esquema 3.** P98 no tocó el prompt.
- **P94, el análisis general,** propone **focos**; Juan los acepta y viajan como dato en el paquete. Nunca reescribe el prompt. Si propone una marca nueva, sale como pedido de código.

**Documentación (P100).** El detalle está en la sección «Documentación» de `CLAUDE.md`.
- Cada tipo de información tiene un solo lugar.
- Las decisiones de diseño van en el documento del área, no solo en ESTADO, porque ESTADO se reemplaza en cada traspaso.
- No se borra nada: se archiva en `docs/archivo/`.
- Los ADRs van en `docs/ADR.md`, con su línea en el índice de `CLAUDE.md`.

**Zonas (P97, ADR #045).**
- La convención de Samsung: el techo es `floor(pct × fcMax)` y el piso de la zona siguiente es techo + 1.
- El origen de la FC máxima es uno de cuatro: `samsung`, `estimacion-shapeup`, `medida` o `edad-provisoria`.
- Las sesiones guardan las zonas con que se calcularon (`zonasUsadas`).
- `fcDudosa` sigue excluyendo sesiones de la estimación.
- El editor recalcula las zonas solo con un botón, y avisa si no corresponden a la FC máxima.

**Rutinas de VR (P98, ADR #046).**
- Las cuatro rutinas viejas están archivadas; la 0014 sigue.
- La regla compara la última sesión contra el promedio de las dos primeras del escalón, con el mismo modo, el mismo juego y **la misma dificultad declarada** (enmienda del 02/10). Cada dificultad es una serie propia; ninguna sesión se excluye por la dificultad.
- **Solo propone la serie de la dificultad prevista por el escalón.** Las otras, «Mixto» incluida, se calculan y se muestran como informativas, sin botón. En Ritmo suave, igual: solo la serie «Por defecto» propone bajar.
- **El cierre no deja guardar sin elegir la dificultad.** Si alguna sesión llega sin ella, queda en su propia serie informativa.
- En Ritmo suave, la regla se evalúa por juego.
- Las dificultades son relativas («por defecto», «+1», «+2»), salvo Bodycombat, hasta que Juan pase los nombres reales.
- Los números de la regla están en `/config/progresion`: el umbral de 5 bpm, que es provisorio, 3 sesiones, 2 semanas y 90 %.
- «VR» sigue en `LUGARES`.
- `progresionVR.ts` convive con las rutinas viejas.
- Cómo quedó implementada (reporte de P98, 02/10):
  - el 90 % se mide contra el tiempo prescripto con descansos (2 × 20 con 2 min de descanso = 42 min);
  - las exclusiones se aplican antes de contar las 3 sesiones, las 2 semanas y las «dos seguidas»;
  - «mantener» tiene cinco motivos a la vista, incluidos: la FC bajó menos que el umbral, una sesión no completada suelta y el último escalón;
  - el modo que se ofrece primero es el de la rutina (bloques en Combat y Creed, corrido en Ritmo suave), no el de la última sesión como en P80; Combat corto tiene un solo modo y no pregunta;
  - en Ritmo suave, PowerBeats se guarda como el ejercicio de la sesión, no como reemplazo;
  - en VR por escalones no hay «Guardar y salir»: se guarda solo con «Terminar» → cierre → dificultad. «Salir sin guardar» y «Reiniciar» piden confirmación si hay minutos jugados (desde el 03/10; antes, salir a mitad guardaba sin escalón);
  - «completa» usa el mismo criterio que la regla: la confirmación de Juan y el 90 %.

**Numeración:** P94 y P95 están reservados y P99 es el próximo. El ajuste de diseño será **P101**.

---

## 6 · Próximos pasos, en orden

**1. Pushear y deployar los ajustes.** Al cierre, `043bf7d` estaba commiteado pero **no pusheado**: primero `git push`, después confirmar `origin/main` = `HEAD`, después deploy del hosting (las reglas no cambiaron). En el teléfono, cerrar la app del todo y volver a abrirla antes de entrar a Combat largo.

**2. Verificar P98 en la app:**
- la semana de Home muestra 5 días;
- la Biblioteca no muestra las rutinas viejas;
- el umbral se puede editar en la tarjeta de «Familia y datos» (solo la ve el owner);
- al empezar, la app pregunta el modo; **ya verificado el 02/10**;
- al cerrar, pide confirmar si completó y en qué nivel; **ya verificado el 02/10**;
- en oscuro, los botones principales se ven (tema Ion y alguno más);
- «Guardar» del cierre queda deshabilitado hasta elegir la dificultad;
- la ✕ entra bien en el header del cierre y de los dos fines genéricos;
- con la sesión de prueba: ✕ → «Salir sin guardar» → confirma por minutos → desaparece.

**3. Decidir la revisión de la FC máxima** (173 o 169), desde la tarjeta de Perfil.

**4. Escribir P99: marcas y análisis de sesión.** Es lo próximo que me toca, y sale de `ANALISIS-ASISTIDO.md` (el plan y los insumos). Va por partes:
- **Parte 1, diagnóstico:**
  - qué datos hay para las marcas condicionales;
  - si las marcas se guardan en la sesión o se calculan al mostrar;
  - de dónde sale la semana: tiene que ser el programa activo;
  - si existen la FC de reposo y el sueño por día;
  - propuestas para lo que está abierto en el plan: el umbral de `calidad`, la tolerancia del tramo sostenido, el récord de fuerza, el tope de `marcasAnalisis` y la pantalla.
- **Parte 2:** las marcas de la app, incluidos el tramo bajo y la recuperación medida en las bajadas de la curva.
- **Parte 3:** el esquema 3 y el prompt v4. Eso incluye sumar las marcas, la FC de reposo, el sueño y la edad al paquete, y sacar las calorías. El prompt v4 analiza solo lo realizado y no especula sobre artefactos si `fcDudosa` es falso. El validador suma dos rechazos: una `refMarca` que no existe y un `armado` cuyas versiones no coinciden con las de la sesión. **El paquete tiene que mandar el escalón y el modo que se jugaron:** hoy manda la rutina tal como está (el E1 del modo por defecto, aclarado como tal).
- **Parte 4:** la pantalla.
- **Verificación:** contra la sesión testigo del 27/09, con los valores de después de P97.

**5. Usar la app.** La regla de P98 empieza a proponer después de 3 sesiones en 2 semanas en el mismo escalón y modo. **Juan anota los nombres de las dificultades** de Creed, Beat the Beats y PowerBeats.

**6. Auditoría con Design y P101.** Juan quiere hacer una sesión con Design que audite toda la app. Falta decidir cuándo: antes de P99, después, o entre las Partes 3 y 4 de P99 (las primeras no tocan pantalla; la 4 es la pantalla de marcas). El brief lleva lo ya anotado: la etiqueta de la tarjeta de la FC máxima (§7), `SesionJuego` (§7) y las capturas del 02/10. Lo que salga va a P101, que se documenta en el sistema de diseño de la raíz (`README.md`, `SKILL.md`, `ui_kits/` y `preview/`).

**7. P94: análisis general y focos.**

---

## 7 · Backlog

El vigente está en el roadmap. Lo agregado en estos días:
- revisar `docs/reportes/pendientes-anteriores-a-P100.md`;
- cerrar el historial de git al terminar el proyecto (ADR #015);
- usar la cadencia como testigo de la FC de muñeca (es lo que destraba la estimación de la FC máxima);
- sacar «VR» de `LUGARES`;
- retirar `progresionVR.ts` cuando no quede ninguna rutina vieja activa;
- guardar la prescripción en las sesiones de fuerza;
- P95 (sincronización incremental y duplicados);
- el build tardó 48 minutos una vez. Si se repite, sospechar de OneDrive;
- **la tarjeta de revisión de la FC máxima** muestra el pico **suavizado** (174, 179, 183) con el motivo «pico > vigente + 10», pero la regla usa el pico **crudo**: con 179 sobre 169 + 10 no cierra a la vista. La exclusión está bien; la etiqueta tiene que mostrar el pico crudo que la disparó;
- `SesionJuego`: la ✕ no descarta, no tiene hoja de salida ni cierre (ya está en el roadmap).

---

## 8 · Las trampas

Las de antes siguen valiendo: no restar dos relojes distintos; anclar en el extremo confiable; no medir sobre datos que están por corregirse; verificar contra una fuente externa antes de construir encima; `npm run algo -- --flag`; un `-m` por párrafo en cmd.exe; WorkManager y Doze. Las nuevas:

- **Commitear y pushear antes de deployar,** así lo publicado siempre corresponde a un commit que está en GitHub. (P98 se deployó antes del commit, y `043bf7d` quedó sin push: no repetir.) «Commiteado» en un reporte de Code no implica pusheado: se mira `origin/main`.
- **Cuando Code dice «falta el commit de X», verificar que X esté hecho.** El 02/10 el arreglo del botón no estaba aplicado, no solo sin commitear.
- **Un script que cambia los datos base va antes del deploy** que los usa. P97: si se deployaba antes, la v8 rehacía las sesiones con el 152 y se las guardaba.
- **Un chat nuevo por cada análisis de sesión.** El bloque `armado` lo escribe la app; el chat solo lo copia.
- **Revisar las reglas cuando aparece un documento o colección nueva** en Firestore. La suite de reglas necesita el emulador.
- **Los ADRs cambian de a uno,** con enmiendas anotadas en el ADR original, nunca en silencio.

---

## 9 · Un detalle que conviene no perder

Lo que destrabó P97 y P98 fue lo mismo que antes: **mirar los datos reales.** La tabla contra Samsung cerró el 152, la lectura de Firestore mostró las cuatro rutinas, y el «2 de 6» llevó al programa de 6 días. Cuando haya que decidir entre suponer y medir, se mide.
