# 71 — Terminar las traducciones del catálogo (corrida larga)

Repo: jpcofano/shapeup. Precondición del Bloque 3 (`docs/ROADMAP-producto.md`). Parte de
`6a11326`.

**Objetivo:** que las 873 fichas del catálogo estén en castellano rioplatense, en el
diccionario y en Firestore.

**Estado medido:** `fedb/exercises.json` tiene 873 fichas y
`scripts/data/traducciones-fedb.es.json` tiene 471 claves. **Faltan 402**, unos 251.000
caracteres de inglés, con 4,1 pasos de instrucciones en promedio.

Es una tarea larga y repetitiva. Está pensada para hacerse de corrido, en lotes, guardando
después de cada uno. **Si se corta, se retoma sin perder nada.**

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Relevar (solo lectura)

1. La forma exacta de una entrada del diccionario: campos obligatorios y opcionales, mirando
   varias entradas ya hechas y el tipo `Traduccion` en `scripts/importar-fedb.ts`.
2. El validador de ratio de `importar-fedb.ts`: qué umbral usa y qué cuenta como warning.
3. **Cómo se mapea una clave de FEDB al `idEjercicio` (`EJ-0001`) del documento en
   Firestore.** Mirá si `catalogo-ejercicios.json` conserva la clave de origen o si el id
   se asigna por orden. Es lo que decide cómo se aplica el cambio. **Si no hay un mapeo
   confiable, pará y reportá antes de escribir nada.**
4. Confirmá que `seed-ejercicios.ts` usa `set()`, o sea que sobrescribe el documento
   completo.

---

## Parte 1 — Método de la corrida

**Lotes de 20 fichas.** Después de cada lote:

1. Escribí el diccionario completo a disco. **El archivo es el checkpoint:** lo pendiente
   es siempre "las claves de FEDB que no están en el diccionario".
2. Imprimí una línea: número de lote, cuántas van y cuántas faltan.
3. Seguí con el siguiente lote, sin pedir confirmación.

**Orden:** primero las de `category: "strength"` cuyo `equipment` sea barra, mancuernas,
peso corporal, máquina o polea, porque son las que aparecen en las rutinas. Después, el
resto en orden alfabético.

**No uses los scripts `fix-traducciones-lote*.ts`.** Ese patrón era para lotes chicos a
mano. Escribí directamente en el diccionario.

---

## Parte 2 — Cómo traducir

Seguí el criterio de las 471 que ya están, que salió de `fix-traducciones-ratio.ts`:

- **Un paso en inglés es un paso en castellano.** No juntes ni partas pasos. El validador
  rechaza si hay menos pasos que el original.
- **Voseo rioplatense:** "sentate", "bajá", "mantené", "repetí".
- **La respiración va explícita** cuando el original la menciona.
- `Tips` del original va a `puntosClave`; `Cautions` va a `erroresComunes`. Si el original
  no los trae, escribí uno de cada uno que se desprenda del propio ejercicio. **No inventes
  información que no esté**: si no hay nada que decir, dejá el array vacío.
- **Nombre:** el que se usa en un gimnasio de acá. "Press banca con barra", no "Barbell
  Bench Press". Las palabras que acá se dicen en inglés se dejan: press, curl, peso muerto,
  hip thrust, sprint.
- **`sinonimos`: siempre al menos dos**, y uno de ellos el nombre en inglés de uso común.
  Es lo que hace que el buscador encuentre la ficha escriba lo que escriba el usuario.
  Pensá cómo lo buscaría alguien: "remo", "remo con barra", "bent over row".
- **`patron`** solo cuando sea claro por el movimiento. Si dudás, no lo pongas: el
  importador lo deduce.
- **`unilateral`** siempre, porque es un dato objetivo.
- **No traduzcas al pie de la letra** los textos de FEDB que están mal redactados: escribí
  la instrucción correcta que describa el mismo movimiento.

---

## Parte 3 — Validación

Cuando no quede ninguna pendiente:

```
npx tsx scripts/importar-fedb.ts
```

- Tiene que decir que las 873 están traducidas.
- **Corregí todas las fichas que aparezcan como warning de ratio**, y volvé a correrlo hasta
  que no quede ninguna.
- Genera `catalogo-ejercicios.json`, que la Parte 4 usa.

---

## Parte 4 — Aplicar a Firestore sin romper nada

Script nuevo, `scripts/aplicar-traducciones.ts`, con el patrón de `scripts/` (solo
`firebase-admin` y módulos puros; ver `scripts/pureza.test.ts`).

```
npx tsx scripts/aplicar-traducciones.ts            # simulación, no escribe
npx tsx scripts/aplicar-traducciones.ts --aplicar  # escribe
```

- **Usa `update()`, nunca `set()`.** `set()` borraría campos que escribe la app, como
  `pasoCargaKg` de P67. Es el punto más importante de este prompt.
- **Campos que actualiza, y ningún otro:** `nombre`, `nombreCanonico`, `sinonimos`,
  `instrucciones`, `puntosClave`, `erroresComunes`, `patron`, `unilateral`,
  `descansoSugeridoSeg` y `traduccion: "ok"`. Los tres últimos, solo si la traducción los
  trae.
- **Solo toca los documentos que cambian.** Si el texto ya es idéntico, lo saltea.
- **Antes de escribir, verifica el mapeo:** para cada ficha, que el documento exista y que
  su `nombreCanonico` actual coincida con el nombre en inglés esperado o con el castellano
  ya aplicado. **Si alguno no coincide, no escribe nada y aborta**, informando cuáles.
- La simulación imprime cuántos documentos cambiarían, cuántos quedan igual y las primeras
  diez diferencias de nombre, en el formato `EJ-0123: "Bent Over Barbell Row" → "Remo con
  barra"`.
- Escribe en batches de 400 y reporta el total.

---

## Parte 5 — Verificación final

Con los cambios aplicados, escribí en el reporte:

1. Cuántos documentos de `/ejercicios` quedaron con `traduccion: "ok"`. Tienen que ser 873.
2. Una prueba del buscador con `filtrarEjercicios` de `lib/filtros.ts`, el mismo módulo que
   usa la app, con estos términos: **remo · sentadilla · press banca · dominadas · peso
   muerto · curl · zancada · fondos · elevaciones laterales · plancha**. Cuántos resultados
   da cada uno. Si alguno da 0, hay sinónimos faltando: agregalos y volvé a aplicar.
3. Diez nombres al azar del catálogo, para ver que quedaron bien.

---

## Tests

No hay funciones nuevas que testear. Corré igual la suite completa, `tsc -b` y
`npm run test:rules`, para confirmar que nada se rompió.

---

## Fuera de alcance

- Resembrar el catálogo con `seed-ejercicios.ts`.
- Cambiar la estructura del diccionario o del importador.
- UI.
- Los 18 scripts de lote existentes: no los toques.

Guardá este prompt como `docs/prompts/71-traducciones-catalogo.md`.

---

## Al terminar, reportá

1. El Paso 0, punto por punto, con el mapeo de la pregunta 3.
2. Cuántas fichas tradujiste y cuántos lotes.
3. La salida final de `importar-fedb.ts`.
4. La simulación y después la aplicación: documentos cambiados.
5. Los tres puntos de la Parte 5.
6. Las fichas donde el original estaba tan mal que tuviste que reescribir la instrucción,
   con su id.
7. Cualquier punto donde hayas parado.
