# Prompt 29 — D7 · Perfil + auth

> Etapa de pulido D7 (cierre). Pulís `src/routes/Perfil.tsx`, `src/auth/LoginScreen.tsx` y
> `src/auth/UnauthorizedScreen.tsx`, e integrás el **selector de tema** (del ThemeProvider de
> D1). Target: `ui_kits/shapeup/screens-salud.jsx` (Perfil) + `screens-home.jsx` (Login).
> **No** toques la lógica de auth (`AuthProvider`, `resolveMemberId`, `upsertUserDoc`, reglas).
> Tokens siempre. Voseo.
>
> **(1) Perfil:** card con `MemberAvatar` grande (52px) + nombre + edad/FC máx + badges de
> objetivos.
>
> **(2) Selector de TEMA (la feature de D1, acá su UI):** card "Tema" con la leyenda **"solo
> para {nombre}"** y los **8 swatches** (Ion, Volt, Solar, Blaze, Crimson, Pulse, Grape, Indigo);
> el activo con anillo + check. Al tocar uno, `setTheme()` del `useTheme()` re-skinea la app al
> instante y persiste el tema **de ese miembro**. Debajo, "Cambiar de miembro" (avatares; al
> cambiar, la app toma el tema de ese miembro). Botón "Cerrar sesión".
>
> **(3) Login:** `auth-card` con `<ShapeUpMark>` (en acento), "ShapeUp" 800, subtítulo "Tu plan
> para ponerte en forma", botón primario "Entrar con Google" (ícono `chrome`) y nota "Acceso
> solo para miembros de la familia".
>
> **(4) No autorizado:** misma `auth-card`, "Acceso no autorizado" + copy en voseo
> ("Tu cuenta no está en la lista de miembros de ShapeUp. Contactá al administrador.") y
> "Cerrar sesión".
>
> **Verificación:** el selector cambia el tema del miembro y persiste entre recargas y entre
> cambios de miembro; login/no-autorizado con la marca y en el tema. Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D7 + cerrá el pulido en la tabla de Estado). `tsc -b`
> limpio, tests verdes, commit + push. **Pará y esperá mi revisión.**
