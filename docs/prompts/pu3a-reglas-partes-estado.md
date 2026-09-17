# PU3a — Reglas: registros partidos y estado del puente

Repo: jpcofano/shapeup. Es la parte de PU3 que vive en este repo. Parte de PU2a, que agregó
`/ingesta-sdk/{uid}/registros/{docId}`.

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Contexto

PU2 midió que el registro de una sesión pesa unos 591 KB. Con esa proporción, una sesión de
más de ~1 h 55 min supera el límite de un documento. PU3 va a partir esos registros en
varios documentos y va a correr en segundo plano, así que además necesita dejar constancia
de cada corrida.

---

## Cambio 1 — Registros partidos

En `match /ingesta-sdk/{uid}/registros/{docId}`:

- `hasOnly` pasa a aceptar además `parte` y `totalPartes`. Los dos son **opcionales**: un
  registro entero no los trae.
- Si vienen, **vienen los dos**, son `int`, y cumplen
  `1 <= parte <= totalPartes <= 50`.
- El resto de la regla no cambia.

Expresalo con funciones auxiliares dentro del bloque si queda más legible.

---

## Cambio 2 — Estado del puente

Bloque nuevo, junto al anterior:

```
// Estado de la última corrida del puente (PU3). Un solo documento: "puente".
match /ingesta-sdk/{uid}/estado/{docId} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow create, update: if request.auth != null && request.auth.uid == uid
    && isFamilyMember()
    && docId == 'puente'
    && request.resource.data.keys().hasOnly([
         'ultimaCorridaMs', 'versionPuente', 'origen',
         'leidos', 'subidos', 'sinCambios', 'omitidos', 'errores',
         'duracionMs', 'mensaje'])
    && request.resource.data.ultimaCorridaMs is int
    && request.resource.data.origen in ['manual', 'segundo-plano'];
}
```

`mensaje` es opcional y lo usa el puente para describir el último error.

---

## Cambio 3 — Arreglar `npm run test:rules`

En `package.json`, el script tiene que quedar así:

```
firebase emulators:exec --only firestore --project shapeup-41e74 "npx vitest run --config vitest.rules.config.ts"
```

Hoy falla con `Too many arguments`. **Esta máquina no tiene JDK 21, así que el emulador
igual no va a levantar.** Arreglá el script de todos modos.

---

## Tests

En `firestore.rules.test.ts`:

**Registros:**
- un registro con `parte: 2, totalPartes: 3` se acepta;
- se rechaza si viene solo uno de los dos campos;
- se rechaza `parte: 0`;
- se rechaza `parte` mayor que `totalPartes`;
- se rechaza `totalPartes: 51`;
- se rechaza `parte: "1"` (string);
- un registro sin esos campos sigue aceptándose.

**Estado:**
- el dueño escribe y lee `estado/puente`;
- se rechaza otro `docId`;
- se rechaza un campo extra;
- se rechaza `origen: "otro"`;
- otro `uid` no puede leer ni escribir.

Si el emulador no levanta, dejalos escritos y aclaralo.

---

## Fuera de alcance

- La app web.
- El adaptador (PU4).

Guardá este prompt como `docs/prompts/pu3a-reglas-partes-estado.md`.

---

## Al terminar, reportá

1. El diff.
2. Los tests: si corrieron o si quedaron escritos sin emulador.
3. El comando de deploy de reglas.
