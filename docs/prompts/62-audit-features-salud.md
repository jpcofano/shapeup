# Prompt 62 — Auditoría integral de features: salud + recomendaciones (series S e I)

> **Solo script + reporte, read-only** (cero writes a Firestore, cero cambios de
> comportamiento en la app). Origen: el owner re-importó el ZIP y "no ve cambios" —
> necesitamos distinguir, feature por feature, entre: (a) no implementado,
> (b) implementado pero no deployado, (c) deployado pero sin datos que lo activen,
> (d) funcionando. La auditoría de datos (P53) ya existe; esta es de FEATURES.
> Castellano voseo.

## (1) `scripts/auditoria-features.ts` (+ alias `auditoria:features`)

Genera `docs/auditorias/features-{YYYYMMDD}.md` (carpeta ya gitignoreada) con:

### A. Estado del deploy (la causa más probable del "no veo cambios")
- Hash del bundle local: buildear NO (lento) — leé `dist/assets/index-*.js` si
  existe y su fecha, y el hash del último build.
- Hash del bundle SERVIDO: fetch a https://shapeup-41e74.web.app, extraé el
  nombre del asset `index-*.js` del HTML.
- Veredicto explícito: «Servido: index-Dg0N02Ty (coincide con dist local del
  2026-07-13) — el deploy está al día» o «Servido ≠ local → FALTA DEPLOYAR».
- Últimos 5 commits (`git log --oneline -5`) con marca de cuáles son
  posteriores a la fecha del bundle servido (los que el teléfono NO tiene).

### B. Matriz de features — para cada una: implementada (¿el símbolo existe en
el código HEAD?), prerequisito de datos (¿se cumple hoy en Firestore, vía
admin read-only?), y dónde verla en la app:

| Feature | Símbolo a verificar | Prerequisito de datos |
|---|---|---|
| Resumen 5 señales (S2/P56) | señales presion/spo2 en resumenSalud | métricas con recencia 60d |
| Señal fc-reposo real (P56) | tipo fc-media-dia en TIPOS_METRICA | docs fc-reposo post-reimport |
| Sueño por noche (P52) | consolidarNoches | registros /sueno |
| Import selectivo (P47/P55) | filtrarCardioRelevante + mapeo 1001 | — |
| Match + biometría (P57) | matchPor "dia"/"rango", Δinicio | ≥1 historial con biometria |
| Zona en biometría | zonaPrincipal poblado | config/perfiles COMPLETO (leé el doc y decí qué miembros tienen zonasFC/fcMaxTeorica y cuáles no) |
| Contexto del día (S2) | bloque en HistorialDetalle | noche previa + fc-reposo del día |
| Recomendaciones (P50) | calcularRecomendacion | señales con baseline |
| Tendencias I1 | serieTendencia + TrendChart | ≥10 datos por métrica (listá qué chips deberían verse) |
| Costo cardíaco I2 | compararConPrevias | ≥2 sesiones con biometría MISMA rutina (decí cuántas hay hoy y de qué rutina) |
| Progresión I3 | sugerirProgresion | ≥1 sesión previa del ejercicio (decí para qué ejercicios del owner hay sugerencia hoy y cuál es) |

- Para los prerequisitos: lecturas admin mínimas y dirigidas (no vuelvas a leer
  colecciones enteras — la cuota de lecturas ya mordió dos veces; usá queries
  con límite y documentá cuántas lecturas gasta el script, debería ser < 100).

### C. Sección final "Para el owner": checklist accionable generado según lo
encontrado — SOLO lo que falta, en orden, con el comando exacto o el gesto en
la app («falta deployar → npm run build && firebase deploy», «perfiles sin
zonasFC para juanpablo → seed-perfiles --force», «costo cardíaco: se activa
solo cuando registres tu 2ª sesión de Fuerza A con el reloj», etc.). Si todo
está bien: decirlo, feature por feature, con dónde mirarla.

## (2) Guardas
- Read-only estricto. Pureza: cumple `pureza.test.ts` (admin + lib, sin data/).
- Si el fetch al hosting falla (sin red), la sección A lo dice y sigue.

## (3) Verificación
- `tsc -b` limpio · vitest verde · correrlo de verdad y adjuntar el veredicto
  de la sección A en el resumen del commit.
- Commit: `chore(scripts): auditoria de features salud/recomendaciones (P62)`.
