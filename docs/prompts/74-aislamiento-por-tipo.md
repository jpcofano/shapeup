# 74 — Aislamiento de métricas por `tipo` de historial

Repo: jpcofano/shapeup. Diseño en `docs/ROADMAP-producto.md`, Bloque 5, punto "Aislamiento
de métricas — el riesgo real". Parte de `deb9cf1`.

**Objetivo:** que cuando P75 empiece a crear entradas con `tipo: "externa"`, ninguna métrica
se infle sola. Hoy la racha, la adherencia, el tonelaje, la progresión y las veces que
entrenaste se calculan sobre **todo** el historial, sin mirar el `tipo`. Una caminata de 40
minutos entraría como sesión de fuerza.

El roadmap es explícito: **los tests van antes que la ingesta**, y se escriben para pasar.
Este prompt no ingiere nada: prepara el terreno.

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Inventario (solo lectura, y es la mitad del trabajo)

`Historial.tipo` hoy es `"rutina" | "libre"`, opcional, y si falta se lee como `"rutina"`.

Recorré **todo** el código que recibe `Historial[]` o un `Historial`, y armá una tabla con
una fila por función. Incluí al menos estos, y agregá los que encuentres:

`weekChips.ts` · `recomendaciones.ts` (las dos funciones y el filtro de la línea 170) ·
`costoCardiaco.ts` (dos) · `progresion.ts` (`sesionesDelEjercicio`, `sugerirProgresion`) ·
`sesionDeHoy.ts` · `proximaSesion.ts` · `resumenSesion.ts` (tres) · `enriquecerImport.ts` ·
`importSelectivo.ts` · `metricas.ts` (`tonelajeKg`, `totalSeriesHechas`,
`calcularCacheRutina`) · `Home.tsx` (`calcRacha` y lo que use adherencia) ·
`HomeReduxContent.tsx` · `ProgresoTab.tsx` · `CardioTab.tsx` · `Historial.tsx` ·
`HistorialDetalle.tsx` · `Salud.tsx`.

Para cada una, decí:

| Columna | Qué poner |
|---|---|
| Qué calcula | Una línea |
| Qué debería contar | **Solo ShapeUp**, **todo**, o **mixto** |
| Qué pasa hoy si entra una externa | Concreto: "sumaría 0 al tonelaje pero contaría como sesión" |
| Riesgo | Alto, medio o bajo |

**Criterio para decidir la columna del medio:**

- **Solo ShapeUp:** todo lo que hable de cumplir el plan o de progresar en un ejercicio —
  racha del plan, adherencia, `vecesEntrenada`, tonelaje, progresión, PR, deltas.
- **Todo:** lo que hable de moverse — días activos, minutos, calorías, la vista de
  historial.
- **Mixto:** si una parte va de cada lado, decilo y proponé el corte.

**Pará y reportá el inventario antes de seguir si encontrás más de tres funciones donde no
sea obvio de qué lado van.** Las decidimos juntos y después seguís.

---

## Parte 1 — Tipo y predicados

**`types/models.ts`:** `tipo?: "rutina" | "libre" | "externa"`. El comentario aclara que
`"externa"` la crea P75, que si el campo falta se lee como `"rutina"`, y que una externa
**no tiene bloques ni tonelaje**.

**`src/lib/tipoHistorial.ts`**, puro:

| Función | Qué hace |
|---|---|
| `tipoDe(h)` | Devuelve el tipo, con `"rutina"` cuando falta |
| `esShapeUp(h)` | `"rutina"` o `"libre"` |
| `esExterna(h)` | `"externa"` |
| `soloShapeUp(hs)` | Filtra |
| `soloExternas(hs)` | Filtra |

Que sea un módulo propio y no un `.filter` suelto en cada llamador: cuando mañana aparezca
un cuarto tipo, se cambia en un solo lugar.

---

## Parte 2 — Aplicar el aislamiento

Según tu inventario, poné el filtro en cada función que tenga que contar **solo ShapeUp**.
Tres reglas:

1. **El filtro va lo más adentro posible**, en la función pura que calcula, no en la
   pantalla que la llama. Si dos pantallas llaman a la misma función, no se puede depender
   de que las dos filtren.
2. **Las firmas no cambian.** Cada función sigue recibiendo el historial completo y filtra
   adentro. Así un llamador nuevo no puede olvidarse.
3. **Documentá con una línea de comentario** en cada función qué cuenta y por qué.

**Casos con nombre propio:**

- **`calcRacha` de `Home.tsx` se muda a `src/lib/racha.ts`**, pura y con tests. Ahí donde
  está, no se puede testear. Son dos funciones:
  - `rachaDelPlan(historial, semanaActual)`: solo ShapeUp. Es la que ya existe.
  - `diasActivos(historial, desde, hasta)`: **todo**, incluidas las externas, contando días
    distintos y no sesiones. Dos sesiones el mismo día son un día.

  Es la separación que pide el roadmap: que una caminata no infle la adherencia, pero que
  tampoco te quite el crédito por haberte movido. En P74 `diasActivos` queda escrita y
  testeada aunque todavía no haya externas; la pantalla que la muestre es otro prompt.
- **`tonelajeKg` y `totalSeriesHechas`** reciben un solo `Historial`, no una lista. Que
  devuelvan 0 ante una externa, sin romperse, aunque no tenga `bloques`.
- **`progresion.ts` y `resumenSesion.ts`** ya filtran de hecho, porque una externa no tiene
  bloques. Igual poné el filtro explícito: que no dependa de un efecto secundario.
- **`importSelectivo.ts` y `enriquecerImport.ts`** son los que P75 va a reescribir. Acá solo
  el filtro, nada más.

---

## Parte 3 — Tests de aislamiento

Fixture compartida en `src/lib/__fixtures__/historialMixto.ts` (o donde encaje con el
repo), con al menos:

- dos sesiones de rutina con bloques y tonelaje;
- una sesión libre con bloques;
- dos externas: una caminata de 40 minutos y una de 12, sin bloques, sin tonelaje, con
  calorías y FC;
- una externa **el mismo día** que una sesión de rutina, que es el caso que rompe el conteo
  por días;
- una sesión vieja de rutina sin el campo `tipo`, para la retrocompatibilidad.

**Un test por función de la tabla**, con esta forma: se calcula con el historial mixto y con
el mismo historial sin externas, y **el resultado tiene que ser idéntico** en todo lo que
cuenta solo ShapeUp. Es la prueba directa de que las externas no mueven la aguja.

Además:

- `diasActivos` **sí** cambia al sacar las externas, y el día compartido cuenta una sola vez;
- una externa no rompe nada: ninguna función tira excepción por falta de `bloques`;
- una sesión sin `tipo` cuenta como ShapeUp en todas.

Corré la suite completa, `tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Crear entradas externas (P75).
- La UI de días activos.
- `/config/import` y el umbral configurable (P75).

Guardá este prompt como `docs/prompts/74-aislamiento-por-tipo.md`.

---

## Al terminar, reportá

1. **La tabla completa del Paso 0.** Es lo más importante del reporte.
2. El diff por archivo, resumido.
3. El resultado de tests, `tsc` y `test:rules`.
4. **Las funciones que ya estaban bien** y no necesitaron cambio, por qué.
5. Cualquier función donde el corte no fuera obvio y qué decidiste.
6. Cualquier punto donde hayas parado.
