# Prompt 1 — E1 · Base y autenticación

> Repo ShapeUp (Firebase + Vite + React + TS), proyecto `shapeup-41e74`. Ya existen
> `src/types/models.ts`, `src/lib/entrenarState.ts`, `src/lib/metricas.ts`, `firestore.rules`
> e `firestore.indexes.json` (desplegadas), y un scaffold mínimo de Vite. Leé
> `docs/ARQUITECTURA-shapeup-v2.md`, `docs/FORMA-DE-TRABAJO-comida-familiar.md` y
> `docs/MAPEO-IMPLEMENTACION.md` antes de tocar nada.
>
> Implementá la **Etapa E1**: (1) dejá el `build` en `tsc -b && vite build`; (2) `src/firebase.ts`
> con `initializeApp` + `initializeFirestore` con caché persistente multi-pestaña; (3) auth con
> Google: `AuthProvider`, `useAuth`, `resolveMemberId` (cruza el email contra `/config/familia`)
> y `upsertUserDoc` en `/users/{uid}`; (4) `LoginScreen` y `UnauthorizedScreen`; (5) `AppShell`
> con navegación inferior y rutas vacías (Home, Biblioteca, Catálogo, Entrenar, Historial,
> Perfil) con react-router. No reescribas `src/types` ni `src/lib`; usalos. Respetá la dirección
> de dependencias de la forma de trabajo.
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora con la entrada de E1, tabla de
> Estado → E1 ✅, Mapa del código) y comentá con JSDoc lo público. Después hacé `git add -A && git commit` con un mensaje claro de la etapa y `git push` a `origin/main`, así queda actualizado para revisar. **Pará y esperá mi revisión.**
