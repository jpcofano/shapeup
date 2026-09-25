# 87 — Que ningún script mienta

Repo: jpcofano/shapeup. Va después del commit de P84/P85/P86.

## Qué problema resuelve

Un import faltante en `corregir-ventanas-vr.ts` llegó hasta el momento de escribir en
producción. No lo detectó nada, y la razón es de fondo: **`tsc -b` revisa `src/` y no revisa
`scripts/`**. El código que escribe en Firestore —a mano, sin UI, sin nadie mirando la
pantalla— es el único del repo sin chequeo de tipos. Es exactamente al revés de lo que
convendría.

Y la revisión de los demás scripts mostró que el problema no era uno solo: hay scripts que
escriben en tandas sin decir qué escribieron, que cuentan antes de confirmar, que salen con
código 0 aunque hayan fallado, y **dos que dicen "escritas" en simulación**. Ese último es el
peor de todos: una simulación que miente es peor que no tener simulación, porque da confianza
para aplicar.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — `tsc` revisa `scripts/`

- Un `tsconfig` para `scripts/`, incluido en `tsc -b`, con el mismo rigor que `src`.
- Si aparecen errores viejos, **no los arregles todos de una**:
  - arreglá **ahora** los de los scripts que escriben en Firestore;
  - de los demás, **listá el conteo por archivo en el reporte** y no los toques. Vemos juntos
    cuáles vale la pena mantener y cuáles borrar.
- Una línea en `CLAUDE.md`, en las reglas que no se re-discuten: **los scripts se chequean
  como el resto; son el código que más daño puede hacer.**

---

## Parte 2 — Un solo lugar para correr y contar

Ocho scripts parchados a mano se desincronizan solos. Va un helper, `scripts/lib/corrida.ts`,
y los scripts lo usan:

- **`abrirRespaldo(nombre)`** — escribe el respaldo **antes** de tocar Firestore. Si no puede,
  **no se escribe nada** y sale con error. Es el orden que salvó los datos esta vez.
- **`escribir(id, fn)`** — una escritura. Cuenta el resultado, **no corta la corrida** si una
  falla.
- **`resumen()`** — la línea final, siempre:
  `escritas: N · fallidas: N · omitidas: N · respaldo en <ruta>`. Con fallas, **sale con
  código 1**.
- **`modo`** — simulación por defecto, `--aplicar` escribe. **En simulación la palabra
  "escritas" no aparece nunca**: se dice *"se escribirían"*. El helper lo garantiza, no cada
  script por su cuenta.

`corregir-ventanas-vr.ts` pasa a usarlo: ya tiene el patrón bien y sirve de referencia.

---

## Parte 3 — El orden de la limpieza, por riesgo

1. **`seed-salud-rutinas` y `seed-vr`** — dicen "escritas" en simulación. Primero estos.
2. **`seed-ejercicios`** — cuenta como escrito antes de confirmar, y el número de progreso que
   muestra está mal.
3. **`backfill-tipo-historial` y `corregir-mecanica`** — escriben en tandas sin mostrar nada;
   si fallan a mitad no dejan rastro de lo que ya entró.
4. **`rematch-salud`** y **`limpiar-salud`** — terminan con código 0 aunque haya errores. De
   `limpiar-salud` verificá con qué código sale.

Los que muestran cada escritura después de confirmarla (`aplicar-traducciones`,
`migrar-horas`, los demás `seed-*`) **quedan para después**: lo que hicieron se puede
reconstruir leyendo la salida. Listalos en el reporte y no los toques.

**Ninguno cambia lo que hace.** Esto es cómo informan y cómo fallan, no qué escriben.

---

## Parte 4 — Que no vuelva a entrar uno mal

`scripts/pureza.test.ts` ya recorre `scripts/`. Sumale una afirmación:

> **Todo script que importe `firebase-admin` usa `corrida.ts`.**

Si alguno tiene un motivo para no usarlo, que lo declare con un comentario que el test
reconozca. Un test que se puede saltear sin decirlo no sirve.

**Tests del helper:** en simulación no escribe **y no dice "escritas"**; si falla una
escritura, la cuenta, sigue con las demás y sale con código 1; si no se puede escribir el
respaldo, no se toca Firestore.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido.
2. **El conteo de errores de tipo por archivo** que destapó la Parte 1, y cuáles arreglaste.
3. Qué scripts migraste al helper y cuáles quedaron, con su motivo.
4. Tests, `tsc`, build y `test:rules`.
5. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/87-que-ningun-script-mienta.md`.
