# 75b — Nada se pierde, nada se consulta de más

Repo: jpcofano/shapeup. Continúa P75, que quedó implementado pero **sin confirmar ninguna
importación**. La corrida en seco con el ZIP del 14/09 dio 2246 externas, 300 descartadas y
8 enriquecimientos, y destapó tres cosas que hay que resolver antes de escribir en Firestore.

| Problema | Qué se hace |
|---|---|
| 927 de las 2246 son caminatas que el reloj detectó solo | **Entran igual, marcadas.** Descartar es irreversible; marcar no |
| `getHistorialMiembro` trae **todo** el historial y lo llaman seis pantallas | Se parte en tres consultas, con índice y límite |
| 7 sesiones de ShapeUp viejas no tienen historial que enriquecer y desaparecen en silencio | Entran como externas marcadas, para que P76 las convierta |

Principio: **nada se descarta, todo entra marcado, y ninguna pantalla vuelve a traer el
historial completo.**

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. `getHistorialMiembro` no tiene `limit` y lo llaman `Home`, `Entrenar`, `Salud`,
   `RutinaDetalle`, `HistorialDetalle`, `EntrenarSesionLibre` y `data/enriquecimiento.ts`.
   Confirmá la lista y decí, para cada uno, si necesita las externas o solo las de ShapeUp.
2. Cuántos documentos hay hoy en `/historial` y cuántos tienen el campo `tipo`.
3. `firestore.indexes.json` existe y está declarado en la configuración de Firebase.
4. Cómo se ve, en el ZIP, una sesión autodetectada: `live_data_internal` vacío, sin FC media
   y con los milisegundos en `.000`. Confirmalo contra el ZIP y decí cuántas cumplen cada
   condición por separado. Es el discriminador del ADR #035.

---

## Parte 1 — Todas las filas van a `/cardio`

- El import guarda **todas** las filas de ejercicio en `/cardio`, sin filtrar por destino.
  Es la fuente cruda, ya es idempotente por `datauuid` y es lo que garantiza que no se
  pierda nada.
- **Sacá el toggle "importar también las descartadas"**: ya no hay nada opcional. Todo se
  guarda; lo que cambia es si además genera una entrada en `/historial`.
- El resumen del import lo dice explícito: *"N actividades guardadas. M entraron al
  historial; K quedaron solo en salud por durar menos de {umbral} min."*

---

## Parte 2 — Marcas en la entrada externa

En el grupo `externa` de `Historial`, dos campos más:

```
origen: "declarada" | "autodetectada";
motivoIngreso: "shapeup-sin-sesion" | "vr" | "actividad" | "duracion";
```

**`origen`** lo decide una función pura nueva en `lib/importSelectivo.ts`:

```
esAutodetectada(item): boolean
```

Es verdadera cuando **no hay curva de FC ni FC media**. Si el ZIP trae también
`live_data_internal` vacío o los milisegundos en `.000`, sumalos como señales, pero la
condición principal es la ausencia de FC: es la que se cumple siempre, venga por ZIP o por
la vía D del puente. Documentá la relación con el ADR #035 en el comentario.

**`motivoIngreso`** sale del motivo de la clasificación de P75.

**Regla nueva en `clasificarImport`:** si el motivo es `shapeup` pero **no hay `idHist`** que
enriquecer, el destino pasa de `enriquece` a `externa`, con
`motivoIngreso: "shapeup-sin-sesion"`. Son sesiones tuyas reales, anteriores a la app, y hoy
se pierden en silencio. P76 las va a poder convertir en sesiones de verdad.

**En la UI:** en la lista de historial, una externa autodetectada se ve más tenue y con una
marca chica, del estilo *"detectada por el reloj"*. No la escondas: está para que la veas.

---

## Parte 3 — Consultas que no traen todo

**Migración previa, en un script `scripts/backfill-tipo-historial.ts`:** poner
`tipo: "rutina"` en los documentos de `/historial` que no lo tengan. Son pocos, y es lo que
permite consultar por tipo sin que los viejos queden afuera. Con simulación y `--aplicar`,
con `update()`.

**Índice nuevo en `firestore.indexes.json`:**
`historial` → `miembro` ascendente, `tipo` ascendente, `fechaRealizadaTimestamp`
descendente. Reportá el comando para desplegarlo.

**Tres funciones en `data/historial.ts`:**

| Función | Qué trae | Para quién |
|---|---|---|
| `getHistorialShapeUp(miembro, limite = 200)` | `tipo in ["rutina", "libre"]`, ordenado por fecha descendente | Home, Entrenar, la progresión, los PR, el enriquecimiento, la sesión libre, el detalle de rutina |
| `getHistorialExternas(miembro, { desde, hasta, limite, cursor })` | Solo `tipo == "externa"`, paginada | La vista de historial y el análisis |
| `getDiasActivos(miembro, desde, hasta)` | El conjunto de días con actividad, cada uno con su origen | La serie de adherencia y el análisis |

`getDiasActivos` devuelve, por día:

```
{ fecha: string; shapeUp: boolean; externaDeclarada: boolean; autodetectada: boolean }
```

Así quien consuma decide qué cuenta: la racha del plan mira `shapeUp`, y "me moví" puede
incluir o no lo autodetectado. **No decide por el consumidor.**

**`getHistorialMiembro` se elimina** una vez migrados sus llamadores. Si algún llamador
necesita las dos cosas, que combine las dos consultas: que no vuelva a existir una que
traiga todo.

El límite de 200 en la de ShapeUp va en una constante con un comentario: son más de tres
años entrenando cuatro veces por semana, y si algún día hace falta más, se pagina.

---

## Parte 4 — Confirmar el import

- El `dry-run` ahora también desglosa **por `origen`** y **por `motivoIngreso`**.
- Después de aplicar los cambios, corré el `dry-run` de nuevo con el mismo ZIP y pegame los
  números. **No confirmes la escritura**: eso lo hago yo cuando vea los números.

---

## Tests

- **`esAutodetectada`:** sin FC y sin curva es verdadera; con FC media es falsa; con curva
  pero sin media es falsa; los milisegundos en `.000` por sí solos no alcanzan.
- **`clasificarImport`:** motivo `shapeup` sin `idHist` pasa a externa con
  `motivoIngreso: "shapeup-sin-sesion"`; con `idHist` sigue enriqueciendo.
- **`construirEntradaExterna`:** guarda `origen` y `motivoIngreso`, y el `idHist` sigue
  siendo determinístico.
- **`getDiasActivos`** (con la parte pura extraída y testeada): dos actividades el mismo día
  dan un solo día con las dos marcas; un día con sesión de ShapeUp y caminata trae
  `shapeUp` y `externaDeclarada` en verdadero.
- **Aislamiento de P74, otra vez:** con 2000 externas en el historial, la racha, la
  adherencia, el tonelaje y la progresión no se mueven. Si alguno se pone en rojo, pará.
- Reglas: sin cambios, pero corré `npm run test:rules` igual.

Corré la suite completa y `tsc -b`.

---

## Fuera de alcance

- Convertir las externas en sesiones (P76).
- La serie de adherencia (P77a), que va a consumir `getDiasActivos`.
- Confirmar la importación.

Guardá este prompt como `docs/prompts/75b-marcado-y-consultas.md`.

---

## Al terminar, reportá

1. El Paso 0, punto por punto, con la tabla de quién necesita qué.
2. El diff por archivo, resumido.
3. El resultado de tests, `tsc` y `test:rules`.
4. La simulación del backfill, y si lo aplicaste.
5. **El `dry-run` nuevo**, con el desglose por origen y por motivo de ingreso.
6. Cuántos documentos leería Home ahora, contra los 2246 de antes.
7. Cualquier punto donde hayas parado.
