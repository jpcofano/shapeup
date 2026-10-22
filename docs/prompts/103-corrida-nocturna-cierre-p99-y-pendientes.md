# 103 — Corrida nocturna: cierre de P99 y pendientes chicos

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**. Copiá este archivo a `docs/prompts/` antes de empezar.

## Cómo se corre esta noche (lee esto primero)

Juan está durmiendo. **No preguntes nada: nadie va a contestar.** Las reglas de esta corrida reemplazan al «pará y reportá» habitual:

1. **Cada bloque se cierra por su cuenta.** Hacé los bloques en orden. Uno se da por terminado con:
   - `npx tsc -b` limpio;
   - `npx vitest run` verde (la suite de reglas se saltea sin emulador);
   - su commit;
   - su push.

   Si un bloque no queda verde, revertí sus cambios (`git restore` / `git checkout` de lo tocado en ese bloque), anotá por qué en el reporte y **seguí con el siguiente**. Nunca dejes el árbol a medias entre bloques.
2. **Si algo choca con un ADR o no entra en el modelo, no lo reinterpretes:** saltealo, anotá el choque con archivo y línea, y seguí. Una sola parte salteada no tumba el bloque entero si el resto se sostiene solo.
3. **Si una decisión es chica y no está fijada acá, tomá la opción más conservadora:**
   - la que cambia menos datos;
   - la que es reversible;
   - la que se parece a lo que ya hace la app en un caso igual.

   Anotala en el reporte, en «Decisiones que tomé». Si tu reporte anterior (P99 Partes 2 y 3) dejó preguntas abiertas, resolvelas igual y anotalas ahí.
4. **Commits y push, autorizados para esta corrida:**
   - Separados como siempre: `App —`, `Herramientas —` y `docs —`, con la lista de archivos en el cuerpo.
   - Push a `main` después de cada bloque verde.
   - Sin `--force`, sin reescribir historia y sin `--no-verify`.
   - Antes de cada push, `git fetch` y confirmar que `origin/main` es ancestro de `HEAD`. Si no lo es, no pushees: dejalo commiteado y anotalo.
5. **Prohibido en esta corrida:**
   - escribir en Firestore (ningún script con `--aplicar`; `limpiar-salud` ni en simulación);
   - `firebase deploy` de cualquier cosa;
   - cambiar `firestore.rules`: si un bloque lo necesita, saltealo y anotalo;
   - tocar el repo del puente;
   - borrar documentación (se archiva);
   - instalar dependencias nuevas de runtime.
6. **Usá agentes y modelos por tarea:**

   | Qué | Modelo |
   |---|---|
   | Exploración y lectura | Liviano |
   | Lógica pura con tests (`src/lib/`) | Intermedio |
   | Pantallas y lo que toca `EntrenarSesion`, `HistorialDetalle` o Home, **en serie** | Principal |
   | Documentación | Intermedio |
   | Revisión de cada bloque antes del commit, por un agente que **no** escribió ese código. Revisa el diff contra este prompt y los ADRs, y corre `tsc` y `vitest` | Principal |

   Dos agentes nunca editan el mismo archivo a la vez.
7. **El reporte se va escribiendo.** Al terminar cada bloque, actualizá `docs/auditorias/ultimochat.md` (sobrescribiéndolo, pero con todo lo de la corrida hasta ahí). Si la corrida se corta, Juan tiene que poder ver qué quedó hecho.

---

## Bloque 1 — P99 Parte 4: la pantalla de la sesión

Lo que pedía la Parte 4 de `docs/prompts/99-marcas-y-analisis-de-sesion.md`, con las decisiones del chat que ya están en `docs/ANALISIS-ASISTIDO.md` (§3, §4, §6 y «lo decidido»).

**La pantalla de §6 queda como está.** Es la decisión del chat: la auditoría con Design (P101) viene después y la ajusta. De arriba hacia abajo, en `HistorialDetalle`:

1. **Calidad**, si aparece. Va primero, con estilo de aviso, porque cambia cómo se lee el resto.
2. **Veredicto** (solo con análisis de esquema 3).
3. **Badges de nivel 1**, en el orden del catálogo.
4. **Dos destacados** (solo con análisis).
5. **La curva**, con las marcas que tienen momento o tramo.
6. **Las secundarias de nivel 2**, en una fila discreta y sin color.
7. **El detalle del análisis**, plegado.

**La curva es un componente nuevo** (por ejemplo, `components/historial/CurvaSesion.tsx`):
- SVG a mano, sin librería nueva, con el estilo de `TrendChart`/`Sparkline` y los tokens de `src/styles/tokens.css`.
- Las bandas de zona usan `zonasUsadas` de la sesión.
- Los tramos (sostenido, bajo) van como franja; los momentos (pico, entrada en calor, picos en Z5, la mayor bajada) como punto o línea.
- **Las marcas de la app van sólidas; las del análisis, con borde punteado y la etiqueta «análisis».**
- Tocar una marca muestra su texto.
- Tiene que entrar a 360 px sin scroll horizontal.
- Sin curva guardada: no se dibuja y no se ocupa lugar. Las marcas que no salen de la curva igual se ven.

**Además:**
- **Una sesión sin analizar** se ve igual en todo lo medido.
- **Los análisis guardados con esquema 2** se siguen viendo como hoy.
- **La tarjeta de revisión de la FC máxima** (`RevisionFcMax`): en las sesiones excluidas, muestra el pico **crudo** que disparó la exclusión y el **suavizado** (pendiente del 03/10). Si el crudo no está a mano sin una lectura nueva, mostrá solo lo que haya y anotalo.

**Tests:**
- el orden de la pantalla con y sin análisis;
- sin curva;
- con esquema 2;
- que una `refMarca` del análisis se dibuje sobre la marca de la app correcta;
- la tarjeta de revisión con los dos picos.

**Capturas:** si podés levantar `vite preview` y sacar capturas con un navegador headless (Playwright ya está si lo trae el repo; si no, no instales nada), guardá la sesión testigo y una sesión sin curva, en claro y en oscuro, a 390 px, en `docs/auditorias/capturas/`. Si no se puede, anotalo. Le sirven a Juan a la mañana y a la auditoría con Design.

## Bloque 2 — P99 Parte 5: cerrar la documentación

- **`docs/ADR.md`:** el **ADR #047**, «Dónde viven las marcas». Recoge:
  - las de la curva se calculan al enriquecer y se guardan con versión (ADR #038);
  - las demás se calculan al mostrar;
  - los ids son fijos;
  - el récord es «a la fecha»;
  - la prioridad la fija la app.

  Y su línea en el índice de `CLAUDE.md`.
- **`docs/ANALISIS-ASISTIDO.md`:** el estado al día (P99 hecho), §6 como quedó construido y el catálogo final.
- **`docs/ROADMAP-producto.md`:** P99 ✅. En el backlog:
  - **«El sueño y la FC de reposo solo llegan si se importó el ZIP de ese día: la vía D no los trae. Evaluar sumarlos al puente (repo shapeup-bridge)»**;
  - P101 (auditoría con Design) como lo próximo de pantalla.
- **`docs/MAPEO-IMPLEMENTACION.md`:** la bitácora de P99 cerrada y la de esta corrida (P103).

## Bloque 3 — Los dos restos de P102

1. **«Ver todas» por Programas o Ejercicios.**
   - **Lo que pasa hoy:** la prevista viaja solo por la pestaña Rutinas de Biblioteca. La franja «Cambiando…» sigue a la vista en las otras pestañas, pero lo que se empieza por ahí no la lleva.
   - **Arreglo:** que la prevista viaje por los caminos que empiezan una sesión desde Programas (`ProgramaDetalle` → rutina) y desde Ejercicios (sesión de un ejercicio suelto).
   - **Si algún camino no se puede sin reinterpretar:** la franja se oculta en esa pestaña, así no promete algo que no hace.
   - Con test.
2. **«Atrás» vuelve a aplicar el cambio.** Al sellar la prevista en `EntrenarState`, consumí el `state` de la navegación y los parámetros `enLugarDe`/`motivo` de la URL (con `replace`), así volver con «atrás» no la re-aplica. Con test.

## Bloque 4 — `SesionJuego`: una salida que funcione

Pendiente del 03/10.
- **Lo que pasa hoy:** la ✕ solo navega a `/entrenar`. El reloj sigue en el teléfono y vuelve al entrar, y «Terminar» guarda directo.
- **Lo que queda:** igual que en VR por escalones, sin dificultad, porque estos juegos no cuentan como entrenamiento.
  - **La ✕ y el «atrás»** abren `HojaSalida` con «Salir sin guardar», «Seguir» y «Terminar y guardar».
  - **«Salir sin guardar»** borra el estado local (y lo que haya en Firestore de esa sesión, si existe con la función de descarte que ya hay). Con minutos jugados, confirma con «Se descartan N min jugados.».
  - **«Terminar»** sigue guardando como hoy.
- Si `SesionJuego` no usa `EntrenarState` y adaptarlo choca con algo, hacé lo mínimo: la hoja con «Salir sin guardar» que confirma y limpia. Anotá el resto.
- Tests como los de `EntrenarSesion.salidaVR.test.tsx`.

## Bloque 5 — Guardar la prescripción en las sesiones de fuerza

Pendiente del backlog («chico, no urgente»).
- **Qué se guarda:** al cerrar una sesión de fuerza, cada bloque guarda la prescripción con la que se entrenó: series, reps, carga y descanso de la rutina en ese momento. Va en un campo opcional nuevo de `BloqueRegistro` (por ejemplo, `prescripcionFuerza`). **No toques** `prescripcionUsada`, que es de VR.
- **Para qué:** la historia no tiene que depender de la rutina de hoy. Es el mismo criterio que el `prescripto` de VR (ADR #039).
- **Lo que no cambia:** ningún cálculo existente, ni el paquete. Si el paquete del análisis la puede mandar como contexto de la sesión sin pasar de los 60 KB, sumala. El análisis no evalúa el cumplimiento (decisión 6 del diseño), así que va solo como contexto.
- Tests.

---

## El reporte final

En `docs/auditorias/ultimochat.md`, para que Juan lo lea a la mañana:

1. **Una tabla de bloques:** hecho, salteado o parcial; commit; push.
2. **Por bloque:**
   - qué cambió para Juan, en dos o tres líneas;
   - los archivos;
   - los tests nuevos.
3. **«Decisiones que tomé»**, incluidas las que cerraban preguntas de tu reporte anterior.
4. **Choques con ADRs o con el modelo,** con archivo y línea.
5. `tsc` y `vitest` al final, con el conteo de tests.
6. **Lo que tiene que hacer Juan, en orden:**
   1. confirmar `origin/main` = `HEAD`;
   2. `npm run build`;
   3. `firebase deploy --only hosting` (las reglas no cambian);
   4. en el teléfono, cerrar la app del todo y abrirla. La primera sincronización re-enriquece las sesiones a la v9 y les suma curva y marcas;
   5. cargar su año de nacimiento en Perfil → Configuración;
   6. qué mirar, en claro y en oscuro.
7. **Preguntas abiertas,** si quedaron, para el chat.
