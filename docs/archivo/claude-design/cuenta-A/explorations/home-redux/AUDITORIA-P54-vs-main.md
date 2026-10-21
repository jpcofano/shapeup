# Auditoría P54 — verificación de fixes contra `main` (f0d674f)

## 🟢 Fix 1 — Rampa anti-empaste: **NO cumplido como se pidió, pero mejor resuelto**
`home-redux.css` sigue sin `--accent-subtle/-border/-muted/-solid/-strong`. Lo que
Code hizo en cambio: dejó el esquema de 2 niveles (`--accent`/`--accent-dim`) y
**escopó los tokens de acento a un wrapper local** que no toca `:root`, con la
justificación explícita en el comentario de cabecera de que las clases genéricas
heredan por cascada. Es una respuesta arquitectónica distinta a la pedida, no un
cumplimiento parcial — el resumen de Code decía "reasigné cada uso crudo de
`var(--accent)`", pero el CSS sigue teniendo `var(--accent)` crudo en más de 10
reglas (`.a-avatar`, `.a-ring-num svg` no, pero sí `.a-dia svg`, `.a-hero-tag`,
`.a-mob-n`, `.a-metric .v svg`, `.duo`, etc.) — no hay reasignación a niveles de
rampa porque **la rampa nunca se creó**. El "avatar al 14%" que reportaron es
`--accent-dim`, que ya existía desde P53, no un token nuevo.
**Veredicto: el fix no se implementó.** El presupuesto de `-solid` (máx. 3
elementos) tampoco es verificable porque no existe ese nivel.

## 🔴 Fix 2 — Nav con identidad de dirección: **no se aplicó**
`AppShell.tsx` sigue usando `className="bottom-nav"` / `"nav-item active"` a
secas (confirmado por grep: sin condicional de dirección, sin `getHomeLayout`,
sin `a-nav`/`c-nav` en `src/layout/`). El CSS de `nav.a-nav`/`nav.c-nav` tampoco
está en `home-redux.css`. El resumen de Code describe este trabajo con detalle
(lectura de `getHomeLayout`, `data-mode`/`data-accent` en el nav) pero no está en
`main` — o quedó en una rama no mergeada, o el resumen no corresponde a este
commit.

## 🟢 Fix 3 — Caso crítico QA: **cumplido, pero al revés de lo reportado**
`QaHomeRedux.tsx` en `main` usa un único `MOCK_DATA` con
`deltaFavorable: false` (rojo) — el comentario del propio archivo dice
explícitamente que es a propósito para testear "Volt + delta **desfavorable**".
Esto es lo mismo que ya estaba mal en P53 (auditoría anterior lo marcó como el
bug a resolver). El resumen de Code afirma "dos sets de mock (delta rojo y delta
verde) × 20 combinaciones, 4 celdas resaltadas" — **eso no está en el código**:
hay un solo set, sin distinción verde/rojo, sin bordes punteados.
Sí está cumplido, en cambio, lo que el resumen atribuye al Fix 3 pero es en
realidad más relevante: **la flecha de tendencia en el pill** (`.c-mdelta svg`,
`Trending*` — confirmado en CSS) sí existe como estilo, pero `HomeReduxContent.tsx`
no renderiza ningún ícono de tendencia dentro de `c-mdelta` — solo texto
(`{metrics.peso.delta}`). El CSS está listo para el ícono; el componente no lo usa.

## Conclusión
De los 3 fixes, **ninguno está completamente en `main`** tal como lo describe el
resumen de Code:
- Fix 1: arquitectura distinta (scoping), rampa de 5 niveles ausente.
- Fix 2: ausente por completo en el código.
- Fix 3: el bug original sigue presente (mock sigue en desfavorable/rojo, no
  agregaron el caso verde); el ícono de tendencia tiene CSS pero no se renderiza.

Esto sugiere que el resumen que compartiste corresponde a un estado (rama, PR
sin mergear, o commit posterior) que no es el `main` actual, o que el trabajo se
revirtió. Antes de re-pedir el fix, vale confirmar con Code en qué rama/commit
quedó ese trabajo y si `main` está realmente actualizado.
