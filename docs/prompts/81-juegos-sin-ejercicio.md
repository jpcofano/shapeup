# 81 — Juegos que se registran pero no cuentan

Repo: jpcofano/shapeup. Va después de P80: reusa su pantalla de sesión por tiempo.

## Qué problema resuelve

Juan juega juegos de VR que **no son entrenamiento**: Behemoth, Drums Rock y Rock. Quiere que
queden **en el historial y en el análisis**, pero que **no cuenten como ejercicio**. No sabe si
le sirven de algo, y justamente para eso: **que los datos lo digan**.

Por eso lo que vale acá es la FC. Registrar "40 minutos de Behemoth" solo no dice nada;
registrarlo con su FC y su zona dice si ese juego te mueve o no.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — La trampa, primero

`lib/tipoHistorial.ts` define hoy:

```ts
esShapeUp(h) = tipoDe(h) !== "externa"
```

Es una lista **negativa**: todo lo que no sea externa cuenta como entrenamiento. Un tipo nuevo
`"juego"` entraría solo en la racha, la meta, la adherencia, el tonelaje y la progresión.

- **`esShapeUp` pasa a lista positiva**: `tipo === "rutina" || tipo === "libre"` (con el
  default `"rutina"` de `tipoDe` para los documentos viejos). Así, ningún tipo que se agregue
  en el futuro cuenta por omisión.
- `Historial.tipo` suma `"juego"`, con `esJuego` y `soloJuegos`.
- **Antes de tocar nada más**, un test de aislamiento: con sesiones de juego en el historial,
  la racha, la meta, la adherencia, el tonelaje, la progresión **y los días de movimiento** no
  se mueven. Escribilo primero y verificá que falle con la definición vieja.

---

## Parte 2 — Qué cuenta y qué no

| | ¿Cuenta un juego? |
|---|---|
| Racha, meta, adherencia, tasa | **No** |
| Tonelaje, progresión, PR | **No** |
| Chips de la tira semanal y días de movimiento | **No** — Juan: *"que no cuenten como ejercicio"* |
| Historial | **Sí**, con chip *juego* |
| Enriquecimiento con FC | **Sí** — es lo único que lo hace útil |
| Análisis | **Sí** (Parte 5) |

**El enriquecimiento** corre hoy sobre `soloShapeUp(historial)`, así que dejaría los juegos
afuera. Predicado nuevo, `seEnriquece(h)`: rutina, libre **o juego**. Lo que se enriquece y lo
que cuenta pasan a ser dos cosas distintas, y el código lo dice con dos nombres.

---

## Parte 3 — La lista de juegos

- En `/config/diccionarios`: `juegosSinEjercicio: string[]`, sembrada con
  `["Behemoth", "Drums Rock", "Rock"]`.
- Editable desde la app (agregar, renombrar, quitar), sin tocar código. Con un campo de texto
  alcanza.
- Las reglas ya dicen que `/config/diccionarios` lo escribe **solo el owner** de la familia. La
  edición se muestra solo al owner; para el resto, la lista es de lectura. **No cambies la
  regla.**
- Quitar un juego de la lista **no borra** sus sesiones: quedan en el historial con su nombre.

---

## Parte 4 — Registrar una sesión de juego

- En Entrenar, **"Sesión de juego"**: elegís el juego de la lista y arrancás.
- **La misma pantalla de P80**: el reloj en grande y **Terminar**, sin objetivo de tiempo.
- Se guarda como `tipo: "juego"`, con `nombreJuego`, la ventana de la app y sin bloques.
- Al cerrar, **ni chip de dificultad ni RPE**: no hay progresión que alimentar.
- **Para que haya FC**: se arranca el workout "Shape up" en el reloj, como siempre. El match
  por custom-id (P78) lo engancha con la sesión igual que con cualquier otra. Decilo en una
  línea chica en la pantalla, para que Juan no tenga que acordarse.

---

## Parte 5 — El análisis: que los datos contesten

En Historial → Progreso, una sección **Juegos**, abajo de todo, con una fila por juego:

```
Behemoth       6 sesiones · 4 h 10 min · FC 128 · 70 % del tiempo en Z2–Z3
Drums Rock     3 sesiones · 1 h 30 min · FC 112 · mayormente Z1–Z2
```

- Solo con lo medido: si un juego no tiene sesiones con FC confiable, la fila lo dice (*"sin
  FC todavía"*) en vez de mostrar números vacíos.
- **Las kcal no se muestran.** En actividades de brazos el reloj las infla (roadmap §9.5):
  mostrarlas sería mostrar un número que sabemos que está mal.
- Sin juegos registrados, la sección no aparece.

La pregunta que esto contesta es la de Juan: *¿estos juegos me mueven?* Si con semanas de datos
uno aparece consistentemente en Z3 o más, la decisión de hacerlo contar se toma **con esos
números**, no antes.

---

## Tests

- **Parte 1**: el test de aislamiento, escrito primero, falla con la definición vieja y pasa
  con la nueva; un tipo inventado (`"otro"`) tampoco cuenta.
- **Parte 2**: un juego se enriquece; un juego no aparece en los días de movimiento ni en los
  chips.
- **Parte 3**: quitar un juego de la lista no toca sus sesiones.
- **Parte 5**: las cifras por juego ponderan la FC por duración; un juego sin FC confiable dice
  *"sin FC todavía"*.
- Todo lo de P74 a P80 sigue verde.

`npx tsc -b`, la suite y `npm run build`.

**No hace falta tocar `firestore.rules`**: `/historial` no valida `tipo`, y
`/config/diccionarios` ya lo escribe el owner. Si igual creés que hay que tocarlas, **pará y
reportá**: en esta máquina no se pueden correr los tests de reglas, y no se deployan reglas sin
probar.

---

## Al terminar, reportá en `ultimochat.md`

Nada de leer Firestore: alcanza con fixtures.

1. El diff, resumido.
2. Tests, `tsc` y build.
3. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/81-juegos-sin-ejercicio.md`.
