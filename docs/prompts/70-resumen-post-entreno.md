# 70 — Bloque 2: resumen post-entreno y RIR

Repo: jpcofano/shapeup. Diseño en `docs/ROADMAP-producto.md`, Bloque 2. Parte de `be865ee`
(P69).

**Objetivo:** que al terminar veas qué hiciste y cómo te fue respecto de la última vez, y que
queden cargados los datos que hoy nunca se llenan: RIR, sensación y molestias.

Las decisiones están cerradas. Si alguna es inviable o el código no es como se describe,
**pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. La pantalla de fin está duplicada en `EntrenarSesion.tsx` y `EntrenarSesionLibre.tsx`,
   con diez botones de RPE sin leyenda.
2. `SerieRegistro.rir` existe y ningún código lo escribe. Confirmá también que
   `completarSerie` copia al registro los campos que recibe en `reg`, de modo que un `rir`
   pasado ahí llegue al historial.
3. `Historial.comoMeSenti`, `queMejorar` y `notas` existen. `finalizarSesion` escribe
   `notas: notas ?? ""` y no escribe los otros dos. Ninguna vista los muestra.
4. En `lib/progresion.ts`, `sesionesDelEjercicio` no está exportada.
5. `EntrenarSesion` carga `historialMiembro`; `EntrenarSesionLibre` no carga historial.
6. No existe ningún campo de sustitución en el registro (el bloque 3 todavía no se hizo).

---

## Parte 1 — Cálculos puros

Módulo nuevo `src/lib/resumenSesion.ts`, sin Firebase. Todas las funciones reciben los
`BloqueRegistro[]` de la sesión actual y, cuando corresponde, el historial previo del miembro.

**Cifras de la sesión**

`cifrasSesion(bloques, inicioMs, now)` devuelve:

| Cifra | Cálculo |
|---|---|
| `tonelajeKg` | `tonelajeKg` de `metricas.ts` |
| `seriesEfectivas` | Series completadas, extras incluidas |
| `duracionMin` | Redondeo de `(now − inicioMs) / 60 000`. `null` si falta `inicioMs` |

**Comparación con la última vez**

`deltaEjercicio(bloque, historial)` compara con la **última sesión anterior** en la que se
hizo el mismo `idEjercicio` en modalidad Fuerza con series completadas. Reutilizá
`sesionesDelEjercicio`: exportala o extraé la lógica, sin duplicarla. Devuelve una de estas
formas:

| Caso | Resultado |
|---|---|
| Sin sesión anterior | `{ tipo: "primera-vez" }` |
| Hoy o la última vez sin carga registrada | `{ tipo: "sin-carga" }` |
| Carga máxima distinta | `{ tipo: "carga", deltaKg }` (positivo o negativo) |
| Misma carga máxima | `{ tipo: "reps", deltaReps }`, comparando las reps máximas hechas con esa carga. `0` significa "igual" |

Ignorá las series no completadas. Redondeá los kg a 2 decimales.

**PR y 1RM estimado**

- `esPR(bloque, historial)`: es verdadero si la carga máxima de hoy **supera** la carga
  máxima de **todas** las sesiones anteriores de ese ejercicio. La primera vez nunca es PR.
- `e1rmKg(series)`: fórmula de Epley, `carga × (1 + reps / 30)`.
  - Solo usa series completadas con carga mayor que 0 y reps entre 1 y 10. Por encima de
    10 reps la estimación no es confiable.
  - Devuelve el máximo, redondeado a 1 decimal, o `undefined` si no hay ninguna serie válida.

**Sustitución**

Todavía no existe. Dejá `deltaEjercicio` preparado: si el bloque trae un campo de
sustitución (lo agrega el bloque 3), devuelve `{ tipo: "sustituido" }`. Hoy ese caso nunca
ocurre. **No** agregues el campo al modelo.

**Escala de RPE**

`leyendaRpe(n)` devuelve el texto de cada valor:

| RPE | Leyenda |
|---|---|
| 1–5 | "Liviano — te sobraban muchas reps" |
| 6 | "Moderado — 4 o más en reserva" |
| 7 | "Exigente — unas 3 en reserva" |
| 8 | "Duro — unas 2 en reserva" |
| 9 | "Muy duro — 1 en reserva" |
| 10 | "Máximo — no quedaba ninguna" |

---

## Parte 2 — Modelo

- `BloqueRegistro.e1rmKg?: number`. `construirBloquesRegistro` lo calcula para los bloques
  de Fuerza con `e1rmKg(series)` y lo escribe **solo si hay valor**. No se muestra en
  ninguna pantalla: queda para la curva de progreso y el análisis.
- `Historial.molestias?: ZonaMolestia[]`, con
  `type ZonaMolestia = "hombro" | "codo" | "muñeca" | "espalda" | "cadera" | "rodilla" | "tobillo" | "otra"`.
  Va estructurado, y no como texto en `notas`, para que el análisis pueda contarlo.
- `finalizarSesion` recibe `comoMeSenti`, `queMejorar` y `molestias`, todos opcionales,
  y los escribe solo si vienen (en el caso de `molestias`, solo si el array no está vacío).
  `notas` sigue igual.
- Los pendientes de P69 guardan el payload completo, así que los campos nuevos viajan solos.
  Verificalo.

---

## Parte 3 — RIR en la última serie

En `RegistroSerie`, **solo** en bloques de Fuerza y **solo** cuando la próxima serie es la
última del objetivo (`seriesHechas + 1 === objetivo`):

- Arriba del botón principal, la etiqueta **"¿Cuántas te quedaban?"** y cuatro botones
  grandes: **`0 · 1 · 2 · 3+`**. `3+` se guarda como `3`.
- Es opcional y de selección única. Tocar el botón activo lo desmarca.
- Al tocar "Serie N hecha", el valor elegido viaja en `reg.rir`. Después se limpia.
- No aparece en las series anteriores, en las extras ni en el modo scroll.
- Los botones tienen al menos 48 px de alto y no empujan el botón principal fuera de la
  pantalla. Verificá el layout con el teclado numérico cerrado.
- Las dos rutas pasan el `rir` en el `reg` que ya arman.

**`sugerirProgresion` no cambia en este prompt.** Solo se registra el dato.

---

## Parte 4 — Pantalla de fin compartida

Extraé la pantalla de fin a `src/components/entrenar/ResumenSesion.tsx` y usala en las dos
rutas. Todo lo que P68b agregó se mantiene: título según `rutinaCompleta`, salteados con
"Retomar", chip "+ serie", "Sumar otro ejercicio" en la libre, "Empezar de nuevo" y el aviso
de guardado pendiente de P69.

La pantalla muestra, en este orden:

1. **Título**, como hoy.
2. **Tres cifras en fila:** tonelaje (en kg, sin decimales; si es 0, "—"), series y
   duración (en minutos; si es `null`, "—").
3. **Lista de ejercicios hechos**, solo los que tienen al menos una serie completada. Cada
   fila muestra el nombre, `series × mejor carga` y a la derecha:
   - **PR:** un chip destacado **"PR"**, que reemplaza al delta.
   - **Si no es PR,** el delta:

     | Caso | Se muestra |
     |---|---|
     | Carga | `+2.5 kg` / `−2.5 kg` |
     | Reps | `+1 rep`, `+2 reps` / `−1 rep` |
     | Reps en 0 | `=` |
     | Primera vez | "Primera vez" |
     | Sin carga | Nada |
     | Sustituido | "Sustituido — sin comparación" |

   - Los deltas positivos van en el color de acento, los negativos en color neutro (no rojo).
4. **Salteados**, como en P68b.
5. **RPE:** los diez botones, y debajo la leyenda del valor elegido. Sin selección:
   *"Tocá un número. 7 = te quedaban unas 3 reps."*
6. **Sensación** (`comoMeSenti`), opcional, selección única:
   *Con energía · Normal · Cansado · Muy cansado*.
7. **Molestias** (`molestias`), opcional, selección múltiple con las ocho zonas y la opción
   *Ninguna*, que limpia las demás.
8. **Qué mejorar** (`queMejorar`), opcional, selección múltiple:
   *Técnica · Descanso entre series · Subir carga · Dormir mejor · Comer mejor*. Se guarda
   como texto, con los valores unidos por `", "`.
9. **Nota libre**, un campo de texto de una línea. Va a `notas`.
10. **Botones**, como hoy.

Usá los estilos de chips que ya existen. Las secciones 6 a 9 van plegadas bajo un toggle
**"Cómo te sentiste"**, cerrado por defecto, para que la pantalla no se alargue. El RPE
queda afuera del pliegue.

**Historial para los deltas:**

- `EntrenarSesion` ya lo tiene.
- `EntrenarSesionLibre` lo carga al montar, igual que la ruta de rutina, sin bloquear nada.
- Si el historial no cargó (por ejemplo, sin señal y sin caché), los deltas no se muestran.
  No muestres "Primera vez" por error en ese caso.
- **Excluí la sesión actual** del historial si ya figura, por ejemplo después de un guardado
  pendiente que quedó en la caché.

**Guardar y salir desde la hoja de salida (sesión parcial):** no muestra resumen y no cambia.

---

## Parte 5 — Historial

En `HistorialDetalle.tsx`, si existen, mostrá la sensación, las molestias, qué mejorar y la
nota, en una sección **"Cómo te sentiste"** debajo de los bloques. Si no hay ninguno, la
sección no aparece. En la vista de cada serie, mostrá el RIR si existe (`RIR 2`). No toques
ningún cálculo.

---

## Tests

- **`cifrasSesion`:** con series de Fuerza y de otras modalidades, extras incluidas, y sin
  `inicioMs`.
- **`deltaEjercicio`:**
  - primera vez;
  - sin carga;
  - carga que sube y carga que baja;
  - misma carga con reps que suben, bajan o quedan iguales;
  - ignora las series no completadas;
  - usa la **última** sesión anterior aunque haya otras más viejas;
  - el caso sustituido, con un bloque armado a mano que traiga el campo.
- **`esPR`:** supera a todas, empata (no es PR), primera vez (no es PR), y supera a la
  última pero no a una más vieja (no es PR).
- **`e1rmKg`:** Epley correcto, ignora reps mayores a 10 y carga 0, `undefined` sin series
  válidas, redondeo.
- **`leyendaRpe`:** los bordes 5, 6 y 10.
- **`construirBloquesRegistro`:** escribe `e1rmKg` solo si hay valor.
- **`completarSerie`:** con `rir` en el `reg`, el registro lo conserva.

Corré la suite completa y `tsc -b`, con la excepción conocida de `firestore.rules.test.ts`.

---

## Fuera de alcance

- Usar el RIR en `sugerirProgresion`: es una decisión aparte.
- Mostrar el 1RM estimado.
- El bloque 3 (sustitución).
- El resumen en la sesión parcial.
- Los docs, salvo guardar este prompt como `docs/prompts/70-resumen-post-entreno.md`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests y `tsc`.
4. Cualquier punto donde hayas parado o te hayas apartado del prompt.
5. Cómo probarlo en el teléfono, en pocos pasos.
