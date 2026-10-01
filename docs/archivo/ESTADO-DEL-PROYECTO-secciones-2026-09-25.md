# ESTADO-DEL-PROYECTO.md — secciones archivadas

Archivadas en P100 (01/10/2026), tal cual. Ver `docs/archivo/README.md`.

# ShapeUp — Estado del proyecto (al día)

Resumen para retomar en otra conversación. App de entrenamiento personal/familiar, calcada en su
forma de trabajo de "Comida Familiar".

## Prompts (`docs/prompts/`)
- **01–81 aplicados**, más la serie del puente PU2a/PU3a/PU4. El índice fiel es la tabla §1 de
  `docs/MAPEO-IMPLEMENTACION.md`; `CLAUDE.md` guarda las decisiones que no se re-discuten.
- `88prima-poc-data-sdk.md` — PoC de la vía D, escrito; H2 ya cumplió su criterio de éxito.
- `BRIEF-para-design.md` — brief de diseño.

## ADRs clave
- #009 funciones puras sin `firebase.ts`.
- #010 rangos de IDs reservados.
- #013 catálogo via tabs.
- #014 contadores fuera de la tx de cierre (fix multiusuario).
- #015 repo público hasta terminar (decisión del owner).
- #016 métricas de salud diarias (no crudas) por costo: plan Blaze, cuyo nivel gratuito tiene los
  mismos topes que Spark.
- #019 `Historial.inicioMs/finMs` sellados en `finalizarSesion`.
- #020 import selectivo por defecto (solo cardio que matchea historial).
- #021 enriquecimiento biométrico post-hoc e idempotente.
- #022 recomendaciones client-side, puras y explicables.
- #032–#036 serie H: taxonomía de vías, clave canónica, nada pisa un dato medido, autodetectadas
  sin curva, la vía D verificada.
- #037 la racha se deriva, nunca se acumula.
- #038 el enriquecimiento se versiona (enmienda el #021).
- #039 la progresión de VR se deriva del historial; `/rutinas` nunca se muta.
- #040 en VR la completitud se mide por tiempo, no por rondas.
- #041 lo que cuenta como entrenamiento es una lista positiva; enriquecerse y contar son dos
  preguntas distintas.

## Cómo retomar

- Mismo Proyecto (memoria + repo sincronizado). Sincronizá el repo o adjuntá este archivo + `docs/`.
- Primer mensaje sugerido: *"Seguimos con ShapeUp. Leé CLAUDE.md y
  docs/ESTADO-DEL-PROYECTO.md. Lo próximo es [sincronizar el puente / el pendiente que sea]."*
