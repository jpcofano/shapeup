# 79 — VR con progresión

Repo: jpcofano/shapeup. Parte de `f823dca`. Roadmap, Bloque 9 (§9.1, §9.2 y §9.3).

## Qué problema resuelve

Tres de los seis días del plan de Juan son VR, y **hoy una sesión VR no progresa**: la app
registra rondas y tiempos, pero no sabe si el juego le costó, y la próxima vez propone
exactamente lo mismo. La fuerza tiene `sugerirProgresion`; el VR no tiene nada.

El roadmap ya decidió cómo (§9.2): la app elige la palanca comparando la FC de trabajo contra
la zona objetivo que declara la rutina, con una escalera ordenada por lo que cuesta en
tiempo: **dificultad del juego → recortar descanso → sumar ronda**.

El principio de fuentes del Bloque 9 no se toca: **la app dice qué ejercicio fue, Samsung
dice cuánto costó, el match por hora los une.**

Y un segundo principio, decidido por Juan: **el sistema decide solo con lo que mide.** La
sensación de la persona no es una medición confiable y no entra en ninguna regla. Cuando no
hay nada medido con qué decidir, el sistema **no inventa una sugerencia**: lo dice y deja
elegir a la persona. Es lo que pide §9.3 del roadmap: con el dato dudoso, se sugiere igual y
se avisa, no se le cede la decisión a otra cosa.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 0 — Dos arrastres de esta mañana

**`metaSemanal` cuenta los días opcionales.** PRG-0001 se llama "5 días" y la meta da 6: el
sexto es el sábado de VR largo, `opcional: true`. Con meta 6, toda semana sin el sábado
figura incumplida, y ya está deployado.

- La meta cuenta los días con `tipo !== "descanso"` **y** `!opcional`.
- Los días opcionales hechos **siguen sumando** a `diasPlan`: hacerlos te cubre si faltaste
  otro día; no hacerlos no te baja.
- Si todos los días activos son opcionales, la meta es `null`.
- Tests: un programa como PRG-0001 da 5; 4 obligatorios + el opcional cumple; todos
  opcionales da `null`. Actualizá el test *"sale de los días no-descanso del plan"*, que
  fijaba el error.
- `serie-adherencia.ts` imprime cuántos días son opcionales.

**`serie-adherencia.ts` pide un índice que no existe.** Filtra `fecha >=` sin `orderBy`, y
Firestore ordena ascendente, lo que exige `(miembro, fecha asc)`. Agregá
`.orderBy("fecha", "desc")`, que usa el índice existente. **No agregues un índice.**

---

## Parte 1 — El enriquecimiento se versiona (corrige ADR #021)

Es un bug que afecta a todo lo de ayer, no solo a VR, y va primero porque el resto depende
de él.

`calcularEnriquecimiento` **omite toda sesión con `biometria.granularidad === "serie"`**
(ADR #021, `enriquecerImport.ts:173`). La intención era no rehacer trabajo ni pisar un dato
fino con uno grueso. Pero la consecuencia es que **una sesión ya enriquecida nunca recibe un
algoritmo nuevo**: las de antes de P78 no van a tener cobertura, tramos ni recorte por más
que se reimporte, y no van a tener la FC por ronda de la Parte 2.

- `BiometriaSesion.versionEnriquecimiento?: number` y la constante
  `VERSION_ENRIQUECIMIENTO` en `matchBiometrico.ts`. Este prompt la deja en **3** (P78 fue el
  2, lo anterior cuenta como 1; ausente = 1).
- Se omite **solo** si `granularidad === "serie"` **y** la versión está al día.
- **Nunca se pisa fino con grueso**: si la sesión está desactualizada pero en esta corrida no
  hay curva para ella (vino por el puente y el ZIP no la trae, por ejemplo), se deja como
  está. Solo se reescribe si el resultado nuevo también es `serie`.
- Cada cambio futuro al algoritmo sube la constante. Dejalo escrito en la cabecera.
- El resumen del import dice cuántas sesiones se re-enriquecieron por versión.
- **ADR #038** — el enriquecimiento se versiona; enmienda el #021.

---

## Parte 2 — FC de trabajo, no FC de sesión

Este es el detalle que decide si la progresión sirve o no.

`biometria.fcMedia` promedia **toda la sesión, descansos incluidos**. En una rutina de
rondas de 4 minutos con 1 de descanso, la media de sesión queda sistemáticamente por debajo
de la FC real de trabajo. Si la regla usara esa media, **leería siempre "por debajo de la
zona" y pediría subir la dificultad para siempre.**

- `SerieRegistro.fcMedia?: number`, calculada en `enriquecerSerie` sobre
  `[inicioMs, finMs]` de la serie (en VR, cada serie es una ronda: ADR #024).
- Solo si la ventana tiene al menos `MIN_MUESTRAS_SERIE = 30` muestras. Con curva de 1/s eso
  sobra; con las muestras crudas de `tracker.heart_rate` no alcanza nunca, y está bien: una
  ronda sin curva fina **no tiene FC media**, no tiene una inventada.
- **FC de trabajo** de la sesión: promedio de las `fcMedia` de las rondas completadas,
  **ponderado por la duración de cada ronda** (mismo criterio que P78).
### La calidad de la FC también se mide

La FC de muñeca en boxeo y juegos de ritmo es la peor medición del sistema (§9.3): agarrar el
control contrae el antebrazo y los golpes sacuden el reloj. Eso deja **artefactos que se
pueden detectar en la curva**, sin preguntarle nada a nadie. En `enriquecerSerie`, con la
curva a mano, cada ronda se marca `SerieRegistro.fcDudosa?: boolean` si:

- más de `MAX_FRACCION_ARTEFACTOS = 0.05` de sus muestras son **saltos**: un cambio de más de
  `SALTO_ARTEFACTO_BPM = 30` entre dos muestras separadas por 2 s o menos. El corazón no hace
  eso; el sensor sí;
- o su `fcPico` supera `fcMaxTeorica + 10`, cuando el perfil la tiene.

Constantes nombradas y documentadas como punto de partida para ajustar.

- **FC confiable** si las rondas con `fcMedia` **y sin `fcDudosa`** suman al menos
  `COBERTURA_MINIMA` (0,80, de P78) del tiempo de trabajo, **y** el perfil tiene `zonasFC` o
  `fcMaxTeorica` para derivar la zona. Si falta cualquiera de las dos, la FC no decide.
- La FC de trabajo se calcula solo con las rondas sin `fcDudosa`.

### El descanso real, la otra medición que no necesita FC

`SerieRegistro` ya guarda `inicioMs`/`finMs` de cada ronda, así que el descanso que
**realmente** se tomó entre rondas se deriva de los timestamps: `inicio de la siguiente − fin
de la anterior`. Si arrancás la ronda siguiente antes de que termine el timer, o le sumás
30 s, queda registrado. No se guarda: se calcula.

- `descansoReal`: la **mediana** de esos intervalos en la sesión.
- Comparado con el `descansoSeg` de `prescripcionUsada`:
  `≤ DESCANSO_SOBRA = 0.7` del prescripto → te sobró descanso;
  `≥ DESCANSO_FALTA = 1.3` → necesitaste más del previsto.

---

## Parte 3 — El chip de dificultad al cerrar (§9.1)

En `ResumenSesion.tsx`, para una sesión VR, en el lugar donde la fuerza pide el RIR:

```
¿Cómo te resultó?    suave · normal · intenso
```

- Tres botones grandes, un toque, **opcional** — igual que el RIR.
- Se guarda en `Historial.dificultadPercibida?: "suave" | "normal" | "intenso"`.
- **Se registra y nada más: no entra en ninguna regla de progresión.** Queda como dato para
  el análisis — por ejemplo, para ver después si lo que el sistema midió como "en zona" se
  sintió como tal. Dejalo escrito en el tipo, para que nadie lo enchufe a una regla más
  adelante sin decidirlo.
- Una sesión es VR si su rutina tiene un bloque `Cardio` en formato `Intervalos` con
  `juegoSugerido`. Si encontrás un criterio más firme en el código, usalo y decímelo.

---

## Parte 4 — La historia es la fuente de los parámetros (ADR #039)

Cuando se acepta "recortar descanso", **la rutina no se toca**: `/rutinas` es compartida por
la familia, y cambiarla por la progresión de un miembro se la cambia a todos. Tampoco se
guarda un override por miembro: sería un contador acumulado, que es lo que el ADR #037
prohíbe.

- `BloqueRegistro.prescripcionUsada?: { rondas: number; trabajoSeg: number; descansoSeg: number }`:
  los parámetros **con los que se jugó** esa sesión.
- Al empezar una rutina VR, los parámetros salen de la **última sesión** de ese miembro con
  esa rutina y ese juego: su `prescripcionUsada`, más el ajuste si se aceptó. Sin historia,
  los de la rutina.
- La clave es `(miembro, idRutina, idEjercicio del bloque VR)`: si en la última sesión se
  sustituyó el juego (P73), es otro juego y tiene su propia historia.
- La sesión en curso usa esos parámetros para el timer de rondas y descansos.
- **ADR #039** — la progresión VR se deriva del historial; la rutina nunca se muta.

---

## Parte 5 — `src/lib/progresionVR.ts`, puro (ADR #009)

```ts
type Palanca = "subir-dificultad" | "recortar-descanso" | "sumar-ronda" | "mantener" | "bajar";

sugerirProgresionVR(ultima, anteriores, rutina, perfil): SugerenciaVR
// SugerenciaVR = { palanca: Palanca | null, motivo: string,
//                  fuente: "fc" | "descanso" | "sin-medicion", nuevaPrescripcion }
```

`palanca: null` significa **"no hay medición para decidir"**. No es `mantener`: `mantener` es
una decisión medida ("estás en el techo", "estás una zona arriba"); `null` es la ausencia de
decisión, y la UI lo trata distinto (Parte 6).

**Ninguna regla lee `dificultadPercibida`.** Test que lo fije.

**Constantes nombradas al principio del módulo**, para ajustarlas sin tocar la lógica:

| Constante | Valor | Por qué |
|---|---|---|
| `PASO_DESCANSO_SEG` | 15 | |
| `PISO_DESCANSO_SEG` | 30 | Menos no es descanso |
| `TECHO_RONDAS_EXTRA` | 2 | Máximo de rondas por encima de la rutina. Cada ronda suma 4 a 10 min |
| `RECUPERACION_MINIMA_BPM` | 12 | Punto de partida para ajustar, sobre la **mediana** de `recuperacionBpm` de las rondas. Documentalo como tal, no como umbral clínico |
| `DESCANSO_SOBRA` / `DESCANSO_FALTA` | 0,7 / 1,3 | Parte 2 |

**Las reglas, en orden — gana la primera que aplica:**

1. **Rondas incompletas** → `mantener`. Si también la sesión anterior quedó incompleta →
   `bajar`: dos veces seguidas sin terminar es una medición, no un mal día.
2. **FC confiable** (Parte 2), con `fuente: "fc"`:
   - **Por debajo del objetivo** → `subir-dificultad`. **Salvo** que las dos sesiones
     anteriores ya hayan terminado en `subir-dificultad` **aceptada** y la zona siga por
     debajo: el juego no da más, y se pasa a `recortar-descanso`. Así se resuelve el techo de
     dificultad de un juego sin tener que registrar en qué nivel está.
   - **En la zona objetivo** → si la recuperación está por debajo de
     `RECUPERACION_MINIMA_BPM`, `mantener`. Si no, `recortar-descanso`; con el descanso en
     el piso, `sumar-ronda`; con las rondas en el techo, `mantener`, con el motivo *"esta
     rutina ya no te exige más: es hora de otra"*.
   - **Una zona por encima** → `mantener`.
   - **Dos o más zonas por encima** → `bajar`.
3. **FC no confiable, pero el descanso real dice algo**, con `fuente: "descanso"`:
   - te sobró descanso → `recortar-descanso` (en el piso, `mantener`). El motivo lo dice con
     el número: *"arrancaste cada ronda a los 38 s de los 60 previstos"*;
   - necesitaste más → `mantener`.
4. **Nada medido con qué decidir** → `palanca: null`, `fuente: "sin-medicion"`. El motivo dice
   **qué falta**, para que se pueda arreglar: *"no hubo curva de FC en esta sesión"*, *"la FC
   vino con artefactos en 4 de 5 rondas"*, o *"tu perfil no tiene FC máxima para calcular la
   zona"*.

**`bajar`**: primero deshace el último ajuste de la app que se haya aceptado (devuelve 15 s de
descanso o saca una ronda). Si no hay ninguno que deshacer, el consejo es *"bajá un nivel en
{juego}"*.

`subir-dificultad` y el consejo de `bajar` son **indicaciones**: la app no puede cambiar la
dificultad del juego. `recortar-descanso` y `sumar-ronda` sí cambian los parámetros de la
sesión.

---

## Parte 6 — La tarjeta, al abrir la rutina VR

Arriba de todo, antes de empezar, usando el mismo lenguaje visual que `SugerenciaChip`:

```
La última vez · jue 18/9
5 de 5 rondas · FC de trabajo 142 (Z3) · objetivo Z4

Subí un nivel la dificultad de PowerBeatsVR.
                                     [Entendido]  [No esta vez]
```

- Una línea de datos, **solo con lo medido**, y una de sugerencia. La sensación no aparece
  en la tarjeta.
- Si `fuente` es `"descanso"`, la línea de datos lo dice: *"sin FC confiable — decidido por el
  descanso que tomaste"*.
- Botones: para las palancas que cambian parámetros, **[Aplicar]** y **[Como la última
  vez]**; para las indicaciones, **[Entendido]** y **[No esta vez]**. La persona siempre
  tiene la última palabra: el sistema sugiere, no impone.
- **Con `palanca: null`**, la tarjeta no inventa una sugerencia:

  ```
  La última vez · jue 18/9
  5 de 5 rondas · la FC vino con artefactos en 4 de 5 rondas

  Sin una medición confiable no hay con qué decidir. Elegí vos:
  [Como la última vez]  [Recortar descanso]  [Sumar ronda]  [Más fácil]
  ```

- Se guarda en la sesión nueva: `Historial.progresionVR?: { palanca, aceptada: boolean,
  fuente: "fc" | "descanso" | "manual" }`. Lo elegido a mano queda como `"manual"`, para que
  el análisis nunca lo confunda con una decisión medida. Es lo que usa la regla 2 para ver
  si la dificultad ya se subió dos veces, y es el mismo lazo de evaluación que la posición en
  el ranking de P73: si Juan rechaza siempre una palanca, la regla está mal.
- Sin historia de esa rutina y ese juego, **no hay tarjeta**.

### §9.3 — Cuando la muñeca no sirve para ese juego

Con criterio medido, no por comparación con la sensación. Si **3 de las últimas 5** sesiones
del mismo juego tuvieron la FC no confiable **por artefactos** (no por falta de curva, que es
otro problema), la tarjeta suma una línea:

```
En Creed la muñeca no viene midiendo bien: 3 de tus últimas 5 sesiones con FC dudosa.
```

Se recalcula del historial cada vez. No se guarda.

---

## Tests

- **Parte 0**: los casos de la meta.
- **Parte 1**: una sesión en versión 3 se omite; una en versión 2 con curva disponible se
  re-enriquece; una en versión 2 **sin** curva disponible queda intacta.
- **Parte 2**:
  - una ronda con 20 muestras no tiene `fcMedia`;
  - la FC de trabajo pondera por duración;
  - **una sesión con rondas a 150 y descansos a 110 da FC de trabajo 150, no el promedio de
    sesión** — este es el test que atrapa el sesgo que motiva todo el prompt;
  - una ronda con 8 % de saltos de 35 bpm queda `fcDudosa`, una con 3 % no; una con
    `fcPico` por encima de `fcMaxTeorica + 10` queda `fcDudosa`;
  - las rondas dudosas no entran en la FC de trabajo;
  - el descanso real es la mediana de los intervalos, y un intervalo raro no la mueve.
- **Parte 4**: la segunda sesión arranca con los parámetros de la primera más el ajuste
  aceptado; con el ajuste rechazado, arranca igual que la primera; un juego sustituido no
  hereda la historia del otro.
- **Parte 5**, una por regla:
  - incompleta → mantener; dos incompletas seguidas → bajar;
  - por debajo → subir dificultad; por debajo con dos subidas aceptadas → recortar descanso;
  - en zona con mala recuperación → mantener; en zona → recortar; en el piso → sumar ronda;
    en el techo → mantener;
  - una arriba → mantener; dos arriba → deshace el último ajuste; dos arriba sin ajuste que
    deshacer → consejo;
  - sin FC y con descanso de sobra → recortar; sin FC y con descanso de más → mantener;
  - **sin FC y con descanso normal → `palanca: null`**, con el motivo de qué falta;
  - **la misma sesión con `dificultadPercibida` suave, normal, intenso o ausente da
    exactamente la misma sugerencia** — el test que fija que la sensación no decide.
- **Parte 6**: con `palanca: null` se ofrecen las opciones y lo elegido se guarda como
  `"manual"`.
- **§9.3**: 3 de 5 sesiones con artefactos muestra el aviso; 3 de 5 sin curva no.
- **Aislamiento de P74**: otra vez.

`npx tsc -b`, la suite completa y `npm run build`.

---

## Fuera de alcance

- Métricas VR en la vista por ejercicio (§9.4): es Bloque 7.
- Registrar el nivel de dificultad del juego.
- Tocar la definición de las rutinas VR en `/rutinas`.

---

## Documentación

- ADR #038 (enriquecimiento versionado) y ADR #039 (progresión VR derivada del historial).
- Cabecera de `progresionVR.ts` con la escalera, las reglas y por qué la FC de sesión no
  sirve.

Guardá este prompt como `docs/prompts/79-vr-con-progresion.md`.

---

## Al terminar, reportá

La cuota ya volvió: esta vez sí se puede leer. **Leé lo justo**: `/historial` del miembro,
`/rutinas` de VR y `/config/perfiles`. No leas `/cardio`.

1. El diff por archivo, resumido.
2. Tests, `tsc` y build.
3. **Si el perfil de `juanpablo` tiene `zonasFC` o `fcMaxTeorica`.** Si no tiene ninguno de
   los dos, la FC no va a decidir nunca y todo va a salir por la sensación. Decímelo
   primero, porque es lo único que Juan tiene que cargar a mano.
4. Cuántas sesiones VR hay en el historial, y **qué sugeriría hoy la regla para cada rutina
   VR**, con su motivo.
5. Cuántas sesiones quedarían desactualizadas de versión y se re-enriquecerían en el
   próximo import.
6. Cualquier punto donde hayas parado o te hayas apartado del prompt.
