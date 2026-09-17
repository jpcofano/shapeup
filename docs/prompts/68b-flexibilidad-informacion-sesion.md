# 68b — Bloque 1: flexibilidad e información en la sesión

Repo: jpcofano/shapeup. Parte de `2fb4fab` (P68). Cierra el Bloque 1 de
`docs/ROADMAP-producto.md`.

**Objetivo:** durante la sesión, saber qué hay y poder cambiar el orden.

- Cuántas series tiene el ejercicio, qué ejercicios tiene el día y qué viene después.
- Ir a otro ejercicio, saltear uno, volver a uno salteado y hacer una serie de más.

Las decisiones están cerradas. Si alguna es inviable o el código no es como se describe,
**pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. `completarSerie` corta en `seriesObjetivo` y, al completar un bloque, avanza con
   `proximoBloqueIncompleto`.
2. En el modo guiado no hay navegación entre bloques. `irABloque`, `siguienteBloque` y
   `anteriorBloque` existen en `entrenarState.ts`.
3. `BloqueScroll` llama a `bloqueCompleto` con una rutina de un solo bloque, en el índice 0.
4. `quitarBloques` (P68) reindexa los registros por índice.
5. `BloqueGuiado` muestra "Ejercicio X de N" y "Serie N · {objetivo}", sin el total de series.
6. En `src/` no hay `useBlocker`, react-router es 7.x y la app usa `createBrowserRouter`.

---

## Parte 1 — Modelo y estado

**`types/models.ts`:**

- `export type MotivoSalto = "dolor" | "equipo-ocupado" | "sin-tiempo" | "otro";`
- `BloqueRegistro.saltado?: boolean` y `BloqueRegistro.motivoSalto?: MotivoSalto`.
  Se escriben solo si el bloque se salteó.

**`EntrenarState`:**

- `saltados: Record<number, MotivoSalto | null>`: `null` quiere decir salteado sin motivo.
- `ultimoBloqueCerrado: number | null`: el último bloque que se dejó por completarlo o
  por saltearlo. Lo usa el chip de la Parte 4.
- Los dos arrancan vacíos o en `null`, y un estado viejo carga con esos valores.
- `estadoReiniciado` también los limpia.

**Funciones puras nuevas o cambiadas en `entrenarState.ts`:**

| Función | Qué hace |
|---|---|
| `bloqueSaltado(state, idx)` | Nueva |
| `bloqueResuelto(state, rutina, idx)` | Nueva: completo **o** salteado |
| `rutinaTerminada(state, rutina)` | Nueva: todos los bloques resueltos. Decide cuándo se muestra la pantalla de fin |
| `rutinaCompleta` | **Sin cambios**: todos completos. Decide la completitud |
| `proximoBloqueIncompleto` | Pasa a saltear los bloques **resueltos** (actualizá su JSDoc). `bloqueCompleto` no cambia, así que `BloqueScroll` sigue funcionando |
| `saltarBloque(state, rutina, idx, motivo, now)` | Marca el salto. Cancela el descanso si era de ese bloque. Borra `serieInicioMs[idx]`. Setea `ultimoBloqueCerrado = idx` y avanza al próximo pendiente, si hay. No hace nada si el bloque ya está completo |
| `retomarBloque(state, idx)` | Quita el salto, `bloqueActual = idx`, `ultimoBloqueCerrado = null`. Las series que ya se hicieron se conservan |
| `irABloque(state, idx)` | Además de cambiar de bloque: borra el `serieInicioMs` del bloque que se deja, cancela el descanso si era de ese bloque y pone `ultimoBloqueCerrado = null` |

**`completarSerie`** recibe un argumento final opcional, `{ extra?: boolean }`:

- **Con `extra`:** registra aunque `hechas >= objetivo`. Sin descanso, sin avanzar y sin
  tocar `ultimoBloqueCerrado`.
- **Sin `extra`:** hace lo mismo que hoy. Además:
  - si completa el bloque y avanza, setea `ultimoBloqueCerrado = idx`;
  - si completa una serie de un bloque distinto de `ultimoBloqueCerrado`, lo pone en `null`.
- Las series extra se numeran a continuación (4, 5…). No hace falta un campo nuevo: son
  extra las que superan `seriesObjetivo`.

**`quitarBloques`** también reindexa `saltados` y ajusta `ultimoBloqueCerrado`. Si ese
bloque se quitó, queda en `null`.

**`construirBloquesRegistro`** agrega `saltado: true` y `motivoSalto` (si hay) en los
bloques salteados.

---

## Parte 2 — Información en el bloque

**En `BloqueGuiado`:**

- El chip del objetivo pasa a decir **"Serie N de M · {objetivo}"**. Si el bloque está
  completo y se está haciendo una extra, dice **"Serie extra · {objetivo}"**.
- **"Ejercicio X de N"** pasa a ser un botón con un indicador visual de que se toca
  (por ejemplo, un chevron) y abre la vista del día (Parte 3).
- Debajo del chip del objetivo va la línea **"A continuación: {nombre}"**, con el próximo
  pendiente según `proximoBloqueIncompleto`. Si no hay ninguno: **"Último ejercicio"**.
- **Bloque salteado** (se llega a él desde la vista del día): en lugar del chip del
  objetivo, *"Salteado · {motivo legible}"* y el botón **"Retomar"**, que llama a
  `retomarBloque`. El footer de registro no se muestra.

**En `DescansoTimer`:** prop opcional `aContinuacion?: string`. Se muestra abajo del reloj
**solo** en el descanso previo a la última serie del bloque, con el nombre del próximo
pendiente.

**Footer (`RegistroSerie`), con el bloque completo:** el botón principal dice
**"+ Serie extra"** y llama a `completarSerie` con `extra: true`. Deja de estar
deshabilitado. "Deshacer" sigue funcionando igual.

---

## Parte 3 — Vista del día

Componente nuevo, `src/components/entrenar/VistaDia.tsx`, en una hoja.

**Encabezado:** *"{nombre de la rutina} · N ejercicios · ~M min"*.

- M sale de `rutina.duracionEstimadaMin` o, si falta, de `estimarDuracionMin(rutina)`.
- En la sesión libre, el nombre es "Sesión libre" y no se muestran minutos.

**Una fila por bloque**, con:

- número y nombre;
- prescripción corta: `{series} × {objetivoSerieLabel}`;
- estado:

  | Estado | Cómo se ve |
  |---|---|
  | Hecho | ✓ y `hechas/objetivo`, más `+k` si hubo extras |
  | En curso | Resaltado (es el bloque actual) |
  | Parcial | `hechas/objetivo` |
  | Salteado | "Salteado" y el motivo |
  | Pendiente | Sin marca |

**Tocar una fila:**

- si es el bloque actual, cierra la hoja;
- si no, llama a `irABloque(idx)` y cierra.
- Los bloques hechos y los salteados también se pueden tocar. En los hechos se ve el
  "+ Serie extra"; en los salteados, "Retomar".

**Botón al pie:** *"Empezar"* si no hay ninguna serie hecha; si no, *"Cerrar"*.

**Cuándo se abre:**

- **Sesión de rutina:** se abre sola al montar si hay 0 series, el modo es guiado y no se
  abrió la hoja de salida por sesión vieja. Evaluado una vez por montaje.
- **Sesión libre:** nunca se abre sola, porque la lista la acabás de armar vos.
- **En las dos:** desde el contador, siempre que no haya descanso en curso.

Usala en las dos rutas.

---

## Parte 4 — `+ serie` y saltar ejercicio

**Chip del bloque anterior.** Se muestra en el modo guiado, sin descanso en curso, cuando
`ultimoBloqueCerrado` no es `null` y es distinto del bloque actual.

- **Si ese bloque quedó completo:** "+ serie de {nombre}", que llama a `completarSerie`
  sobre ese índice con `extra: true`. Si ya tiene extras, suma un "Deshacer" que solo
  borra extras (llama a `deshacerSerie` solo si `hechas > objetivo`).
- **Si se salteó:** "Saltaste {nombre} · Volver", que llama a `retomarBloque`.
- Desaparece solo, por las reglas de `ultimoBloqueCerrado` de la Parte 1.

Un componente, `BloqueAnteriorChip.tsx`, usado en las dos rutas.

**Saltar ejercicio:**

- Link secundario **"Saltar ejercicio"** en el footer, del lado opuesto a "Deshacer", con
  el mismo estilo. Solo si el bloque no está completo.
- Abre una hoja con los chips de motivo, **opcionales** y de selección única: *Dolor ·
  Equipo ocupado · Sin tiempo · Otro*. Abajo, *Saltar* y *Cancelar*.
- *Saltar* llama a `saltarBloque`.

**Pantalla de fin**, que ahora se muestra con `rutinaTerminada`:

- Si `rutinaCompleta`, queda como hoy.
- Si no:
  - el título dice **"Sesión terminada"** en lugar de "¡Sesión completada!";
  - debajo, una fila por cada bloque salteado, con su nombre, su motivo y el botón
    **"Retomar"**, que llama a `retomarBloque` y vuelve al modo guiado;
  - "Finalizar y guardar" pasa `completitud` como `rutinaCompleta ? "completa" : "parcial"`.
- Si el último bloque cerrado quedó completo, se muestra también el chip
  "+ serie de {nombre}".

Aplicalo en las dos rutas.

**Historial:** en `HistorialDetalle.tsx`, a cada bloque con `saltado` agregale
"Salteado · {motivo}". No cambies ningún cálculo.

---

## Parte 5 — El botón "atrás" pasa por la hoja de salida

En las dos rutas, con `useBlocker` de react-router:

- **Bloquea** cuando la sesión está en curso: `state.inicioMs` no es `null`, no se está
  cargando y, en la sesión libre, ya está `sesionIniciada`. Además tiene que ser una
  navegación a otra ruta y no tiene que haber una salida ya en marcha.
- **Salida en marcha:** es un ref que se pone en `true` antes de cualquier navegación que
  salga de las opciones de la hoja, de la pantalla de fin o del atajo.
- **Al bloquear:** `blocker.reset()` y se abre la hoja de salida. Las opciones de la hoja
  navegan como ya lo hacen, con el ref en `true`.
- **No agregues `beforeunload`:** cerrar la pestaña deja el estado en localStorage, y P68
  ya lo recupera.

---

## Parte 6 — Roadmap

En `docs/ROADMAP-producto.md`:

1. **Bloque 1:** agregá un bullet **"Información y orden en la sesión"** que describa:
   - "Serie N de M";
   - "A continuación";
   - la vista del día, que se abre sola al entrar a una rutina sin series, se abre también
     desde el contador y permite ir a cualquier ejercicio;
   - retomar ejercicios salteados;
   - que el "atrás" del sistema pasa por la hoja de salida.

   Aclará que la vista del día es donde después va a vivir "recortar la rutina" del
   bloque 8.
2. **Tabla de orden de prompts:** dividí la fila de P68 en **P68** (hoja de salida, sesión
   parcial, una `SesionProgramada` por sesión, sesión libre persistida) y **P68b** (este
   prompt). Las dependencias de P69 y P70 pasan a ser P68b.

No toques otros bloques.

---

## Tests

- **`saltarBloque`:**
  - con y sin motivo;
  - cancela el descanso de ese bloque;
  - avanza al próximo pendiente;
  - no hace nada en un bloque completo;
  - si era el último pendiente, `rutinaTerminada` es verdadero y `rutinaCompleta` es falso.
- **`retomarBloque`:** conserva las series y deja `ultimoBloqueCerrado` en `null`.
- **`completarSerie` con `extra`:** pasa el objetivo, no genera descanso, no avanza y
  numera 4, 5…
- **`ultimoBloqueCerrado`:**
  - se setea al completar o saltear;
  - se limpia al completar una serie de otro bloque, al usar `irABloque` y al retomar.
- **`proximoBloqueIncompleto`:** saltea los salteados, incluido el recorrido de vuelta desde
  el principio.
- **`irABloque`:** borra el `serieInicioMs` del bloque que se deja y cancela su descanso.
- **`quitarBloques`:** reindexa `saltados` y ajusta `ultimoBloqueCerrado`.
- **`construirBloquesRegistro`:** marca `saltado` y `motivoSalto` solo donde corresponde.
- **`loadEntrenarState`:** un estado previo sin los campos nuevos carga con los valores
  iniciales.

Corré la suite completa y `tsc -b`, con la excepción conocida de `firestore.rules.test.ts`.

---

## Fuera de alcance

- La sustitución (bloque 3): el motivo solo se guarda.
- Recortar la rutina (bloque 8).
- El modo scroll, más allá de que no se rompa.
- Limpiar las sesiones huérfanas existentes.

Guardá este prompt como `docs/prompts/68b-flexibilidad-informacion-sesion.md`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests y `tsc`.
4. Cualquier punto donde hayas parado o te hayas apartado del prompt.
