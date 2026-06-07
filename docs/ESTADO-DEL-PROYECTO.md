# ShapeUp — Estado del proyecto (al día)

Resumen para retomar en otra conversación. App de entrenamiento personal/familiar, calcada en su
forma de trabajo de "Comida Familiar".

## Roles
- **Chat de arquitectura:** datos + lógica + documentación + seeds. NO construye UI.
- **Claude Code:** construye la app y mantiene `docs/MAPEO-IMPLEMENTACION.md`.
- **Claude Design:** diseño visual (en curso, con brief listo).
- Idioma: castellano (argentino, voseo).

## Infra
- **Firebase:** `shapeup-41e74`, Firestore `southamerica-east1`, login Google whitelist, plan Spark.
- **Repo:** `github.com/jpcofano/shapeup`. **Decisión del owner: queda público hasta terminar** (ADR
  #015). Pendiente al cierre del proyecto: cerrar el historial de git (mails de menores) → privado o purga.

## La familia (4)
- juanpablo (owner, 51) → PRG-0001 (5 días, Activo), ve todo.
- maria (50) → PRG-0012 (glúteos + recomposición).
- federico (16) → PRG-0010 (rugby, prevención).
- sofia (17) → PRG-0011 (fútbol, prevención).

## Estado funcional — COMPLETO
- E0–E6 + fix multiusuario (ADR #014) + importador de salud + ingesta completa de métricas (P22).
- **Tests: 142 unitarios + 38 de reglas = 180 verdes.** `tsc -b` limpio.

## Datos sembrados
- Ejercicios: `EJ-0001+` (873 FEDB) · `EJ-8001..8034` (34 propios) · `EJ-9001..9010` (10 VR).
- Rutinas `RUT-0001..0022`. Programas `PRG-0001..0012`.
- Config: `familia`, `metodologia`, `diccionarios`, `perfiles` (zonas FC), `visibilidad`.
- Orden de corrida: `docs/SEEDS.md`.

## Integración Samsung Health — DISEÑADA Y VERIFICADA contra export real
- **Importación:** post-hoc, manual, en el cliente. **Zip-first** (P24): el usuario elige el `.zip`
  del export y la app extrae solo lo necesario. Los navegadores móviles no permiten leer carpetas
  (`showDirectoryPicker` no existe en Android), por eso el zip y no la carpeta.
- **Niveles:** Básico (peso/cardio/sueño) · Completo (+ métricas genéricas diarias, P22) · Match
  biométrico (+ `live_data.json`, P23).
- **Match biométrico (P23):** la sesión propia se identifica por `custom_id` (el ejercicio custom
  "ShapeUp" = `mq1mz4gd_gq`, resuelto por nombre desde `custom_exercise`). La curva de FC segundo a
  segundo está en `live_data.json` (`{heart_rate, start_time}`). Se cruza contra el timestamp de
  cada serie → FC fin de serie, pico, recuperación. Degrada a nivel sesión si falta curva o
  timestamps. Requiere `inicioMs/finMs` en `SerieRegistro` (cambio habilitante, en P23).
- Detalle del mapeo: `docs/SAMSUNG-HEALTH-MAPEO.md`.

## Prompts (`docs/prompts/`)
- **01–22 ✅ aplicados por Code** (último: P22, ingesta completa de salud, 180 tests).
- **P23** (match biométrico FC por serie) — escrito, **pendiente de aplicar**.
- **P24** (importador zip-first) — escrito, **pendiente de aplicar**.
- `BRIEF-para-design.md` — brief de diseño.

## Pendientes (orden sugerido)
1. **Design** — logo + identidad + escala de zonas FC, después Home y el flujo de Entrenar.
2. **Aplicar P23 y P24** (Code) — *después* de Design, porque P23 toca `EntrenarSesion` (timestamp por serie).
3. **PWA** (`vite-plugin-pwa`) — definir; se cruza con los íconos de Design.
4. **Motor de recomendaciones** — señales confirmadas (P22); implementación futura, idealmente Cloud Function.
5. **Traducciones FEDB** — track en paralelo.

## Futuro / ideas registradas
- **Sync de salud verdaderamente automático:** hoy la importación es manual (exportar de Samsung →
  elegir el zip). El único camino a "automático de verdad" (sin export ni elegir archivos) es una
  **app nativa Android con Health Connect** o el SDK de Samsung Health, o envolver la PWA en un
  cascarón nativo (Capacitor/TWA) con plugin de Health Connect. Scope grande, decisión a futuro.
- Expansión de mancuernas: discos sueltos de hierro fundido para sumar a los handles existentes.

## ADRs clave
- #014 contadores fuera de la tx de cierre (fix multiusuario).
- #009 funciones puras sin `firebase.ts`.
- #010 rangos de IDs reservados.
- #013 catálogo via tabs.
- #015 repo público hasta terminar (decisión del owner).
- #016 métricas de salud diarias (no crudas) por costo Spark.

## Cómo retomar
- Mismo Proyecto (memoria + repo sincronizado). Sincronizá el repo o adjuntá este archivo + `docs/`.
- Primer mensaje sugerido: *"Seguimos con ShapeUp (mirá ESTADO-DEL-PROYECTO). Próximo: [Design / aplicar P23-P24 / PWA]."*
