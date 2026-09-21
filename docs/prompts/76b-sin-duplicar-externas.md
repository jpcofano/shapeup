# 76b — El historial no duplica: filtra

Repo: jpcofano/shapeup. Corrige el diseño de las entradas externas de P75/P75b, con la
importación del ZIP ya hecha. Parte de `020933f`.

## Qué cambia y por qué

P75 escribía una entrada en `/historial` por cada actividad externa. Con el import real eso
son **2257 documentos que duplican filas que ya están en `/cardio`**: el mismo hecho escrito
dos veces, y dos copias que pueden divergir.

**El criterio pasa a ser un filtro de lectura, no una decisión de escritura.**

| Colección | Qué guarda |
|---|---|
| `/historial` | Solo sesiones de ShapeUp, con su detalle: bloques, series, cargas, RIR, más el enriquecimiento biométrico de esas sesiones |
| `/cardio` | Todas las actividades, crudas y completas. No cambia |
| La vista de Historial | Las sesiones de ShapeUp **más** `/cardio` filtrado en el momento de mostrar |

La ventaja concreta: cambiar el umbral no obliga a reimportar ni a migrar nada, porque no
hay copias que corregir.

**Nada se pierde:** `/cardio` ya tiene las 2563 actividades, incluidas las que el filtro no
muestra.

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Verificar (solo lectura)

1. `/historial` tiene 7 documentos y ninguno con `tipo: "externa"`. **El import dijo que
   escribiría 2257 y no escribió ninguna, sin mostrar error.** Averiguá por qué y reportalo:
   si el paso falló, si devolvió `ok` igualmente, o si nunca se llamó. Es lo mismo que P76a
   arregló en el puente, pero en el camino del ZIP.
2. `getSesionesCardio` (`data/salud.ts:78`) trae **todo** `/cardio` sin límite, y `Salud.tsx`
   la llama al montar. Con 2563 documentos son 2563 lecturas por visita.
3. Qué campos de marca se persisten hoy en un documento de `/cardio`: decime si están
   `_autoDetected`, `_muestrasCurva`, `_fcMin` y cualquier marca de VR o de ShapeUp, con el
   nombre exacto con que quedan guardados.
4. El índice `(miembro, fecha desc)` de `cardio` ya existe en `firestore.indexes.json`.

---

## Parte 1 — Sacar la escritura de externas

- Eliminá `guardarEntradasExternas` y su uso en el import y en la sincronización del puente.
- `lib/entradaExterna.ts` se elimina, salvo lo que reuse la Parte 2.
- En `Historial`, el grupo `externa` y el valor `"externa"` de `tipo` **quedan declarados en
  el modelo**, marcados como no usados por ahora: los va a necesitar P76 cuando convierta una
  actividad en sesión.
- `clasificarImport` se mantiene, pero ahora solo decide **qué enriquece una sesión**. Todo lo
  demás queda como actividad en `/cardio`, que ya se guarda entera.
- Los predicados de `tipoHistorial.ts` y el aislamiento de P74 quedan como están: siguen
  siendo correctos y baratos.

---

## Parte 2 — El filtro, puro y testeado

**Campos que hay que persistir en `/cardio`**, con nombres estables y sin guión bajo, porque
ahora se consultan y no son solo de paso:

| Campo | Qué es |
|---|---|
| `autodetectada: boolean` | Lo que hoy viaja como `_autoDetected`, o la ausencia de FC por la vía del ZIP |
| `esVR: boolean` | Si la actividad es de VR |
| `marcadaShapeUp: boolean` | Si el reloj la marcó como ShapeUp, por `custom_id` o por `customTitle` |

Si alguno ya se guarda con otro nombre, unificá y decilo en el reporte.

**Función pura** en `src/lib/actividadRelevante.ts`:

```
actividadRelevante(cardio, config): boolean
```

Es verdadera si:

1. `esVR` es verdadero, **sin importar la duración**; o
2. `marcadaShapeUp` es verdadero; o
3. `duracionMin >= config.duracionMinimaMin` **y** `autodetectada` es falso.

En cualquier otro caso, la actividad queda solo en Salud.

**`/config/import`:**

- **`duracionMinimaMin` pasa a 30.** Era 10, y con el dato real 10 dejaba entrar 1927
  caminatas detectadas por el reloj. Cambiá el default en el código y, si el documento existe
  en Firestore, decime el valor que tiene: no lo escribas vos.
- `actividadesSiempreRelevantes` se mantiene.

---

## Parte 3 — Consultas acotadas

Es la causa de los 1 a 3 segundos al abrir Salud, y de que la cuota diaria se agotara.

En `data/salud.ts`:

| Función | Qué hace |
|---|---|
| `getCardioRango(miembro, { desde, hasta, limite, cursor })` | Consulta por rango de fecha, paginada. Usa el índice que ya existe |
| `getSesionesCardio` | **Se elimina** una vez migrados sus llamadores, para que no vuelva a aparecer una consulta que trae todo |

- **`Salud.tsx`** pasa a pedir los **últimos 12 meses** y a paginar hacia atrás si el usuario
  sigue bajando. La pestaña Cardio dice cuántas hay en total y desde qué fecha está mostrando.
- **`getDiasActivos`** (P75b) pasa a leer las dos fuentes: las sesiones de ShapeUp de
  `/historial` y `/cardio` filtrado con `actividadRelevante`. Sigue devolviendo, por día,
  `{ fecha, shapeUp, externaDeclarada, autodetectada }`. **La autodetectada se informa
  igual**, aunque no se muestre en el historial: el análisis decide si la cuenta.
- El import, después de escribir, **no vuelve a leer `/cardio` entero** para verificar.

---

## Parte 4 — La vista de Historial

- La lista combina las sesiones de ShapeUp con las actividades de `/cardio` que pasan el
  filtro, ordenadas por fecha, con paginado.
- Una actividad se muestra con su nombre, duración, calorías, FC y zona, y un chip que la
  distingue de una sesión de ShapeUp.
- Tocarla abre el detalle que ya tiene la pestaña Cardio, no una pantalla nueva.
- El panel de Progreso del historial mantiene el corte de P74: volumen y PR solo de ShapeUp;
  sesiones y minutos cuentan todo lo que pase el filtro.

---

## Parte 5 — Que el import diga la verdad

Mismo criterio que P76a le aplicó al puente:

- Cada paso de escritura reporta **lo que escribió**, no lo que clasificó.
- Un rechazo por documento deja de contarse como "omitido" y devuelve error.
- Los pasos corren con `conTimeout`; si vence, el mensaje dice "quedó en cola".
- Si la cuota se agota, el mensaje lo dice con `esCuotaAgotada`, que ya existe.
- Si un paso falla después de que otro escribió, el resumen dice qué quedó guardado.

---

## Tests

- **`actividadRelevante`:** VR corta entra; marcada ShapeUp corta entra; 29 minutos
  declarada no entra; 30 entra; 45 autodetectada no entra; el umbral sale de la config.
- **`getDiasActivos`** (la parte pura): un día con sesión de ShapeUp y caminata declarada
  trae las dos marcas; una autodetectada aparece marcada como tal; dos actividades el mismo
  día cuentan un solo día.
- **Aislamiento de P74:** vuelve a correr. Con las actividades de cardio en juego, la racha,
  la adherencia, el tonelaje y la progresión no se mueven.
- **El import** con un paso que falla devuelve error y contadores reales.

Corré la suite completa, `tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Convertir las actividades marcadas como ShapeUp en sesiones de verdad: eso es P76, y son
  ocho.
- Limpiar las métricas huérfanas de fechas corridas.
- Cambiar `/cardio`, más allá de los tres campos de marca.

Guardá este prompt como `docs/prompts/76b-sin-duplicar-externas.md`.

---

## Al terminar, reportá

1. El Paso 0, con la explicación de por qué el import no escribió las externas.
2. El diff por archivo, resumido.
3. Tests, `tsc` y `test:rules`.
4. **Cuántas actividades de las 2563 pasan el filtro con 30 minutos**, y cuántas quedarían con
   10, 20 y 45. Quiero ver la sensibilidad antes de fijarlo.
5. Cuántos documentos lee Salud ahora al abrir, contra los 2563 de antes.
6. Si los tres campos de marca faltan en los documentos ya importados y qué haría falta para
   completarlos.
7. Cualquier punto donde hayas parado o te hayas apartado del prompt.
