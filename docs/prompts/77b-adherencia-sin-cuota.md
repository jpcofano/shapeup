# 77b — La serie sin pagarla en cada visita

Corrige P77a antes de commitear. Va todo junto en el mismo commit que P77a.

P77a está bien salvo en un punto: **Home pasó de ~25 a ~300 lecturas de `/cardio` por
visita**. Home es la pantalla de aterrizaje —se abre veinte veces por día—, así que son
~6000 lecturas diarias solo por abrir la app. Es el mismo problema que P76b acababa de
sacar de Salud, reaparecido en otro lado. La cuota ya se agotó dos veces esta semana.

El aumento no hace falta. **Las decisiones están cerradas.** Si algo es inviable, **pará y
reportá**. No commitees.

---

## Parte 1 — Home no lee 12 semanas de `/cardio`

La clave: `rachaActual`, `rachaRecord` y `tasaCumplimiento` dependen **solo de
`diasPlan`**, y los días de plan salen de `getHistorialShapeUp` — que Home **ya trae
entero** y hoy son 9 documentos. `cumplida` es `diasPlan >= meta`: el movimiento no entra.

Los días de movimiento sirven para dos cosas nada más: el sufijo de la **semana en curso** y
el gráfico de Progreso.

Entonces:

- Home vuelve a pedir `getDiasActivos` de **la semana en curso**, como antes de P77a.
- La serie completa (`seriesDeAdherencia`) se arma desde el historial de ShapeUp, que ya
  está en memoria. **Cero lecturas nuevas.**
- Las 12 semanas se mueven a Progreso (Parte 3).

El saldo: Home queda igual que antes de P77a, con la tarjeta nueva y todo.

---

## Parte 2 — `diasMovimiento: number | null`

Código actual: en Progreso, los días de movimiento salen de las actividades traídas hasta
ese momento, así que una semana vieja puede mostrar menos movimiento del que hubo. Está
comentado en el código como asimetría conocida, y es justo el patrón que nos viene saliendo
caro: **un cero por omisión que se lee como un hecho.**

```ts
diasMovimiento: number | null;   // null = no se cargaron las actividades de esa semana
```

- `seriesDeAdherencia` recibe qué rango de fechas tiene datos de movimiento cargados y pone
  `null` fuera de ese rango. No infiere cero.
- El sufijo "· N días de movimiento" **no se dibuja** cuando es `null`. No se muestra un
  guion, ni un cero, ni un "sin datos": no se dibuja.
- `diasPlan`, `cumplida`, la racha, el récord y la tasa no cambian nunca por esto, porque no
  dependen del movimiento. Test que lo fije.

Con esto el tipo impide el bug en vez de comentarlo.

---

## Parte 3 — Progreso carga lo suyo, y lo cachea

- Las 12 semanas se piden **al abrirse el panel de Progreso**, no al montar Home.
- **Caché de semanas cerradas en `localStorage`.** Una semana cerrada (su domingo ya pasó)
  no cambia nunca salvo import, así que se guarda y no se vuelve a leer:
  - clave `da1-{miembro}-{semanaInicio}`, valor los `DiaActivo[]` de esa semana (≤ 7 objetos
    chicos);
  - el prefijo lleva versión (`da1-`) para que un cambio de forma de `DiaActivo` no lea
    estructuras viejas;
  - **la semana en curso nunca se cachea**;
  - al terminar un import se borran todas las claves `da1-*`, porque un import puede
    reescribir semanas viejas;
  - si `localStorage` no está disponible o tira, se sigue sin caché. Nunca se rompe por
    esto.

Steady state: la primera visita a Progreso después de un import lee las 12 semanas; las
siguientes, solo la semana en curso.

**Esto no contradice el ADR #037.** La racha se sigue derivando del historial en cada
cálculo: lo que se cachea son los días leídos de `/cardio`, y se reconstruyen enteros desde
la fuente. Es una caché, no un acumulador. Dejalo escrito en el ADR en una línea, para que
dentro de seis meses no parezca una excepción.

---

## Parte 4 — El tope de paginado deja de ser silencioso

El tope de 10 páginas que agregaste como red de seguridad está bien, pero **truncar en
silencio** es el bug que venimos persiguiendo.

Si se alcanza el tope, `getDiasActivos` lo informa en su resultado (una marca
`truncado: true`, no un `console.warn` que nadie ve), y el llamador muestra que el rango
está incompleto en vez de dibujar semanas vacías que no lo están.

---

## Tests

- Home arma la serie sin leer `/cardio` fuera de la semana en curso: la racha, el récord y
  la tasa dan igual con y sin días de movimiento cargados.
- `diasMovimiento` es `null` fuera del rango cargado, y el sufijo no se dibuja.
- Una semana cerrada sale de la caché en la segunda llamada; la semana en curso se pide
  siempre.
- El import borra las claves `da1-*`.
- `truncado: true` cuando se alcanza el tope de páginas.
- **Aislamiento de P74**: otra vez, sin cambios.

Corré la suite completa y `npx tsc -b`.

---

## Al terminar, reportá

1. El diff por archivo, resumido.
2. **Cuántas lecturas hace Home al abrir, ahora**, contra las ~25 de antes de P77a y las
   ~300 de P77a. Quiero el número, no "volvió a estar bien".
3. Cuántas hace Progreso la primera vez y cuántas la segunda.
4. Tests y `tsc`.
5. Cualquier punto donde hayas parado o te hayas apartado.

Guardá este prompt como `docs/prompts/77b-adherencia-sin-cuota.md`.
