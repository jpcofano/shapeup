# P66c — Bloque 11 (cambiar el día) + serie H revisada

**Tipo:** documentación. No toca `src/`, `scripts/` ni configuración.
**Precondición:** P66b aplicado (commit `a07130c`).
**Entregables:** bloque 11, reescritura de la sección de serie H, ajustes al bloque 10,
tablas §9 y §11 actualizadas, ADR #030 y #031.

---

## Contexto

Tercera y última tanda de la sesión de diseño. **Todas las decisiones están cerradas.**
Si alguna resulta inviable contra el código, **paralo y reportalo**.

Dos precisiones que aportaste en P66b quedan incorporadas acá:
- El bloque 10.5 apunta a §13.1 por las **dos ramas** de `getProgramaActivo`. P81 arregla
  las dos: el camino principal que lee `config/programaActivo` sin filtrar por estado, y
  el fallback.
- `SerieRegistro` ya guarda `inicioMs`, `finMs`, `fcPico`, `fcFinSerie` y
  `recuperacionBpm`, escritos por el enriquecimiento desde la curva de FC (ADR #025).
  **P86 es superficie, no derivación.** Corregir el texto de 9.4 si sugiere lo contrario.

---

## Tarea 1 — Agregar el bloque 11

Insertar después del bloque 10.

````markdown
## Bloque 11 — Cambiar el día

El caso: hoy tocaba tren inferior y hacés VR, o tren superior, o lo que sea. El sistema
lo registra en vez de pelearse con vos.

### 11.1 Cómo funciona
Desde Home o desde Entrenar, donde dice cuál es la siguiente sesión, un **cambiar**.
Elegís otra rutina del plan, una VR, o una sesión libre. Entrenás normal.

**El plan avanza igual.** La rutina que tocaba no queda trabada adelante: se hace en la
próxima vuelta de la cola. Si la evitás sistemáticamente, eso aparece en los datos en vez
de bloquearte la app.

### 11.2 Qué queda registrado
`rutinaPrevista`, `rutinaRealizada` y un motivo opcional. **Los tres**: sin lo previsto,
el análisis no puede ver el patrón. Con dos meses de datos esto permite decir "cambiaste
tren inferior en seis de diez veces que te tocó", que es información sobre el plan, no
sobre la disciplina de quien entrena.

### 11.3 Adherencia y cobertura
Dos métricas separadas, por la misma razón que racha del plan y días activos:
- **Adherencia** — entrenaste. Cambiar tren inferior por VR la deja intacta.
- **Cobertura del plan** — hiciste lo que el plan pedía. Baja cuando cambiás.

La semana cuenta como cumplida para el contador de carga (bloque 10.3) hayas hecho lo que
hayas hecho. Cualquiera de las dos métricas sola miente; juntas cuentan la historia.

### 11.4 Aviso por esquive repetido
A la **tercera vez** que cambiás la misma rutina, el sistema lo dice. No como reproche:
como señal de que esa rutina probablemente no va más en tu plan. Es el mismo criterio que
el contador de sustituciones del bloque 7.

### 11.5 Descartado explícitamente
Se evaluaron y se rechazaron dos diseños más ambiciosos:
- **Deuda a nivel ejercicio** (el ejercicio salteado pasa al día siguiente). El día
  siguiente casi nunca es el día correcto: arrastrar un empuje al día de piernas rompe el
  split que justifica el programa. Y lo salteado por dolor es precisamente lo que no debe
  reaparecer mañana.
- **Cajón de pendientes con caducidad.** Consecuencia del anterior; sin deuda a nivel
  ejercicio no tiene razón de existir.

Dentro de la sesión sigue habiendo dos herramientas para el mismo problema: **sustituir**
(bloque 3) cambia un ejercicio por otro el mismo día, y **saltar** (bloque 1) lo descarta
registrando el motivo.
````

## Tarea 2 — Reescribir la sección de serie H

`CLAUDE.md` tiene hoy una sección "Serie H — Sync automático de salud (no arrancada —
2026-07-17)" que dice que no hay plan de H1 todavía. Mientras tanto,
`docs/prompts/61-h0-plan-serie-h.md` contiene un plan completo —cascarón Capacitor, APK
directo, sync al abrir— **que nunca se aplicó**: sus ADR #026–#029 no están en el
registro, y los números ya fueron usados por P66 y P66b.

**Decisión: el plan de P61 queda como antecedente, no como plan vigente.** Reemplazar la
sección de `CLAUDE.md` por lo siguiente, y anotar en el propio P61 que fue superado.

````markdown
## Serie H — Sync automático de salud (plan vigente desde P66c)

Objetivo: que la biometría entre sin exportar el ZIP a mano.

### Qué cambió respecto del plan de P61
P61 asumía que la única vía era leer Health Connect desde un cascarón nativo, y que el
proyecto seguía en Spark sin backend. Dos cosas cambiaron:

- **Health Sync (versión paga) está instalado y exporta a Google Drive**: datos de salud
  como CSV y actividades como FIT/TCX/GPX/CSV, automáticamente en segundo plano. Eso
  abre un camino que no requiere APK: la PWA lee la carpeta.
- **Blaze habilitado**, con alertas de presupuesto. El uso a esta escala cae en el nivel
  gratuito, así que el costo esperado es cero, pero deja de ser cierto que no puede haber
  una function.

### Caminos evaluados

**A — Puente por Drive (recomendado).** Health Sync escribe, ShapeUp lee al abrir,
procesa lo nuevo y marca lo procesado. Sin APK, sin entorno Android, y las APIs de Google
funcionan desde el navegador. Dos riesgos a confirmar antes de comprometerse:
- Con la app OAuth en estado **Testing**, Google revoca los refresh tokens **a los 7
  días**, se use o no. Reautorizar cada semana sería peor que exportar el ZIP. La salida
  es publicar la app; para uso personal Google contempla excepciones a la verificación,
  con pantalla de advertencia.
- Leer archivos creados por otra app requiere `drive.readonly`, que Google clasifica como
  **alcance restringido**; su verificación puede escalar a una auditoría de seguridad.
  Verificar en la consola qué exige hoy para este caso.

**B — Intervals.icu.** Health Sync también sincroniza ahí. Autenticación por clave
personal (básica), expone actividades y wellness —FC de reposo, HRV, peso, pasos— y
webhooks. Auth trivial comparada con Google. Riesgo probable: **CORS** desde el
navegador, que obligaría a un proxy en una function — ahora posible con Blaze, pero es
infraestructura nueva.

**C — Cascarón Capacitor** (el plan de P61). Lee Health Connect directo, con token de
cambios para sync incremental. El camino correcto a largo plazo y el más caro: APK,
entorno Android, capa nativa que mantener. Queda como plan C, intacto.

### H1′ — Spike sin código (primero, y bloquea todo lo demás)
Configurar el export de Health Sync a Drive y dejarlo correr **un día que incluya una
sesión de fuerza, una de VR y una noche de sueño**. Después auditar los archivos. Lo que
hay que responder:

1. **¿Viene la curva de FC por sesión?** Hoy sale de `live_data.json` dentro del ZIP,
   indexada por `datauuid`, ~1 muestra por segundo. De ahí sale todo el enriquecimiento
   biométrico, y `recuperacionBpm` por serie con él. Un FIT debería transportar algo
   equivalente; hay que confirmarlo.
2. **¿Hay identificador estable por registro?** El `datauuid` de Samsung probablemente no
   viaje por esta vía.
3. **¿Cada cuánto escribe?**
4. **¿Trae FC de reposo y HRV?** `docs/SAMSUNG-HEALTH-MAPEO.md` registra que `fc-reposo`
   **no tiene fuente en el export del ZIP** (verificado en P56): `tracker.heart_rate` es
   un agregado esporádico, no reposo real. Health Connect sí tiene un tipo dedicado. Si
   esta vía lo trae, la serie H no solo saca un paso manual: **destraba un dato hoy
   imposible**, y con él la señal que puede adelantar la descarga del bloque 10.3.

Salida: reporte de auditoría (gitignored, como los demás). Sin escribir nada a Firestore
en esta fase.

### Riesgo central: idempotencia por dos vías
El bloque 5 deriva el id de una entrada externa del `datauuid` de Samsung. Si el mismo
entrenamiento llega por ZIP y por Drive y el identificador no viaja, se generan dos
entradas distintas para el mismo hecho. **La clave determinista compartida hay que
definirla con los archivos del spike a la vista**, no antes — y ambas vías deben producir
exactamente el mismo id. El import por ZIP no se elimina: queda como respaldo y para la
historia previa.

### Regla heredada de la serie S
Todo timestamp en epoch ms UTC; conversión a local solo al mostrar. Los bugs de zona
horaria fueron el enemigo número uno de la serie S.
````

## Tarea 3 — Dos ajustes al bloque 10

**3.1 — Primera semana parcial.** Si un ciclo arranca un jueves, esa semana sale
incompleta por definición. No cuenta para el contador de semanas de carga; el ciclo
empieza a contar el lunes siguiente.

**3.2 — La descarga mira la cobertura antes de hablar.** Si venís cumpliendo el 75% pero
cambiando la mitad de los días (bloque 11), el mensaje no es "te toca descargar" sino que
quizá el problema no es la fatiga sino el plan. Mismo cálculo, distinto mensaje.

## Tarea 4 — Actualizar tablas

**§9, cambios de modelo** — agregar:

| Campo | Bloque |
|---|---|
| `Historial.rutinaPrevista?` + `motivoCambio?` | 11 |
| Cobertura del plan como métrica derivada, separada de adherencia | 11 |

**§11, orden de prompts** — agregar:

| Prompt | Contenido | Depende de |
|---|---|---|
| P87 | Bloque 11 — cambiar el día, registro previsto/realizado, cobertura, aviso al tercer esquive | P82 |
| P88 | H1′ — spike del puente Drive, sin código en la app | — |
| P89 | H2 — adaptador Health Sync → tipos de entrada existentes | P88 |
| P90 | H3 — lectura de Drive, sync al abrir, idempotencia de doble vía | P89 |

Y corregir la fila de P86: es superficie sobre `recuperacionBpm` ya calculado, no
derivación desde la curva.

## Tarea 5 — Registrar dos ADRs

**ADR #030 — Cambiar el día no genera deuda**

- *Contexto:* con la cola del ADR #029, cambiar la rutina de un día podía resolverse
  trabando la rutina prevista adelante, arrastrando ejercicios sueltos al día siguiente, o
  manteniendo un cajón de pendientes.
- *Decisión:* el plan avanza. Se registran `rutinaPrevista`, `rutinaRealizada` y motivo, y
  se miden adherencia y cobertura por separado. Sin deuda a nivel ejercicio ni pendientes.
- *Consecuencia:* el patrón de esquive queda en los datos y alimenta el análisis, en vez
  de trabar la app. A la tercera repetición sobre la misma rutina, el sistema lo señala.

**ADR #031 — La serie H arranca por puente de archivos, no por cascarón nativo**

- *Contexto:* P61 propuso Capacitor + Health Connect asumiendo Spark y sin backend. Hoy
  hay Health Sync pago exportando a Drive en segundo plano, y Blaze habilitado con
  presupuesto controlado.
- *Decisión:* el camino primario es leer los archivos que Health Sync deja en Drive desde
  la PWA. Plan B es Intervals.icu vía proxy en function; plan C es el cascarón de P61, que
  queda como antecedente y no como plan vigente. Ningún diseño de adaptador se compromete
  antes del reporte de H1′.
- *Consecuencia:* la premisa "sin backend, proyecto en Spark" de P61 queda revisada. Los
  números de ADR que P61 proponía (#026–#029) nunca se registraron y hoy están ocupados
  por P66 y P66b — P61 no debe re-aplicarse tal cual.

---

## Criterios de aceptación

- Bloque 11 agregado; sección de serie H de `CLAUDE.md` reemplazada; P61 anotado como
  superado.
- Ajustes 3.1 y 3.2 aplicados en el bloque 10; texto de 9.4 corregido si sugiere que la
  recuperación hay que derivarla.
- Tablas §9 y §11 actualizadas sin perder filas.
- ADRs #030 y #031 registrados en §5 de `MAPEO-IMPLEMENTACION.md`.
- No se modifica nada fuera de `docs/` y `CLAUDE.md`.
- Commit: `docs(plan): bloque 11 + serie H revisada + ADR #030/#031 (P66c)`
