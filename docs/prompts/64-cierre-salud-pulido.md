# Prompt 64 — Cierre de salud: Resumen pulido, conclusiones por rango, estado honesto

> **Código + tests.** Origen: validación final del owner (2026-07-16, capturas).
> Todo funciona; el pedido es de calidad: (1) el Resumen "se ve pobre",
> (2) la conclusión de tendencias ignora el rango elegido, (4) las sesiones sin
> match muestran silencio en vez de un estado honesto, y las "propuestas
> inteligentes" son invisibles cuando todo está en verde. Este prompt CIERRA
> las series S/I; después arranca la serie H. Castellano voseo, tokens siempre.

## (1) Resumen: de funcional a cuidado

Rediseño de las cards de `ResumenTab` (sin librerías nuevas, tokens existentes):
- **Jerarquía**: nombre chico arriba, valor grande con unidad pegada, delta con
  flecha a la derecha del valor (no flotando), sparkline como fondo sutil de la
  mitad inferior (como hoy pero consistente en TODAS las cards — peso hoy sale
  pelada y SpO2 muestra un "—" suelto: si no hay tendencia calculable, no
  mostrar el hueco, mostrar solo el valor).
- **Densidad**: las informativas (Peso · Presión · SpO2) en cards compactas de
  media altura o grilla de 2 columnas — hoy 5 cards iguales apiladas hacen
  scroll eterno para info secundaria. Las accionables (FC reposo, Sueño, HRV
  si algún día hay) mantienen tamaño completo.
- **Contexto del dato**: en Presión y SpO2, la fecha de la última medición en
  texto secundario («medida el 06/07») — el owner se las toma por rachas y un
  valor sin fecha engaña.
- **Motivo visible**: cuando el estado no es ok, la línea de motivo dentro de
  la card (ya existe el texto en la señal; hoy no se ve).
- **Tap**: toda card navega a su tab de detalle (ya especificado en P49 —
  verificá que funcione en todas las nuevas).
- Criterio de aceptación: el Resumen entra en una pantalla de teléfono sin
  scroll (o con scroll mínimo) y se entiende en una mirada de 3 segundos.

## (2) Tendencias: conclusión que respeta el rango

La línea bajo el chart hoy dice siempre «hace un año». Que se adapte al rango
activo, con datos suficientes (≥5 en cada ventana, regla existente):
- 3M → «Ahora: X · hace 3 meses: Y · Δ%»
- 1A → como hoy.
- 5A → «Ahora: X · hace 5 años: Y · Δ%» (si no hay dato de hace 5 años, usar
  el más viejo del rango: «vs 2021: Y»).
- Todo → «Ahora: X · primera medición (2015): Y · Δ%» + min/máx del período
  («mín 58 · máx 89») porque en rangos largos los extremos cuentan historia.
- Extendé `serieTendencia` (puro) con la comparación parametrizada por rango;
  tests para cada rango y para el fallback al dato más viejo.

## (3) Propuestas inteligentes visibles (aunque callen)

Hoy, con todo en verde, el motor es invisible y parece que no existe. Sin
romper la regla de "una tarjeta máximo, silencio sin nada que decir":
- **Línea de estado diario en Home** (no card, una línea): punto de color por
  `senalPeor` + texto corto — «Señales de salud en verde» / «1 señal en
  atención: sueño». Tap → /salud Resumen. Se muestra solo si hay al menos una
  señal calculable; nunca compite con la tarjeta de recomendación (si hay
  tarjeta, la línea no aparece — la tarjeta ya lo dice).
- La tarjeta de recomendación queda EXACTAMENTE como está (reglas, descarte,
  severidades). Esto solo hace perceptible que el motor mira todos los días.
- Test puro del selector línea-vs-tarjeta-vs-nada.

## (4) Estado honesto en sesiones sin match

En `HistorialDetalle`, donde iría la card de biometría, si la sesión NO tiene:
línea discreta «Sin datos del reloj para esta sesión» — con sub-texto según el
caso si es barato de derivar (sin candidatas ese día vs sin coincidencia
horaria); si no es barato, la línea genérica alcanza. Nada de card vacía ni
silencio. El "Contexto del día" sigue mostrándose igual (eso ya funciona).

## (5) Verificación

- `tsc -b` limpio · vitest verde · commit + push.
- QA visual con mocks (patrón conocido) para el Resumen nuevo en 360px de
  ancho; validación real del owner después del deploy.
- `CLAUDE.md`: marcá series S e I como CERRADAS con fecha; siguiente: serie H
  (plan en la sección correspondiente, arranca por H1).
- Commit: `feat(salud): cierre series S/I — resumen pulido, conclusiones por rango, estados honestos (P64)`.
