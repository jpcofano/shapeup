# 78 — La ventana de la app manda: recorte, tramos y cobertura

Repo: jpcofano/shapeup. Va después de P76b. Toca `lib/matchBiometrico.ts`,
`lib/enriquecerImport.ts` y el detalle de sesión.

## El principio

> **La ventana de la sesión de la app define el intervalo. Samsung aporta muestras, no el
> contenedor.**

El código ya aplica ese principio en dos lugares, sin nombrarlo: `huboOlvidoDeCorte`
(`OLVIDO_CORTE_MS`, 15 min) recorta a la ventana y recalcula FC de la curva, y
`construirBiometriaRango` arma biometría con muestras crudas cuando no hay workout. Este
prompt lo convierte en la regla general, en vez de dos excepciones.

La fila de Samsung tiene un solo dato confiable: **el inicio** (lo apretaste vos). El fin no
lo es —te podés olvidar de cortar, o cortar antes—, y que haya una fila no significa que
cubra la sesión entera.

## Qué arregla

Cinco casos que hoy **fallan en silencio**:

| Caso | Hoy |
|---|---|
| Samsung cortado antes (cortaste a los 20 de 60) | Matchea igual; kcal, duración y FC son del pedazo. La curva se corta y las series posteriores quedan sin FC |
| Arrancó tarde (te acordaste del reloj a los 10 min) | Δinicio ≤ 30 min lo acepta sin mirar cuánto falta |
| Arrancó antes (reloj primero, app después) | La fila trae calentamiento y preparación dentro de kcal y FC media |
| Dos workouts para una sesión | Gana el de menor Δinicio; el otro queda suelto como `shapeup-sin-sesion` |
| Hueco entre dos tramos | No existe el concepto |

El patrón de los tres bugs caros de este proyecto —mapeo 1001, fragmentos de sueño,
corrimiento de 3 h— es siempre el mismo: falla silenciosa detectada recién al auditar. La
Parte 5 es la que rompe ese patrón, y es la más importante de las seis.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — Recorte general, de los dos lados

`construirBiometriaSesion` deja de tratar el olvido de corte como caso especial.

**Intervalo efectivo** = intersección entre la ventana de la app y la del workout:
`[max(A_ini, S_ini), min(A_fin, S_fin)]`.

- **Con curva** (`live_data.json`): FC media, máxima y mínima **siempre** se recalculan
  sobre la curva recortada al intervalo efectivo. Nunca más se leen las columnas de la fila
  cuando hay curva.
- **Sin curva**: no hay con qué recortar. Se mantiene el comportamiento conservador de hoy
  — si el workout se pasa más de `OLVIDO_CORTE_MS` del fin de la app, solo `fcMax` (el pico
  casi seguro fue entrenando) y se omiten media y kcal. `OLVIDO_CORTE_MS` sobrevive **solo**
  para este camino.
- `finMsEfectivo` se sigue sellando, y se suma `inicioMsEfectivo` por simetría.

---

## Parte 2 — Calorías prorrateadas y marcadas

Decisión cerrada: **se prorratean, no se omiten.**

```
kcalRecortadas = kcalFila × (msIntersección / msWorkout)
```

- Se guarda `kcalEstimada: true` en la biometría cuando el prorrateo se aplicó (es decir,
  cuando la intersección es menor que el workout completo).
- Con varios tramos, se suman las prorrateadas; si **alguno** fue prorrateado, el total
  queda marcado como estimado.
- El detalle de sesión muestra las calorías con un `~` adelante cuando `kcalEstimada`.

**Documentá el sesgo en el módulo:** el prorrateo por tiempo supone intensidad constante.
Si el tramo recortado era sofá, sus calorías reales eran bajas y el prorrateo le saca de
más — o sea **subestima**. Es la dirección segura: quedarse corto en el esfuerzo es mejor
que inflarlo.

---

## Parte 3 — Tramos, con solape ≥ 80 %

Una sesión puede tener más de un workout de Samsung adentro (te trabaste, paraste y
arrancaste de nuevo, el reloj se cortó solo).

- **Principal**: como hoy — pool custom-id, menor Δinicio, techo `TECHO_CUSTOM_ID_MS`.
  Sin cambios.
- **Tramos adicionales**: las demás candidatas del pool custom-id cuyo
  **solape relativo al tramo** sea ≥ `SOLAPE_TRAMO_MIN = 0.80`:

  ```
  solapeRelativo = msIntersección / msDelTramo
  ```

  Es relativo **al tramo, no a la ventana**, y eso es a propósito: un workout de tres horas
  sin cortar tiene solape relativo chico, así que **no entra como tramo**. Si igual es el
  más cercano al inicio, entra como principal y lo resuelve el recorte de la Parte 1.

**Agregación** (todos ya recortados al intervalo efectivo de cada uno):

| Métrica | Cómo |
|---|---|
| kcal | Suma de las prorrateadas |
| Duración medida | **Suma de los tramos**, no reloj de pared: el hueco entre dos tramos no es entrenamiento |
| FC media | **Ponderada por duración**, no promedio de promedios ni de muestras (ver Parte 4) |
| FC máx / mín | Máximo y mínimo de todos |
| Curva | Concatenación ordenada por `ms`, sin duplicados |

Todos los `datauuid` consumidos se agregan a `datauuidsUsados` (pool 1:1, ADR #021).

**Duración de la sesión**: la que se muestra sigue siendo la de la app
(`duracionRealMin`, reloj de pared). La suma de tramos se guarda aparte como
`duracionMedidaMin`. Son dos cosas distintas y las dos sirven.

---

## Parte 4 — Rellenar los huecos con la serie continua

Hoy el nivel "rango" (`construirBiometriaRango` sobre `muestrasFcCrudas` de
`tracker.heart_rate`) es un **último recurso excluyente**: solo corre si no hubo match.
Pasa a ser **complemento**.

Los tramos de la ventana de la app sin curva fina —antes del inicio del workout, después
del corte, entre dos tramos— se completan con las muestras crudas que caigan ahí.

**El detalle que no se puede pasar por alto:** promediar juntas muestras de 1/s con muestras
de `tracker.heart_rate` (mucho más ralas) **pondera mal** — el tramo fino domina el promedio
por cantidad de muestras, no por tiempo. La FC media se calcula **segmentando la ventana,
promediando dentro de cada segmento y ponderando cada segmento por su duración**.

Se mantiene `MIN_MUESTRAS_RANGO` para decidir si un hueco tiene datos suficientes o queda
sin cubrir.

---

## Parte 5 — Cobertura: que la falla se vea

Dos campos nuevos en `BiometriaSesion`:

```ts
coberturaFina: number;   // 0..1 — minutos de la ventana con curva de ~1/s
coberturaTotal: number;  // 0..1 — fina + huecos cubiertos con muestras crudas
```

Constante: `COBERTURA_MINIMA = 0.80`.

Y un motivo detectado, para poder decir **qué** pasó y no solo que falta dato:

```ts
motivoCobertura?: "cortado-antes" | "arranco-tarde" | "hueco-entre-tramos" | "sin-cortar";
```

Se deriva de dónde está el hueco respecto de la ventana: al final, al principio, en el
medio, o el workout excediendo la ventana.

---

## Parte 6 — En el detalle de sesión, y solo ahí

Decisión cerrada: **nada de chip en la lista del historial.** Sobrecarga una lista que ya
tiene varios estados.

En el detalle de la sesión, junto a los datos de FC:

- **Siempre**, una línea discreta en minutos, no en porcentaje —los minutos son accionables:

  ```
  FC medida en 41 de 62 min
  ```

- **Solo si `coberturaFina < COBERTURA_MINIMA`**, además el motivo en una frase derecha:

  ```
  Datos parciales — el reloj se cortó a los 20 min
  Datos parciales — el reloj arrancó 11 min después que la sesión
  ```

- Calorías con `~` adelante cuando `kcalEstimada`.

Nada de íconos de alerta ni de rojo: es información, no un error del usuario.

---

## Parte 7 — Que el reimport no vuelva a meter los tramos

`BiometriaSesion.datauuidSamsung` (uno solo) sigue existiendo y guarda **el principal**,
por compatibilidad con los documentos ya escritos. Se suma:

```ts
tramosSamsung?: string[];   // todos los datauuid agregados, principal incluido
```

**La regla 1b de `clasificarImport` (P75c) tiene que mirar los dos.** Hoy busca el
`datauuid` de la actividad contra `datauuidSamsung` de las sesiones; si no mira también
`tramosSamsung`, cada reimport vuelve a meter el segundo tramo como actividad suelta. Es el
punto donde esto se rompe silenciosamente, así que va con test propio.

---

## Parte 8 — El caso ambiguo deja de ser un número

Cuando la ventana es sintética (estado perdido) y hay dos o más candidatas del mismo día,
`elegirSesionSamsung` devuelve `ambiguo` y hoy eso termina en el contador `resultado.ambiguas`,
que nadie mira.

**No adivines**: con una ventana estimada de ±1 h cualquier regla automática es una apuesta,
y el precedente del mapeo 1001 dice cómo termina eso.

Lo que cambia es la visibilidad: el resumen del import **lista las sesiones ambiguas con
nombre y fecha**, no un contador. Quedan para enlazar a mano con el "enlazar" del Bloque 5.

---

## Tests

- **Recorte**: workout que empieza 12 min antes → FC media de la curva recortada, no la de
  la fila; workout que termina 40 min después → igual que hoy; sin curva y sin exceso → la
  fila tal cual.
- **kcal**: intersección de la mitad del workout → mitad de las kcal y `kcalEstimada: true`;
  workout entero dentro de la ventana → kcal sin marcar.
- **Tramos**: dos workouts contenidos → un solo enriquecimiento con kcal sumadas, duración
  medida sumada sin el hueco, FC máx global; un workout de 3 h con solape relativo 0,15 → no
  entra como tramo; un tramo con solape relativo 0,79 → no entra; 0,81 → entra.
- **FC media ponderada**: 40 min de curva fina a 150 y 20 min de muestras crudas a 100 →
  133, **no** el promedio por cantidad de muestras. Este test es el que atrapa el error de
  ponderación.
- **Cobertura**: sesión de 62 min con 41 de curva → `coberturaFina ≈ 0.66`,
  `motivoCobertura: "cortado-antes"`; cobertura 0,95 → no se muestra el aviso.
- **Reimport**: una actividad cuyo `datauuid` está en `tramosSamsung` **no** vuelve a entrar
  como externa.
- **Aislamiento de P74**: otra vez. Racha, adherencia, tonelaje y progresión no se mueven.

Corré la suite completa, `npx tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Inferir desde Samsung qué ejercicio fue. El principio del roadmap (§9) no se toca: la app
  dice qué, Samsung dice cuánto costó.
- La pantalla de "enlazar" del Bloque 5.
- Sesiones que cruzan medianoche: la regla "día único" compara fecha local y puede no
  coincidir. **No lo arregles**, pero decime en el reporte si hay alguna sesión real así.

---

## Al terminar, reportá

1. El diff por archivo, resumido.
2. Tests, `tsc` y `test:rules`.
3. **Con los datos reales**: cuántas sesiones tienen `coberturaFina < 0.80`, con el motivo
   de cada una. Es la foto de cuánto de esto venía pasando sin que se viera.
4. Cuántas sesiones ganan tramos adicionales, y cuántos `shapeup-sin-sesion` dejan de serlo
   por eso. Hoy son 9: decime cuántos quedan.
5. Si alguna sesión cruza medianoche.
6. Si el prorrateo de kcal cambia mucho algún total ya guardado, con los números.
7. Cualquier punto donde hayas parado o te hayas apartado del prompt.
