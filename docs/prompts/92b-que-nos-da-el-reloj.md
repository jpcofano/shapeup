# 92b — Qué nos da el reloj, de verdad

Repo: jpcofano/shapeup. **Solo lee.** No escribe nada en Firestore, no toca `src/`, no cambia
comportamiento. Se puede correr antes, después o en paralelo con P92.

## Qué problema resuelve

P92 asume que el SDK de Samsung nos da duración, calorías y FC media, máxima y mínima, y **no** los
minutos por zona. Esa afirmación salió de leer `lib/adaptadorSdk.ts`, o sea de leer **lo que hoy
mapeamos**, no lo que el reloj manda. Son dos cosas distintas: un campo que llega y nadie mapea es
invisible de esa forma.

Y no hace falta suponer: el `crudo` de cada documento de `/ingesta-sdk/{uid}/registros` es el JSON
tal cual vino del SDK. La respuesta está guardada; lo único que falta es mirarla.

Este proyecto ya se llevó varios sustos por construir contra datos inventados. Esta vez el
inventario va primero.

**No decidas nada con lo que encuentres. Reportá y pará.**

## Qué hacer

Un script, `scripts/inventario-sdk.ts`, que usa `corrida.ts` (P87) en **modo simulación y nada
más** — no tiene modo `--aplicar` porque no escribe.

Recorre los documentos de `/ingesta-sdk/{uid}/registros`, parsea cada `crudo` y, **por `dataType`**,
informa:

1. **Todas las claves que aparecen**, incluidas las anidadas (con notación `a.b.c`) y las que
   están dentro de arrays (`serie[].x`), con:
   - en cuántos documentos aparece,
   - el tipo o los tipos que toma,
   - **un valor de ejemplo real** — el dato manda, y un nombre de campo sin un valor al lado no
     alcanza para saber qué es.
2. **Qué claves no mapea `adaptadorSdk.ts`.** Esta es la lista que importa: es lo que el reloj nos
   viene dando y estamos tirando. Comparala contra lo que el adaptador lee de verdad, no contra la
   interfaz declarada.
3. **Cualquier cosa con pinta de zona, esfuerzo o recuperación**: `zone`, `intensity`, `effort`,
   `load`, `recovery`, `vo2`, `training`, `cadence`, `lap`, `phase`, `segment`, `split`, `mets`,
   `rpe`. Buscalas por subcadena y sin distinguir mayúsculas, y listá **todas** las que peguen,
   aunque vengan siempre vacías: un campo que existe y viene vacío es una pregunta para Samsung,
   no un campo que no existe.
4. Para **una sesión concreta** que voy a indicarte por fecha y hora: el `crudo` **entero**, pegado
   en el reporte, con lo que no sea la curva de FC sin recortar. Quiero leerlo yo.
5. Cuántos documentos hay por `dataType` y **cuánto pesan en total**. Es el número que hace falta
   para decidir si `/ingesta-sdk` se poda, que está en el backlog desde que vimos que se lee entero
   en cada sincronización.

Si un `crudo` no parsea, contalo y seguí: un documento roto no corta el inventario.

## Cómo reportar

En `ultimochat.md`, y **las tablas enteras, no un resumen**. El detalle es el entregable: si hay
cuarenta campos, quiero los cuarenta, con su tipo, su frecuencia y su ejemplo.

Después de las tablas, tres cosas:

1. Los campos de la lista 2 que **te parecen aprovechables**, con qué se podría hacer con cada uno
   y qué costaría. **Como propuesta, no como plan** — decidimos juntos.
2. Si aparece algo que **contradice a P92** — cualquier cosa que se parezca a minutos por zona
   viniendo del reloj—, decilo arriba de todo y **no toques P92**: eso cambia el diseño y es una
   conversación.
3. Si el SDK trae algo que **no entendemos**, listalo aparte. Mejor un campo raro anotado que un
   campo raro adivinado.

## Fuera de alcance

- Mapear nada nuevo en `adaptadorSdk.ts`. Este prompt averigua; otro decide.
- Cambiar qué sube el puente.
- Podar `/ingesta-sdk`. El número que hace falta para decidirlo sale de acá, la decisión no.

Guardá este prompt como `docs/prompts/92b-que-nos-da-el-reloj.md`.
