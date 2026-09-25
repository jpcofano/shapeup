# 85 — La sincronización deja de ser un botón

Repo: jpcofano/shapeup. Va después de P84. Es el pendiente real de la serie H.

## Qué problema resuelve

El puente sube a `/ingesta-sdk` cada 6 horas, solo, desde el reloj. Pero para que esos datos
entren a ShapeUp **hay que abrir /salud y apretar "Sincronizar ahora"**. La cadena es
automática de punta a punta salvo en el último metro, que es justamente el que se olvida: la
prueba está en que P80 y P81 se construyeron completos y siguen sin un solo dato real adentro.

Después de esto, entrenás, dejás el teléfono, y la próxima vez que abrís la app tus datos ya
están.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — Cuándo corre: preguntar barato antes de leer caro

`leerRegistrosSdk` hace `getDocs` de **toda** la subcolección `/ingesta-sdk/{uid}/registros`.
Hoy son pocos documentos, pero crecen con cada actividad, para siempre. Automatizar la
sincronización sin tocar eso es multiplicar por diez la frecuencia de la consulta más cara
que tenemos. Es el mismo error que ya cometimos dos veces: Salud leyendo `/cardio` entero, y
Home leyendo doce semanas.

**El puente ya deja la respuesta escrita.** `/estado/puente` tiene `ultimaCorridaMs`. Entonces:

1. Al abrir la app, **una sola lectura**: `leerEstadoPuente`.
2. Si `ultimaCorridaMs` es igual o anterior a la última corrida que ya importamos, **no se
   hace nada más**. Ninguna lectura de `/ingesta-sdk`.
3. Solo si el puente corrió después, se sincroniza.

La marca de "la última que importamos" va en `localStorage`, por uid. Es una caché, no una
fuente: si se pierde, lo peor que pasa es una sincronización de más, que es idempotente. **No
se escribe nada en `/ingesta-sdk`**: las reglas la tienen cerrada a cinco campos, y así debe
quedar.

Condiciones para que corra, todas:

- hay sesión iniciada y `navigator.onLine`;
- pasaron al menos `MIN_ENTRE_SYNC_MS = 6 × 60 × 60 × 1000` desde la última sincronización
  automática, aunque el puente haya corrido de nuevo;
- no hay otra corriendo (un flag a nivel de módulo, como `barridoHuerfanasHecho`);
- **una sola vez por carga de la app**, no por navegación.

---

## Parte 2 — Cómo corre: sin preguntar y sin molestar

- Sin vista previa: escribe. Es el mismo pipeline idempotente del botón, con ids
  determinísticos; una vista previa que nadie va a mirar es solo una forma de no hacer nada.
- **Nunca bloquea la interfaz.** Corre en segundo plano mientras la app se usa.
- Corre con `conTimeout`, como el resto.
- **Si la cuota está agotada** (`esCuotaAgotada`) o el timeout vence: se anota, **no se
  reintenta en esa carga**, y el botón manual de /salud sigue estando para forzarla.
- Un fallo de sincronización **nunca** rompe la pantalla ni muestra un error modal.

---

## Parte 3 — Qué ve Juan

En Home, un chip discreto, en el mismo lugar que el de sesiones sin subir:

```
Sincronizando salud…
```

y cuando termina, si entró algo:

```
Salud al día · 3 actividades nuevas
```

- Si no entró nada nuevo, **no se muestra nada**: el silencio es la respuesta correcta.
- El chip se va solo a los pocos segundos, o al tocarlo, que lleva a /salud.
- Si falló, el chip lo dice en una línea sin dramatismo: *"No se pudo sincronizar — probá
  desde Salud"*.
- En /salud, la tarjeta del puente suma una línea: **cuándo fue la última sincronización
  automática**. El botón "Sincronizar ahora" se queda: es el que se usa cuando uno quiere
  mirar la vista previa.

---

## Parte 4 — Dónde vive

Un hook, `useSincronizacionAutomatica`, llamado **una sola vez** en el armazón de la app, no
en cada pantalla. La lógica de decidir *si* corresponde sincronizar es **pura y testeable**:

```ts
debeSincronizar({ ultimaCorridaPuenteMs, ultimaImportadaMs, ultimaAutoMs, ahora, online }): boolean
```

El hook orquesta; la decisión se prueba sin React ni Firebase.

---

## Tests

De `debeSincronizar`, uno por condición:

- el puente corrió después de la última importada y pasaron 6 h → **sí**;
- el puente no corrió desde la última importada → **no**, aunque hayan pasado días;
- corrió, pero hace 2 h que sincronizamos → **no**;
- sin conexión → **no**;
- sin marca local (primera vez en esta máquina) y el puente tiene corrida → **sí**;
- sin `ultimaCorridaMs` (el puente nunca corrió) → **no**.

Del hook: corre una sola vez por montaje; dos montajes seguidos no disparan dos
sincronizaciones; con la cuota agotada no reintenta.

`npx tsc -b`, la suite y `npm run build`.

---

## Fuera de alcance

- Sincronizar con la app cerrada. Eso es una notificación push o un service worker, y es
  parte de "PWA completa".
- Leer `/ingesta-sdk` de a pedazos. Con la guarda de la Parte 1 la consulta corre pocas veces;
  cuando la colección crezca, **ahí** se pagina. Dejá una nota en el módulo diciendo esto,
  con el número de documentos que había hoy, para que se note cuándo se volvió caro.

---

## Al terminar, reportá en `ultimochat.md`

1. El diff, resumido.
2. Tests, `tsc` y build.
3. **Cuántas lecturas hace la app al abrir en el caso normal** (el puente no corrió desde la
   última vez). Tiene que ser **una**.
4. Cuántos documentos hay hoy en `/ingesta-sdk/{uid}/registros`, para la nota de la Parte 4.
5. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/85-sincronizacion-sin-boton.md`.
