# Orden de prompts del plan de P66 (ex §11 del roadmap)

> ⚠ **La numeración de esta tabla no coincide con lo ejecutado.** Es el plan de P66 (14/09/2026):
> por ejemplo, el P84 y el P89 de acá no son los que se ejecutaron. Lo ejecutado está en
> `docs/MAPEO-IMPLEMENTACION.md` §1. Movido en P100 (01/10/2026) desde `docs/ROADMAP-producto.md`
> §11, tal cual.

## 11. Orden de prompts

| Prompt | Contenido | Depende de |
|---|---|---|
| P67 | Bloque 1 — botones, steppers, descanso, los dos arreglos | — |
| P68 | Bloque 1 — hoja de salida, sesión parcial, una `SesionProgramada` por sesión, sesión libre persistida | P67 |
| P68b | Bloque 1 — información y orden en la sesión: "Serie N de M", "A continuación", vista del día, `+ serie`, saltar con motivo y retomar, "atrás" por la hoja de salida | P68 |
| P69 | Bloque 4 — sin señal (chico y evita perder sesiones) | P68b |
| P70 | Bloque 2 — resumen post-entreno y RIR | P68b |
| P71 | Auditoría de traducciones (script, sin UI) | — |
| P72 | Perfil editable + equipo por lugar **+ script de migración del doc sembrado** | — |
| P73 | Bloque 3 — `lib/sustitucion.ts` y UI **+ filtro por equipo escrito desde cero** | P71, P72 |
| P74 | Tests de aislamiento por `tipo` de historial | — |
| P75 | Bloque 5 — ingesta total y entradas externas | P74 |
| P76 | Bloque 5 — enlazar, convertir, inventario del import | P75 |
| P77 | Bloque 6 — carga manual y edición | P75 |
| P78 | Bloque 7 — vista por ejercicio | P70, P77 |
| P79 | Bloque 8 — recortar la rutina del día | P73 |
| P80 | Bloque 8 — armar desde cero | P79 |
| P81 | Arreglos de planificación: pausa (las dos ramas de `getProgramaActivo`), días opcionales, `diaSemana` informativo | — |
| P82 | Cola + atraso en semanas de ciclo + fin de ciclo | P81 |
| P83 | Contador de semanas de carga + propuesta de descarga | P82 |
| P84 | VR: chip de dificultad y marca de confiabilidad de FC | P72 |
| P85 | VR: progresión por FC con la escalera de palancas | P84 |
| P86 | VR: métricas propias en la vista por ejercicio — superficie sobre `recuperacionBpm` ya calculado, no derivación desde la curva. `recuperacionBpm` sale de la curva (`matchBiometrico.ts:168`), no de `exercise.recovery_heart_rate`: **no está roto, espera la curva** — la vía A nunca la trae en sesiones de fuerza, la vía D sí (9.4) | P78, P84 |
| P87 | Bloque 11 — cambiar el día, registro previsto/realizado, cobertura, aviso al tercer esquive | P82 |
| H2 | Verificación manual de la vía D (Samsung Health Data SDK) con DataViewer — sin código, **no es un prompt**. ✅ **Ejecutada el 15/09/2026: positivo** (§15.8) | — |
| P88′ | PoC de la vía D: proyecto Android aparte, sin plugin (`docs/prompts/88prima-poc-data-sdk.md`). H2 ya confirmó que el camino existe: P88′ **mide cuánto cuesta y si es estable sin intervención** (ADR #036) | H2 ✅ |
| P89 | H3 — adaptador Health Sync → tipos de entrada existentes | P75, P88′ |
| P90 | H4 — lectura de Drive, sync al abrir, idempotencia de doble vía | P89 |

**P89 depende de P75 y de P88′.**
- **P75** (P66e): define el tipo normalizado del ADR #033; un adaptador escrito antes tendría
  que inventar su propia normalización.
- **P88′** (P66f): si la vía D se adopta, el adaptador cambia de fuente y de forma, y esperar
  es barato comparado con reescribirlo. Si P88′ termina descartando la vía D por costo, P89 se
  desbloquea con la vía A como fuente única, sin cambios respecto de lo planificado.

H2 quedó reservado para la verificación manual, ya ejecutada. P90 pasó de "H3" a "H4" para no
chocar con P89 (§16.11).
