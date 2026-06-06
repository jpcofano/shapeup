# Prompt 28 — D6 · Salud

> Etapa de pulido D6. Pulís `src/routes/Salud.tsx` (composición / cardio / sueño / progreso) y
> su flujo de import. Target: `ui_kits/shapeup/screens-salud.jsx` (Salud). **El preview antes de
> importar es una decisión de UX deliberada — mantenelo.** **No** toques `data/salud`,
> `import/samsungHealth` ni la lógica de parseo. Tokens siempre. Voseo.
>
> **(1) Tabs:** "Composición | Cardio | Sueño | Progreso" (borde inferior en acento cuando
> activo). Header con acciones `upload` (importar CSV) y `plus` (carga manual).
>
> **(2) Composición:** card "Último — fecha" con fila de **stats** (peso/grasa/músculo/IMC,
> tabular) + card "Tendencia de peso" con `MiniChart` en acento.
>
> **(3) Cardio — aplicá las ZONAS DE FC:** cada sesión muestra actividad, fecha, duración/kcal/FC
> y un **chip de zona** (`Z1..Z5`) con su color de token (`--zona-z*` / `--zona-z*-dim`). Este es
> el lugar donde la escala de zonas se hace visible.
>
> **(4) Sueño:** promedio semanal + última noche (stats) e historial. **Progreso:** tonelaje
> (`MiniChart` en `--info`) y tendencia de composición vs anterior (verde si mejora, rojo si
> empeora).
>
> **(5) Import con preview:** modo "Básico" vs "Completo (+ métricas genéricas)"; al elegir
> archivo, **bottom-sheet de previsualización** (tabla de las primeras filas + nº de registros +
> advertencias) y recién ahí "Importar N registros". Pulí la tabla y el sheet con tokens;
> conservá el flujo y el modo completo.
>
> **Verificación:** igual al UI kit; los chips de zona usan los tokens correctos; el preview se
> mantiene. Actualizá `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D6). `tsc -b` limpio, tests
> verdes, commit + push. **Pará y esperá mi revisión.**
