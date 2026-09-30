# 84c — Que la ventana nazca bien

Repo: jpcofano/shapeup. Va con 84b: aquél arregla las filas viejas, éste arregla al que las
escribe.

## Qué problema resuelve

El censo de 84b encontró una **sesión libre del 25/09**, o sea **posterior a P84**, con la ventana
de 29 minutos y `duracionRealMin` de 50, arrancando 20,4 minutos después que el reloj.

Eso no es un dato viejo: es el código de hoy escribiendo mal. Y lo que lo prueba no es el reloj,
es la app contra sí misma — si la sesión hubiera empezado veinte minutos más tarde, el cronómetro
de la app habría marcado 29 minutos, no 50. Marca 50 porque la sesión estuvo corriendo 50 minutos;
lo que se selló tarde es `inicioMs`.

Arreglar las cinco de VR y dejar esto vivo es volver a esta conversación dentro de dos semanas con
otra sesión.

**Primero averiguás, después arreglás.** Si lo que encontrás no es lo que dice acá arriba, **pará
y reportá**: significa que la sesión del 25/09 tiene otra explicación y no hay que tocar nada.

---

## Parte 1 — Dónde se sella la ventana, de verdad

Antes de cambiar una línea, la tabla. Para cada tipo de sesión —**rutina, libre, juego y VR por
tiempo**—:

| | De dónde sale `inicioMs` | De dónde sale `finMs` | De dónde sale `duracionRealMin` |
|---|---|---|---|

Con el archivo y la línea de cada una. Es lo que quiero leer antes de decidir, porque **la
sospecha es que en alguno de esos caminos el inicio sale de la primera actividad marcada y no del
arranque de la sesión** — el mismo error que P84 dio por imposible cuando escribió "es el arranque
sellado de la sesión".

Y la pregunta concreta sobre el 25/09: **¿por qué esa sesión quedó con 29 minutos de ventana y 50
de duración?** Quiero el mecanismo, no la hipótesis.

**Pará y reportá si** el inicio ya sale del arranque real de la sesión en todos los caminos: ahí el
25/09 tiene otra causa y hay que entenderla antes de tocar el sellado.

---

## Parte 2 — La regla

`inicioMs` es **cuándo empezó la sesión en la app** y `finMs` **cuándo se cerró**. Ni la primera
serie, ni la primera ronda, ni la primera actividad marcada.

Y donde el arranque real no se pueda recuperar, **se ancla en el fin y se resta la duración**,
nunca al revés. Es la lección de P84: el fin es el momento en que alguien apretó "terminar", y el
inicio derivado de las marcas llega tarde. Anclar en el extremo malo no corrige la ventana, la
corre entera.

---

## Parte 3 — La invariante, con test

> **La ventana tiene que medir lo que dice el cronómetro de la app.**
> `|(finMs − inicioMs) − duracionRealMin × 60000| <= 60_000`

- Un test por cada tipo de sesión, sobre el camino de guardado real, no sobre un objeto armado a
  mano. Una invariante probada contra un mock que uno mismo construye no prueba nada.
- Si en algún tipo la invariante **no puede** cumplirse por cómo funciona hoy, **no la fuerces**:
  decilo en el reporte con el motivo. Prefiero saberlo a que el test pase con una excepción
  escondida adentro.
- La invariante va también como línea en `CLAUDE.md`, junto al ADR #042: **la app define cuánto
  duró la sesión, y la ventana tiene que coincidir con eso.**

---

## Parte 4 — Las que ya se guardaron mal

- Buscá **todas** las sesiones posteriores a P84 que violen la invariante, no solo la del 25/09.
- Salen por la lista extra de `revertir-ventanas-vr.ts` (84b), con las mismas guardas. Para éstas
  la guarda 1 —"coincide con el respaldo de P84"— **se reemplaza** por: la ventana mide menos que
  `duracionRealMin`. Las demás guardas se quedan, **la del reloj sobre todo**: si Samsung no
  confirma el inicio calculado, esa sesión no se escribe.
- Simulación primero. El `--aplicar` lo corro yo.

---

## Al terminar, reportá en `ultimochat.md`

1. La tabla de la Parte 1, completa, con archivo y línea.
2. El mecanismo del 25/09, explicado.
3. El diff, y qué tipos de sesión quedaron cumpliendo la invariante y cuáles no, con el motivo.
4. La lista de sesiones posteriores a P84 que la violan, con su corrección propuesta y la
   diferencia contra el reloj.
5. Tests, `tsc`, build y reglas.
6. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/84c-que-la-ventana-nazca-bien.md`.
