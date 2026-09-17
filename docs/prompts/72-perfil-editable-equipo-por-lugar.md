# 72 — Perfil editable y equipo por lugar

Repo: jpcofano/shapeup. Precondición del Bloque 3 (`docs/ROADMAP-producto.md`). Parte de
`6a11326`.

**Objetivo:** que puedas editar tu perfil desde la app, y que el equipo se guarde **por
lugar** (casa, gimnasio, aire libre, VR) en vez de una lista plana. La sustitución de P73
necesita saber qué equipo tenés **en el lugar donde estás hoy**: no sirve que te ofrezca un
ejercicio con polea si estás entrenando en casa.

Hoy el perfil solo se cambia corriendo `seed-perfiles.ts`, y `data/perfiles.ts` únicamente
lee.

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. `PerfilMiembro` tiene `equipoDisponible?: Equipo[]` plano, `lugarHabitual?: Lugar`,
   `color`, `objetivos`, `zonasFC` y `fcMaxTeorica`.
2. `data/perfiles.ts` solo tiene `getPerfiles()`, con caché en memoria.
3. `firestore.rules` permite a cualquier miembro escribir `/config/perfiles`.
4. Quién lee perfiles hoy: `Home`, `Perfil`, `Salud` y `data/enriquecimiento.ts`. Decí qué
   campo usa cada uno.
5. `Rutina` tiene `lugar: Lugar`, y `LUGARES` son Casa, Gimnasio, Aire libre y VR.
6. `/config/perfiles` es un único documento con todos los miembros.

---

## Parte 1 — Modelo

- Campo nuevo: `PerfilMiembro.equipoPorLugar?: Partial<Record<Lugar, Equipo[]>>`.
- `equipoDisponible` **se mantiene en el tipo**, marcado como obsoleto en un comentario. Es
  lo que leen los perfiles todavía sin migrar.
- Función pura en `src/lib/perfil.ts`:

  ```
  equipoDe(perfil: PerfilMiembro | undefined, lugar: Lugar): Equipo[]
  ```

  | Caso | Devuelve |
  |---|---|
  | Hay `equipoPorLugar[lugar]` | Esa lista |
  | No hay, pero sí `equipoDisponible` y el lugar es el `lugarHabitual` | `equipoDisponible` |
  | No hay, y el lugar no es el habitual | `["Peso corporal"]` |
  | Sin perfil | `["Peso corporal"]` |

  El fallback a peso corporal existe porque un lugar sin equipo declarado igual permite
  entrenar; la sustitución de P73 nunca se queda sin candidatos.

- Función pura `migrarEquipoPorLugar(perfil)`: devuelve el perfil con `equipoPorLugar`
  armado a partir de `equipoDisponible` y `lugarHabitual`, y sin `equipoDisponible`. Si ya
  tiene `equipoPorLugar`, lo devuelve igual. La usan la migración y los tests.

---

## Parte 2 — Escritura

En `data/perfiles.ts`:

```
actualizarPerfil(miembro: MiembroId, patch: Partial<PerfilMiembro>): Promise<Result<void>>
```

- Escribe con `setDoc(..., { merge: true })` **solo bajo la clave de ese miembro**, para no
  tocar el perfil de los demás. El documento es uno solo y compartido.
- Invalida la caché en memoria y la vuelve a llenar con lo escrito.
- Para borrar `equipoDisponible` después de migrar, usá `deleteField()`.
- Agregá `invalidarCachePerfiles()`, que los tests y la UI pueden usar.

---

## Parte 3 — UI de perfil

En `src/routes/Perfil.tsx`, para **el miembro logueado** (los demás perfiles siguen siendo
de solo lectura):

- **Lugar habitual:** selección única con los cuatro lugares.
- **Equipo por lugar:** una sección por lugar, plegada, con el lugar habitual abierto por
  defecto. Adentro, los 16 valores de `EQUIPOS` como chips de selección múltiple. El
  encabezado de cada lugar muestra cuántos equipos tiene seleccionados.
- **Objetivos:** chips de selección múltiple con los valores de `OBJETIVOS`.
- **Color:** dejalo como está.
- **`zonasFC` y `fcMaxTeorica`:** de solo lectura, con una nota de que se calculan por edad.
  Editarlos es otro prompt.

**Guardado:** botón **"Guardar"**, habilitado solo si hay cambios. Mientras guarda, queda
deshabilitado; si falla, el error va en línea y los cambios no se pierden. Sin guardado
automático.

Si el perfil todavía tiene `equipoDisponible` y no `equipoPorLugar`, la pantalla muestra
esa lista dentro del lugar habitual, gracias a `equipoDe`. Guardar desde la UI deja el
perfil ya migrado.

---

## Parte 4 — El lugar de la sesión

- `EntrenarState` suma `lugar: Lugar | null`.
- Al montar una sesión, si es `null` se sella con la primera regla que aplique:
  1. el `lugar` de la rutina, si la rutina lo tiene;
  2. el `lugarHabitual` del perfil;
  3. `"Casa"`.
- **Se ve y se cambia en la vista del día de P68b**: un chip en el encabezado, con el lugar
  actual, que abre la selección de los cuatro. Cambiarlo no toca nada más.
- `estadoReiniciado` lo conserva, igual que `idSesion`: seguís en el mismo lugar.
- **En P72 el lugar no filtra nada todavía.** Lo usa P73.

---

## Parte 5 — Migración del documento sembrado

`scripts/migrar-equipo-por-lugar.ts`, con el patrón de `scripts/` (solo `firebase-admin` y
módulos puros; ver `scripts/pureza.test.ts`).

```
npx tsx scripts/migrar-equipo-por-lugar.ts            # simulación
npx tsx scripts/migrar-equipo-por-lugar.ts --aplicar  # escribe
```

- Lee `/config/perfiles` y aplica `migrarEquipoPorLugar` a cada miembro.
- **Escribe con `update()` por clave de miembro, nunca `set()` del documento entero.**
- La simulación imprime, por miembro, el antes y el después.
- Es idempotente: correrlo dos veces no cambia nada la segunda vez.
- Si un miembro no tiene `lugarHabitual`, su equipo va a **Casa** y se avisa.

**Actualizá también `seed-perfiles.ts`** para que siembre `equipoPorLugar` en vez de
`equipoDisponible`, con el equipo actual de cada miembro en su lugar habitual. Que un
reseed no deshaga la migración.

---

## Tests

- **`equipoDe`:** los cuatro casos de la tabla, más un lugar con lista vacía declarada
  (devuelve vacío, no el fallback: declarar "no tengo nada acá" es una decisión).
- **`migrarEquipoPorLugar`:** perfil sin migrar, perfil ya migrado, perfil sin
  `lugarHabitual`, perfil sin ningún equipo.
- **Sellado del lugar de la sesión:** las tres reglas de precedencia, y que
  `estadoReiniciado` lo conserva.
- **`loadEntrenarState`:** un estado previo sin `lugar` carga con `null`.

Corré la suite completa, `tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- El algoritmo de sustitución y el filtro por equipo (P73).
- `lib/elegibilidad.ts`, que sigue siendo código muerto: qué hacer con él es otra decisión.
- Editar zonas de FC.
- Permisos más finos sobre `/config/perfiles`.

Guardá este prompt como `docs/prompts/72-perfil-editable-equipo-por-lugar.md`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests, `tsc` y `test:rules`.
4. La salida de la simulación de la migración, y la de la aplicación si la corriste.
5. Cualquier punto donde hayas parado o te hayas apartado del prompt.
6. Cómo probarlo en el teléfono, en pocos pasos.
