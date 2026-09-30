# 84b — El otro extremo de la ventana

Repo: jpcofano/shapeup. Corrige a P84, que está en producción desde el 25/09.

## Qué pasó

P84 dice textual: **"`finMs = inicioMs + duracionRealMin × 60000`. `inicioMs` no se toca: es el
arranque sellado de la sesión."** Esa premisa es falsa para las sesiones de VR anteriores a P80:
ahí `inicioMs` **no** era un arranque sellado, salía de la primera ronda marcada — la misma
fuente poco confiable que hacía corta la ventana. Al dejarlo quieto y alargar el fin, P84 no
corrigió la ventana: **la corrió entera hacia adelante**, entre 10 y 24 minutos.

El extremo confiable era el otro. El fin viejo es el momento en que se cerró la sesión, y el
arranque del reloj —independiente de la app— confirma que con `inicio = fin viejo −
duracionRealMin` las cinco sesiones caen a menos de un minuto de lo que marcó Samsung.

`duracionRealMin` **no se toca en ninguna de las dos versiones**: ADR #042 sigue entero. Lo que
cambia es contra qué extremo se ancla esa duración.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — El script

`scripts/revertir-ventanas-vr.ts`, sobre `corrida.ts` (P87). **Simulación por defecto**,
`--aplicar` lo corro yo.

**A quién toca:** exactamente las sesiones que escribió P84, **leídas de su respaldo**. No se
recalcula a quién le tocaría: la lista sale del respaldo y de ningún otro lado.

**Qué escribe**, por sesión:

- `finMs` = el valor **del respaldo de P84** (el fin viejo, tal cual);
- `inicioMs` = `finMs − duracionRealMin × 60000`.

**Guardas, todas obligatorias y todas cortan por sesión, no la corrida entera:**

1. **El estado actual tiene que coincidir con lo que dejó P84.** Si `inicioMs`/`finMs` de hoy no
   son exactamente los que P84 escribió, esa sesión **no se toca** y se informa: algo más la
   modificó y no sabemos qué.
2. **El reloj tiene que estar de acuerdo.** Para cada sesión se busca su tramo de Samsung y se
   compara el `inicioMs` calculado contra el `startMs` del reloj. Si difieren **más de 5
   minutos**, esa sesión **no se escribe** y se informa con los dos números. Esto es lo que hace
   que el arreglo sea verificable en vez de ser otra apuesta sobre cuál extremo es el bueno: si
   el testigo independiente no confirma, no escribimos.
3. **Sin tramo de Samsung que comparar, no se escribe.** Se informa aparte y lo decidimos a mano.
   Cinco sesiones son cinco; no hace falta automatizar la duda.
4. **La ventana nueva no puede pisar la sesión anterior** del mismo miembro. P84 cuidaba la
   siguiente porque movía el fin; acá movemos el inicio hacia atrás, así que el riesgo está del
   otro lado. Si la pisara, no se escribe y se informa.
5. `update()`, **nunca `set()`**.
6. Respaldo propio antes de escribir nada, como manda `corrida.ts`. El de P84 no se toca ni se
   pisa: es la única copia de lo que había antes de todo esto.

**Invalidar el enriquecimiento**, igual que P84: la biometría de esas cinco se calculó con la
ventana corrida y queda mal. El script no la recalcula —no tiene la curva—: la marca para que la
próxima sincronización la rehaga.

---

## Parte 2 — El censo, antes de escribir

Con lecturas solamente, y **en el reporte antes de que yo corra `--aplicar`**:

1. **¿Hay más sesiones con el mismo problema que P84 no tocó?** El criterio de P84 era que la
   ventana midiera menos que `duracionRealMin`. Una sesión de VR vieja cuya ventana **coincidía**
   con la duración pero **arrancaba tarde igual** no entró en P84 y sigue mal. Comparalas contra
   el arranque del reloj y listá las que difieran más de 5 minutos.
2. **¿Pasa fuera de VR?** Mismo chequeo sobre las de fuerza. Si aparece alguna, **pará y
   reportá**: eso sería otro problema y quiero verlo antes de tocar nada.
3. Para las cinco, la tabla completa: fecha, ventana según P84, ventana nueva, arranque del reloj,
   y la diferencia entre el inicio calculado y el del reloj. Es la tabla que decide si aplico.

---

## Tests

- El script no escribe una sesión cuyo estado actual difiere del respaldo de P84.
- No escribe una cuyo inicio calculado difiere más de 5 min del arranque del reloj, **y sí** una
  que difiere menos.
- No escribe si no hay tramo de Samsung.
- No escribe si la ventana nueva pisa la anterior.
- En simulación no escribe **y no dice "escritas"** (el helper ya lo garantiza; el test es de que
  este script lo use).
- `duracionRealMin` **no cambia en ningún caso**. Este es el test que protege el ADR #042.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido.
2. La tabla de la Parte 2.3 y las dos listas del censo.
3. Qué pasa con la progresión de VR de esas cinco sesiones una vez corregidas: ¿siguen leyéndose
   completas? P84 existía para eso, y quiero saber si el arreglo del arreglo lo mantiene.
4. **Después de que yo aplique y reimporte**: volvé a medir la adopción del 12 % de P92 y
   comparala con la de hoy. Ese es el número que sirve; el de ahora está medido sobre ventanas
   corridas.
5. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/84b-el-otro-extremo-de-la-ventana.md`, y agregá una línea en
`docs/prompts/84-ventanas-viejas-y-limpieza.md` diciendo que la Parte 1 quedó corregida por este,
con el motivo. Un prompt viejo que quedó mal y no lo dice es una trampa para el que lo lea después.
