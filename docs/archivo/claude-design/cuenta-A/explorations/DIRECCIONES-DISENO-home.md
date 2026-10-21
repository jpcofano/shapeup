# Direcciones de diseño de Home — documentado para más adelante

**Estado:** las **3 direcciones están vivas en el kit** como opción real (Perfil → "Estilo de
inicio": Aurora · Stadium · Clásico). Conmutables y persistidas. Comparten tokens, tipografía,
temas, zonas FC y el motivo del bíceps; cambia la *composición*, no la identidad.

> Idea de producto: igual que el tema (color) es por miembro, el **layout de Home** podría ser
> por miembro — cada uno elige cómo quiere ver su inicio. Las 3 direcciones comparten tokens,
> tipografía, temas, zonas FC y el motivo del bíceps; cambia la *composición*, no la identidad.

---

## A · Stadium (energía / motivación) — ★ implementado
**Vibe:** pantalla de arranque de gimnasio. Foco en el call-to-action.
- Hero "marquesina": nombre de la próxima sesión enorme (30px), glow del acento desde abajo,
  botón **Empezar ahora** dominante.
- Stats en una fila horizontal scrolleable (tiles con ícono): racha / volumen / sesiones / peso.
- WeekStrip arriba, compacta.
- Alto contraste / deportivo, menos data-dense.
- **Para quién:** los adolescentes (Sofía, Federico) — entrar y entrenar rápido.
- **Ref viva:** `ui_kits/shapeup/screens-home.jsx` (variant="stadium").

## B · Aurora (premium / progreso) — ★ implementado (D9)
**Vibe:** app de fitness premium, foco en el progreso de la semana.
- **Anillo de progreso** central con glow + gradiente del acento (sesiones de la semana).
- **Glass card** "Próxima sesión" (vidrio esmerilado) con botón Empezar.
- **Fila bento** de 3 tiles: Volumen / Peso (Δ) / Racha.
- WeekStrip con bíceps abajo.
- Micro-animaciones (anillo se llena, fades con stagger).
- **Para quién:** Juan Pablo / María — seguimiento, sensación de avance.
- **Ref viva:** `explorations/Home Aurora+ (mock).html` + `ui_kits/shapeup/screens-home.jsx`
  (variant="aurora").

## C · Bento (panel / control) — pendiente de mockear
**Vibe:** dashboard ordenado, todo visible de un vistazo, sin scroll.
- Grilla **bento** completa: cada bloque es un tile (próxima sesión, anillo chico, volumen,
  peso, racha, week-strip) acomodados como mosaico.
- Mini-anillos por stat con meta.
- Densa pero prolija; ideal para quien quiere ver todo junto.
- **Para quién:** el que controla métricas de cerca.
- Nota: la **fila bento de Aurora** ya toma prestado de acá; C sería llevar TODO a mosaico.

---

## Cómo está implementado (3 layouts seleccionables) — HECHO en el kit
1. `<Home variant>` en `screens-home.jsx` con branches **`aurora | stadium | clasico`**,
   todos consumiendo los mismos datos (próxima sesión, semana, mediciones).
2. Opción en Perfil → "Estilo de inicio" (3 botones). Persiste en `localStorage` (`su-home`).
3. Para la app real: replicar los 3 branches en `Home.tsx` y persistir por miembro
   (`su-home-by-member`, igual que el tema). Sin tocar lógica.
4. **Bento (C)** queda como 4ª dirección futura — falta mockear antes de codear.

## Pendiente / decisión para cuando se retome
- ¿Las 3 como opción real de usuario, o elegimos 1 sola definitiva y guardamos las otras 2 acá?
- Si van las 3: hay que **mockear Stadium y Bento** (como hicimos con Aurora) antes de codear.
- Costo: cada layout extra = 1 branch de render + 1 mock. Bajo, porque comparten todo lo demás.

## Archivos relacionados
- `explorations/DECISION-home-aurora.md` — por qué se eligió Aurora (B) + tiles de Bento (C).
- `explorations/Home Aurora+ (mock).html` — mock vivo de Aurora con los 8 temas.
- `ui_kits/shapeup/screens-home.jsx` — `<Home variant>` (aurora | clasico).
