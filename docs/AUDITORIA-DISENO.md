# Auditoría de diseño (P101) — plan, diagnóstico y estado

Creado el 21/10/2026 en el chat con Claude (cuenta `jpcofano.ia@gmail.com`). Juan cambia de cuenta: **este documento es el traspaso del área de diseño**. El estado general sigue en `docs/ESTADO-DEL-PROYECTO.md`, que remite acá.

**Estado al 21/10:** paso 2a hecho (P104): la raíz del repo tiene el sistema de diseño de la cuenta A y lo demás quedó archivado (§8). Sigue el paso 2b. El proyecto del handoff no se encontró.
**22/10:** el orden del paso 2b cambió: primero Code iguala la raíz a la app (P105), después el chat arma el artifact (§5). **P105 hizo la parte del repo del 2b**, las capturas del paso 3 y el diagnóstico medible para el paso 4.

---

## 0 · Para el próximo chat

1. Leé este documento entero antes de proponer nada de diseño.
2. Fijate en el §5 qué paso está hecho (☑) y cuál sigue.
3. Si Juan dice que ya exportó, los archivos están en `C:\Users\Usuario\Downloads` (ver §6). Con el chat vinculado a la PC se leen directo. Si no está vinculado, Juan los adjunta.

---

## 1 · Decisiones de Juan (21/10)

- **Primero el kit tiene que quedar igual a la app.** Recién después se audita. Auditar contra el kit de junio marcaría como errores cosas que fueron decisiones.
- **La auditoría se hace con Design dentro de Claude**, no en la versión de Claude Design por separado. Esa versión cierra el **14/12/2026**: todo lo que haya ahí se exporta antes.
  - Se usan dos tipos de artifact: **Design System** (tokens, componentes con vista previa en vivo, reglas) y **Design** (lienzo con pantallas, para comparar lo real con lo propuesto).
- **La fuente de verdad del diseño sigue en el repo** (P100: el sistema de diseño de la raíz, `README.md`, `SKILL.md`, `colors_and_type.css`, `assets/`, `preview/` y `ui_kits/`). El artifact Design System se construye leyendo el código real y es el banco de trabajo; lo que se decide vuelve a la raíz del repo por un prompt de Code.
- Las decisiones de P99 del 21/10 están en `ANALISIS-ASISTIDO.md` §8 y en el traspaso.

---

## 2 · Diagnóstico: el kit de la raíz contra la app (21/10)

El kit de la raíz es del **06/06/2026** (`README.md`, `SKILL.md`, `colors_and_type.css`, `preview/`, `ui_kits/shapeup/`). La app siguió por otro lado:

| | Kit (06/06) | App (al 19/10, `55a20d1`) |
|---|---|---|
| Temas | 8 (`ion`, `volt`, `solar`, `blaze`, `crimson`, `pulse`, `grape`, `indigo`), **solo oscuro**. El `README.md` se contradice: en un lado dice 5 temas y en la tabla lista 8 | **5 temas × claro/oscuro/sistema** (P65): `ion`, `volt`, `blaze`, `pulse`, `indigo`. En oscuro, la superficie se tiñe por tema; en claro, la superficie es neutra y compartida |
| Tipografía | `system-ui`, «no se cargan webfonts» | `index.html` carga **Archivo** (Pulse) y **Hanken Grotesk** (Premium) |
| Inicio | Un solo diseño | **5 estilos**, elegibles en Perfil: Aurora (por defecto), Stadium, Clásico, Pulse y Premium |
| Tokens | Los básicos | Además: movimiento (`--dur-*`, `--ease-*`), anillo de Aurora (`--ring-from/to`), semánticos por modo (P65) y, en Pulse/Premium, la rampa de acento (`--accent-subtle/-border/-muted/-solid/-strong`), `--card2`, `--track`, `--pos`/`--neg` |
| Pantallas | Las de junio | Faltan, como mínimo: Configuración (P86), el chip de sincronización, la VR por escalones (inicio, cierre y progresión), VR a medida, la sesión por tiempo, la sesión de juego, la hoja de salida, «Cambiar» (`FranjaCambio`, `HojaCambiar`), la adherencia y su serie, `BarraZonas`, `TrendChart`, el puente y las pestañas de Salud, el análisis de sesión, `RevisionFcMax`, `PantallaError`. Con P103 se suma `CurvaSesion` |

**Hallazgo de estructura.** Las direcciones de Home Redux (Pulse `.dir-a` y Premium `.dir-c v21`, en `src/styles/home-redux.css`) **solo se aplican a Home y a la barra de navegación**. El resto de la app usa los tokens de `src/styles/tokens.css`, con otro juego de superficies y sin la rampa de acento. En el paso 2 eso se documenta tal cual. Si hay que unificarlo, lo decide la auditoría (paso 4), no el paso 2.

**Páginas de QA que ya existen:** `/qa/temas` (`QaTemas.tsx`: 5 temas × 2 modos) y `QaHomeRedux.tsx` (2 direcciones × 2 modos × 5 acentos). `QaSaludResumen.tsx` también. Sirven para las capturas.

---

## 3 · Trabajo de Design que no está en el repo

- **Junio.** `MAPEO-IMPLEMENTACION.md` tiene una sección «Kit (Design completado — pendiente de repo)»: K-MEDIA (pestañas Foto/Demo/Músculo), K-HOME3 (Home con Aurora/Stadium/Clásico en el kit) y K-PROG (mapa muscular, sparklines, récords, sesión libre). El `ui_kits/shapeup/` del repo **no tiene nada de eso** (verificado el 21/10: `screens-home.jsx` no menciona Aurora ni Stadium; `screens-entrenar.jsx` no tiene MediaTabs).
- **25/09.** Juan le pasó a Design el handoff `handoff-design-2026-09-25.md` (está en Descargas) con 6 superficies nuevas: Configuración (Mío / De la familia), chip de sincronización, tarjeta de progresión de VR, sesión por tiempo, sesión de juego y chip de dificultad. Lo que Design haya hecho con eso **no está en el repo**.
- **Documentos citados que no están en el repo:** `explorations/DECISION-home-aurora.md` (lo cita P31) y `explorations/home-redux/AUDITORIA-temas-claro-oscuro.md` (lo cita P65).
- **Dos cuentas.** Juan trabajó Design en **dos cuentas** y no sabe cuál está más avanzada. Por eso cada export lleva un inventario (§6) que permite compararlos.

---

## 4 · Cómo se usa Design dentro de Claude

- No hay una aplicación aparte. En el chat, Claude crea el artifact desde su tipo («Design System» o «Design»). Aparece como una tarjeta en el chat y queda guardado, privado, en la cuenta de Juan, en la galería de artifacts.
- Juan lo abre, lo mira y deja comentarios. Claude lo actualiza en el mismo artifact.
- **El artifact queda en la cuenta en que se creó.** Si Juan cambia de cuenta, lo que no esté en el repo no viaja. Por eso **todo lo decidido vuelve al repo** (§1).
- Con el chat vinculado a la PC (app de escritorio), Claude lee el repo de OneDrive y Descargas, y puede sacar capturas de la app desplegada con el navegador integrado, si ShapeUp ya tiene sesión iniciada ahí.

---

## 5 · Plan, paso a paso

- ☐ **1. Exportar Design de las dos cuentas.** Juan pega el texto del §6 en cada proyecto de Design, y después descarga el proyecto entero. Todo a Descargas, con el nombre de la cuenta. El avance se anota en el §8.
  - 21/10: las dos cuentas exportadas, menos el proyecto del handoff de la cuenta A, que no se encontró (§8). Por eso el paso queda abierto.
- ☑ **2a. Traer al repo lo de la cuenta A, tal cual.** Hecho el 21/10 por P104, sin el proyecto del handoff, que no se encontró.
  - La raíz del repo pasó a la versión de Design, que es estrictamente más nueva que la de junio (`42379e2`).
  - Las explorations y los mocks, **con las capturas que citan sus auditorías** (`audit-shots/`, `auditoria-evidencia/`, `_b.png`, `_c.png`, `_preview.png` y `_opts.png`, unos 330 KB), el lienzo y las variantes de ícono fueron a `docs/archivo/claude-design/`, con su origen (`963e774`). Los inventarios, a `docs/reportes/`.
  - No se trajeron los generados de la plataforma (`_ds_bundle.js`, `_ds_manifest.json`, `_adherence.oxlintrc.json` y `.thumbnail`), `uploads/` (copias viejas de documentos del repo) ni el design system de la cuenta B, del que solo se guardó el brief.
- ☐ **2b. Kit = app.** **Orden nuevo (22/10):**
  1. **Code deja la raíz igual a la app** (P105, la corrida nocturna del 22/10, Bloque 4): `README.md`, `SKILL.md`, `colors_and_type.css`, `preview/` y `ui_kits/`. El criterio ya está cerrado: **cuando no coinciden, gana la app.**
  2. **El chat arma el artifact Design System** desde la raíz ya igualada y desde el código real (`tokens.css`, `home-redux.css`, `src/components`, `src/routes`), más lo rescatable de los exports.
  3. **Juan lo revisa.**

  _Antes (21/10): el chat armaba el artifact, Juan lo revisaba y recién después un prompt de Code igualaba la raíz._
  - **22/10: el punto 1 está hecho (P105, Bloque 4).**
    - Tokens: `741c187`.
    - README y SKILL: `769dfbd`.
    - `preview/`: `fb134ae`.
    - `ui_kits/shapeup/pantallas-nuevas.html`: `ab0ede5`.

    Siguen los puntos 2 y 3: el artifact y la revisión de Juan. Lo que faltó del kit está en el backlog del roadmap.
  - Lo que Design propuso y nunca se construyó queda listado aparte, como insumo de la auditoría. No se porta solo.
  - Los inventarios de los exports se guardan en `docs/reportes/` (hallazgos que tienen que quedar); los zips no van a git.
- ☐ **3. Capturas reales.** _22/10 (P105, Bloque 3):_
  - **Dónde están:** en `docs/auditorias/capturas/2026-10-22/`, que git ignora; ver su `indice.md`. Las del kit de después están en `despues-kit/`.
  - **Qué hay:** las páginas de QA (`/qa/sesion` en los 5 temas × 2 modos, `/qa/temas`, `/qa/home-redux`, `/qa/salud-resumen`) y el kit antes y después.
  - **Cómo se sacaron:** a 390 px, desde el build local, sin P103 desplegado.
  - **Qué falta:** las de la app real con sesión iniciada.

  Lo que pedía el paso: con P103 desplegado, cada pantalla en claro y en oscuro, a 390 px, más las páginas de QA. Pueden ser las de `docs/auditorias/capturas/` (si P103 las sacó) o las del navegador integrado. Más las capturas del 02/10.
- **Hallazgos 1 y 2 del diagnóstico de P105 (P106, 23/10):**
  - **El 1 está resuelto** (`ca93e7f`): `--on-accent` oscuro en Pulse e Indigo oscuro; todos los temas pasan AA en el botón principal (6,04 y 6,76).
  - **El 2 quedó salteado:** el área de 44 px de la ✕ tapa botones vecinos en tres lugares; ver el backlog del roadmap.
- ◐ **4. Auditoría: hecha para el detalle de la sesión y Salud → Resumen (P109, 23/10); sigue para el resto.**
  - **Hecho** (P109): las seis decisiones de abajo, construidas (`adf3e71`, `56f0e48`, `3fb43f1`) y en el kit (`15ab607`, `30e9264`). Capturas en `docs/auditorias/capturas/2026-10-23/` (git las ignora). **Sin deploy hasta que el chat revise la corrida.**
  - **Lo que sigue de la auditoría:**
    - los hallazgos 3 a 15 del diagnóstico de P105 (`docs/reportes/diagnostico-diseno-2026-10-22.md`): toques debajo de 44 fuera de lo que tocó P109 (3), textos de 9 a 11 px (4), tamaños escritos a mano (5), las dos capas (6), oscuro teñido o neutro (7), la rampa de acento solo en Home (8), y los de menor severidad (9 a 15);
    - **si las direcciones de Home se extienden a toda la app** (hallazgo 6): P109 no las extendió; el detalle y el Resumen usan los tokens de `tokens.css`;
    - **si el oscuro va teñido o neutro** (hallazgo 7): P109 lo dejó teñido, como estaba.
  - Las decisiones del 22/10, de Juan con el chat, para el detalle de la sesión y Salud → Resumen. Las referencias están en `docs/prompts/109-diseno/` (`DetalleFinal.html`, `ResumenFinal.html` y `RampaZonas.html`), y las construye P109. **El lienzo de la auditoría y el artifact Design System viven en la cuenta de Claude de Juan:** la fuente de verdad es esa carpeta de referencias y el repo. Las decisiones cerradas:
  1. **Colores de zona como Samsung**, con un valor por modo (enmienda del ADR #045).
  2. **Nombres de Samsung donde entren**: el detalle, el chip de la zona dominante y Configuración. La forma larga es «Anaeróbico · Z4»; donde no entra, «Z4».
  3. **La curva se pinta por zona**:
     - sin bandas de fondo, con líneas guía en los pisos de zona y las ppm a la derecha, y un eje de tiempo de 4 o 5 marcas;
     - las marcas de la app y del análisis salen de la curva y pasan a ser chips que se tocan, debajo de ella;
     - el pico queda como un punto.
  4. **«Tiempo en zonas»**, estilo Samsung, en lugar de las dos barras apiladas.
  5. **Salud → Resumen**:
     - el puente en una línea cuando está al día;
     - el sueño de anoche destacado;
     - las tarjetas de «Tu cuerpo»;
     - las pestañas «Cuerpo» y «Tendencias».
  6. **Todo toque mide al menos 44 px.**

  Lo que pedía el paso 4 originalmente: una auditoría en un lienzo de **Design**. **Insumo medido:** `docs/reportes/diagnostico-diseno-2026-10-22.md` (P105, Bloque 5): contraste, valores escritos a mano, toques y fuentes chicas, las dos capas, lo diseñado y nunca construido, y una tabla de hallazgos con su decisión abierta. Lo que pide el paso: hallazgos por pantalla con severidad, propuestas mockeadas solo de los más importantes y las decisiones abiertas aparte (entre ellas, si las direcciones de Home se extienden a toda la app). Entran también la pantalla de marcas (P99 §6, construida por P103), la curva, `SesionJuego` y la etiqueta de la FC máxima.
- ☐ **5. P101 para Code,** por partes. Al cerrar, el sistema de diseño de la raíz queda al día.

---

## 6 · El texto para cada proyecto de Design

Se pega **una vez por cada proyecto de ShapeUp en cada cuenta**, reemplazando `[CUENTA]` por el mail de esa cuenta.

```
# Inventario del proyecto ShapeUp — cuenta [CUENTA]

Antes de que cierre esta versión de Claude Design (14/12/2026) voy a sacar todo lo que hay en este proyecto y consolidarlo en el repo github.com/jpcofano/shapeup. Trabajé en dos cuentas y no sé cuál está más avanzada, así que necesito un inventario preciso para compararlas.

No diseñes nada nuevo ni modifiques archivos que ya existen. Solo inventariá y escribí UN archivo nuevo en la raíz del proyecto: EXPORT-[CUENTA]-2026-10-21.md, con estas secciones:

1. Identificación: la cuenta, el nombre de este proyecto y la fecha. Si sabés que hay otros proyectos de ShapeUp en esta cuenta, nombralos.

2. Árbol completo de archivos: ruta, tamaño aproximado y, si lo sabés, cuándo se creó o se modificó por última vez. Para cada archivo que también existe en el repo (README.md, SKILL.md, colors_and_type.css, assets/, preview/, ui_kits/shapeup/, docs/home-redux/), decí si es igual o distinto. Si podés clonar el repo público, compará contra el commit actual; si no, decilo.

3. Historial: en orden, cada pedido o iteración que hay en este proyecto, con la fecha aproximada y qué archivos dejó.

4. Pantallas y componentes del kit, con los estados que cubre cada uno. Decí explícitamente si están o no:
   - Inicio: Aurora, Stadium, Clásico, Pulse, Premium y el selector de estilo.
   - Sesión guiada con pestañas Foto/Demo/Músculo; mapa muscular; sparklines; récords; sesión libre.
   - Lo del handoff del 25/09: Configuración (Mío / De la familia), chip de sincronización, tarjeta de progresión de VR, sesión por tiempo, sesión de juego, chip de dificultad al cerrar VR; la tarjeta de adherencia, la tira semanal con 4 estados y el historial con actividades externas.
   - Cualquier otra pantalla o componente.

5. Tokens y temas: cuántos temas, si hay modo claro, qué fuentes, las direcciones (Pulse / Premium) y las diferencias con colors_and_type.css del repo.

6. Lo que no está en el repo: decisiones, exploraciones o documentos que existen acá y no allá (por ejemplo explorations/DECISION-home-aurora.md o explorations/home-redux/AUDITORIA-temas-claro-oscuro.md), y propuestas que nunca se implementaron.

7. Lo que no sabés: si no podés afirmar una fecha, un estado o si un archivo está completo, decilo. No completes con suposiciones.

Al terminar, decime el nombre del archivo y resumime en 5 líneas qué tiene este proyecto que el repo no tiene.
```

**Después de cada uno:**
1. Descargá el proyecto entero desde Design (la opción de descargar o exportar el proyecto).
2. Guardalo en Descargas como `design-export-[CUENTA].zip`. El `EXPORT-….md` tiene que quedar adentro; si se puede bajar suelto, mejor.
3. Si una cuenta tiene más de un proyecto de ShapeUp, repetí con cada uno y agregale el nombre del proyecto al zip.

---

## 7 · Referencias

- Handoff de Home Redux: `docs/home-redux/design_handoff_theming/README.md`.
- Pulido de junio (D1–D10): `docs/prompts/PROMPTS-design.md`.
- Temas claro/oscuro: `docs/prompts/65-temas-claro-oscuro-sync-kit.md` y `P54-fix-theming.md`.
- Marcas y pantalla del análisis: `docs/ANALISIS-ASISTIDO.md` §3, §6 y §8.
- Handoff a Design del 25/09: `handoff-design-2026-09-25.md`, en Descargas. Se archiva en `docs/archivo/` en el paso 2.

---

## 8 · Registro de exports (paso 1)

Hay **al menos tres proyectos** de ShapeUp en Design, repartidos en dos cuentas.

| # | Cuenta | Proyecto | Inventario | Zip en Descargas | Qué tiene que el repo no |
|---|---|---|---|---|---|
| 1 | Cuenta A («Cuenta 1» para Juan) o B: _no se sabe_ | El del handoff del 25/09 | ☑ Escrito el 21/10 en el proyecto (`EXPORT-[CUENTA]-2026-10-21.md`), pero **todavía no llegó a Descargas** | ☐ **Falta descargarlo** | `ShapeUp Estados.dc.html`: tablero con todos los estados del handoff (las 6 superficies, la adherencia, la tira semanal con 4 estados y el historial con externas). `HANDOFF-portado.md`: tokens y clases nuevas, a qué archivo de `src/` va cada una, qué caso real dispara cada estado y supuestos a confirmar antes de portar. Propuestas nunca implementadas: la configuración familiar en solo lectura para quien no es dueño, la etiqueta de quién puso cada valor y cuándo, y la barra de zonas en la tarjeta de VR. **No tiene** Inicio en sus 5 estilos, el selector, Foto/Demo/Músculo, el mapa muscular, sparklines, récords ni sesión libre |
| 2 | Cuenta A («Cuenta 1» para Juan) | «ShapeUp Design System» | ☑ En Descargas como `EXPORT-CUENTA-2026-10-21.md` (también está dentro del zip). Comparó por hash contra `55a20d1` | ☑ `ShapeUp Design System.zip` (3,5 MB, 167 archivos) | **Es lo de junio y lo de P65 que nunca volvió al repo. Es el más avanzado.** Ver el detalle abajo |
| 3 | Cuenta B («cuenta 2» para Juan) | Uno nuevo, creado solo para el inventario. Tiene adjunto **otro** «ShapeUp Design System» (id `e649aeba…`) | ☑ Dentro del zip | ☑ `Inventario ShapeUp — cuenta.zip` (43 KB: el inventario y una copia del design system adjunto) | **Nada que rescatar.** El design system de la cuenta B es la **versión más vieja**: un solo tema oscuro verde `#4ade80`, tipografía Saira, zonas con Z3 amarilla, nombres de tokens previos (`--sp-*`, `--accent-ink`) y un kit `ui_kits/shapeup-app/` con otra estructura y sin Aurora ni temas. Lo único que no está en otro lado es `components.css` (portado de `src/index.css`), `ios-frame.jsx` y `assets/shapeup-icon-dark.svg`, todo superado. Se archiva solo el inventario |

**Conclusión del paso 1 (21/10):** la **cuenta A** es la buena. Su «ShapeUp Design System» es la base del kit consolidado, y su proyecto del handoff tiene lo del 25/09. La cuenta B quedó en la versión anterior a los temas.

- Un segundo pedido en la cuenta B dejó `design-export-handoff.zip.zip`, con el mismo inventario, que es idéntico, y una copia del design system viejo en `design-system/`. **No es el proyecto del handoff.** En Descargas, el primer zip de la cuenta B se renombró a `Inventario ShapeUp — cuenta1.zip`.
- **Falta:** descargar el proyecto del handoff de la **cuenta A**, el que tiene `ShapeUp Estados.dc.html`. Está en la misma cuenta que el design system que tiene `explorations/` y 5 temas.
- **El paso 2a lo hizo el prompt `docs/prompts/104-traer-claude-design-al-repo.md`** el 21/10. El zip del handoff no estaba: esa parte se salteó.

**Dónde quedó lo archivado (P104, 21/10):**
- **La raíz del repo**, con la versión de la cuenta A: `colors_and_type.css`, `styles.css`, `thumbnail.html`, `preview/` (30 tarjetas) y `ui_kits/shapeup/` (12 archivos). `README.md`, `SKILL.md` y `assets/` siguen como estaban.
- **`docs/archivo/claude-design/`**, con un `README.md` que dice de dónde sale cada cosa:
  - `cuenta-A/explorations/`, con las auditorías, las decisiones, los mocks y sus capturas. Sin `home-redux/design_handoff_theming/`, idéntico a `docs/home-redux/design_handoff_theming/`;
  - `cuenta-A/design-canvas.jsx`, `.design-canvas.state.json` y `_opts.png`;
  - `cuenta-A/pwa-iconos-opciones.html` y `cuenta-A/assets/pwa-options/`;
  - `cuenta-A/prompts-code/`: el 37, el 45 y `MAPEO-ADDENDUM.md`, los únicos que difieren del repo;
  - `cuenta-A/scripts/`: `data/traducciones-fedb.es.json` y `borrar-historial.ts.txt`;
  - `cuenta-B/BRIEF-para-design.md`;
  - `handoff-design-2026-09-25.md`.
- **`docs/reportes/`:** `design-export-cuenta-A-2026-10-21.md` y `design-export-cuenta-B-2026-10-21.md`.
- **El proyecto del handoff** (`ShapeUp Estados.dc.html`, `HANDOFF-portado.md`): no se encontró. Lo que se sabe está en la fila 1 de la tabla.

**Exports completos (21/10, 13:15).** Juan pidió a cada cuenta un «export completo», y Design creó un proyecto nuevo en cada una:
- **«Cuenta 1» de Juan = cuenta A.** Tiene adjunto el design system id `9dcf2f54…`, con 5 temas, modo claro y `explorations/`. El contenido es igual a `ShapeUp Design System.zip`, salvo los dos wordmark, por comillas reescritas en la copia.
- **«Cuenta 2» de Juan = cuenta B.** Tiene adjunto el design system id `e649aeba…`: un solo tema, sin modo claro.
- **Ninguno trae `ShapeUp Estados.dc.html`.** El proyecto del handoff sigue sin bajar. Es el proyecto donde Juan pegó el **primer** pedido de inventario, el que respondió con `Estados.dc.html` y `HANDOFF-portado.md`. Hay que abrir **ese** proyecto, no uno nuevo, y descargarlo.

**Insumos del 104, ya renombrados**, en `docs/auditorias/design-exports/` (git lo ignora): `design-A-design-system.zip` (el original), `design-B-design-system.zip`, los dos inventarios, el handoff del 25/09 y el traspaso del 21/10. Los originales siguen en Descargas.

**Proyecto 2, «ShapeUp Design System» (inventario del 21/10):**
- **El kit es mucho más nuevo que el del repo.** Los 10 archivos de `ui_kits/shapeup/` que existen en los dos lados son distintos, y los de Design son más grandes en todos los casos. Además, Design tiene `body-map.jsx` y `screens-programa.jsx`. Incluye Inicio Aurora, Stadium y Clásico con su selector, Foto/Demo/Músculo, el mapa muscular, sparklines, récords, sesión libre, Programas y Perfil con claro/oscuro y 5 temas. Es lo de junio (K-MEDIA, K-HOME3, K-PROG).
- **Los tokens ya tienen 5 temas con claro y oscuro** (P65): `colors_and_type.css`, más `styles.css` y `thumbnail.html`. La raíz del repo nunca se actualizó con P65. Diferencia a revisar en el paso 2: en Design la superficie es neutra según el modo; en `src/styles/tokens.css` el oscuro se tiñe por tema.
- **Preview:** 5 tarjetas nuevas (`brand-pwa`, `cmp-bodymap`, `cmp-sparkline`, `cmp-steppers`, `cmp-vista-semanal`) y `col-themes` actualizada. Las otras 24 difieren por unos 110 a 150 bytes, probablemente la línea `@dsCard`.
- **Explorations y auditorías que no están en el repo:** `DECISION-home-aurora.md`, `DIRECCIONES-DISENO-home.md`, `AUDITORIA-UI-2026-06-10`, `AUDITORIA-kit-datos-jun2026`, `AUDITORIA-d9-d10`, y en `home-redux/` las auditorías P53, P54 y de temas claro/oscuro, `P54-fix-theming.md` y las copias de trabajo de `home-redux.css` y del prototipo, posteriores al handoff. Más los mocks (`Home Aurora+ (mock).html`, que Design no pudo leer; `Entrenar - opciones de media.html`; `vr-headers-check.html`) y las capturas.
- **Íconos PWA:** `pwa-iconos-opciones.html` y 10 variantes en `assets/pwa-options/`. Los íconos en uso son iguales a los del repo, pero con otra ruta.
- **Prompts:** 27 iguales a `docs/prompts/`. Distintos: el 37, el 45, `MAPEO-ADDENDUM.md` y `PROMPTS-design.md`.
- **No tiene:** Pulse y Premium en el kit (solo en explorations) ni nada del handoff del 25/09. Eso está en el proyecto 1.
- **Fecha no confiable:** `AUDITORIA-temas-claro-oscuro.md` dice 2026-07-17, pero Design aclara que no lo sabe.

**Proyecto 2 contra la app (revisado por Claude el 21/10, con el zip):**
- **Tokens.** El `colors_and_type.css` de Design resuelve el acento con `--acc-d`/`--acc-l` y deja las superficies **neutras según el modo**: el acento no tiñe el fondo. En la app (`src/styles/tokens.css`), el **oscuro se tiñe por tema** (por ejemplo, Ion `--bg: #081519`), a propósito: P65 eligió «cero regresión visual en oscuro». El claro coincide: superficie neutra compartida. A la app le sobran respecto de Design: los semánticos por modo (`--danger`, `--warning` e `--info` con su versión clara), el movimiento (`--dur-*`, `--ease-*`) y el anillo (`--ring-from/to`). A Design le sobra `--track`. **Criterio del paso 2: gana la app** (kit = app). Si el oscuro teñido o neutro es mejor, lo decide la auditoría.
- **Inicio.** El kit tiene Aurora, Stadium y Clásico. Pulse y Premium están solo en `explorations/home-redux/`, y en la app viven en `src/styles/home-redux.css`, con Archivo y Hanken Grotesk.
- **Pantallas que la app tiene y el kit no**, porque son posteriores a junio: Configuración, el chip de sincronización, la VR por escalones y a medida, la sesión por tiempo, la sesión de juego, la hoja de salida, «Cambiar», la adherencia, `BarraZonas`, `TrendChart`, el puente y las pestañas nuevas de Salud, el análisis de sesión, `RevisionFcMax` y `PantallaError`. Varias tienen diseño en el proyecto 1, pero el kit tiene que recrearlas **como están construidas**, no como se diseñaron.
- **Explorations:** confirman decisiones que el repo cita sin tener el documento: Aurora como base con piezas de Bento (`DECISION-home-aurora.md`, 08/06), las tres direcciones de Inicio con su público (`DIRECCIONES-DISENO-home.md`) y el diagnóstico de los dos sistemas de theming que originó P65 (`AUDITORIA-temas-claro-oscuro.md`). `AUDITORIA-P54-vs-main.md` dice que la rampa de acento y el nav con identidad de dirección no estaban en `main`. Hoy la rampa sí está, en `home-redux.css`. Si el nav está, se verifica en la auditoría.

**Riesgo anotado por Design (proyecto 1):** hubo un arreglo posterior a la verificación del 25/09 cuya respuesta se cortó por un error. No se sabe si quedó completo. Se verifica en el paso 2, comparando `ShapeUp Estados.dc.html` y `HANDOFF-portado.md` con la app.
