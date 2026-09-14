# P66b — Correcciones al roadmap + bloques VR y planificación

**Tipo:** documentación. No toca `src/`, `scripts/` ni configuración.
**Precondición:** P66 aplicado (commit `0736d57`).
**Entregables:** cuatro correcciones al texto del roadmap, bloques 9 y 10, tablas §9 y §11
actualizadas, ADR #028 y #029.

---

## Contexto

Segunda tanda de decisiones, acordadas en la misma sesión que P66. **Todas están
cerradas.** Si alguna resulta inviable contra el código, **paralo y reportalo**.

**Numeración de ADRs:** la resolución que aplicaste en P66 queda firme. El #025 vigente es
la spec del match biométrico (P57) y no se toca; los ADRs de P66 quedan en #026 y #027, y
los de este prompt son **#028 y #029**. La nota de numeración que dejaste en el registro y
en §12.1 se mantiene.

---

## Tarea 0 — Corregir cuatro afirmaciones del roadmap

Las discrepancias que reportaste están en §12, pero el texto de los bloques sigue
afirmando lo incorrecto y es lo que se lee primero. Corregir **en el lugar**, dejando §12
como está (el registro de qué se creía y qué era):

**0.1 — Bloque 3, precondición de perfil.** Dice que guardar el equipo por lugar
"enciende `lib/elegibilidad.ts`, hoy código muerto". Es falso: ese módulo filtra por
visibilidad, no por equipo. Reemplazar por: el filtro por equipo **hay que escribirlo**;
`elegibilidad.ts` sigue siendo código muerto y es una pregunta aparte si se reutiliza o se
elimina.

**0.2 — Bloque 3, precondición de perfil (migración).** `PerfilMiembro` ya tiene
`equipoDisponible: Equipo[]` plano más `lugarHabitual`. Pasar a equipo por lugar es
**migrar la forma del documento ya sembrado**, no agregar un campo: P72 necesita script de
migración.

**0.3 — Bloque 1, salida de la sesión.** Dice que la X "descarta todo lo hecho". Es falso:
sólo navega, el estado persiste en localStorage y se recupera al volver. Lo que sí queda
roto es que la `SesionProgramada` permanece en `En curso` indefinidamente, y que "Reiniciar
sesión" —en el header, al lado del toggle de modo— borra sin confirmar. **La hoja de
salida con tres opciones sigue siendo la decisión correcta**, por ordenar la salida y
cerrar la sesión programada, no por rescatar trabajo perdido.

**0.4 — Bloque 5, umbral.** Dice que el umbral es una constante hardcodeada, como si no
tuviera valor definido. `DURACION_MIN_ACTIVIDAD_MIN` **existe y vale 10 minutos desde
P55**, elegido después del bug del mapeo 1001.
**Decisión: se mantiene en 10** y se vuelve configurable en `/config/import`, que era el
objetivo real. Subirlo sin evidencia cambiaría comportamiento vigente a cambio de nada, y
como con el bloque 5 nada se borra, un umbral bajo sólo produce más entradas externas
visibles — ajustable en un toque si molestan.

**0.5 — §10, diferido de análisis por LLM.** Dice que el destino "ya existe:
`Recomendacion` y `/recomendaciones`, ya renderizado en Home". Es falso: el tipo y la regla
existen, pero **ningún código los usa** — Home calcula al vuelo por decisión explícita del
**ADR #023**. Persistir recomendaciones lo contradice. Anotar que el bloque de análisis
**requiere revisar el ADR #023 de frente**, no apoyarse en infraestructura existente.

---

## Tarea 1 — Agregar dos bloques a `docs/ROADMAP-producto.md`

Insertar después del Bloque 8, antes de §9.

---

````markdown
## Bloque 9 — VR

### Principio de fuentes
**La app dice qué ejercicio fue. Samsung dice cuánto costó. El match por hora los une.**

Ninguna fuente opina sobre lo de la otra. Esto descarta explícitamente dos ideas que se
evaluaron y se rechazaron: un diccionario juego→ejercicio en el import, y un segundo
workout en el reloj llamado "ShapeUp VR". Ambas intentaban que Samsung dedujera el
ejercicio, que es justo lo que no tiene por qué saber. El precedente es el mapeo 1001:
inferir desde Samsung ya salió caro una vez.

Contexto de uso: **un único workout custom en el reloj, llamado "Shape up", para todo**.
En el export, fuerza y VR son indistinguibles entre sí — mismo `custom_id`, misma
actividad. El pool de match por `custom_id` es el más fuerte del sistema (tolerancia de
30 min contra los 10 del fallback por ventana), así que abrir la rutina en la app antes de
jugar alcanza para que la sesión quede correctamente identificada.

**Consecuencia aceptada:** una sesión VR jugada sin abrir la app entra como entrada externa
ambigua y se resuelve a mano con el "enlazar" del bloque 5. No hay forma honesta de
evitarlo.

### 9.1 Dificultad
Chip al cerrar la sesión VR, tres niveles: **suave · normal · intenso**. Un toque, igual
que el RIR del bloque 2. Es la palanca que necesita la progresión para existir.

### 9.2 Progresión decidida por FC
El sistema elige. Compara la FC media de la sesión contra la zona objetivo que las rutinas
VR ya declaran (Z3 para las rítmicas, Z4 para las de quema y boxeo).

**Escalera de palancas, ordenada por lo que cuesta en tiempo:**
1. **Dificultad del juego** — no alarga la sesión.
2. **Recortar descanso** — tampoco.
3. **Sumar ronda** — sí, por eso va última.

- FC media **por debajo** de la zona objetivo y rondas completas → el juego no exige:
  subir dificultad.
- FC media **en zona** y rondas completas → recortar descanso; con el descanso en su piso,
  sumar ronda.
- FC media **muy por encima**, o mala recuperación entre rondas → mantener o bajar.

Piso de descanso y techo de rondas configurables.
**Precondición:** zonas de FC en el perfil (bloque 3).

### 9.3 Confiabilidad del dato de FC
La FC de muñeca durante boxeo y juegos de ritmo es la peor medición del sistema: el sensor
es óptico, agarrar el control contrae el antebrazo y los golpes sacuden el reloj. Picos
falsos y caídas que no ocurrieron.

**Decisión:** la progresión **sugiere igual**, avisando que el dato es dudoso. Si el aviso
aparece seguido, la conclusión no es que la regla falle: es que la muñeca no sirve para
medir esa actividad.

### 9.4 Métricas propias en la vista por ejercicio
Para modalidad VR, 1RM y tonelaje no significan nada. En su lugar:
- minutos en zona 3 y 4,
- FC media por ronda,
- **recuperación entre rondas** — cuánto baja la FC en el descanso, el mejor indicador de
  fitness cardiovascular disponible sin laboratorio,
- rondas completadas.

El `SerieTimer` ya marca el fin de cada ronda y el import ya trabaja con la curva completa
de FC: el cruce de ambos es lo que habilita la recuperación.

### 9.5 Qué aporta el VR, para que el plan no lo sobrevalore
Aporta **adherencia**: cuarenta minutos en zona 3-4 sin vivirlos como entrenar. Es
intermitente, dominante de tren superior, sin impacto articular.
**No aporta sobrecarga progresiva**: no hay forma de subir carga de manera controlada, sólo
densidad, y eso tiene techo. Complementa la fuerza, no la reemplaza.
Las calorías que reporta el reloj en actividades de brazos vienen infladas: los algoritmos
están calibrados sobre movimiento de muñeca.

---

## Bloque 10 — Planificación del programa

### 10.1 El programa es una cola, no un calendario
Hacés la siguiente sesión cuando podés. No hay días perdidos: hay avance más lento.
`diaSemana` queda como etiqueta informativa y deja de fingir que planifica.

### 10.2 El atraso se mide en semanas de ciclo
En una cola pura la deuda no existe, y un contador de sesiones pendientes crece sin techo
hasta volverse impagable e inútil. En su lugar: **semanas de ciclo completadas contra
semanas transcurridas** — "vas por la semana 3 del plan y transcurrieron 5".

`Programa.duracionSemanas` pasa a usarse. Superado un atraso máximo, el sistema ofrece
**reiniciar el ciclo** en vez de seguir acumulando.

El estado del ciclo **es del miembro, no del programa**: los programas son plantillas
compartidas, así que inicio de ciclo, semanas de carga y última descarga viven en el perfil
del miembro.

### 10.3 Descarga automática, disparada por carga real
La descarga sirve para bajar fatiga acumulada. Si no cumpliste, no acumulaste fatiga: el
disparador no puede ser el calendario.

- Una semana cuenta como **semana de carga** si completaste **al menos el 75%** de sus
  sesiones no opcionales.
- Al juntar **cuatro semanas de carga**, se **propone** descarga. Nunca se aplica sola.
- La descarga recorta **un 40% de las series**, redondeando hacia abajo, nunca por debajo
  de una serie por ejercicio. **La carga se mantiene.**

Cumpliendo a medias tardás el doble en llegar a la descarga, que es exactamente la
intención.

**Entrada futura:** `recomendaciones.ts` ya vigila FC de reposo elevada y sueño bajo. Esas
señales podrían **adelantar** la descarga. Es el puente natural entre la solapa Salud y el
plan; queda propuesto, sin decidir.

### 10.4 Fin de ciclo
Al completar las semanas del ciclo, el sistema **sugiere cómo seguir** — repetir, subir
volumen, cambiar de programa — y vos decidís.

### 10.5 Arreglos que van en este bloque
- **Pausar no puede dejarte sin Home.** `getProgramaActivo` sólo reconoce `"Activo"`, así
  que un programa `Pausado` cae en el estado vacío que sugiere crear uno en Biblioteca —
  donde no se pueden crear programas. La Home tiene que entender la pausa y ofrecer
  reanudar.
- **Los días `opcional: true` no cuentan como incumplidos**, ni para el atraso ni para el
  contador de semanas de carga.
- **`DiaPrograma.tipo: "vr"` es una rama muerta**: ningún seed la usa. Decidir si se elimina
  del modelo o se documenta como no usada.
````

---

## Tarea 2 — Actualizar las tablas existentes

**§9, cambios de modelo** — agregar:

| Campo | Bloque |
|---|---|
| `Historial.dificultadVR?: "suave" \| "normal" \| "intenso"` | 9 |
| `Historial.fcConfiable?: boolean` | 9 |
| Estado de ciclo en el perfil del miembro: programa, inicio de ciclo, semanas de carga, última descarga, descarga activa | 10 |
| `Programa.pausadoDesde?` | 10 |
| Piso de descanso y techo de rondas para rutinas VR | 9 |

Y ajustar la fila de `PerfilMiembro`: es **migración de la forma del documento sembrado**
(de `equipoDisponible: Equipo[]` plano a equipo por lugar), no un campo nuevo.

**§11, orden de prompts** — agregar al final:

| Prompt | Contenido | Depende de |
|---|---|---|
| P81 | Arreglos de planificación: pausa, días opcionales, `diaSemana` informativo | — |
| P82 | Cola + atraso en semanas de ciclo + fin de ciclo | P81 |
| P83 | Contador de semanas de carga + propuesta de descarga | P82 |
| P84 | VR: chip de dificultad y marca de confiabilidad de FC | P72 |
| P85 | VR: progresión por FC con la escalera de palancas | P84 |
| P86 | VR: métricas propias en la vista por ejercicio | P78, P84 |

Anotar además, junto a P72 y P73, que crecieron: P72 incluye migración del perfil y P73
incluye escribir el filtro por equipo desde cero.

---

## Tarea 3 — Registrar dos ADRs

**ADR #028 — La app es la única fuente de qué ejercicio fue**

- *Contexto:* el reloj usa un único workout custom para todo, así que el export no distingue
  fuerza de VR. Se evaluó un diccionario juego→ejercicio y un segundo workout nombrado en el
  reloj.
- *Decisión:* ambas se rechazan. La app aporta el ejercicio, Samsung aporta intensidad y
  duración, el match por hora los une. Nunca se infiere el ejercicio desde Samsung.
- *Consecuencia:* una sesión jugada sin abrir la app queda como entrada externa ambigua,
  resoluble a mano con el "enlazar" del bloque 5. Se acepta ese costo antes que adivinar.

**ADR #029 — El programa es una cola y el atraso se mide en semanas de ciclo**

- *Contexto:* `proximaSesion` cuenta por semana e ignora `diaSemana`; el conteo se reinicia
  cada lunes y no queda registro de lo incumplido.
- *Decisión:* cola sin fechas. El atraso se expresa como semanas de ciclo completadas contra
  transcurridas, con tope y oferta de reiniciar — nunca como sesiones pendientes acumuladas.
  La descarga se dispara por semanas de carga real (≥75% de cumplimiento), se propone y no
  se aplica sola, y recorta series manteniendo la carga.
- *Consecuencia:* `duracionSemanas` pasa a usarse y el estado de ciclo vive en el perfil del
  miembro, porque los programas son plantillas compartidas.

---

## Criterios de aceptación

- Las cinco correcciones de la Tarea 0 aplicadas en el texto de los bloques, con §12 intacta.
- Bloques 9 y 10 agregados; tablas §9 y §11 actualizadas sin perder filas.
- ADRs #028 y #029 registrados en el formato del registro (§5 de `MAPEO-IMPLEMENTACION.md`).
- No se modifica nada fuera de `docs/`.
- Commit: `docs(plan): correcciones + bloques VR y planificación + ADR #028/#029 (P66b)`
