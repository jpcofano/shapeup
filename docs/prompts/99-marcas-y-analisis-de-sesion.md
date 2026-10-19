# 99 — Marcas de la app y análisis de sesión en dos capas

Repo: `jpcofano/shapeup`. Sesión de Code: **la de la app**.

**Regla general:** si algo de este prompt no entra en el modelo actual o choca con un ADR, **pará y reportá** antes de escribir código. No lo reinterpretes. No commitees hasta que Juan lo diga. Cualquier escritura en Firestore la corre Juan a mano.

**Este prompt se ejecuta por partes.** Ahora hacé **solo la Parte 1** (diagnóstico, solo lectura) y pará: reportá en `docs/auditorias/ultimochat.md`. Las Partes 2 a 5 se hacen cuando Juan te pegue las respuestas a lo que queda abierto. Leelas igual desde ahora, porque el diagnóstico tiene que servirles.

**El diseño de base está en `docs/ANALISIS-ASISTIDO.md`**, sección «Marcas y análisis en dos capas (P99) y análisis general (P94)». Las decisiones de ahí valen tal cual. Acá van las que se agregaron después y cómo se ejecuta.

---

## Qué problema resuelve

Hoy el análisis de una sesión es un texto largo que se pega y se lee. El paquete que lo alimenta tiene varios problemas:
- manda las calorías;
- manda la rutina tal como está (el E1 del modo por defecto), en vez de lo que se jugó;
- no manda la FC de reposo, el sueño ni la edad, que el análisis pide cada vez.

El prompt v3, por su lado:
- todavía compara contra lo prescripto;
- comenta las calorías;
- sospecha artefactos aunque la app no marcó la FC como dudosa.

P99 pasa a **dos capas**:
- **Las marcas que calcula la app,** en todas las sesiones, se hayan analizado o no.
- **Un análisis que las comenta,** con un veredicto, dos destacados y marcas propias que apuntan a una marca de la app o a un tramo, sin escribir números propios.

## Decisiones cerradas

Además de las del §2 de `ANALISIS-ASISTIDO.md`:

1. **Marcas medidas con las zonas guardadas en la sesión** (`zonasUsadas`), nunca con las vigentes. **La FC máxima vigente de Juan queda en 169** (decisión del 15/10, la de Samsung Health). `picoSobreVigente` compara contra la FC máxima con la que se calcularon las zonas de esa sesión.
2. **El paquete suma:**
   - las marcas de la app, con su id, valor y tramo si lo tienen;
   - la FC de reposo del día;
   - el sueño de la noche anterior (con `consolidarNoches`, la fuente única);
   - la edad;
   - en VR por escalones y en la rutina a medida: **el modo, el escalón, el juego, lo prescripto tal como se selló** y la **dificultad declarada** (un nivel, «Mixto» o sin declarar);
   - si la sesión se hizo **en lugar de otra** (P102): la rutina prevista y el motivo, **como contexto**.
3. **El paquete saca las calorías.** Se siguen mostrando en la sesión.
4. **El prompt v4:**
   - analiza **solo lo realizado**: la prescripción y el cambio de rutina son contexto, no se evalúa el cumplimiento ni se juzga el cambio;
   - **no especula sobre artefactos si `fcDudosa` es falso**;
   - puede recomendar fuerza;
   - **no menciona la progresión**, que se explica en la rutina;
   - no escribe números propios en `marcasAnalisis`;
   - cada sesión se analiza en un chat nuevo.

   El v3 queda en `docs/analisis/` sin tocar: los análisis viejos dicen con qué versión se hicieron.
5. **El esquema 3** suma `veredicto` (1 oración), `destacados` (exactamente 2, de 1 o 2 oraciones cada uno) y `marcasAnalisis` (con `refMarca` **o** un tramo `inicioS`/`finS`, tono `positivo` o `atencion`, y un tope a fijar). El detalle de la v3 se queda, abajo y plegado.
6. **El validador rechaza:**
   - una `refMarca` que no exista entre las marcas del paquete;
   - un tramo fuera de la ventana;
   - un campo que pase su tope;
   - un `armado` cuyas versiones no coincidan con las de la sesión al cargar.
7. **Dos marcas nuevas de nivel 2, sobre la curva:**
   - **`tramoBajo`:** el tramo continuo más largo por debajo del piso de Z3, **después** de la entrada en calor.
   - **`recuperacionSeries`** mide **también las bajadas de la curva**, no solo las pausas entre series, porque en VR corrido hay una sola serie.
8. **La semana del paquete y de la marca `semana` sale del programa activo del miembro** (`config/programaActivo`) **y de su meta**, con la cobertura de P102: una sesión hecha en lugar de otra cubre el día de la prevista.
9. **Verificación contra la sesión testigo del 27/09** (`src/lib/__fixtures__/sesionTestigo20260927.ts`), con las zonas de después de P97 (`zonasDesdeFcMax(169)`).

## Cómo repartir el trabajo (agentes y modelos)

| Qué | Cómo | Modelo |
|---|---|---|
| Parte 1 | Uno o dos agentes de exploración, solo lectura: uno para los datos (condicionales, FC de reposo, sueño, semana) y otro para el paquete, el esquema y el validador | Liviano |
| Parte 2 | Las funciones puras de las marcas, en paralelo de a grupos (nivel 1 y nivel 2), cada una con sus tests. Solo tocan `src/lib/` | Intermedio |
| Parte 3 | **En serie:** paquete, esquema, validador y prompt v4 se tocan entre sí | Principal |
| Parte 4 | Pantalla, en serie | Principal |
| Parte 5 | Documentación | Intermedio |
| Revisión final | Un agente que **no** escribió el código: revisa el diff contra las decisiones y el §2 del diseño, y corre `tsc` y `vitest` | Principal |

Dos agentes nunca editan el mismo archivo a la vez. «Pará y reportá» vale para todos.

---

## Parte 1 — Diagnóstico (solo lectura) ← hacé solo esta

Reportá, con archivo y línea donde corresponda:

**Datos**

1. **`recuperacionFinal`:** cuánta FC hay después del fin de la ventana en las sesiones reales, por la vía D (puente). Si en general no alcanza para un minuto, proponé descartarla.
2. **`volumen` y el récord de fuerza:** si las series guardan carga y repeticiones de forma confiable. Cuántas sesiones de fuerza hay y desde cuándo.
3. **FC de reposo y sueño por día:** si existen, dónde viven y cómo se leen sin lecturas nuevas caras (ADR #016).
4. **Edad:** de dónde sale.
5. **`zonasUsadas`:** si alcanza para saber la FC máxima con que se calculó la sesión, o si hay que guardarla. No guardes nada todavía: proponé.
6. **La semana:** de dónde sale hoy el total en el paquete. El «2 de 6» del 30/09 salía del PRG-0004. Confirmá que con P102 se puede tomar del programa activo y la meta.

**Arquitectura**

7. **¿Las marcas se guardan en la sesión o se calculan al mostrar?** Compará:
   - **calcular al mostrar** (como las recomendaciones, ADR #023): siempre al día, cero escrituras;
   - **guardar versionadas** (como el enriquecimiento, ADR #038): fijas para el análisis, cuestan escrituras y una migración.

   Tené en cuenta que `refMarca` del análisis guardado tiene que seguir apuntando a algo que exista. Recomendá una.
8. **El tiempo de la curva:** cómo se expresan los tramos (segundos desde el inicio de la ventana) para que los de la app y los del análisis usen la misma escala.

**El paquete actual**

9. Qué manda hoy, campo por campo. Qué cambia con las decisiones 2 y 3. Cuánto pesa la sesión testigo y cuánto pesaría con las marcas (el tope es de 60 KB).

**Lo abierto: proponé un valor y por qué**

10. El umbral de cobertura para que aparezca `calidad`.
11. La tolerancia de `tramoSostenido` y `tramoBajo`: cuántos segundos fuera del umbral cortan el tramo.
12. Cómo detectar las bajadas para `recuperacionSeries` en la curva: desde qué pico, en qué ventana (60 y 120 s) y con qué caída mínima para que cuente.
13. El récord: por qué «tipo de actividad» se agrupa. En VR proponé si es por juego (Les Mills en Combat largo, corto y a medida juntos) o por rutina. En fuerza, carga máxima o carga × repeticiones.
14. El tope de `marcasAnalisis`.
15. Si la pantalla del §6 de `ANALISIS-ASISTIDO.md` queda así, o qué cambiarías.

**Verificación**

16. Una tabla con los **valores esperados de cada marca** en la sesión testigo del 27/09, calculados a mano o con un script de solo lectura sobre el fixture. Esa tabla va a ser el test de la Parte 2.

Si algo de esto necesita leer Firestore, proponé un script de solo lectura con `corrida.ts` y lo corre Juan.

---

## Parte 2 — Las marcas de la app

- Funciones puras en `src/lib/` (por ejemplo, `marcasSesion.ts`), una por marca o por grupo, con tests: nivel 1, nivel 2, `tramoBajo` y las bajadas en `recuperacionSeries`.
- Cada marca devuelve su id, su valor, su nivel y su tramo (`inicioS`/`finS`) si lo tiene.
- La prioridad y el orden los fija la app (§3 del diseño).
- **Test contra la sesión testigo** con la tabla de la Parte 1.
- Dónde viven, según lo que se decida en la Parte 1.

## Parte 3 — Paquete, esquema 3, prompt v4 y validador

- El paquete según las decisiones 2, 3 y 8, en `lib/paqueteAnalisis.ts`. Respetá el tope de 60 KB y el aviso de recorte.
- `docs/analisis/prompt-sesion-v4.md`, según la decisión 4. Suma, a lo que ya decía la v3:
  - quién entrena;
  - de dónde sale cada dato, marcas incluidas;
  - qué se espera (veredicto, destacados, marcas propias);
  - las reglas.
- El esquema 3 y el validador según las decisiones 5 y 6, con tests de cada rechazo.
- Los análisis guardados con el esquema 2 se siguen mostrando como hoy.

## Parte 4 — Pantalla

La del §6 del diseño, con lo que se decida en la Parte 1:
- **Orden, de arriba hacia abajo:** veredicto, badges, destacados, curva con marcas, secundarias y detalle plegado.
- **Origen de cada marca:** las de la app van sólidas; las del análisis, con borde punteado y la etiqueta «análisis».
- **Una sesión sin analizar** se ve igual en todo lo medido.

Mirala en el teléfono, en claro y en oscuro.

## Parte 5 — Documentación

- **`docs/ANALISIS-ASISTIDO.md`:** el estado, lo decidido en el §8 y el catálogo final.
- **`docs/ADR.md`:** un ADR si queda una decisión que no se re-discute. Por ejemplo, dónde viven las marcas, con su línea en el índice de `CLAUDE.md`.
- **`docs/ROADMAP-producto.md`:** P99 hecho.
- **`docs/MAPEO-IMPLEMENTACION.md`:** la bitácora.

## Qué reportar (en cada parte)

En `docs/auditorias/ultimochat.md`, sobrescribiéndolo:
- lo hecho;
- los archivos tocados;
- `npx tsc -b` limpio y `npx vitest run` verde (la suite de reglas se saltea sin emulador);
- las decisiones que tomaste sin que el prompt las fijara;
- las preguntas abiertas.

**En la Parte 1:** las respuestas del diagnóstico y las propuestas de 10 a 16, para que Juan decida en el chat.
