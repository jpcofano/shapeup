# 79b — Medir también si el dato sirve

Repo: jpcofano/shapeup. Va **después del commit de P79**. Corrige lo que el reporte de P79
encontró en los datos reales.

## Qué problema resuelve

P79 decidió que **el sistema decide solo con lo que mide**. El reporte mostró que eso no
alcanza si no mide también **si el dato sirve**:

- **Creed** registró 8 rondas para una rutina de 5, con rondas de 1 a 2 segundos en el
  medio. Son dobles toques en "Serie hecha". La regla calculó un descanso real de 1 s y
  sugirió recortar el descanso: basura que entra, basura que sale.
- **Body Combat** tiene 29 minutos entre la ronda 1 y la 2. Es una pausa, no un descanso, y
  con 3 rondas hay solo 2 intervalos: la mediana de dos números es su promedio, así que la
  pausa se la come entera.

Dos capas: que el dato sucio no se genere, y que el que ya existe no se crea.

**Las decisiones están cerradas.** Si alguna es inviable, **pará y reportá**. No commitees.

---

## Parte 1 — En el origen: el doble toque

En el reducer de `entrenarState`, un `completarSerie` que llega **menos de
`DOBLE_TOQUE_MS = 3000`** después del anterior **se ignora**. Para todas las modalidades: una
serie de fuerza tampoco se hace en 3 segundos.

- Se ignora en silencio: no hay nada que mostrar, porque no pasó nada.
- Test: dos `completarSerie` a 1 s registran una serie; a 4 s, dos.

---

## Parte 2 — En el análisis: qué ronda y qué descanso valen

En `progresionVR.ts`, con constantes nombradas:

| Constante | Valor | Qué decide |
|---|---|---|
| `FRACCION_RONDA_MINIMA` | 0,25 | Una ronda que duró menos del 25 % de `trabajoSeg` **no es una ronda** |
| `FACTOR_PAUSA` | 3 | Un intervalo de más de 3 veces el descanso previsto **es una pausa**, no un descanso |
| `MIN_DESCANSOS_VALIDOS` | 2 | Con menos, el descanso no decide |

- **Rondas válidas**: las que pasan la duración mínima. Son las únicas que cuentan para
  "rondas hechas", para la FC de trabajo y para medir el descanso.
- **Descanso real**: la mediana de los intervalos **entre rondas válidas consecutivas**
  (`inicio de la válida siguiente − fin de la válida anterior`), **sin las pausas**.
- Con menos de `MIN_DESCANSOS_VALIDOS` intervalos válidos, el camino del descanso no decide:
  si la FC tampoco es confiable, es `palanca: null`, con el motivo *"no hay suficientes
  descansos medibles"*.
- Las rondas extra válidas por encima del objetivo no rompen nada: "completa" es tener al
  menos las del objetivo.

### Que se vea

Cuando la última sesión tuvo rondas inválidas o pausas, la línea de datos de la tarjeta lo
dice, **sin opinar sobre la decisión**:

```
5 de 5 rondas válidas (3 descartadas por durar 1–2 s) · descanso medido 58 s
3 de 3 rondas · una pausa de 29 min no se contó como descanso
```

---

## Parte 3 — Una nota vieja en `CLAUDE.md`

La nota que dice que `config/perfiles` real está vacío quedó vieja: el perfil de `juanpablo`
tiene `fcMaxTeorica` y `zonasFC` completas. Corregila.

---

## Tests

- Parte 1: los dos casos del doble toque.
- Parte 2, con los casos reales como fixture:
  - **Creed**: 8 registros, 3 de 1–2 s → 5 válidas de 5, completa; el descanso se mide entre
    válidas, **no da 1 s**;
  - **Body Combat**: 3 rondas con un intervalo de 29 min → la pausa se excluye, queda un solo
    descanso válido, y sin FC la palanca es `null` con el motivo;
  - una ronda al 24 % de `trabajoSeg` no cuenta; al 26 %, sí;
  - un intervalo a 2,9 veces el descanso cuenta; a 3,1, es pausa.
- Los 37 de `progresionVR.test.ts` siguen verdes.

`npx tsc -b`, la suite y `npm run build`.

---

## Al terminar, reportá

Podés releer `/historial` del miembro (son 8 documentos) y `/rutinas` de VR. **Nada de `/cardio`.**

1. El diff, resumido.
2. Tests, `tsc` y build.
3. **Qué sugeriría ahora la regla para las cuatro rutinas VR**, recalculado con los mismos
   datos que usaste en P79, al lado de lo que sugería antes.
4. Dónde paraste o te apartaste.

Guardá este prompt como `docs/prompts/79b-datos-sucios.md`.
