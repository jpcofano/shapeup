# 67 — Bloque 1: registrar sin fricción (botones, steppers, descanso, dos arreglos)

Repo: jpcofano/shapeup. Continúa la secuencia de `docs/prompts/`. Diseño en
`docs/ROADMAP-producto.md`, Bloque 1 y §12.3. La otra mitad del bloque (hoja de salida,
sesión parcial, `+ serie`, saltar con motivo) es P68 y **no va acá**.

Las decisiones están cerradas. Si alguna es inviable o el código no es como se describe,
**pará y reportá** en vez de reinterpretar. No commitees: el commit lo hace Juan.

---

## Paso 0 — Verificar premisas (solo lectura)

Confirmá cada una antes de editar. Si alguna no se cumple, pará.

1. `src/routes/EntrenarSesion.tsx:42` y `src/routes/EntrenarSesionLibre.tsx:83` tienen
   `startRef = useRef<number>(Date.now())`, y `duracionMin` se calcula con él al finalizar
   (líneas ~215 y ~361).
2. `Historial.inicioMs`/`finMs` salen de `ventanaDeBloques` (`data/historial.ts`), **no** de
   `startRef`. O sea que el bug afecta a `duracionRealMin` y a `TiempoTotal`, no a la ventana.
3. `Ejercicio.equipo` es `Equipo[]` y `EQUIPOS` no tiene un valor "peso corporal con lastre".
4. `firestore.rules`: `/ejercicios` se escribe solo con `isOwner()`.
5. Los dos footers de log rápido (reps / carga / "Serie N hecha" / "Deshacer") están
   duplicados en ambas rutas, y el modo scroll (`BloqueScroll`) no tiene inputs de reps ni carga.

---

## Parte 1 — Arreglo: sellar el inicio de sesión en el estado persistido

- Agregá `inicioMs: number | null` a `EntrenarState`, con `null` en `INITIAL_ENTRENAR_STATE`.
- Función pura nueva `asegurarInicioSesion(state, now = Date.now())`: si `inicioMs` es
  `null`, lo sella; si ya tiene valor, no lo toca. Exponela en `useEntrenarState`.
- **Sesión de rutina:** llamala al montar, en el mismo lugar donde hoy se asegura el
  inicio de serie.
- **Sesión libre:** llamala en `empezarSesion()` y en el camino del atajo, inmediatamente
  después de `session.reiniciar()`. Las actualizaciones encoladas se aplican sobre el
  estado reiniciado; verificá que el orden quede bien.
- Eliminá los dos `startRef`. `duracionMin` y `TiempoTotal` pasan a leer `state.inicioMs`.
  Si es `null` al finalizar, `duracionMin` es `null`.
- **Estado viejo en localStorage:** `loadEntrenarState` ya hace merge con
  `INITIAL_ENTRENAR_STATE`, así que un estado previo sin el campo carga con `null` y se
  sella al montar. Es aceptable: afecta una sola vez a una sesión que esté en curso durante
  el deploy.
- Corregí el comentario de `TiempoTotal`, que dice "desde el primer `serieInicioMs`" y no
  es lo que hace.

---

## Parte 2 — Arreglo: "Reiniciar sesión" con confirmación

- El botón del header queda, pero **separado del toggle de modo**: hacia el final del
  header, con un gap de al menos 16 px respecto del toggle. P68 lo va a mover a la hoja de
  salida.
- Si hay al menos una serie hecha en toda la sesión, antes de reiniciar mostrá una
  confirmación con el estilo de hojas o modales que ya use la app (no `window.confirm`):
  **"¿Reiniciar la sesión? Se borran N series registradas."** con *Reiniciar* (destructivo)
  y *Cancelar*. Si no hay series, reinicia directo.
- Aplicá lo mismo a "Empezar de nuevo" en la pantalla de fin, en las dos rutas.
- Implementalo una sola vez y usalo en ambas rutas.

---

## Parte 3 — Footer de registro compartido, con steppers

Extraé el footer a un componente compartido, `src/components/entrenar/RegistroSerie.tsx`,
y usalo en las dos rutas. El comportamiento que ya existe (herencia de valores entre series,
`disabled` al llegar a `seriesObjetivo`, pulso) se mantiene igual.

**Steppers** (solo en bloques Fuerza, como hoy):

- `−` y `+` grandes a cada lado del número, con área táctil de al menos 56×56 px. El número
  sigue siendo un input tocable: `inputMode="decimal"` para la carga y `"numeric"` para las reps.
- **Reps:** paso de ±1, mínimo 1.
- **Carga:** paso `pasoCarga(ejercicio)` (ver Parte 4), mínimo 0, redondeo a 2 decimales.
- **Campo vacío:** el stepper parte del valor del placeholder (la prescripción). Si no hay
  placeholder, parte de 0 para la carga y de 1 para las reps.

**Botones:**

- "Serie N hecha": `min-height: 76px` y tipografía proporcional.
- "Deshacer última serie": separado al menos 20 px del botón principal, con estilo
  secundario o de texto, más bajo que el principal.
- El footer tiene `padding-bottom: max(16px, env(safe-area-inset-bottom))`.

---

## Parte 4 — Paso de carga por ejercicio

**Modelo:** agregá `Ejercicio.pasoCargaKg?: number` en `types/models.ts`, en la sección de
prescripción/uso. Si `EjercicioInput` lo necesita para `actualizarEjercicio`, sumalo ahí.

**Función pura** `pasoCarga(ej: Ejercicio | undefined): number` en `src/lib/pasoCarga.ts`:

1. Si `ej?.pasoCargaKg` es mayor que 0, devuelve ese valor.
2. Si no, recorre esta prioridad y devuelve el **primero** que esté en `ej.equipo`
   (el orden lo da la prioridad, no el array):

   | Equipo | Paso |
   |---|---|
   | `Barra` | 5 |
   | `Polea` | 5 |
   | `Máquina` | 5 |
   | `Kettlebell` | 4 |
   | `Mancuernas` | 2.5 |
   | `Peso corporal` | 1.25 |

3. Si no encuentra ninguno, o si `ej` es `undefined`, devuelve 2.5.

**Editor por toque largo sobre el stepper de carga** (el `−` o el `+`):

- Toque largo de 500 ms con pointer events. El toque largo **no** dispara el paso
  (cancelá el click). Si el dedo se mueve más de 10 px, se cancela.
- Abre una hoja chica titulada "Paso de carga — {nombre del ejercicio}", con chips
  `1 · 1.25 · 2 · 2.5 · 4 · 5` y la opción **"Usar default del equipo ({valor})"**. El chip
  activo queda marcado.
- Elegir un chip guarda con `actualizarEjercicio(id, { pasoCargaKg })`. El default del
  equipo guarda borrando el campo (usá `deleteField()` si `updateDoc` lo necesita; no
  guardes `null` ni `undefined`).
- La UI actualiza al instante, sin esperar la escritura: en la sesión de rutina, en el mapa
  `catalogo`; en la sesión libre, en `ejercicios`.
- Si la escritura falla, mostrá el error en línea y **mantené el paso elegido para el resto
  de la sesión**. No lo reviertas.
- Si el bloque no tiene ejercicio resuelto en el catálogo, el toque largo no hace nada.

---

## Parte 5 — Descanso: "Seguir", `−30 s` y `+30 s` después de terminar

En `DescansoTimer.tsx` y `entrenarState.ts`:

- **Estado terminado** (`remaining === 0`):
  - el botón principal dice **"Seguir"** (hoy dice "Saltar") y es más grande;
  - la acción es la misma, `saltarDescanso`, que sella `serieInicioMs` en el momento en que
    se toca "Seguir". Ese comportamiento es el correcto.
- **Mientras corre:** tres botones, `−30 s` · `+30 s` · `Saltar`, con "Saltar" como principal.
- **`−30 s`** queda deshabilitado cuando `remaining ≤ 30 s`. Así nunca dispara la alarma
  por recortar.
- **`+30 s` en estado terminado** reinicia una cuenta de 30 s desde ahora:
  `durMs = (now − startMs) + 30 000`.
  - Hoy suma a un `durMs` ya vencido: si pasaron más de 30 s, el descanso sigue en 0 y el
    efecto vuelve a sonar la alarma porque `state.descanso` cambió.
  - Implementalo en `ajustarDescanso` con un parámetro `now` (default `Date.now()`), y que
    el hook lo pase.
- La alarma debe sonar **una vez por fin de cuenta**. Verificá que agregar o quitar tiempo
  mientras corre no la dispare.
- Sin auto-advance: el descanso nunca avanza solo.

---

## Tests

En los `*.test.ts` existentes o en archivos nuevos al lado:

- **`pasoCarga`:**
  - override;
  - override 0 o negativo, que se ignora;
  - prioridad con más de un equipo (por ejemplo `["Mancuernas", "Barra"]` da 5);
  - sin equipo conocido;
  - `undefined`.
- **`asegurarInicioSesion`:**
  - sella si es `null`;
  - no pisa un valor existente;
  - un estado viejo sin el campo carga con `null` a través de `loadEntrenarState`.
- **`ajustarDescanso`:**
  - `+30` mientras corre;
  - `−30` con clamp;
  - `+30` en estado terminado reinicia desde `now`;
  - sin descanso devuelve el mismo estado.

Corré la suite completa y `tsc`. Deben quedar en verde.

---

## Fuera de alcance — no tocar

- La X, la hoja de salida, la sesión parcial, `+ serie` y saltar ejercicio (todo eso es P68).
- El modo scroll.
- `data/historial.ts`, salvo lo que la Parte 1 exija.
- Los docs, salvo guardar este prompt como `docs/prompts/67-bloque1-registro.md`.

---

## Al terminar, reportá

1. El resultado del Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests y `tsc`.
4. **Una verificación de solo lectura, sin arreglarla:** la sesión libre guarda
   `ejercicios` y `sesionIniciada` en estado de React y no en localStorage. ¿Recargar a
   mitad de una sesión libre pierde la lista de ejercicios mientras el progreso sigue en
   localStorage? Respondé sí o no, con evidencia. Va a P68 o P69.
5. Cualquier punto donde hayas parado.
