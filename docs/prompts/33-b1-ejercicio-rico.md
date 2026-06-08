# Prompt 33 — B1 · Explicaciones ricas de ejercicio (funcional)

> Etapa funcional B1 (prioridad del owner). Los datos ricos de FEDB **ya están importados** en
> el catálogo (músculos primarios/secundarios, nivel, mecánica, patrón, equipo). Esta etapa es
> **mayormente mostrarlos** — poco código, alto valor. **No** toques la lógica de datos; si un
> campo no existe, degradá elegante (no lo muestres). Tokens, voseo.
>
> **(1) Auditá qué hay en el modelo `Ejercicio`** (`src/types/models.ts`) y qué trae el seed
> FEDB: `musculosPrimarios`, `musculosSecundarios`, `nivel`, `mecanica` (compuesto/aislado),
> `patron`, `equipo`, `modalidad`. Listá en el MAPEO qué campos están disponibles realmente.
>
> **(2) Detalle de ejercicio en el Catálogo** (`src/routes/Catalogo.tsx`, card expandible):
> sumá una sección de **ficha técnica** con chips/filas para: músculos **primarios** (badge
> `badge-accent`) y **secundarios** (`badge-muted`), **nivel**, **mecánica**, **patrón** y
> **equipo**. Mantené las secciones que ya están (Ejecución, Puntos clave, Errores, Seguridad,
> imagen). Orden sugerido: imagen → ficha técnica (chips) → ejecución → banners.
>
> **(3) En la sesión guiada** (`BloqueGuiado.tsx`): junto al nombre del ejercicio, una línea
> compacta de contexto (músculo primario + equipo) — discreta, sin recargar la pantalla de
> entreno. Opcional, solo si entra sin estorbar.
>
> **(4) Traducción:** los campos FEDB pueden venir en inglés. Si ya hay un mapa de traducción
> (`scripts/data/traducciones-*.json` o similar), usalo para mostrar en castellano; si no, dejá
> el valor crudo y anotá en el MAPEO que la traducción de músculos/patrones queda para E5 (backlog).
> **No** armes un sistema de i18n nuevo en esta etapa.
>
> **Fuera de alcance (NO en B1):** mini-mapa corporal (B3), video YouTube (B2), variantes (B4).
> Solo surfacear lo que ya existe como texto/chips.
>
> **Nota de diseño:** funcional y prolijo con clases existentes; el pulido premium del detalle va
> en D10.
>
> **Verificación:** al expandir un ejercicio del catálogo se ven sus músculos/nivel/mecánica/
> patrón/equipo como chips; los ejercicios sin esos datos no muestran huecos. `tsc -b` limpio,
> tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora B1 + qué campos FEDB se
> surfacearon + fila de Estado). Commit + push. **Pará y esperá mi revisión.**
