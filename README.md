# ShapeUp — Design System

App de entrenamiento físico para una familia (Juan Pablo · 51, María · 50, Sofía · 17,
Federico · 16). ShapeUp es **hermana** de la app de **Comida Familiar**: comparte la
arquitectura de tokens y varios componentes base, pero tiene **identidad propia** — oscuro
y claro, un acento por tema (Ion cian por defecto), energía y progreso. La regla de diseño es **"hermanas, no gemelas
ni extrañas"**.

> Idioma de la UI: **castellano argentino (voseo)**. Energía e intensidad, pero limpio y
> legible — es una app familiar, no "gym bro".

> **Igual a la app (P105, 22/10/2026).** Este sistema describe la app **como está construida**.
> Cuando el kit y la app no coinciden, **gana la app**: los tokens de `colors_and_type.css` salen
> de `src/styles/tokens.css` y `src/styles/home-redux.css`. Lo que convenga cambiar lo decide la
> auditoría de diseño (P101, `docs/AUDITORIA-DISENO.md`), no este documento. Algunas secciones de
> más abajo son de junio y describen intenciones de entonces; donde chocan con
> **«Cómo es la app hoy»**, vale esta sección.

---

## Cómo es la app hoy (P105)

**Temas y modos.** 5 temas (`data-theme`): **Ion** (cian, default), **Volt** (verde), **Blaze**
(naranja-coral), **Pulse** (rosa) e **Indigo** (violeta-azul). Cada uno en **claro, oscuro o
sistema**. `data-mode` solo vale `light` o `dark`: «sistema» lo resuelve `ThemeProvider` en JS
contra `prefers-color-scheme` y pone los dos atributos en `<html>`. Tema, modo y estilo de Inicio
se eligen **por miembro** en Perfil → Configuración, y se guardan en `localStorage` (por
dispositivo).
- **En oscuro, la superficie se tiñe por tema** (`--bg`, `--card`, `--card-hover`, `--border`,
  `--border-dim` propios de cada tema). **En claro, la superficie es neutra y compartida**; solo
  cambia el acento. *(Decisión abierta para la auditoría: el design system de Design dejaba el
  oscuro neutro también.)*
- Los semánticos (`--danger`, `--warning`, `--info` y sus `-dim`) tienen un valor por modo; en
  claro son más oscuros, para pasar AA como texto.
- Las zonas de FC y los colores de miembro no cambian con el tema ni con el modo.

| Tema | Acento oscuro | Acento claro | Default de |
|---|---|---|---|
| **Ion** ⭐ | `#22d3ee` | `#0e7490` | Juan Pablo |
| **Volt** | `#4ade80` | `#15803d` | Federico |
| **Blaze** | `#ff7a45` | `#c2410c` | — |
| **Pulse** | `#ff4d79` | `#be185c` | María |
| **Indigo** | `#8b90ff` | `#4f46e5` | Sofía |

**Fuentes.** Toda la app usa `system-ui`. `index.html` carga además **Archivo** y **Hanken
Grotesk** (Google Fonts), que solo usan los estilos de Inicio **Pulse** y **Premium**.

**Estilos de Inicio (5).** Se eligen en Perfil → Configuración: **Aurora** (por defecto: anillo de progreso y
tarjeta de vidrio), **Stadium** (marquesina grande y tira de stats), **Clásico** (tarjetas
simples), **Pulse** (enérgico, anillo segmentado, Archivo) y **Premium** (minimalista, Hanken
Grotesk). Pulse y Premium son las «direcciones de Home» (`.dir-a` y `.dir-c .v21`).

**Movimiento.** `--dur-fast` 140 ms, `--dur-base` 220 ms, `--dur-slow` 420 ms; `--ease-out` y
`--ease-spring`. El anillo de Aurora usa `--ring-from` y `--ring-to` (siguen al acento).

### Las tres capas de estilos

| Capa | Archivo | Qué alcanza |
|---|---|---|
| **Kit** | `colors_and_type.css` (esta raíz) | Los tokens de la app, copiados, más los de las direcciones de Home en una sección aparte. Lo usan `preview/` y `ui_kits/`. **No entra en el build de la app.** |
| **Tokens de la app** | `src/styles/tokens.css` | **Toda la app**: superficies, acento por tema y modo, semánticos, zonas, radios, espaciado, movimiento, tipografía. |
| **Componentes de la app** | `src/index.css` | Las clases de componentes (`.card`, `.btn-primary`, `.modal-sheet`, `.glass-card`, …), sobre los tokens de arriba. |
| **Direcciones de Home** | `src/styles/home-redux.css` | **Solo Home y la barra de navegación**, y solo con el estilo Pulse o Premium. Otras superficies (`--card2`, `--surface`), la rampa de acento (`--accent-subtle/-border/-muted/-solid/-strong`), `--track`, `--pos`/`--neg`, radios asimétricos en Premium y las fuentes Archivo y Hanken Grotesk. |

Si las direcciones de Home se extienden a toda la app lo decide la auditoría (P101).

### Pantallas de la app y si están en el kit

| Pantalla de la app | En el kit (`ui_kits/shapeup/`) |
|---|---|
| Inicio (`Home`): Aurora, Stadium, Clásico, Pulse, Premium | En parte: Aurora, Stadium y Clásico |
| Biblioteca: Programas, Rutinas, Ejercicios (`Catalogo`) | Sí, de junio |
| Detalle de rutina y de programa | Sí, de junio |
| Entrenar (la lista) y «Cambiar» (`HojaCambiar`, `FranjaCambio`) | En parte: la lista de junio; sin «Cambiar» |
| Sesión guiada (`EntrenarSesion`) y sesión libre | Sí, de junio (sin la hoja de salida de P68) |
| VR por escalones: inicio, sesión por tiempo, cierre con dificultad; VR a medida | Inicio y cierre en `pantallas-nuevas.html` (P105, estático); sin la sesión por tiempo ni VR a medida |
| Sesión de juego (`SesionJuego`) y su hoja de salida | En `pantallas-nuevas.html` (P105, estático) |
| Historial | Sí, de junio |
| Detalle de la sesión: marcas, curva (`CurvaSesion`), análisis | En `pantallas-nuevas.html` (P105, estático); el interactivo tiene el de junio |
| Salud: Resumen, Composición, Cardio, Sueño, Progreso | Composición, Cardio, Sueño y Progreso, de junio; Resumen y el panel del puente en `pantallas-nuevas.html` (P105) |
| Perfil y Configuración (lo de cada miembro y, solo owner, «Familia y datos»; `RevisionFcMax`) | Perfil de junio en el interactivo; Configuración completa en `pantallas-nuevas.html` (P105) |
| Formularios de rutina y de ejercicio | No |
| Componentes sueltos: chip de sincronización, adherencia, `BarraZonas`, `TrendChart`, `PantallaError` | Como tarjetas en `preview/cmp-*.html` (P105), menos `PantallaError` |

---

## Fuentes (de dónde sale este sistema)

Este design system se construyó leyendo el código real de estos repos. Si tenés acceso,
explorálos para diseñar con más fidelidad:

- **App ShapeUp** — https://github.com/jpcofano/shapeup
  Tokens en `src/styles/tokens.css`, estilos en `src/index.css`, pantallas en `src/routes/`,
  componentes en `src/components/`, seeds (datos reales) en `scripts/`.
- **App Comida Familiar** (la hermana) — https://github.com/jpcofano/Comidas-Familiares
  Tokens en `src/styles/tokens.css`. Origen de `MemberAvatar`, `AvatarStack`, `WeekStrip` y
  de la arquitectura de tokens que ShapeUp hereda.

**Qué NO se tocó** (respeta el brief): la lógica (`src/lib`, `src/data`, `src/types`,
`src/auth`), el nav inferior de **6 ítems** fijo, la sesión `EntrenarSesion` fullscreen sin
nav, y el preview-antes-de-importar en Salud. Design pule presentación, no comportamiento.

---

## La capa de identidad de ShapeUp (lo nuevo)

Lo que ShapeUp **crea propio** sobre la base heredada:

1. **Logo / marca** — `assets/shapeup-*.svg`. Un **doble chevron hacia arriba** ("level-up /
   boost"): dos galones redondeados apilados que apuntan arriba. Geométrico, font-independiente,
   legible a 16px. No reusa el `PlatoMark` de Comida.
2. **Acento de marca · TEMATIZABLE.** ShapeUp tiene **temas** (funcionalidad del producto):
   la base oscura no cambia, pero la familia del acento sí. **Default = Ion (cian eléctrico
   `#22d3ee`)**, el más lejos del marrón/bordó cálido de Comida — ShapeUp se lee frío, oscuro,
   atlético. 5 temas: **Ion** (cian), **Volt** (verde), **Indigo** (violeta), **Blaze**
   (naranja-coral), **Pulse** (rosa). Se eligen en Perfil. Ver sección *Temas*.
3. **Escala de zonas de FC (Z1→Z5)** — rampa térmica de frío a caliente, como tokens
   (`--zona-z1..z5`). Engancha con `zonasFC` por miembro (% FCmáx: Z1 50-60 · Z2 60-70 ·
   Z3 70-80 · Z4 80-90 · Z5 90-100) y la usa el módulo de Salud / cardio.
4. **Estados de fitness** que Comida no tiene: *sesión activa*, *descanso en curso*,
   *intensidad por zona*, *completado* (ver `preview/cmp-fitness-states.html`).
5. **Visuales de progreso** pulidos como pieza de identidad: `MiniChart`, `ProgressDots`,
   `DescansoTimer`, la cifra grande tabular.
6. **Motivo de marca — el bíceps flexionado** (Lucide `biceps-flexed`, relleno con el acento):
   marca los días de entrenamiento en la `WeekStrip` (no un punto neutro como Comida) y
   aparece como badge en cada sesión del **Historial**. Diferenciador visual del producto.
7. **Home con identidad propia**: header con logomark + wordmark + saludo en voseo (“Dale,
   Juan.”) y una card **“Tu semana”** (racha con llama, sesiones X/Y + barra, volumen) que
   refuerza el eje de *progreso*.

---

## Temas (funcionalidad del producto)

> _Sección de junio. Desde P65 son **5 temas** × claro/oscuro, no 8: la tabla de abajo quedó
> vieja (Solar, Crimson y Grape ya no existen, y el acento de Indigo es `#8b90ff`). Vale
> «Cómo es la app hoy», arriba._

ShapeUp es **multi-tema**, y el tema se elige **por miembro** (cada uno ajusta el suyo). La
base oscura, la tipografía, el espaciado, los colores de miembro y las zonas de FC **no
cambian**; lo que cambia es la **familia del acento** (botones, nav activo, chips, dots, timer,
FAB, foco, banners) más un **tinte de superficie marcado** (las superficies se tiñen hacia el
hue del acento), para que cada tema *se sienta* distinto sin rediseñar nada.

Implementación: atributo `data-theme` en el contenedor raíz de la app. Cada tema redefine
`--accent`, `--accent-dim`, `--accent-strong`, `--on-accent`, `--shadow-fab` y un set de
superficies (`--bg`/`--card`/`--card-hover`/`--border`/`--border-dim`). Todo lo demás
referencia esos tokens, así que re-skinea solo. Default = **Ion**. Se elige en **Perfil →
Tema** y se persiste por miembro. Ver `preview/col-themes.html`.

| Tema | `data-theme` | Acento | Vibe |
|---|---|---|---|
| **Ion** ⭐ default | `ion` | `#22d3ee` cian | Frío, técnico — lo más lejos de Comida. |
| **Volt** | `volt` | `#4ade80` verde | Energía, progreso (el original). |
| **Solar** | `solar` | `#f5b62b` ámbar | Energía cálida, sol. |
| **Blaze** | `blaze` | `#ff7a45` naranja-coral | Intensidad, calor de esfuerzo. |
| **Crimson** | `crimson` | `#fb3b53` rojo | Potencia, fuego. |
| **Pulse** | `pulse` | `#ff4d79` rosa | Vibrante, bold. |
| **Grape** | `grape` | `#b15cff` púrpura | Creativo, eléctrico. |
| **Indigo** | `indigo` | `#7c83ff` violeta | Nocturno, premium. |

Defaults por miembro: Juan Pablo → Ion · María → Pulse · Sofía → Indigo · Federico → Volt.

```html
<div class="su-app" data-theme="indigo"> … toda la app re-skinea … </div>
```

> Agregar un tema nuevo = un bloque `[data-theme="x"]` en `colors_and_type.css` con esas 5-6
> variables. Nada más.

---

## CONTENT FUNDAMENTALS — cómo se escribe

- **Idioma:** castellano rioplatense con **voseo**. Imperativos en vos: "Empezá", "Cargá",
  "Descansá", "Contactá", "Elegí". Nunca "Empieza/Carga" (tuteo) ni "ud."
- **Persona:** segunda persona, directo y cercano. "Tu plan para ponerte en forma",
  "No hay un programa activo. Creá uno en Biblioteca." La app le habla al miembro.
- **Tono:** energía y progreso, pero **limpio y motivador, no agresivo**. "La recuperación es
  parte del entrenamiento." "¿Cómo fue el esfuerzo?" Nada de jerga gym-bro ni mayúsculas
  gritadas.
- **Casing:** Sentence case en títulos y botones ("Empezar sesión", "Finalizar y guardar").
  **UPPERCASE + letter-spacing** solo en micro-labels de sección ("PROGRAMA ACTIVO",
  "HOY TOCA", "DESCANSO", "REPS", "CARGA (KG)").
- **Cifras y unidades:** métricas con unidad pegada y punto decimal: `22.5 kg`, `45 min`,
  `3.960 kg` de tonelaje, `RPE 8`, `Z3`. Tiempo del timer en `M:SS` (`1:30`).
- **Microcopy de estado:** breve y humano. Día de descanso → "Descansá. La recuperación es
  parte del entrenamiento." Vacío → "Todavía no completaste ninguna sesión."
- **Emoji:** uso **mínimo y puntual**, heredado del código: 🎉 al terminar sesión, 😴 día de
  descanso, 🥽 día VR, ✅ puntos clave, ⚠️ errores comunes, ⏱ duración. No se usan como
  decoración de relleno. No inventar más emoji.
- **Etiquetas de miembro:** se nombran por nombre real (Juan Pablo, María, Sofía, Federico)
  o iniciales (JP, M, S, F).

---

## VISUAL FOUNDATIONS

**Tema.** Oscuro por defecto (`color-scheme: dark`), con modo claro y «sistema» desde P65 (ver
«Cómo es la app hoy»). En oscuro, cada tema tiñe sus superficies; los valores neutros de `:root`
(`#0f1115`, `#171a21`) solo se ven sin `data-theme`.

**Color.** Un único acento de marca **tematizable** (default Ion cian) usado con disciplina:
botones primarios, estados activos, foco de input, nav activo, el FAB. Semánticos acotados
(danger rojo, warning ámbar, info azul). Cuatro colores de miembro (azul/rosa/violeta/verde),
**independientes del tema** (son identidad de la persona). La escala de zonas FC es el único
lugar con multicolor "de verdad", también constante entre temas (significa intensidad).

**Temas.** Ver la sección dedicada más abajo.

**Tipografía.** `system-ui` en toda la app. Las únicas webfonts son Archivo y Hanken Grotesk,
para los estilos de Inicio Pulse y Premium. **La identidad tipográfica vive en el peso, no en la
familia:** títulos 700-800, cifras 800 con
`font-variant-numeric: tabular-nums` y tracking negativo (`-0.04em`) para que peso, carga y
timer se lean como un tablero atlético. Labels de sección en 11px uppercase + `letter-spacing
.05em`. Ver `colors_and_type.css` para la escala completa y las clases semánticas (`.t-display`,
`.t-num`, `.t-label`…).

**Espaciado.** Escala base 4px (`--space-1..12`), alineada con Comida. Gaps de 6–16px dentro de
tarjetas; páginas con `gap: 16px` entre bloques. Layout mobile-first, una columna, contenido con
padding 16px y 78px abajo para el nav fijo.

**Bordes y radios.** Radios `8 / 12 / 18px` (sm/md/lg) + `999px` para chips/badges/avatares.
Borde de 1px `#232733` define casi todo (las tarjetas son borde, no sombra). Hover de tarjeta:
el fondo toma `--accent-dim`. Inputs: borde gris → `--accent` en foco.

**Sombras.** Casi inexistentes en el tema oscuro; el contraste lo da el borde. Excepciones
funcionales: modales/auth (`0 20px 60px rgba(0,0,0,.35)`), bottom-sheets, y el **glow del acento en el
FAB** (`0 4px 16px rgba(74,222,128,.30)`), que es lo más cercano a un acento decorativo.

**Backgrounds / texturas.** Planos. Sin gradientes en superficies de contenido, sin imágenes
de fondo, sin patrones. (La pantalla del prototipo usa un radial sutil solo como ambiente del
*device frame*, no de la app.) Los tintes de color son `rgba` al ~10-14% sobre el fondo oscuro
(`--accent-dim`, `--zona-z*-dim`).

**Cards.** Fondo `--card`, borde 1px `--border`, radio `lg (18px)`, padding 16px. Sin sombra.
Variantes: `card` (genérica), `rutina-card` (cliqueable, se tiñe con el acento en hover), `descanso-card`
(centrada, timer), `auth-card` (la única con sombra).

**Animación.** Funcional. Tokens de movimiento: `--dur-fast` 140 ms, `--dur-base` 220 ms,
`--dur-slow` 420 ms, `--ease-out` y `--ease-spring` (un rebote corto, usado en presiones y en el
anillo de Aurora). Transiciones en color/borde/opacidad. Spinner
de carga (0.7s linear). Bottom-sheets entran con `translateY` (0.25s ease). El botón de serie
hace `scale(0.98)` al apretar. **Sin** bounces, parallax, ni loops decorativos.

**Hover / press.**
- Botón primario: `opacity .88` en hover.
- Botón secundario / chip: el borde y el texto pasan de muted a fg/accent.
- Tarjeta de rutina: se tiñe con el acento.
- Icon-button: fondo `--card-hover`.
- Press del botón de serie / FAB: `scale` (0.98 / 1.06).

**Transparencia y blur.** Blur solo en la tarjeta de vidrio de Aurora (`.glass-card`,
`blur(12px)`). Transparencia sí, como tintes `rgba` de color sobre
el fondo (estados, zonas, backdrops de modal al 72%).

**Vibe de imagery.** La app no usa fotos. Lo "visual" son datos: dots de progreso, barras del
MiniChart, la tira semanal, los avatares de color. Frío, oscuro, de alto contraste.

---

## ICONOGRAPHY

- **Sistema:** [**Lucide**](https://lucide.dev) (`lucide-react` en el código). Es la única
  familia de íconos. Trazo **`stroke-width: 1.8`**, tamaño 16–24px, `currentColor` (heredan el
  color del contexto: muted por defecto, el acento si está activo).
- **Íconos del nav (6):** `house` (Inicio), `library` (Rutinas), `zap` (Entrenar), `history`
  (Historial), `heart` (Salud), `user` (Perfil).
- **Íconos de acción frecuentes:** `zap` (empezar/intensidad), `biceps-flexed` (día de
  entrenamiento en la WeekStrip, relleno con el acento), `plus` (FAB / nuevo), `x`
  (cerrar/salir), `upload` (importar CSV), `search` (buscar), `chevron-up/down/right/left`
  (expandir/volver), `align-justify` (modo scroll), `check` (selección de tema), `flame`
  (racha semanal, relleno con el acento).
- **En este sistema:** se carga Lucide desde CDN
  (`https://unpkg.com/lucide@0.460.0/dist/umd/lucide.min.js`) y se dibuja con `data-lucide` +
  `lucide.createIcons()`. En el UI kit React hay un componente `<Icon name size stroke color>`
  que inyecta el SVG. **No** dibujar íconos a mano con SVG ni sustituir por emoji.
- **Emoji como glifo:** solo los del set heredado (🎉 😴 🥽 ✅ ⚠️ ⏱), nunca como íconos de UI.
- **Logo:** SVG propio en `assets/` (no es parte del set de íconos).

---

## Índice de archivos

| Archivo | Qué es |
|---|---|
| `README.md` | Este documento. |
| `colors_and_type.css` | Tokens del kit, **iguales a los de la app** (`src/styles/tokens.css`; la fuente de verdad es el código): color, temas y modos, zonas FC, estados, radio, espaciado, movimiento, tipografía + clases semánticas, y al final las direcciones de Home. Importar siempre. |
| `styles.css` | Punto de entrada: importa `colors_and_type.css`. |
| `SKILL.md` | Instrucciones para usar este sistema como Agent Skill. |
| `assets/shapeup-icon.svg` | Ícono de app (squircle + doble chevron), **en el verde de junio** (`#4ade80`). La app no lo usa. |
| `assets/shapeup-mark.svg` | Solo la marca (chevron, fondo transparente), en el verde de junio. En la app la marca la dibuja `src/components/Brand.tsx` con `currentColor` (sigue al acento). |
| `assets/shapeup-wordmark.svg` | Lockup horizontal Shape**Up** sobre oscuro. |
| `assets/shapeup-wordmark-light.svg` | Lockup para fondos claros. |
| `assets/pwa/` | Los 8 íconos PNG de la PWA (favicon 16/32/48, apple-touch 180, 192/512 y maskable 192/512) y su `manifest.json`. Son los de `public/icons/` de la app (squircle oscuro + doble chevron cian; no cambian con el tema). Los usa `preview/brand-pwa.html`. |
| `assets/icons-alt-v2/` y `assets/pwa.zip` | Una variante alternativa de los mismos íconos y el zip original. Archivo de Design; la app no los usa. |
| `preview/*.html` | Tarjetas del Design System (color, type, spacing, componentes). |
| `ui_kits/shapeup/` | **UI kit interactivo** de la app (de junio) y `pantallas-nuevas.html` (P105) — ver abajo. |
| `docs/prompts/` | **Prompts para Claude Code** (pulido D1–D7, numerados 23–29) — implementan este sistema en el repo `jpcofano/shapeup`. Empezá por `PROMPTS-design.md`. (P100: `prompts-code/` se integró a `docs/prompts/`.) |

### UI Kits
- **`ui_kits/shapeup/`** — recreación interactiva de la app ShapeUp. Abrí
  `ui_kits/shapeup/index.html`: login → home → sesión guiada (con timer de descanso y banners
  de técnica) → biblioteca/catálogo → historial → salud (composición/cardio/sueño/progreso) →
  perfil (cambiá de miembro). Ver su `README.md` para los componentes.

---

## Cómo diseñar con este sistema

1. Importá `colors_and_type.css`. Usá **siempre tokens**, nunca hex hardcodeado.
2. Una columna, mobile-first, en los 5 temas × claro y oscuro. Respetá el nav de 6 ítems.
3. Texto en **voseo**, sentence case, labels de sección en uppercase.
4. Íconos **Lucide** 1.8 stroke. Logo desde `assets/`.
5. Para piezas de fitness (sesión, cardio) usá las zonas FC y los estados de identidad.
6. Reutilizá los componentes del UI kit (`ui_kits/shapeup/`) en vez de reinventarlos.
