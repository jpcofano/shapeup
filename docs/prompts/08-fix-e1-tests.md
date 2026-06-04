# Prompt 8 — Fix E1.1 · Tests de auth sin env

> Los tests de `resolveMemberId` no corren en un checkout limpio / CI. **Causa:**
> `src/auth/resolveMemberId.test.ts` importa `findMemberByEmail` desde `resolveMemberId.ts`, que
> en su línea 2 hace `import { db } from "../firebase"`. Eso ejecuta `firebase.ts` al cargar,
> incluido `getAuth(app)`, que tira `auth/invalid-api-key` cuando no hay `VITE_FIREBASE_API_KEY`
> (en CI no existe `.env.local`). Resultado: la suite colecta 0 tests y falla. Localmente pasa
> solo porque tenés `.env.local`. Contradice el ADR #002 (la función pura debería testearse sin
> tocar Firebase).
>
> **Arreglo:** extraé la función pura `findMemberByEmail` (y el/los tipos que use) a su propio
> archivo `src/auth/findMemberByEmail.ts`, **sin ningún import de Firebase**. Hacé que
> `resolveMemberId.ts` la importe desde ahí. Mové el test a `src/auth/findMemberByEmail.test.ts`
> importando solo el archivo puro, para que no toque `../firebase` ni transitivamente.
>
> Verificá: `npx vitest run` corre los 4 tests de auth y el total queda en **50 verdes**; y
> `tsc -b` sigue limpio. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora E1.1 + ADR: "función
> pura separada del módulo con I/O de Firebase, testeable sin env"). Después `git add -A &&
> git commit` con un mensaje claro y `git push` a `origin/main`. **Pará y esperá mi revisión.**
