# P75c — Match exacto por `datauuidSamsung`

Repo: jpcofano/shapeup. Corrige un caso que encontró PU4. Decisiones cerradas; si algo es
inviable, pará y reportá. No commitees.

**El problema.** Una sesión de ShapeUp que ya fue enriquecida guarda
`biometria.datauuidSamsung`. Si ese documento no tiene `inicioMs`, la regla 2 de
`clasificarImport` no la encuentra, porque cruza por ventana de tiempo, y la actividad entra
como externa duplicando el mismo entrenamiento. Pasa con la sesión del 7/7 y con la del
30/6.

**El arreglo.** En `clasificarImport`, entre la regla 1 y la 2, una regla nueva:

> Si el `_uuid` del item coincide con el `biometria.datauuidSamsung` de algún Historial de
> ShapeUp, el destino es **enriquece**, con ese `idHist` y motivo `datauuid`. Es un match
> exacto y le gana a cualquier match por ventana.

Sumá `datauuid` al tipo de motivos y su explicación en castellano: *"Ya estaba en tu sesión
del {fecha}"*.

**Tests:**

- un item cuyo uuid coincide con el `datauuidSamsung` de una sesión enriquece esa sesión,
  aunque no haya `inicioMs`;
- la precedencia: si además cumpliría `shapeup` por custom-id, gana `shapeup`;
- el match por uuid le gana al match por ventana cuando apuntan a sesiones distintas;
- sin coincidencia, todo sigue como antes.

Además, verificá el otro caso que reportó PU4: **la sesión del 30/6**. Decime si con esta
regla también matchea o si le falta el `datauuidSamsung`, y en ese caso qué destino le
queda.

Al terminar, corré la suite completa, `tsc -b` y `npm run test:rules`, y volvé a correr los
dos dry-run, el del ZIP y el del puente, con los números nuevos. Guardá este prompt como
`docs/prompts/75c-match-por-datauuid.md`.
