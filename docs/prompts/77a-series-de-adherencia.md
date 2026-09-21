# 77a — Series de adherencia: la racha se deriva, nunca se acumula

Repo: jpcofano/shapeup. Va **después de P76b**, y se apoya en lo que P76b dejó:
`DiaActivo` con `minutos`, `agruparDiasActivos`, `actividadRelevante` y los chips de la
tira semanal.

## Qué problema resuelve

Hoy la adherencia vive suelta adentro de `Home.tsx`: `sesHechas` contra `sesObj`, y
`rachaDelPlan` cuenta **semanas con al menos una sesión**. Eso miente en los dos extremos:
una semana con una sola sesión de cuatro mantiene la racha viva, y una semana con dos
sesiones el mismo día cuenta dos.

Además no hay ninguna serie: no se puede decir "vengo mejor que el mes pasado", que es la
única pregunta que la adherencia tiene que contestar.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Decisiones cerradas

1. **Se cuentan días, no sesiones.** Dos sesiones el mismo día son un día. La unidad de
   adherencia es el día porque es la unidad del plan: el plan dice "cuatro días por
   semana", no "cuatro sesiones".
2. **La meta sale del plan.** `programa.dias.filter(d => d.tipo !== "descanso").length`.
   El perfil puede pisarla con un campo opcional nuevo, `metaSemanalDias`, para el caso
   "el plan tiene 6 pero yo apunto a 4". Si el perfil no lo declara, manda el plan. Si no
   hay programa activo, no hay meta y no hay adherencia: se muestra el estado vacío, no un
   cero.
3. **Solo ShapeUp cuenta para la meta.** Igual que la racha, la adherencia y el tonelaje
   (P74). Los días de movimiento se informan al lado, nunca sumados.
4. **Se muestra la racha activa y el récord. Nunca la racha rota.** Si la racha se cortó,
   la tarjeta no dice "0 semanas": dice el récord y arranca de nuevo. Un cero grande
   desalienta y no informa nada que el usuario no sepa.
5. **La semana en curso no rompe la racha.** Un miércoles con 1 de 4 no es una semana
   incumplida: es una semana sin terminar. La racha cuenta hacia atrás desde la última
   semana **cerrada**, y suma la semana en curso solo si **ya** llegó a la meta.
6. **Tasa de cumplimiento sobre 8 semanas móviles**, contando solo semanas cerradas.
7. **Todo en hora local**, con `ymdLocal` y `lunesDeSemana` de `lib/semana.ts`, que ya
   existen. **Sin librería de zona horaria.** La app es de una persona en un huso; meter
   `date-fns-tz` por esto es peso sin beneficio. Queda documentado en el módulo: si algún
   día hay un miembro en otro huso, esto se revisa.
8. **La racha se deriva, nunca se acumula.** Se recalcula del historial cada vez. **No se
   guarda ningún contador en Firestore.** Un contador acumulado se desincroniza con la
   primera corrección de fecha, con el primer borrado y con el primer import que llega
   tarde — y ya nos pasó tres veces con datos que parecían firmes. Esto va como **ADR
   #037**.

---

## Parte 1 — `src/lib/adherencia.ts`, puro (ADR #009)

```ts
export interface SemanaAdherencia {
  semanaInicio: string;      // lunes, "YYYY-MM-DD"
  diasPlan: number;          // días DISTINTOS con sesión ShapeUp
  diasMovimiento: number;    // días DISTINTOS con actividad y sin sesión ShapeUp
  meta: number;
  cumplida: boolean;         // diasPlan >= meta
  enCurso: boolean;          // es la semana de `hoy`
}
```

**`metaSemanal(programa, perfil): number | null`**
El override del perfil si está, si no los días no-descanso del programa, `null` si no hay
programa activo.

**`seriesDeAdherencia(dias: DiaActivo[], meta: number, hoy: string): SemanaAdherencia[]`**
Agrupa los `DiaActivo` por lunes y devuelve una fila **por cada semana del rango, incluidas
las vacías** — una semana sin nada es un dato, y si se omite la serie miente por omisión.
Ordenada ascendente. Arranca en la semana del primer día con `shapeUp`, no antes: las
semanas anteriores al plan no son incumplimientos.

**`rachaActual(semanas: SemanaAdherencia[]): number`**
Semanas consecutivas cumplidas contando hacia atrás. La semana en curso se saltea si no
llegó a la meta (regla 5), y se cuenta si llegó.

**`rachaRecord(semanas: SemanaAdherencia[]): number`**
La racha más larga de toda la serie, la actual incluida.

**`tasaCumplimiento(semanas: SemanaAdherencia[], n = 8): { cumplidas: number; total: number } | null`**
Las últimas `n` semanas **cerradas**. Devuelve `null` si hay menos de 4 cerradas: con tres
semanas de historia la tasa es ruido con apariencia de métrica.

`rachaDelPlan` de `lib/racha.ts` **se elimina** una vez migrado su único llamador
(`Home.tsx`). No queremos dos definiciones de racha conviviendo.

---

## Parte 2 — El campo del perfil

- `PerfilMiembro.metaSemanalDias?: number` en `src/types/models.ts`.
- Se edita en la pantalla de perfil que P72 dejó escribible, en la misma sección que el
  lugar habitual. Etiqueta: **"Meta de días por semana"**, con el valor del plan como
  placeholder y un texto chico que diga de dónde sale: *"Tu plan tiene 4 días. Podés
  apuntar a menos sin cambiar el plan."*
- Vacío borra el campo y vuelve a mandar el plan. **No se escribe un número igual al del
  plan**: si el usuario elige el mismo valor, se borra el override.
- Las reglas de Firestore ya permiten escribir `/config/perfiles`; verificá que el campo
  pase la validación y agregá el caso al test de reglas.

---

## Parte 3 — La tarjeta de Home

Reemplaza el `N/7` de hoy. Tres líneas, de más a menos importante:

```
3 de 4 días            ← la semana en curso, contra la meta
· 2 días de movimiento ← sufijo, solo si hay; menor jerarquía (lo de P76b)

Racha: 5 semanas · récord 7
Últimas 8 semanas: 6 de 8
```

- Si la racha activa es 0, la primera línea de racha **no dice cero**: dice
  `Récord: 7 semanas`. Cuando vuelve a haber una semana cumplida, vuelve a decir "Racha".
- Si no hay meta (sin programa activo), la tarjeta muestra solo los días activos y un
  enlace a elegir un plan.
- Si `tasaCumplimiento` devuelve `null`, esa línea no se muestra. Nada de "—" ni de 0 %.
- La tira semanal de P76b no cambia: sigue con sus cuatro estados.

---

## Parte 4 — La serie, en Progreso

En el panel de Progreso del historial, una barra por semana de las últimas 12, con la
altura en días y una línea de la meta cruzándolas. Cumplida y no cumplida se distinguen por
**forma o relleno, no solo por color** — hay que poder leerlo en escala de grises.

Al tocar una barra, dice la semana y los números: `Semana del 8/9 · 3 de 4 · 1 día de
movimiento`.

---

## Parte 5 — De dónde salen los datos, sin gastar cuota

- Los días del plan salen de `getHistorialShapeUp`, que Home **ya** trae entero y hoy son
  nueve documentos. No agregues una consulta.
- Los días de movimiento salen de `getDiasActivos` acotado a **las últimas 12 semanas**,
  con el `getCardioRango` paginado que dejó P76b. No leas `/cardio` entero: esa es la
  consulta que agotó la cuota dos veces.
- Todo el cálculo es en memoria, sobre lo ya traído. Si hace falta una consulta nueva,
  **pará y reportá antes de escribirla**.

---

## Parte 6 — La guarda de los días sin rutina

Aparte, chico y en el mismo commit porque toca los mismos archivos.

`proximaSesion` devuelve un día sin `idRutina` como próximo **siempre**: no hay forma de
cubrirlo, así que la semana queda trabada en ese día para siempre. `sesionDeHoy` devuelve
`{ tipo: "rutina", idRutina: "" }` para el mismo caso, y eso navega a una rutina que no
existe.

Hoy no se dispara: los días de VR del plan sembrado tienen `idRutina` real
(RUT-0004..0008). Pero el modelo admite `tipo: "vr"` con `vrSugerido` y sin `idRutina`, así
que es una trampa armada.

- `sesionDeHoy` gana un resultado `{ tipo: "dia-sin-rutina"; etiqueta: string }` para el día
  activo sin `idRutina`. Home lo muestra como "Tocaba {etiqueta} — no tiene rutina cargada",
  con un enlace a elegir una. **No navega a una rutina vacía.**
- `proximaSesion` cuenta ese día como cubierto si hay **alguna** sesión ShapeUp esa semana
  que no esté asignada a otro día. Deja de trabar la semana.
- Un test por cada uno, con un programa que tenga un día sin `idRutina`.

---

## Tests

- `metaSemanal`: sale del plan; el perfil la pisa; sin programa devuelve `null`.
- `seriesDeAdherencia`: dos sesiones el mismo día cuentan un día; una semana vacía en el
  medio aparece con `diasPlan: 0`; no aparecen semanas anteriores a la primera sesión; los
  días de movimiento no suman a `diasPlan`.
- `rachaActual`: la semana en curso incompleta no la rompe; la semana en curso completa la
  suma; una semana cerrada incumplida la corta.
- `rachaRecord`: con la racha actual siendo el récord; con el récord en el pasado.
- `tasaCumplimiento`: `null` con 3 semanas cerradas; 6 de 8 con 10 semanas de historia;
  ignora la semana en curso.
- **Aislamiento de P74**, otra vez: con actividades de cardio en juego, la meta, la racha y
  la tasa no se mueven.
- Parte 6: los dos casos del día sin `idRutina`.

Corré la suite completa, `npx tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Cambiar la meta a lo largo del tiempo. La serie usa **la meta de hoy para todas las
  semanas**; dejalo documentado en el módulo como simplificación conocida. Guardar el
  historial de metas es un problema aparte y hoy no lo tenemos.
- Notificaciones o recordatorios de racha.
- Cualquier cosa que escriba un contador de racha en Firestore. Ver ADR #037.

---

## Documentación

- **ADR #037 — la racha se deriva, nunca se acumula.** Con el motivo: tres correcciones de
  datos en este proyecto (mapeo 1001, fragmentos de sueño, corrimiento de 3 h) habrían
  dejado un contador acumulado mintiendo para siempre.
- Nota en `lib/adherencia.ts` sobre la hora local y la decisión de no meter librería de
  zona horaria.

Guardá este prompt como `docs/prompts/77a-series-de-adherencia.md`.

---

## Al terminar, reportá

1. El diff por archivo, resumido.
2. Tests, `tsc` y `test:rules`.
3. **La serie real**: con el historial que hay, cuántas semanas tiene, cuál es la racha
   actual, cuál el récord y cuál la tasa de 8 semanas. Si da `null` por falta de historia,
   decilo.
4. Cuántas lecturas de Firestore hace Home ahora al abrir, contra las de antes.
5. Si la meta del plan activo y la cantidad de días que realmente se entrenan difieren
   mucho, decímelo con los números: puede ser que la meta esté mal puesta.
6. Cualquier punto donde hayas parado o te hayas apartado del prompt.
