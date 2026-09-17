# 69 — Bloque 4: sin señal

Repo: jpcofano/shapeup. Diseño en `docs/ROADMAP-producto.md`, Bloque 4. Parte del estado
posterior a P68b.

**Objetivo:** entrenar y guardar en el subsuelo del gimnasio sin perder nada, y enterarte
de lo que falta subir.

El roadmap supone que una escritura sin conexión "se guarda local y se encola sola". **Para
el guardado de la sesión eso no es cierto hoy**: `finalizarSesion` usa `runTransaction`, y
las transacciones de Firestore no se encolan offline, fallan. Este prompt lo corrige.

Las decisiones están cerradas. Si alguna es inviable o el código no es como se describe,
**pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. `src/firebase.ts` usa `persistentLocalCache` con `persistentMultipleTabManager`.
2. `finalizarSesion` (`data/historial.ts`):
   - usa `runTransaction`;
   - en la sesión de rutina hace `tx.get` de `/rutinas/{id}` solo para leer el nombre;
   - actualiza la `SesionProgramada` con `tx.update`.
3. `EntrenarSesion.tsx`, en el efecto de carga, hace `await crearSesion(...)` **antes** de
   `setLoading(false)`.
4. `crearSesion` es el único lugar que crea documentos en `/sesiones`. Buscá otros usos.
5. En `src/` no hay manejo de `navigator.onLine` ni de los eventos `online`/`offline`.
6. `getRutina` y `getEjercicio` usan `getDoc`, que sin conexión devuelve la caché si el
   documento está ahí y falla si no está.

---

## Parte 1 — Guardado que se encola

**`finalizarSesion`:**

- Reemplazá `runTransaction` por `writeBatch`.
- **Nombre de la rutina:** el llamador pasa `nombreRutina` (la ruta ya tiene la rutina en
  memoria). Sacá la lectura de `/rutinas`. Si no viene, usá `rutinaId` como hoy.
- **Sesión programada:** reemplazá el `update` por
  `set(doc, { miembro, estado: "Registrada", rpeSesion }, { merge: true })`. Si el
  documento no llegó a crearse (por ejemplo, porque `crearSesion` falló sin señal), un
  `update` haría fallar el batch entero y **se perdería el historial**. El `merge` lo evita.
  `miembro` va para que las reglas de borrado sigan funcionando.
- **Timeout:** `commit()` compite con un timeout de **8 s**:

  | Resultado | Devuelve |
  |---|---|
  | Confirma antes de 8 s | `ok({ idHist, pendiente: false })` |
  | Vencen los 8 s | `ok({ idHist, pendiente: true })`. La escritura ya está en la cola local de Firestore |
  | Error antes de 8 s | `err(...)`, como hoy |

  El tipo de retorno pasa a ser `Result<{ idHist: string; pendiente: boolean }>`.
  Actualizá todos los llamadores.
- **Si queda pendiente:** registrá la sesión en la lista de pendientes (Parte 2) con todo
  lo necesario para reenviarla, y dejá que la promesa del commit siga corriendo:
  - si confirma después, se quita de la lista;
  - si falla después, se marca con error.

**En las dos rutas**, en la pantalla de fin y en "Guardar y salir" de la hoja de salida:

- Con `pendiente: true`, se borra el estado local igual que si hubiera confirmado, y en
  lugar de navegar se muestra: **"Guardado en el teléfono. Se sube cuando haya señal."**
  con un botón **"Listo"**, que navega a donde iba.
- Mientras espera, el botón sigue diciendo "Guardando…". Con el timeout, nunca más de 8 s.

---

## Parte 2 — Sesiones sin subir

Módulo nuevo `src/lib/pendientes.ts`, puro, con la persistencia en localStorage bajo
`sync:pendientes`:

- Cada pendiente guarda:
  - `idHist`, `idSesion`, `nombreRutina`, `fecha`, `creadoMs`, `error?: string`;
  - el **payload** del historial, sin `fechaRealizadaTimestamp`, y el del merge de la sesión.
- Funciones: agregar, quitar, marcar error, listar. JSON corrupto cuenta como lista vacía.
- La función que reenvía vive en `data/historial.ts`, no en el módulo puro.

**Chip en Home:**

- Si hay pendientes, un chip: **"1 sesión sin subir"** / **"N sesiones sin subir"**.
- Si alguna tiene error: **"1 sesión no se pudo subir"**. Al tocarlo se ve el error.

**Conciliación al montar Home**, solo si `navigator.onLine`, una vez por montaje y sin
bloquear la pantalla. Para cada pendiente:

1. `getDocFromServer(historial/{idHist})`.
2. **Si existe:** se quita de la lista.
3. **Si no existe** y pasaron más de 2 minutos desde `creadoMs`: se **reenvía** con un
   `writeBatch` que usa el mismo `idHist` (así no se duplica), con
   `fechaRealizadaTimestamp: serverTimestamp()` y el mismo merge de la sesión.
   - Si confirma, se quita.
   - Si falla, se marca el error.
   - Esto cubre el caso en que el navegador borra la caché de Firestore antes de
     sincronizar.
4. **Si la consulta falla** (por ejemplo, porque se cortó la señal), no se toca nada.

---

## Parte 3 — Indicador sin conexión

- Hook `src/hooks/useConexion.ts`: devuelve `navigator.onLine` y lo actualiza con los
  eventos `online` y `offline`.
- En el header de las dos rutas de sesión, un chip chico **"Sin conexión"** mientras no
  haya señal, con el estilo de avisos que ya usa la app. No debe mover el layout del header.

---

## Parte 4 — Abrir una rutina sin señal

- **`crearSesion` deja de bloquear.** Generá el id del lado del cliente como hoy, devolvé
  el id enseguida y hacé el `setDoc` sin esperarlo, registrando un posible error en
  consola. Dejá el cambio de firma documentado.
  - Mismo criterio para `iniciarSesion`, que ya se llama sin esperar.
  - La ruta asigna el id y sigue.
- **`idSesion()`** usa segundos, así que dos sesiones creadas en el mismo segundo chocan.
  Agregale un sufijo aleatorio corto.
- **Pre-carga de ejercicios:** si un `getEjercicio` falla sin conexión, el bloque se muestra
  sin media, como ya pasa cuando falta en el catálogo. Verificá que la carga no quede
  esperando.
- **Rutina que no está en caché:** si `getRutina` falla y no hay conexión, mostrá
  *"Sin conexión y esta rutina no está guardada en el teléfono. Abrila una vez con señal."*
  en lugar de "Rutina no encontrada".
- **Solo lectura, reportar:** ¿qué pantallas dejan las rutinas en la caché de Firestore
  antes de entrar a entrenar (la lista de Entrenar, el detalle, Home)? Respondé con
  evidencia, sin cambiar nada.

---

## Parte 5 — Barrido de sesiones huérfanas

Función `barrerSesionesHuerfanas(miembro)` en `data/sesiones.ts`:

- Se ejecuta una vez por carga de la app, desde Home, solo con señal y sin bloquear.
- Consulta `/sesiones` con `miembro == X` y `estado in ["Programada", "En curso"]`. Si hace
  falta un índice nuevo, **pará y reportá** antes de agregarlo.
- Borra las que tengan `fechaProgramacion` de hace más de **24 h** y cuyo id **no**
  aparezca como `idSesion` en ningún estado guardado en localStorage (claves
  `entrenar:*`). Esas corresponden a sesiones abiertas en este teléfono.
- Borra en batch y devuelve cuántas borró. Loguealo en consola; no hay UI.
- **Esto también limpia las huérfanas que ya existen**, así que el script aparte que
  estaba pendiente ya no hace falta.
- **Si se borra una sesión que en realidad seguía abierta en otro dispositivo, no se pierde
  nada:** al guardar, el `merge` de la Parte 1 la vuelve a crear como `Registrada`.

La lectura de las claves de localStorage va en una función pura con test.

---

## Tests

- **`pendientes`:** agregar, quitar, marcar error, listar, JSON corrupto.
- **Timeout del guardado:**
  - extraé la competencia entre promesa y timeout a una función pura
    (`conTimeout(promesa, ms)`, o como convenga);
  - testeá con fake timers: confirma a tiempo, vence, y falla antes de vencer.
- **Ids de localStorage:** la función que junta los `idSesion` de las claves `entrenar:*`,
  ignorando otras claves y JSON inválido.
- **`idSesion()`:** dos llamadas en el mismo milisegundo dan ids distintos.
- **Criterio del barrido:** más de 24 h y no presente en la lista local → se borra; en
  cualquier otro caso, no.

Corré la suite completa y `tsc -b`, con la excepción conocida de `firestore.rules.test.ts`.
Si cambiaste algo que afecte las reglas, avisá.

---

## Fuera de alcance

- Service worker, precache de datos y descarga de rutinas para uso offline.
- La cola de sesiones del plan (P82).
- Los docs, salvo guardar este prompt como `docs/prompts/69-sin-senal.md` y **corregir la
  frase del Bloque 4** que dice que la escritura "se encola sola": aclará que las
  transacciones no se encolan y que por eso el guardado pasó a `writeBatch`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests y `tsc`.
4. La respuesta de solo lectura de la Parte 4.
5. Cualquier punto donde hayas parado o te hayas apartado del prompt.
6. **Cómo probarlo en el teléfono:** una lista corta de pasos con el modo avión.
