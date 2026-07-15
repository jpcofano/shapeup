# Prompt 61 — H0 · Documentar el plan de la serie H (Health Connect) en `CLAUDE.md`

> **Solo documentación** (no toques código de la app ni tests). Origen: conversación
> de arquitectura con el owner (2026-07-14), decisiones ya tomadas. Mismo método que
> abrió la serie S (P45): primero el plan y las decisiones escritas, después los
> prompts de implementación. Castellano voseo.

## (1) Agregá a `CLAUDE.md` la sección "Serie H — Sync automático (Health Connect)"

Con este contenido (ajustá solo formato, no decisiones):

```markdown
## Serie H — Sync automático con Health Connect (plan vigente)

Objetivo del owner: que los datos de salud dejen de depender del export manual
del ZIP — cada teléfono de la familia sincroniza sus propios datos de Samsung
Health (vía Health Connect) al abrir la app.

### Decisiones de arquitectura (owner, 2026-07-14 — no re-discutir)

- **ADR #026 — Sync on-device, sin backend**: Health Connect es una base LOCAL
  del teléfono. La app la lee en el dispositivo y reusa el pipeline cliente
  existente (adaptador → tipos de entrada → filtro selectivo → match →
  agregados diarios a Firestore). No hay servidor de sync. Consecuencia: el
  proyecto SIGUE en Spark; Blaze queda diferido a notificaciones push (serie
  futura, no esta).
- **ADR #027 — Cascarón Capacitor con web remota**: la PWA actual corre dentro
  de un cascarón Capacitor configurado con `server.url` apuntando al hosting
  (shapeup-41e74.web.app). Los deploys web llegan a todos sin tocar el APK; el
  APK solo cambia si cambia la capa nativa (plugins). TWA descartado (no
  accede a Health Connect); nativo puro descartado (reescritura).
- **ADR #028 — Distribución por APK directo**: sin Play Store (US$25 y
  papelerío sin retorno para 4 teléfonos). Instalación única por teléfono;
  las actualizaciones llegan por la web remota (ADR #027). Migrar a Play en
  el futuro no invalida nada.
- **ADR #029 — Sync al abrir la app (fase 1)**: sin background sync por ahora
  (WorkManager queda como fase 2 opcional, solo si el uso real lo pide). Al
  abrir, la app pide los deltas a Health Connect (changes-token) y corre el
  pipeline. Botón de sync manual en /salud como respaldo.
- **Regla heredada de la serie S**: todo timestamp en epoch ms UTC, conversión
  a local solo al mostrar. Los bugs de timezone fueron el enemigo #1 de la
  serie S; acá no entra ni uno.

### Fases

- **H1 — Spike de exploración (primero, y bloquea el diseño fino)**: cascarón
  Capacitor mínimo + plugin de Health Connect instalado SOLO en el teléfono
  del owner, con una pantalla de volcado que muestre qué registros expone HC
  de verdad: ¿el custom "shape up" llega como ExerciseSession y con qué
  título/tipo? ¿qué métricas sincroniza Samsung a HC que el CSV no traía
  (pasos, estrés, HRV)? ¿los registros traen los mismos uuids que el export?
  Salida: reporte tipo auditoría (gitignored) que el chat de arquitectura usa
  para diseñar H2/H3. Sin escribir NADA a Firestore en esta fase.
- **H2 — Adaptador**: `src/import/healthConnect.ts` mapea registros HC → los
  tipos de entrada existentes (CardioInput, RegistroSueno, MetricaSalud,
  MedicionCorporal). Puro donde se pueda, testeado con fixtures del spike.
  El filtro selectivo, el match y la consolidación de sueño se REUSAN sin
  cambios — si algo necesita cambiar ahí, es señal de revisar el adaptador.
- **H3 — Sync incremental + UX**: changes-token persistido por miembro,
  sync al abrir con resumen visible (mismo estilo que el import: «12 registros
  nuevos · 1 sesión matcheada»), botón manual, manejo de permisos de HC
  (pantalla de onboarding por miembro, cada teléfono autoriza lo suyo).
  El import por ZIP NO se elimina: queda como respaldo y para historia previa.
- **H4 (opcional, post-validación)**: background sync con WorkManager.

### Riesgos conocidos

- La incógnita central la responde H1: forma real de los datos en HC (custom
  exercises, cobertura de métricas, ids). No comprometer diseño de H2/H3
  antes del reporte del spike.
- Builds Android: requieren Android Studio/SDK en la máquina del owner —
  H1 incluye documentar el setup mínimo en una guía corta.
- Idempotencia doble vía: un dato puede llegar por ZIP y por HC; los ids
  deterministas existentes son la defensa — H2 debe garantizar que ambos
  caminos generen EL MISMO id para el mismo dato (si HC no trae el uuid de
  Samsung, definir la clave determinista en H2 con datos del spike).
```

## (2) Housekeeping

- En la sección de la serie I: tildá I1/I2/I3 como completos (si no está ya) y
  marcá la serie H como "en curso — fase H1".
- En el roadmap viejo: actualizá la línea de "sync automático (largo plazo)"
  apuntando a esta sección.

## (3) Verificación

- `CLAUDE.md` renderiza bien; ningún archivo de código tocado; `tsc -b` y
  vitest siguen verdes (sin cambios).
- Commit: `docs: plan serie H (Health Connect) — ADRs #026-#029`.
