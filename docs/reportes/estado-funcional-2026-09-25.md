# Estado funcional al 25/09/2026

Movido en P100 (01/10/2026) desde `docs/ESTADO-DEL-PROYECTO.md`, tal cual. Es historia: el estado
vigente está en `docs/ESTADO-DEL-PROYECTO.md`, que desde P100 es el traspaso del chat.

## Estado funcional (al 2026-09-25)
- E0–E6 + fix multiusuario (ADR #014) + importador de salud + ingesta completa de métricas (P22).
- Match biométrico (P23) y importador zip-first (P24): `inicioMs/finMs` en `SerieRegistro`,
  pipeline `matchBiometrico.ts` completo.
- **Series S (salud) e I (insights) CERRADAS** el 2026-07-17. Ver `CLAUDE.md`.
- **Serie del puente PU1–PU4 construida** el 2026-09-18: el Samsung Health Data SDK entra a
  ShapeUp por `/ingesta-sdk`. Ver abajo qué falta.
- Desde entonces: entrenar sin fricción y offline (P67–P70), perfil y lugar (P72),
  sustitución de ejercicio (P73), aislamiento por tipo e ingesta en tres destinos (P74–P75c),
  adherencia derivada (P77a/b, ADR #037), la ventana de la app manda (P78), progresión de VR
  (P79, ADR #039), VR por tiempo (P80, ADR #040) y juegos que no cuentan (P81, ADR #041).
- **✅ La curva de FC entra por el puente (P82, 22/09)** — la serie H cumple su objetivo: la
  biometría por serie ya no depende de exportar el ZIP a mano. Y **P83 (ADR #042)**: todo
  tramo marcado ShapeUp aporta, recortado a la ventana.
- **Fix del 22/09 que vale recordar:** `finalizarSesion` escribía `tipo` solo para `libre` y
  `juego`, así que una sesión de rutina quedaba **sin el campo** y, en Firestore, fuera de
  todo `where("tipo","in",…)`: invisible para Home, la racha, la progresión y el
  enriquecimiento. Dos sesiones de VR estaban así. Corregido y backfilleado.
- **Análisis asistido de una sesión (P93, 30/09, ADR #044):** diseño en
  [ANALISIS-ASISTIDO.md](ANALISIS-ASISTIDO.md). «Preparar análisis» y «Cargar análisis» en el
  detalle de la sesión, con el prompt versionado en `docs/analisis/`. El global es P94.
- **Tests: 1204 verdes + 82 de reglas verdes con el emulador** (P84/P85, 25/09; sin emulador
  `firestore.rules.test.ts` se permite en skip). `tsc -b` limpio, `npm run build` OK.
- **Deployado y pusheado al 24/09**: hosting en https://shapeup-41e74.web.app, `main` en
  `23a62e0`.
