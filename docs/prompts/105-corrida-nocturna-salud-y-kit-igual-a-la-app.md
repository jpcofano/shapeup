# 105 — Corrida nocturna: los datos de salud, el kit igual a la app y el diagnóstico de diseño

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**. Este archivo ya está en `docs/prompts/`: lo dejó el chat, sin commitear. Va en el commit del Bloque 0.

**Punto de partida:** `HEAD` = `origin/main` = `0b91ea7` (cierre de P103). Si no es así, no empieces: anotalo en el reporte y terminá.

## Cómo se corre esta noche (lee esto primero)

Juan está durmiendo. **No preguntes nada: nadie va a contestar.** Las reglas de P103 siguen valiendo, con los cambios de abajo:

1. **Cada bloque se cierra por su cuenta.** Se da por terminado con:
   - `npx tsc -b` limpio;
   - `npx vitest run` verde (la suite de reglas se saltea sin emulador);
   - su commit y su push.

   Si un bloque no queda verde, revertí lo que tocaste en ese bloque, anotá por qué y **seguí con el siguiente**. Nunca dejes el árbol a medias entre bloques.
2. **Si algo choca con un ADR, no lo reinterpretes:** saltealo, anotá el choque con archivo y línea, y seguí.
3. **Si una decisión chica no está fijada acá, elegí la opción más conservadora:**
   - la que cambia menos datos;
   - la que es reversible;
   - la que se parece a lo que ya hace la app en un caso igual.

   Anotala en «Decisiones que tomé».
4. **Commits y push:**
   - separados en `App —`, `Herramientas —` y `docs —`, con la lista de archivos en el cuerpo;
   - push a `main` después de cada bloque verde;
   - sin `--force` y sin `--no-verify`;
   - antes de cada push, `git fetch` y confirmar que `origin/main` es ancestro de `HEAD`.
5. **Prohibido:**
   - escribir en Firestore: ningún `--aplicar`, ni `limpiar-salud` en simulación;
   - `firebase deploy`;
   - tocar `firestore.rules` o el repo del puente;
   - borrar documentación (se archiva);
   - instalar dependencias, de runtime o de desarrollo. Esto incluye Playwright y `npx` de paquetes que no estén en el repo.
6. **Leer Firestore sí se puede,** con los scripts que ya existen y declaran «solo lectura» (`auditoria:salud`, `inventario:sdk`) o con uno nuevo que cumpla el mismo patrón (`scripts/pureza.test.ts`, la marca «corrida: exento — solo lectura»).
7. **Los datos de salud de Juan no van a git.** Los reportes con valores van a `docs/auditorias/` (está en `.gitignore`). En lo que se commitea (docs, tests, commits) no van valores reales de salud: si un test necesita un caso, se inventa.
8. **Agentes y modelos:**

   | Qué | Modelo |
   |---|---|
   | Exploración y lectura | Liviano |
   | Lógica pura con tests (`src/lib/`, `src/import/`) y scripts | Intermedio |
   | Pantallas y el kit (`preview/`, `ui_kits/`), **en serie** | Principal |
   | Documentación y reportes | Intermedio |
   | Revisión de cada bloque antes del commit, por un agente que **no** escribió ese código. Revisa el diff contra este prompt y los ADRs, y corre `tsc` y `vitest` | Principal |

   Dos agentes nunca editan el mismo archivo a la vez.
9. **El reporte se va escribiendo.** Al cerrar cada bloque, actualizá `docs/auditorias/ultimochat.md` con todo lo de la corrida hasta ahí.
10. **Juan no deploya hasta que el chat revise esta corrida.** Ponelo así en el reporte.

---

## Bloque 0 — Respuestas a P103 y orden del plan de diseño (docs)

**Las respuestas a las preguntas abiertas de P103:**
1. **«Ver todas» por Programas:** alcanza con ocultar la franja. Queda así.
2. **Sesión libre:** sin prescripción, como está.
3. **`prescripcionFuerza` en `ultimasSesiones`:** no por ahora. Va al backlog como decisión de P94.
4. **Restos de P104** (`preview/brand-pwa.html`, la línea de assets del README del kit, los estilos de los HTML archivados): se arreglan en el Bloque 4 de esta corrida.

Anotá 1 a 3 donde corresponda según la tabla «Documentación» de `CLAUDE.md` (lo de P102 en `RUTINAS-VR.md`, lo del análisis en `ANALISIS-ASISTIDO.md`, el backlog en el roadmap).

**El orden del plan de diseño cambia** (`docs/AUDITORIA-DISENO.md` §5, paso 2b). Antes: el chat armaba el artifact Design System, Juan lo revisaba, y recién después un prompt de Code igualaba la raíz. Ahora:
1. esta corrida deja la raíz igual a la app (Bloque 4), con el criterio ya cerrado: **cuando no coinciden, gana la app**;
2. el chat arma el artifact Design System desde la raíz ya igualada y desde el código;
3. Juan lo revisa.

Escribí el cambio en el §5 y anotá que P105 es esta corrida. **La numeración sigue en P106.** Corregilo también en el §5 de `docs/ESTADO-DEL-PROYECTO.md`. No toques nada más de ese archivo.

**Commit:** `docs — P105 Bloque 0: respuestas a P103 y orden del paso 2b`, con este prompt.

## Bloque 1 — Auditoría de los datos de salud (solo lectura), con la presión primero

Juan pidió revisar si los datos de salud están bien, **en especial la presión arterial**. Primero se mide; se arregla solo lo que se reproduzca con un test.

**1. Corré la auditoría que ya existe:** `npm run auditoria:salud`, para `juanpablo`. Si hay un export ZIP de Samsung Health en `C:\Users\Usuario\Downloads` (el más nuevo que tenga `blood_pressure`), sumá `--zip=<ruta>`. Si no hay, sin ZIP, y anotalo. El reporte va a `docs/auditorias/auditoria-salud-2026-10-22.md`.

**2. La presión, punto por punto.** Lo que el chat vio leyendo el código. Son sospechas, no hechos: confirmá o descartá cada una.

| # | Sospecha | Dónde | Cómo se verifica |
|---|---|---|---|
| P1 | «Último del día» es el último **en el orden del archivo**, no el más tardío por hora. Si el CSV no viene ordenado, se guarda una lectura cualquiera | `src/import/samsungHealth.ts`: `lastArr` y el bloque `blood_pressure` (cerca de la línea 686) | Test con dos lecturas del mismo día en orden inverso |
| P2 | La sistólica y la diastólica se agrupan por separado. Si una fila tiene una sola de las dos, el par guardado puede salir de **dos lecturas distintas** | El mismo bloque (`bySisDay` / `byDiaDay`) | Test con una fila sin diastólica después de una completa |
| P3 | El día se asigna con `time_offset`. Verificá que una lectura a las 22:00 de Buenos Aires quede en ese día y no en el siguiente | `groupByDay` → `epochToDate` | Test con un epoch de las 22:00 −03:00, y con los datos reales |
| P4 | Valores imposibles o invertidos: sistólica ≤ diastólica, fuera de 60–260 / 30–160, unidades que no son mmHg | Lo leído de `/metricas-salud` | La auditoría: contalos y listá las fechas |
| P5 | Lo que muestra la app contra lo guardado: el Resumen (`resumenSalud.ts`, «último día con los dos valores») y Progreso (`ProgresoTab.tsx`) | Las dos pantallas | Calculá con los datos leídos lo que mostraría cada una y comparalo con el último ZIP, si está |
| P6 | La presión **solo llega con el ZIP**: el puente y `/ingesta-sdk` no la traen. Verificá la fecha del último dato y si la app lo deja claro o parece «al día» | `src/import/`, `ResumenTab.tsx` | La fecha más nueva guardada contra la de hoy |

**3. Después, el resto de las métricas,** con los mismos cuatro chequeos:
- **plausibilidad:** rangos y unidades;
- **día asignado:** la zona horaria;
- **duplicados:** el mismo `idMetrica` de dos fuentes, o el mismo día con dos valores;
- **origen:** ZIP, puente o ambos, y si se pisan.

Las métricas son la FC de reposo (con lo que dejó P56: el agregado general no es reposo), la SpO2, el peso y las mediciones, el sueño, los pasos, la frecuencia respiratoria y la temperatura de la piel.

**4. Lo que se arregla en esta corrida:** solo errores de código **reproducidos con un test** en `src/import/` o `src/lib/`. Por ejemplo, P1 y P2, si se confirman.
- El arreglo de P2 es guardar el par de la **misma lectura**: la más tardía del día que tenga los dos valores.
- **No cambia** la decisión de P56: la presión va sin semáforo y nunca alarma con colores.
- Commit `App — P105 Bloque 1: …`.

**5. Los datos ya guardados mal no se tocan.** Si hay que corregirlos:
- escribí el script de corrección (`Herramientas —`), con el patrón de siempre: en seco por defecto, `--aplicar` para escribir, y respaldo;
- **no lo corras**, ni en seco si escribe algo;
- si se arregla reimportando el ZIP, decilo y dejá los pasos para Juan, en orden y con el deploy en el lugar correcto. Un script que cambia datos base va antes del deploy que los usa.

**6. En el reporte,** una tabla. En `ultimochat.md` se pueden poner valores porque git lo ignora, pero solo los necesarios.

| Métrica | Chequeo | Resultado | Evidencia | ¿Se arregló? | Qué tiene que hacer Juan |
|---|---|---|---|---|---|

## Bloque 2 — Una página de QA de la sesión, sin login (App)

Para poder sacar capturas de la pantalla de P99 sin iniciar sesión. Igual que `/qa/temas`, `/qa/home-redux` y `/qa/salud-resumen`.
- **Ruta nueva:** `/qa/sesion` (`QaSesion.tsx`), sumada a `QA_SIN_LOGIN` en `App.tsx`.
- **Qué muestra:** el detalle de la sesión con los mismos componentes que `HistorialDetalle`, sin lecturas de Firestore. Datos: la sesión testigo de `src/lib/__fixtures__/sesionTestigo20260927.ts`, que ya es pública en el repo. Muestra cuatro casos:
  1. con curva y con un análisis de esquema 3 inventado;
  2. con curva y sin análisis;
  3. sin curva;
  4. con un análisis de esquema 2.
- **Un selector de tema y de modo en la página,** como en `QaTemas`, y que también se pueda elegir por la URL (`?tema=ion&modo=oscuro`), para las capturas.
- **Si los componentes no se pueden usar sin Firestore** sin cambiarlos, hacé lo mínimo y anotalo. No reescribas `HistorialDetalle`.
- Un test de que la ruta carga sin login y muestra los cuatro casos.
- **Commit:** `App — P105 Bloque 2: /qa/sesion para capturas sin login`.

## Bloque 3 — Capturas (sin instalar nada)

- Levantá `npm run build` y `npx vite preview` (Vite ya está en el repo).
- **Usá el navegador que ya está en la PC,** en modo headless: Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`) o Chrome, con `--headless=new --screenshot=<archivo> --window-size=390,<alto> <url>`. Si ninguno anda, anotalo y seguí.
- **Qué capturar, a 390 px de ancho, cada uno en claro y en oscuro con los 5 temas donde la página lo permita:**
  - `/qa/temas`, `/qa/home-redux`, `/qa/salud-resumen` y `/qa/sesion`: cada caso, en claro y en oscuro, por lo menos con `ion` y uno más;
  - `ui_kits/shapeup/index.html` y las tarjetas de `preview/`, servidas en estático desde la raíz.
- **Destino:** `docs/auditorias/capturas/2026-10-22/`, que git ignora, con un `indice.md` que diga qué es cada archivo.
- Las capturas se sacan **antes y después** del Bloque 4: así el chat ve lo que cambió en el kit. Las de «después» van en una subcarpeta `despues-kit/`.
- Este bloque no tiene commit (todo queda ignorado). Anotalo en la tabla.

## Bloque 4 — P105: el kit de la raíz igual a la app (docs)

Es el paso 2b del lado del repo. **La fuente es el código, no los documentos:**
- `src/styles/tokens.css`, `src/styles/home-redux.css` y las fuentes que carga `index.html`;
- `src/components/` y `src/routes/`.

**Cuando el kit y la app no coinciden, gana la app.** Este bloque **no cambia nada de `src/`** ni propone mejoras: eso lo decide la auditoría.

Hacelo en cuatro partes, cada una con su commit y su push, en este orden. Si una no queda bien, revertila y seguí con la siguiente.

**4a. Los tokens** (`colors_and_type.css`, `styles.css`):
- los 5 temas (`ion`, `volt`, `blaze`, `pulse`, `indigo`) × claro y oscuro, con los valores de la app;
- **el oscuro, teñido por tema, como en la app.** La diferencia con el design system de Design (que lo deja neutro) se anota como decisión abierta para la auditoría; no se resuelve acá;
- los semánticos por modo, el movimiento (`--dur-*`, `--ease-*`) y el anillo (`--ring-from/to`);
- las direcciones de Home (Pulse `.dir-a` y Premium `.dir-c`, con la rampa de acento y sus fuentes) en una sección aparte, que diga que **en la app solo se aplican a Home y a la barra de navegación**;
- el comentario de `styles.css` que dice «8 temas».

Commit: `docs — P105 4a: tokens del kit iguales a la app`.

**4b. `README.md` y `SKILL.md` de la raíz:**
- temas, modos, fuentes y los 5 estilos de Inicio;
- las tres capas de estilos (el kit, `tokens.css` y `home-redux.css`) y qué alcanza cada una;
- la lista de pantallas de la app y si están o no en el kit;
- la línea de assets (resto de P104).

Commit: `docs — P105 4b: README y SKILL al día`.

**4c. `preview/`:**
- arreglá `brand-pwa.html` (apunta a `../assets/pwa/icons/`; en el repo es `../assets/pwa/`) y revisá que ninguna otra tarjeta tenga rutas rotas;
- actualizá las tarjetas de color y tipografía a los tokens nuevos;
- **tarjetas nuevas** de los componentes posteriores a junio, recreados **como están construidos** (leé el componente; no los rediseñes). En este orden, hasta donde llegues:
  1. `CurvaSesion` y las marcas;
  2. `BarraZonas`;
  3. `TrendChart`;
  4. `HojaSalida`;
  5. `FranjaCambio` y `HojaCambiar`;
  6. el chip de sincronización;
  7. la tarjeta de adherencia;
  8. `RevisionFcMax`.

Commit: `docs — P105 4c: preview al día`.

**4d. `ui_kits/shapeup/`:** las pantallas que faltan, como están construidas, en este orden y hasta donde llegues:
1. el detalle de la sesión con curva y marcas;
2. la VR por escalones (inicio y cierre);
3. `SesionJuego` con su hoja de salida;
4. Configuración;
5. las pestañas nuevas de Salud.

Lo que no llegues, listalo en el reporte.

Commit: `docs — P105 4d: pantallas nuevas en el kit`.

**Los estilos de los HTML archivados** en `docs/archivo/claude-design/` (resto de P104): si se ven rotos porque apuntan a rutas que ya no existen, **no los edites**; son archivo. Anotá en el `README.md` de esa carpeta qué ruta esperaban.

**Verificación de cada parte:** servila en estático desde la raíz y sacale captura con el navegador headless. Confirmá que carga y que las rutas a `colors_and_type.css` y `assets/` resuelven. Nada de la raíz entra al build: `npx tsc -b` y `npx vitest run` siguen igual.

## Bloque 5 — Diagnóstico de diseño medible (insumo de la auditoría, sin arreglar nada)

**Archivo:** `docs/reportes/diagnostico-diseno-2026-10-22.md`. **Solo hallazgos medidos.** Las propuestas y las decisiones las toma la auditoría con el chat. No cambies `src/`.

**1. Contraste WCAG,** calculado desde `tokens.css`:
- texto, texto secundario, acento sobre superficie y texto sobre el botón principal;
- para los 5 temas × claro/oscuro, y para las dos direcciones de Home;
- una tabla con la razón y si pasa AA (4,5:1 para texto normal, 3:1 para texto grande y componentes).

Si escribís un script para calcularlo, que sea puro y con test (`Herramientas —`).

**2. Colores y medidas escritos a mano:** hex, `rgb()` y `px` de fuente fuera de los tokens, en `src/components/` y `src/routes/`. Conteo por archivo y los 15 peores.

**3. Tamaños de toque** menores de 44 px y **fuentes** menores de 12 px. Lo que se pueda medir leyendo el código; si hace falta el navegador, usá las capturas del Bloque 3.

**4. Las dos capas:** qué pantallas usan `home-redux.css` y cuáles solo `tokens.css`, y en qué difieren (superficies, rampa, radios y fuentes).

**5. Lo diseñado y nunca construido:**
- las tres propuestas del handoff del 25/09 (`AUDITORIA-DISENO.md` §8);
- lo de `docs/archivo/claude-design/cuenta-A/explorations/` que no está en la app.

**6. La tabla de hallazgos:**

| # | Hallazgo | Pantalla o archivo | Severidad (alta, media o baja) | Evidencia medida | Decisión abierta para la auditoría |
|---|---|---|---|---|---|

**Commit:** `docs — P105 Bloque 5: diagnóstico de diseño medible`.

## Bloque 6 — Cierre (docs)

- **`docs/MAPEO-IMPLEMENTACION.md`:** la bitácora de P105.
- **`docs/ROADMAP-producto.md`:** P105 hecho; lo que haya salteado, al backlog.
- **`docs/AUDITORIA-DISENO.md` §5:**
  - el paso 2b, hecho del lado del repo (sigue el artifact);
  - el paso 3, con las rutas de las capturas;
  - el diagnóstico, como insumo del paso 4.
- **`docs/SAMSUNG-HEALTH-MAPEO.md`:** lo que haya cambiado de la presión o de otra métrica.

**Commit:** `docs — P105: cierre`.

---

## El reporte final (`docs/auditorias/ultimochat.md`)

1. **Una tabla de bloques:** hecho, salteado o parcial; commit; push.
2. **Por bloque:**
   - qué cambió para Juan, en dos o tres líneas;
   - los archivos;
   - los tests nuevos.
3. **La tabla de salud del Bloque 1,** primero la presión.
4. **«Decisiones que tomé».**
5. **Choques con ADRs,** con archivo y línea.
6. **`tsc` y `vitest` al final,** con el conteo.
7. **Lo que tiene que hacer Juan, en orden.** El primer paso es «**esperar a que el chat revise esta corrida**». Después: los scripts que haya que correr (primero en seco), el build y el deploy, en el orden correcto.
8. **Preguntas abiertas** para el chat.
