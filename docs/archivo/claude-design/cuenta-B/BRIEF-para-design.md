# Brief para Claude Design — pulir ShapeUp

Este documento le dice a Claude Design qué pulir, sobre qué base y en qué orden. La app ya
**funciona de punta a punta** (E0–E6 + importador de salud, 158 tests verdes); Design pule sobre
algo que ya anda y ya tiene **contenido real sembrado** (rutinas con ejercicios, programas,
perfiles con color por miembro, historial). No hay placeholders que rellenar.

## Idioma y tono
- Castellano (argentino, voseo) en todo el texto de UI.
- Registro: energía, progreso, intensidad — pero limpio y legible, no "gym bro". Es una app
  familiar (la usan un hombre de 51, una mujer de 50 y dos adolescentes deportistas).

## Decisión de sistema de diseño: FORK, no clon ni de cero
ShapeUp **comparte el lenguaje base** con la app de Comida Familiar pero **tiene identidad propia**.
La regla: que se vean como **hermanas, no gemelas ni extrañas.**

**Heredar de Comida (base agnóstica del dominio, ya portada):**
- La arquitectura de tokens en `src/styles/tokens.css` (color, radio, espaciado, tipografía,
  modo oscuro). Ya está y es la **fuente de verdad** de estilos.
- Tokens `--member-juanpablo/maria/sofia/federico` (color por miembro), ya sincronizados con
  `/config/perfiles`.
- Componentes ya traídos: `MemberAvatar` + `AvatarStack`, `WeekStrip`.
- Íconos con **lucide-react**.

**Crear propio (la capa de identidad de ShapeUp):**
- **Logo / marca** de ShapeUp (hoy no hay; `PlatoMark` de Comida quedó solo como molde — no copiarlo).
- **Color de marca / accent**: hoy usa verde (`--accent`). Decidir si ese es *el* color de ShapeUp
  o conviene diferenciarlo del de Comida. Definir y dejar en tokens.
- **Escala de zonas de FC (Z1→Z5)**: nueva, de frío a caliente, como tokens
  (`--zona-z1..z5`). Engancha con las zonas por miembro ya sembradas en `/config/perfiles` y la
  usa el módulo de Salud / cardio.
- **Estados de fitness** que Comida no tiene: "sesión activa", intensidad, descanso en curso.
- **Visuales de progreso**: los `MiniChart` (peso/tonelaje), los dots de serie (`ProgressDots`),
  el `DescansoTimer`. Pulirlos como pieza de identidad.

## Qué NO tocar (respetar)
- Nada de `src/types/`, `src/lib/`, `src/data/`, `src/auth/`, ni la lógica. Design toca presentación.
- El **nav inferior de 6 ítems** (Inicio/Rutinas/Entrenar/Historial/Salud/Perfil) es restricción de
  diseño fija. El catálogo se accede por tabs en Biblioteca, no suma un 7º ítem.
- `EntrenarSesion` es **fullscreen sin nav** (pantalla de sesión); respetarlo.
- El **preview antes de importar** en Salud es una decisión de UX deliberada (datos sensibles);
  mantenerlo.
- Usar siempre tokens, no colores hardcodeados.

## Orden de pulido (pantalla por pantalla)
1. **Identidad primero:** logo + accent de marca + escala de zonas FC en tokens. Todo lo demás cuelga de esto.
2. **Home** — la más visible: avatar + `WeekStrip` + "hoy toca" (programa activo del miembro).
3. **Entrenar / EntrenarSesion** — el corazón de la app: modo guiado, `ProgressDots`, `DescansoTimer`,
   banners de técnica (verde puntosClave / ámbar erroresComunes), registro de serie.
4. **Biblioteca + Catálogo** (tabs Rutinas | Ejercicios), tarjetas de rutina/ejercicio, filtros.
5. **Historial + Progreso** — lista de sesiones, detalle, los `MiniChart`.
6. **Salud** — composición / cardio / sueño / progreso, flujo de import con preview.
7. **Perfil** y **pantallas de auth** (Login / no-autorizado).

## Coordinar con PWA (decisión pendiente)
Si ShapeUp va a ser **instalable** (PWA con `vite-plugin-pwa`), Design tiene que producir el set de
**íconos** (varios tamaños), el **splash** y el **theme-color** del manifest. Conviene decidir esto
antes de que Design dibuje el ícono, porque es el mismo trabajo.

## Datos para ver la app llena
Antes de empezar, correr todos los seeds (`docs/SEEDS.md`) para que Design trabaje sobre la app con
contenido real (cada miembro con su programa, ejercicios con técnica, perfiles con color), no vacía.

## Primer encargo sugerido
> "Pulí ShapeUp respetando los tokens existentes en `src/styles/tokens.css` y los componentes ya
> traídos de Comida (`MemberAvatar`, `WeekStrip`). Primero definí la identidad propia: logo, color
> de marca y una escala de zonas de FC (Z1→Z5). Después pulí pantalla por pantalla empezando por
> Home. No toques la lógica (`lib`/`data`/`types`/`auth`) ni el nav inferior de 6 ítems."
