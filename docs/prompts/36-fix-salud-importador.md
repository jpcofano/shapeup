# Prompt 36 — FIX-SALUD · Importador de salud no importa bien

> **Fix dirigido** (funcional). El owner reporta: "el importador de salud no está importando
> bien". Esta etapa es **diagnosticar la causa raíz y arreglarla** — NO reescribir el importador
> zip-first (E6.3) ni el match biométrico (E6.2), que funcionan. **No** toques presentación salvo
> el feedback de errores. Castellano voseo.
>
> **(0) Reproducir y registrar el síntoma — ANTES de tocar código.**
> Con un export real de Samsung Health (CSV suelto y/o ZIP), anotá exactamente qué pasa:
> - ¿No importa nada / importa parcial / importa pero los datos quedan mal (fechas, unidades,
>   zona, duplicados) / falla la validación del ZIP?
> - El mensaje mostrado y el resultado `{ importados, omitidos }`.
> - Qué categoría falla (peso / cardio / sueño / métricas / biometría).
> Dejá esto escrito en la Bitácora: sin reproducir, no arreglés a ciegas.
>
> **(1) Verificá estas sospechas (sin asumir cuál es):**
> - **Formato cambió:** Samsung Health actualiza headers/columnas del CSV → los parsers
>   (`parsearPeso`/`parsearEjercicio`/`parsearSueno`/`parsearMetricas` en `src/import/samsungHealth.ts`)
>   buscan columnas por nombre que ya no existen. Logueá las claves reales del CSV vs las esperadas.
> - **Coma decimal:** valores tipo `84,2` (locale es-AR) → `Number("84,2")` = `NaN` → fila omitida
>   por `stripUndef`/validación. Si es esto, normalizá `,`→`.` antes de parsear números.
> - **Fechas / zona horaria:** parseo de fecha → `idMetrica`/`idMedicion` mal formado → choque de
>   IDs (se pisan) o descarte. Verificá el formato de fecha real del export.
> - **Encoding:** BOM/UTF-16 al inicio del archivo → la primera columna del header no matchea.
> - **Validación del ZIP** demasiado estricta (`samsungZip.ts`): markers de Samsung que cambiaron
>   → ZIP válido rechazado.
> - **Reglas Firestore:** el write se rechaza por permisos → todo "omitido" con error genérico.
>   Probá un import como no-owner.
>
> **(2) Arreglá la causa raíz** (no el síntoma). Aplicá el fix mínimo en el parser/persistencia
> que corresponda. Si el formato de Samsung Health cambió, soportá ambos (viejo + nuevo) si es
> razonable, o el nuevo si el viejo ya no aplica.
>
> **(3) Test de regresión con fixture real:** agregá a `src/import/samsungHealth.test.ts` (o
> `samsungZip.test.ts`) un caso con el contenido exacto que reproducía el fallo (anonimizado),
> verificando que ahora importa bien y con los valores correctos.
>
> **(4) Mejorá el feedback** si el diagnóstico lo amerita: que el preview/resultado diga **por qué**
> se omitió una fila (columna faltante, fecha inválida, número no parseable), no solo el conteo.
> Mantené el "X importados · Y omitidos" de P25.
>
> **(5) Documentá:** si el formato cambió, actualizá `docs/SAMSUNG-HEALTH-MAPEO.md` con el formato
> nuevo y la fecha.
>
> **Verificación:** un import de prueba que antes fallaba ahora importa con el conteo correcto y
> los datos bien (fechas, unidades, zona). Test de regresión verde. `tsc -b` limpio, tests verdes.
> Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora FIX-SALUD: síntoma reproducido → causa raíz →
> archivos tocados → test → verificación). Commit + push. **Pará y esperá mi revisión.**
