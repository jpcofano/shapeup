# ANALISIS-ASISTIDO.md §6, versión de P103

_Archivado en P109 (23/10/2026). Origen: `docs/ANALISIS-ASISTIDO.md` §6, tal como quedó en P103 (Bloque 1, `6023035`). La versión vigente está en ese mismo documento._

### 6 · Pantalla — como quedó construida (P103, Bloque 1, `6023035`)

_Era una propuesta a confirmar. Se construyó como estaba decidida en el chat, con un agregado arriba
(la calidad). **La auditoría de diseño con Claude Design (P101) la ajusta después**, así que esto es el
punto de partida de esa auditoría y no la versión final._

En `HistorialDetalle`, debajo del título, de arriba hacia abajo (`CabeceraMarcas`, `CurvaSesion` y
`AnalisisSesion`):

1. **Calidad**, si aparece, con estilo de aviso: cambia cómo se lee el resto.
2. **Veredicto** (solo con análisis de esquema 3), con «· análisis».
3. **Badges de nivel 1**, en el orden del catálogo (§3).
4. **Dos destacados** (solo con análisis), con borde punteado.
5. **Curva** con las marcas que tienen momento o tramo.
6. **Secundarias de nivel 2**, en una fila discreta y sin color.
7. **Detalle del análisis**, plegado (solo esquema 3; los análisis de esquema 2 se ven como antes).

El resto de la pantalla (stats, series, FC de Samsung, contexto del día, análisis) sigue igual.

**La curva:**
- SVG a mano, sin librería; la geometría es pura y está en `lib/curvaSesion.ts`.
- Bandas de zona con `zonasUsadas` de la sesión.
- Los **tramos** van como franja; los **momentos**, como línea.
- Las marcas de la app van **sólidas**; las del análisis, con **borde punteado** y la etiqueta «análisis».
- **Tocar una marca muestra su texto.** Una marca del análisis con `refMarca` se dibuja sobre la marca
  de la app y no toma el toque: tocar la de la app muestra su texto y, abajo, el comentario del análisis.
- **Sin curva guardada, no se dibuja ni ocupa lugar.** Las marcas que no salen de la curva se ven igual.

**Además:**
- Mientras el historial no cargó, no se muestran `record` ni `semana`.
- Una sesión sin analizar se ve igual en todo lo medido.
- `RevisionFcMax`: en las sesiones excluidas muestra el pico crudo (`biometria.fcMax`) y el suavizado.
- El `planSemana` se sella en `EntrenarState` el día en que se juega. Una sesión vieja guardada después
  lleva el de ese día; sin plan sellado se guarda sin plan (no se completa con el de hoy).
- **Capturas:** no se sacaron (Playwright no está en el repo y no se instaló nada). Quedan para la
  auditoría de diseño.

