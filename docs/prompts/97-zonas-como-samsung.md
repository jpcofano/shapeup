# 97 — Las zonas como las cuenta Samsung

Repo: `jpcofano/shapeup`.

**Regla general:** si algo no coincide con lo que dice este prompt, **pará y reportá**. No lo reinterpretes. No commitees. Cualquier escritura en Firestore la corre Juan a mano.

---

## Qué problema resuelve

92c encontró que el piso de Z5 da 152 en lugar de 153. La causa es de redondeo: `seed-perfiles.ts` redondea `169 × 0,9 = 152,1` a 152 y usa ese número como techo de Z4 y, a la vez, como piso de Z5. Por eso las zonas guardadas se pisan y el editor no deja guardar el perfil. El botón de Configuración da 85 en el piso de Z1, contra 84 de Samsung.

Con los rangos de Samsung, las cinco zonas coinciden con las suyas a menos de un minuto. Es decir, el método está bien y lo que falla es el redondeo.

La consulta al SDK confirmó que **no expone ni la FC máxima ni las zonas**. Solo expone la fecha de nacimiento, y sin fecha de cambio.

## Decisiones cerradas

1. **La convención de Samsung**, deducida de sus números con una FC máxima de 169:
   - techo de cada zona = `floor(pct × fcMax)`, con 60 / 70 / 80 / 90 % para Z1 a Z4;
   - piso de la zona siguiente = techo anterior + 1;
   - piso de Z1 = `floor(0,5 × fcMax)`;
   - techo de Z5 = `fcMax`.

   Con 169 tiene que dar **84-101 · 102-118 · 119-135 · 136-152 · 153-169**. Es el test de referencia.
2. **La FC máxima vigente es un valor declarado, con su origen** (`samsung` · `estimacion-shapeup` · `medida`). La de Juan arranca en **169, con origen `samsung`**. Las zonas cambian **solo** cuando cambia este valor.
3. **Samsung queda en automático y no se lee desde el puente.** Samsung calcula su FC máxima con un modelo propio (edad, altura, peso y mediciones del reloj) que no sigue los picos: ya hubo sesiones con 170 y sigue en 169. El SDK no expone ni ese valor ni las zonas. La idea de "220 − edad" que el ADR #025 dejó pendiente se cierra como descartada, con este motivo.
4. **ShapeUp calcula su propia estimación de la FC máxima, pero no la aplica sola.**
   - Toma los picos de la curva suavizada de las **últimas 12 semanas**, solo de sesiones con buena cobertura del reloj y sin `fcDudosa`. Usa el **segundo pico más alto**, no el primero, para que un pico aislado del sensor no mueva todo. Decime qué curva suavizada usaste.
   - **La estimación solo sube.** No alcanzar el máximo en una sesión no significa que haya bajado.
   - **Revisión trimestral:** cada 3 meses desde el último cambio, o antes si la estimación supera el valor vigente, la app muestra la estimación de ShapeUp, el valor vigente y un campo para anotar el que muestra Samsung ese día. La persona elige cuál aplicar: estimación, Samsung o dejar como está. Queda registrado qué eligió, cuándo y con qué datos.
5. **La historia no se reescribe.** Cada sesión guarda las zonas con que se calcularon sus minutos por zona. Un cambio trimestral afecta solo a las sesiones que vienen. **La única excepción es la corrección de este prompt:** el 152 es un error de redondeo, no un cambio de FC máxima, así que acá sí se sube la versión de enriquecimiento para que se rehagan las sesiones pasadas.

---

## Parte 1 — Diagnóstico (solo lectura)

Reportá:
- Dónde se calculan hoy las zonas: el seed, el botón de Configuración y cualquier otro lugar.
- Cómo quedaron guardadas las zonas de los **cuatro perfiles**, y cuáles se pisan.
- Dónde vive la FC máxima de cada perfil y si ya tiene algún campo de origen.
- Qué versión de enriquecimiento está vigente hoy.

## Parte 2 — El cálculo

- **Una sola función pura** de FC máxima a zonas, con la convención de la decisión 1. La usan el seed y el botón. No puede quedar ninguna otra copia del cálculo.
- **La FC máxima con su origen** en el perfil.
- **El editor valida que las zonas no se pisen** y que sean contiguas.

## Parte 3 — La estimación y la revisión trimestral

- Una función pura que calcula la estimación según la decisión 4, y devuelve el valor junto con las sesiones y los picos que la sostienen.
- En el perfil, la revisión trimestral, con tres columnas: la estimación de ShapeUp con su evidencia, el valor vigente y el valor de Samsung que anota la persona.
- Al aplicar un valor, se recalculan las zonas con la misma función de la Parte 2, y se registran el origen, la fecha y la elección.
- Un aviso en el inicio cuando toca la revisión o cuando la estimación supera el valor vigente. Nunca se cambia nada sin que la persona elija.

## Parte 4 — El script de corrección

`scripts/corregir-zonas-perfiles.ts`, con un comando de npm:
- Recalcula las zonas de los cuatro perfiles con la función nueva, a partir de su FC máxima actual.
- Corre en seco por defecto y muestra el antes y el después de cada perfil. Aplica con `npm run <comando> -- --aplicar`.
- Es idempotente.
- Lo corre Juan.

## Parte 5 — Enriquecimiento

- Subí la versión de enriquecimiento.
- Cada sesión guarda las zonas con que se calcularon sus minutos por zona.
- **Volvé a medir la sesión testigo del 27/09** con la regla nueva. Con las zonas del perfil corregido, Z5 tiene que quedar dentro del minuto de tolerancia contra Samsung, como ya pasaba con los rangos de Samsung. Si no queda, **pará y reportá**.

## Parte 6 — Tests

- 169 da exactamente las zonas de Samsung.
- Varios valores de FC máxima dan zonas contiguas y sin pisarse, incluidos valores de menores.
- El editor rechaza zonas que se pisan.
- La estimación: usa el segundo pico, excluye `fcDudosa` y cobertura baja, mira solo 12 semanas, y nunca baja.
- La revisión: aparece a los 3 meses o antes si la estimación supera el vigente; aplicar un valor cambia las zonas **solo** para las sesiones siguientes, y las pasadas conservan las suyas.
- El script: dos corridas no cambian nada más, y el modo en seco no escribe.
- El fixture de 92c pasa con las zonas del perfil.

`tsc`, tests y build.

---

## Qué reportar

Escribí el reporte en `docs/auditorias/ultimochat.md`, con:
1. El diagnóstico de la Parte 1.
2. Lo que muestra el script en seco para cada perfil.
3. La tabla de la sesión testigo con las zonas corregidas, contra Samsung.
4. Qué da hoy la estimación de ShapeUp para Juan, con qué sesiones y picos, y qué curva suavizada usaste.
5. Todo lo que no coincidió con este prompt.

Actualizá en `CLAUDE.md` el ADR #025, con la estimación por edad descartada y su motivo, y agregá la convención de zonas. No commitees.

Guardá este prompt como `docs/prompts/97-zonas-como-samsung.md`.
