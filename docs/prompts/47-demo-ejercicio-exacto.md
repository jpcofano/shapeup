# Tarea: Demo de ejercicio exacto (animar imágenes FEDB; degradar el video genérico)

Repo: jpcofano/shapeup. Problema: los `videoUrl` de los ejercicios del plan son
GENÉRICOS POR PATRÓN (`videoEsGenerico: true`), no el ejercicio real. El usuario ve
movimientos "parecidos pero no el que hay que hacer" (ej.: Flexiones muestra press de
banca; Swings muestra peso muerto). No existen videos libres exactos para la mayoría.

**Solución:** la pestaña "Demo" debe priorizar las IMÁGENES propias del ejercicio
(Free Exercise DB: `0.jpg` = inicio, `1.jpg` = fin), animadas como loop de 2 frames
(≈ 1–1.4 s por frame, cross-fade opcional). Eso ES el ejercicio exacto. El video
genérico queda como opción secundaria claramente etiquetada, o se oculta.

## Auditoría (qué muestra hoy el video genérico) — referencia
- Exacto/casi: EJ-8006 Curl, EJ-8003/EJ-8009 Dominadas, EJ-8015 Press de hombros.
- Mismo patrón, otro implemento: EJ-8001 Goblet←Squat, EJ-8004/EJ-8011 Remo←Bent-over
  row, EJ-8008 Zancada atrás←Forward lunge, EJ-8010 RDL←Deadlift, EJ-8005 Press banda←Bench.
- Engañoso (otro ejercicio): EJ-8002 Flexiones←Bench, EJ-8007 Fondos←Shoulder press,
  EJ-8012 Swings←Deadlift, EJ-8013 Mountain climbers←Jumping jacks.
- Sin video ni imagen: EJ-8016 Plancha lateral (tiene img Side_Bridge), EJ-8017 Bird dog,
  EJ-8018 Pallof.

## A. UI — componente de Demo (src/components/... + EjercicioDetalle / EntrenarSesion)
1. Si el ejercicio tiene `imagenes` (≥1), el Demo por defecto es un **DemoImagenes**:
   - 2+ frames en loop (`setInterval` ~1200 ms o CSS `@keyframes` con `steps`).
   - 1 sola imagen → mostrarla estática (sin "Video pronto").
   - Respetar `prefers-reduced-motion`: no animar, mostrar `0.jpg` fija.
2. El video genérico (`videoEsGenerico: true`) NO es el demo principal:
   - Opción recomendada: ocultarlo del flujo de entrenamiento y dejar las imágenes.
   - Si se conserva, ponerlo bajo un toggle "Ver movimiento de referencia" con un
     badge honesto: **"Referencia del patrón — no es el ejercicio exacto"**.
3. Quitar el badge "Video pronto" cuando haya imágenes (ya hay demo válido).

## B. Datos — completar imágenes faltantes en seed-plan.ts
Tres ejercicios no tienen `imagenes`. Buscar el folder FEDB correcto en
`scripts/fedb/exercises.json` (campo `images`, p.ej. `grep -i "bird"`):
- EJ-8005 Press de pecho con banda → si no hay banda, usar una de pecho equivalente
  (`Pushups` o dejar sin imagen y mostrar solo instrucciones).
- EJ-8017 Bird dog → buscar "Bird Dog" en el dataset (`imgs("Bird_Dog")` si existe).
- EJ-8018 Pallof press → probablemente no esté en FEDB; dejar sin imagen (instrucciones).
NO inventar nombres de carpeta: confirmá que el id exista en `fedb/exercises.json` antes.

## C. (Opcional) limpiar videoEsGenerico
Si se decide ocultar del todo el video genérico en entrenamiento, se puede dejar el
campo en Firestore (no molesta) o quitarlo del seed. Mantener el catálogo FEDB igual.

## D. Re-seed
Tras tocar seed-plan.ts (imágenes nuevas):
```bash
npx tsx scripts/seed-plan.ts --dry-run
npx tsx scripts/seed-plan.ts --force
```

## Tests
- Unit del componente Demo: con N imágenes anima; con 1 imagen estática; con 0 imágenes
  y video genérico → muestra referencia etiquetada (o nada), nunca "Video pronto" falso.
- `prefers-reduced-motion` → no anima.
- Verificación visual: Flexiones, Mountain climbers, Swings ahora muestran SU ejercicio
  (imágenes), no el clip de otro movimiento.
