# Tarea: Borrar historial de entrenamiento (de a uno + todo)

Repo: jpcofano/shapeup. Implementá el borrado de historial, espejando el UI kit
ya diseñado en `ui_kits/shapeup/screens-salud.jsx` (componente `Historial`).

## 1. Capa de datos — `src/data/historial.ts`
Agregá dos funciones nuevas (no toques `finalizarSesion`). Respetan reglas de
Firestore (escriben solo docs del miembro) y NO tocan /ejercicios ni /rutinas.

- `borrarSesionHistorial(idHist: string): Promise<Result<void>>`
  - Borra `/historial/{idHist}` y su subcolección `media` (Firestore no la borra en
    cascada: leé `collection(ref, "media")` y borrá cada doc en un writeBatch).
  - Si el doc de historial tiene `idSesion`, borrá también `/sesiones/{idSesion}`.

- `borrarHistorialMiembro(miembro: MiembroId): Promise<Result<{historial:number; sesiones:number}>>`
  - Query `/historial where miembro == miembro` → por cada doc borrá subcolección
    `media` + el doc. Query `/sesiones where miembro == miembro` → borrá cada doc.
  - writeBatch con flush cada 400 ops. Devolvé los counts.

Usá `ok/err/firebaseErrorMessage` de `lib/result` (patrón existente).

## 2. UI — `src/routes/Historial.tsx`
Portá 1:1 lo del kit (`ui_kits/shapeup/screens-salud.jsx` → `Historial`):
- Estado `editMode` + toggle 🗑 (icono `trash-2`) arriba a la derecha del header,
  visible solo en la tab "Sesiones" y si hay sesiones. En edición el botón dice "Listo".
- En edición, cada card de sesión muestra un botón borrar (danger) a la derecha →
  abre confirmación para ESA sesión → llama `borrarSesionHistorial(idHist)`.
- Abajo, botón "Borrar todo el historial" → confirmación → `borrarHistorialMiembro(miembroActual)`.
- Hoja de confirmación (reusá el modal/sheet existente) con doble texto: "No se
  puede deshacer" + "Tus rutinas y ejercicios no se tocan".
- Estado vacío cuando no quedan sesiones.
- `miembroActual` viene de `useAuth()`. Tras borrar, refrescá la lista
  (`getHistorialMiembro`) o filtrá el estado local.

## 3. Reglas / seguridad
Las reglas ya permiten `delete` a familyMember en /historial, /sesiones y
/historial/{id}/media. Verificá que sea así; si falta `allow delete`, agregalo
restringido a `isFamilyMember()`.

## 4. Tests
- Unit (mock Firestore) para `borrarSesionHistorial` y `borrarHistorialMiembro`
  (que borren media + sesión asociada).
- Test de reglas (emulador): un miembro borra solo lo suyo; no puede borrar de otro.

Convenciones del repo: voseo, tokens CSS, `Result<T>`, sin `throw` cruzando capas.
