# 84 — Las ventanas viejas, y tres limpiezas

Repo: jpcofano/shapeup. Parte de `2b82159`. Es corto: un script y tres arreglos.

## La decisión

**Manda el tiempo de la app.** Es el ADR #042 aplicado hacia atrás.

Las sesiones de VR anteriores a P80 tienen la ventana (`inicioMs`/`finMs`) derivada de las
rondas que se marcaron, y miden entre 10 y 24 minutos menos que `duracionRealMin`. No es un
detalle estético: con la ventana corta esas sesiones se leen como **incompletas**, y P80 no
progresa sobre sesiones incompletas. Sin este arreglo, la progresión de VR queda clavada en
`mantener` aunque Juan empiece a jugar completo.

`duracionRealMin` no es un dato inventado: es el reloj de la app, la misma fuente que el ADR
#042 declara autoritativa. Se está eligiendo el mejor de dos registros de la app, no
inventando uno.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — `scripts/corregir-ventanas-vr.ts`

**Simulación por defecto**, `--aplicar` para escribir. Mismo patrón que
`corregir-mecanica.ts`.

**A quién toca**: sesiones de `/historial` donde
`(finMs − inicioMs) < duracionRealMin × 60000 − TOLERANCIA_MS`, con
`TOLERANCIA_MS = 2 × 60000`. No solo VR: si a una sesión de fuerza le pasa lo mismo, el
criterio vale igual, pero **decilo aparte en el reporte** — que aparezca una de fuerza sería
otro problema y quiero verlo.

**Qué escribe**: `finMs = inicioMs + duracionRealMin × 60000`. `inicioMs` no se toca: es el
arranque sellado de la sesión.

**Guardas, todas obligatorias:**

- Sin `inicioMs` o sin `duracionRealMin`, **no se toca** y se informa.
- La ventana nueva **no puede pasar el `inicioMs` de la sesión siguiente** del mismo miembro.
  Si lo pasara, se recorta hasta ahí y se marca en el reporte: una ventana que se come la
  sesión siguiente le robaría sus tramos de Samsung (P78).
- `update()`, **nunca `set()`**.

**Y lo más importante: invalidar el enriquecimiento.** La biometría de esas sesiones se
calculó con la ventana vieja, así que queda mal. El script **no la recalcula** —no tiene la
curva—: le saca `versionEnriquecimiento` a la biometría (o la pone en 0) para que la próxima
sincronización del puente la rehaga con la ventana correcta, gracias al versionado del ADR
#038. **Dejá el resto de la biometría como está**: si la sincronización no corre, es preferible
un dato viejo a ninguno.

**Reporte del script**, una línea por sesión: fecha, rutina, ventana vieja en minutos, nueva,
cuántos minutos gana, y si se recortó por la guarda de la sesión siguiente.

---

## Parte 2 — Que la suite no necesite Firebase

`src/lib/adaptadorSdk.test.ts` importa `idCardioDe` de `data/salud.ts`, y ese archivo
inicializa Firebase. Sin `.env.local` el archivo **no carga y se pierden los 60 tests que
tiene**, con un error de Firebase que no da ninguna pista de que lo que falta es un archivo de
configuración. En una máquina recién armada eso manda a cualquiera para el lado equivocado.

- `idCardioDe` es pura (arma `CAR-{datauuid}`): mudala a un módulo puro de `lib/` y que
  `data/salud.ts` la importe de ahí. El test la toma del módulo puro.
- Si hay otros tests que traen Firebase por un camino parecido, mudalos igual y decilo.
- Verificalo como se verifica de verdad: **renombrá `.env.local` un momento, corré la suite y
  fijate que siga verde**, y después devolvelo a su lugar.

---

## Parte 3 — Los scripts sueltos, con alias

`corregir-mecanica.ts` y `serie-adherencia.ts` están escritos desde la corrida nocturna del
21/09 y **nunca se corrieron**, y no tienen alias en `package.json`. Un script sin alias es un
script que nadie encuentra.

- Alias: `corregir:mecanica`, `corregir:ventanas`, `serie:adherencia`, `dry-run:puente`.
- **Corré `corregir-mecanica` y `serie-adherencia` en simulación** y pegá las dos salidas en el
  reporte. **No apliques nada**: las cuatro fichas de mecánica las aplica Juan.

---

## Parte 4 — Dos verificaciones de la máquina nueva

`docs/ESTADO-DEL-PROYECTO.md` dice que en la máquina vieja `npx vitest run` necesitaba
`--pool=threads` y que no había Java.

- **Probá `npx vitest run` sin el flag.** En un clon limpio del repo corre bien sin él, así que
  es probable que fuera una traba de la máquina vieja. Si acá también anda, **sacá esa
  advertencia** de `ESTADO-DEL-PROYECTO.md`.
- **Si esta máquina tiene Java, corré `npm run test:rules` una vez.** Esas 82 reglas no se
  prueban desde hace meses y gobiernan todas las escrituras. Si falla alguna, **pará y
  reportá**: no las arregles sin que lo veamos.

---

## Tests

- Del script: una sesión con ventana corta se corrige; una sin `duracionRealMin` no se toca;
  una cuya ventana nueva pisaría la sesión siguiente se recorta; la biometría queda sin
  versión y con el resto intacto; en simulación no se escribe nada.
- Parte 2: la suite entera corre sin `.env.local`.
- Todo lo anterior sigue verde.

`npx tsc -b`, la suite y `npm run build`.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido.
2. **La salida de la simulación de las tres correcciones**: ventanas, mecánica y adherencia.
3. Cuántas sesiones corrige el script de ventanas, cuántos minutos gana cada una, y si alguna
   es de fuerza.
4. Si `vitest` anda sin `--pool=threads`, y si `test:rules` pudo correr y con qué resultado.
5. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/84-ventanas-viejas-y-limpieza.md`.
