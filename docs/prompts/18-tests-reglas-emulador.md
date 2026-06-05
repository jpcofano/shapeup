# Prompt 18 — Calidad · Tests de reglas de Firestore (emulador)

> La `FORMA-DE-TRABAJO` (§7) pide tests de reglas con `@firebase/rules-unit-testing` contra el
> **emulador**, y el prompt de E5 los pedía. Verificá si existen; si no, agregalos.
>
> (1) Cableá (si falta) `firebase.json` con el emulador de Firestore y un script
> `npm run test:rules` (`firebase emulators:exec --only firestore "vitest run <tests de reglas>"`)
> y `npm run test:all` = unidad + reglas.
> (2) Escribí los tests cubriendo lo que ya hacen `firestore.rules`:
>   - Un usuario **no-miembro** (email fuera de `/config/familia`) no puede leer/escribir
>     colecciones de datos.
>   - **Solo el owner** puede escribir el catálogo (`/ejercicios`), `/rutinas`, `/programas` y
>     `/config/*` (incluida `visibilidad` y `perfiles`); cualquier miembro puede **leer** config
>     (necesario para resolver el login).
>   - Un miembro puede leer/escribir **lo suyo**: `/users/{uid}` propio, y sus `/historial`,
>     `/sesiones`, `/mediciones`, `/cardio`.
>   - Confirmá que el `get()` interno de las reglas sobre `/config/familia` permite el login de
>     un miembro y que un no-miembro cae bloqueado (esto ya funciona; el test lo fija).
> (3) Dejá los tests verdes corriendo en el emulador.
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa: tests de reglas ✅ + el
> nuevo script). `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
