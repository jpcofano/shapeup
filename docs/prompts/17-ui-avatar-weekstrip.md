# Prompt 17 — UI · Avatar, colores de miembro y tira de semana (de Comidas)

> Traé y adaptá tres piezas del repo base **Comidas-Familiares**
> (`https://github.com/jpcofano/Comidas-Familiares`), sin copiar conceptos del dominio de comida
> y sin sufijos `V2` (un componente por cosa, según `FORMA-DE-TRABAJO`):
>
> (1) **`MemberAvatar` + `AvatarStack`** (`src/components/MemberAvatar.tsx` en Comidas): círculo
> con iniciales y color por miembro. Adaptalo a ShapeUp y usalo en **Perfil** y, donde aplique,
> en Historial/Home. El color de cada miembro debe salir de `config/perfiles` (`PerfilMiembro.color`,
> ya sembrado); si no hay perfil, caé al token CSS.
> (2) **Tokens de color por miembro** en `src/styles/tokens.css`: agregá `--member-juanpablo`,
> `--member-maria`, `--member-sofia`, `--member-federico` con los colores del seed de perfiles
> (`#60a5fa`, `#f472b6`, `#a78bfa`, `#34d399`). Hoy `tokens.css` no los tiene.
> (3) **`WeekStrip`** (`src/components/WeekStrip.tsx` en Comidas): tira de 7 días con el día de
> hoy marcado. Usala en **Home** para el "hoy toca…", marcando los días que tienen sesión
> programada según el programa activo del miembro.
>
> `PlatoMark.tsx` de Comidas sirve solo como molde para un logo de ShapeUp (no lo copies tal cual).
>
> Al terminar, actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + Mapa + ADR si hace falta).
> JSDoc en lo público. `git add -A && git commit` + `git push`. **Pará y esperá mi revisión.**
