# Prompt 20 — Privacidad · Sacar los mails del repo público

> `scripts/seed-config.ts` tiene los emails reales de la familia (incluidos dos menores)
> hardcodeados, y el repo es **público**. Hay que sacarlos.
>
> (1) Mové los mails a un archivo **gitignoreado** `scripts/data/familia.local.json` (mismo shape
> que `FamiliaConfig.miembros`). `seed-config.ts` debe leerlo de ahí; si no existe, que falle con
> un mensaje claro ("creá scripts/data/familia.local.json a partir del .example"). Agregá ese
> archivo a `.gitignore`.
> (2) Commiteá un `scripts/data/familia.example.json` con **placeholders** (mails tipo
> `juanpablo@example.com`) para que se sepa el formato.
> (3) **Importante:** sacar los mails del archivo NO los borra del historial de git. Para que
> dejen de estar expuestos de verdad hay que **purgar el historial** (BFG / git filter-repo) o
> **volver el repo privado**. Dejá una nota en la Bitácora con esta decisión pendiente para el
> usuario (no rescribas el historial sin que él lo confirme).
>
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora + ADR). `git add -A && git commit` +
> `git push`. **Pará y esperá mi revisión.**
