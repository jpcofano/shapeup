# Auditoría UI kit + Foundations — ShapeUp (2026-06-10)

> Auditoría rápida (top 10) con foco en **pulido visual, animaciones y claridad de datos
> traducidos/insertados**, contrastada contra el repo `jpcofano/shapeup@main`.
> Criterio de ranking: **impacto en el usuario**. Ninguno de estos ítems está cubierto
> por los prompts 35–39 ya en ejecución (donde roza, se indica).
> Evidencia: `explorations/auditoria-evidencia/*.png` y el informe navegable
> `explorations/Auditoria UI 2026-06-10.html`.

## Resumen

| # | Hallazgo | Sev. | Dónde | Esfuerzo |
|---|---|---|---|---|
| H1 | Catálogo bilingüe sin señalizar: 758/873 ejercicios (87%) caen a inglés en silencio | 🔴 | repo | M |
| H2 | Home Stadium y Clásico ignoran el programa activo (datos legacy) — y el prompt 39 dice "copiá del kit" | 🔴 | kit → repo | S |
| H3 | Fechas crudas e inconsistentes (ISO, DD/MM/YYYY y `fmt()` conviven) | 🟠 | kit + repo | S |
| H4 | Salud → Sueño: historial desalineado, texto que envuelve mal, copy "acostó 23:40" | 🟠 | kit | S |
| H5 | Pantalla de descanso: tarjeta arriba + 55% de pantalla vacía; timer 34px con token `--fs-timer: 52px` sin usar | 🟡 | kit | S |
| H6 | Historial: el badge RPE salta de posición entre tarjetas | 🟡 | kit | XS |
| H7 | Cardio: barra de zonas sin minutos — proporción sin dato legible | 🟡 | kit | S |
| H8 | Sin transición al cambiar de tab/pantalla (corte seco) | 🟡 | kit + repo | S |
| H9 | Momentos clave sin micro-feedback (serie hecha, últimos 5 s, fin de sesión) | 🟡 | kit + repo | M |
| H10 | Entrada animada (stagger) solo en Aurora; Stadium/Clásico/Historial/Salud montan en seco | 🟡 | kit + repo | S |

---

## H1 🔴 Catálogo bilingüe sin señalizar (claridad de datos traducidos)

**Qué pasa.** El diccionario `scripts/data/traducciones-fedb.es.json` tiene **115 de 873**
ejercicios traducidos (~13%). `importar-fedb.ts` marca cada ejercicio con
`traduccion: "ok" | "pendiente"`, pero `Catalogo.tsx` **no usa ese campo para nada**:
los 758 pendientes muestran nombre e instrucciones en inglés mezclados con la UI en
castellano, sin aviso, sin filtro y sin orden. El usuario no sabe por qué "Press de banca"
convive con "Barbell Glute Bridge". Los 115 traducidos sí son más ricos (todos tienen
puntosClave, erroresComunes, patrón y sinónimos; los pendientes los tienen vacíos).

**Propuesta (elegir alguna/s):**
- a) **Badge "EN"** discreto en la tarjeta cuando `traduccion === "pendiente"`.
- b) **Orden: traducidos primero** (con el mismo filtro aplicado).
- c) **Toggle "Solo en castellano"** en los filtros del catálogo.
- d) **Búsqueda que matchee sinónimos ES + nombre EN** (el campo `sinonimos` ya existe).
- e) **Plan de contenido**: completar traducciones por lotes priorizando los ejercicios
  usados en rutinas/programas activos (tarea de diccionario, no de código).

**Destino sugerido:** prompt nuevo (40) + entrada en MAPEO-ADDENDUM §A.

## H2 🔴 Stadium y Clásico ignoran el programa activo

**Qué pasa.** En `screens-home.jsx` solo **Aurora** resuelve el día con
`sesionDeHoy(progActivo)`. **Stadium y Clásico** siguen leyendo el mock legacy `PROGRAMA`
(`prog.hoy.idRutina`, `prog.diasMarcados`): con el programa activo en día de descanso,
Aurora y Entrenar dicen "Día de descanso" pero Stadium/Clásico dicen
**"HOY TOCA Tren superior — Empuje / Empezar sesión"**, y la WeekStrip marca los días de
otro programa. Además persiste el subtítulo legacy "Día 3 de 4".
**Riesgo:** el prompt 39 instruye "copiá de `screens-home.jsx`" → la incoherencia se
propaga al repo tal cual.

**Propuesta:** corregir el kit (los 3 layouts derivan de `sesionDeHoy` + programa activo,
WeekStrip del programa activo, sacar "Día 3 de 4") **antes** de ejecutar 39, y agregar
una línea al prompt 39 que lo exija.

**Destino sugerido:** fix en kit + 1 línea en `39-d13`. (Urgente: 39 está por ejecutarse.)

## H3 🟠 Fechas crudas e inconsistentes

**Qué pasa.** Conviven tres formatos a la vista del usuario: ISO crudo `2026-06-02`
(Sueño, Cardio, tabla de mediciones), `03/06/2026` (Historial) y un `fmt()` propio.
Para una app familiar, "2026-06-02" no es lenguaje humano.

**Propuesta:** un único helper `fmtFecha()` → **"mié 4 jun"** (con año solo si ≠ actual),
usado en todas las pantallas del kit, y mismo criterio en el repo (`lib/`).

**Destino sugerido:** kit + línea en prompt 39 (Historial/Salud ya se tocan ahí).

## H4 🟠 Sueño: historial desalineado + copy

**Qué pasa.** Las filas usan `justify-content: space-between` con un solo span derecho:
el texto "7.2 h · acostó 23:40" envuelve en dos líneas desparejas y nada queda alineado.
"acostó" suena raro en voseo.

**Propuesta:** grid de 3 columnas (fecha · horas con `tabular-nums` · "se acostó 23:40"
o "↘ 23:40"), alineación derecha consistente.

**Destino sugerido:** kit + va dentro del alcance de 39 (Salud).

## H5 🟡 Pantalla de descanso: composición y jerarquía

**Qué pasa.** La tarjeta del descanso queda pegada arriba y ~55% de la pantalla vacía;
el número usa 34px cuando el token de identidad `--fs-timer: 52px` (clase `.t-num`)
existe justamente para esto; el chip "Próximo: …· Serie 2" envuelve feo.

**Propuesta:** centrar verticalmente el bloque, timer en `t-num` (52px), chip en dos
líneas intencionales (label arriba, valor abajo). El estado urgente (<5 s) ya existe ✓.

**Destino sugerido:** kit + línea corta en prompt 38 (D12 toca la sesión guiada).

## H6 🟡 Historial: RPE que salta de posición

**Qué pasa.** El badge RPE aparece debajo de la meta-fila, salvo cuando la sesión no tiene
tonelaje (Movilidad): ahí sube a la línea de meta. El ojo pierde el ancla entre tarjetas.

**Propuesta:** meta-fila de slots fijos (fecha · duración · series · tonelaje-o-nada · RPE).

**Destino sugerido:** kit (XS) + cabe en 39.

## H7 🟡 Cardio: barra de zonas sin valores

**Qué pasa.** "Tiempo por zona (semana)" es solo proporción de colores: no dice cuántos
minutos, ni total. El dato está pero no es legible.

**Propuesta:** minutos por zona (label sobre cada segmento ≥ Z-ancho mínimo, o leyenda
"Z2 · 50 min"), y total semanal a la derecha del título.

**Destino sugerido:** kit + cabe en 39 (Salud).

## H8 🟡 Sin transición entre pantallas/tabs

**Qué pasa.** Nav inferior y tabs (Biblioteca, Historial, Salud) cambian con corte seco.
El repo ya tiene `fade-up` (280ms, gated por `prefers-reduced-motion`) pero solo lo usa
Aurora y dos detalles.

**Propuesta:** aplicar `fade-up` corto (180–200ms, sin stagger o stagger de 2) al
contenedor de página en cada cambio de tab/nav. Barato, consistente, ya hay precedente.

**Destino sugerido:** kit + prompt nuevo (41 — micro-animaciones) o sumar a 39.

## H9 🟡 Momentos clave sin micro-feedback

**Qué pasa.** Los tres momentos emocionales de la sesión pasan sin celebración ni énfasis:
"Serie hecha" → el descanso aparece de golpe; últimos 5 s → solo cambia el color;
fin de sesión → pantalla estática.

**Propuesta (sobria, sin confeti):**
- Serie hecha: scale-pulse del botón + el descanso entra con `su-up` (ya existe).
- Últimos 5 s: pulso de escala del número (1→1.06) por segundo, además del rojo.
- Fin de sesión: fade-up en cascada del título + stats; el anillo se llena animado.
- Todo gated por `prefers-reduced-motion` (patrón ya instalado).

**Destino sugerido:** kit + prompt nuevo (41) — alinear con 38 (D12 sesión guiada).

## H10 🟡 Entrada animada solo en Aurora

**Qué pasa.** El stagger `aurora-anim` existe y está bien hecho, pero solo Aurora lo usa.
Stadium, Clásico, Historial, Salud y Perfil montan en seco — se siente inconsistente al
cambiar de estilo de inicio.

**Propuesta:** reutilizar `.aurora-anim-N` en los bloques de los otros dos layouts y en
los heros de Historial/Salud (mismas clases, cero CSS nuevo).

**Destino sugerido:** kit + cabe en 39.

---

## Lo que se revisó y está bien (no tocar)

- **Tokens/temas**: 8 temas re-skinean limpio (probado Ion y Pulse); zonas FC y colores
  de miembro correctamente fuera del theming; `--on-accent` con contraste correcto por tema.
- **MediaTabs**: el estado activo del segmented control funciona bien (falsa alarma de
  captura; verificado en DOM).
- **Sesión guiada**: steppers, progreso global, instrucciones legibles, estado urgente
  del descanso — sólidos.
- **Flujo de programa en kit** (Programas → detalle → activar, coherencia Home Aurora /
  Entrenar): correcto, listo como referencia del prompt 37.
- **Catálogo**: las secciones vacías (puntos clave / errores) ya se ocultan ✓.
- `prefers-reduced-motion` ya respetado en kit y repo ✓.

## Sugerencia de incorporación al mapeo (si elegís todo)

- **Ahora (antes de 38/39):** H2 (fix kit + línea en 39), H5 (línea en 38).
- **Dentro de 39 (sin prompt nuevo):** H3, H4, H6, H7, H10.
- **Prompt nuevo 40 — "Catálogo bilingüe claro":** H1 (a–d) + plan de lotes (e).
- **Prompt nuevo 41 — "Micro-animaciones":** H8 + H9.
