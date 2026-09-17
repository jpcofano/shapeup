# PU2a — Reglas para la colección de staging del puente

Repo: jpcofano/shapeup. Es la parte de PU2 que vive en este repo: el puente Android
(repo aparte) va a escribir lecturas crudas del Samsung Health Data SDK en Firestore, y
necesita una regla. Diseño del puente: `docs/ROADMAP-producto.md` §15.8 (hitos PU1–PU4).

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Decisión

**Colección:** `/ingesta-sdk/{uid}/registros/{docId}`.

- **Por qué `uid` y no `memberId`:** el puente no conoce el `memberId` y no debe tener
  ningún id escrito en el código. Firebase le da el `uid` al loguearse con Google, y es el
  mismo `uid` que tiene la web, porque es la misma cuenta. El adaptador de PU4 corre en la
  web con el usuario logueado y lee su propio `uid`.
- **`docId`:** `{dataType}_{uidSamsung}`. Volver a subir el mismo registro lo pisa, así que
  no se duplica.
- **Campos**, todos escritos por el puente:

  | Campo | Tipo | Qué es |
  |---|---|---|
  | `dataType` | string | Nombre del tipo según el SDK |
  | `uidSamsung` | string | Id del registro según el SDK |
  | `leidoMs` | number | Cuándo lo leyó el puente |
  | `versionPuente` | string | Versión de la app del puente |
  | `crudo` | string | El registro completo como JSON, sin tocar |

  `crudo` es un string y no un mapa por dos razones: el puente no normaliza nada, y
  Firestore no acepta arrays anidados, que el JSON del SDK puede traer.

---

## Regla

Agregá en `firestore.rules`, con el mismo estilo de comentarios que el resto:

```
// Ingesta cruda del puente Android (PU2). Solo el propio usuario, por uid.
// El puente vuelca crudo; el adaptador TS (PU4) lo interpreta.
match /ingesta-sdk/{uid}/registros/{docId} {
  allow read, delete: if request.auth != null && request.auth.uid == uid;
  allow create, update: if request.auth != null && request.auth.uid == uid
    && isFamilyMember()
    && request.resource.data.keys().hasOnly(
         ['dataType', 'uidSamsung', 'leidoMs', 'versionPuente', 'crudo'])
    && request.resource.data.crudo is string
    && request.resource.data.crudo.size() < 1000000
    && request.resource.data.dataType is string
    && request.resource.data.uidSamsung is string;
}
```

El límite de 1.000.000 caracteres deja margen dentro del máximo de 1 MiB por documento. PU1
midió 118 KB por sesión con curva.

---

## Tests

En `src/__tests__/firestore.rules.test.ts`, con el patrón que ya usa el archivo:

- un usuario de la familia escribe y lee en su propio `uid`;
- no puede escribir ni leer en el `uid` de otro;
- sin auth, no puede nada;
- un campo extra se rechaza;
- `crudo` que no es string se rechaza;
- `crudo` de 1.000.000 caracteres o más se rechaza.

Estos tests necesitan el emulador. **Si no está disponible, escribilos igual y aclaralo en
el reporte.**

---

## Fuera de alcance

- El adaptador que lee la colección (PU4).
- Cambios en la app web.

Guardá este prompt como `docs/prompts/pu2a-reglas-ingesta-sdk.md`.

---

## Al terminar, reportá

1. El diff.
2. Los tests: si corrieron o si quedaron escritos sin emulador.
3. El comando exacto para desplegar **solo las reglas**.
