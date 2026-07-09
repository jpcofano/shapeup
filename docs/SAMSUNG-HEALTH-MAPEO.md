# ShapeUp — Mapeo Samsung Health → modelo (importador E6)

Spec para el importador del módulo de Salud. Basado en un export real de Samsung Health
(`Ajustes → Descargar datos personales`), que entrega ~60 CSV. El importador **no** necesita
todos: solo `weight`, `exercise` y `sleep` para los tipos del modelo; el resto alimenta señales.

## Formato de los CSV (clave)
- **Línea 1 = metadata** (`com.samsung.health.weight,6320001,12` = paquete, versión, nº columnas).
  **Saltearla.** El **encabezado real es la línea 2**; los datos arrancan en la línea 3.
- Algunas columnas vienen **prefijadas**: `com.samsung.health.exercise.*`,
  `com.samsung.health.heart_rate.*`. Hay que matchear por el sufijo.
- **Timestamps** (`start_time`, `end_time`, `create_time`):
  - **Formato antiguo** (pre-2024): epoch en **milisegundos** (ej. `1710488400000`).
  - **Formato nuevo** (2024+): datetime string local `"YYYY-MM-DD HH:MM:SS.mmm"` (ej. `"2024-03-15 08:30:00.000"`). El parser detecta el formato automáticamente.
  - `time_offset` (ej. `UTC-0300`, `+09:00`) solo aplica al formato epoch ms; en datetime string la hora ya es local.
- **Unidades:** `duration` en **ms**, `distance` en **metros**, `sleep_duration` en **minutos**.

## Detección de archivos en el ZIP (2025+)
Samsung Health exporta ~90 CSVs por export. Hay sub-tipos con nombres similares al principal:

| Archivo principal | Sub-tipos a ignorar |
|---|---|
| `com.samsung.shealth.exercise.TIMESTAMP.csv` | `exercise.recovery_heart_rate`, `exercise.custom_exercise`, `exercise.route`, `exercise.weather`, etc. |
| `com.samsung.shealth.sleep.TIMESTAMP.csv` | `sleep_stage`, `sleep_combined`, `sleep_data`, `sleep_raw_data`, `sleep_snoring`, etc. |
| `com.samsung.health.weight.TIMESTAMP.csv` | (sin sub-tipos ambiguos) |

El importador usa **regex exactos** para detectar el archivo principal (sin sub-tipo entre el nombre y el timestamp). Los JSON internos (ej. `*blob.value.json`) se ignoran: solo se indexan `.csv`.

## 1) `com.samsung.health.weight` → `MedicionCorporal`
Una fila por medición (báscula/manual).

| Columna Samsung | Campo modelo | Transformación |
|---|---|---|
| `weight` | `pesoKg` | directo |
| `body_fat` | `grasaPct` | porcentaje |
| `body_fat_mass` | `masaGrasaKg` | kg |
| `muscle_mass` | `masaMuscularKg` | kg |
| `total_body_water` | `aguaPct` | verificar si viene % o kg |
| `weight` + `height` | `imc` | `peso / (altura_m)²` (altura viene en cm) |
| `start_time` (+ `time_offset`) | `fecha` | epoch ms → `YYYY-MM-DD` |
| — | `fuente` | `"samsung-health-csv"` |

Extra sin campo en el modelo (opcional, útil a futuro): `basal_metabolic_rate`, `vfa_level`
(grasa visceral), `skeletal_muscle_mass`, `fat_free_mass`.

## 2) `com.samsung.shealth.exercise` → `SesionCardio`
Una fila por sesión de ejercicio.

| Columna Samsung | Campo modelo | Transformación |
|---|---|---|
| `…exercise.exercise_type` | `actividad` | código numérico → nombre (tabla de tipos de Samsung) |
| `title` | `actividad` | si está, usar el título libre |
| `…exercise.duration` | `duracionMin` | ms → min (`/60000`) |
| `…exercise.calorie` (o `total_calorie`) | `kcal` | directo |
| `…exercise.mean_heart_rate` | `fcPromedio` | directo |
| `…exercise.max_heart_rate` | `fcMaxima` | directo |
| `…exercise.distance` | `distanciaKm` | m → km (`/1000`) |
| `…exercise.start_time` | `fecha` | epoch → fecha |
| `mean_heart_rate` vs zonas del perfil | `zonaPrincipal` | **derivar** comparando FC media contra `config/perfiles.{miembro}.zonasFC` |
| — | `esVR` | no viene en Samsung → default `false`; inferir por título o que lo marque el usuario |
| — | `fuente` | `"samsung-health-csv"` |

Nota VR: los juegos no se distinguen solos (entran como tipo genérico). El importador puede
ofrecer marcar `esVR` por título, o el usuario lo tagea. La `zonaPrincipal` sale gratis ahora
que sembramos las zonas por miembro en `config/perfiles`.

## 3) `com.samsung.shealth.sleep` → `RegistroSueno`
| Columna Samsung | Campo modelo | Transformación |
|---|---|---|
| `sleep_duration` | `horas` | min → h (`/60`) |
| `original_bed_time` (o `…sleep.start_time`) | `horaAcostarse` | epoch → `HH:MM` |
| `…sleep.start_time` | `fecha` | epoch → fecha |
| — | `fuente` | `"samsung-health-csv"` |

Extra (no en el modelo, útil para señal de recuperación): `sleep_score`, `efficiency`,
`total_rem_duration`, `total_light_duration`.

## 4) Métricas genéricas → `MetricaSalud` (E6.1)

Para métricas sin colección tipada propia. **Granularidad diaria** — no se guardan muestras crudas (ver ADR #016).

| CSV Samsung | `TipoMetrica` | Agregación | Unidad |
|---|---|---|---|
| `tracker.heart_rate` | `fc-media-dia` / `fc-max-dia` | promedio / máximo diario | bpm |
| `health.hrv` | `hrv` | valor por noche (+ `payload` con bins) | ms |
| `stress` | `estres` | promedio diario del score | — |
| `step_daily_trend` | `pasos` | total diario | pasos |
| `oxygen_saturation` | `spo2` | promedio diario | % |
| `respiratory_rate` | `frecuencia-respiratoria` | promedio por noche | rpm |
| `skin_temperature` | `temperatura-piel` | promedio por noche | °C |
| `blood_pressure` | `presion-sistolica` / `presion-diastolica` | último del día | mmHg |
| `vitality` | `vitality` | promedio diario | — |

`idMetrica = ${miembro}-${tipo}-${fecha}` → idempotente por día. Colección Firestore: `/metricas-salud`.

## 5) Señales del motor de recomendaciones — disponibilidad confirmada
El export confirma que **el set propuesto (`SENALES_SALUD`) es 100% obtenible**. Fuente de cada una:

| Señal (`SenalSalud`) | Fuente | Nota |
|---|---|---|
| `sueño` | `sleep.sleep_duration` / `sleep_score` | directo |
| `fc-reposo` | **sin fuente en este export** (verificado, S-fix-b P56) | `tracker.heart_rate` es agregado esporádico, no reposo real — `fc-reposo` queda honestamente sin datos hasta que el export traiga `resting_heart_rate` o equivalente |
| `hrv` | `health.hrv.binning_data` | **requiere parsear** `binning_data` (estructura serializada, no un número plano) |
| `tendencia-peso` | `weight.weight` | serie temporal |
| `tendencia-grasa` | `weight.body_fat` | serie temporal |
| `rpe-sesiones` | Historial propio de ShapeUp | no es de Samsung |
| `adherencia` | Historial + `step_daily_trend.count` | sesiones hechas vs programadas + pasos |
| `tonelaje` | Historial propio de ShapeUp | derivado de las series registradas |

**Bonus disponibles** por si el motor quiere más señales: `stress.score`, recovery HR
(`exercise.recovery_heart_rate.heart_rate`), SpO2, frecuencia respiratoria, temperatura de piel,
presión arterial, `vitality_score`.

**Decisión:** mantener las 8 señales propuestas (todas las medidas externamente están cubiertas).
El `hrv` es la única con costo de parseo extra; si molesta al principio, se puede diferir y
arrancar el motor con las otras 7.

## 7) Importación zip-first (E6.3)

### Por qué ZIP y no carpeta

Los navegadores móviles (Chrome/Firefox Android) **no implementan** `showDirectoryPicker`. Abrir una carpeta con >2300 archivos cuelga el navegador. El ZIP del export de Samsung es la única opción viable para un import one-shot en PWA. No se usa File System Access API en móvil.

### Estructura del ZIP verificada

```
samsunghealth_<user>_<timestamp>/
  com.samsung.health.weight.<date>.csv
  com.samsung.shealth.exercise.<date>.csv
  com.samsung.shealth.exercise.custom_exercise.<date>.csv   ← custom_id de ShapeUp
  com.samsung.shealth.sleep.<date>.csv
  tracker.heart_rate.<date>.csv
  health.hrv.<date>.csv
  stress.<date>.csv
  step_daily_trend.<date>.csv
  … (~60 CSV en raíz)
  files/
  jsons/
    com.samsung.shealth.exercise/
      <letra>/
        <datauuid>.com.samsung.health.exercise.live_data.json
```

### Extracción selectiva

`JSZip.loadAsync(file)` lee el índice del zip sin descomprimir todo. Se leen solo los archivos necesarios según el nivel:

| Nivel | Qué se extrae |
|---|---|
| Básico | weight + exercise + sleep CSV |
| Completo | + métricas genéricas (~8 CSV) |
| Con biometría | + custom_exercise CSV (custom_id) + live_data.json de sesiones ShapeUp |

Los `live_data.json` solo se leen para sesiones que coincidan (por `datauuid` presente en el CSV exercise), no todos los ~2300 archivos.

### Validación del ZIP

Se verifica la presencia de al menos un CSV de Samsung (`com.samsung.health.weight`, `com.samsung.shealth.exercise` o `com.samsung.shealth.sleep`) antes de proceder. Si el ZIP no es un export de Samsung, se muestra un mensaje claro.

---

## 6) Match biométrico — FC por sesión y por serie (E6.2)

### Identificación de la sesión ShapeUp en Samsung

Samsung Health identifica las sesiones de tipo personalizado con un `custom_id` por dispositivo. El flujo es:

1. En `com.samsung.shealth.exercise.custom_exercise` encontrar la fila con `custom_name = "ShapeUp"` → guardar su `custom_id` (ej. `mq1mz4gd_gq`, **no hardcodear** — depende del dispositivo).
2. En `com.samsung.shealth.exercise`, las filas con ese `custom_id` son las sesiones ShapeUp. El campo `title` viene vacío; **la llave es `custom_id`**, no el título.
3. La fila trae `start_time`/`end_time` (string local + `time_offset`), `mean/max/min_heart_rate`, `duration` (ms), `datauuid`.

### Curva fina (live_data.json)

Solo disponible en el ZIP completo del export (no en CSVs sueltos).

- Ruta dentro del ZIP: `jsons/com.samsung.shealth.exercise/<datauuid>.live_data.json`
- Formato: array de `{ "heart_rate": 99.0, "start_time": 1780356821758 }` (~1 muestra/seg, epoch ms, mismo reloj que la fila exercise).
- Parser: `src/import/samsungLiveData.ts` → `parsearLiveData(json)` → `{ ms, fc }[]` ordenado.

### Algoritmo de match

**Por custom_id (preferido):** filtrar candidatas con el `custom_id` de ShapeUp → elegir la de mayor solapamiento con la ventana de la sesión app (±5 min tolerancia). `matchPor: "custom-id"`.

**Fallback por ventana:** si ninguna trae `custom_id`, buscar máximo solapamiento entre todas → `matchPor: "ventana"`.

### Regla de degradación

| Disponibilidad | Resultado |
|---|---|
| Curva + `inicioMs/finMs` por serie | `granularidad: "serie"` con `fcPico/fcFinSerie/recuperacionBpm` |
| Sin curva, solo fila exercise | `granularidad: "sesion"` con `fcMedia/zona/kcal` |
| Sin match Samsung | `biometria` ausente en `Historial` |

Nunca se lanza error por falta de datos — degradación explícita.

### Timestamps por serie (cambio habilitante)

`SerieRegistro` ahora tiene `inicioMs` (sellado en `saltarDescanso`) y `finMs` (sellado en `completarSerie`). Sin estos campos el match fino no es posible, pero el cruce a nivel sesión sigue funcionando.

### Zona FC

`zonaPrincipal` se deriva de `fcMedia` contra `config/perfiles.{miembro}.zonasFC`, **no** de Samsung. Así la interpretación usa los umbrales personalizados del miembro.

---

## Notas de implementación / privacidad
- El export pesa ~150 MB y trae ~60 CSV. El importador debe dejar al usuario **elegir los CSV
  relevantes** (weight/exercise/sleep), no tragarse todo.
- Parsear **en el cliente** y escribir a las colecciones personales del miembro
  (`/mediciones`, `/cardio`, `/sueno`); son privadas por las reglas. El archivo de salud no se
  sube al repo ni a un servidor.
- Idempotencia: usar `datauuid` de cada fila como id (o parte del id) para no duplicar al
  reimportar.
