# Prompt 26 — D4 · Biblioteca + Catálogo

> Etapa de pulido D4. Pulís `src/routes/Biblioteca.tsx`, `src/routes/Catalogo.tsx`,
> `src/routes/RutinaDetalle.tsx` y los del `components/rutina/*` (presentación). Target:
> `ui_kits/shapeup/screens-biblioteca.jsx`. **El catálogo entra por tabs en Biblioteca, no suma
> ítem al nav de 6** (ADR #013). **No** toques `data/`/`lib`. Tokens siempre. Voseo.
>
> **(1) Biblioteca con tabs:** cabecera "Biblioteca" + tabs **"Rutinas | Ejercicios"** (tab
> activo persistido en `?tab=ejercicios`, como ya está). Estilo de tab: borde inferior en
> acento + texto acento cuando activo.
>
> **(2) Tarjetas de rutina (`rutina-card`):** título + meta con badges (foco en `badge-accent`,
> nivel/duración en `badge-muted`) + nº de ejercicios. Hover: borde → acento.
>
> **(3) Catálogo (tab Ejercicios):** buscador con ícono `search`, filtros horizontales en chips
> (`filter-chip`, activo en acento) por Área/Tipo/Equipo/Nivel, contador de resultados, y
> tarjeta de ejercicio **expandible** con Ejecución (ol), **Puntos clave** (verde), **Errores
> comunes** (ámbar) y Seguridad (rojo). **FAB** (`plus`, glow del acento) solo para el owner.
>
> **(4) Detalle de rutina:** back-btn, título, badges, lista de **bloques** numerados
> (`bloque-num` en acento) con prescripción y descanso, y botón **"Empezar sesión"**.
>
> **Verificación:** igual al UI kit; filtros y tabs andan; re-skinea con el tema. Actualizá
> `docs/MAPEO-IMPLEMENTACION.md` (Bitácora D4). `tsc -b` limpio, tests verdes, commit + push.
> **Pará y esperá mi revisión.**
