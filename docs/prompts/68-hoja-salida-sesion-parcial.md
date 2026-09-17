# 68 — Bloque 1: hoja de salida, sesión parcial y sesiones que sobreviven

Repo: jpcofano/shapeup. Diseño en `docs/ROADMAP-producto.md`, Bloque 1 y §12.3. Parte sobre
el estado posterior a P67 (`e36538f`).

`+ serie` y "Saltar ejercicio" **no van acá**: son P68b.

Las decisiones están cerradas. Si alguna es inviable o el código no es como se describe,
**pará y reportá** en vez de reinterpretar. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. `EntrenarSesion.tsx` llama a `crearSesion` + `iniciarSesion` **en cada montaje**, sin
   buscar una sesión existente. Cada vez que se entra o se recarga, se crea una
   `SesionProgramada` nueva en `En curso`.
2. Ningún código de UI lee `/sesiones` filtrando por `En curso`. Solo se escriben, y
   `data/historial.ts` las borra junto con el historial.
3. `firestore.rules` permite `delete` en `/sesiones` al propio miembro.
4. En `EntrenarSesionLibre.tsx`:
   - `ejercicios`, `ejDefaults` y `sesionIniciada` son estado de React;
   - `SESSION_KEY = "libre:temp"`;
   - el atajo llama a `session.reiniciar()` en cada montaje.
5. En el modo guiado no hay navegación entre bloques. Los dots son de series y
   `onIrASerie` no hace nada.
6. `Historial` no tiene `completitud`, y `finalizarSesion` no la recibe.

---

## Parte 1 — Una sola `SesionProgramada` por sesión

- Agregá `idSesion: string | null` a `EntrenarState`, con `null` como valor inicial.
- **Al montar la sesión de rutina:**
  - si `state.idSesion` existe, usalo y **no** crees otra;
  - si no existe, creala como hoy y guardá el id en el estado.
- **Reiniciar conserva `idSesion`**: es la misma sesión, empezada de nuevo. Implementalo
  como función pura `estadoReiniciado(state)`, que devuelve el estado inicial con el
  `idSesion` del anterior, y usala en el hook.
- Nueva `descartarSesion(id)` en `data/sesiones.ts`, que hace `deleteDoc`.
- **Fuera de alcance:** limpiar las sesiones huérfanas que ya existen. Va a un script aparte.

---

## Parte 2 — La sesión libre sobrevive a una recarga

- Módulo nuevo `src/lib/sesionLibre.ts`, con load, persist y clear de
  `{ idsEjercicio: string[]; defaults: EjDefaults[] }` bajo la clave
  `entrenar:libre:temp:config`. JSON corrupto o forma inválida cuenta como "no hay".
  Mové el tipo `EjDefaults` ahí.
- **Persistir** en `empezarSesion()`, en `sumarYContinuar()` y en el camino del atajo.
- **Al montar**, si hay config guardada:
  - traé los ejercicios por id y restaurá `ejercicios`, `ejDefaults` y
    `sesionIniciada = true`;
  - los ids que ya no existen se descartan de la lista, y se muestra en línea
    "N ejercicios ya no están en el catálogo". Si no queda ninguno, se trata como si no
    hubiera config;
  - mientras carga, mostrá el spinner, no el selector.
- **Atajo `/entrenar/ejercicio/:id`:** reemplazá el `reiniciar()` incondicional por esto:

  | Hay config guardada… | Qué hace |
  |---|---|
  | No | Arranca el atajo como hoy |
  | Igual a `[id]` | Retoma esa sesión, sin reiniciar |
  | Distinta y con 0 series | La descarta y arranca el atajo |
  | Distinta y con series | Abre la hoja de salida (Parte 3) con el contexto *"Tenés una sesión libre sin cerrar"*. Solo arranca el atajo después de que esa sesión se guarde o se descarte. "Seguir entrenando" retoma la sesión guardada |

---

## Parte 3 — Hoja de salida

Componente compartido `src/components/entrenar/HojaSalida.tsx`, con el estilo de hojas que
ya usa la app. La X del header la abre en las dos rutas.

| Opción | Comportamiento |
|---|---|
| **Guardar y salir** | Principal. Deshabilitada si no hay series, con la nota *"Todavía no hay series para guardar"*. Guarda como parcial (Parte 4) |
| **Salir sin guardar** | Con series, pide un segundo paso dentro de la misma hoja: *"Se descartan N series"* (singular cuando corresponde), con *Descartar* y *Volver*. Sin series, sale directo |
| **Seguir entrenando** | Cierra la hoja |
| *Reiniciar sesión* | Link chico y destructivo al pie. Usa la confirmación de P67 |

- **Sacá el botón de reiniciar del header** en las dos rutas: ahora vive en la hoja.
  "Empezar de nuevo" de la pantalla de fin queda como está.
- La hoja acepta un `contexto?: string` opcional, que se muestra arriba. Lo usan las
  Partes 2 y 5.
- Mientras guarda, los botones quedan deshabilitados. Si falla, el error se muestra en la
  hoja y la sesión no se toca.

**Salir sin guardar:**

- Borra el estado de localStorage y, en la sesión libre, también la config.
- En la sesión de rutina, llama a `descartarSesion(idSesion)` sin esperar el resultado.
- Sale como hoy: `navigate("/entrenar")`, o `salir()` en la sesión libre.

---

## Parte 4 — Sesión parcial

- Agregá `Historial.completitud?: "completa" | "parcial"`. El valor `"sin-detalle"` es del
  bloque 6 y no va acá. Si el campo falta, se lee como `completa`. **No** migres
  historiales viejos.
- `finalizarSesion` recibe `completitud` opcional y solo la escribe si viene.
  - La pantalla de fin pasa `"completa"`.
  - "Guardar y salir" pasa `"parcial"`. Si justo se da `rutinaCompleta`, pasa `"completa"`.
- **Duración de la parcial:** fin = el `finMs` más alto entre las series registradas;
  duración = fin − `state.inicioMs`. Así el tiempo entre la última serie y el momento de
  tocar la X no cuenta. Si falta alguno de los dos valores, es `null`. Implementalo como
  función pura `duracionParcialMin(state)`. La pantalla de fin sigue usando "ahora".
- **RPE:** en la parcial va `null`. El RPE y el RIR se rediseñan en P70.
- **Después de guardar:**
  - borrar el estado (y la config en la libre);
  - navegar a `/historial`;
  - la `SesionProgramada` pasa a `Registrada`, como ya hace `finalizarSesion`.
- **Vista:** chip **"Parcial"** en la fila de la lista de `Historial.tsx` y en
  `HistorialDetalle.tsx` cuando `completitud === "parcial"`. No cambies ningún cálculo:
  adherencia, tonelaje y semana siguen contando la sesión igual.

---

## Parte 5 — Sesión vieja al volver

- Función pura `sesionVieja(state, now, umbralMs = 12 h)`: es verdadera si
  `state.inicioMs` existe y `now − inicioMs > umbralMs`.
- **Al montar**, después de cargar el estado, en las dos rutas:
  - **vieja y con series:** abrí la hoja de salida con el contexto
    *"Esta sesión quedó abierta desde {día y hora de inicio}"*. "Guardar y salir" usa
    `duracionParcialMin`, que no se infla con los días transcurridos;
  - **vieja y sin series:** reiniciala sin preguntar (conserva `idSesion`) y sellá el
    inicio de nuevo.
- Esto se evalúa **una vez por montaje**, no en cada render.

---

## Tests

- **`estadoReiniciado`:** conserva `idSesion` y vuelve todo lo demás al estado inicial.
- **`duracionParcialMin`:**
  - con series;
  - sin series (`null`);
  - sin `inicioMs` (`null`);
  - con series de varios bloques, donde usa el `finMs` máximo.
- **`sesionVieja`:** justo en el umbral, por debajo, por encima, y sin `inicioMs`.
- **`sesionLibre`:** ida y vuelta de persistencia, JSON corrupto, forma inválida y ausencia.
- **`loadEntrenarState`:** un estado previo sin `idSesion` carga con `null`.

Corré la suite completa y `tsc -b`. Deben quedar en verde, con la excepción conocida de
`firestore.rules.test.ts` sin emulador.

---

## Fuera de alcance

- `+ serie` y "Saltar ejercicio" (P68b).
- El modo scroll.
- Limpiar las sesiones huérfanas existentes.
- Los docs, salvo guardar este prompt como `docs/prompts/68-hoja-salida-sesion-parcial.md`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests y `tsc`.
4. **Solo lectura:** el botón "atrás" del navegador o de Android, ¿sale de la sesión sin
   pasar por la hoja? ¿La versión de react-router del repo tiene `useBlocker`? Respondé
   sí o no con evidencia, sin implementar nada.
5. Cualquier punto donde hayas parado o te hayas apartado del prompt.
