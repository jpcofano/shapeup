# 73 — Bloque 3: sustitución en vivo

Repo: jpcofano/shapeup. Diseño en `docs/ROADMAP-producto.md`, Bloque 3. Parte del estado
posterior a P72.

**Objetivo:** que si un ejercicio no se puede hacer —porque duele, porque la máquina está
ocupada o porque no tenés el equipo— la app te ofrezca **uno**, con la razón en una línea, y
lo registre como sustitución.

Precondiciones cumplidas: P71 dejó el catálogo en castellano y P72 dejó el equipo por lugar
y el lugar de la sesión.

Las decisiones están cerradas. Si algo es inviable, **pará y reportá**. No commitees.

---

## Paso 0 — Verificar premisas (solo lectura)

1. `equipoDe(perfil, lugar)` y `state.lugar` existen (P72).
2. `lib/resumenSesion.ts` ya contempla `idEjercicioOriginal` como campo de sustitución, y
   `deltaEjercicio` devuelve `{ tipo: "sustituido" }` cuando está.
3. `RegistroSerie` tiene el link "Saltar ejercicio" y `SaltarEjercicio.tsx` es la hoja de
   motivos (P68b).
4. `filtrarEjercicios` (`lib/filtros.ts`) busca sobre nombre y sinónimos.
5. `ZonaMolestia` existe (P70) con ocho zonas.
6. Los campos `alternativas`, `progresiones` y `regresiones` siguen vacíos en el catálogo:
   la sustitución se calcula, no se lee. Confirmalo contando en Firestore o en
   `catalogo-ejercicios.json`.

---

## Parte 1 — `lib/sustitucion.ts`

Módulo puro, sin Firebase (ADR #009). **Todos los pesos y umbrales van en constantes
nombradas al principio del archivo**, para poder ajustarlos sin tocar la lógica.

```
type MotivoSustitucion = "dolor" | "equipo-ocupado" | "no-me-sale" | "otro";

interface OpcionesSustitucion {
  catalogo:  Ejercicio[];
  original:  Ejercicio;
  equipo:    Equipo[];        // el del lugar donde estás, de equipoDe()
  historial: Historial[];     // el del miembro, para "ya lo hiciste"
  motivo?:   MotivoSustitucion;
  zona?:     ZonaMolestia;    // solo si motivo === "dolor"
  now:       number;
}

interface Candidato {
  ejercicio:   Ejercicio;
  puntaje:     number;
  razon:       string;        // una línea, para mostrar
  yaLoHiciste: boolean;
  ultimaCargaKg?: number;
  ultimaFecha?:   string;
}

sugerirSustitutos(opts: OpcionesSustitucion): { candidatos: Candidato[]; relajado: boolean }
```

**Filtros duros**, en este orden. Descartan sin importar el puntaje:

1. El ejercicio original.
2. Equipo: **todos** los equipos que pide el candidato tienen que estar en `equipo`.
   "Peso corporal" siempre cuenta como disponible.
3. Distinto `patron` que el original.
4. `nivel` por encima del nivel del original. **El perfil no guarda un nivel del miembro**,
   así que la referencia es el ejercicio que estabas por hacer, que es lo que ya venías
   haciendo.
5. Si el motivo es `dolor`: todo lo que cargue la zona marcada.

**Tabla zona → qué se descarta**, como constante exportada. Un candidato se descarta si su
`grupoMuscularPrimario` o alguno de sus `gruposSecundarios` está en la lista de la zona, o
si su `patron` está en la lista de patrones:

| Zona | Grupos | Patrones |
|---|---|---|
| hombro | Hombros, Pecho, Trapecios | Empuje vertical, Empuje horizontal |
| codo | Tríceps, Bíceps, Antebrazos | — |
| muñeca | Antebrazos | — |
| espalda | Lumbares, Espalda media, Dorsales | Dominante de cadera, Tracción horizontal |
| cadera | Glúteos, Aductores, Abductores | Dominante de cadera |
| rodilla | Cuádriceps, Isquios | Dominante de rodilla, Zancada / unilateral |
| tobillo | Pantorrillas | Locomoción / cardio, Zancada / unilateral |
| otra | — | — |

Con zona `otra` no se descarta nada: no hay información para hacerlo.

**Puntaje**, de más a menos peso:

| Criterio | Peso |
|---|---|
| Mismo `grupoMuscularPrimario` | 40 |
| Cada `grupoSecundario` compartido | 5, hasta 15 |
| Ya lo hiciste (aparece en el historial con series completadas) | 30 |
| Misma `mecanica` (compuesto o aislado) | 10 |
| Mismo `unilateral` | 5 |
| Mismo perfil libre o guiado: guiado es el que usa Máquina o Polea | 5 |
| Lo hiciste en las últimas 48 h | −20 |

**Desempate**, en orden: menos usado en el historial, y después orden alfabético, para que
el resultado sea estable y testeable.

**Si no queda ningún candidato**, repetí sin el filtro de nivel y devolvé `relajado: true`.
Si sigue vacío, devolvé la lista vacía: la UI cae en el buscador.

**`razon`** se arma con lo que aplique, separado por comas, y nunca más de tres partes:

- siempre: *"mismo patrón"*, y *"mismo grupo"* si comparte el primario;
- si hay equipo declarado distinto de peso corporal: *"tenés {equipo}"*;
- si ya lo hiciste: *"lo hiciste el {fecha corta} con {carga} kg"*, o *"ya lo hiciste"* si
  no hay carga registrada.

Ejemplo: *"mismo patrón, tenés mancuernas, lo hiciste el 3/9 con 22,5 kg"*.

Funciones auxiliares exportadas, porque los tests y la UI las necesitan:
`ultimaVezQueLoHiciste(idEjercicio, historial)` y `vecesQueLoHiciste(idEjercicio, historial)`.

---

## Parte 2 — Modelo y estado

**`types/models.ts`:**

- `MotivoSustitucion`, con los cuatro valores.
- En `BloqueRegistro`, todos opcionales y escritos solo si hubo sustitución:
  - `idEjercicioOriginal?: string`
  - `motivoSustitucion?: MotivoSustitucion`
  - `zonaMolestia?: ZonaMolestia`
  - `posicionSustituto?: number` — **la posición que ocupaba en el ranking**, empezando en
    1. Si vino del buscador y no estaba entre los candidatos, `0`.

Ese último dato es el que después dice si el algoritmo acierta: si siempre elegís el
tercero, el orden está mal.

**`EntrenarState`:**

- `sustituciones: Record<number, { idOriginal: string; idNuevo: string; nombreNuevo: string; motivo: MotivoSustitucion; zona?: ZonaMolestia; posicion: number }>`, por índice de bloque.
- `sustituirBloque(state, idx, datos)`: registra la sustitución, **borra las series
  registradas de ese bloque** —eran de otro ejercicio— y limpia su `serieInicioMs`.
- `deshacerSustitucion(state, idx)`: vuelve al original y también borra las series.
- `quitarBloques` reindexa `sustituciones`.
- `construirBloquesRegistro` escribe el bloque con el `idEjercicio` y el nombre **del
  sustituto**, más los cuatro campos de arriba.
- `estadoReiniciado` las limpia.

---

## Parte 3 — UI

**Entrada:** link **"Sustituir"** en el footer, al lado de "Saltar ejercicio", con el mismo
estilo. Solo si el bloque no está completo.

**Hoja `SustituirEjercicio.tsx`, en dos pasos:**

**Paso 1 — motivo**, obligatorio: *Me duele algo · Equipo ocupado · No me sale · Otro*.
Con "Me duele algo", aparecen debajo las ocho zonas, y hay que elegir una.

**Paso 2 — elección:**

- **El recomendado**, destacado: nombre y `razon`.
- **"Ver más opciones"**, que despliega hasta cuatro más, con su razón.
- **Buscador**, con `filtrarEjercicios`. Por defecto muestra solo lo que podés hacer con el
  equipo del lugar; un toggle **"Ver todo el catálogo"** saca ese filtro.
- Si `relajado` es verdadero, una línea: *"No hay opciones de tu nivel: te muestro las que
  hay."*
- Si no hay ningún candidato: *"Nada del catálogo encaja con ese patrón y ese equipo.
  Buscá a mano o saltealo."*

Al elegir, se llama a `sustituirBloque` con la posición en el ranking, y la hoja se cierra.

**En el bloque:**

- El nombre del sustituto, y debajo una línea: *"Sustituye a {original}"* con un link
  **"Deshacer"**.
- Si el sustituto no está en el catálogo cargado en memoria, traelo y sumalo al mapa. Sin
  conexión y sin caché, mostrá el error en la hoja y no sustituyas.

**En las dos rutas.** En la sesión libre también sirve: el catálogo es el mismo.

**Historial:** en `HistorialDetalle.tsx`, un bloque sustituido muestra
*"Sustituye a {nombre original} · {motivo}"*.

---

## Parte 4 — Renombrar `Firebase.json`

El archivo se llama `Firebase.json` con mayúscula. En Windows funciona, pero la CLI busca
`firebase.json` y en Linux o en CI no lo encuentra. En Windows git no distingue mayúsculas,
así que van dos pasos:

```
git mv Firebase.json firebase-temp.json
git mv firebase-temp.json firebase.json
```

Verificá después que `git status` muestre el renombre y que
`firebase deploy --only firestore:rules --dry-run` (o el comando equivalente que valide sin
desplegar) siga encontrando la configuración. Si alguna referencia del repo lo nombra con
mayúscula, corregila.

---

## Tests

**`sugerirSustitutos`**, con un catálogo armado a mano:

- descarta por equipo faltante, y "Peso corporal" siempre pasa;
- descarta por patrón distinto;
- descarta por nivel superior, y lo acepta al relajar, devolviendo `relajado: true`;
- con motivo `dolor` y zona `rodilla`, descarta por grupo y por patrón;
- con zona `otra`, no descarta nada;
- el orden del puntaje: mismo grupo primario le gana a solo secundarios compartidos;
- "ya lo hiciste" pesa más que la mecánica y que el perfil de carga;
- la penalización de frescura mueve al candidato hacia abajo, pero no lo elimina;
- desempate por menos usado, y después alfabético;
- sin ningún candidato posible, devuelve lista vacía sin romperse;
- `razon` incluye la fecha y la carga cuando hay historial, y no las inventa cuando no hay;
- el original nunca aparece entre los candidatos.

**Estado:**

- `sustituirBloque` borra las series de ese bloque y guarda la posición;
- `deshacerSustitucion` vuelve al original;
- `quitarBloques` reindexa las sustituciones;
- `construirBloquesRegistro` escribe los cuatro campos solo en el bloque sustituido, con el
  id del sustituto;
- `loadEntrenarState`: un estado previo sin `sustituciones` carga vacío.

**Integración con P70:** un bloque sustituido no se compara, y el resumen muestra
"Sustituido — sin comparación". Ya está implementado: verificá que sigue andando con el
campo real.

Corré la suite completa, `tsc -b` y `npm run test:rules`.

---

## Fuera de alcance

- Recortar la rutina (bloque 8, P79).
- Guardar las sustituciones como `alternativas` en el catálogo: primero hay que ver si el
  ranking acierta.
- Sustituir en el modo scroll.

Guardá este prompt como `docs/prompts/73-sustitucion-en-vivo.md`.

---

## Al terminar, reportá

1. El Paso 0, premisa por premisa.
2. El diff por archivo, resumido.
3. El resultado de tests, `tsc` y `test:rules`.
4. El renombre de la Parte 4, y si algo lo referenciaba con mayúscula.
5. **Una prueba a mano del ranking:** elegí tres ejercicios reales de tus rutinas, corré
   `sugerirSustitutos` con el equipo de casa y pegame los cinco primeros candidatos con su
   razón. Quiero ver si el orden tiene sentido antes de usarlo.
6. Cualquier punto donde hayas parado o te hayas apartado del prompt.
