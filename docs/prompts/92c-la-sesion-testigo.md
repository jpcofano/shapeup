# 92c — La sesión testigo

Repo: jpcofano/shapeup. Complementa a P92 y su enmienda.

**Estado al pasarlo:** el deploy de reglas, functions y hosting está hecho. Las ventanas ya están corregidas por 84b/84c.

**Antes de empezar, verificá una sola cosa:** que la sesión de VR del 27/09 tenga en Firestore la `versionEnriquecimiento` actual, la de P92, y no `0` ni la v5.
- Si no la tiene, **pará y reportá**. No la reenriquezcas vos: cualquier escritura en Firestore la corre Juan a mano.
- Para este prompt **no hace falta el teléfono**, que está en medio de una prueba de Doze. Si en algún momento te parece que lo necesitás, pará y avisá; no lo pidas enchufar.

## Qué problema resuelve

P92 calcula minutos por zona **y nadie los verificó contra nada**. Hasta ahora la única manera de saber si estaban bien era mirarlos y ver si parecían razonables. Así es exactamente como este proyecto se llevó varios sustos.

Ahora hay contra qué comparar. La sesión de **VR del 27/09 (Quema full-body, PowerBeatsVR)** está en los tres lados a la vez:
- en las capturas de Samsung Health,
- en el crudo del SDK,
- y en el historial de ShapeUp.

Es la primera vez que podemos comparar nuestro cálculo contra una medición externa, en lugar de contra nosotros mismos.

### Lo que dice Samsung de esa sesión

| Zona | Rango | Tiempo | % |
|---|---|---|---|
| Z5 Máximo | 153-169 | 04:05 | 8,5 % |
| Z4 Anaeróbico | 136-152 | 28:20 | 59,2 % |
| Z3 Aeróbico | 119-135 | 10:16 | 21,6 % |
| Z2 Control de peso | 102-118 | 04:25 | 9,2 % |
| Z1 Intensidad baja | 84-101 | 00:40 | 1,4 % |

Duración total **47:47** · FC media **137** · FC máxima **170** · **504 kcal**.
Los cinco tiempos suman **47:46**, un segundo menos que la duración total.

### Lo que decía ShapeUp antes de P92

Duración de la app **49 min** · FC media **138** · FC máx **170** · **~503 kcal** (estimadas) · *"FC medida en 48 de 49 min"* · zona Z4 · match por ID, granularidad serie.

Además aparecía un cartel: *"Samsung siguió grabando de más — datos recortados a tu sesión."*

**Ese cartel es falso, y arreglarlo es parte de este prompt** (Parte 3).

---

## Parte 1 — El fixture

La curva real de esa sesión, sacada del crudo del SDK, va a `src/lib/__fixtures__/` junto con las cifras de Samsung.

**Es un fixture de datos reales y se documenta como tal**: con la fecha y de dónde salió. Dentro de seis meses nadie va a acordarse de por qué hay una curva de cuarenta y ocho minutos en el repo.

Si pesa demasiado, submuestreala a **1 punto por segundo**, que es lo que manda el reloj, y **no menos**. Bajar más la resolución para que entre haría que el test valide otra cosa.

---

## Parte 2 — Los cuatro tests

1. **Los minutos por zona coinciden con los de Samsung**, con una tolerancia de **un minuto por zona**. Las diferencias chicas son inevitables: ellos redondean y nosotros atribuimos por intervalo. Pero una zona que difiere tres minutos es un error de método, no de redondeo.
2. **La suma cierra**: zonas + bajo zonas + sin dato = ventana. Esta vez sobre datos reales, no sobre una curva de laboratorio.
3. **El 170 cae en Z5.** La FC máxima de esa sesión supera el techo de Z5 (169), y Samsung la cuenta en Z5: sus porcentajes cierran en 100 %. Es la regla 2 de la enmienda, confirmada por el comportamiento de ellos con un número real.
4. **La tolerancia adopta.** Entre 49 min y 47:47 hay un **2,5 %** de diferencia. Esta sesión tiene que quedar con `ventanaAdoptada: 'samsung'` y con **504 kcal enteras, sin `~` y sin `kcalEstimada`**.

---

## Parte 3 — El cartel que acusa al extremo equivocado

*"Samsung siguió grabando de más"* apareció en una sesión donde Samsung grabó **menos**: 47:47 contra 49 minutos de la app. Lo que hubo fue un recorte **al principio**, porque el reloj se arrancó antes que la sesión. Es lo que hace cualquiera.

Hay dos arreglos:

- **Que el texto nombre el extremo que realmente se recortó.** Se sabe comparando `inicioMsEfectivo` y `finMsEfectivo` contra la ventana:
  - si lo que quedó afuera está antes del inicio, el reloj arrancó antes;
  - si está después del fin, el reloj siguió grabando.

  Hoy el mensaje sale de `huboRecorte`, que es `algunRecorte || excedeVentana`, y no distingue un caso del otro.
- **Que no aparezca por trece segundos.** Con la tolerancia del 12 %, esta sesión se adopta entera: no tiene recorte, así que **el cartel no va**. Cuando sí haya recorte, el aviso tiene que salir solo si lo recortado es significativo, no por una diferencia de segundos entre dos botones apretados con la mano.

Ya que estás ahí, mirá la **FC media: 138 contra 137 de Samsung**. Un bpm de diferencia es esperable, porque nosotros ponderamos por duración y de ellos no sabemos cómo calculan. **Verificá que siga en un bpm con la ventana adoptada.** Si se abre a tres o cuatro, ya no es redondeo y quiero verlo.

---

## Parte 4 — Lo que la diferencia nos va a enseñar

Samsung **no expone** ni los huecos ni el tiempo por debajo de Z1: reparte todo el tiempo entre las cinco zonas. Nosotros sí los separamos. Por eso, si nuestras zonas suman menos que las suyas, la diferencia tiene que aparecer **exactamente** en `minutosSinDato` más `minutosBajoZonas`.

**Reportá esa resta.** Si no cierra, no es un problema de tolerancia: quiere decir que atribuimos el tiempo de otra manera que ellos, y quiero saberlo antes de que esos minutos aparezcan en una pantalla.

---

## Al terminar, reportá en `ultimochat.md`

1. La tabla de tres columnas: Samsung, ShapeUp antes y ShapeUp después. Zona por zona, más duración, FC media, FC máxima y calorías.
2. La resta de la Parte 4: si cierra o no.
3. Qué decidió la tolerancia del 12 % en esta sesión, con los números.
4. Cómo quedó el texto del recorte y en qué casos se muestra ahora.
5. Si algo no coincide, **no lo ajustes para que coincida**: pará y reportá con los dos cálculos. Un test que se acomoda hasta pasar es peor que no tenerlo.

No commitees. Guardá este prompt como `docs/prompts/92c-la-sesion-testigo.md`.
