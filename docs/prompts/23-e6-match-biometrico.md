# Prompt 23 — E6.2 · Match biométrico (FC por serie)

> Objetivo: cruzar cada sesión de entrenamiento de ShapeUp con su sesión de Samsung Health para
> enriquecerla con FC real, **a nivel serie** cuando se puede, con degradación elegante a nivel
> sesión. Todo verificado contra el export real (ver `docs/SAMSUNG-HEALTH-MAPEO.md`).
>
> **Hechos confirmados del formato Samsung (no asumir, ya está verificado):**
> - La sesión propia se identifica por **`custom_id`**: en `com.samsung.shealth.exercise.custom_exercise`
>   está la fila `custom_name = "ShapeUp"` con su `custom_id` (ej. `mq1mz4gd_gq`, **resolver por
>   nombre, no hardcodear** — es por dispositivo). Las filas de `…exercise` con ese `custom_id` son
>   las sesiones ShapeUp. El `title` viene vacío; **la llave es `custom_id`**, no el título.
> - La fila de `…exercise` trae `start_time`/`end_time` (string local + `time_offset`),
>   `mean/max/min_heart_rate`, `duration` (ms), `datauuid`, y referencia un archivo
>   `…live_data.json`.
> - La **curva fina** está en ese `live_data.json` (carpeta `jsons/com.samsung.shealth.exercise/`):
>   lista de muestras `{ "heart_rate": 99.0, "start_time": 1780356821758 }` ~1 por segundo
>   (epoch ms, mismo reloj que la sesión).
>
> **(1) Cambio habilitante — timestamp por serie en `SerieRegistro`:** agregá `inicioMs` y `finMs`
> (epoch ms) a cada serie registrada, y sellalos en el flujo de `Entrenar` al completar cada serie
> (reducer `lib/entrenarState.ts` + persistencia en `data/historial.ts`). **Sin esto no hay match
> fino posible**, así que entra aunque el cruce con FC se use después.
>
> **(2) Modelo (`src/types/models.ts`):**
> ```ts
> // Enriquecimiento biométrico de una sesión (post-hoc, al importar de Samsung)
> export interface BiometriaSesion {
>   fuente: FuenteDato;            // "samsung-health"
>   datauuidSamsung: string;
>   fcMedia?: number; fcMax?: number; fcMin?: number;
>   zonaPrincipal?: ZonaFC;        // derivada de fcMedia vs config/perfiles.{miembro}.zonasFC
>   kcal?: number;
>   matchPor: "custom-id" | "ventana";
>   granularidad: "serie" | "sesion";   // hasta dónde se pudo afinar
> }
> // En SerieRegistro (campos opcionales, se llenan si hay curva):
> //   fcFinSerie?: number; fcPico?: number; recuperacionBpm?: number;
> ```
> Agregá `biometria?: BiometriaSesion` al registro de sesión / `Historial`.
>
> **(3) Parser puro (`src/import/samsungLiveData.ts` + test):** `parsearLiveData(json)` →
> `{ ms: number; fc: number }[]` ordenado por tiempo (filtra muestras sin `heart_rate`).
>
> **(4) Función pura (`src/lib/matchBiometrico.ts` + test):**
> - `elegirSesionSamsung(sesionApp, candidatas)`: de las filas `…exercise` con el `custom_id` de
>   ShapeUp, la que **solapa** la ventana de la sesión de la app (tolerancia ±N min); si hay varias,
>   la de mayor solape. Fallback: si ninguna trae `custom_id`, tipo 0 + mayor solape → `matchPor:"ventana"`.
> - `enriquecerSerie(serie, curva)`: con `inicioMs/finMs` de la serie y la curva,
>   `fcPico` = máx en la ventana, `fcFinSerie` = FC al cierre, `recuperacionBpm` = `fcPico` menos la
>   FC al final del descanso (usando el `inicioMs` de la serie siguiente).
> - **Degradación:** sin curva o sin `inicioMs/finMs` → solo nivel sesión (`fcMedia/zona` de la fila)
>   y `granularidad:"sesion"`. Nunca tira error por falta de datos.
> - `zonaPrincipal` y zonas se derivan del **perfil del miembro** (`config/perfiles`), no de Samsung.
>
> **(5) UI (`src/routes/Salud.tsx` / Historial):** el match fino lee el **zip** del export (para
> acceder a los `live_data.json`); el import por CSV sueltos sigue dando el nivel sesión. Mostrar en
> el detalle de sesión la FC enriquecida (media/zona) y, si hay fino, la FC por serie.
>
> Actualizá `docs/SAMSUNG-HEALTH-MAPEO.md` (sección "match biométrico": llave `custom_id`, formato
> `live_data.json`, regla de ventana + degradación) y `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E6.2 +
> ADR: match por `custom_id` con curva de `live_data.json` y degradación elegante; `inicioMs/finMs`
> por serie como cambio habilitante). JSDoc en lo público. `tsc -b` limpio y tests verdes.
> `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
