# 75 — Bloque 5: ingesta total y entradas externas

Repo: jpcofano/shapeup. Diseño en `docs/ROADMAP-producto.md`, Bloque 5. Parte del estado
posterior a P74, que dejó el aislamiento por `tipo` y los tests que este prompt no puede
romper.

**Objetivo:** invertir el criterio de importación. Hoy `importSelectivo.ts` clasifica cada
actividad en relevante o descartada, y **lo descartado se pierde sin dejar rastro**. A
partir de acá nada se descarta: todo se clasifica en uno de tres destinos.

| Caso | Destino |
|---|---|
| Matchea una sesión de ShapeUp | Enriquece ese `Historial`. **No** crea entrada nueva |
| No matchea y dura ≥ umbral | `Historial` nuevo con `tipo: "externa"` |
| No matchea y no llega al umbral | Se lista como descartada, **con el motivo a la vista** |

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. **`guardarCardio` usa `idCardio()`, que es `CAR-${Date.now()}`.** No es idempotente por
   `datauuid`, aunque el comentario del parser diga que sí. Confirmalo, y decime si
   reimportar el mismo ZIP duplica las filas de `/cardio`.
2. `EjercicioItem` trae `_uuid`, `_startMs`, `_endMs`, `_customId` y `_fcMin`, y
   `filtrarCardioRelevante` los usa para decidir.
3. Qué exige `firestore.rules` para crear en `/historial`: listá cada validación. Una
   entrada externa no tiene bloques ni tonelaje y podría no pasar.
4. `ACTIVIDADES_SIEMPRE_RELEVANTES` y `DURACION_MIN_ACTIVIDAD_MIN` son constantes en el
   código, sin nada en `/config`.
5. Qué hace hoy `Salud.tsx` con `filtroCardio.descartadas`: ¿se muestran o se pierden?
6. Los predicados de `lib/tipoHistorial.ts` y el filtro de P74 en `calcularEnriquecimiento`
   y en `solapaConHistorial`.

---

## Parte 1 — Configuración en `/config/import`

- Documento `/config/import`, leído por `data/configImport.ts`, con caché en memoria como
  `data/perfiles.ts`:

  | Campo | Tipo | Default si falta |
  |---|---|---|
  | `duracionMinimaMin` | number | 10 |
  | `actividadesSiempreRelevantes` | string[] | La constante actual |

- **Si el documento no existe, se usan los defaults.** La app no puede depender de que
  alguien lo siembre.
- Las constantes actuales quedan en `importSelectivo.ts` como esos defaults, marcadas como
  tales.
- **El umbral sigue en 10 minutos.** No lo cambies: el roadmap explica por qué. Lo que
  cambia es que ahora es configurable.
- Reglas: `/config/import` se lee como el resto de `/config` y se escribe igual que
  `/config/perfiles`. Agregá los tests de reglas.
- **Sin UI de edición.** Por ahora se cambia desde la consola de Firebase. La pantalla es
  otro prompt.

---

## Parte 2 — El clasificador

`lib/importSelectivo.ts` pasa de filtrar a clasificar. Función nueva, y borrá
`filtrarCardioRelevante` una vez que nadie la use:

```
type DestinoImport = "enriquece" | "externa" | "descartada";

interface ItemClasificado<T> {
  item: T;
  destino: DestinoImport;
  /** Por qué: "shapeup" | "historial" | "vr" | "actividad" | "duracion" | "sin-match" */
  motivo: MotivoClasificacion;
  /** Solo si destino === "enriquece": el idHist que enriquece. */
  idHist?: string;
  /** Texto para mostrarle al usuario, en una línea. */
  explicacion: string;
}

clasificarImport<T>(items, historial, shapeUpCustomIds, config, now): ItemClasificado<T>[]
```

**Reglas, en orden. La primera que aplica define el destino:**

1. `_customId` está en `shapeUpCustomIds` → **enriquece**, motivo `shapeup`.
2. La ventana solapa con un `Historial` de ShapeUp (la tolerancia actual) → **enriquece**,
   motivo `historial`. El `idHist` va en el resultado.
3. `esVR` → **externa**, motivo `vr`, **sin importar la duración**. Una partida corta de VR
   es entrenamiento.
4. La actividad está en la lista configurada y dura ≥ umbral → **externa**, motivo
   `actividad`.
5. Dura ≥ umbral → **externa**, motivo `duracion`. **Es la regla nueva**: una caminata de 40
   minutos ya no se pierde.
6. En cualquier otro caso → **descartada**, motivo `sin-match`.

**El solape se busca solo contra sesiones de ShapeUp**, con `soloShapeUp` de P74. Si no, una
externa de una importación anterior se enriquecería a sí misma.

`explicacion` en castellano y en una línea: *"Caminata de 6 min, sin sesión que la
respalde"*, *"Ya estaba en tu sesión de fuerza del 14/9"*.

---

## Parte 3 — Entradas externas

**Modelo.** En `Historial`, grupo opcional nuevo:

```
externa?: {
  actividad: string;      // "Caminata", "Body Combat"
  datauuid: string;       // el de Samsung: es lo que la hace idempotente
  fuente: FuenteDato;
  distanciaKm?: number;
};
```

Una entrada externa se arma así:

| Campo | Valor |
|---|---|
| `idHist` | `EXT-{datauuid}`, determinístico |
| `tipo` | `"externa"` |
| `nombreRutina` | La actividad, así se ve bien en las listas |
| `idSesion` | `""`: no hay sesión programada |
| `idRutina` | **Ausente**, no vacío |
| `bloques` | `[]` |
| `tonelajeKg`, `totalSeriesHechas`, `rpe` | `null` |
| `duracionRealMin` | La duración de Samsung |
| `inicioMs`, `finMs` | Los de Samsung |
| `biometria` | FC media, máxima, zona y calorías, con lo que ya arma el import |
| `semanaInicio` | El lunes de esa fecha, con el helper que ya exista |

**Idempotencia:** el id sale del `datauuid`, así que reimportar el mismo ZIP, o uno que
solapa, **pisa la misma entrada en vez de duplicarla**. Es la misma estrategia que
`idMetrica`.

La función que la construye es **pura**, en `lib/entradaExterna.ts`, y se testea sola.

---

## Parte 4 — Arreglar la idempotencia del cardio

`guardarCardio` genera `CAR-${Date.now()}`, así que reimportar duplica.

- El id pasa a ser `CAR-{datauuid}` cuando el item trae `_uuid`, y se mantiene el actual
  para la carga manual, que no tiene uuid.
- `importarCardio` usa el mismo criterio, con `setDoc`, que pisa.
- **No migres lo que ya está duplicado en `/cardio`.** Contá cuántos duplicados hay por
  `_startMs` y reportalo; limpiarlos es otro prompt.

---

## Parte 5 — Import

En `Salud.tsx` y en la capa de datos:

- La vista previa del ZIP muestra los tres grupos con su conteo: **enriquecen**, **entran
  como externas**, **descartadas**. Las descartadas se listan con su explicación, hasta 20 y
  con el total. Hoy desaparecen.
- Al confirmar, se escriben las externas y se aplican los enriquecimientos, en batches.
- El resultado dice cuántas de cada una, y cuántas externas eran **actualizaciones** de una
  entrada que ya existía.
- El toggle "importar todo el cardio" que exista hoy: adaptalo o sacalo, según qué signifique
  ahora que nada se descarta. Decidilo y explicá por qué.

**El inventario completo del import es P76.** Acá alcanza con que lo descartado sea visible
en la propia importación.

---

## Tests

- **`clasificarImport`:** una por regla, en orden, más la precedencia entre ellas: algo que
  cumple `shapeup` **y** `duracion` va por `shapeup`.
- Una externa vieja en el historial **no** atrae el match de una actividad nueva.
- **VR corto entra**; caminata corta se descarta.
- **`construirEntradaExterna`:** todos los campos de la tabla, el id determinístico, y que
  dos llamadas con el mismo `datauuid` den el mismo `idHist`.
- **Aislamiento (los de P74 vuelven a correr):** con las externas nuevas en el historial, la
  racha, la adherencia, el tonelaje y la progresión no cambian. **Si alguno de los tests de
  P74 se pone en rojo, pará: es exactamente lo que P74 vino a evitar.**
- **Idempotencia del cardio:** dos imports del mismo item dan un solo documento.
- **Config:** sin documento se usan los defaults; con documento, sus valores.
- Reglas: crear y leer `/config/import`, y crear un `Historial` externo sin bloques.

Corré la suite completa, `tsc -b` y `npm run test:rules`. El JDK 21 ya está instalado; si la
terminal no lo ve, reabrí el editor.

---

## Fuera de alcance

- Enlazar y convertir entradas externas (P76).
- El inventario persistido del import (P76).
- UI para editar `/config/import`.
- Limpiar los duplicados que ya están en `/cardio`.
- La vista de días activos.

Guardá este prompt como `docs/prompts/75-ingesta-total.md`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa, con la respuesta de la 1 y la 3.
2. El diff por archivo, resumido.
3. El resultado de tests, `tsc` y `test:rules`.
4. **Una corrida real con tu último ZIP**, sin confirmar la escritura: cuántas enriquecen,
   cuántas entran como externas y cuántas se descartan, con las primeras diez explicaciones.
   Es lo que dice si el umbral y las reglas están bien.
5. Cuántos duplicados hay hoy en `/cardio`.
6. Qué decidiste con el toggle de "importar todo el cardio".
7. Cualquier punto donde hayas parado.
