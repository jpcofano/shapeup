# Análisis asistido — diseño

Estado (01/10/2026):

- **El análisis de una sesión está construido** (P93, commit `600aa37`). Vigentes: el prompt
  **v3** (`docs/analisis/prompt-sesion-v3.md`) y el esquema **2**. La regla es el **ADR #044** en
  `CLAUDE.md`. El JSON de ejemplo y la descripción del prompt de más abajo son los del diseño
  original (esquema 1, prompt v1); lo vigente está en el código y en `docs/analisis/`.
- **Lo que sigue** está en la sección «Marcas y análisis en dos capas (P99) y análisis general
  (P94)»: marcas que calcula la app, un análisis de sesión que las comenta, y el análisis general
  con focos. El orden es P97 → P98 → P99 → P94.
- Las tres decisiones abiertas del diseño original quedaron cerradas en P93 (ver al final). Las que
  siguen abiertas para P99 están en el §8 de la sección nueva.

## La idea

La app arma un paquete con los datos de una sesión, vos lo pegás en un chat, y el JSON que
vuelve se carga en la app y queda guardado junto a esa sesión. Lo mismo, más arriba, para un
análisis global de varias semanas.

Sin claves de API, sin servidor, sin costo. Vos sos el transporte.

## El reparto de fuentes

Es el principio del Bloque 9 del roadmap, aplicado al análisis:

| | Qué aporta |
|---|---|
| **ShapeUp** | Qué ejercicio, cuántas series, con cuánta carga, cuántas reps, qué RIR, a qué hora empezó y terminó cada serie, qué se sustituyó y por qué, qué decía el plan |
| **Samsung Health** | Lo fisiológico: duración medida, calorías, FC media y máxima, minutos por zona, la curva |
| **El análisis** | El cruce, que es lo único que ninguna de las dos puede hacer sola |

## Lo que podemos mejorar sobre Health

Health reparte los minutos por zona **de toda la sesión**. Nosotros sabemos a qué ejercicio
pertenece cada minuto, así que podemos dar, y ninguna de las dos apps lo hace hoy:

- **minutos por zona por ejercicio** — en qué parte de la sesión estuviste realmente arriba;
- **FC media y pico por serie**, que ya se calculan;
- **recuperación entre series**, cuánto baja la FC en el descanso;
- **densidad real**: tiempo de trabajo contra descanso efectivamente tomado;
- **deriva cardíaca**: FC media de la primera mitad contra la segunda **a igual carga**. Si
  sube con el mismo peso, la sesión te costó más de lo que parece.

## El flujo

1. En el detalle de la sesión, **"Preparar análisis"** → copia al portapapeles el prompt con
   los datos, o lo baja como archivo si es grande.
2. Lo pegás en un chat.
3. El chat devuelve **solo un JSON**.
4. En la app, **"Cargar análisis"** → lo pegás o subís el archivo.
5. La app **valida** antes de guardar nada. Si no valida, dice qué está mal y no guarda.

## El paquete que sale

Tres niveles, en este orden, porque así se lee:

**Sesión** — fecha, rutina, lugar, duración de la app, duración medida, calorías, FC media y
máxima, minutos por zona, RPE y sensación si están.

**Por ejercicio** — nombre, modalidad, y por serie: reps, carga, RIR, duración, descanso real,
FC media, FC pico, recuperación. Más los minutos por zona de ese ejercicio.

**Contexto**, sin el cual el análisis es genérico — las últimas 5 sesiones del mismo ejercicio
con su carga y reps, la meta semanal y cómo viene la semana, y del perfil: edad, FC máxima,
zonas y objetivo.

**La curva va submuestreada a un punto cada 30 segundos.** Cruda son miles de números y no
entra en un chat; a 30 segundos, una sesión de 50 minutos son unos 100 valores y alcanza para
ver la forma: dónde subió, dónde se recuperó, si derivó.

**Tope de tamaño: 60 KB.** El exportador muestra cuánto ocupa antes de copiar. Si se pasa,
recorta el contexto primero y la curva después, y **avisa qué recortó**.

## El JSON que vuelve

```json
{
  "version": 1,
  "tipo": "sesion",
  "idHist": "H-20260926-…",
  "generadoEn": "2026-09-26",
  "modelo": "lo que el chat diga de sí mismo",
  "resumen": "dos a cuatro frases",
  "hallazgos": [
    {
      "tema": "densidad",
      "detalle": "…",
      "evidencia": "descanso real 95 s contra 60 prescriptos, en 4 de 5 series",
      "confianza": "alta"
    }
  ],
  "sugerencias": [
    { "accion": "…", "porque": "…", "cuando": "proxima-sesion" }
  ],
  "banderas": [
    { "tipo": "dato-dudoso", "detalle": "…" }
  ],
  "preguntas": ["…"]
}
```

**`evidencia` es obligatorio en cada hallazgo, y es la pieza central del diseño.** Obliga a
que cada afirmación se apoye en un número que está en el paquete, y le permite a la app
mostrarlo al lado. Un hallazgo sin evidencia no se guarda.

`confianza` es del que analiza, no de la app.

`banderas` es para lo que el análisis ve raro: un dato dudoso, una inconsistencia, algo que
merece mirarse. **No es un diagnóstico** (ver más abajo).

## Validación, antes de guardar

- El esquema completo, con tipos.
- **`idHist` tiene que coincidir con la sesión donde lo estás cargando.** Es el error más
  fácil de cometer —pegar el análisis de otra sesión— y el más difícil de notar después.
- Topes de largo por campo, y máximo de hallazgos y sugerencias, para que no se vuelva un
  ensayo.
- Todo hallazgo con su `evidencia`.
- El JSON es **dato externo**: se escapa al mostrarlo, nunca se ejecuta, y no puede escribir
  en ningún campo medido.

## La regla que no se negocia

> **Lo medido y lo interpretado no se mezclan.**

El análisis vive en su propio campo, se muestra etiquetado como interpretación y con su fecha,
y **nunca alimenta la racha, la adherencia, el tonelaje, la progresión ni la meta**. Si un
análisis dice que una sesión fue floja, eso no puede mover un número medido.

Va como ADR, en la misma familia que el aislamiento por tipo (P74) y que "el sistema decide
solo con lo que mide" (P79).

**Y no es consejo médico.** El prompt lo dice explícitamente: si algo parece una señal de
salud, va como bandera para consultar con un profesional, nunca como diagnóstico ni como
indicación. Es un dato más que el proyecto trata con el mismo cuidado que los demás.

## El prompt

Versionado en el repo, en `docs/analisis/prompt-sesion-v1.md`, y el número de versión viaja en
el paquete. Dentro de tres meses tiene que poderse saber con qué se generó cada análisis.

Tiene que decir, en este orden:

1. **Quién entrena**: edad, nivel, objetivo, FC máxima y zonas.
2. **De dónde sale cada dato** y qué significa cada campo, para que no se malinterprete.
3. **El reparto**: ShapeUp dice qué se hizo, Samsung dice cuánto costó.
4. **Qué se espera**: hallazgos con evidencia, sugerencias accionables, banderas.
5. **Las advertencias del propio dato**: la FC de muñeca en boxeo y juegos de ritmo es poco
   confiable (§9.3 del roadmap), y las calorías en actividades de brazos vienen infladas
   (§9.5). Si el análisis no lo sabe, va a sacar conclusiones sobre ruido.
6. **Las reglas**: no inventar; cada hallazgo cita un número del paquete; si el dato no alcanza
   para una conclusión, **decirlo en vez de estirarlo**; nada de consejo médico.
7. **La salida**: solo el JSON, sin texto alrededor.

## El análisis global

Mismo mecanismo, otro alcance. `tipo: "global"`, sobre un rango de semanas.

El paquete **no lleva las sesiones enteras**: lleva un agregado — adherencia por semana,
tonelaje por grupo muscular, minutos por zona por semana, PR, sustituciones repetidas,
progresión de VR, peso y sueño si están. Y la pregunta cambia: no es "cómo estuvo esta
sesión" sino "qué está pasando y qué conviene cambiar".

Se guarda aparte, no colgando de una sesión.

## Dónde se guarda

- Sesión: un campo `analisis` en el documento de `/historial`.
- Global: una colección propia, por miembro y por rango.
- En los dos casos se guarda **qué versión de prompt y de esquema** se usó.

## Marcas y análisis en dos capas (P99) y análisis general (P94)

_Integrado el 01/10/2026 desde `docs/plan-marcas-y-analisis.md`, que se borró. Las decisiones están
copiadas tal cual; la pantalla (§6) sigue siendo una propuesta._

Decisiones del chat del 30/09 sobre cómo el análisis deja de ser solo un texto largo y pasa a **marcar la sesión**. Este plan es la base de **P99** (marcas y análisis de sesión) y del diseño de **P94** (análisis general). No es un prompt para Code: los prompts salen de acá.

### 1 · El objetivo

Hoy el análisis de una sesión es un detalle largo que se pega y se lee. Ese detalle está bien y se queda, pero abajo y plegado.

En primer plano tiene que haber pocas cosas:

- **Marcas que calcula la app**, en todas las sesiones, se hayan analizado o no.
- **Un veredicto, dos destacados y algunas marcas del análisis**, en las sesiones analizadas.

Además habrá **un análisis general** sobre un rango de semanas que propone qué conviene mirar en los próximos análisis de sesión.

### 2 · Decisiones cerradas

**Arquitectura**

1. **Dos capas (opción C).** La app calcula las marcas medidas. El análisis las comenta, pero no las reemplaza ni las recalcula.
2. **Dos análisis:** uno **por sesión** (P99) y uno **general** sobre un rango de semanas (P94).
3. **Las marcas del análisis no escriben números propios.** Apuntan a una marca de la app (por id) o a un tramo de la curva. Así el LLM no puede inventar una cifra (ADR #044: lo medido y lo interpretado no se mezclan).
4. **La prioridad de las marcas la fija la app, no el análisis.** El análisis comenta, pero no sube ni baja una marca. Una sesión sin analizar se ve igual que una analizada en todo lo que es medido.
5. **Las marcas que tienen un momento o un tramo se dibujan además sobre la curva**, sin importar su nivel.

**Qué analiza el análisis**

6. **Solo lo realizado.** La prescripción viaja en el paquete **como contexto** (para saber qué tipo de sesión era), pero **no se evalúa el cumplimiento**: nada de «duró el doble de lo prescripto» ni «eran 5 rondas y quedó una serie».
7. **Las calorías salen del paquete.** No son una medida relevante. Se siguen mostrando en la sesión, pero el análisis no las recibe y por eso no las puede comentar.
8. **Fuerza:** el análisis puede recomendarla siempre que corresponda, aunque hoy Juan haga solo VR.

**Análisis general (P94)**

9. **El análisis general no reescribe el prompt de sesión.** Propone **focos** (por ejemplo, «mirar si el tramo sostenido crece semana a semana»). **Juan los acepta o los descarta.** Los aceptados viajan **como dato** en el paquete de sesión, con su versión. El prompt queda fijo, para que los análisis sigan siendo comparables entre sí.
10. **Si el análisis general propone una marca nueva de la app**, eso es código: sale como pedido para un prompt de Code y no se aplica solo.

**Descartado**

- La marca **«Contra lo prescripto»**: contradice la decisión 6.
- La **progresión como marca de la sesión**. La regla de P98 sigue en pie y propone igual; se muestra **en la rutina**, no en la sesión.
- Las **calorías** en el análisis (decisión 7).

### 3 · Catálogo de marcas de la app

Las marcas se calculan con **las zonas guardadas en la sesión**, no con las vigentes. Así, un cambio trimestral de FC máxima no reescribe marcas viejas. La corrección del piso de Z5 (152 → 153, P97) sí las rehace, igual que rehace las zonas.

#### Nivel 1 — badges

Son pocos a propósito: en una sesión típica se ven 3, y 4 o 5 cuando pasa algo.

| # | id | Marca | Qué muestra | Cuándo aparece | Sobre la curva |
|---|---|---|---|---|---|
| 1 | `calidad` | Calidad de la medición | Cobertura baja o FC dudosa | Solo si hay un problema, con estilo de aviso. Va primero porque cambia cómo se leen las demás | — |
| 2 | `record` | Récord | La sesión más larga, de más carga o de más tiempo en zona alta, por tipo de actividad. En fuerza, el récord por ejercicio | Solo si hubo uno | — |
| 3 | `picoSobreVigente` | Pico sobre la FC máxima vigente | FC pico de la sesión contra la FC máxima vigente | Solo si la supera; abre la revisión de la FC máxima (opción C) | sí |
| 4 | `carga` | Carga | Σ (minutos en Zi × i), de Z1×1 a Z5×5. Un solo número que compara VR con fuerza | Siempre | — |
| 5 | `zonaAlta` / `volumen` | Zona alta (VR y cardio) / Volumen (fuerza) | Minutos y porcentaje en Z4+Z5 / kilos × repeticiones totales | Siempre; cambia según el tipo de sesión | — |
| 6 | `semana` | Semana | Días entrenados contra la meta, y cuántos de fuerza: «2 de 5 · sin fuerza» | Siempre | — |

#### Nivel 2 — secundarias

Van en una fila discreta, sin color, en este orden:

| # | id | Marca | Qué muestra | Sobre la curva |
|---|---|---|---|---|
| 7 | `tramoSostenido` | Tramo sostenido | El tramo continuo más largo sin bajar del piso de Z4 | sí |
| 8 | `mitades` | Mitades | FC media de la primera mitad contra la segunda, sin contar la entrada en calor. La app mide; si hubo deriva o no, lo interpreta el análisis | — |
| 9 | `recuperacionSeries` | Recuperación entre series | Cuánto baja la FC en cada pausa. Solo con 2 o más series | sí |
| 10 | `picosZ5` | Picos en Z5 | Cuántas veces entró a Z5 y cuánto duró la más larga | sí |
| 11 | `entradaEnCalor` | Entrada en calor | Minutos hasta llegar por primera vez a Z4. Si nunca llegó, no aparece | sí |
| 12 | `recuperacionFinal` | Recuperación al terminar | Cuánto baja la FC en el primer minuto después del fin. **Condicional** | sí |
| 13 | `pico` | Pico | FC máxima de la sesión, cuando **no** supera la vigente | sí |

#### Condicionales: se confirman en el diagnóstico antes de construirlas

- **`recuperacionFinal`** necesita FC después del fin. El 27/09 el reloj siguió apenas 6,8 s. Si no hay datos suficientes, se descarta.
- **`volumen` y el récord de fuerza** necesitan que las series guarden la carga y las repeticiones.

### 4 · Análisis de sesión (P99)

#### Qué agrega al esquema

El esquema pasa a la **versión 3** y el prompt a la **versión 4**. El detalle de la v3 actual queda igual.

01/10: el análisis de sesión no menciona la progresión; la propuesta se explica en la rutina con los datos que usó la regla. P98 no toca el prompt de análisis.

| Campo | Contenido | Tope que valida la app |
|---|---|---|
| `veredicto` | Una oración: cómo salió la sesión | 1 oración |
| `destacados` | Lo más importante de la sesión | exactamente 2, de 1 o 2 oraciones cada uno |
| `marcasAnalisis` | Comentarios cortos anclados a una marca de la app (`refMarca`) o a un tramo (`inicioS`, `finS`), con tono `positivo` o `atencion` | un número máximo a fijar en P99 |

**El validador rechaza:**
- una `refMarca` que no exista entre las marcas del paquete;
- un tramo fuera de la ventana de la sesión;
- cualquier campo que pase su tope.

**Queda solo en el prompt** «no escribir números propios en las marcas del análisis». Es un juicio de contenido, igual que en la v3: un chequeo por dígitos rechazaría «Z4».

#### Qué cambia en el paquete y en el prompt

- El paquete **incluye las marcas de la app** con sus ids y valores.
- El paquete **no incluye las calorías** (decisión 7).
- El prompt **no evalúa el cumplimiento de la prescripción** (decisión 6).
- El prompt **puede recomendar fuerza** (decisión 8).
- Cuando exista P94, el paquete incluye **los focos aceptados** con su versión.

#### Insumos de las pruebas del 30/09 y el 02/10

El paquete no manda FC de reposo, sueño de la noche anterior ni edad, aunque la app los tiene: el análisis los pide en «Para completar». P99 los suma al paquete cuando existan.

Candidata a marca de la app (nivel 2, sobre la curva): tramo bajo, el tramo más largo por debajo del piso de Z3 después de la entrada en calor. El análisis del 02/10 preguntó qué pasó entre los minutos 8 y 22; con la marca, ese tramo se ve sin preguntar.

recuperacionSeries también tiene que medir las bajadas de la curva, no solo las pausas entre series: en VR corrido hay una sola serie. El análisis del 02/10 lo calculó a mano (caídas de 26 a 29 bpm en 1 o 2 min).

Regla para el prompt v4: si fcDudosa es falso, el análisis no especula sobre artefactos. El 02/10 marcó como posible artefacto una caída de 156 a 133 en 30 s, que es una recuperación normal.

Las preguntas del análisis se responden en el mismo chat, se pide el JSON corregido y se vuelve a cargar. Cada sesión se analiza en un chat nuevo.

El bloque armado lo escribe la app y el chat solo lo copia. P99 suma al validador el rechazo de un armado cuyas versiones no coincidan con las de la sesión al momento de cargar.

El 30/09 el análisis dijo «2 de 6 días» y el 27/09 «2 de 5». Verificá en el diagnóstico de P99 de dónde sale el total de la semana en el paquete.

El "2 de 6" del 30/09 sale del programa activo PRG-0004, que es de 6 días; la meta de 5 llega con el programa nuevo de P98.

### 5 · Análisis general (P94)

- Mira **todas las sesiones de un rango de semanas**. La serie semanal de **carga** es su base para comparar.
- Devuelve dos cosas: una **lectura del rango** y **focos propuestos** para los próximos análisis de sesión.
- Juan **acepta o descarta** cada foco. Los aceptados se versionan y viajan en el paquete de sesión (decisión 9).
- Las **marcas nuevas** que proponga salen como pedido para Code (decisión 10).
- Code ya avisó que no es trivial: falta el agregado, una colección nueva con sus reglas y otra identidad (miembro y rango). El diseño fino se hace cuando le toque.

### 6 · Pantalla — propuesta, a confirmar

De arriba hacia abajo:

1. **Veredicto** (solo si hay análisis).
2. **Badges** (nivel 1).
3. **Dos destacados** (solo si hay análisis).
4. **Curva** con las marcas que tienen momento o tramo.
5. **Secundarias** (nivel 2).
6. **Detalle del análisis**, plegado.

Para distinguir el origen de cada marca: las de la app van **sólidas**, y las del análisis con **borde punteado** y la etiqueta «análisis».

### 7 · Orden de ejecución

1. **Cerrar P93**: commit y deploy de hosting. _(Commit hecho: `600aa37`, 01/10/2026. El deploy de hosting lo hace Juan.)_
2. **P97**: zonas como Samsung. Las marcas usan zonas, y no se mide sobre datos que se están por corregir.
3. **P98**: rutinas de VR y progresión.
4. **P99**: marcas y análisis de sesión, por partes:
   - **Parte 1, diagnóstico.** Qué datos hay para las condicionales; si las marcas se guardan en la sesión o se calculan al mostrar; cómo define hoy la app la semana; y propuestas para lo abierto en §8.
   - **Parte 2, marcas de la app.** Valen solas, sin el LLM.
   - **Parte 3, esquema 3 y prompt 4.**
   - **Parte 4, pantalla.**
5. **P94**: análisis general y focos.

**Verificación:** las marcas se prueban contra la **sesión testigo del 27/09**. Los valores esperados se toman **después de P97**, con las zonas corregidas, y no ahora.

### 8 · Abierto: lo propone Code en el diagnóstico de P99 y se decide en el chat

- El umbral de cobertura para que aparezca `calidad`.
- La tolerancia de `tramoSostenido`: si una caída de pocos segundos bajo el piso de Z4 corta el tramo o no.
- Cómo se define el récord de fuerza: carga máxima o carga × repeticiones.
- El tope de `marcasAnalisis`.
- Si la pantalla de §6 queda así.

## Fuera de alcance

- Llamar a un modelo desde la app. Esto es a mano y a propósito: sin claves, sin costo, sin
  servidor.
- Que el análisis modifique cualquier dato de entrenamiento.
- Análisis automático de cada sesión. Se pide cuando se quiere.

## Decisiones abiertas

Las tres del diseño original quedaron **cerradas en P93**. Cada una con su planteo y cómo se
resolvió:

1. **La curva submuestreada**: ¿va a 30 segundos, o alcanza con las cifras por serie? Yo la
   pondría: es lo que permite ver la deriva y la forma de la recuperación.
   **Cerrada en P93: va a 30 segundos.** Promedio de cada balde, sin interpolar los huecos
   (`submuestrear` en `lib/paqueteAnalisis.ts`). Si el paquete pasa los 60 KB, baja a 60 s y
   después sale.
2. **El rango por defecto del análisis global**: 4, 8 o 12 semanas. Yo arrancaría en 8, que es
   la ventana que ya usa la tasa de cumplimiento.
   **Cerrada en P93: 8 semanas**, configurable en Perfil → Configuración
   (`/config/import.semanasAnalisisGlobal`). Lo usa P94.
3. **¿Se guarda también el paquete enviado**, o solo la respuesta? Guardarlo hace el análisis
   reproducible y permite ver qué datos tenía a la vista; cuesta espacio.
   **Cerrada en P93: el paquete no se guarda.** Se guarda con qué se armó (`armado`: versión de
   prompt, de esquema, ventana y `versionEnriquecimiento`), que alcanza para reconstruirlo; si la
   biometría cambió después, la versión lo delata.

**Siguen abiertas**, para el diagnóstico de P99: las del §8 de la sección «Marcas y análisis en
dos capas (P99) y análisis general (P94)».
