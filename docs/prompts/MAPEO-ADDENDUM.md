# ADDENDUM al MAPEO — para pegar en `docs/MAPEO-IMPLEMENTACION.md`

> Generado por Claude Design (2026-06-09). Son entradas **planificadas** (camino a ejecutar),
> no "hechas". Pegar en las secciones correspondientes del mapeo del repo y, a medida que Code
> las cierre, mover a ✅ con su Bitácora. **La fuente de verdad sigue siendo el mapeo del repo.**

---

## A) Filas para la tabla de Estado (§1) — pista nueva "Flujo de programa" + kit + fix

| Etapa | Descripción | Estado | Fecha |
|---|---|---|---|
| **Kit (Design)** | | | |
| K-MEDIA | Sesión guiada: pestañas Foto/Demo/Músculo (MediaTabs) en el UI kit | ✅ kit | 2026-06-09 |
| K-HOME3 | Home con 3 layouts seleccionables (Aurora/Stadium/Clásico) en el kit | ✅ kit | 2026-06-08 |
| K-PROG | Mapa muscular, sparklines, records, sesión libre, instrucciones legibles en el kit | ✅ kit | 2026-06-09 |
| **Funcional + Diseño (a ejecutar)** | | | |
| F1 (PROG-MIEMBRO) | Programa activo **por miembro** (no global) | ⬜ | — |
| F2 (PROG-SEMANA) | Días del programa **por día de semana** (L–D) + descansos | ⬜ | — |
| F3 (PROG-FLUJO) | Flujo elegir/cambiar programa: lista → detalle con vista semanal → "Activar para mí" | ⬜ | — |
| D11 | Pulido visual del flujo de programa (vista semanal, selección, WeekStrip con descansos) | ⬜ | — |
| D12 | MediaTabs (Foto/Demo/Músculo) en BloqueGuiado del repo | ⬜ | — |
| D13 | Home: 3 layouts seleccionables + Historial/Salud enriquecidos (sparklines, records, zonas) en el repo | ⬜ | — |
| **Fix** | | | |
| FIX-SALUD | Importador de salud no importa bien — diagnóstico + arreglo (ver §C) | ⬜ | — |

---

## B) El flujo de programa semanal — análisis y camino (NUEVO)

### Estado hoy (lo que hay)
- `Programa.dias: DiaPrograma[]` — cada día con `orden`, `tipo` (`"descanso"` | activo) e `idRutina`.
  **La estructura semanal con descansos YA existe en el dato.**
- `proximaSesion(programa, historialSemana)` — secuencial por `orden`, salta descansos, da
  `{ indice, total }` ("Día N de M"). Pura. 10 tests.
- `getProgramaActivo()` — devuelve el **primer** programa con `estado: "Activo"` (GLOBAL).
- `visibilidad` — owner ve todo; otros ven programas/rutinas asignados en `/config/visibilidad`.

### Huecos (lo que falta y por qué no está claro)
1. **No hay UI para elegir/activar el programa de un miembro.** `getProgramaActivo()` agarra el
   primero Activo; nadie "elige el suyo".
2. 🔴 **"Activo" es global, no por miembro.** Si JP y María activan su programa, `getProgramaActivo()`
   devuelve el primero de la lista → colisión en app familiar.
3. **La estructura semanal no se muestra.** El dato (4 días + 3 descansos, qué toca cada día)
   existe pero la Home solo dice "Día N de M". No hay vista "tu semana: L Empuje · M descanso…".
4. **No hay flujo de cambio** de programa, ni qué pasa con la semana en curso.
5. **Descansos invisibles** en la WeekStrip (no distingue entrenado / planificado / descanso).

### Decisiones tomadas con el owner (2026-06-09)
- **F1:** el programa activo es **por miembro**. Se elige y se cambia desde la app.
- **F2:** los días del programa son **por día de semana** (Lunes=Empuje, Martes=descanso…),
  no secuenciales. Reemplaza el criterio secuencial de `proximaSesion` por "qué toca HOY según
  el día de la semana", manteniendo el fallback de "siguiente sin hacer" para días salteados.

### Camino a ejecutar (orden)
1. **F1 — Programa activo por miembro (funcional).**
   - Modelo: en vez de `estado: "Activo"` global, un mapa `config/programaActivo` por miembro
     `{ juanpablo: "PRG-0001", maria: "PRG-0012", … }` **o** campo `miembroActivo?` en el programa.
     *(Decisión de implementación de Code; preferencia: doc `config/programaActivo`, análogo a
     `config/visibilidad`, sin tocar los docs de `/programas`.)*
   - `getProgramaActivo(miembroId)` pasa a recibir el miembro y leer ese mapa.
   - `setProgramaActivo(miembroId, programaId)` nuevo.
   - **No** romper retrocompat: si no hay entrada para el miembro, fallback al `estado:"Activo"` actual.
2. **F2 — Días por día de semana (funcional).**
   - `DiaPrograma` ya tiene/recibe `diaSemana` (0–6 o "L".."D"). Asegurar que el seed lo puebla.
   - Nueva `sesionDeHoy(programa, hoyDiaSemana, historialSemana)` → la rutina del día actual,
     o estado "descanso" si hoy es descanso, o "ya entrenaste hoy".
   - `proximaSesion` se mantiene como fallback (días salteados / "qué sigue").
3. **F3 — Flujo elegir/cambiar (funcional + UI mínima).**
   - **Biblioteca → tab "Programas"**: lista (nombre, X días/sem, objetivo, nivel). Filtrada por
     visibilidad del miembro.
   - **Detalle de programa**: vista semanal (L–D con rutina o descanso), "X días/sem · Y descanso",
     `comoUsar`/`reglasProgresion`, botón **"Activar para mí"** → `setProgramaActivo`.
   - **Cambiar**: desde el detalle de otro programa, "Activar para mí" reemplaza el actual
     (confirmar si hay semana en curso; el historial no se borra).
4. **D11 — Pulido visual del flujo.**
   - Vista semanal como fila L–D con estado por día (rutina = chip de color/acento;
     descanso = ícono tenue 💤/"—"). WeekStrip de Home distingue **entrenado** (bíceps lleno) /
     **planificado** (bíceps outline) / **descanso** (ícono descanso).
   - Detalle de programa premium (cabecera, vista semanal, días expandibles, botón activar).
   - Mock primero en el kit, después prompt para Code.

### Restricciones
- No tocar `lib`/`types`/`auth` salvo lo que F1/F2 requieran explícitamente (y con tests).
- Nav de 6 ítems intacto (Programas entra por tab en Biblioteca, no suma ítem).
- Tokens siempre, voseo, re-skinea por tema.

#### ADR propuesto — Programa activo por miembro vía `config/programaActivo`
- **Decisión:** doc `config/programaActivo` (mapa miembro→programaId), análogo a `config/visibilidad`.
  `getProgramaActivo(miembroId)` lo lee; fallback a `estado:"Activo"` si no hay entrada.
- **Razón:** evita migrar los docs de `/programas`; un solo doc, fácil de leer/escribir; mismo
  patrón que visibilidad. Permite que cada miembro tenga su programa sin colisión.

#### ADR propuesto — Día por día de semana, con fallback secuencial
- **Decisión:** la sesión "de hoy" se resuelve por `diaSemana`; si el usuario saltó días,
  `proximaSesion` (secuencial) sigue dando "lo siguiente sin hacer".
- **Razón:** la familia entrena en días fijos (quieren ver "hoy toca / hoy descansás"), pero no
  hay que castigar a quien se saltea un día.

---

## C) FIX-SALUD — El importador de salud no importa bien (NUEVO)

> Reportado por el owner (2026-06-09): "el importador de salud no está importando bien".
> Necesita **diagnóstico antes de arreglar** — no asumir la causa.

### Contexto (lo que ya se tocó antes)
- **P25 (E6.4):** `ignoreUndefinedProperties: true` + `stripUndef` en parsers + `Promise.allSettled`
  por fila + mensaje "X importados · Y omitidos". O sea: ya hubo un fix de resiliencia.
- **E6.3:** importador zip-first (`samsungZip.ts`), extracción selectiva, niveles básico/completo/biométrico.
- **E6.2:** match biométrico por `custom_id` + `live_data.json`.

### Qué hay que hacer (diagnóstico dirigido)
1. **Reproducir con un export real** y registrar el síntoma exacto: ¿no importa nada? ¿importa
   parcial? ¿importa pero los datos quedan mal (fechas, unidades, zona, duplicados)? ¿falla la
   validación del ZIP? Anotar el mensaje y el `{ importados, omitidos }`.
2. **Sospechas a verificar (sin asumir):**
   - **Formato del CSV/JSON cambió** (Samsung Health actualiza headers/columnas) → los parsers
     (`parsearPeso`/`parsearEjercicio`/`parsearSueno`/`parsearMetricas`) no matchean columnas.
   - **Fechas/zonas horarias**: parseo de fecha → `idMetrica`/`idMedicion` mal → choque o descarte.
   - **Encoding/locale** (coma decimal `,` vs punto `.`) → `Number()` da `NaN` → fila omitida.
   - **Markers de validación del ZIP** demasiado estrictos → ZIP válido rechazado.
   - **Índice de `live_data` por datauuid** no encuentra match → biometría vacía (puede ser
     esperado, no un bug).
   - **Reglas Firestore** rechazando el write (permiso) → todo omitido con error genérico.
3. **Arreglar la causa raíz** (no parchar el síntoma) y **agregar un test con el fixture real**
   (un CSV/registro que reproduzca el fallo) para que no regrese.
4. **Mejorar el feedback** si el diagnóstico lo amerita: que el preview/resultado diga *por qué*
   se omitió una fila (columna faltante, fecha inválida, etc.), no solo el conteo.

### Entregable
- Bitácora `FIX-SALUD` con: síntoma reproducido, causa raíz, archivos tocados, test de regresión
  con fixture real, y verificación (import de prueba con conteo correcto).
- Si el formato de Samsung Health cambió, documentarlo en `docs/SAMSUNG-HEALTH-MAPEO.md`.

#### Nota
No reescribir el importador zip-first ni el match biométrico (E6.2/E6.3 andan); este es un
**fix dirigido** sobre el parseo/persistencia que está fallando hoy.

---

## D) Pendientes que siguen abiertos (recordatorio del mapeo)
- 🔴 **Privacidad — emails en historial de git** (decisión del owner: purgar con BFG/filter-repo
  o repo privado). Sigue pendiente.
- ⬜ `lib/recomendaciones.ts` — motor de recomendaciones (futuro).
- B2 (video real del ejercicio) / B4 (variantes) — futuros.
