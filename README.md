# ShapeUp — Design System

App de entrenamiento físico para una familia (Juan Pablo · 51, María · 50, Sofía · 17,
Federico · 16). ShapeUp es **hermana** de la app de **Comida Familiar**: comparte la
arquitectura de tokens y varios componentes base, pero tiene **identidad propia** — tema
oscuro, verde eléctrico, energía y progreso. La regla de diseño es **"hermanas, no gemelas
ni extrañas"**.

> Idioma de la UI: **castellano argentino (voseo)**. Energía e intensidad, pero limpio y
> legible — es una app familiar, no "gym bro".

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

Defaults por miembro: Juan Pablo → Ion · María → Pulse · Sofía → Grape · Federico → Volt.

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

**Tema.** Oscuro por defecto (`color-scheme: dark`). Fondo casi negro azulado `#0f1115`,
tarjetas un punto más claras `#171a21`. No hay tema claro en la app (sí en Comida).

**Color.** Un único acento de marca **tematizable** (default Ion cian) usado con disciplina:
botones primarios, estados activos, foco de input, nav activo, el FAB. Semánticos acotados
(danger rojo, warning ámbar, info azul). Cuatro colores de miembro (azul/rosa/violeta/verde),
**independientes del tema** (son identidad de la persona). La escala de zonas FC es el único
lugar con multicolor "de verdad", también constante entre temas (significa intensidad).

**Temas.** Ver la sección dedicada más abajo.

**Tipografía.** `system-ui` — no se cargan webfonts (rinde nativo, app liviana / PWA). **La
identidad tipográfica vive en el peso, no en la familia:** títulos 700-800, cifras 800 con
`font-variant-numeric: tabular-nums` y tracking negativo (`-0.04em`) para que peso, carga y
timer se lean como un tablero atlético. Labels de sección en 11px uppercase + `letter-spacing
.05em`. Ver `colors_and_type.css` para la escala completa y las clases semánticas (`.t-display`,
`.t-num`, `.t-label`…).

**Espaciado.** Escala base 4px (`--space-1..12`), alineada con Comida. Gaps de 6–16px dentro de
tarjetas; páginas con `gap: 16px` entre bloques. Layout mobile-first, una columna, contenido con
padding 16px y 78px abajo para el nav fijo.

**Bordes y radios.** Radios `8 / 12 / 18px` (sm/md/lg) + `999px` para chips/badges/avatares.
Borde de 1px `#232733` define casi todo (las tarjetas son borde, no sombra). Hover de tarjeta:
el borde pasa a verde. Inputs: borde gris → verde en foco.

**Sombras.** Casi inexistentes en el tema oscuro; el contraste lo da el borde. Excepciones
funcionales: modales/auth (`0 20px 60px rgba(0,0,0,.35)`), bottom-sheets, y el **glow verde del
FAB** (`0 4px 16px rgba(74,222,128,.30)`), que es lo más cercano a un acento decorativo.

**Backgrounds / texturas.** Planos. Sin gradientes en superficies de contenido, sin imágenes
de fondo, sin patrones. (La pantalla del prototipo usa un radial sutil solo como ambiente del
*device frame*, no de la app.) Los tintes de color son `rgba` al ~10-14% sobre el fondo oscuro
(`--accent-dim`, `--zona-z*-dim`).

**Cards.** Fondo `--card`, borde 1px `--border`, radio `lg (18px)`, padding 16px. Sin sombra.
Variantes: `card` (genérica), `rutina-card` (cliqueable, borde→verde en hover), `descanso-card`
(centrada, timer), `auth-card` (la única con sombra).

**Animación.** Mínima y funcional. Transiciones de 120-180ms en color/borde/opacidad. Spinner
de carga (0.7s linear). Bottom-sheets entran con `translateY` (0.25s ease). El botón de serie
hace `scale(0.98)` al apretar. **Sin** bounces, parallax, ni loops decorativos.

**Hover / press.**
- Botón primario: `opacity .88` en hover.
- Botón secundario / chip: el borde y el texto pasan de muted a fg/accent.
- Tarjeta de rutina: borde → verde.
- Icon-button: fondo `--card-hover`.
- Press del botón de serie / FAB: `scale` (0.98 / 1.06).

**Transparencia y blur.** Blur no se usa. Transparencia sí, como tintes `rgba` de color sobre
el fondo (estados, zonas, backdrops de modal al 72%).

**Vibe de imagery.** La app no usa fotos. Lo "visual" son datos: dots de progreso, barras del
MiniChart, la tira semanal, los avatares de color. Frío, oscuro, de alto contraste.

---

## ICONOGRAPHY

- **Sistema:** [**Lucide**](https://lucide.dev) (`lucide-react` en el código). Es la única
  familia de íconos. Trazo **`stroke-width: 1.8`**, tamaño 16–24px, `currentColor` (heredan el
  color del contexto: muted por defecto, verde si está activo).
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
| `colors_and_type.css` | **Fuente de verdad** de tokens: color, zonas FC, estados, radio, espaciado, tipografía + clases semánticas. Importar siempre. |
| `SKILL.md` | Instrucciones para usar este sistema como Agent Skill. |
| `assets/shapeup-icon.svg` | Ícono de app (squircle verde + chevron). Base para íconos PWA. |
| `assets/shapeup-mark.svg` | Solo la marca (chevron verde, fondo transparente) para UI oscura. |
| `assets/shapeup-wordmark.svg` | Lockup horizontal Shape**Up** sobre oscuro. |
| `assets/shapeup-wordmark-light.svg` | Lockup para fondos claros. |
| `preview/*.html` | Tarjetas del Design System (color, type, spacing, componentes). |
| `ui_kits/shapeup/` | **UI kit interactivo** de la app — ver abajo. |
| `prompts-code/` | **Prompts para Claude Code** (pulido D1–D7, numerados 23–29) — implementan este sistema en el repo `jpcofano/shapeup`. Empezá por `PROMPTS-design.md`. |

### UI Kits
- **`ui_kits/shapeup/`** — recreación interactiva de la app ShapeUp. Abrí
  `ui_kits/shapeup/index.html`: login → home → sesión guiada (con timer de descanso y banners
  de técnica) → biblioteca/catálogo → historial → salud (composición/cardio/sueño/progreso) →
  perfil (cambiá de miembro). Ver su `README.md` para los componentes.

---

## Cómo diseñar con este sistema

1. Importá `colors_and_type.css`. Usá **siempre tokens**, nunca hex hardcodeado.
2. Tema oscuro, una columna, mobile-first. Respetá el nav de 6 ítems.
3. Texto en **voseo**, sentence case, labels de sección en uppercase.
4. Íconos **Lucide** 1.8 stroke. Logo desde `assets/`.
5. Para piezas de fitness (sesión, cardio) usá las zonas FC y los estados de identidad.
6. Reutilizá los componentes del UI kit (`ui_kits/shapeup/`) en vez de reinventarlos.
