# Tarea: Fixes de entrenamiento (videos, instrucciones, timer, persistencia)

Repo: jpcofano/shapeup. Cuatro temas detectados probando el modo Entrenar.
Convenciones del repo: voseo, tokens CSS, `Result<T>`, sin `throw` cruzando capas,
seeds idempotentes con `--dry-run`/`--force`.

---

## A. Bug raíz: los ejercicios del plan no tienen `videoUrl` (sale "Video pronto")

**Causa:** en `scripts/seed-plan.ts`, `ejercicioDoc(e)` arma los 18 ejercicios del
plan (EJ-8001+) SIN el campo `videoUrl`. La asignación de video genérico por patrón
(`videoGenericoPorPatron` / `urlClip` de `scripts/data/videos-genericos.ts`) solo
corre en `scripts/importar-fedb.ts` (catálogo FEDB EJ-0001+), no en el plan. Como las
rutinas Fuerza A/B/C usan EJ-8001+, casi todas muestran "Video pronto".

**Fix:** en `seed-plan.ts`, importá los helpers y asigná el clip por patrón:

```ts
import { videoGenericoPorPatron, urlClip } from "./data/videos-genericos";
// dentro de ejercicioDoc(e):
const clip = videoGenericoPorPatron(e.patron as PatronMovimiento);
return {
  // ...campos existentes...
  ...(clip ? { videoUrl: urlClip(clip), videoEsGenerico: true } : {}),
};
```

Cobertura esperada (10/12 patrones): tendrán video Sentadilla goblet, Flexiones,
Dominadas (asistidas y chin-ups), Remo a una mano, Remo invertido, Press de pecho,
Curl de bíceps (← el del screenshot), Extensión de tríceps, Press de hombros,
Zancada, RDL, Swings, Mountain climbers, Puente de glúteos.

**Quedan SIN clip** (verificado en Wikimedia Commons, jun-2026: NO existe video
libre de estos movimientos — solo fotos): Plancha lateral (EJ-8016) y Pallof
(EJ-8018) = "Core anti-rotación"; Bird dog (EJ-8017) = "Core anti-extensión".
Recomendación: que la pestaña "Demo" caiga a la IMAGEN del ejercicio cuando no hay
`videoUrl` (EJ-8016 ya tiene `imgs("Side_Bridge")`); a EJ-8017/8018 sumarles una
imagen si se consigue, o dejar el placeholder. No inventar nombres de archivo .webm
que no existan (rompen el `<video>`).

## Comandos para seedear bien (después de aplicar el fix)

Las rutinas usan EJ-8001+ (seed-plan). Para que tomen video + instrucciones nuevas:

```bash
# 1) Previsualizar (no escribe nada)
npx tsx scripts/seed-plan.ts --dry-run
# 2) Escribir de verdad (re-escribe los 18 ejercicios del plan + rutinas + programas)
npx tsx scripts/seed-plan.ts --force
```

VR ya está sembrado (EJ-9001+), así que no hace falta re-correr seed-vr. La app lee
`ejercicios` en vivo de Firestore, así que los videos aparecen apenas termina el seed.

Si también querés arreglar el "Video pronto" del **catálogo FEDB** (Biblioteca, no las
rutinas):

```bash
npx tsx scripts/importar-fedb.ts          # regenera catalogo-ejercicios.json con videoUrl
npx tsx scripts/seed-ejercicios.ts --force # sube el catálogo actualizado a Firestore
```

**Después de seedear:** correr `npx tsx scripts/seed-plan.ts --force` (re-escribe los
ejercicios). Verificar que la app lea `videoUrl` en vivo (no catálogo bundleado).

---

## B. Instrucciones más explícitas (uno/dos brazos, cambio de lado)

Revisar los 18 ejercicios del plan en `seed-plan.ts`. Donde el movimiento sea de un
solo lado o con una mancuerna en cada mano, decirlo explícito. Ediciones puntuales:

- **EJ-8006 Curl de bíceps** → instrucciones:
  "Una mancuerna en cada mano, brazos a los costados.",
  "Subí AMBOS brazos a la vez (o alterná uno y uno), codos pegados al cuerpo.",
  "Bajá lento, sin balancear el torso."
- **EJ-8004 Remo a una mano** → agregar paso final:
  "Hacé todas las reps con un brazo y después cambiá al otro."
- **EJ-8010 Peso muerto rumano** → primer paso:
  "Una mancuerna en cada mano, por delante de los muslos."
- **EJ-8015 Press de hombros** → primer paso:
  "Una mancuerna en cada mano, a la altura de los hombros; subí las dos juntas."
- **EJ-8012 Swings con pesa** → primer paso:
  "Sostené UNA pesa con las dos manos entre las piernas."
- **EJ-8016 Plancha lateral** → agregar:
  "Hacé el tiempo de un lado y después girá al otro lado."
- **EJ-8018 Pallof press** → agregar:
  "Hacé las reps de un lado y después cambiá de lado."
- **EJ-8008 Zancada hacia atrás** → dejar claro en instrucciones (no solo en notas):
  "Alterná piernas, o completá todas las reps de una y cambiá."

Mantené el resto. Tras editar, `seed-plan.ts --force`.

---

## C. Timer de descanso: que avise fuerte (sonido + flash + vibración + pantalla)

Archivo probable: `src/routes/EntrenarSesion.tsx` (+ `hooks/useEntrenarState.ts`).
Al llegar a 0 el descanso, debe ser imposible no notarlo:

1. **Sonido fuerte**: reproducir un beep (WebAudio `AudioContext` con un oscilador, o
   un `<audio>` con un asset corto). Desbloquear el audio en la primera interacción
   del usuario (al iniciar la sesión) para sortear el autoplay-policy de móviles.
   Beep repetido 2–3 veces, volumen alto.
2. **Vibración**: `navigator.vibrate?.([200,100,200,100,400])`.
3. **Flash de pantalla**: overlay full-screen que parpadea (p. ej. acento ↔ fondo) 2–3
   veces vía CSS keyframes, ~1 s.
4. **Mantener pantalla encendida** durante la sesión: Screen Wake Lock API
   (`navigator.wakeLock.request("screen")`), re-pedir el lock en `visibilitychange`.
   Liberar al salir de la sesión.
5. Respetar `prefers-reduced-motion` para el flash; el sonido/vibración igual suenan.
6. Avisar en los **últimos 3 s** con un tic más suave (cuenta regresiva).

Si ya existe algún sonido, subir volumen y sumar flash + vibración + wake lock.

---

## D. Persistir reps/carga: prefijar con la prescripción y guardar lo cargado

Síntoma: los inputs REPS/CARGA arrancan vacíos (o con placeholder) y se pierde lo
cargado. Esperado:

1. **Prefill**: cada serie arranca con los valores de la prescripción del bloque
   (`repsObjetivo.value` y `cargaKg` si existe — p. ej. Curl 12 reps · 8 kg). El
   usuario edita sobre eso.
2. **Persistencia por serie**: lo editado se guarda en el progreso de la sesión
   (`useEntrenarState` / `lib/entrenarState.ts`, que ya persiste descansos) y se
   mantiene al navegar entre ejercicios, al refrescar y entre series (la siguiente
   serie hereda lo cargado en la anterior como nuevo default).
3. Mantené pura la lógica del reducer + sus tests; sólo agregás reps/carga al estado
   por bloque/serie si no están.
4. Al finalizar, esos valores son los que van a `finalizarSesion` (bloques/registro).

---

## Tests
- Unit del reducer: prefill desde prescripción; edición de reps/carga persiste y la
  serie siguiente hereda el último valor.
- Verificación manual: timer suena/parpadea/vibra a 0; pantalla no se apaga en sesión.
- Tras `seed-plan.ts --force`: un ejercicio del plan con patrón cubierto trae
  `videoUrl`; Plancha lateral sigue sin video (esperado).
