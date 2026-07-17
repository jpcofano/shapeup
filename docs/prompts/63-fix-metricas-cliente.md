# Prompt 63 — Fix: las métricas no llegan a la UI del cliente + pulido de charts

> **Código + tests.** Origen: validación visual del owner (2026-07-15, capturas)
> contra el reporte de auditoria:features del mismo día. La auditoría (admin)
> calcula 5 señales y predice 4 chips de tendencias; la app muestra 2 cards en
> Resumen (Sueño, Peso) y 2 chips en Progreso (Peso, Sueño). **Todo lo que
> nace de `/metricas-salud` está ausente en el cliente** — una sola causa raíz
> con dos síntomas. Los datos existen (verificado por admin); el problema está
> entre la query del cliente y las props de los tabs. Castellano voseo.
>
> **Regla de este fix (no re-discutir): los errores de carga NUNCA se tragan.**
> Si una query de salud falla, la UI lo dice («No se pudieron cargar las
> métricas») — el silencio que muestra "sin datos" cuando hay un error es lo
> que hizo invisible este bug.

## (1) Diagnóstico primero (reportalo en el commit)

En orden de sospecha — verificá cada uno contra el código y el navegador real:
- **Índice compuesto faltante**: ¿cómo consulta `getMetricasSalud` en el
  cliente? Si usa `where(miembro)` + `where(tipo)`/`orderBy(fecha)`, el SDK
  web necesita índice compuesto y el error (`failed-precondition` con el link
  de creación) puede estar quedando atrapado en un `Result` que nadie muestra.
  El admin de la auditoría puede estar consultando distinto (por eso a él le
  funciona). Si es esto: agregá el índice a `firestore.indexes.json` (deploy
  incluido en verificación) O simplificá la query para no necesitarlo
  (traer por miembro y filtrar tipo en memoria puede ser MÁS barato de índice
  pero cuidado con el volumen: 1537 docs de un tipo — evaluá y documentá).
- **Caché de sesión rancio**: si `Salud.tsx`/Home cachean "sin datos" en
  sessionStorage (patrón de P50), un resultado vacío previo al re-import puede
  estar pegado. Si es esto: el caché debe guardar TIMESTAMP y expirar (≤ 1h),
  y NUNCA cachear un resultado de error como "vacío".
- **Prop no cableada**: ¿`ResumenTab`/`ProgresoTab` reciben `metricas`?
- Sea cual sea: dejá un test o guarda que lo hubiera detectado (p.ej. el
  Result de error propagado a un estado visible).

## (2) Errores visibles

Estado de error por sección de datos en `/salud`: si mediciones/sueño cargan
pero métricas falla, el Resumen muestra sus cards disponibles + una línea «No
se pudieron cargar las métricas (reintentar)». Nada de fingir "sin datos".

## (3) Pulido de charts (los tres de las capturas)

- **Redondeo faltante**: «26.677954%» en la card de tendencia de peso/grasa →
  1 decimal («26.7%»). Grep general de porcentajes y kg sin formatear en
  componentes de salud (la regla de P51 era "toda la tab" — se escapó esta).
- **Ticks del eje Y repetidos** («90, 90, 89»): con rangos chicos el redondeo a
  entero duplica ticks — usá 1 decimal cuando el rango del eje sea < 5
  unidades, o calculá ticks únicos.
- **Rango con < 3 puntos** (Peso en 3M = un punto flotando): en vez del chart,
  texto «Pocos datos en este rango — probá 1A o Todo» con los selectores
  activos. El chart aparece con ≥ 3 puntos.

## (4) Verificación

- `tsc -b` limpio · vitest verde · commit + push.
- Si hubo índice nuevo: `firebase deploy --only firestore:indexes` documentado
  en el reporte + esperar a que el índice esté READY antes de validar.
- Validación real en navegador (QA o prod): Resumen con 5 cards (FC reposo 67,
  Sueño, Peso, Presión 113/78, SpO2 95%) y Progreso con 6 chips (los 4 de
  métricas + Peso + Sueño). Adjuntá qué causa raíz era.
- Commit: `fix(salud): métricas visibles en cliente + pulido de charts (P63)`.
