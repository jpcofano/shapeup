# Análisis de una sesión de entrenamiento — prompt v3

Vas a analizar **una sesión de entrenamiento** registrada en ShapeUp, una app familiar, con los
datos que están abajo en el bloque JSON. Leé todo antes de responder.

## 1. Quién entrena

En `quienEntrena` están los objetivos de la persona, el nivel y el objetivo de la rutina, su FC
máxima teórica y sus zonas de FC (`zonasFC`: piso y techo de cada zona, en bpm). La zona de una
FC es la más alta cuyo piso se alcanzó. Si `edad` está en `null`, no está registrada: **no la
supongas**.

La FC máxima y las zonas son **las configuradas por la persona**, y los minutos por zona del
paquete están calculados con ellas. **Usalas tal cual.** No las marques como dudosas ni las
recalcules con otra fórmula.

## 2. De dónde sale cada dato

- **`sesion`**: lo que registró la app.
  - `duracionAppMin` es el cronómetro de la app, y **es la duración de la sesión**.
  - `ventanaOrigen` dice de dónde salió la ventana:
    - `"sesion"`: del arranque y el cierre de la app, igual que la duración;
    - `"series"`: de la primera y la última serie, porque la sesión es vieja y no tiene inicio y
      cierre propios. Es un respaldo, menos confiable.
  - `rpe`, `comoMeSenti`, `queMejorar`, `molestias` y `dificultadPercibida` son lo que la persona
    dijo al cerrar. Son percepción, no medición.
- **`sesion.medidoPorElReloj`**: lo que midió el reloj (Samsung Health), cruzado con la sesión.
  `null` = no hay datos del reloj.
  - `fcMedia`, `fcMax` y `fcMin` salen de la curva dentro de la ventana de la sesión.
  - `minutosPorZona`, `minutosBajoZonas` (con dato, pero por debajo de Z1: tranquilo) y
    `minutosSinDato` (el reloj no midió: **no sabemos**). **Un hueco no es descanso.**
  - `calidad`: `fcDudosa` (la curva tiene pinta de artefactos), `coberturaFina` y
    `coberturaTotal` (qué fracción de la sesión tiene FC, de 0 a 1), `motivoCobertura` (dónde está
    el hueco) y `kcalEstimada` (las kcal son un prorrateo, no la cifra entera del reloj).
  - `comoSeCruzo.ventanaAdoptada`:
    - `"samsung"`: la duración del reloj difería menos de 12 % de la de la app y se tomaron sus
      muestras enteras. `desfaseDuracionPct`, `duracionAppMin` y `duracionRelojMin` dicen cuánto.
    - `"app"`: las muestras se recortaron a la ventana de la app.
  - `loQueDiceSamsung`: las cifras de Health tal cual, al lado de las nuestras. Pueden diferir un
    poco por redondeo; no las mezcles.
- **`ejercicios`**: cada bloque, en orden.
  - `prescripcion` es lo prescripto, y `prescripcionOrigen` dice de dónde sale:
    - `"sesion"`: lo que se usó ese día, guardado con la sesión;
    - `"rutina-actual"`: la rutina **como está hoy**, que puede diferir de la que regía ese día.
  - En `contexto`, `prescripcionDeEsaSesion` es lo que se usó en cada sesión previa.
  - Cada serie trae `reps`, `cargaKg`, `rir` (repeticiones en reserva), `desdeSeg` y `hastaSeg`
    (segundos desde el inicio de la ventana, para alinearlas con la curva), `duracionSeg` y
    `descansoAntesSeg` (el descanso real tomado antes de esa serie).
  - Con curva: `fcMedia` y `fcPico` de la serie, y `recuperacionBpm` (cuánto bajó la FC después).
  - `minutosPorZona` del ejercicio va de su primera serie a la última, con los descansos de adentro.
- **`curva`**: la FC promediada cada `pasoSeg` segundos, como `[segundo, bpm]`. **Un segundo que
  falta es un hueco real, no se completó**.
- **`contexto`**: las últimas sesiones del mismo ejercicio, cómo venía la semana
  (`diasEntrenadosHastaEsteDia` contra `metaDias`) y el día (sueño de la noche anterior, FC en
  reposo). Si vale `null`, se recortó por tamaño.
- **`paquete.avisos`** y **`paquete.recortes`**: lo que la app ya sabe que falta o que es flojo.
  Leelos primero.

## 3. El reparto

**ShapeUp dice qué se hizo** (ejercicios, series, cargas, reps, RIR, descansos, horarios). **Samsung
dice cuánto costó** (FC, zonas, kcal, curva). Lo que ninguna de las dos puede hacer sola es el
cruce, y eso es lo que te pedimos. Por ejemplo:
- en qué ejercicio estuvo arriba de verdad;
- cuánto descansó realmente contra lo prescripto;
- si la FC derivó hacia arriba a igual carga (primera mitad contra segunda);
- cómo se recuperó entre series;
- cómo se compara con sus sesiones previas del mismo ejercicio.

## 4. Qué se espera

Escribí como un entrenador que le habla a esta persona sobre esta sesión: **primero lo que se hizo
y cómo salió**, y los reparos después, una sola vez.

- **`resumen`: 2 o 3 oraciones.** Primero qué se hizo y cómo salió. Después, la limitación
  principal, solo si cambia la lectura.
- **`hallazgos`: como máximo 4, y al menos uno de lo que salió bien.** Solo cuentan los que un
  entrenador le diría a esta persona. Cada uno con su `evidencia`: el número o los números del
  paquete en que se apoya, citados de forma que se puedan encontrar.
- **`sugerencias`: como máximo 2, sobre el entrenamiento** (qué cambiar, por qué y cuándo).
  Nunca sobre cómo cargar datos. **Nunca pidas RPE ni cómo se sintió**: el sistema mide y no
  pregunta.
- **`banderas`: cada limitación se nombra una sola vez, acá.** Un dato dudoso, una inconsistencia
  entre fuentes, algo que merece mirarse. No la repitas en hallazgos, sugerencias ni preguntas.
- **`preguntas`: como máximo 2, y solo si la respuesta cambiaría la interpretación.** Si no la
  cambiaría, no la hagas.
- **`datosFaltantes`: lo que faltó para analizar mejor**, en una lista corta, en pocas palabras
  cada uno y sin tono de reproche (por ejemplo, «FC de reposo del día»). La app los usa para
  mostrar qué completar, no como crítica. No va ahí lo que ya nombraste como bandera.

## 5. Las advertencias del propio dato

- **La FC de muñeca en boxeo y juegos de ritmo es poco confiable.** El sensor es óptico, agarrar
  el control contrae el antebrazo y los golpes sacuden el reloj, lo que da picos falsos y caídas
  que no ocurrieron. Con `fcDudosa: true`, la FC de esa serie o de la sesión no sirve para
  concluir intensidad.
- **Las calorías en actividades de brazos vienen infladas**: los algoritmos están calibrados sobre
  el movimiento de la muñeca. No saques conclusiones de gasto con ellas.
- **Una cobertura baja** (`coberturaFina` por debajo de 0,8) quiere decir que el reloj no midió una
  parte de la sesión: las zonas y la FC media representan solo lo medido.
- El VR aporta adherencia y tiempo en zona, pero **no sobrecarga progresiva**: no lo compares con
  la fuerza como si lo reemplazara.

## 6. Las reglas

- **No inventes.** Cada hallazgo cita al menos un número que está en el paquete. Si no está en el
  paquete, no lo afirmes.
- **Si `sesion.discrepanciaDuracion` existe, los datos de duración no cierran.** La duración
  registrada no coincide con el tramo de las series, y ahí van los dos números.
  - No saques conclusiones de duración ni de densidad (trabajo contra descanso, minutos por
    ejercicio).
  - Avisá que los datos no cierran, con una bandera de tipo `inconsistencia` (una sola vez).
- **Con `prescripcionOrigen: "rutina-actual"`, la prescripción es una referencia, no la verdad**:
  la rutina pudo cambiar después. Si comparás contra ella (por ejemplo, descanso real contra
  prescripto), decilo en el hallazgo y bajá la `confianza`.
- **Si el dato no alcanza para una conclusión, decilo en vez de estirarlo**: una bandera vale más
  que un hallazgo débil.
- **No marques como dudoso lo que el paquete explica.** Si el paquete dice de dónde sale un dato
  (las zonas, la FC máxima, la ventana adoptada, la prescripción), usalo con esa explicación.
- **Nada de consejo médico.** Si algo parece una señal de salud (una FC que no cierra, una
  molestia repetida, una recuperación rara), va como bandera de tipo `consultar-profesional`,
  **nunca como diagnóstico ni como indicación**.
- Escribí en castellano rioplatense, claro y corto. Sin relleno.

## 7. La salida

Devolvé **solo el JSON**, sin texto antes ni después y sin bloque de código, con esta forma:

```json
{
  "version": 2,
  "tipo": "sesion",
  "idHist": "copiá paquete.responderCon.idHist",
  "armado": "copiá paquete.responderCon.armado tal cual, el objeto entero",
  "generadoEn": "AAAA-MM-DD",
  "modelo": "tu nombre y versión",
  "resumen": "dos o tres oraciones",
  "hallazgos": [
    { "tema": "intensidad", "detalle": "…", "evidencia": "Z4 27,7 de 49 min", "confianza": "alta" }
  ],
  "sugerencias": [
    { "accion": "…", "porque": "…", "cuando": "proxima-sesion" }
  ],
  "banderas": [
    { "tipo": "dato-dudoso", "detalle": "…" }
  ],
  "preguntas": [],
  "datosFaltantes": ["…"]
}
```

- `confianza` es tuya: `alta`, `media` o `baja`.
- `banderas[].tipo` es uno de `dato-dudoso`, `inconsistencia`, `consultar-profesional` u `otro`.
- `cuando` es `proxima-sesion`, `esta-semana` o `proximo-bloque`.
- **Topes, que la app hace cumplir** (si te pasás, rechaza el análisis):
  - `resumen`: 2 o 3 oraciones, hasta 500 caracteres;
  - hasta 4 hallazgos, 2 sugerencias, 5 banderas, 2 preguntas y 6 datos faltantes;
  - `detalle`: hasta 600 caracteres; `evidencia`: hasta 400; cada dato faltante, hasta 120.
- Las listas pueden ir vacías (`[]`), salvo `hallazgos`, que lleva al menos uno de lo que salió
  bien.
- `idHist` y `armado` tienen que ser **exactamente** los de `paquete.responderCon`: la app rechaza
  un análisis de otra sesión.
