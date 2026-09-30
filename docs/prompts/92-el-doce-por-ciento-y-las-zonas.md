# 92 — El 12 % y los minutos por zona

Repo: jpcofano/shapeup. Va después de P91.

## Qué problema resuelve

Dos cosas, y las dos vienen del mismo pedido: **que la sesión se enriquezca tal cual lo hace
Samsung Health cuando las dos ventanas son casi la misma, y que donde podamos hacerlo mejor, lo
hagamos.**

**Una.** P78 recorta la ventana de Samsung a la de la app, y eso está bien cuando el reloj quedó
corriendo media hora de más. Pero el caso normal no es ese: el caso normal es que se apretó
"empezar" en el reloj unos segundos antes y "terminar" unos segundos después, y ahí P78 recorta
por nada, prorratea calorías que no hacía falta prorratear, y las marca como estimadas. Un
minuto de diferencia sobre cincuenta no es un olvido de corte: es apretar dos botones con la
mano.

**Dos.** Health reparte los minutos por zona **de toda la sesión**. Nosotros sabemos a qué
ejercicio pertenece cada minuto, así que podemos repartirlos por ejercicio, y eso no lo hace
ninguna de las dos apps. Hoy `CardioTab` hace lo contrario de fino: le asigna a la actividad
**entera** una sola zona, la de su FC media. Cincuenta minutos que pasaron por Z2, Z4 y Z3 se
dibujan como cincuenta minutos de Z3.

**Ojo con un supuesto:** el SDK de Samsung nos da duración, calorías y FC media, máxima y mínima.
**No nos da los minutos por zona.** Los minutos por zona los calculamos nosotros de la curva —
por eso podemos darlos por ejercicio, y por eso pueden no coincidir exactamente con lo que
muestra la app de Health.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — La tolerancia del 12 %

En `lib/matchBiometrico.ts`, `TOLERANCIA_DURACION = 0.12`.

**La ventana de Samsung se adopta entera** —sin recortar, sin prorratear— cuando se cumplen las
tres:

1. `|durSamsung - durApp| / durApp <= 0.12`, con `durApp` la ventana de la app (el denominador es
   la app porque la app es la autoridad sobre cuánto duró la sesión) y `durSamsung` la **unión**
   de los tramos de reloj de pared, no la suma: dos tramos que se pisan no cuentan dos veces.
2. **Ningún tramo se pasa del fin de la ventana por más de `OLVIDO_CORTE_MS`.** Con 12 % sobre
   cincuenta minutos son seis, así que la primera condición casi siempre alcanza; esta está para
   la sesión corta, donde el 12 % es un minuto y medio y un olvido de corte de dieciséis minutos
   tiene que quedar afuera igual.
3. **La ventana no es sintética.** Una ventana estimada por fecha no tiene con qué comparar
   porcentajes: comparar contra una suposición da un número que parece medido y no lo es.

Cuando se adopta:

- el intervalo de cálculo es la **unión** de la ventana de la app y los tramos: se toman todas
  las muestras que Samsung tiene para esos tramos;
- las **calorías van enteras**, de la fila, y **no** se marcan `kcalEstimada`;
- la FC media, la máxima, la mínima y la cobertura se calculan sobre ese intervalo. Que la
  cobertura se mida contra una ventana un poco más grande es correcto: es la ventana que se usó.

Cuando **no** se adopta, no cambia nada: recorte, prorrateo, `kcalEstimada`, `motivoCobertura`,
todo P78 tal cual está.

En los dos casos, `biometria` guarda **por qué**:

| Campo | |
|---|---|
| `ventanaAdoptada` | `'app'` · `'samsung'` |
| `desfaseDuracionPct` | el número que decidió, redondeado a un decimal, **con signo** (positivo = Samsung duró más) |

Con esos dos campos, dentro de tres meses se puede mirar una sesión y saber qué se hizo con ella
y por qué. Sin ellos, no.

**Lo que no cambia, y va como ADR #043:** la duración de la sesión **sigue siendo la de la app**.
`duracionRealMin` no se toca, la adherencia no se toca, la racha no se toca. Lo que la tolerancia
decide es **qué muestras entran en la biometría**, no cuánto duró la sesión. ADR #042 sigue
entero; este lo complementa y no lo contradice.

---

## Parte 2 — Lo que dice Health, guardado como lo que es

Sub-objeto nuevo en `BiometriaSesion`, **siempre**, se haya adoptado la ventana o no:

```ts
samsung?: {
  inicioMs: number;
  finMs: number;
  /** `endMs - startMs` del tramo principal: reloj de pared. */
  duracionVentanaMin: number;
  /** El `duration` que declara la fila, que NO cuenta las pausas. Puede ser menor. */
  duracionDeclaradaMin?: number;
  kcal?: number;
  fcMedia?: number;
  fcMax?: number;
  fcMin?: number;
  datauuids: string[];
}
```

Es "lo que dice Health, tal cual", **al lado** de lo nuestro y nunca en lugar de lo nuestro. Sirve
para tres cosas concretas: que el detalle pueda mostrar las dos cifras cuando difieren, que el
paquete de análisis (P93) las lleve sin recalcular nada, y que se pueda auditar una decisión de
la Parte 1 sin volver a bajar el ZIP.

**Las dos duraciones son distintas a propósito.** La declarada no cuenta las pausas, la de
ventana sí. La que decide la tolerancia es **la de ventana**, porque la pregunta es qué intervalo
tiene muestras, no cuánto tiempo el reloj se consideró activo.

---

## Parte 3 — Minutos por zona, de la curva

Módulo nuevo y puro: **`lib/minutosPorZona.ts`** (ADR #009, sin Firebase ni React).

`minutosPorZona(curva, ventana, perfil)` → `{ porZona: Partial<Record<ZonaFC, number>>, minutosSinDato: number }`.

El método, explícito porque acá es donde se inventan minutos si uno se descuida:

- Las muestras se ordenan y se recortan a la ventana.
- Cada **par de muestras consecutivas** aporta su intervalo a la zona del **promedio de las dos**.
  Atribuir por muestra suelta cuenta mal cuando el muestreo es irregular; por intervalo, los
  minutos suman lo que suman.
- **Hueco mayor a `MAX_HUECO_ZONA_MS = 60_000` no se atribuye a ninguna zona**: va a
  `minutosSinDato`. Ahí no sabemos qué pasó, y un minuto inventado en Z2 es peor que un minuto
  declarado sin dato.
- Lo que sobra de la ventana antes de la primera muestra y después de la última, también a
  `minutosSinDato`.
- **La suma de las zonas más `minutosSinDato` da la ventana.** Es la invariante y va como test.
- Sin `zonasFC` ni `fcMaxTeorica` en el perfil, **no se devuelve nada**: sin zonas no hay zonas.
  No se inventa una FC máxima por edad acá; eso ya lo decide `derivarZona` con lo que tenga.
- Los minutos se redondean **al final**, no por tramo, y el redondeo se reparte de modo que la
  suma siga cerrando.

`BiometriaSesion` suma `minutosPorZona?: Partial<Record<ZonaFC, number>>` y
`minutosSinDato?: number`. `zonaPrincipal` **se queda como está**: sigue siendo la zona de la FC
media, se usa en varios lados, y son dos preguntas distintas.

---

## Parte 4 — Minutos por zona por ejercicio

Esto es lo que ninguna de las dos apps da.

- `BloqueRegistro` suma `minutosPorZona?: Partial<Record<ZonaFC, number>>`.
- Lo escribe `enriquecerBloquesConCurva`, que ya recorre los bloques con la curva en la mano.
- La ventana del bloque va del `inicioMs` de su primera serie al `finMs` de la última,
  **descansos de adentro incluidos**: la pregunta es en qué parte de la sesión estuviste arriba,
  y el descanso entre series de un mismo ejercicio es parte de ese ejercicio.
- Sin `inicioMs`/`finMs` sellados en las series, o sin curva en esa ventana, **el campo no se
  escribe**. Un bloque sin medición no tiene minutos estimados: no tiene minutos.
- Nada de esto entra en tonelaje, progresión ni adherencia. Es descripción de lo que pasó.

---

## Parte 5 — Que se vea, y que `CardioTab` deje de mentir

- **`CardioTab`, "Distribución por zona"**: si la actividad tiene `minutosPorZona`, se usa eso.
  Si no, se sigue usando la aproximación de hoy (duración entera a la zona principal) **pero
  etiquetada**: *"estimado por zona principal"*. Hoy las dos cosas se dibujan igual y no hay modo
  de distinguirlas, que es la parte grave.
- **Detalle de la sesión**: una barra de zonas de la sesión, y en cada ejercicio su reparto
  cuando lo tenga. Chica, en línea, sin pantalla nueva.
- Cuando `ventanaAdoptada === 'samsung'` y el desfase no es cero, el detalle lo dice en una línea
  discreta: *"se tomó la ventana del reloj (2,8 % más larga)"*. Es información, no advertencia.
- `minutosSinDato` se muestra solo si pasa de un minuto, como un tramo gris al final de la barra.
  Es el hueco que hasta ahora no se veía.

---

## Parte 6 — Reprocesar lo que ya está

`VERSION_ENRIQUECIMIENTO` pasa de 5 a **6**. La maquinaria del ADR #038 ya hace el resto: las
sesiones finas de versión vieja se recalculan solas en la próxima importación, y las gruesas
tampoco se pisan con algo peor.

- **No** hace falta un script nuevo. Si te parece que sí, **pará y reportá antes de escribirlo**.
- Las cinco ventanas de VR que corrigió P84 no se tocan: ese arreglo era de `inicioMs`/`finMs` del
  historial, no de biometría.

---

## Tests

- **Tolerancia**: 11,9 % adopta; 12,1 % recorta; exactamente 12 % adopta (el `<=` es la decisión y
  quiero que esté fijado en un test). **Los dos signos**: Samsung más largo y Samsung más corto.
- Samsung 16 min más largo que el fin de la ventana **no adopta**, aunque el porcentaje diera.
- Ventana sintética **nunca** adopta.
- Adoptada: `kcal` entero, **sin** `kcalEstimada`, y `desfaseDuracionPct` con el signo correcto.
- No adoptada: todo igual que los tests de P78 (que no se rompa ninguno es parte del test).
- **Zonas**: la suma de zonas más `minutosSinDato` da la ventana, con muestreo irregular; un
  hueco de 5 min no se atribuye; sin zonas ni FC máxima no devuelve nada; una curva entera en una
  sola zona da esa zona y nada más.
- **Por ejercicio**: dos ejercicios en ventanas distintas reparten distinto; un bloque sin series
  selladas no recibe el campo.
- `samsung.duracionDeclaradaMin` menor que la de ventana cuando la fila trae pausas, y la
  tolerancia decidiendo con la de ventana.

`npx tsc -b`, la suite, `npm run build`, `npm run test:rules`.

---

## Fuera de alcance

- Los minutos por zona que muestra la app de Samsung. **El SDK no los da.** Si aparece un campo
  que los traiga, **pará y reportá**: comparar los suyos con los nuestros es una conversación,
  no una decisión tuya.
- Tocar adherencia, racha, tonelaje o progresión. Nada de este prompt entra en un número que
  cuenta.
- Zonas por serie. La serie ya tiene `fcMedia` y `fcPico`; repartir dos minutos en cinco zonas no
  agrega nada.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido.
2. **Sobre mis sesiones reales**: cuántas quedan con `ventanaAdoptada: 'samsung'` y cuántas con
   `'app'`, y la lista de desfases. Quiero ver si el 12 % es el número correcto o si en la
   práctica casi todas caen de un lado.
3. Cuántas sesiones quedan con `minutosPorZona` y cuántas sin, con el motivo de las que no.
4. Tests, `tsc`, build y reglas.
5. El ADR #043 en `CLAUDE.md`, con el 12 % y el motivo, y la línea de que la duración de la
   sesión sigue siendo la de la app.
6. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/92-el-doce-por-ciento-y-las-zonas.md`.

---

# 92 — Enmienda a la Parte 3: la zona es la más alta cuyo piso alcanzaste

Esto **enmienda la Parte 3 de P92** y responde la pregunta con la que paraste. Pegalo al final de
`docs/prompts/92-el-doce-por-ciento-y-las-zonas.md`, con este título, para que el prompt quede
completo en el repo. Los tres casos que encontraste son uno solo.

## La regla

**La zona de un intervalo es la más alta cuyo piso alcanzó.** Se recorre Z5 → Z1 y gana la
primera con `fc >= z.min`. **El techo no se mira.**

Con eso, los tres casos dejan de ser casos:

| Lo que encontraste | Qué pasa con la regla |
|---|---|
| 101,5 entre el techo de Z1 y el piso de Z2 | Z1 — alcanzó el piso de Z1 y no el de Z2 |
| Por encima del techo de Z5 | Z5 — no hay zona más alta |
| Por debajo del piso de Z1 | Ninguna → `minutosBajoZonas` |

Vale igual con las bandas teóricas por porcentaje de FC máxima: son contiguas, así que no hay
grietas, y lo único que cambia es que por arriba del techo de Z5 ahora cuenta como Z5 en vez de
quedar sin zona.

## El campo y la invariante

- `minutosBajoZonas?: number` en `BiometriaSesion`, **y también en `BloqueRegistro`**, con la misma
  forma que `minutosPorZona`: en una sesión de fuerza el descanso entre series es casi todo tiempo
  bajo Z1, y esa cifra es la que hace visible la densidad real.
- La invariante pasa a ser **zonas + bajo zonas + sin dato = ventana**, y sigue siendo un test.
- **Bajo zonas no es lo mismo que sin dato**, y no se suman ni se dibujan juntos: uno es "estuviste
  tranquilo", el otro es "no sabemos". Confundirlos sería perder el sentido de haberlos separado.

Contar lo que está bajo Z1 como Z1 queda **descartado**: infla justo la zona que se mira para
saber si la sesión movió algo, con minutos de reposo.

## Y unificá `derivarZona` con la misma regla

`derivarZona` tiene la misma grieta: una FC media de 101,5 devuelve hoy `undefined` y la sesión
queda **sin `zonaPrincipal`**. Si no se unifica, van a existir sesiones con minutos por zona y sin
zona principal, que es incoherente y no hay forma de explicarlo después.

Un solo helper con la regla, usado por `derivarZona` y por `minutosPorZona`. Que no queden dos
implementaciones de lo mismo: es exactamente el tipo de cosa que se desincroniza sola.

**El cambio solo puede agregar zonas donde hoy no hay ninguna, nunca mover una existente.** Así
que:

- los tests actuales de `derivarZona` tienen que **seguir pasando tal cual**. Si alguno cambia,
  **pará y reportá**: significa que la grieta era más grande de lo que pensamos y quiero verlo antes
  de que se escriba en Firestore;
- sumá dos tests: FC en una grieta entre zonas a medida devuelve la de abajo, y FC por encima del
  techo de Z5 devuelve Z5;
- en el reporte, **cuántas de mis sesiones ganan `zonaPrincipal`** con esto. Si son varias, eran
  varias las que se mostraban sin zona sin que nadie entendiera por qué.

## En la pantalla

En la barra de zonas, el tramo **bajo zonas** se dibuja aparte del gris de **sin dato**, y ambos
solo si pasan de un minuto. Con una etiqueta que se entienda sin leer documentación: "bajo Z1" y
"sin dato".
