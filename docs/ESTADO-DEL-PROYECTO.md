# ShapeUp — traspaso de sesión · 21/10/2026 (tarde)

Para el próximo chat, **en otra cuenta de Claude**. Reemplaza al traspaso del 21/10 a la mañana (`ESTADO-DEL-PROYECTO shape up 21-10.md`) y lo contiene. Cuando Code lo copie, pasa a ser `docs/ESTADO-DEL-PROYECTO.md` (ver §6, paso 1).

**La memoria de la cuenta anterior no viaja.** Todo lo que hace falta está en este documento, en el repo y, para el diseño, en `docs/AUDITORIA-DISENO.md`.

---

## 0 · Para el próximo chat: primero leer

**Si el chat está vinculado a la PC de Juan** (app de escritorio), leé directo del clon local:
- repo: `C:\Users\Usuario\OneDrive\Documentos\AppsScript\ShapeUp`;
- prompts y descargas: `C:\Users\Usuario\Downloads`.

Ahí también está `docs/auditorias/ultimochat.md`, el último reporte de Code, que no está en git.

**Si no está vinculado,** cloná `https://github.com/jpcofano/shapeup` (`git clone --depth 1`) y pedile a Juan que adjunte `ultimochat.md`.

**En este orden:**
1. `CLAUDE.md`: las reglas de trabajo, el índice de ADRs y la tabla «Documentación».
2. **Este documento.**
3. **`docs/AUDITORIA-DISENO.md`: el plan, el diagnóstico y el estado de la auditoría de diseño (P101).** Es lo que se trabajó hoy a la tarde. Tiene su propio §0 «Para el próximo chat».
4. `docs/ANALISIS-ASISTIDO.md`: el diseño de las marcas y del análisis. El catálogo y lo decidido en P99 están al día.
5. `docs/RUTINAS-VR.md`, `docs/ADR.md` (los últimos: #045, #046 y, si P103 corrió, #047) y `docs/ROADMAP-producto.md` §11.
6. **El formato de prompt que funciona:**
   - `docs/prompts/102-…` y `99-…`;
   - `103-…`: la corrida nocturna, sin preguntas;
   - `104-…`: traer archivos, con «pará y reportá».

**Lo primero que tenés que averiguar:** `git log --oneline -15` y el `ultimochat.md`, para saber si corrieron el 104 y el 103 (§3).

---

## 1 · Quién y cómo

**Juan**, Buenos Aires, castellano rioplatense con voseo. Construye **ShapeUp**, una app de entrenamiento familiar. Hoy la usa él solo; lo que se construye tiene que dejar prevista a la familia.

**El método:**
- Juan conversa el diseño **con el chat**. El chat escribe **prompts numerados y autocontenidos**, con las decisiones cerradas. Se pasan como archivo: Juan lo baja a Descargas y Code lo copia a `docs/prompts/`.
  - **Si el chat está vinculado a la PC,** puede dejar el archivo directo en el repo, sin commitear, y decírselo a Code. Así se hizo con el 104.
- **Cada prompt lleva su tabla de reparto de agentes y modelos:**
  - liviano para explorar;
  - intermedio para la lógica pura y la documentación;
  - principal para las pantallas, en serie;
  - y siempre una **revisión final de un agente que no escribió el código**.
- **«Pará y reportá»** en los prompts normales. **Corrida nocturna** (P103) sin preguntas: bloque por bloque, cada uno con commit y push solo si da verde; si no, se revierte y sigue.
- **Code reporta en `docs/auditorias/ultimochat.md`.** Cuando Code tiene preguntas, el chat propone respuestas con su recomendación y sus pros y contras, y arma el texto para pegarle.
- **Commits:** separados en `App —`, `Herramientas —` y `docs —`. Code muestra la lista de archivos antes de cada uno; después, push y confirmar `origin/main` = `HEAD`.
- **Juan corre a mano:** los scripts que escriben en Firestore (primero en seco, después con `-- --aplicar`), el `build` y el `deploy`.
- **Code trabaja en dos sesiones,** una por repo. Siempre se dice en cuál va cada texto.
- **Lo que funciona:**
  - empezar por el hallazgo;
  - opciones con pros y contras cuando la decisión es de Juan;
  - textos listos para pegar.

  Juan corrige rápido: se reconoce y se sigue.
- **Juan a veces no sabe si ya le pasó algo a Code.** Antes de dar el paso siguiente, se verifica con el último reporte o con el log.

---

## 2 · El terreno

| | |
|---|---|
| **App** | `github.com/jpcofano/shapeup` (React, TypeScript y Firebase, público). El clon está en **OneDrive, a propósito**: `C:\Users\Usuario\OneDrive\Documentos\AppsScript\ShapeUp` |
| **Puente** | `github.com/jpcofano/shapeup-bridge` (Android y Kotlin), clon en `C:\dev\shapeup-bridge` |
| **Firebase** | `shapeup-41e74`, Firestore en `southamerica-east1`, nivel gratuito |
| **Máquina** | Windows, cmd.exe |
| **Diseño** | La versión de **Claude Design por separado cierra el 14/12/2026**. Desde ahora, el diseño se hace **dentro de Claude**, con los tipos de artifact **Design System** y **Design** (ver `docs/AUDITORIA-DISENO.md` §4) |

Cadena de datos: **reloj Samsung → puente (Data SDK) → `/ingesta-sdk` → ShapeUp importa y enriquece.**

---

## 3 · Estado al cierre (21/10, 16:15)

**Repo:** `HEAD` = `origin/main` = **`55a20d1`** (P99, Partes 1 a 3, del 19/10).

**P104 — hecho el 21/10 (ver bitácora).**

**En curso al cierre:**
- **P103** (corrida nocturna, en Descargas), pendiente para **la noche del 21/10**, en la misma sesión y **después** del 104. Lleva un agregado al Bloque 1: el `planSemana` de una sesión vieja guardada después es el del día en que se jugó. El texto para Code:
  > Ejecutá el prompt 103 que está en Descargas. Copialo a docs/prompts/ y seguí sus reglas de corrida nocturna. Agregado al Bloque 1: respuesta de Juan a la pregunta 1 de P99 — una sesión vieja guardada después lleva el planSemana del día en que se jugó, no el del día en que se guarda. Con test.

**Lo que hace P103:**
1. La pantalla de la sesión (P99, Parte 4): la curva en SVG, los badges, los destacados, el detalle plegado, y la tarjeta de la FC máxima con el pico crudo y el suavizado.
2. El cierre de la documentación de P99, con el **ADR #047**.
3. Los restos de P102.
4. La hoja de salida de `SesionJuego`.
5. La prescripción guardada en las sesiones de fuerza.

**P102:** commiteado y pusheado. Falta confirmar con Juan:
- si corrió `seed:rutinas-vr` (crea `RUT-0030`), si hizo el deploy y si lo probó en el teléfono;
- si desapareció la sesión de prueba del 02/10 (`SES-20261002205619-jjmxi6`).

**P99: Partes 1 a 3 commiteadas y pusheadas. Sin deployar, a propósito** (decisión de Juan del 21/10: se espera a la Parte 4).
- Con el deploy, `VERSION_ENRIQUECIMIENTO` = 9 re-enriquece las sesiones que todavía tienen crudo, y les suma curva y marcas.
- Desde el deploy, cargar un análisis exige el esquema 3.

**FC máxima de Juan:** queda en **169** (decisión del 15/10). Falta confirmar que la tarjeta de revisión se cerró con «Dejar como está».

**Pendiente de Juan:** cargar su **año de nacimiento** en Perfil → Configuración.

---

## 4 · Lo que se aprendió (21/10, tarde)

- **El sistema de diseño de la raíz era del 06/06.**
  - Tenía 8 temas, solo oscuro, `system-ui` y un solo Inicio. La app ya tiene 5 temas × claro/oscuro (P65), carga Archivo y Hanken Grotesk, y tiene 5 estilos de Inicio.
  - Faltaban unas 15 pantallas: las posteriores a junio.
- **Hay tres capas de estilos que no coinciden:** el kit de la raíz, `src/styles/tokens.css` y `src/styles/home-redux.css`. Las direcciones Pulse y Premium **solo se aplican a Home y a la barra de navegación**; el resto de la app usa otro juego de superficies y no tiene la rampa de acento.
- **Mucho trabajo de Claude Design nunca había vuelto al repo:** el kit de junio (Aurora, Stadium y Clásico, Foto/Demo/Músculo, el mapa muscular, Programas, la sesión libre), los tokens de P65 y las explorations y auditorías que el repo citaba sin tenerlas. **P104 lo trae.**
- **Juan tuvo Design en dos cuentas:**
  - **Cuenta A**, «Cuenta 1» para Juan: la buena.
  - **Cuenta B**, «cuenta 2»: el design system viejo, anterior a los temas. Se descarta.
- **El proyecto del handoff del 25/09 no se encontró.** Era el del tablero `ShapeUp Estados.dc.html` y `HANDOFF-portado.md`. Puede haberse borrado o haber estado en una cuenta que ya no tiene Design. No bloquea nada:
  - esas pantallas ya están construidas en la app;
  - el brief está archivado;
  - sus tres propuestas sin implementar están anotadas en `AUDITORIA-DISENO.md` §8.
- **Design abre un proyecto nuevo por cada pedido** que se pega en un chat nuevo. Para trabajar sobre un proyecto existente, hay que pegar el pedido **en su conversación**.
- **Diferencia de tokens a resolver en la auditoría.** En el design system de Design, el modo oscuro tiene superficie **neutra**. En la app, el oscuro se **tiñe por tema**, a propósito desde P65.

---

## 5 · Decisiones cerradas: no se re-discuten

Siguen en pie las de antes: ADR #042 a #046, las decisiones de marcas de `ANALISIS-ASISTIDO.md` (con las respuestas del 16/10 a P99) y la documentación de P100. Las de P102 están en `RUTINAS-VR.md`. Las nuevas (21/10):

**P99**
- El `planSemana` de una sesión vieja guardada después es **el del día en que se jugó**. Va en P103.
- **No se deploya hasta la Parte 4.**
- La pantalla de §6 se construye como está; la auditoría la ajusta después.

**Diseño (P101).** El detalle está en `docs/AUDITORIA-DISENO.md` §1.
- **Primero el kit tiene que quedar igual a la app** (paso 2b). Recién después se audita.
- **Cuando el kit y la app no coinciden, gana la app.** Lo que convenga cambiar lo decide la auditoría, no el paso de igualar.
- **El diseño se hace dentro de Claude** (artifacts Design System y Design), no en Claude Design por separado.
- **La fuente de verdad sigue en la raíz del repo** (P100). El artifact es el banco de trabajo: lo que se decide vuelve al repo por un prompt de Code.
- **Lo de la cuenta B no se trae,** salvo su inventario y el brief.
- **Orden del paso 2b (22/10):** primero Code iguala la raíz a la app (P105), después el chat arma el artifact Design System y Juan lo revisa. Detalle en `docs/AUDITORIA-DISENO.md` §5.

**Numeración:** P94 y P95 están reservados; P101 es el ajuste de diseño; P103 es la corrida nocturna; P104 es traer Claude Design; P105 es la corrida nocturna del 22/10 (salud y kit igual a la app). **El próximo libre es P106.**

---

## 6 · Próximos pasos, en orden

**1. Verificar el 104** con `ultimochat.md` y el log:
- ¿Se reemplazó la raíz? Verificar que **nada de la app** usaba esos archivos: era la condición para avanzar.
- ¿Se archivó lo de `docs/archivo/claude-design/`? ¿Están los inventarios en `docs/reportes/`?
- **Después, que Code copie este traspaso.** Texto para Code, sesión de la app:
  > Copiá «HANDOFF-ShapeUp-2026-10-21.md» de Descargas a docs/ESTADO-DEL-PROYECTO.md (reemplaza al de la mañana del 21/10). Commit «docs — traspaso del 21/10 a la tarde», push y confirmá origin/main = HEAD.

  Si el 103 ya está corriendo o corrió, hacelo después de él.

**2. Verificar el 103** (si corrió): la tabla de bloques, las «Decisiones que tomé» y los choques con ADRs. Si no corrió, Juan se lo pasa con el texto del §3.

**3. Deploy,** con el Bloque 1 del 103 hecho:
1. `git status` limpio y `origin/main` = `HEAD`;
2. `npm run build`;
3. `firebase deploy --only hosting`. Las reglas no cambian.

Si Juan no confirmó el seed de P102, corre antes `npm run seed:rutinas-vr`: primero en seco, después con `-- --aplicar`.

**4. En el teléfono, en claro y en oscuro:**
1. cerrar la app del todo y abrirla, para que se re-enriquezca a la v9;
2. cargar el año de nacimiento;
3. mirar una sesión con curva y una sin curva;
4. probar P102;
5. confirmar que la sesión del 02/10 desapareció.

**5. Un análisis de prueba con el prompt v4,** en un chat nuevo. Hay que ver:
- que no compare contra lo prescripto;
- que no hable de calorías;
- que no especule sobre artefactos;
- que el validador acepte el JSON.

**6. Auditoría de diseño. Seguir `docs/AUDITORIA-DISENO.md` §5 desde el paso 2b:**
- **2b. Kit = app.** Crear el artifact **Design System** de ShapeUp leyendo el código real:
  - `src/styles/tokens.css`, `src/styles/home-redux.css`, `src/components/` y `src/routes/`;
  - más la raíz ya actualizada por el 104.

  Juan lo revisa. Después, un prompt de Code (P105) deja la raíz igual al artifact.
- **3. Capturas reales:** cada pantalla en claro y en oscuro, a 390 px, más las páginas de QA (`/qa/temas`, `QaHomeRedux` y `QaSaludResumen`). Pueden salir de `docs/auditorias/capturas/` (si el 103 las sacó) o del navegador integrado de la app de escritorio.
- **4. La auditoría,** en un lienzo **Design**. Incluye:
  - la pantalla de marcas y la curva;
  - `SesionJuego`;
  - la etiqueta de la FC máxima;
  - las tres propuestas perdidas del handoff;
  - y la decisión de extender (o no) las direcciones de Home a toda la app, y de si el oscuro va teñido o neutro.
- **5. P101 para Code,** por partes.

**7. P94: el análisis general con focos.** Code ya avisó que no es trivial: hace falta el agregado, una colección nueva con sus reglas y la identidad miembro + rango.

---

## 7 · Backlog

El vigente está en el roadmap. Lo agregado:
- **Sueño y FC de reposo por el puente** (repo `shapeup-bridge`): hoy solo llegan con el ZIP.
- **VR a medida:** series informativas por configuración.
- **«Cambiar»:** el aviso a la tercera vez que se esquiva la misma rutina, y la cobertura del plan (ROADMAP 11.3 y 11.4).
- **Del 21/10:**
  - el comentario de `styles.css` dice «8 temas» (se corrige en el paso 2b);
  - `explorations/Home Aurora+ (mock).html`: Design no lo pudo leer por el nombre; verificar que se archivó bien.
- **Siguen:**
  - P95 (sincronización incremental y duplicados);
  - la cadencia como testigo de la FC de muñeca;
  - sacar «VR» de `LUGARES`;
  - retirar `progresionVR.ts` cuando no quede ninguna rutina vieja activa;
  - cerrar el historial de git al terminar el proyecto (ADR #015);
  - `docs/reportes/pendientes-anteriores-a-P100.md`.
- **Si P103 salteó algún bloque,** vuelve acá.

---

## 8 · Las trampas

Siguen valiendo las de antes:
- commit y push antes del deploy;
- un script que cambia datos base va antes del deploy que los usa;
- «commiteado» no implica «pusheado»;
- un chat nuevo por cada análisis de sesión;
- revisar las reglas cuando aparece una colección nueva;
- los ADRs cambian de a uno, con la enmienda anotada;
- no deployar P99 a medias;
- reproducir con un test antes de dar por hecho un error;
- `npm ci` necesita `--legacy-peer-deps` en un entorno limpio.

Las nuevas:
- **Si el chat deja archivos en el repo sin commitear,** avisarle a Code en el mismo texto. Si no, pueden quedar fuera de los commits, o entrar en uno que no corresponde.
- **No hagas que una corrida nocturna toque los mismos documentos que un prompt que está corriendo.** Uno por vez, en la misma sesión de Code.
- **Los zips no se commitean:** `*.zip` y `docs/auditorias/` están en `.gitignore`. Lo que tiene que quedar se extrae a `docs/archivo/` o `docs/reportes/`.
- **Para Design, pegá el pedido en la conversación del proyecto existente;** en un chat nuevo, Design arma un proyecto vacío.
- **Los nombres de cuenta:** Design no ve el mail. Para distinguir proyectos, pedile señales: el id del design system adjunto, si tiene `explorations/` y cuántos temas define.

---

## 9 · Un detalle que conviene no perder

Lo de hoy fue lo mismo de siempre, aplicado al diseño: **antes de auditar, mirar qué hay de verdad.** El kit parecía la referencia y era de junio; el trabajo de Design parecía estar en el repo y no estaba. Se midió con hashes contra el commit antes de decidir qué se trae. Cuando haya que decidir entre suponer y medir, se mide.
