# ShapeUp — UI Kit

Recreación interactiva de alta fidelidad de la app ShapeUp. **No es código de producción** —
recrea la UI fielmente (leída de `src/` del repo) con interacciones de click-thru, sin Firebase
ni lógica real.

Abrí **`index.html`**. Arranca en login → al entrar, recorrés la app completa en un frame de
teléfono.

## Flujo demostrable
- **Login** → "Entrar con Google" (mock).
- **Inicio** — **3 estilos de layout** seleccionables (Perfil → Estilo de inicio):
  - **Aurora** (default): anillo de progreso con glow + gradiente del tema, glass card "**Hoy
    toca**" (sesión del día del programa activo, o "**Día de descanso**"), fila bento (volumen /
    peso Δ / racha), **vista semanal del programa activo** con bíceps/descansos. Animado.
  - **Stadium**: hero marquesina + "Empezar ahora" + stats scrolleables.
  - **Clásico**: tarjetas (la Home D2 sobria).
- **Entrenar** — 3 puertas: **hoy toca** (sesión del día según el programa activo, o "día de descanso") · elegir rutina · **Sesión libre**.
- **Biblioteca** — tabs *Programas | Rutinas | Ejercicios*:
  - **Programas**: lista con mini-vista semanal, badge "Activo", "X días/sem · Y descanso".
  - **Detalle de programa**: vista semanal (L–D con entreno/descanso), día por día, "Cómo usarlo",
    botón **"Activar para mí"** (programa activo **por miembro**).
  - Rutinas / Ejercicios (catálogo con buscador, filtros, detalle).
- **Sesión libre** (`SesionLibre`, fullscreen) — armá una sesión ad-hoc: pasar ejercicios del
  catálogo (bottom-sheet), reordenar ↑↓, borrar, ajustar series/reps, **Empezar**.
- **Sesión** (`EntrenarSesion`, fullscreen sin nav) — el corazón: **barra de progreso global**,
  navegación ‹› entre ejercicios, músculo objetivo, `ProgressDots`, **steppers +/−** de reps/carga
  (sin teclado), instrucciones colapsables, banners verde/ámbar de técnica, botón *Serie hecha*
  → **descanso con anillo** de cuenta regresiva + chip "Próximo" → finish con **bíceps** + RPE.
  Botón ⤓ alterna a **modo scroll**.
- **Biblioteca** — tabs *Rutinas | Ejercicios*; tarjetas de rutina; catálogo con buscador y
  filtros; **detalle de ejercicio** expandible: **video demo** + **mapa muscular** (BodyMap) +
  ficha técnica 2×2 (nivel/mecánica/patrón/equipo) + ejecución + banners.
- **Historial** — tabs *Sesiones | Progreso*: lista con badge de bíceps + detalle; en Progreso,
  **sparkline** de volumen, totales y **records personales** (PR) con trofeo.
- **Salud** — tabs *Composición / Cardio / Sueño / Progreso*: heros con **sparkline** + tiles con
  Δ, **distribución de tiempo por zona FC** (rampa Z1→Z5), chips de zona, y el **preview antes de
  importar** un CSV (decisión de UX deliberada).
- **Perfil** — datos del miembro + **Apariencia** (modo **claro/oscuro** + toggle sol/luna en el
  copete, disponible en todas las pantallas) + **selector de tema** (5: Ion · Volt · Blaze · Indigo ·
  Pulse, por miembro) + **estilo de inicio** (Aurora/Stadium/Clásico) + botón **Instalar app** (PWA)
  + cambiar de miembro.

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Frame de teléfono + carga React/Babel/Lucide y los `.jsx`. |
| `app.css` | Estilos de componentes (adaptados 1:1 de `src/index.css`) + Aurora/steppers/etc. |
| `data.jsx` | Datos mock realistas (miembros, ejercicios con músculos, rutinas, historial, progreso, salud). |
| `primitives.jsx` | `Icon`, `Avatar`, `AvatarStack`, `Badge`, `WeekStrip`, `ProgressDots`, `MiniChart`, `Sparkline`. |
| `body-map.jsx` | `BodyMap` (silueta frente/espalda con músculos resaltados) + `MUSCULO_LABEL`. |
| `screens-home.jsx` | `Login`, `Home` (variantes aurora/stadium/clasico), `ProgressRing`, `BentoTile`. |
| `screens-entrenar.jsx` | `EntrenarSesion` (guiada + scroll + finish), `SesionLibre`, `Stepper`, `RestRing`. |
| `screens-biblioteca.jsx` | `Biblioteca` (tabs Programas/Rutinas/Ejercicios), `RutinaDetalle`, `VideoPlayer`. |
| `screens-programa.jsx` | `ProgramasTab`, `ProgramaDetalle`, `VistaSemanal`, `sesionDeHoy` (flujo de programa por día de semana, activo por miembro). |
| `screens-salud.jsx` | `Salud`, `Historial` (+ Progreso), `HistorialDetalle`, `Perfil`. |
| `app.jsx` | Shell, nav inferior de 6 ítems, router, tema por miembro, estilo de inicio. |

## Notas
- Tokens desde `../../colors_and_type.css`; logo desde `../../assets/`.
- Íconos **Lucide** vía CDN. Componente `<Icon name size stroke color fill />`.
- Componentes globales (`window.*`) para compartir scope entre archivos Babel.
- Es una base para componer mocks: reutilizá las pantallas y primitivos, no los reinventes.
