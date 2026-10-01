# ShapeUp — Proyecto (contexto estable)

Lo que no cambia de una sesión a otra: qué es la app, la infraestructura, la familia, las fuentes
de datos y cómo levantar una máquina. Armado en P100 (01/10/2026) con secciones movidas tal cual
desde `CLAUDE.md` y `docs/ESTADO-DEL-PROYECTO.md`.

Referencia: `docs/FORMA-DE-TRABAJO-comida-familiar.md`, la forma de trabajo de «Comida Familiar»
en la que se calcó la de ShapeUp.

## Qué es
App de entrenamiento familiar (4 miembros, owner juanpablo). React + TypeScript + Vite +
Firebase (Firestore, plan Blaze, `southamerica-east1`). PWA en camino.

## Roles
- **Chat de arquitectura:** datos + lógica + documentación + seeds. NO construye UI.
- **Claude Code:** construye la app y mantiene `docs/MAPEO-IMPLEMENTACION.md`.
- **Claude Design:** diseño visual (en curso, con brief listo).
- Idioma: castellano (argentino, voseo).

## Infra
- **Firebase:** `shapeup-41e74`, Firestore `southamerica-east1`, login Google whitelist, plan Blaze
  (el nivel gratuito tiene los mismos topes que Spark: los límites de costo siguen valiendo).
- **Repo:** `github.com/jpcofano/shapeup`. **Decisión del owner: queda público hasta terminar** (ADR
  #015). Pendiente al cierre del proyecto: cerrar el historial de git (mails de menores) → privado o purga.

## La familia (4)
- juanpablo (owner, 51) → PRG-0001 (5 días, Activo), ve todo.
- maria (50) → PRG-0012 (glúteos + recomposición).
- federico (16) → PRG-0010 (rugby, prevención).
- sofia (17) → PRG-0011 (fútbol, prevención).

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

## Puesta a punto de una MÁQUINA NUEVA (25/09/2026)

**El proyecto vive adentro de OneDrive** (`C:\Users\juany\OneDrive\Documentos\AppsScript\`),
así que **casi todo viaja solo**: el repo, el `.git` (commits sin pushear incluidos), los
archivos que git ignora a propósito —`scripts/service-account.json`, `.env.local`,
`scripts/data/familia.local.json`, `docs/auditorias/`— y hasta `node_modules`. No hay nada
que copiar a mano.

**Lo único que NO viaja**, porque vive fuera de la carpeta de OneDrive:

| Qué | Dónde vive | Cómo se repone |
|---|---|---|
| Sesión de la CLI de Firebase | `~/.config/configstore/firebase-tools.json` | `npx firebase login` |
| Credenciales de `gcloud` (si hacen falta) | `%APPDATA%\gcloud` | `gcloud auth login` |
| Java, Node | instalación del sistema | ver abajo |

**Trampas conocidas**

- **`npx vitest run` anda sin `--pool=threads`** (P84, verificado el 25/09 en la máquina
  `Usuario`). El cuelgue con el pool `forks` era de la máquina `juany`: si allá vuelve a
  pasar, el flag sigue sirviendo, pero ya no es el camino por defecto.
- **La suite no necesita `.env.local`** (P84): ningún test carga Firebase de verdad. Si un
  test nuevo falla con `auth/invalid-api-key`, está importando algo de `src/data/` sin
  mockear `../firebase`; la función pura va en `src/lib/`.
- **Las reglas se prueban con Java** (`npm run test:rules`, emulador de Firestore). En la
  máquina `Usuario` hay Temurin 25 y dan **82/82 verdes** (25/09). En `juany` no hay Java:
  ahí `firestore.rules.test.ts` falla en `npx vitest run` y CLAUDE.md permite el skip.
- `node_modules` viaja por OneDrive, pero trae binarios compilados. Si algo raro falla al
  construir, `npm install` de nuevo y listo.
- Los heredocs de bash con contenido largo fallan seguido en esta consola; escribir archivos
  con la herramienta de escritura o con un script de Python es más confiable.

**Verificación de que quedó bien**

```bash
npx tsc -b                              # limpio
npx vitest run                          # todo verde salvo rules si no hay emulador
npm run test:rules                      # 82 verdes (necesita Java)
npm run build                           # OK
npm run dry-run:puente                  # prueba credencial admin + red + producción
```

El último es el mejor semáforo: si imprime las sesiones del SDK y lo que enriquecería, la
credencial, la red y el acceso a producción están bien.
