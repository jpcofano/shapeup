# ShapeUp — UI Kit

Recreación interactiva de alta fidelidad de la app ShapeUp. **No es código de producción** —
recrea la UI fielmente (leída de `src/` del repo) con interacciones de click-thru, sin Firebase
ni lógica real.

Abrí **`index.html`**. Arranca en login → al entrar, recorrés la app completa en un frame de
teléfono.

## Flujo demostrable
- **Login** → "Entrar con Google" (mock).
- **Inicio** — avatar del miembro, `WeekStrip` con hoy marcado, programa activo, "hoy toca" +
  *Empezar sesión*, stack de la familia.
- **Sesión** (`EntrenarSesion`, fullscreen sin nav) — el corazón: modo guiado con nombre grande,
  `ProgressDots`, chip de objetivo, instrucciones colapsables, banner verde de *puntos clave* y
  ámbar de *errores comunes*, log rápido (reps/carga), botón *Serie hecha* → **timer de descanso**
  → avanza de ejercicio → pantalla de finalización con selector de **RPE**. Botón ⤓ alterna a
  **modo scroll**.
- **Biblioteca** — tabs *Rutinas | Ejercicios*; tarjetas de rutina; catálogo con buscador y
  filtros; detalle de ejercicio expandible (ejecución / puntos clave / errores).
- **Historial** — lista de sesiones + detalle con stats y series.
- **Salud** — tabs *Composición / Cardio / Sueño / Progreso*, `MiniChart`, chips de **zona FC**,
  y el **preview antes de importar** un CSV (decisión de UX deliberada).
- **Perfil** — datos del miembro + **cambiar de miembro** (cambia el color de toda la app).

## Archivos
| Archivo | Contenido |
|---|---|
| `index.html` | Frame de teléfono + carga React/Babel/Lucide y los `.jsx`. |
| `app.css` | Estilos de componentes (adaptados 1:1 de `src/index.css`). |
| `data.jsx` | Datos mock realistas (miembros, ejercicios, rutinas, historial, salud). |
| `primitives.jsx` | `Icon`, `Avatar`, `AvatarStack`, `Badge`, `WeekStrip`, `ProgressDots`, `MiniChart`. |
| `screens-home.jsx` | `Login`, `Home`. |
| `screens-entrenar.jsx` | `EntrenarSesion` (guiada + scroll + finish). |
| `screens-biblioteca.jsx` | `Biblioteca`, `RutinaDetalle` (+ catálogo). |
| `screens-salud.jsx` | `Salud`, `Historial`, `HistorialDetalle`, `Perfil`. |
| `app.jsx` | Shell, nav inferior de 6 ítems, router. |

## Notas
- Tokens desde `../../colors_and_type.css`; logo desde `../../assets/`.
- Íconos **Lucide** vía CDN. Componente `<Icon name size stroke color />`.
- Componentes globales (`window.*`) para compartir scope entre archivos Babel.
- Es una base para componer mocks: reutilizá las pantallas y primitivos, no los reinventes.
