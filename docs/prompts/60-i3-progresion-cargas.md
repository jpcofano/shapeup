# Prompt 60 — I3 · Progresión de cargas (doble progresión, cierra la serie I)

> **Código + tests.** Serie I, tercer y último insight. A diferencia de I1/I2,
> este NO depende de datos de salud: lee tus propias series (reps × peso) del
> historial — tiene materia prima desde el día uno. Y a diferencia de I1/I2,
> toca el flujo de **entrenar**, así que el alcance es contenido a propósito:
> sugerir, nunca imponer ni autocompletar sin gesto del usuario.
>
> **ANTES de escribir código**: auditá el modelo real y reportá en el commit —
> qué campos tiene `SerieRegistro` (¿reps?, ¿pesoKg?, ¿RIR o esfuerzo?), cómo es
> la prescripción de un ejercicio de fuerza (¿repsMin/repsMax?, ¿reps fijas?,
> ¿peso prescripto?), y dónde vive el flujo de arrancar un ejercicio en
> `EntrenarSesion`. Las reglas de abajo están escritas asumiendo rango de reps;
> si el modelo tiene reps fijas, adaptá la regla A a "todas las series al
> objetivo" y anotalo.
>
> **Decisiones del owner (no re-discutir):**
> - Doble progresión clásica: primero reps hasta el techo del rango, después
>   peso (y las reps vuelven al piso).
> - La sugerencia es una **propuesta visible con un tap para aplicar** — jamás
>   se autocompleta sola, jamás bloquea registrar otra cosa.
> - Silencio sin historia (coherente con I2): sin sesiones previas del
>   ejercicio, no hay sugerencia — la prescripción de la rutina manda.
> - Igual que siempre: comparación contra uno mismo; los miembros juveniles ven
>   la misma feature (es entrenamiento estándar), con incrementos conservadores.

## (1) Núcleo puro — `src/lib/progresion.ts`

```ts
export type TipoSugerencia = "subir-peso" | "subir-reps" | "repetir" | "bajar-peso";

export interface SugerenciaProgresion {
  tipo: TipoSugerencia;
  pesoKg?: number;             // peso sugerido para la próxima
  repsObjetivo?: number;
  motivo: string;              // "Completaste 3×12 con 10 kg — probá 12 kg"
  basadoEnFecha: string;       // última sesión que fundamenta
}

export function sugerirProgresion(
  idEjercicio: string,
  historial: Historial[],      // del miembro
  prescripcion: PrescripcionEjercicio,  // el tipo real que tenga el modelo
  incrementoKg?: number,       // default abajo
): SugerenciaProgresion | null
```

Reglas (en orden):
- **A · subir-peso**: en la última sesión del ejercicio, TODAS las series
  completadas al techo del rango de reps (o al objetivo, si es fijo) →
  sugerir `peso + incremento`, reps al piso del rango.
- **B · bajar-peso**: dos sesiones seguidas sin llegar al piso del rango en
  ≥ la mitad de las series → sugerir `peso − incremento` («consolidá antes de
  volver a subir»).
- **C · subir-reps**: completó todo pero sin llegar al techo → mismo peso,
  objetivo = mejor serie + 1 rep.
- **D · repetir**: cualquier otro caso con historia → mismo esquema, motivo
  «te faltó poco en la última».
- `null`: sin sesiones previas del ejercicio, o el ejercicio no usa peso
  (isométricos, VR, cardio — detectalo por la prescripción, no por nombre).
- **Incremento**: default 2 kg; si la última carga fue < 10 kg, 1 kg
  (mancuernas livianas, típico de los juveniles y accesorios). Exportá la
  función `incrementoPara(pesoKg)` con estos umbrales para testearla sola.
- Series de calentamiento: si el modelo las distingue, excluilas; si no,
  usá todas y anotalo como limitación conocida.
- Tests: cada regla con su caso de borde (techo exacto, piso exacto, mitad de
  series), fixed-reps si aplica, incrementos 1/2 kg, ejercicio sin peso → null,
  sin historia → null, y que el motivo contenga los números reales.

## (2) `EntrenarSesion` — la sugerencia en contexto

Al entrar a un ejercicio de fuerza con sugerencia disponible: una línea
compacta arriba de las series — «💡 12 kg × 10 (completaste 3×12 con 10 kg el
29/06)» — con acción **"Usar"** que precarga peso/reps objetivo de las series
pendientes de ese ejercicio. Sin "Usar", todo sigue exactamente como hoy.
Descartable con ✕ (solo por esa sesión, estado local — no persistir nada).

## (3) `RutinaDetalle` — vista previa opcional

En la lista de ejercicios de la rutina, un indicador mínimo (ícono/flechita)
en los que tienen sugerencia de subir peso — para que el owner sepa antes de
arrancar que hoy toca progresar. Tap muestra el motivo. Si ensucia la lista,
mejor no lo pongas y anotá por qué (criterio: la lista tiene que seguir
leyéndose limpia).

## (4) Verificación

- `tsc -b` limpio · vitest verde (y confirmá de paso el conteo total — entre
  I1 e I2 bajó de 548 a 520 y queremos saber si fue la QA temporal o se cayó
  una suite) · commit + push.
- Con datos reales: el owner tiene la Fuerza A del 29/06 con series 8×10kg,
  10×10kg — al abrir esa rutina para entrenar, debería ver una sugerencia
  concreta. Verificá el caso real en QA con esos números.
- `MAPEO-IMPLEMENTACION.md` + tilde I3 en `CLAUDE.md` → **serie I completa**;
  anotá que lo próximo es la serie H (conversación de arquitectura primero).
- Commit: `feat(entrenar): progresión de cargas por doble progresión (I3)`.
