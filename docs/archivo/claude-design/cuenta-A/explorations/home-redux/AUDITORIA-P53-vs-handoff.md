# Auditoría — Home Redux Theming (P53) vs. handoff de diseño

Comparación entre `docs/home-redux/design_handoff_theming/` (diseño aprobado) y lo implementado en `main` (`f0d674f`). Fuente: lectura directa del repo, no capturas.

## 🔴 Desencajes reales (no documentados como decisión de alcance)

**1. Rampa de intensidad anti-empaste — no está.**
El prompt de cierre pedía explícitamente 5 niveles por acento (`--accent-subtle/-border/-muted/-solid/-strong`) con presupuesto de máx. 3 elementos en `-solid` por pantalla. `src/styles/home-redux.css` solo trae `--accent` + `--accent-dim` (mismo esquema de 2 niveles que ya existía en `tokens.css`). Ningún archivo define la rampa de 5 niveles. Es la pieza central de esa fase y no se portó — vale la pena confirmar si Code la evaluó y descartó, o directamente no llegó a esa parte del prompt.

**2. Bottom nav sin identidad de dirección.**
El handoff define `nav.a-nav` (barra 3px sobre el activo, label uppercase) y `nav.c-nav` (pastilla duotono con radio firma). El port las omitió a propósito ("nav no se toca") y Home sigue usando el `.nav-item` genérico compartido con el resto de la app. Es una decisión real, pero cambia el diseño aprobado: la identidad no-cromática de B v2 (que pedías explícitamente) se corta justo en el nav, que es parte del contenido de Home en el brief original.

**3. Caso crítico semántico mal representado en QA.**
Pediste validar **Volt + delta positivo** (verde sobre verde) como peor caso. `QaHomeRedux.tsx` usa datos mock fijos con `delta: "+0.4 kg", deltaFavorable: false` — o sea testea Volt + delta **negativo** (rojo), no el caso que importa. La grilla de 20 combinaciones funciona y el toggle de escala de grises también, pero el escenario que motivó el pedido no está cubierto.

## 🟡 Divergencias documentadas — confirmar si las apruebas

**4. Persistencia solo en localStorage, no Firebase.** Code lo decidió y lo dejó anotado en `docs/prompts/53-home-redux-theming.md` como pendiente de revisión ("por consistencia con `ThemeProvider` existente"). El handoff pedía perfil de usuario en Firebase + espejo local.

**5. No hay pantalla "Configuración" dedicada.** El mock mostraba una screen propia con status bar y nav. Code integró "Apariencia" como una card condicional dentro de `Perfil.tsx` (aparece solo si el layout es Pulse/Premium). Razonable dado que el repo ya tenía `Perfil` como home de ajustes, pero es una reestructuración del flujo, no una pantalla 1:1.

**6. Home + Perfil (con datos reales) no se verificaron visualmente** — login real de Google OAuth, sin bypass en el entorno del agente. Solo `/qa/home-redux` (datos mock) se probó con Playwright. Queda pendiente que alguien logueado lo mire.

## 🟢 Lo que quedó fiel
Tokens de acento duales, superficies A/C, tipografía (Archivo / Hanken Grotesk), radios firma de B v2, anillo (segmentado en A, con gradiente+glow en C), tarjetas de métrica con delta semántico, chevron pattern, botones — todo portado con los valores exactos del CSS del handoff. La grilla de QA y el toggle de grises están bien resueltos estructuralmente.

## Sugerido
Priorizaría 1 y 3 como fixes concretos (rampa de acento + corregir el mock del caso crítico), y una decisión explícita tuya sobre 4 y 5 antes de seguir. 2 es la que más creo que vale la pena revertir, dado que era un punto fuerte del diseño ("identidad no-cromática").
