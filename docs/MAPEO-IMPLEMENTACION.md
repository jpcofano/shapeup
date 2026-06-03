# ShapeUp — Mapeo de implementación (bitácora viva)

**Qué es:** el registro de lo que Claude Code va construyendo. A diferencia de
`ARQUITECTURA-shapeup-v2.md` (el diseño: *qué* construir) y `prompts/` (los *pedidos*), este
documento es el *historial de ejecución*: qué se hizo, qué se decidió y en qué estado está.

**Quién lo mantiene:** Claude Code. **Cuándo:** al cerrar cada etapa o tarea, antes de frenar
para revisión, Code agrega una entrada en la Bitácora, actualiza la tabla de Estado y el Mapa
del código. **Regla:** si algo se construyó y no quedó acá, no está hecho.

---

## 1. Estado por etapa

| Etapa | Descripción | Estado | Fecha | Prompt |
|---|---|---|---|---|
| E0 | Base ya provista (esquema, lógica, reglas, scaffold) | ✅ hecho | 2026-06 | — |
| E1 | Base + autenticación (Google + whitelist + AppShell) | ⬜ pendiente | | `prompts/01-e1-base.md` |
| E2 | Catálogo de ejercicios (data + filtros + pantalla) | ⬜ pendiente | | `prompts/02-e2-catalogo.md` |
| E3 | Rutinas (data + biblioteca + crear/editar + cache) | ⬜ pendiente | | `prompts/03-e3-rutinas.md` |
| E4 | Entrenar (hook + pantalla guiada + descanso + registro) | ⬜ pendiente | | `prompts/04-e4-entrenar.md` |
| E5 | Programas + sesiones + historial + visibilidad | ⬜ pendiente | | `prompts/05-e5-programas-sesiones.md` |
| E6 | Salud (CSV Samsung Health + progreso) | ⬜ pendiente | | `prompts/06-e6-salud.md` |

Estados: ⬜ pendiente · 🟦 en curso · ✅ hecho · 🔁 revisado/aprobado.

---

## 2. Bitácora (entradas cronológicas)

> Code: copiá esta plantilla por cada etapa/tarea cerrada. No borres entradas anteriores.

```
### [AAAA-MM-DD] E_ — <título>
- Archivos creados/modificados:
  - ruta/archivo — qué hace (1 línea)
- Decisiones tomadas:
  - …
- Desviaciones del plan (y por qué):
  - … (o "ninguna")
- Tests agregados:
  - … (qué cubren)
- Pendientes / TODO:
  - …
- Cómo probarlo:
  - comandos / pasos
```

### Ejemplo (referencia de formato — borrar cuando empiece E1)
```
### [2026-06-05] E1 — Base y autenticación
- Archivos creados/modificados:
  - src/firebase.ts — init de Firebase + Firestore con caché multi-pestaña
  - src/auth/AuthProvider.tsx — provee user + member + estado de carga
  - src/auth/resolveMemberId.ts — cruza email contra /config/familia
  - src/layout/AppShell.tsx — shell + navegación inferior
- Decisiones tomadas:
  - Router con createBrowserRouter; rutas placeholder por etapa.
- Desviaciones del plan: ninguna.
- Tests agregados: resolveMemberId.test.ts (mail dentro/fuera de whitelist).
- Pendientes / TODO: estilizar Login (queda para Claude Design).
- Cómo probarlo: npm run dev → login con Google; mail fuera de familia => Unauthorized.
```

---

## 3. Mapa del código (se actualiza a medida que crece)

Una línea por archivo relevante. ✅ = existe y andando.

```
src/
  types/models.ts            ✅ modelo de dominio (tipos + enums + mapeos FEDB)
  lib/
    entrenarState.ts         ✅ reducer del modo guiado (series + descansos)
    metricas.ts              ✅ duración, volumen, balance, tonelaje, progresión
    filtros.ts               ⬜ (E2)
    elegibilidad.ts          ⬜ (E5)
    recomendaciones.ts       ⬜ (futuro)
  data/
    ejercicios.ts            ⬜ (E2)
    rutinas.ts               ⬜ (E3)
    programas.ts             ⬜ (E5)
    sesiones.ts              ⬜ (E5)
    historial.ts             ⬜ (E5)
    visibilidad.ts           ⬜ (E5)
    salud.ts                 ⬜ (E6)
    _helpers.ts              ⬜ (E1/E2)
  hooks/useEntrenarState.ts  ⬜ (E4)
  auth/                      ⬜ (E1)
  layout/                    ⬜ (E1)
  routes/                    ⬜ (E1+)
  components/                ⬜ (E2+)
  firebase.ts                ⬜ (E1)
scripts/
  importar-fedb.ts           ✅ importador del catálogo FEDB → modelo (cat. en castellano)
  data/traducciones-fedb.es.json  ✅ traducciones (70 ejercicios, acumulativo)
firestore.rules              ✅ desplegadas
firestore.indexes.json       ✅ desplegados
```

---

## 4. Registro de decisiones (ADR liviano)

> Una entrada por decisión de arquitectura/implementación que valga la pena recordar.

```
#001 [AAAA-MM-DD] <decisión>
  Contexto: por qué surgió
  Alternativas: qué se consideró
  Resultado: qué se eligió y por qué
```

---

## 5. Convenciones de documentación (para Code)
- Actualizá este archivo al cerrar cada etapa (Bitácora + Estado + Mapa del código).
- Comentá con JSDoc las funciones públicas de `data/` y `lib/`.
- Si un módulo es no trivial, dejá un comentario de cabecera explicando su rol.
- Las decisiones importantes van al §4 (ADR), no enterradas en el código.
- Nada de "ya lo hice" sin entrada acá: la bitácora es la fuente de verdad del avance.
