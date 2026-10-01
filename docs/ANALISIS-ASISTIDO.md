# Análisis asistido — diseño

Estado: **la sesión está construida (P93, 30/09/2026)**; el análisis global es P94. La regla es el
**ADR #044** en `CLAUDE.md`. Las tres decisiones abiertas del final quedaron cerradas en P93 (ver
ahí).

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

## Fuera de alcance

- Llamar a un modelo desde la app. Esto es a mano y a propósito: sin claves, sin costo, sin
  servidor.
- Que el análisis modifique cualquier dato de entrenamiento.
- Análisis automático de cada sesión. Se pide cuando se quiere.

## Decisiones (cerradas en P93)

- **La curva va a 30 segundos.**
- **El global arranca en 8 semanas**, configurable en `/config/import.semanasAnalisisGlobal`.
- **El paquete enviado no se guarda**: se guarda con qué se armó (versión de prompt, de esquema,
  ventana y `versionEnriquecimiento`), que alcanza para reconstruirlo.

Lo que se planteó, para la historia:

1. **La curva submuestreada**: ¿va a 30 segundos, o alcanza con las cifras por serie? Yo la
   pondría: es lo que permite ver la deriva y la forma de la recuperación.
2. **El rango por defecto del análisis global**: 4, 8 o 12 semanas. Yo arrancaría en 8, que es
   la ventana que ya usa la tasa de cumplimiento.
3. **¿Se guarda también el paquete enviado**, o solo la respuesta? Guardarlo hace el análisis
   reproducible y permite ver qué datos tenía a la vista; cuesta espacio.
