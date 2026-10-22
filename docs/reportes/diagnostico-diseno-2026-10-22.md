# Diagnóstico de diseño medible (P105, Bloque 5)

22/10/2026. Insumo de la auditoría de diseño (P101, `docs/AUDITORIA-DISENO.md` §5, paso 4).

Este documento junta **solo hallazgos medidos**. No propone arreglos: las propuestas y las decisiones se toman
en la auditoría, con el chat. No se cambió nada de `src/`.

## Cómo se midió

- **Contraste:** con `scripts/contraste-tokens.ts` (`npx tsx scripts/contraste-tokens.ts`), que lee
  `src/styles/tokens.css` y `src/styles/home-redux.css` y calcula la razón WCAG 2.x. Las funciones son puras y
  tienen test (`scripts/lib/contraste.ts`).
- **Colores y medidas escritos a mano:** recorriendo `src/components/` y `src/routes/` (sin los tests). Se
  cuentan los hex, los `rgb()`/`rgba()` y los tamaños de fuente en px (`fontSize: N` y `font-size: Npx`).
- **Toques y fuentes chicas:** medidos en el navegador, con Chrome headless a 390 px. Se usaron tres páginas:
  - `ui_kits/shapeup/pantallas-nuevas.html`, que es marcado real de la app: detalle de sesión, VR, juego,
    Configuración y Salud;
  - `/qa/sesion`;
  - `/qa/home-redux`.

  También se leyó el CSS de `src/index.css`.
- **Capturas:** `docs/auditorias/capturas/2026-10-22/` (git las ignora). Ver su `indice.md`.

---

## 1 · Contraste WCAG

AA pide 4,5:1 para texto normal y 3:1 para texto grande y componentes.

### Capa de la app (`tokens.css`): 5 temas × claro y oscuro

✗ = no pasa AA para texto normal.

| Par | ion osc. | ion claro | volt osc. | volt claro | blaze osc. | blaze claro | pulse osc. | pulse claro | indigo osc. | indigo claro |
|---|---|---|---|---|---|---|---|---|---|---|
| Texto / fondo | 17,29 | 15,45 | 17,46 | 15,45 | 17,64 | 15,45 | 17,94 | 15,45 | 17,90 | 15,45 |
| Texto / tarjeta | 15,43 | 17,96 | 15,72 | 17,96 | 16,02 | 17,96 | 16,45 | 17,96 | 16,50 | 17,96 |
| Secundario / tarjeta | 6,56 | 5,91 | 6,69 | 5,91 | 6,82 | 5,91 | 7,00 | 5,91 | 7,02 | 5,91 |
| Secundario / fondo | 7,36 | 5,09 | 7,43 | 5,09 | 7,51 | 5,09 | 7,63 | 5,09 | 7,62 | 5,09 |
| Acento / tarjeta (texto) | 9,16 | 5,36 | 9,68 | 5,02 | 6,65 | 5,18 | 5,54 | 6,04 | 6,35 | 6,29 |
| Texto del botón / acento | 10,24 | 5,36 | 10,87 | 5,02 | 7,43 | 5,18 | **3,19 ✗** | 6,04 | **2,79 ✗** | 6,29 |
| Peligro / tarjeta | 5,98 | 6,57 | 6,10 | 6,57 | 6,21 | 6,57 | 6,38 | 6,57 | 6,40 | 6,57 |
| Atención / tarjeta | 9,92 | 7,09 | 10,11 | 7,09 | 10,30 | 7,09 | 10,58 | 7,09 | 10,61 | 7,09 |
| Info / tarjeta | 6,51 | 6,70 | 6,64 | 6,70 | 6,76 | 6,70 | 6,95 | 6,70 | 6,96 | 6,70 |

**Lo que no pasa:** el texto de los botones principales en **Pulse y en Indigo oscuro**. `--on-accent` es
`#ffffff` sobre un acento claro (`#ff4d79`, `#8b90ff`) y da 3,19 y 2,79. Indigo no llega ni al 3:1 del texto
grande; Pulse lo pasa solo como texto grande. El resto pasa AA en los 10 casos.
- En claro, el acento como texto queda justo arriba del límite: 5,02 a 6,29.
- El secundario sobre el fondo claro da 5,09.

### Direcciones de Home (`home-redux.css`): Pulse (`.dir-a`) y Premium (`.dir-c`)

Valores iguales para los 5 acentos, salvo los del acento:

| Par | Pulse osc. | Pulse claro | Premium osc. | Premium claro |
|---|---|---|---|---|
| Texto / fondo | 18,09 | 15,45 | 17,15 | 16,04 |
| Secundario / tarjeta | 6,31 | 5,91 | 5,84 | 6,02 |
| Acento / tarjeta | 5,63 a 10,30 | 5,02 a 6,29 | 5,57 a 10,18 | 5,02 a 6,29 |
| Acento atenuado (`--accent-muted`) / tarjeta | 7,27 a 11,59 | 7,33 a 8,82 | 7,11 a 11,34 | 7,43 a 8,80 |
| Texto del botón / acento | 6,03 a 11,03 | 5,02 a 6,29 | 6,03 a 11,03 | 5,02 a 6,29 |

**Todo pasa AA.** En las direcciones, `--on-accent` en oscuro es `#0b0f14` para los 5 acentos, y con eso el
botón de Pulse e Indigo da 6,03 y 6,89. Es el mismo acento que en el resto de la app, con otro color de texto.

La tabla completa, por acento, sale de correr el script.

---

## 2 · Colores y medidas escritos a mano

En `src/components/` y `src/routes/` (83 archivos, sin tests):

| Qué | Cuántos | En cuántos archivos |
|---|---|---|
| Hex escritos a mano | 34 | 11 de ellos en `Perfil.tsx`: las muestras de los temas, que son datos. 12 en las páginas de QA |
| `rgb()` / `rgba()` | 1 | — |
| Tamaños de fuente en px (`fontSize: N`) | 452 | 58 archivos |
| …de esos, menores de 12 px | 123 | 38 archivos |

En `src/index.css` hay 95 `font-size` en px, y 13 de ellos son menores de 12 px.

**Los 15 archivos con más valores escritos a mano** (hex + rgb + tamaños de fuente; entre paréntesis, los
menores de 12 px):

| # | Archivo | Hex | Fuentes en px (< 12) |
|---|---|---|---|
| 1 | `src/routes/Home.tsx` | 0 | 34 (3) |
| 2 | `src/routes/Perfil.tsx` | 11 | 15 (5) |
| 3 | `src/components/salud/PuentePanel.tsx` | 0 | 25 (10) |
| 4 | `src/components/historial/AnalisisSesion.tsx` | 0 | 22 (3) |
| 5 | `src/components/perfil/EditorPerfil.tsx` | 1 | 21 (9) |
| 6 | `src/routes/HistorialDetalle.tsx` | 0 | 19 (6) |
| 7 | `src/components/salud/ComposicionTab.tsx` | 0 | 17 (8) |
| 8 | `src/components/salud/ImportPanel.tsx` | 0 | 17 (12) |
| 9 | `src/components/entrenar/TarjetaProgresionVR.tsx` | 0 | 15 (2) |
| 10 | `src/components/perfil/RevisionFcMax.tsx` | 0 | 15 (9) |
| 11 | `src/routes/QaTemas.tsx` | 4 | 11 (1) |
| 12 | `src/routes/QaHomeRedux.tsx` | 8 | 6 (1) |
| 13 | `src/components/salud/CardioTab.tsx` | 0 | 12 (7) |
| 14 | `src/routes/Historial.tsx` | 0 | 12 (4) |
| 15 | `src/components/perfil/ConfigImport.tsx` | 0 | 11 (3) |

El conteo de cada archivo está en el anexo, al final.

Los colores van casi todos por tokens. Lo que se escribe a mano son los **tamaños de fuente**: la escala
`--fs-*` existe, pero los componentes usan números sueltos.

---

## 3 · Tamaños de toque y fuentes chicas

### Objetivos táctiles menores de 44 px

Medidos a 390 px, en la columna oscura de cada pantalla.

| Control | Medida | Dónde | Frecuencia |
|---|---|---|---|
| `.btn-icon-sm`: la ✕ para salir y otros íconos | **28 × 28** | Encabezado de la sesión, VR y juego (`index.css:313`) | 29 usos en `src/` |
| `.filter-chip` | 29 de alto | Configuración (lugar, equipo, objetivos, tema y modo), Catálogo | Muchos por pantalla |
| `.tab-bar-btn` | 32 de alto | Las pestañas de Salud | 5 por pantalla |
| Fila plegable de equipo por lugar | 37 de alto | Configuración | 4 |
| `.form-input` | 39 de alto | Configuración (zonas, año, juegos) | ~14 |
| `.btn-secondary` de opciones | 43 de alto | Cierre de VR (Sí / No / Mixto), «De corrido» | 4 |
| `.btn-secondary` chicos | 30 de alto | `RevisionFcMax` («Usar la de ShapeUp», «Usar la de Samsung») | 2 |
| `.a-avatar` / `.c-avatar` | 38 × 38 | Inicio Pulse y Premium | 1 |
| `.a-btn2` / `.c-btn2` | 38 / 42 de alto | Inicio Pulse y Premium («Entrenar igual») | 1 |

Ya hay una excepción en la app: en el paso de carga, los chips miden 44 de alto mínimo
(`index.css:962`).

En la curva de la sesión, los momentos tienen un área de toque de 16 px de ancho (`CurvaSesion`). No se midió
como botón porque es un `rect` de SVG.

### Textos menores de 12 px

| Dónde | Cuántos textos visibles | Tamaños |
|---|---|---|
| `pantallas-nuevas.html` (5 pantallas reales) | 84 | 10 y 11 px: etiquetas, notas al pie, «medida el», estadísticas |
| `/qa/sesion` (la pantalla de la sesión, 4 casos) | 32 | 11 px las secundarias y las notas; 10 px los textos de la curva |
| `/qa/home-redux` (Pulse y Premium, 20 combinaciones) | 984, unos 49 por combinación | **9 y 9,5 px** las etiquetas de métricas y del anillo; 10 y 10,5 px los deltas y la adherencia |

---

## 4 · Las dos capas de estilos

| | Resto de la app (`tokens.css`) | Home en Pulse o Premium (`home-redux.css`) |
|---|---|---|
| **Dónde se aplica** | Todas las pantallas | Solo Home (`HomeReduxContent`) y la barra de navegación (`AppShell`), con el estilo de Inicio Pulse o Premium. También `/qa/home-redux` |
| **Superficie en oscuro** | Teñida por tema (Ion `--bg #081519`, `--card #0f2128`) | Neutra y la misma para los 5 acentos (Pulse `#0a0c10` / `#14171d`; Premium `#0f1012` / `#17181c`) |
| **Superficie en claro** | Neutra: `#eceef1` / `#ffffff` | Pulse, igual que la app. Premium, otra: `#f1f1f3` / `#ffffff`, borde `#d7d7de` |
| **Rampa de acento** | No hay: solo `--accent`, `--accent-dim`, `--accent-strong` | `--accent-subtle`, `-border`, `-muted`, `-solid`, `-strong` |
| **Texto sobre el acento en oscuro** | Por tema; `#ffffff` en Pulse e Indigo (no pasa AA, §1) | `#0b0f14` para todos |
| **Extras** | — | `--card2`, `--track`, `--pos` y `--neg` |
| **Radios** | `--r-sm` 8, `--r-md` 12 y `--r-lg` 18 | Pulse, 12 a 20 px. Premium, asimétricos con una esquina de 4 px (`--r-card 24 24 24 4`, `--r-el 12 12 12 4`) |
| **Fuentes** | `system-ui` | Pulse: Archivo, itálica 900 en mayúsculas en los títulos. Premium: Hanken Grotesk |

Con Pulse o Premium, al pasar de Inicio a cualquier otra pantalla cambian la superficie, la fuente y los
radios.

---

## 5 · Lo diseñado y nunca construido

### Las tres propuestas del handoff del 25/09 (`AUDITORIA-DISENO.md` §8)

El proyecto del handoff no se descargó. Se compara contra el brief
(`docs/archivo/claude-design/handoff-design-2026-09-25.md`), no contra los mocks.

| Propuesta | ¿Está? | Evidencia |
|---|---|---|
| La configuración familiar en solo lectura para quien no es dueño | No | La tarjeta «Familia y datos» se muestra solo al owner (`Perfil.tsx:273`). Los demás no ven nada ni por qué |
| La etiqueta de quién puso cada valor y cuándo | No | Se guardan solo los valores. La pista «· por defecto N» muestra el default, no si el valor actual lo es |
| `BarraZonas` en la tarjeta de progresión de VR | No | `TarjetaProgresionVR` muestra la zona como texto («FC de trabajo N (Zx) · objetivo Zy») |

Del mismo handoff están construidos el chip de sincronización, la sesión por tiempo, la sesión de juego y el
chip de dificultad. Lo que difiere del brief:
- **Configuración no es una pantalla:** son tarjetas dentro de Perfil.
- **Vaciar un campo no vuelve al default:** en la progresión da «Completá los cuatro valores.».
- **Hay valores que no se pueden editar:** los minutos para que un día cuente como movimiento
  (`weekChips.ts:34`) y los pasos de descanso y de rondas de la progresión vieja de VR.
- **La tarjeta de progresión de VR cambió de botones y de opciones.**

### Lo de `docs/archivo/claude-design/cuenta-A/explorations/` que no está en la app

| Propuesta | Dónde | ¿Está? |
|---|---|---|
| Tema y estilo de Inicio guardados por miembro en Firebase (hoy, solo `localStorage`: por dispositivo) | `home-redux/AUDITORIA-P53-vs-handoff.md` | No |
| Una pantalla de Configuración propia | P53, `Home Redux - Pulso y Sereno.html` | No |
| Inicio Bento (mosaico completo) | `DIRECCIONES-DISENO-home.md` §C | No (Aurora toma piezas) |
| Transición al cambiar de pantalla o de pestaña | `AUDITORIA-UI-2026-06-10.md` H8 | No |
| Entrada escalonada en Stadium, Clásico, Historial y Salud | H10 | No (solo Aurora) |
| Pulso del número en los últimos 5 s del descanso; fin de sesión en cascada | H9 | No (solo cambia el color) |
| Saludo con el nombre corto («Dale, Juan.») | `AUDITORIA-d9-d10.md` | No |
| Un solo formato de fecha («mié 4 jun») | H3 | En parte (tres copias de `formatFecha`; Sueño muestra `MM-DD`) |
| Una sola métrica de la semana en Inicio | `AUDITORIA-kit-datos` B5 | En parte |
| Microrrespuesta al marcar la serie | H9, C9 | En parte (`btn-pulsing`) |

Sí están, por ejemplo, la barra de navegación por dirección, la rampa de acento (solo en Home), el modo
claro/oscuro en el encabezado, el filtro «Solo en español», las pestañas Foto/Demo/Músculo y Aurora+.

---

## 6 · Tabla de hallazgos

| # | Hallazgo | Pantalla o archivo | Severidad | Evidencia medida | Decisión abierta para la auditoría |
|---|---|---|---|---|---|
| 1 | El texto de los botones principales no pasa AA en Pulse e Indigo oscuro | Toda la app con esos temas: `tokens.css` (`--on-accent` `#ffffff`) | Alta | 3,19:1 y 2,79:1 (§1) | Texto oscuro sobre el acento, como en las direcciones de Home, o acentos más oscuros |
| 2 | La ✕ de salir mide 28 × 28 | Sesión guiada, VR, sesión libre, juego (`.btn-icon-sm`) | Alta | 28 × 28, 29 usos (§3) | ¿Área de toque de 44 con el ícono chico? |
| 3 | Chips, pestañas, inputs y botones secundarios debajo de 44 | Configuración, Salud, cierre de VR, `RevisionFcMax` | Media | 29 a 43 de alto (§3) | ¿Un mínimo común, como el que ya tiene el paso de carga? |
| 4 | Textos de 9 a 11 px | Home Pulse y Premium (9 y 9,5 px); detalle, Salud, Configuración (10 y 11 px) | Media | 984 en el QA de Home; 84 en las pantallas reales (§3) | Un piso de tamaño, con la escala `--fs-*` |
| 5 | Tamaños de fuente escritos a mano en vez de la escala | 58 archivos; Home, `PuentePanel`, `AnalisisSesion`, `EditorPerfil` | Media | 452 declaraciones; 123 menores de 12 px (§2) | Pasar a `--fs-*` o a clases `.t-*` |
| 6 | Dos capas: al salir de Inicio en Pulse o Premium cambian superficie, fuente y radios | Home + nav contra el resto | Media | §4 | Extender las direcciones a toda la app o dejarlas solo en Home |
| 7 | Oscuro teñido por tema (app) contra neutro (Design) | `tokens.css` | Media | §4; P105 4a | Teñido o neutro |
| 8 | La rampa de acento existe solo en Home | `home-redux.css` | Baja | §4 | Llevarla a `tokens.css` o no |
| 9 | Configuración familiar invisible para quien no es dueño | Perfil | Media | `Perfil.tsx:273` (§5) | Mostrarla en solo lectura (propuesta del 25/09) |
| 10 | Sin la etiqueta de origen de cada valor | Configuración | Baja | §5 | Propuesta del 25/09 |
| 11 | Sin `BarraZonas` en la tarjeta de progresión de VR | `TarjetaProgresionVR` | Baja | §5 | Propuesta del 25/09 |
| 12 | Tema y estilo de Inicio por dispositivo, no por miembro en la nube | `ThemeProvider` (`localStorage`) | Baja | §5 | Guardarlos en el perfil |
| 13 | Sin transiciones entre pantallas ni la entrada escalonada fuera de Aurora | `AppShell`, Home | Baja | §5 | Las propuestas H8 a H10 de junio |
| 14 | Tres formatos de fecha distintos | Historial, detalle, Sueño | Baja | §5 | Un solo helper |
| 15 | Colores escritos a mano | `Perfil.tsx` (muestras de temas), páginas de QA | Baja | 34 hex, 23 de ellos en esos tres archivos (§2) | Ninguna: son datos o QA |

---

## Anexo · Conteo por archivo (§2)

Los 58 archivos de `src/components/` y `src/routes/` con algún valor escrito a mano, ordenados por total. Los
otros 25 no tienen ninguno.

| Archivo | Hex | rgb | Fuentes en px | < 12 px |
|---|---|---|---|---|
| `src/routes/Home.tsx` | 0 | 0 | 34 | 3 |
| `src/routes/Perfil.tsx` | 11 | 0 | 15 | 5 |
| `src/components/salud/PuentePanel.tsx` | 0 | 0 | 25 | 10 |
| `src/components/historial/AnalisisSesion.tsx` | 0 | 0 | 22 | 3 |
| `src/components/perfil/EditorPerfil.tsx` | 1 | 0 | 21 | 9 |
| `src/routes/HistorialDetalle.tsx` | 0 | 0 | 19 | 6 |
| `src/components/salud/ComposicionTab.tsx` | 0 | 0 | 17 | 8 |
| `src/components/salud/ImportPanel.tsx` | 0 | 0 | 17 | 12 |
| `src/components/entrenar/TarjetaProgresionVR.tsx` | 0 | 0 | 15 | 2 |
| `src/components/perfil/RevisionFcMax.tsx` | 0 | 0 | 15 | 9 |
| `src/routes/QaTemas.tsx` | 4 | 0 | 11 | 1 |
| `src/routes/QaHomeRedux.tsx` | 8 | 0 | 6 | 1 |
| `src/components/salud/CardioTab.tsx` | 0 | 0 | 12 | 7 |
| `src/routes/Historial.tsx` | 0 | 0 | 12 | 4 |
| `src/components/perfil/ConfigImport.tsx` | 0 | 0 | 11 | 3 |
| `src/components/salud/ProgresoTab.tsx` | 0 | 0 | 10 | 2 |
| `src/routes/Catalogo.tsx` | 2 | 0 | 8 | 5 |
| `src/routes/Entrenar.tsx` | 0 | 0 | 10 | 0 |
| `src/routes/QaSaludResumen.tsx` | 5 | 0 | 4 | 0 |
| `src/routes/RutinaDetalle.tsx` | 0 | 0 | 9 | 0 |
| `src/components/AdherenciaCard.tsx` | 0 | 0 | 8 | 0 |
| `src/components/entrenar/CierreEscalonVR.tsx` | 0 | 0 | 8 | 0 |
| `src/components/entrenar/InicioAMedidaVR.tsx` | 0 | 0 | 8 | 0 |
| `src/components/entrenar/InicioEscalonVR.tsx` | 0 | 0 | 8 | 0 |
| `src/components/entrenar/SustituirEjercicio.tsx` | 0 | 0 | 8 | 1 |
| `src/components/perfil/ConfigProgresion.tsx` | 0 | 0 | 8 | 2 |
| `src/components/perfil/ConfigVisibilidad.tsx` | 0 | 0 | 8 | 2 |
| `src/routes/SesionJuego.tsx` | 0 | 0 | 8 | 1 |
| `src/components/entrenar/SesionPorTiempo.tsx` | 0 | 0 | 7 | 0 |
| `src/routes/ProgramaDetalle.tsx` | 0 | 0 | 7 | 3 |
| `src/routes/QaSesion.tsx` | 0 | 0 | 7 | 0 |
| `src/components/rutina/ProgresionEscalonesVR.tsx` | 0 | 0 | 6 | 0 |
| `src/components/historial/CabeceraMarcas.tsx` | 0 | 0 | 5 | 1 |
| `src/components/salud/SuenoTab.tsx` | 0 | 0 | 5 | 1 |
| `src/components/SerieAdherencia.tsx` | 0 | 0 | 5 | 4 |
| `src/components/TrendChart.tsx` | 0 | 0 | 5 | 2 |
| `src/routes/Salud.tsx` | 1 | 1 | 3 | 2 |
| `src/components/PantallaError.tsx` | 0 | 0 | 4 | 0 |
| `src/components/perfil/ConfigJuegos.tsx` | 0 | 0 | 4 | 1 |
| `src/routes/Biblioteca.tsx` | 0 | 0 | 4 | 2 |
| `src/components/entrenar/ResumenSesion.tsx` | 0 | 0 | 3 | 0 |
| `src/components/entrenar/SugerenciaChip.tsx` | 0 | 0 | 3 | 0 |
| `src/components/historial/CurvaSesion.tsx` | 0 | 0 | 3 | 2 |
| `src/components/MemberAvatar.tsx` | 1 | 0 | 2 | 1 |
| `src/components/salud/ResumenTab.tsx` | 0 | 0 | 3 | 2 |
| `src/routes/EntrenarSesion.tsx` | 0 | 0 | 3 | 0 |
| `src/routes/EntrenarSesionLibre.tsx` | 0 | 0 | 3 | 1 |
| `src/components/entrenar/BloqueGuiado.tsx` | 0 | 0 | 2 | 0 |
| `src/components/entrenar/BloqueScroll.tsx` | 0 | 0 | 2 | 1 |
| `src/components/WeekStrip.tsx` | 0 | 0 | 2 | 1 |
| `src/components/BarraZonas.tsx` | 0 | 0 | 1 | 1 |
| `src/components/entrenar/FranjaCambio.tsx` | 0 | 0 | 1 | 0 |
| `src/components/homeRedux/HomeReduxContent.tsx` | 1 | 0 | 0 | 0 |
| `src/components/MiniChart.tsx` | 0 | 0 | 1 | 1 |
| `src/components/rutina/BloqueFormItem.tsx` | 0 | 0 | 1 | 0 |
| `src/components/rutina/PrescripcionForm.tsx` | 0 | 0 | 1 | 0 |
| `src/components/VistaSemanal.tsx` | 0 | 0 | 1 | 1 |
| `src/routes/RutinaForm.tsx` | 0 | 0 | 1 | 0 |
