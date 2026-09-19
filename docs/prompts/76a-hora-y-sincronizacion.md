# 76a — Hora correcta, sincronización honesta

Repo: jpcofano/shapeup. Corrige tres cosas que aparecieron al sincronizar el puente por
primera vez. Van en orden de gravedad.

| # | Problema | Impacto |
|---|---|---|
| 1 | El mismo entrenamiento tiene `inicioMs` distinto por ZIP y por SDK, con 3 h de diferencia | Afecta a 2562 documentos de cardio y a las externas ya escritas |
| 2 | La sincronización reporta éxito aunque no escriba, y se cuelga sin timeout | El puente nunca escribió cardio y nadie se enteró |
| 3 | `_fcMin` se descarta al guardar, y faltan dos códigos en la tabla del ZIP | Menor |

Las decisiones están cerradas **salvo la migración**, que se decide con los números del
Paso 0. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Diagnóstico del desfase (solo lectura, y decide todo lo demás)

**El caso:** la sesión de pileta `ca63c94f-dcdd-4232-8055-a0dd09988b37`, del 10/7 a las
13:39 local.

| Vía | `inicioMs` |
|---|---|
| SDK | 1783701598319, que es 16:39:58Z, o sea 13:39 en -03:00 — **correcto** |
| ZIP, ya escrito en `/cardio` | 1783712398319, que es 19:39:58Z — **+3 h** |

Averiguá y reportá, **sin corregir nada**:

1. **La fila cruda del CSV de ejercicio** para ese uuid: el valor literal de `start_time`,
   de `time_offset` y de cualquier otra columna de tiempo. Pegalos tal cual.
2. **Qué devuelve `epochToMs`** con esos valores exactos, paso a paso. El código aplica
   `asUtc - offMs` con `offMs` negativo, que suma 3 h. **Si `start_time` ya viene en UTC en
   vez de local, esa corrección sobra y explica el desfase.** Confirmalo o descartalo con
   el dato.
3. **Si el formato cambió entre exports:** mirá si las filas viejas del CSV traen epoch
   numérico y las nuevas datetime string, o al revés. El helper soporta los dos, y puede
   estar acertando en unas y errando en otras.
4. **Cuántos de los 2562 documentos de `/cardio` están afectados**, comparando su
   `inicioMs` contra lo que daría el parser corregido. Decime cuántos coinciden con el SDK
   donde hay ambos.
5. **Qué más quedó torcido**, si el desfase se confirma: el `fecha` de cardio, el
   `fechaRealizada` de las externas, el `semanaInicio`, y el match por ventana.
6. **El mismo chequeo para sueño, peso y métricas**, que usan los mismos helpers.

**Pará acá y reportá.** Con eso decidimos si hay que migrar y cómo. No escribas nada
todavía.

---

## Parte 1 — El arreglo del tiempo

Con el diagnóstico confirmado:

- Corregí el helper para que interprete cada formato como lo que es. Dejá **un comentario
  con el caso real** —el uuid, el valor crudo y el resultado esperado— para que nadie lo
  "arregle" de vuelta al revés.
- **Tests con las dos formas:** epoch numérico y datetime string, con offset negativo,
  positivo y ausente, y el caso real de arriba fijado como test.
- **Verificación cruzada, que es la prueba de fuego:** para cada actividad que exista por
  las dos vías, el `inicioMs` del parser corregido tiene que dar **exactamente** el del SDK.
  Reportá cuántas comparaste y cuántas coinciden.

**La migración de lo ya escrito** se define con los números del Paso 0. Escribí el script
`scripts/migrar-horas.ts` con simulación y `--aplicar`, que recalcula `inicioMs`, `finMs` y
`fecha` de los documentos afectados, **pero no lo corras**. Si el id de un documento
dependiera de la hora, decilo antes: ahí la migración no es un update sino un borrar y
volver a crear.

---

## Parte 2 — Que la sincronización no mienta

En `sincronizarPuente.ts` y en `Salud.tsx`:

- **`confirmarPuente` va envuelto en `try/catch/finally`.** El `finally` apaga el estado de
  guardado siempre, pase lo que pase. Hoy queda clavado hasta recargar la página.
- **Timeout:** usá `conTimeout` (8 s, el de P69) en cada paso de escritura. Si vence, el
  resultado es *"quedó en cola, se sube cuando haya señal"*, como en P69, y **no** un
  cuelgue.
- **Los contadores reportan lo escrito, no lo clasificado.** Hoy el mensaje muestra
  `enriquecen + externas` de la clasificación aunque no se haya guardado nada. Cada paso
  devuelve cuántos documentos escribió de verdad, y el resumen suma eso.
- **Los rechazos por documento dejan de ser silenciosos.** `importarCardioIdempotente` y
  `importarMedicionesIdempotente` usan `allSettled` y cuentan los rechazos como "omitidos",
  devolviendo `ok`. Que devuelvan también `fallidos` con el primer error, y que
  `sincronizarDesdePuente` lo propague: si hubo fallidos, el resultado es un error visible,
  no un éxito con un número más chico.
- **Escritura parcial:** si un paso falla después de que otro escribió, el mensaje dice qué
  se guardó y qué no. Nada de deshacer: todo es idempotente y reintentar es seguro.
- **El error de cuota se explica:** si el código es `resource-exhausted`, mostrá
  *"Se agotó la cuota diaria de Firestore. Probá de nuevo mañana."* en vez del error crudo.

**Y comprobá lo que encontró el diagnóstico:** el puente nunca escribió un documento de
cardio, porque ninguno de los 2562 tiene `_autoDetected` ni `_muestrasCurva`. Decime si eso
se explica por este bug o si hay otra causa.

---

## Parte 3 — Los dos detalles

- **`_fcMin` se pierde:** `importarCardioIdempotente` lo destructura fuera del payload
  (`salud.ts:217`). El adaptador y el parser lo producen, así que guardalo. Si `SesionCardio`
  no tiene el campo, agregalo como opcional.
- **Códigos del ZIP, confirmados por uuid contra el SDK:** `14001` es natación en pileta y
  `12001` es aeróbico. Agregalos a `EXERCISE_TYPE` con el comentario de cómo se confirmaron.
  **`14002`, `11001` y `10004` no se tocan:** no hay con qué verificarlos, y el comentario
  del archivo es claro en que los códigos inventados ya salieron caros una vez.

---

## Tests

- Los del helper de tiempo, con el caso real.
- La verificación cruzada ZIP contra SDK.
- `sincronizarDesdePuente` con un paso que falla: el resultado es error y los contadores
  reflejan lo escrito.
- Un rechazo por documento en `importarCardioIdempotente` aparece en `fallidos`.
- El timeout devuelve "en cola" y no cuelga.
- `_fcMin` sobrevive hasta el payload.
- `14001` y `12001` resuelven a su nombre.

Corré la suite completa, `tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Correr la migración.
- El detalle de natación: largos, brazadas y SWOLF no viajan por el SDK; se decide aparte.
- La sincronización automática.

Guardá este prompt como `docs/prompts/76a-hora-y-sincronizacion.md`.

---

## Al terminar, reportá

1. **El Paso 0 completo.** Es lo más importante.
2. El diff por archivo.
3. Tests, `tsc` y `test:rules`.
4. La verificación cruzada: cuántas actividades comparaste y cuántas coinciden.
5. La simulación de la migración, **sin aplicarla**.
6. Tu explicación de por qué el puente nunca escribió cardio.
