# 80 — VR por tiempo

Repo: jpcofano/shapeup. Va después de P79c. Corrige el modelo de P79 con lo que dijo Juan.

## Qué problema resuelve

Las cuatro rutinas VR daban `mantener` porque **ninguna sesión completaba sus rondas**. La
causa no era la regla, era el modelo: Juan juega VR **de corrido**, 30 minutos, sin saber que
la rutina tenía rondas. La app registró una o dos, y el resto lo leyó como incompleto. **Las
sesiones estaban completas; el registro no.**

Además, con el casco puesto no se ve el teléfono: marcar rondas a mano obliga a sacárselo.
De ahí también los dobles toques de P79b.

**El principio, decidido por Juan: en VR se mide el tiempo total. Si además hay rondas,
afinan la medición, pero no deciden si la sesión se completó.**

Sigue valiendo lo de P79: el sistema decide solo con lo que mide.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — Completitud por tiempo

- **Tiempo objetivo**: `duracionMin` si la prescripción es `Continuo`; `rondas × trabajoSeg` si
  es `Intervalos`. Con las rutinas de hoy: Body Combat 30 min, PowerBeats 25, Beat the Beats
  24, Creed 20.
- **Tiempo real**: la duración de la sesión de la app (su ventana: el principio de P78). Si
  hubo rondas registradas y se detectaron pausas (P79b), se restan.
- **Completa** si el tiempo real alcanza `FRACCION_TIEMPO_COMPLETO = 0.9` del objetivo.
- Las rondas registradas **dejan de decidir** la completitud. La regla 1 de P79 ("rondas
  incompletas") pasa a ser "tiempo incompleto", con la misma lógica de P79c: `bajar` solo con
  dos sesiones incompletas y limpias.

---

## Parte 2 — FC de trabajo sin rondas

- **Con 2 o más rondas válidas**: como en P79, por ronda.
- **Sin rondas** (o con menos de 2 válidas): la FC de trabajo es la **FC media de la ventana
  entera**, recortada según P78. En juego de corrido no hay descansos que la sesguen, así que
  acá la FC de sesión **sí** es la de trabajo. El sesgo que motivó P79 aparece solo cuando hay
  descansos.
- La detección de artefactos de P79 se aplica también a la ventana entera:
  `BiometriaSesion.fcDudosa?: boolean`, con los mismos umbrales. La confiabilidad es la misma:
  cobertura fina ≥ 0,80, sin artefactos y con zonas en el perfil.
- Subí `VERSION_ENRIQUECIMIENTO` a 4.

---

## Parte 3 — Las palancas cuando no hay descansos

Sin descansos medibles, recortar el descanso no existe como palanca. La escalera en modo
tiempo queda así: **dificultad del juego → sumar tiempo**.

- **Modo de la sesión**, derivado, no elegido: `"rondas"` si tuvo al menos
  `MIN_DESCANSOS_VALIDOS` descansos válidos; `"tiempo"` si no.
- En modo tiempo:
  - **Por debajo de la zona** → `subir-dificultad`. Si ya se subió dos veces aceptada y sigue
    por debajo → **`cambiar-juego`**, palanca nueva e indicación: *"PowerBeats no te lleva a
    Z4 ni en la dificultad más alta: probá otro juego"*. Sumar tiempo no arregla una
    intensidad baja: suma volumen, no intensidad.
  - **En la zona** → `sumar-tiempo`, de a `PASO_TIEMPO_MIN = 5`, hasta
    `TECHO_TIEMPO_EXTRA_MIN = 15` por encima del objetivo de la rutina. En el techo →
    `mantener`, con *"esta rutina ya no te exige más: es hora de otra"*.
  - **Una zona arriba** → `mantener`. **Dos o más** → `bajar`: deshace el último `sumar-tiempo`
    aceptado, o aconseja bajar la dificultad.
  - La regla de recuperación entre rondas **no aplica**: no hay rondas.
  - **Sin FC confiable** → `palanca: null`. En modo tiempo no hay descanso que medir, así que
    no hay otra medición que decida.
- En modo rondas, todo sigue como P79 y P79b.

`prescripcionUsada` suma `modo` y `duracionObjetivoMin`, y el ADR #039 se extiende: el tiempo
objetivo de la sesión siguiente sale de la última, más el ajuste aceptado.

---

## Parte 4 — La sesión por tiempo: un reloj y un botón

Al abrir una rutina VR, dos formas de jugarla:

- **Por tiempo** — la que se ofrece primero. Una pantalla con el reloj corriendo **en
  grande**, el objetivo (*"objetivo 30 min"*) y un solo botón: **Terminar**. **Sin toques en el
  medio**: arrancás, te ponés el casco, jugás, te lo sacás, terminás.
- **Por rondas** — la de hoy, para quien quiera marcarlas.

La forma que se ofrece primero sale de **la última sesión de esa rutina**: si la última fue por
tiempo, primero tiempo. Se deriva, no se guarda aparte.

El timer no avisa ni corta al llegar al objetivo: seguir jugando es tiempo de más, no un
error.

---

## Parte 5 — La tarjeta en modo tiempo

```
La última vez · jue 18/9
32 de 30 min · FC 142 (Z3) · objetivo Z4

Subí un nivel la dificultad de PowerBeatsVR.
```

---

## Tests

- **Completitud**: 27 min sobre 30 completa, 26 no; una sesión con 1 ronda registrada y 30 min
  de ventana **está completa**. Es el caso real que motiva el prompt.
- **FC sin rondas**: la FC de trabajo es la de la ventana; con artefactos en la ventana,
  `fcDudosa` y no confiable.
- **Modo**: 2 descansos válidos → rondas; 1 → tiempo.
- **Palancas en modo tiempo**, una por regla: por debajo → subir dificultad; por debajo con dos
  subidas aceptadas → cambiar juego; en zona → sumar 5; en el techo → mantener; dos arriba →
  deshace el último sumar-tiempo; sin FC → `null`.
- **Parte 4**: la forma ofrecida primero sale de la última sesión.
- Los de P79, P79b y P79c siguen verdes. **Aislamiento de P74**, otra vez.

`npx tsc -b`, la suite y `npm run build`.

---

## Al terminar, reportá en `ultimochat.md`

Podés leer `/historial` del miembro y `/rutinas` de VR. Nada de `/cardio`.

1. El diff, resumido.
2. Tests, `tsc` y build.
3. **La tabla de las cuatro rutinas VR recalculada por tiempo**: duración real de cada sesión,
   objetivo, si completa, y la sugerencia. Si alguna sesión no dura lo que Juan recuerda (dos
   de 30 min), decilo: sería la ventana de la app midiendo mal.
4. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/80-vr-por-tiempo.md`.
