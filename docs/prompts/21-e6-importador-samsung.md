# Prompt 21 — E6 · Importador de Samsung Health (CSV)

> Implementá el importador del módulo de Salud siguiendo el spec **`docs/SAMSUNG-HEALTH-MAPEO.md`**
> (mapeo columna→campo, transformaciones y unidades ya resueltos ahí).
>
> (1) `src/data/salud.ts` con el patrón de la forma de trabajo (caché, `Result<T>`,
> `serverTimestamp`) para `MedicionCorporal` (`/mediciones`), `SesionCardio` (`/cardio`) y
> `RegistroSueno` (`/sueno`), todas **personales del miembro** (privadas por reglas).
> (2) `src/import/samsungHealth.ts` (lógica **pura**, con `.test.ts`): parsea un CSV de Samsung
> Health a los tipos del modelo. Ojo con los detalles del spec: **saltear la línea 1 (metadata),
> encabezado en la línea 2**; columnas prefijadas `com.samsung.health.*`; timestamps en epoch ms
> + `time_offset`; `duration` en ms, `distance` en metros, `sleep_duration` en minutos. Calcular
> `imc` (peso/altura²) y derivar `zonaPrincipal` comparando `mean_heart_rate` contra
> `config/perfiles.{miembro}.zonasFC`. Idempotencia por `datauuid`.
> (3) Pantalla de importación: subir archivo(s), elegir **cuáles CSV** importar
> (weight/exercise/sleep — no tragarse los ~60), parsear **en el cliente** y previsualizar antes
> de escribir. Carga manual como respaldo.
> (4) Pantalla de progreso (peso, grasa y tonelaje en el tiempo).
> (5) El motor de recomendaciones queda para después, pero las señales ya están confirmadas en el
> doc (sección 4); no lo implementes ahora.
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E6 + Estado + Mapa). JSDoc en lo
> público. `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
