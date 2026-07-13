# Prompt 57 — S-match · Cerrar la brecha del match (la 1c que nunca se aplicó)

> **Código + tests.** Origen: el diff del owner-chat vs `lib/matchBiometrico.ts`
> (2026-07-09) confirmó que la sección 1c del P46 final nunca se implementó: el
> match rankea por solapamiento con tolerancia de 5 min, sin techos, sin
> anti-"olvido de corte", sin nivel "rango". Este prompt ES la especificación
> autoritativa del match de acá en más (anotalo en `CLAUDE.md`); si
> `docs/prompts/46-*.md` no contiene la 1c, dejá una nota al pie apuntando acá.
> Lo que S-fix-b agregó (ventana `sintetica`, regla "dia", ambigüedad por fecha)
> **se conserva** — esto lo completa, no lo reemplaza.
>
> **Decisiones del owner (no re-discutir — son pedidos textuales de él):**
> - «El match más fuerte tiene que ser la hora de inicio, ya que es probable que
>   a veces me olvide de cortar el Samsung Health» → ranking por Δinicio; el fin
>   y el solape total NO son confiables.
> - «Si no hay ninguna actividad debería tomar lo que pueda dentro del rango
>   horario» → nivel "rango" con muestras crudas de FC.
> - Un olvido de corte no puede contaminar los datos guardados (FC media/kcal).

## (1) Ranking por Δinicio (reemplaza al ranking por solapamiento)

Solo para **ventanas reales** (las sintéticas van directo a la regla "dia" de
S-fix-b, que queda igual: 1 ShapeUp ese día → "dia"; 2+ → ambiguo):

- `Δinicio = |candidata.startMs − ventana.inicioMs|`.
- Pool **custom-id** (candidatas con customId en `shapeUpCustomIds`): gana la de
  menor Δinicio, techo `Δinicio ≤ 30 min`. Sin mínimo de solape (la identidad ya
  la valida el nombre).
- Pool **ventana** (fallback sin custom-id): candidata válida si `Δinicio ≤ 10
  min` **y** solapa > 0 con la ventana. Gana la de menor Δinicio. El criterio de
  "mayor solapamiento" desaparece del ranking (con cortes olvidados, una sesión
  abierta horas solapa "perfecto" con cualquier cosa).
- **Guardia de ambigüedad por Δinicio** (solo pool ventana): si las dos mejores
  difieren < 5 min de Δinicio entre sí → `"ambiguo"`. En custom-id no aplica
  (menor Δinicio gana y listo). La ambigüedad por fecha de S-fix-b (sintéticas)
  se mantiene aparte.
- Caso real de regresión: 29/06 — ventana real 16:52→17:29, ShapeUp 19:50 →
  Δinicio 178 min > 30 → sin match (correcto; son dos actividades distintas
  salvo que el owner diga otra cosa).

## (2) Anti-"olvido de corte" en `construirBiometriaSesion`

Firma: `construirBiometriaSesion(sesion, matchPor, perfil, ventanaApp, curva?)`.
Si la ventana es real y `sesion.endMs − ventanaApp.finMs > 15 min` (Samsung
siguió corriendo):
- con curva: recalcular `fcMedia`/`fcMax`/`fcMin` SOLO con muestras dentro de
  `[ventanaApp.inicioMs, ventanaApp.finMs]`; **omitir `kcal`** (no se puede
  prorratear honestamente — mejor sin dato que inflado);
- sin curva: conservar solo `fcMax` de la fila (el pico casi seguro fue
  entrenando); omitir `fcMedia` y `kcal`.
- Nuevo campo en `BiometriaSesion`: `finMsEfectivo?: number` (el fin usado para
  los cálculos) — `HistorialDetalle` puede mostrar «Samsung siguió grabando
  N min de más; datos recortados a tu sesión». La auditoría ya lo lee.
- Ventana sintética: no hay fin confiable de la app → usar la fila tal cual y
  NO marcar `finMsEfectivo`.

## (3) Nivel "rango" — matchPor `"rango"`

Si ningún pool dio match (y la regla "dia" tampoco), intentar construir
biometría desde muestras crudas de FC dentro de la ventana (real o sintética):
- Fuentes en orden: (a) cualquier curva de `liveData` (de cualquier datauuid)
  con muestras dentro de la ventana; (b) `com.samsung.shealth.tracker.heart_rate`
  del ZIP parseado en memoria a `{ ms, bpm }[]` (NUNCA persistido — ADR #016).
- Guardrail: mínimo 10 muestras dentro de la ventana; menos → sin match.
- Resultado: `matchPor: "rango"`, FC calculadas de las muestras, sin `kcal`,
  granularidad "serie" si las muestras alcanzan para `enriquecerSerie`, si no
  "sesion". `datauuidSamsung` pasa a **opcional** en el modelo (en "rango" puede
  no haber una sesión única detrás). `HistorialDetalle`: «por rango horario».
- Alcance: solo disponible en el **import** (las curvas viven en el ZIP);
  `rematch-salud` no tiene curvas persistidas → lo dice explícito en su salida
  («nivel rango: solo disponible al importar»).

## (4) Tope explícito de recuperación en la última serie

Hoy la última serie queda sin `recuperacionBpm` por efecto colateral. Hacelo
explícito y mejor: para la última serie de la sesión, `inicioSiguienteMs =
min(ventanaApp.finMs + 90_000, sesion.endMs)` — con corte olvidado no absorbe
horas; sin datos suficientes, sin recuperación. Test dedicado con nombre claro.

## (5) Contadores y visibilidad

`ResultadoEnriquecimiento`: sumá `porRango` y desglosá `sinMatch` en
`sinCandidatasEseDia` / `sinSolape` si aún no está. El resumen de import y el
dry-run del rematch muestran todos los niveles («2 por custom-id, 1 por día,
1 por rango») y las ambigüedades con su tipo.

## (6) Tests (además de ajustar los existentes al ranking nuevo)

- Δinicio custom-id: gana la más cercana aunque otra solape más; 29 min entra,
  31 no; **caso olvido de corte**: candidata que arranca junto y termina 3 h
  después matchea igual.
- Pool ventana: Δinicio 11 min no matchea aunque solape mucho; ambigüedad
  cuando top-2 difieren < 5 min; > 5 min no.
- Anti-olvido: exceso > 15 min con curva → FC recalculadas y kcal omitida, con
  `finMsEfectivo`; sin curva → solo fcMax; exceso ≤ 15 → fila tal cual.
- Rango: 10 muestras → biometría "rango" sin kcal; 9 → sin match; sintética
  también puede llegar a "rango" si "dia" no aplicó (0 ShapeUp ese día pero hay
  muestras).
- Última serie: tope de 90 s explícito.

## (7) Verificación

- `npx tsc -b` limpio · `npx vitest run` verde.
- `rematch:salud` dry-run del owner: 07/07 "por día", 29/06 sin match con el
  gap informado, 06/04 sin candidatas. Import del ZIP: el 06/04 (VR) podría
  ganar biometría "por rango" si el reloj registró FC esa tarde — sería la
  primera validación del nivel 3.
- `CLAUDE.md`: nota "spec del match = P57" + ADR si hace falta.
- Commit: `feat(salud): match por Δinicio, anti-olvido de corte y nivel rango (S-match, spec P57)`.
