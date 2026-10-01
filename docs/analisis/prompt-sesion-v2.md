# Análisis de una sesión de entrenamiento — prompt v2

Vas a analizar **una sesión de entrenamiento** registrada en ShapeUp, una app familiar, con los
datos que están abajo en el bloque JSON. Leé todo antes de responder.

## 1. Quién entrena

En `quienEntrena` están los objetivos de la persona, el nivel y el objetivo de la rutina, su FC
máxima teórica y sus zonas de FC (`zonasFC`: piso y techo de cada zona, en bpm). La zona de una
FC es la más alta cuyo piso se alcanzó. Si `edad` está en `null`, no está registrada: **no la
supongas**.

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

- **Hallazgos**: cosas concretas que se ven en los datos, **cada una con su `evidencia`**: el
  número o los números del paquete en que se apoya, citados de forma que se puedan encontrar.
- **Sugerencias**: accionables y concretas (qué cambiar, por qué, y cuándo: la próxima sesión, esta
  semana o el próximo bloque).
- **Banderas**: lo que ves raro. Un dato dudoso, una inconsistencia entre fuentes, algo que merece
  mirarse.
- **Preguntas**: lo que te haría falta saber para concluir algo que hoy no se puede.

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
  - Avisá que los datos no cierran, con una bandera de tipo `inconsistencia`.
- **Con `prescripcionOrigen: "rutina-actual"`, la prescripción es una referencia, no la verdad**:
  la rutina pudo cambiar después. Si comparás contra ella (por ejemplo, descanso real contra
  prescripto), decilo en el hallazgo y bajá la `confianza`.
- **Si el dato no alcanza para una conclusión, decilo en vez de estirarlo.** Poner eso como
  pregunta o como bandera vale más que un hallazgo débil.
- **Nada de consejo médico.** Si algo parece una señal de salud (una FC que no cierra, una
  molestia repetida, una recuperación rara), va como bandera de tipo `consultar-profesional`,
  **nunca como diagnóstico ni como indicación**.
- Escribí en castellano rioplatense, claro y corto. Sin relleno.

## 7. La salida

Devolvé **solo el JSON**, sin texto antes ni después y sin bloque de código, con esta forma:

```json
{
  "version": 1,
  "tipo": "sesion",
  "idHist": "copiá paquete.responderCon.idHist",
  "armado": "copiá paquete.responderCon.armado tal cual, el objeto entero",
  "generadoEn": "AAAA-MM-DD",
  "modelo": "tu nombre y versión",
  "resumen": "dos a cuatro frases",
  "hallazgos": [
    { "tema": "densidad", "detalle": "…", "evidencia": "descanso real 95 s contra 60 prescriptos, en 4 de 5 series", "confianza": "alta" }
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

- `confianza` es tuya: `alta`, `media` o `baja`.
- `banderas[].tipo` es uno de `dato-dudoso`, `inconsistencia`, `consultar-profesional` u `otro`.
- `cuando` es `proxima-sesion`, `esta-semana` o `proximo-bloque`.
- Topes:
  - listas: hasta 8 hallazgos, 5 sugerencias, 5 banderas y 5 preguntas;
  - textos: `resumen` hasta 900 caracteres, `detalle` hasta 600, `evidencia` hasta 400.
- `idHist` y `armado` tienen que ser **exactamente** los de `paquete.responderCon`: la app rechaza
  un análisis de otra sesión.
