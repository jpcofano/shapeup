# ShapeUp — Estado del proyecto (al día)

Resumen para retomar en otra conversación. App de entrenamiento personal/familiar, calcada en su
forma de trabajo de "Comida Familiar".

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

## Estado funcional (al 2026-09-25)
- E0–E6 + fix multiusuario (ADR #014) + importador de salud + ingesta completa de métricas (P22).
- Match biométrico (P23) y importador zip-first (P24): `inicioMs/finMs` en `SerieRegistro`,
  pipeline `matchBiometrico.ts` completo.
- **Series S (salud) e I (insights) CERRADAS** el 2026-07-17. Ver `CLAUDE.md`.
- **Serie del puente PU1–PU4 construida** el 2026-09-18: el Samsung Health Data SDK entra a
  ShapeUp por `/ingesta-sdk`. Ver abajo qué falta.
- Desde entonces: entrenar sin fricción y offline (P67–P70), perfil y lugar (P72),
  sustitución de ejercicio (P73), aislamiento por tipo e ingesta en tres destinos (P74–P75c),
  adherencia derivada (P77a/b, ADR #037), la ventana de la app manda (P78), progresión de VR
  (P79, ADR #039), VR por tiempo (P80, ADR #040) y juegos que no cuentan (P81, ADR #041).
- **✅ La curva de FC entra por el puente (P82, 22/09)** — la serie H cumple su objetivo: la
  biometría por serie ya no depende de exportar el ZIP a mano. Y **P83 (ADR #042)**: todo
  tramo marcado ShapeUp aporta, recortado a la ventana.
- **Fix del 22/09 que vale recordar:** `finalizarSesion` escribía `tipo` solo para `libre` y
  `juego`, así que una sesión de rutina quedaba **sin el campo** y, en Firestore, fuera de
  todo `where("tipo","in",…)`: invisible para Home, la racha, la progresión y el
  enriquecimiento. Dos sesiones de VR estaban así. Corregido y backfilleado.
- **Tests: 1163 verdes, 82 skipped** (`firestore.rules.test.ts` requiere emulador: sin Java
  en la máquina de trabajo, se permite el skip). `tsc -b` limpio, `npm run build` OK.
- **Deployado y pusheado al 24/09**: hosting en https://shapeup-41e74.web.app, `main` en
  `23a62e0`.

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
- **01–81 aplicados**, más la serie del puente PU2a/PU3a/PU4. El índice fiel es la tabla §1 de
  `docs/MAPEO-IMPLEMENTACION.md`; `CLAUDE.md` guarda las decisiones que no se re-discuten.
- `88prima-poc-data-sdk.md` — PoC de la vía D, escrito; H2 ya cumplió su criterio de éxito.
- `BRIEF-para-design.md` — brief de diseño.

## Pendientes (orden sugerido, al 2026-09-25)

**Lo primero, y no es código:**

0. **Abrir /salud y apretar "Sincronizar ahora"** (tarjeta "Puente Samsung"), mirar la vista
   previa y confirmar. Entra la biometría de 7 sesiones con curva fina y lo que el puente
   juntó desde el 18/09. **Ya no hace falta ningún ZIP.** Nada de lo de abajo se valida bien
   hasta que esto corra una vez.
1. **Usar la app dos o tres días.** P80 (VR por tiempo) y P81 (sesiones de juego) **no tienen
   un solo dato real adentro**: hace falta una sesión de VR jugada de corrido y una sesión de
   juego con el workout "Shape up" arrancado en el reloj. Construir encima antes de eso es
   ir a ciegas.

**Después, por orden:**

2. **Sincronización automática del puente** — hoy es un botón. Estaba fuera de alcance de PU4
   y es el pendiente real de la serie H.
3. **Enlazar y convertir entradas externas** — bloque 5 del roadmap, P76.
4. **PRs y logros** + **panel familiar de adherencia** (corto plazo del roadmap de CLAUDE.md).
5. **PWA completa** — offline con cola de escrituras + notificaciones.

**Decisiones abiertas del owner** (no arrancar sin respuesta):

- **La ventana de las sesiones viejas de VR es corta.** Las anteriores a P80 miden entre 10 y
  24 minutos menos que `duracionRealMin`, porque salía de las rondas marcadas. P83 aprovecha
  mejor lo que hay adentro pero no recupera lo que quedó afuera. ¿Se reescriben las
  históricas tomando `duracionRealMin` como ventana? Es un script, y es decisión suya.
- **Sesiones anteriores a P80 sin `modo` ni `duracionObjetivoMin` sellados.** Hoy se heredan
  al leer (`conObjetivo`); nada se reescribió en Firestore.

**Suelto, de la corrida nocturna:** `scripts/corregir-mecanica.ts` y
`scripts/serie-adherencia.ts` están escritos y **nunca se corrieron**, y no tienen alias en
`package.json`.

## Futuro / ideas registradas
- **Sync de salud automático — serie H** (plan en `CLAUDE.md`, taxonomía en ADR #032, auditoría
  en `docs/ROADMAP-producto.md` §15). Hoy la curva de FC entra por import manual (exportar de
  Samsung → elegir el zip). Las vías se clasifican por **de dónde leen**, no por el transporte:
  - **A** — Health Sync → Google Drive (lee Health Connect): en uso y automática, pero
    **topeada**: en sesiones de fuerza Health Connect publica 2 muestras de FC, no la curva.
  - **B** — Intervals.icu y **C** — cascarón Capacitor con plugin de Health Connect: descartadas,
    mismo techo que A (leen Health Connect).
  - **D** — app Android con el **Samsung Health Data SDK** (lee la app de Samsung Health):
    **construida y en uso** (PU1–PU4, 18/09/2026). El puente sube crudo a `/ingesta-sdk` cada
    6 horas y ShapeUp lo importa desde /salud. H2 (15/09) había dado positivo: mismo
    identificador y misma curva que el ZIP (ADR #036). **No es la C**: la C lee Health
    Connect, que no tiene la curva; la D lee la app de Samsung Health, que sí.
  - **E** — app Wear OS con el Sensor SDK (lee el sensor del reloj): descartada por costo.
  La vía A no se retira y Health Sync sigue siendo el puente de la balanza.
  ⚠ **Lo que falta, corregido el 21/09/2026:** la D está construida, pero **la curva de FC
  todavía entra solo por el ZIP**. El crudo del puente la trae (`SesionSdk.log`) y
  `lib/adaptadorSdk.ts` la descarta a propósito; `sincronizarDesdePuente` nunca llama a
  `enriquecerTrasImport`. Persistirla y enriquecer desde el puente es el pendiente #1.
- Expansión de mancuernas: discos sueltos de hierro fundido para sumar a los handles existentes.

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

## Puesta a punto de una MÁQUINA NUEVA (25/09/2026)

El repo no alcanza: cinco cosas quedan afuera de git a propósito y hay que reponerlas a mano.

**1. Lo que NO viaja con el repo** (está en `.gitignore`, hay que copiarlo de la máquina
vieja o regenerarlo):

| Archivo | Qué es | Cómo se repone |
|---|---|---|
| `scripts/service-account.json` | Credencial admin de Firebase. **Sin esto no corre ningún script de `scripts/`.** | Copiar de la máquina vieja, o bajar una clave nueva de Consola Firebase → Configuración → Cuentas de servicio |
| `.env.local` | Config web de Firebase | Copiar. `.env.example` tiene la forma |
| `scripts/data/familia.local.json` | Mails reales de la familia (menores) | Copiar. `familia.example.json` tiene la forma |
| `docs/auditorias/` | **Todos los reportes, incluido `ultimochat.md`** | Copiar la carpeta entera si querés conservar el historial de reportes |
| `node_modules/` | — | `npm install` |

**2. Instalar y loguear**

```bash
npm install
npx firebase login          # la CLI necesita su propia sesión
```

**3. Trampas de esta máquina, que pueden no repetirse en la nueva**

- **`npx vitest run` necesita `--pool=threads`.** Con el pool por defecto (`forks`) la suite
  se cuelga. Si en la máquina nueva anda sin el flag, mejor — probalo primero.
- **No hay Java**, así que `npm run test:rules` (emulador de Firestore) no corre y
  `firestore.rules.test.ts` falla siempre. CLAUDE.md permite el skip. **Si la máquina nueva
  tiene Java, corré `npm run test:rules` una vez**: hace años que esas reglas no se prueban.
- Los heredocs de bash con contenido largo fallan seguido en esta consola; escribir archivos
  con la herramienta de escritura o con un script de Python es más confiable.

**4. Verificación de que quedó bien**

```bash
npx tsc -b                              # limpio
npx vitest run --pool=threads           # 1163 verdes, 82 skipped, solo falla rules
npm run build                           # OK
npx tsx scripts/dry-run-puente.ts       # prueba que la credencial admin funciona
```

El último es el mejor semáforo: si imprime las sesiones del SDK y lo que enriquecería, la
credencial, la red y el acceso a producción están bien.
