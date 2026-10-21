# Decisión de diseño — Home "Aurora+" (D9)

**Fecha:** 2026-06-08
**Estado:** Decidido, NO implementado todavía.
**Quién decide:** owner (jpcofano) + Claude Design.

## Qué se eligió
De las 3 direcciones exploradas en `explorations/Home - Direcciones modernas.html`:
**Base = B · Aurora**, **incorporando piezas de C · Bento.**

Objetivo: que la Home deje de verse "de sistemas / dashboard" y pase a **app de fitness
premium moderna**, sin cambiar la base oscura ni los tokens/temas (sigue siendo cian Ion por
defecto, re-skinea por miembro).

### De Aurora (B) — el esqueleto
- **Glow ambiental** detrás del hero (radial suave del acento, bien sutil).
- **Anillo de progreso** grande con gradiente del acento (cian→indigo en Ion) + leve blur/glow.
  Es la pieza central.
- **Card "glass"** (vidrio esmerilado, borde sutil) para la sesión + botón **Empezar** primario.
- Saludo "Dale, Juan." grande, con el punto en acento.

### De Bento (C) — los secundarios
- En vez de los **chips** simples de Aurora (racha / volumen), usar una **fila de 2–3 tiles
  bento** compactos para los stats secundarios: **volumen (kg)**, **peso actual (−Δ)** y
  **racha** (con `flame`). Tiles redondeados, fondo `--card`, cifra grande tabular + label.
- Mantener los **mini-anillos** de Bento como recurso para stats con meta (opcional).

### Composición final (de arriba a abajo)
1. Top bar: marca (chevron + ShapeUp) + avatar → Perfil.
2. Saludo "Dale, {primerNombre}." + subtítulo de contexto.
3. **Hero Aurora:** anillo de progreso (sesiones de la semana, ej. 2/4) con glow, y dentro/al lado
   la **card glass "Próxima sesión"** (ver reconciliación) + botón **Empezar**.
4. **Fila bento** de stats secundarios (volumen / peso / racha).
5. **WeekStrip** con el bíceps (se mantiene tal cual D2).

## Reconciliación con A1 (funcional, ya hecho por Code el 2026-06-08)
Code ya rehízo la Home: el hero es **"Próxima sesión · Día N de M"** (secuencia del programa,
no "hoy toca por día"), con botón Empezar; si la semana está completa muestra estado positivo
"Semana completa" + "Elegir otra rutina". El WeekStrip y el progreso van debajo.

**Implicancia para el diseño:**
- La card central NO se llama "Hoy toca" → se llama **"Próxima sesión"** y muestra "Día N de M".
- El **anillo de progreso** representa el avance del programa en la semana (sesiones hechas /
  objetivo) — coincide con el dato que A1 ya calcula (`proximaSesion` + historial de la semana).
- Estado **"Semana completa"**: el anillo va lleno (100%) con check, la card glass muta a
  "🎉 Semana completa — Elegir otra rutina". Hay que diseñar ese estado, no solo el normal.
- NO se toca `lib/proximaSesion.ts` ni `data/`. Diseño consume lo que A1 ya expone.

## Restricciones (se mantienen)
- Tokens siempre; el hero re-skinea con el tema del miembro (el gradiente del anillo usa
  `--accent` → una variante; definir 2 stops por tema o derivar con color-mix).
- Nav inferior de 6 ítems intacto. EntrenarSesion fullscreen sin tocar.
- Castellano voseo. Íconos Lucide. Bíceps/flame como motivos.

## Pendiente antes de construir
- Definir cómo se arma el **gradiente del anillo por tema** (2 stops por `[data-theme]`, o
  `color-mix(in oklch, var(--accent), var(--zona-z1) 40%)` para no mantener 8 pares a mano).
- Confirmar si la **fila bento** es de 2 o 3 tiles (peso actual depende de que el miembro tenga
  mediciones de Salud; si no hay, mostrar 2).
