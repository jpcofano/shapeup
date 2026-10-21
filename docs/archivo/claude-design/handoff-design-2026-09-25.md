# ShapeUp — handoff para Claude Design (25/09/2026)

## Qué es esto

ShapeUp es una app de entrenamiento personal y familiar (React + TypeScript + Firebase), en
uso real por una familia de cuatro. Hay un **UI kit** que recrea la app entera de forma
interactiva, sin Firebase ni lógica. **El diseño se hace ahí**, y después se porta a `src/`.

Repo público, actualizado: **github.com/jpcofano/shapeup**, commit `475304b`.

```
git clone https://github.com/jpcofano/shapeup.git
```

Abrí **`ui_kits/shapeup/index.html`** en el navegador. No hay que compilar nada: React, Babel
y Lucide entran por CDN y los `.jsx` se transpilan en el navegador. Arranca en login y de ahí
se recorre la app en un marco de teléfono.

| Archivo | Qué tiene |
|---|---|
| `index.html` | El marco del teléfono y la carga de todo |
| `app.css` | Estilos de componentes, adaptados 1:1 de `src/index.css` |
| `data.jsx` | Datos mock realistas |
| `primitives.jsx` | `Icon`, `Avatar`, `AvatarStack`, `Badge`, `WeekStrip`, `ProgressDots`, `MiniChart` |
| `screens-home.jsx` · `screens-entrenar.jsx` · `screens-biblioteca.jsx` · `screens-salud.jsx` | Las pantallas |
| `app.jsx` | Shell, nav inferior, router |

Los tokens salen de `colors_and_type.css`, en la raíz del repo. El logo, de `assets/`.

## La forma de trabajo

1. **Se diseña en el kit**, no en `src/`. El kit es el taller.
2. Cuando algo queda bien, se escribe un prompt para Claude Code que lo **porta** a `src/`.
3. Por eso el entregable no es solo "se ve mejor": es **qué clases y qué tokens nuevos hay que
   llevar**, y a qué componente de `src/` corresponde cada cosa.

**El kit está atrasado respecto de la app.** Se construyeron seis superficies nuevas esta
semana que probablemente no estén ahí. Si una pantalla existe en `src/` y no en el kit,
**recreala primero tal como está** y recién después proponé cambios: si no, se rediseña contra
algo que no es lo que la gente usa.

---

## Lo que hay que diseñar

Seis superficies nuevas, todas funcionando y **ninguna mirada por diseño**. Lo importante de
cada una son **sus estados**, no la pantalla feliz.

### 1. Configuración — la más nueva y la que más lo necesita

Dos secciones, y la separación es la mitad del diseño:

- **Mío** — solo afecta a quien lo edita.
- **De la familia** — lo ven y lo usan los cuatro. Tiene que verse que es distinto **antes** de
  tocar nada.

Campos: meta de días por semana · duración mínima para que una actividad entre al historial ·
actividades siempre relevantes (lista) · minutos para que un día cuente como movimiento · VR
(paso y piso de descanso, techo de rondas, paso y techo de tiempo) · juegos que no cuentan ·
FC máxima y zonas · equipo por lugar · lugar habitual.

**Estados a resolver:**
- valor **por defecto** contra valor **puesto por la persona** — tiene que distinguirse de un
  vistazo, porque dentro de tres meses nadie se acuerda si un 30 fue una decisión;
- **vaciar el campo vuelve al default**, y eso hay que comunicarlo sin un cartel;
- **solo lectura**: la lista de juegos la edita únicamente el dueño de la familia. Que se vea
  por qué, no un campo gris y mudo;
- valor inválido.

### 2. Chip de sincronización, en Inicio

La app trae sola los datos del reloj. Tres estados: *sincronizando* · *listo, N actividades
nuevas* · *no se pudo*. **Si no entró nada, no aparece nada**: el silencio es la respuesta
correcta. Convive con el chip de "sesiones sin subir", que ya existe.

### 3. Tarjeta de progresión de VR, al abrir una rutina de VR

El sistema propone cómo progresar, midiendo la frecuencia cardíaca contra la zona objetivo.

- **Con medición**: una línea de datos (*"32 de 30 min · FC de trabajo 142 (Z3) · objetivo
  Z4"*), una de sugerencia (*"Subí un nivel la dificultad"*), y dos botones: aplicar o dejar
  como la última vez.
- **Sin medición**: el sistema **no inventa una sugerencia**. Dice qué le faltó y ofrece las
  opciones para que elija la persona. Este estado es tan importante como el otro y no puede
  parecer un error.
- **Aviso de dato dudoso**: *"En Creed la muñeca no viene midiendo bien"*. Información, no
  alarma.
- Sin historia previa, no hay tarjeta.

### 4. Sesión por tiempo

Un reloj grande, el objetivo y **un solo botón: Terminar**. Está pensada para usarse **con un
visor de VR puesto**: se mira antes y después, nunca durante. Nada de toques en el medio.
Estados: elegir por tiempo o por rondas · corriendo · pasado el objetivo (seguir jugando es
normal, no un error).

### 5. Sesión de juego

Elegir el juego, el mismo reloj, terminar. Una línea chica que recuerde arrancar el
entrenamiento en el reloj, que es lo que hace que haya datos de FC.

### 6. Chip de dificultad al cerrar una sesión de VR

*suave · normal · intenso*. Un toque, **opcional**, donde en las sesiones de fuerza va el RPE.

### Y tres que ya existen en la app y quizá no en el kit

La tarjeta de adherencia de Inicio (tres líneas: días de la semana, racha y récord, tasa de 8
semanas) · la tira semanal con cuatro estados (hecho, movimiento, hoy, pendiente) · el
historial con actividades externas marcadas con un chip.

---

## Lo que no se negocia

- **Los tokens de `colors_and_type.css` son la fuente de verdad.** Nada de colores sueltos. Si
  falta un token, se propone agregarlo ahí, con nombre.
- **Hay ocho temas** (`ion`, `volt`, `solar`, `blaze`, `crimson`, `pulse`, `grape`, `indigo`).
  Lo que se diseñe tiene que verse bien en todos: el fondo oscuro no cambia, cambia la familia
  del acento.
- **La escala de zonas de FC (Z1→Z5) es semántica y no cambia con el tema.** No la uses como
  paleta decorativa.
- **Legible en escala de grises.** Nada que dependa solo del color para distinguirse: ya es
  regla en el gráfico de adherencia.
- **Se usa entrenando**: de pie, con las manos ocupadas, a veces con un visor puesto. Los
  botones de acción de la sesión son grandes a propósito (el de "Serie hecha" mide 76 px de
  alto). No los achiques.
- **Castellano rioplatense, con voseo.**
- **Sin dependencias nuevas.** Lo que se agregue tiene que poder portarse a React + CSS sin
  librerías.

**Fuera de alcance salvo que Juan lo pida:** los cinco layouts de Inicio (`aurora`, `stadium`,
`clasico`, `pulse`, `premium`), el flujo de la sesión guiada y la navegación inferior. Si algo
de eso te parece que hay que cambiar, proponelo aparte, no lo cambies de una.

---

## Contexto que conviene leer antes de proponer

- `ui_kits/shapeup/README.md` — qué recrea el kit y cómo.
- `docs/PROMPTS-design.md` y `docs/prompts/BRIEF-para-code.md` — lo que ya se decidió de
  diseño.
- `docs/home-redux/design_handoff_theming/` — el CSS y los prototipos del Inicio actual.
- `docs/ESTADO-DEL-PROYECTO.md` — dónde está todo hoy.
- `CLAUDE.md` — las decisiones que no se re-discuten, con sus motivos.

---

## Una advertencia

**Cuatro de esas seis pantallas todavía no vieron un dato real.** Se construyeron completas y
funcionan, pero nadie las usó entrenando. La tarjeta de VR, sobre todo, cambia bastante según
haya o no frecuencia cardíaca medida.

Conviene usar la app un par de días antes de cerrar decisiones visuales. Diseñar contra datos
inventados tiene el mismo problema que construir contra datos inventados, y este proyecto ya
se llevó varios sustos por ahí.

---

## El entregable

1. Los archivos del kit, nuevos o modificados, dentro de `ui_kits/shapeup/`.
2. **La lista de tokens y clases nuevas**, y a qué componente de `src/` corresponde cada
   pantalla, para poder escribir el prompt de portado.
3. Qué estado de cada pantalla corresponde a qué caso real, para que al portar no se pierda
   ninguno: los estados vacíos y los de "no hay datos" son los que más se pierden.
