# Prompt 22 — E6.1 · Ingesta completa de salud (métricas genéricas)

> Objetivo: poder importar **todo** el export de Samsung Health, no solo peso/cardio/sueño, para
> ir acumulando el historial que va a necesitar el motor de recomendaciones (HRV, FC reposo,
> estrés, pasos, etc.). Hoy esas métricas no tienen dónde caer en el modelo.
>
> **Decisión de diseño (clave): granularidad DIARIA, no datos crudos.** El export trae métricas de
> alta frecuencia (FC continua, etc.) con miles de muestras por día. Volcarlas crudas reventaría
> las cuotas del plan Spark y no aporta: el motor usa **tendencias** (cómo evolucionó tu HRV/sueño/
> estrés por día/semana). Entonces el importador **agrega a un valor por día** (o por noche) antes
> de escribir. Las que ya tienen colección tipada (peso/grasa → `MedicionCorporal`, cardio →
> `SesionCardio`, sueño → `RegistroSueno`) **se quedan como están**; esto cubre solo las que hoy no
> tienen hogar.
>
> **(1) Modelo — agregá a `src/types/models.ts`:**
> ```ts
> // ── Métricas de salud genéricas (señales del motor de recomendaciones) ──
> // Para métricas de Samsung Health SIN colección tipada propia. Granularidad diaria.
> export const TIPOS_METRICA = [
>   "hrv", "fc-reposo", "fc-max-dia", "estres", "pasos", "spo2",
>   "frecuencia-respiratoria", "temperatura-piel",
>   "presion-sistolica", "presion-diastolica",
>   "vo2max", "recovery-hr", "vitality",
> ] as const;
> export type TipoMetrica = typeof TIPOS_METRICA[number];
>
> export type AgregacionMetrica = "dia" | "noche" | "ultimo-del-dia";
>
> export interface MetricaSalud {
>   idMetrica: string;          // `${miembro}-${tipo}-${fecha}` (idempotente por día)
>   miembro: MiembroId;
>   tipo: TipoMetrica;
>   fecha: string;              // "YYYY-MM-DD"
>   valor: number;
>   unidad?: string;            // "ms","bpm","%","pasos","mmHg","ml/kg/min","°C"…
>   agregacion: AgregacionMetrica;
>   payload?: Record<string, unknown>;   // extras crudos (p.ej. bins de HRV)
>   fuente: FuenteDato;
>   datauuid?: string;
>   fechaCreacion?: FirestoreTimestamp;
> }
> ```
>
> **(2) Reglas (`firestore.rules`):** colección `/metricas-salud/{id}`, **personal del miembro**
> (lee/escribe solo lo suyo, mismo patrón que `/mediciones` y `/cardio`).
>
> **(3) Índices (`firestore.indexes.json`):** compuesto `(miembro ASC, tipo ASC, fecha DESC)` para
> consultar tendencias por métrica.
>
> **(4) Importador (`src/import/samsungHealth.ts` + `src/data/salud.ts`):** agregá un modo
> **"importación completa"** además del actual de 3 CSV. Por cada CSV soportado, **agregá a un
> `MetricaSalud` por día** con su regla de agregación, idempotente por `${miembro}-${tipo}-${fecha}`:
>
> | CSV Samsung | tipo | agregación |
> |---|---|---|
> | `tracker.heart_rate` | `fc-reposo` / `fc-max-dia` | mínimo diario (o lectura matinal) / máximo |
> | `health.hrv` | `hrv` | valor por noche (parsear `binning_data`; guardar `payload` con los bins) |
> | `stress` | `estres` | promedio diario del score |
> | `step_daily_trend` | `pasos` | total diario |
> | `oxygen_saturation` | `spo2` | promedio/mínimo diario |
> | `respiratory_rate` | `frecuencia-respiratoria` | por noche |
> | `skin_temperature` | `temperatura-piel` | por noche |
> | `blood_pressure` | `presion-sistolica`/`presion-diastolica` | último del día |
> | `exercise` (vo2_max) | `vo2max` | último del día |
> | `exercise.recovery_heart_rate` | `recovery-hr` | mejor del día |
>
> Mantené las trampas de formato del spec (`docs/SAMSUNG-HEALTH-MAPEO.md`): saltar línea 1, header
> en línea 2, prefijos `com.samsung.health.*`, epoch ms + `time_offset`. **No** escribas muestras
> crudas de alta frecuencia: agregá y descartá. Lógica de agregación en funciones puras con tests.
>
> **(5) UI (`src/routes/Salud.tsx`):** el flujo de import ofrece dos modos —"datos de la app"
> (los 3 de siempre) y "archivo completo" (suma las métricas genéricas)— con el preview de siempre.
> No hace falta mostrar todas las métricas todavía; con guardarlas alcanza (el motor las leerá).
>
> Actualizá `docs/SAMSUNG-HEALTH-MAPEO.md` (sección nueva de métricas genéricas + tabla de arriba)
> y `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E6.1 + ADR: "métricas genéricas diarias en vez de datos
> crudos, por costo Spark y porque el motor usa tendencias"). JSDoc en lo público. `tsc -b` limpio y
> tests verdes. `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
