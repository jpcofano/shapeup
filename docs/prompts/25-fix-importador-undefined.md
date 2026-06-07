# Prompt 25 — Fix · Importador de salud (undefined + resiliencia)

> Bug en producción: al importar el CSV de peso, una fila sin grasa corporal deja `grasaPct =
> undefined`, y Firestore **rechaza** escribir `undefined`
> (`setDoc() called with invalid data. Unsupported field value: undefined`). Como los imports usan
> `Promise.all`, **una sola fila incompleta aborta todo el import** → no se guarda nada.
>
> **(1) `src/firebase.ts`:** agregá `ignoreUndefinedProperties: true` a las opciones de
> `initializeFirestore` (junto a `localCache`). Eso hace que Firestore ignore campos `undefined` en
> vez de tirar error — arregla este caso y cualquier campo opcional faltante (grasa, agua, FC, etc.).
>
> **(2) `src/data/salud.ts`:** en todas las funciones `importar*` cambiá `Promise.all` →
> **`Promise.allSettled`**, así una fila mala no tumba el resto. Contá `fulfilled` vs `rejected` y
> devolvé `{ importados, omitidos }` (o ampliá el `Result` para incluir los omitidos). Mismo criterio
> en `importarMetricas` (P22) y en lo que escriba el match (P23).
>
> **(3) Defensa en el parser (`src/lib/parsearCSV.ts` / `samsungHealth.ts`):** al construir cada
> objeto, **no incluyas claves con valor `undefined`/`NaN`** (omitir la clave en vez de setearla).
> Cinturón y tiradores junto con el (1).
>
> **(4) UI (`src/routes/Salud.tsx`):** el resultado del import muestra "X importados · Y omitidos"
> en vez de un error rojo cuando hay filas incompletas. Solo mostrar error real si **todo** falla.
>
> **(5) Test:** un CSV con una fila completa + una fila sin grasa → importa las dos (la incompleta
> sin el campo), no aborta. Una fila corrupta → se omite y se cuenta, el resto entra.
>
> `tsc -b` limpio, tests verdes. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + ADR:
> `ignoreUndefinedProperties` + import resiliente por fila con `allSettled`).
> `git add -A && git commit` + `git push`. **Pará para revisión.**
