# Auditoría ShapeUp — UI Kit + Foundations + Datos · 9 jun 2026

Alcance: auditoría rápida (top 10) sobre UI kit completo + foundations, con foco en
**pulido visual, animaciones y claridad de datos/traducciones**, contrastando kit ↔ repo
(`jpcofano/shapeup@main`). Criterio de priorización: impacto en el usuario.

Estado: **lista para elegir**. Ningún ítem incorporado aún al mapeo. Al elegir, cada ítem
se aplica primero al kit (fuente de verdad) y después se escribe el prompt para el repo.

---

## A · Datos y traducciones (lo pedido con lupa)

### A1 🔴 Las traducciones ES pierden ~80% del detalle del original
- **Evidencia** (medido sobre `scripts/data/traducciones-fedb.es.json` vs `fedb/exercises.json`):
  107 de 115 traducciones conservan **menos del 60%** del contenido EN; las peores quedan
  en 14–18% (Concentration_Curls: 1138 chars EN → 160 ES). Promedio ES: 3,1 pasos / 175 chars.
- **Qué se pierde**: tips de técnica ("little finger higher than thumb"), respiración,
  advertencias ("avoid swinging"), posición inicial detallada.
- **Impacto**: el usuario que entrena con la ficha ES recibe instrucciones tipo resumen;
  la versión EN es objetivamente más completa → exactamente lo que notaste.
- **Propuesta (candidato D14)**: pase de re-traducción "fiel" por lotes con reglas:
  1 paso EN = 1 paso ES (sin fusionar); los "Tip:" van a `puntosClave`; los "Caution:" a
  `erroresComunes`; mantener señales de respiración. Validador en `importar-fedb.ts` que
  reporte ratio ES/EN < 0,7 como warning por ejercicio.

### A2 🔴 758 de 873 ejercicios sin traducir → catálogo bilingüe e inconsistente
- **Evidencia**: el importador marca `traduccion:"pendiente"` y deja nombre + instrucciones
  en inglés, con `puntosClave: []` y `erroresComunes: []`. Pendientes por nivel:
  443 beginner · 264 intermediate · 51 expert. Por categoría: 497 strength · 100 stretching ·
  56 plyometrics · resto menor.
- **Impacto**: en producción el catálogo mezcla "Sentadilla goblet" con "Barbell Glute Bridge",
  y las fichas pendientes quedan sin puntos clave ni errores → experiencia despareja.
- **Propuesta (decisión + candidato D14b)**: elegir política:
  - (a) importar con `--solo-traducidos` hasta ampliar cobertura (catálogo chico pero 100% ES), o
  - (b) importar todo con **badge "EN"** visible en catálogo + filtro "solo en español",
    y traducir por lotes priorizando los 443 beginner (los relevantes para la familia).

### A3 🟠 `patronAprox()` etiqueta mal los patrones de movimiento
- **Evidencia** (`scripts/importar-fedb.ts`): todo `push` → "Empuje horizontal" (un press
  militar es vertical), todo `pull` → "Tracción horizontal" (un chin-up es vertical),
  y el default es "Aislamiento" — que es mecánica, no patrón (una sentadilla sin `force`
  quedaría "Aislamiento").
- **Impacto**: filtros por patrón y el mapa muscular (B3) heredan datos incorrectos.
- **Propuesta**: mapa por keywords del nombre (squat/lunge → dominante de rodilla,
  deadlift/hip thrust → dominante de cadera, overhead/military → empuje vertical,
  pulldown/chin/pull-up → tracción vertical, row → tracción horizontal, carry → acarreo)
  con fallback al actual. Es un cambio chico y de alto valor para el catálogo.

### A4 🟡 `descansoSugeridoSeg` fijo en 75 s para todo
- Un peso muerto y un estiramiento reciben el mismo descanso sugerido.
- **Propuesta**: por mecánica/categoría — compuesto 90–120 s, aislamiento 60–75 s,
  movilidad/stretching 20–30 s, cardio n/a.

## B · UI kit — pulido visual

### B5 🟠 Home Aurora: doble métrica confusa
- "Día 3 de 4" bajo el saludo vs anillo "2/4 SESIONES": dos formas distintas de contar la
  semana, una al lado de la otra. ¿Día del programa? ¿Sesiones hechas?
- **Propuesta**: unificar en una sola línea de contexto ("Semana 3 · 2 de 4 sesiones") y
  que el anillo sea la única métrica grande.

### B6 🟡 Historial: chip RPE inconsistente y jerarquía plana
- En sesiones cortas el chip RPE queda inline con la meta; en las demás baja a segunda
  línea. Fecha, series y kg pelean al mismo peso visual.
- **Propuesta**: fila de meta fija (fecha · duración · series · kg) + RPE siempre como chip
  a la derecha del título; kg en seminegrita como dato principal.

### B7 🟡 Salud · Composición: mitad inferior vacía
- Tras los 3 KPIs queda ~45% de la pantalla en blanco; el gráfico de peso es una recta sin
  puntos intermedios ni labels.
- **Propuesta**: tendencia 30 días con puntos por pesaje + última medición de cada KPI con
  fecha ("hace 5 días"), o grilla 2×2 con mini-sparklines.

### B8 🟡 Sesión guiada: scroll de instrucciones poco evidente
- El dock inferior (steppers + CTA) tapa el final de "Cómo se hace"; no hay señal de que
  hay más contenido debajo.
- **Propuesta**: scrim/fade en el borde inferior del área scrolleable + padding extra.

## C · Animaciones

### C9 🟠 Sin micro-interacciones: todo cambio es un corte seco
- Cambios de pantalla y de tab sin transición; el anillo de progreso no anima al entrar;
  "Serie 1 hecha ✓" no da feedback.
- **Propuesta (candidato D15)**: set acotado de micro-interacciones:
  - entrada de cards con stagger (~60 ms, translateY 8px + fade),
  - anillo: stroke-dashoffset animado + count-up al montar,
  - check de serie: escala + pulso del CTA,
  - tabs: slide sutil del indicador.
  Todo detrás de `prefers-reduced-motion`.

### C10 🟡 FAB "+" de Rutinas no hace nada (kit) — divergencia con repo
- El repo tiene `EjercicioForm.tsx` / creación; el kit muestra el FAB sin acción.
- **Propuesta**: o se maqueta "Nueva rutina" en el kit, o se quita el FAB del kit hasta
  mapearlo. Decisión chica pero evita vender una acción muerta.

---

## Lo que está sólido (no tocar)
- Foundations: tokens + 8 temas consistentes en todas las pantallas revisadas.
- Flujo de programa (vista semanal, activo por miembro) coherente Home ↔ Entrenar ↔ Detalle.
- Sesión guiada: MediaTabs, steppers y progreso global funcionan y se entienden.
- Estructura del importador (descarga automática, mensajes claros, `--solo-traducidos`).

## Sugerencia de orden si entran al mapeo
A1 + A2 (un solo prompt de datos) → A3 (entra en el mismo PR del importador) →
C9 (micro-interacciones, kit primero) → B5–B8 (pulido en un solo pase) → A4, C10 (menores).
