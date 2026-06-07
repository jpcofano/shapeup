# Prompt 24 — E6.3 · Importador zip-first (un solo archivo)

> Objetivo: simplificar la importación a **un solo paso** — el usuario elige el `.zip` del export
> de Samsung Health y la app hace el resto. Es lo más automático posible en una PWA (los navegadores
> móviles **no** permiten leer carpetas del teléfono: `showDirectoryPicker` no existe en Chrome/
> Firefox Android, y abrir una carpeta con miles de archivos cuelga el navegador). Por eso el zip,
> no la carpeta. **No intentes acceso a carpetas ni File System Access API en móvil.**
>
> **Contexto de estructura (verificado):** el zip contiene
> `samsunghealth_<user>_<timestamp>/` con los CSV en la raíz, una carpeta `files/` y una carpeta
> `jsons/` (~2300 archivos). Los `live_data.json` de ejercicio están en
> `jsons/com.samsung.shealth.exercise/<letra>/<datauuid>.com.samsung.health.exercise.live_data.json`.
>
> **(1) Punto de entrada único (`src/routes/Salud.tsx`):** un selector de archivo
> `accept=".zip"`. Al elegirlo, abrirlo con **JSZip** (agregar dependencia) y **extraer solo lo
> necesario** — NO cargar los 148 MB en memoria. Leer el índice del zip y tomar únicamente:
> - Los CSV que ya usamos (peso/ejercicio/sueño + las ~8 métricas genéricas de P22), por patrón de
>   nombre, ignorando el prefijo de carpeta del export.
> - Para el match fino: solo los `live_data.json` de las sesiones que se van a matchear (por
>   `datauuid`), no todos.
> Detectar que es un export válido de Samsung (presencia de esos CSV / nombre de carpeta) y avisar
> con claridad si el zip no lo es.
>
> **(2) Reusar lo que ya existe:** `parsearCSV` / `parsearMetricas` (P21/P22),
> `parsearLiveData` + `matchBiometrico` (P23). El zip-first es **orquestación + origen de datos**,
> no parsers nuevos. Mantener el **preview antes de escribir** y la **idempotencia por `datauuid`**.
>
> **(3) Niveles, ahora sobre el zip:** un único flujo con opciones — "Básico" (peso/cardio/sueño),
> "Completo" (+ métricas genéricas), "Con match biométrico" (+ `live_data.json`). Todo sale del mismo
> zip; cambia qué se extrae.
>
> **(4) Fallback:** conservar el selector de CSV sueltos (multi-archivo) para quien prefiera, pero el
> zip es el camino principal y recomendado en la UI.
>
> **(5) Memoria/UX:** extracción selectiva por entrada (no descomprimir todo), barra de progreso, y
> liberar los blobs al terminar. Si el zip es muy grande, procesar por tandas.
>
> Actualizá `docs/SAMSUNG-HEALTH-MAPEO.md` (sección "importación zip-first": estructura del zip,
> extracción selectiva, por qué no carpeta en móvil) y `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E6.3
> + ADR: zip-first por restricción de PWA móvil; extracción selectiva para no agotar memoria). JSDoc,
> `tsc -b` limpio, tests verdes. `git add -A && git commit` + `git push`. **Pará y esperá revisión.**
